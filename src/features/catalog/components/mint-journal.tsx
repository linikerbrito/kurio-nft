import { UnavailableAction } from '@/shared/components/unavailable-action'

const articles = [
  {
    image: '/nfts/ape-onyx.jpg',
    date: '12 de setembro',
    readingTime: 6,
    title: 'Como funciona a propriedade de NFTs',
    summary: 'Aprenda a colecionar, negociar e verificar ativos digitais.',
  },
  {
    image: '/nfts/ape-emerald.jpg',
    date: '13 de setembro',
    readingTime: 2,
    title: '10 artistas digitais para acompanhar',
    summary: 'Conheça criadores que moldam a cultura digital.',
  },
  {
    image: '/nfts/ape-sage.jpg',
    date: '15 de setembro',
    readingTime: 3,
    title: 'Raridade, atributos e procedência',
    summary: 'Entenda raridade, procedência, direitos autorais e utilidade.',
  },
  {
    image: '/nfts/ape-golden.jpg',
    date: '15 de setembro',
    readingTime: 2,
    title: 'Como proteger sua carteira',
    summary: 'Proteja sua carteira, seus ativos e sua identidade.',
  },
]

export function MintJournal() {
  return (
    <section aria-labelledby="journal-title" className="mt-24">
      <h2 id="journal-title" className="text-center text-[1.75rem] leading-[1.3] font-bold text-fg">
        Diário da Cunhagem
      </h2>
      <p className="mt-3 text-center text-sm leading-[1.3] text-fg-muted">
        Histórias, guias e insights para colecionadores sobre o universo da propriedade digital.
      </p>
      <ul className="mt-10 grid grid-cols-2 gap-6 lg:grid-cols-[repeat(4,16.75rem)]">
        {articles.map((article) => (
          <li key={article.title}>
            <article className="flex h-full flex-col overflow-hidden rounded-[8px] bg-surface">
              <img
                src={article.image}
                alt=""
                width={268}
                height={195}
                loading="lazy"
                className="h-[12.1875rem] w-full object-cover"
              />
              <div className="flex flex-1 flex-col gap-2 px-4 pt-3 pb-4">
                <p className="text-xs leading-4 font-medium whitespace-pre-wrap text-fg-muted">
                  {article.date}
                  <span aria-hidden="true">{'  |  '}</span>
                  <span className="sr-only">, </span>
                  Leitura de {article.readingTime} min
                </p>
                <h3 className="text-base leading-[1.3125rem] font-bold text-fg">{article.title}</h3>
                <p className="text-xs leading-4 font-medium text-fg-muted">{article.summary}</p>
                <UnavailableAction
                  variant="link"
                  aria-label={`Ler mais: ${article.title}`}
                  className="flex w-fit gap-1 text-xs leading-[0.875rem] text-fg-accent hover:underline"
                >
                  <span className="leading-[0.875rem] font-bold">Ler mais</span>
                  <span aria-hidden="true">→</span>
                </UnavailableAction>
              </div>
            </article>
          </li>
        ))}
      </ul>
    </section>
  )
}
