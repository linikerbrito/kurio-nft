import { useRef, type DragEvent, type MouseEvent, type PointerEvent } from 'react'

/** Horizontal distance a drag must cover to count as a swipe. */
const SWIPE_THRESHOLD_PX = 40

type SwipeDirection = 'left' | 'right'

/**
 * Horizontal swipe on an element, with touch, pen or mouse. Vertical drags keep scrolling the
 * page (`touch-pan-y` on the element), and a swipe does not also click the link under the finger.
 * Native dragging of links and images is off inside, or a mouse drag would cancel the gesture.
 */
export function useSwipe(onSwipe: (direction: SwipeDirection) => void) {
  const start = useRef<{ x: number; y: number } | null>(null)
  const swiped = useRef(false)

  return {
    onPointerDown(event: PointerEvent<HTMLElement>) {
      if (!event.isPrimary) return
      start.current = { x: event.clientX, y: event.clientY }
      swiped.current = false
    },
    onPointerUp(event: PointerEvent<HTMLElement>) {
      const origin = start.current
      start.current = null
      if (!origin) return
      const dx = event.clientX - origin.x
      const dy = event.clientY - origin.y
      if (Math.abs(dx) < SWIPE_THRESHOLD_PX || Math.abs(dx) <= Math.abs(dy)) return
      swiped.current = true
      onSwipe(dx < 0 ? 'left' : 'right')
    },
    onPointerCancel() {
      start.current = null
    },
    onDragStart(event: DragEvent<HTMLElement>) {
      event.preventDefault()
    },
    onClickCapture(event: MouseEvent<HTMLElement>) {
      if (!swiped.current) return
      swiped.current = false
      event.preventDefault()
      event.stopPropagation()
    },
  }
}
