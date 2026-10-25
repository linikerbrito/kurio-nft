import facebookIcon from '@/assets/figma/auth/facebook.svg'
import google1 from '@/assets/figma/auth/google/part-1.svg'
import google2 from '@/assets/figma/auth/google/part-2.svg'
import google3 from '@/assets/figma/auth/google/part-3.svg'
import google4 from '@/assets/figma/auth/google/part-4.svg'
import google5 from '@/assets/figma/auth/google/part-5.svg'
import google6 from '@/assets/figma/auth/google/part-6.svg'
import google7 from '@/assets/figma/auth/google/part-7.svg'
import { UnavailableAction } from '@/shared/components/unavailable-action'

/** The Google mark is seven vector parts in the design, placed by their insets (%). */
const googleParts = [
  { src: google1, inset: '57.68% 17.83% 0 7.11%' },
  { src: google2, inset: '71.33% 17.83% 0 50%' },
  { src: google3, inset: '24.69% 75.25% 24.69% 0' },
  { src: google4, inset: '38.28% 0 11.97% 47.07%' },
  { src: google5, inset: '38.28% 0 11.97% 50%' },
  { src: google6, inset: '0 17.01% 57.68% 7.11%' },
  { src: google7, inset: '0 17.01% 70.51% 50%' },
]

function GoogleMark() {
  return (
    <span aria-hidden="true" className="relative size-5 shrink-0 overflow-hidden">
      {googleParts.map((part) => (
        <img
          key={part.src}
          src={part.src}
          alt=""
          className="absolute"
          style={{ inset: part.inset }}
        />
      ))}
    </span>
  )
}

const buttonClass =
  'flex h-10 w-full items-center justify-center gap-3 rounded-[5px] border border-line text-[0.8125rem] leading-4 font-medium text-fg-muted transition-colors hover:border-primary'

/**
 * "Ou continue com": Google and Facebook are present but unavailable in the demo; they announce
 * it instead of pretending to sign in.
 */
export function SocialSignIn({ variant }: { variant: 'desktop' | 'mobile' }) {
  const mobile = variant === 'mobile'
  return (
    <div className={mobile ? 'space-y-3' : 'space-y-3 pt-6'}>
      <div className="flex items-center gap-3" aria-hidden="true">
        <span className="h-px flex-1 bg-line" />
        <span className="text-[0.8125rem] leading-4 text-fg">Ou continue com</span>
        <span className="h-px flex-1 bg-line" />
      </div>
      <div className={`flex flex-col ${mobile ? 'gap-4' : 'gap-3 px-20'}`}>
        <UnavailableAction
          variant="button"
          aria-label="Continuar com Google (indisponível na demonstração)"
          className={buttonClass}
        >
          <GoogleMark />
          Continuar com Google
        </UnavailableAction>
        <UnavailableAction
          variant="button"
          aria-label="Continuar com Facebook (indisponível na demonstração)"
          className={buttonClass}
        >
          <img src={facebookIcon} alt="" className="size-5" />
          Continuar com Facebook
        </UnavailableAction>
      </div>
    </div>
  )
}
