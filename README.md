# Kurio — Marketplace de NFTs

Marketplace de NFTs em React e TypeScript: descoberta (catálogo, busca, filtros), detalhe, carrinho, pagamento com carteira, confirmação de pedido, conta do colecionador (login, cadastro, perfil, carteiras) e favoritos. A API REST e o servidor Socket.IO são simulados no navegador com MSW, inclusive no build publicado.

- **Demonstração:** https://kurio-nft-hazel.vercel.app (build de demo com a API e o tempo real simulados no navegador)
- **Arquitetura, contratos e decisões:** [ARCHITECTURE.md](ARCHITECTURE.md)

## Stack

React 19 · TypeScript (strict) · Vite 8 · TanStack Router · TanStack Query · Axios · Socket.IO (`socket.io-client`) · Tailwind CSS 4 · shadcn/ui (Radix) · MSW 3 (+ `@mswjs/socket.io-binding`) · zod · decimal.js · react-hook-form · Playwright · Lighthouse.

## Como rodar

Requisitos: Node 24 e npm.

```bash
npm ci
npx playwright install chromium   # navegador dos testes e da auditoria
npm run dev:mocks                 # http://localhost:5173 com a API simulada
```

Sem backend real disponível, use sempre um modo com mocks (`dev:mocks`, `build:demo`). O `npm run dev` puro espera uma API em `VITE_API_URL`.

### Variáveis de ambiente

| Variável             | Padrão                                           | Uso                                      |
| -------------------- | ------------------------------------------------ | ---------------------------------------- |
| `VITE_ENABLE_MOCKS`  | `false` (`.env.example`), `true` em `.env.mocks` | Liga o MSW (REST + Socket.IO simulados). |
| `VITE_MOCK_SCENARIO` | `default`                                        | Cenário inicial dos mocks (ver abaixo).  |
| `VITE_API_URL`       | `/api`                                           | Base da API REST.                        |
| `VITE_SOCKET_URL`    | origem da página                                 | Servidor Socket.IO.                      |

O modo `mocks` do Vite carrega `.env.mocks`; copie `.env.example` para `.env.local` para ajustar o modo normal.

### Comandos

