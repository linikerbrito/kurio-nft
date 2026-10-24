import starIcon from '@/assets/figma/detail/star-filled.svg'
import starEmptyIcon from '@/assets/figma/detail/star-last.svg'

/** Five stars as in the design; the score is also read out as text. */
export function RatingStars({ average }: { average: number }) {
  const filled = Math.round(average)
  return (
    <span className="flex items-center gap-1">
      <span className="sr-only">Nota {average.toFixed(1).replace('.', ',')} de 5.</span>
      {Array.from({ length: 5 }, (_, index) => (
        <span
          key={index}
          aria-hidden="true"
          className="flex size-[0.9375rem] items-center justify-center"
        >
          <img
            src={index < filled ? starIcon : starEmptyIcon}
            alt=""
            className="h-[0.7422rem] w-[0.7814rem]"
          />
        </span>
      ))}
    </span>
  )
}
