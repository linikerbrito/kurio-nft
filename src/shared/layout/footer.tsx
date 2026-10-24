import { useState, type FormEvent } from 'react'
import { Link } from '@tanstack/react-router'
import { Input } from '@/shared/ui/input'
import { UnavailableAction } from '@/shared/components/unavailable-action'

const footerLinkClass = 'block w-fit text-sm text-fg transition-colors hover:text-primary'
const footerHeadingClass = 'text-lg font-bold text-fg'
const dividedColumnClass = 'lg:border-l lg:border-primary/50 lg:pl-4'

const collectionLinks = ['Arte digital', 'Fotografia', 'Música', 'Arte 3D', 'Utilidade']
const helpLinks = [
  'Central de ajuda',
  'Como comprar NFTs',
  'Carteira e segurança',
  'Política do mercado',
  'Denunciar item',
]
const profileLinks = ['Minha coleção', 'Atividade', 'Estúdio do criador', 'Lista de interesse']

function SocialMark({ kind }: { kind: 'facebook' | 'instagram' | 'x' | 'linkedin' | 'youtube' }) {
  if (kind === 'instagram') {
    return (
      <svg aria-hidden="true" viewBox="0 0 24 24" className="size-4" fill="none">
        <rect x="3" y="3" width="18" height="18" rx="5" stroke="currentColor" strokeWidth="2" />
        <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="2" />
        <circle cx="18" cy="6" r="1" fill="currentColor" />
      </svg>
    )
  }
  if (kind === 'youtube') {
    return (
      <svg aria-hidden="true" viewBox="0 0 24 24" className="size-4" fill="currentColor">
        <path d="M23 7.1a3 3 0 0 0-2.1-2.2C19 4.4 12 4.4 12 4.4s-7 0-8.9.5A3 3 0 0 0 1 7.1 31 31 0 0 0 .5 12a31 31 0 0 0 .5 4.9 3 3 0 0 0 2.1 2.2c1.9.5 8.9.5 8.9.5s7 0 8.9-.5a3 3 0 0 0 2.1-2.2 31 31 0 0 0 .5-4.9 31 31 0 0 0-.5-4.9ZM9.7 15.4V8.6l5.9 3.4-5.9 3.4Z" />
      </svg>
    )
  }
  const mark = kind === 'facebook' ? 'f' : kind === 'linkedin' ? 'in' : '𝕏'
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="size-4">
      <text
        x="12"
        y="18"
        textAnchor="middle"
        fill="currentColor"
        fontFamily="sans-serif"
        fontSize={kind === 'linkedin' ? '14' : '20'}
        fontWeight="700"
      >
        {mark}
      </text>
    </svg>
  )
}

const socialLinks = [
  { kind: 'facebook', label: 'Facebook', href: 'https://www.facebook.com' },
  { kind: 'instagram', label: 'Instagram', href: 'https://www.instagram.com' },
  { kind: 'x', label: 'X', href: 'https://x.com' },
  { kind: 'linkedin', label: 'LinkedIn', href: 'https://www.linkedin.com' },
  { kind: 'youtube', label: 'YouTube', href: 'https://www.youtube.com' },
] as const

function LinkColumn({ title, label, links }: { title: string; label: string; links: string[] }) {
  return (
    <nav aria-label={label} className="space-y-3">
      <h2 className={footerHeadingClass}>{title}</h2>
      <ul className="space-y-3">
        {links.map((link) => (
          <li key={link}>
            <UnavailableAction variant="link" className={footerLinkClass}>
              {link}
            </UnavailableAction>
          </li>
        ))}
      </ul>
    </nav>
  )
}

