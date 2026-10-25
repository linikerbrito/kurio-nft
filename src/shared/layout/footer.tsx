import { useState, type FormEvent, type ReactNode } from 'react'
import { Link } from '@tanstack/react-router'
import facebookIcon from '@/assets/figma/social-facebook.svg'
import instagramIcon from '@/assets/figma/social-instagram.svg'
import linkedinIcon from '@/assets/figma/social-linkedin.svg'
import xIcon from '@/assets/figma/social-x.svg'
import youtubeIcon from '@/assets/figma/social-youtube.svg'
import { UnavailableAction } from '@/shared/components/unavailable-action'

const footerLinkClass =
  'block w-fit text-sm leading-[1.875rem] text-fg transition-colors hover:text-fg-accent'
const footerHeadingClass = 'text-lg leading-4 font-bold text-fg'

const collectionLinks = ['Arte digital', 'Fotografia', 'Música', 'Arte 3D', 'Utilidade']
const helpLinks = [
  'Central de ajuda',
  'Como comprar NFTs',
  'Carteira e segurança',
  'Política do mercado',
  'Denunciar item',
]
const profileLinks = ['Minha coleção', 'Atividade', 'Estúdio do criador']

const socialLinks = [
  { icon: facebookIcon, label: 'Facebook', href: 'https://www.facebook.com' },
  { icon: instagramIcon, label: 'Instagram', href: 'https://www.instagram.com' },
  { icon: xIcon, label: 'X', href: 'https://x.com' },
  { icon: linkedinIcon, label: 'LinkedIn', href: 'https://www.linkedin.com' },
  { icon: youtubeIcon, label: 'YouTube', href: 'https://www.youtube.com' },
]

function LinkColumn({ title, children }: { title: string; children: ReactNode }) {
  return (
    <nav aria-label={title} className="space-y-2 xl:flex-1">
      <h2 className={footerHeadingClass}>{title}</h2>
      <ul>{children}</ul>
    </nav>
  )
}

function UnavailableLinks({ links }: { links: string[] }) {
  return links.map((link) => (
    <li key={link}>
      <UnavailableAction variant="link" className={footerLinkClass}>
        {link}
      </UnavailableAction>
    </li>
  ))
}

function Divider() {
  return <span aria-hidden="true" className="hidden w-px self-stretch bg-primary xl:block" />
}