| Comando                              | O que faz                                                                                 |
| ------------------------------------ | ----------------------------------------------------------------------------------------- |
| `npm run dev:mocks`                  | Desenvolvimento com mocks.                                                                |
| `npm run dev`                        | Desenvolvimento contra `VITE_API_URL`.                                                    |
| `npm run build`                      | Build de produção (sem mocks).                                                            |
| `npm run build:demo`                 | Build otimizado com mocks (o que é publicado).                                            |
| `npm run preview`                    | Serve o último build.                                                                     |
| `npm run typecheck` / `npm run lint` | Tipos (`tsc -b`) e ESLint.                                                                |
| `npm run test:e2e`                   | Toda a suíte Playwright (desktop 1440 e mobile 390), sobre o build de demo.               |
| `npm run test:visual`                | Só a regressão visual.                                                                    |
| `npm run test:visual:update`         | Regrava as imagens de referência que mudaram (`-- --update-snapshots=all` regrava todas). |
| `npm run test:e2e:report`            | Abre o relatório HTML (com traces das falhas).                                            |
| `npm run audit:lighthouse`           | Auditoria Lighthouse (ver [Lighthouse](#lighthouse)).                                     |

## Contas e dados de demonstração

| Conta                           | E-mail            | Senha       |
| ------------------------------- | ----------------- | ----------- |
| Ana Colecionadora (2 carteiras) | `ana@kurio.dev`   | `Kurio@123` |
| Bruno Criador (1 carteira)      | `bruno@kurio.dev` | `Kurio@123` |

Senhas existem nos mocks só como hash SHA-256 com salt. Cupons: `KURIO10` (10%) e `EXPIRADO` (expirado); qualquer outro é inválido.

## Cenários e reset dos mocks

Os mocks guardam carrinhos, contas, sessões, favoritos, carteiras e pedidos no `localStorage` (sobrevivem ao refresh). O catálogo volta aos fixtures a cada carga, descontado o que pedidos confirmados venderam.

| Cenário            | Efeito                                                                       |
| ------------------ | ---------------------------------------------------------------------------- |
| `default`          | Sucesso, com latência variável e determinística (180–400 ms).                |
| `slow`             | Latência de 2,5 s (skeletons).                                               |
| `empty`            | Catálogo vazio.                                                              |
| `error`            | Falhas transitórias (503) na API.                                            |
| `wallet-rejected`  | A carteira recusa a conexão no pagamento.                                    |
| `price-changed`    | Um preço sobe 0,05 ETH enquanto o pedido é enviado (uma vez por carga).      |
| `order-timeout`    | O pedido é criado, mas a resposta chega depois do timeout de 4 s do cliente. |
| `payment-rejected` | O pagamento é recusado.                                                      |
| `offline`          | A API não responde (erro de rede).                                           |
| `timeout`          | Toda resposta chega depois do timeout de 10 s do cliente.                    |
| `out-of-order`     | A aba "Em alta" responde 1,5 s depois das outras (respostas fora de ordem).  |

Como escolher:

- na URL: `?mockScenario=error` (fica gravado para as próximas cargas);
- no console: `kurioMocks.setScenario('slow')`;
- no build: `VITE_MOCK_SCENARIO`.

Reset completo: `kurioMocks.reset()` no console e recarregue a página. A lista está em `kurioMocks.scenarios`.

## Reproduzir os fluxos de falha

Todos os controles ficam no objeto `kurioMocks` do console (só existe com mocks ligados) e agem do lado do servidor simulado.

| Fluxo                                      | Como                                                                                                                                                                                              |
| ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Lentidão, vazio, erro e nova tentativa     | Cenários `slow`, `empty`, `error`; volte para `default` e use "Tentar novamente".                                                                                                                 |
| Sem conexão e tempo esgotado               | Cenários `offline` (o catálogo explica "Sem conexão com o servidor.") e `timeout` (por exemplo, aplicar um cupom mostra "O servidor demorou a responder."); volte para `default` e tente de novo. |
| Respostas fora de ordem                    | Cenário `out-of-order`: clique em "Em alta" e logo em "Novos lançamentos"; a resposta atrasada não substitui a grade atual.                                                                       |
| Sessão expirada (navegando ou no checkout) | Entre, depois `kurioMocks.expireSessions()` e faça qualquer ação ou recarregue uma rota privada.                                                                                                  |
| Conflito de cadastro                       | Cadastre `ana@kurio.dev`.                                                                                                                                                                         |
| Cupom inválido ou expirado                 | `QUALQUER` ou `EXPIRADO` no carrinho.                                                                                                                                                             |
| Carteira recusada                          | Cenário `wallet-rejected` e "Confirmar compra".                                                                                                                                                   |
| Preço alterado durante a compra            | Cenário `price-changed` e confirme a revisão; ou, com a revisão aberta, `kurioMocks.realtime.updateNft('emerald-ape-042', { price: '1.40' })`.                                                    |
| Edição esgotada durante a compra           | `kurioMocks.realtime.updateNft('emerald-ape-042', { editionId: 'emerald-ape-042-1-10', available: 0 })`.                                                                                          |
| Timeout com recuperação do mesmo pedido    | Cenário `order-timeout`, confirme e use "Tentar novamente", ou recarregue e use "Retomar compra".                                                                                                 |
| Pagamento recusado                         | Cenário `payment-rejected`.                                                                                                                                                                       |
| Clique repetido                            | Duplo clique em "Confirmar pagamento" (gera um só pedido).                                                                                                                                        |
| Eventos duplicados ou antigos              | `kurioMocks.realtime.replayLast()` e `kurioMocks.realtime.emitStale('emerald-ape-042', '0.10')`.                                                                                                  |
| Queda da conexão em tempo real             | `kurioMocks.realtime.disconnect(5000)` (derruba e recusa conexões por 5 s); com um pedido pendente, ele é reconciliado ao reconectar.                                                             |

## Testes

`npm run test:e2e` gera o build de demo, sobe um preview na porta 4317 e roda os specs de `e2e/` no Chromium, nos projetos `desktop` (1440×900) e `mobile` (390×844). Cada teste começa com navegador e estado limpos. Eventos de tempo real são emitidos pelos controles do servidor simulado e chegam pelo `socket.io-client`.

Cobertura:

- catálogo;
- detalhe;
- sessão;
- favoritos;
- carrinho;
- compra completa, falhas de pagamento e idempotência (mesma chave com outro conteúdo gera conflito);
- tempo real;
- perfil e carteiras;
- rede: sem conexão, tempo esgotado e respostas fora de ordem;
- teclado e foco: atalho para o conteúdo, navegação, validação pelo Enter, foco preso e devolvido em diálogos e na gaveta de filtros;
- regressão visual.

Relatório HTML e traces das falhas: `npm run test:e2e:report`. Testes que falham são repetidos uma vez e, se passarem, aparecem como _flaky_ no relatório (ver limitações em [ARCHITECTURE.md](ARCHITECTURE.md#limitações-conhecidas)).

**Regressão visual:** as imagens de referência ficam em `e2e/visual.spec.ts-snapshots/`, uma por tela, projeto e sistema operacional, porque a renderização de fontes muda entre sistemas. As versionadas são de Windows (`*-win32.png`). Em outro sistema, a primeira execução grava o conjunto local em vez de falhar (`updateSnapshots: 'missing'`). Para CI em Linux, gere e versione o conjunto `*-linux.png`.

## Lighthouse

`npm run audit:lighthouse`:

- gera o build de demo e serve `dist` com compressão brotli/gzip e fallback de SPA, como no deploy;
- mede Início e Detalhe, nos perfis mobile e desktop do Lighthouse, 3 vezes cada;
- usa a configuração versionada em `lighthouse/audit.config.json`.

Os relatórios HTML/JSON da execução mediana ficam em `lighthouse/reports/`. O resumo, com versões e ambiente, fica em `lighthouse/summary.json`.

Medianas (Lighthouse 13.5.0, Chromium 156, Windows 11, Node 24):

| Página  | Perfil  | Performance | Accessibility | Best Practices | SEO |    LCP |   CLS |   TBT |
| ------- | ------- | ----------: | ------------: | -------------: | --: | -----: | ----: | ----: |
| Início  | mobile  |          77 |           100 |            100 | 100 | 4,45 s | 0,003 | 34 ms |
| Início  | desktop |          98 |           100 |            100 | 100 | 1,03 s | 0,004 |  0 ms |
| Detalhe | mobile  |          75 |           100 |            100 | 100 | 4,64 s | 0,000 | 72 ms |
| Detalhe | desktop |          98 |           100 |            100 | 100 | 1,07 s | 0,000 |  0 ms |

A performance mobile fica abaixo da meta de 90. A análise das causas está em [ARCHITECTURE.md](ARCHITECTURE.md#performance-e-lighthouse).

## Deploy

O projeto publica o build de demo (`npm run build:demo`), com MSW e o Socket.IO simulado funcionando no navegador. `vercel.json` define:

- o comando de build;
- o fallback de SPA (acesso direto e refresh de qualquer rota);
- cache longo para os assets com hash.

O `mockServiceWorker.js` vai sempre sem cache.

```bash
npx vercel --prod
```

## Estrutura

```
src/
  features/<feature>/{api,components,hooks,pages,types}   catálogo, nft, carrinho, checkout, pedidos,
                                                           auth, favoritos, perfil, carteiras, tempo real
  shared/      layout, componentes e UI (shadcn) compartilhados
  lib/         Axios, sessão, ETH (decimal.js), utilitários
  mocks/       MSW: handlers REST, servidor Socket.IO, banco simulado, fixtures, cenários
  routes/      rotas por arquivo (TanStack Router)
e2e/           specs Playwright, helpers e imagens de referência
lighthouse/    configuração, relatórios e resumo da auditoria
scripts/       script da auditoria Lighthouse
```
