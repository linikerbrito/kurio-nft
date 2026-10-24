import zoomIcon from '@/assets/figma/detail/zoom.svg'
import type { NftImage } from '@/features/catalog/types/catalog'
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from '@/shared/ui/dialog'

interface NftGalleryProps {
  images: NftImage[]
  activeIndex: number
  onSelect: (index: number) => void
  nftName: string
}

/** Desktop gallery: four thumbnails beside the framed main image, with a zoom dialog. */
export function NftGallery({ images, activeIndex, onSelect, nftName }: NftGalleryProps) {
  const active = images[activeIndex] ?? images[0]
  if (!active) return null

  return (
    <div className="flex h-[28rem] shrink-0 items-center gap-7">
      <ul aria-label="Imagens do NFT" className="flex w-[6.25rem] flex-col gap-4">
        {images.map((image, index) => (
          <li key={`${image.src}-${index}`}>
            <button
              type="button"
              aria-label={`Ver imagem ${index + 1} de ${images.length}`}
              aria-pressed={index === activeIndex}
              onClick={() => onSelect(index)}
              className="block size-[6.25rem] overflow-hidden rounded-[8px] border border-transparent bg-surface transition-colors hover:border-primary/60 aria-pressed:border-primary"
            >
              <img
                src={image.src}
                alt=""
                width={100}
                height={100}
                className="size-full object-cover"
              />
            </button>
          </li>
        ))}
      </ul>

      <div className="relative flex size-[27.75rem] items-center justify-center rounded-[6px] bg-surface p-4">
        <img
          src={active.src}
          alt={active.alt}
          width={404}
          height={404}
          fetchPriority="high"
          className="size-[25.25rem] rounded-3xl object-cover"
        />
        <Dialog>
          <DialogTrigger
            aria-label="Ampliar imagem"
            className="absolute top-[0.9375rem] right-3 rounded-full transition-opacity hover:opacity-80"
          >
            <img src={zoomIcon} alt="" width={30} height={30} className="size-[1.875rem]" />
          </DialogTrigger>
          <DialogContent className="p-3 sm:max-w-[min(90vw,40rem)]">
            <DialogTitle className="sr-only">{nftName}</DialogTitle>
            <img
              src={active.src}
              alt={active.alt}
              width={600}
              height={600}
              className="aspect-square w-full rounded-2xl object-cover"
            />
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