export function Footer() {
  const [email, setEmail] = useState('')

  function handleNewsletterSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
  }

  return (
    <footer className="page-container mt-24 mb-6 hidden md:block">
      <div className="grid grid-cols-2 gap-8 bg-surface p-8 xl:flex xl:h-[15.625rem] xl:items-end xl:justify-between xl:gap-0">
        <Benefit letter="W" title="Segurança da carteira" className="xl:flex-1">
          Proteja sua carteira e colecione arte digital verificada com confiança.
        </Benefit>
        <Divider />
        <Benefit letter="C" title="Criadores em destaque" className="xl:w-[16.5417rem]">
          Conheça artistas, estúdios e comunidades que moldam a cultura digital na rede.
        </Benefit>
        <Divider />
        <Benefit letter="D" title="Alertas de lançamentos" className="xl:w-[16.5417rem]">
          Receba calendários de cunhagem, novidades de listas de acesso e análises do mercado.
        </Benefit>
        <Divider />
        <section className="flex flex-col gap-3 px-4 xl:w-[22.3125rem] xl:self-stretch">
          <h2 className={footerHeadingClass}>Antecipe-se ao próximo lançamento</h2>
          <form
            onSubmit={handleNewsletterSubmit}
            className="mt-1 flex h-10 rounded-[6px] bg-surface-warm shadow-[0_0_10px_color-mix(in_srgb,var(--color-bg)_45%,transparent)]"
          >
            <label htmlFor="newsletter-email" className="sr-only">
              E-mail para receber novidades
            </label>
            <input
              id="newsletter-email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="digite seu e-mail..."
              className="min-w-0 flex-1 rounded-l-[6px] bg-transparent pl-3 text-sm leading-4 text-fg outline-none placeholder:text-fg-subtle focus-visible:ring-2 focus-visible:ring-primary/40"
            />
            <UnavailableAction
              variant="button"
              type="submit"
              className="h-10 w-[5.3125rem] shrink-0 rounded-r-[6px] bg-primary pr-1 pl-4 text-left text-lg leading-4 font-bold text-primary-fg hover:bg-primary/90"
            >
              Enviar
            </UnavailableAction>
          </form>
          <p className="text-[0.8125rem] leading-[1.375rem] text-fg-muted">
            Receba lançamentos selecionados, histórias de criadores e novidades do mercado.
          </p>
        </section>
      </div>

      <div className="grid grid-cols-2 gap-4 bg-surface-warm px-8 py-6 text-sm leading-[1.375rem] text-fg xl:flex xl:h-[5.5rem] xl:items-center xl:gap-[5.75rem] xl:py-0">
        <span className="font-bold tracking-[0.1em] xl:flex-1">KURIO</span>
        <span className="whitespace-nowrap xl:flex-1">
          Feito para colecionadores,
          <br />
          criadores e cultura
        </span>
        <a className="w-fit hover:text-fg-accent xl:flex-1" href="mailto:contato@email.com">
          contato@email.com
        </a>
        <a className="w-fit hover:text-fg-accent xl:w-[14.25rem]" href="tel:+551140028922">
          +55 11 4002 8922
        </a>
      </div>

      <div className="grid grid-cols-2 gap-8 bg-surface p-8 xl:flex xl:h-[14.75rem] xl:gap-[7.75rem]">
        <LinkColumn title="Meu perfil">
          <li>
            <Link to="/perfil" className={footerLinkClass}>
              Meu perfil
            </Link>
          </li>
          <UnavailableLinks links={profileLinks} />
          <li>
            <Link to="/perfil/favoritos" className={footerLinkClass}>
              Lista de interesse
            </Link>
          </li>
        </LinkColumn>
        <LinkColumn title="Central de ajuda">
          <UnavailableLinks links={helpLinks} />
        </LinkColumn>
        <LinkColumn title="Coleções">
          <UnavailableLinks links={collectionLinks} />
        </LinkColumn>
        <section className="flex flex-col gap-8 xl:w-[14.25rem]">
          <div className="flex flex-col gap-5">
            <h2 className={footerHeadingClass}>Redes sociais</h2>
            <ul className="flex gap-2">
              {socialLinks.map((social) => (
                <li key={social.label}>
                  <a
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`${social.label} (abre em nova aba)`}
                    className="block rounded-[5px] transition-opacity hover:opacity-80"
                  >
                    <img src={social.icon} alt="" width={32} height={32} className="size-8" />
                  </a>
                </li>
              ))}
            </ul>
          </div>
          <div className="flex flex-col gap-3">
            <h2 className={footerHeadingClass}>Carteiras compatíveis</h2>
            <p className="flex h-[1.625rem] items-center justify-center rounded-[6px] border border-line-soft bg-surface-warm text-[0.5625rem] font-bold tracking-[0.1px] whitespace-pre text-fg-accent">
              {'METAMASK  •  WALLETCONNECT  •  COINBASE'}
            </p>
          </div>
        </section>
      </div>

      <p className="mt-1.5 text-center text-sm leading-[1.875rem] text-fg">
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
    <section className={`flex flex-col gap-3 px-4 ${className}`}>
      <span className="flex size-[4.625rem] items-center justify-center rounded-full bg-primary text-2xl font-bold text-primary-fg">
        {letter}
      </span>
      <h2 className="text-[1.0625rem] leading-4 font-bold text-fg">{title}</h2>
      <p className="w-[12.75rem] text-sm leading-[1.375rem] text-fg-muted">{children}</p>
    </section>
  )
}
