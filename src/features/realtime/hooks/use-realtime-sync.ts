import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import type { Socket } from 'socket.io-client'
import { useSession } from '@/features/auth/hooks/use-session'
import {
  applyNftUpdated,
  applyOrderUpdated,
  reconcileAfterReconnect,
} from '@/features/realtime/apply-events'
import { nftUpdatedEventSchema, orderUpdatedEventSchema } from '@/features/realtime/types/realtime'
import { whenNetworkReady } from '@/lib/network-ready'
import { getSessionToken } from '@/lib/session-token'

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL ?? window.location.origin

/** Remembered event ids, enough to absorb redeliveries. */
const SEEN_EVENTS_LIMIT = 200

/**
 * One Socket.IO connection per session (or visitor). Signing in, out or switching users closes
 * the previous socket with its listeners, so events of one session never reach another.
 */
export function useRealtimeSync(): void {
  const queryClient = useQueryClient()
  const { data: session } = useSession()
  const userId = session?.user.id ?? null

  useEffect(() => {
    const token = userId ? getSessionToken() : null
    const seen = new Set<string>()
    let socket: Socket | null = null
    let disposed = false
    let connectedBefore = false

    /** Drops repeated deliveries; the version check inside each handler drops stale ones. */
    function firstDelivery(eventId: string): boolean {
      if (seen.has(eventId)) return false
      seen.add(eventId)
      if (seen.size > SEEN_EVENTS_LIMIT) {
        const [oldest] = seen
        if (oldest) seen.delete(oldest)
      }
      return true
    }

    // Loaded on demand, after the network is ready: keeps Socket.IO out of the first bundle and
    // lets the client pick up the WebSocket the mock layer installs at startup.
    void whenNetworkReady()
      .then(() => import('socket.io-client'))
      .then(({ io }) => {
        if (disposed) return
        socket = io(SOCKET_URL, {
          transports: ['websocket'],
          // A handshake that never opens (server down) is retried after 3 s instead of 20 s.
          timeout: 3_000,
          reconnectionDelay: 500,
          reconnectionDelayMax: 2_000,
        })

        socket.on('connect', () => {
          if (token) socket?.emit('session.join', token)
          if (connectedBefore) reconcileAfterReconnect(queryClient)
          connectedBefore = true
        })

        socket.on('nft.updated', (payload: unknown) => {
          const event = nftUpdatedEventSchema.safeParse(payload)
          if (event.success && firstDelivery(event.data.id))
            applyNftUpdated(queryClient, event.data)
        })

        socket.on('order.updated', (payload: unknown) => {
          const event = orderUpdatedEventSchema.safeParse(payload)
          if (event.success && firstDelivery(event.data.id)) {
            applyOrderUpdated(queryClient, event.data)
          }
        })
      })

    return () => {
      disposed = true
      socket?.removeAllListeners()
      socket?.disconnect()
    }
  }, [queryClient, userId])
}