export function Footer() {
  const [email, setEmail] = useState('')

  function handleNewsletterSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
  }

  return (
    <footer className="page-container mt-16 hidden md:block">
      <div className="grid grid-cols-2 gap-8 bg-surface pt-8 pr-8 pb-5 pl-12 lg:grid-cols-[1fr_1fr_1fr_1.35fr] lg:gap-4">
        <Benefit letter="W" title="Segurança da carteira">
          Proteja sua carteira e colecione arte digital verificada com confiança.
        </Benefit>
        <Benefit letter="C" title="Criadores em destaque" className={dividedColumnClass}>
          Conheça artistas, estúdios e comunidades que moldam a cultura digital na rede.
        </Benefit>
        <Benefit letter="D" title="Alertas de lançamentos" className={dividedColumnClass}>
          Receba calendários de cunhagem, novidades de listas de acesso e análises do mercado.
        </Benefit>
        <section className={`space-y-4 ${dividedColumnClass}`}>
          <h2 className="text-base leading-tight font-bold text-fg">
            Antecipe-se ao próximo lançamento
          </h2>
          <form onSubmit={handleNewsletterSubmit} className="flex">
            <label htmlFor="newsletter-email" className="sr-only">
              E-mail para receber novidades
            </label>
            <Input
              id="newsletter-email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="digite seu e-mail..."
              className="h-10 rounded-r-none border-0 bg-surface-warm text-sm"
            />
            <UnavailableAction
              variant="button"
              type="submit"
              className="h-10 shrink-0 rounded-r-sm bg-primary px-4 text-base font-semibold text-primary-fg hover:bg-primary/90"
            >
              Enviar
            </UnavailableAction>
          </form>
          <p className="text-[0.8rem] leading-relaxed text-fg-muted">
            Receba lançamentos selecionados, histórias de criadores e novidades do mercado.
          </p>
        </section>
      </div>

      <div className="bg-surface-warm">
        <div className="grid grid-cols-2 items-center gap-4 px-8 py-6 text-sm text-fg lg:grid-cols-[1fr_1fr_1fr_14.25rem]">
          <span className="font-bold tracking-[0.08em]">KURIO</span>
          <span className="max-w-56">Feito para colecionadores, criadores e cultura</span>
          <a className="hover:text-primary" href="mailto:contato@email.com">
            contato@email.com
          </a>
          <a className="hover:text-primary" href="tel:+551140028922">
            +55 11 4002 8922
          </a>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-8 bg-surface px-8 pt-7 pb-9 lg:grid-cols-[1fr_1fr_1fr_14.25rem] lg:gap-0">
        <nav aria-label="Meu perfil" className="space-y-3">
          <h2 className={footerHeadingClass}>Meu perfil</h2>
          <ul className="space-y-3">
            <li>
              <Link to="/perfil" className={footerLinkClass}>
                Meu perfil
              </Link>
            </li>
            {profileLinks.map((link) => (
              <li key={link}>
                <UnavailableAction variant="link" className={footerLinkClass}>
                  {link}
                </UnavailableAction>
              </li>
            ))}
          </ul>
        </nav>
        <LinkColumn title="Central de ajuda" label="Central de ajuda" links={helpLinks} />
        <LinkColumn title="Coleções" label="Coleções" links={collectionLinks} />
        <section className="space-y-6">
          <div className="space-y-3">
            <h2 className={footerHeadingClass}>Redes sociais</h2>
            <ul className="flex gap-2">
              {socialLinks.map((social) => (
                <li key={social.kind}>
                  <a
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={social.label}
                    className="flex size-8 items-center justify-center rounded-sm border border-primary text-primary transition-colors hover:bg-primary/10"
                  >
                    <SocialMark kind={social.kind} />
                  </a>
                </li>
              ))}
            </ul>
          </div>
          <div className="space-y-2">
            <h2 className={footerHeadingClass}>Carteiras compatíveis</h2>
            <p className="w-fit rounded-sm border border-primary/30 bg-surface-warm px-2.5 py-1.5 text-[0.55rem] font-bold tracking-wide text-primary">
              METAMASK · WALLETCONNECT · COINBASE
            </p>
          </div>
        </section>
      </div>

      <p className="py-5 text-center text-sm text-fg">
        © {new Date().getFullYear()} Kurio. Propriedade digital para todos.
      </p>
    </footer>
  )
}

function Benefit({
  letter,
  title,
  children,
  className = '',
}: {
  letter: string
  title: string
  children: string
  className?: string
}) {
  return (
    <section className={`space-y-3 ${className}`}>
      <span className="flex size-[4.625rem] items-center justify-center rounded-full bg-primary text-2xl font-bold text-primary-fg">
        {letter}
      </span>
      <h2 className="pt-1 text-base font-bold text-fg">{title}</h2>
      <p className="max-w-48 text-sm leading-relaxed text-fg-muted">{children}</p>
    </section>
  )
}
