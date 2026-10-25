/**
 * Lighthouse audit: serves the demo build, runs every page × form factor N times and keeps the
 * median run of each pair (HTML + JSON) plus a summary with the environment and tool versions.
 *
 * Usage: npm run audit:lighthouse (builds the demo first).
 */
import { createServer } from 'node:http'
import { mkdir, readFile, rm, stat, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { brotliCompressSync, gzipSync } from 'node:zlib'
import { chromium } from '@playwright/test'
import lighthouse from 'lighthouse'
import desktopConfig from 'lighthouse/core/config/desktop-config.js'

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)))
const config = JSON.parse(await readFile(path.join(root, 'lighthouse/audit.config.json'), 'utf8'))
const reportsDir = path.join(root, 'lighthouse/reports')
const runsDir = path.join(reportsDir, 'runs')
const baseUrl = `http://localhost:${config.port}`

const metricIds = {
  LCP: 'largest-contentful-paint',
  CLS: 'cumulative-layout-shift',
  TBT: 'total-blocking-time',
}

function median(values) {
  const sorted = [...values].sort((a, b) => a - b)
  return sorted[Math.floor(sorted.length / 2)]
}

const types = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.jpg': 'image/jpeg',
  '.png': 'image/png',
  '.woff2': 'font/woff2',
  '.txt': 'text/plain; charset=utf-8',
}
const compressible = new Set(['.html', '.js', '.css', '.json', '.svg', '.txt'])

/**
 * Static server for `dist` that behaves like the hosting of the deploy: brotli/gzip for text,
 * long cache for hashed assets and the SPA fallback to `index.html`.
 */
function startServer() {
  const distDir = path.join(root, 'dist')
  const server = createServer(async (request, response) => {
    const url = new URL(request.url ?? '/', baseUrl)
    let file = path.join(distDir, decodeURIComponent(url.pathname))
    if (!file.startsWith(distDir)) {
      response.writeHead(403).end()
      return
    }
    try {
      if (!(await stat(file)).isFile()) throw new Error('not a file')
    } catch {
      file = path.join(distDir, 'index.html')
    }
    const extension = path.extname(file)
    let body = await readFile(file)
    const headers = {
      'Content-Type': types[extension] ?? 'application/octet-stream',
      'Cache-Control': url.pathname.startsWith('/assets/')
        ? 'public, max-age=31536000, immutable'
        : 'no-cache',
    }
    const accepted = String(request.headers['accept-encoding'] ?? '')
    if (compressible.has(extension)) {
      if (accepted.includes('br')) {
        body = brotliCompressSync(body)
        headers['Content-Encoding'] = 'br'
      } else if (accepted.includes('gzip')) {
        body = gzipSync(body)
        headers['Content-Encoding'] = 'gzip'
      }
    }
    response.writeHead(200, headers).end(body)
  })
  return new Promise((resolve) => server.listen(config.port, () => resolve(server)))
}

const DEBUG_PORT = 9333

/** Chromium from Playwright, opened with a debugging port Lighthouse connects to. */
async function audit(url, formFactor) {
  const browser = await chromium.launch({
    args: [`--remote-debugging-port=${DEBUG_PORT}`, '--no-first-run', '--disable-extensions'],
  })
  try {
    const result = await lighthouse(
      url,
      { port: DEBUG_PORT, output: ['html', 'json'], onlyCategories: config.categories },
      formFactor === 'desktop' ? desktopConfig : undefined,
    )
    if (!result) throw new Error(`No Lighthouse result for ${url}`)
    return result
  } finally {
    await browser.close()
  }
}

await rm(reportsDir, { recursive: true, force: true })
await mkdir(runsDir, { recursive: true })

const server = await startServer()
const summary = []
let lighthouseVersion = ''
let chromeVersion = ''

try {
  for (const page of config.pages) {
    for (const formFactor of config.formFactors) {
      const runs = []
      for (let run = 1; run <= config.runs; run++) {
        process.stdout.write(`${page.name} · ${formFactor} · run ${run}/${config.runs}\n`)
        const result = await audit(`${baseUrl}${page.path}`, formFactor)
        const { lhr, report } = result
        lighthouseVersion = lhr.lighthouseVersion
        chromeVersion = lhr.environment.hostUserAgent
        const base = `${page.name}-${formFactor}-${run}`
        await writeFile(path.join(runsDir, `${base}.html`), report[0])
        await writeFile(path.join(runsDir, `${base}.json`), report[1])
        runs.push({
          base,
          report,
          scores: Object.fromEntries(
            config.categories.map((id) => [id, Math.round((lhr.categories[id]?.score ?? 0) * 100)]),
          ),
          metrics: Object.fromEntries(
            Object.entries(metricIds).map(([name, id]) => [
              name,
              lhr.audits[id]?.numericValue ?? 0,
            ]),
          ),
        })
      }

      const scores = Object.fromEntries(
        config.categories.map((id) => [id, median(runs.map((run) => run.scores[id]))]),
      )
      const metrics = Object.fromEntries(
        Object.keys(metricIds).map((name) => [name, median(runs.map((run) => run.metrics[name]))]),
      )
      // The run whose performance score is the median is kept as the representative report.
      const medianRun = runs.find((run) => run.scores.performance === scores.performance) ?? runs[0]
      await writeFile(path.join(reportsDir, `${page.name}-${formFactor}.html`), medianRun.report[0])
      await writeFile(path.join(reportsDir, `${page.name}-${formFactor}.json`), medianRun.report[1])
      summary.push({
        page: page.name,
        path: page.path,
        formFactor,
        scores,
        metrics,
        runs: runs.map((run) => ({ scores: run.scores, metrics: run.metrics })),
      })
    }
  }
} finally {
  server.close()
}

const environment = {
  date: new Date().toISOString(),
  lighthouse: lighthouseVersion,
  browser: chromeVersion,
  node: process.version,
  os: `${os.type()} ${os.release()} (${os.arch()})`,
  cpu: os.cpus()[0]?.model ?? 'unknown',
  memory: `${Math.round(os.totalmem() / 1024 ** 3)} GB`,
  build: 'npm run build:demo (vite build --mode mocks: minified, MSW on, scenario "default")',
  server: `scripts/lighthouse.mjs static server on ${baseUrl} (brotli/gzip, SPA fallback, immutable assets)`,
  throttling:
    'Lighthouse defaults: mobile = simulated Moto G Power, slow 4G; desktop = desktop preset (no CPU slowdown, fast network)',
  runsPerCase: config.runs,
}

await writeFile(
  path.join(root, 'lighthouse/summary.json'),
  `${JSON.stringify({ environment, targets: config.targets, results: summary }, null, 2)}\n`,
)

const format = {
  LCP: (value) => `${(value / 1000).toFixed(2)} s`,
  CLS: (value) => value.toFixed(3),
  TBT: (value) => `${Math.round(value)} ms`,
}
const lines = [
  '| Página | Perfil | Performance | Accessibility | Best Practices | SEO | LCP | CLS | TBT |',
  '|---|---|---:|---:|---:|---:|---:|---:|---:|',
  ...summary.map(
    ({ page, formFactor, scores, metrics }) =>
      `| ${page} | ${formFactor} | ${scores.performance} | ${scores.accessibility} | ${scores['best-practices']} | ${scores.seo} | ${format.LCP(metrics.LCP)} | ${format.CLS(metrics.CLS)} | ${format.TBT(metrics.TBT)} |`,
  ),
]
process.stdout.write(`\n${lines.join('\n')}\n`)
