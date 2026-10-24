import { UnavailableAction } from '@/shared/components/unavailable-action'

const ARTICLE_IMAGE = '/nfts/default.jpg'

const articles = [
  {
    date: '12 de setembro',
    readingTime: 6,
    title: 'Como funciona a propriedade de NFTs',
    summary: 'Aprenda a colecionar, negociar e verificar ativos digitais.',
  },
  {
    date: '13 de setembro',
    readingTime: 2,
    title: '10 artistas digitais para acompanhar',
    summary: 'Conheça criadores que moldam a cultura digital.',
  },
  {
    date: '15 de setembro',
    readingTime: 3,
    title: 'Raridade, atributos e procedência',
    summary: 'Entenda raridade, procedência, direitos autorais e utilidade.',
  },
  {
    date: '15 de setembro',
    readingTime: 2,
    title: 'Como proteger sua carteira',
    summary: 'Proteja sua carteira, seus ativos e sua identidade.',
  },
]

export function MintJournal() {
  return (
    <section aria-labelledby="journal-title" className="mt-28">
      <h2 id="journal-title" className="text-center text-[1.75rem] font-bold text-fg">
        Diário da Cunhagem
      </h2>
      <p className="mt-3 text-center text-sm text-fg-muted">
        Histórias, guias e insights para colecionadores sobre o universo da propriedade digital.
      </p>
      <ul className="mt-12 grid grid-cols-2 gap-6 lg:grid-cols-4">
        {articles.map((article) => (
          <li key={article.title}>
            <article className="flex h-full flex-col overflow-hidden rounded-lg bg-surface">
              <img
                src={ARTICLE_IMAGE}
                alt=""
                width={282}
                height={195}
                loading="lazy"
                className="aspect-[282/195] w-full object-cover"
              />
              <div className="flex flex-1 flex-col px-4 pt-4 pb-4">
                <p className="text-xs leading-5 text-fg-muted">
                  {article.date} <span aria-hidden="true">|</span>
                  <span className="sr-only">,</span> Leitura de {article.readingTime} min
                </p>
                <h3 className="mt-3 text-base leading-snug font-bold text-fg">{article.title}</h3>
                <p className="mt-2 text-xs leading-5 text-fg-muted">{article.summary}</p>
                <UnavailableAction
                  variant="link"
                  aria-label={`Ler mais: ${article.title}`}
                  className="mt-3 w-fit text-xs font-bold text-primary hover:underline"
                >
                  Ler mais →
                </UnavailableAction>
              </div>
            </article>
          </li>
        ))}
      </ul>
    </section>
  )
}
