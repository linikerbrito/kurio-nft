import { toSocketIo } from '@mswjs/socket.io-binding'
import { ws } from 'msw'
import type { Order } from '@/features/orders/types/orders'
import type { RealtimeEvent } from '@/features/realtime/types/realtime'
import { getDb } from '@/mocks/db'
import type { MockNft } from '@/mocks/fixtures/nfts'
import { authenticate } from '@/mocks/session'

/**
 * Socket.IO server simulated on top of MSW's WebSocket interception. The binding speaks the
 * Engine.IO/Socket.IO framing, so the app talks to it with the real `socket.io-client`.
 * Limitations: WebSocket transport only (no long-polling), one namespace, no rooms; events are
 * routed by the user that joined each connection.
 */
const socketUrl = window.location.origin.replace(/^http/, 'ws')
/** MSW drops the `/socket.io/` path of Socket.IO clients before matching, so the link is the origin. */
export const realtimeLink = ws.link(socketUrl)

/** Engine.IO ping, sent before the client's 30 s timeout. */
const PING_INTERVAL_MS = 20_000

interface ServerConnection {
  emit: (event: string, payload: RealtimeEvent) => void
  close: () => void
  userId: string | null
}

const connections = new Set<ServerConnection>()
let offlineUntil = 0
let lastEvent: RealtimeEvent | null = null
let eventCounter = 0

export const realtimeHandlers = [
  realtimeLink.addEventListener('connection', (connection) => {
    // Simulated outage: refuse the handshake until the network is back.
    if (Date.now() < offlineUntil) {
      connection.client.close()
      return
    }

    const io = toSocketIo(connection)
    const entry: ServerConnection = {
      emit: (event, payload) => io.client.emit(event, payload),
      close: () => connection.client.close(),
      userId: null,
    }
    connections.add(entry)

    const ping = window.setInterval(() => connection.client.send('2'), PING_INTERVAL_MS)
    connection.client.addEventListener('close', () => {
      window.clearInterval(ping)
      connections.delete(entry)
    })

    /** The client names its session; without a valid one it only gets public events. */
    io.client.on('session.join', (_event, token: unknown) => {
      const request = new Request(socketUrl, {
        headers: typeof token === 'string' ? { Authorization: `Bearer ${token}` } : {},
      })
      const auth = authenticate(request)
      entry.userId = auth.status === 'valid' ? auth.user.id : null
    })
  }),
]

/** What the server sent and to whom (the users of the connections that received it). */
interface DeliveryRecord {
  type: RealtimeEvent['type']
  resourceId: string
  targetUserId: string | null
  recipients: (string | null)[]
}
const DELIVERY_LOG_LIMIT = 100
const deliveryLog: DeliveryRecord[] = []

function deliver(event: RealtimeEvent, userId: string | null) {
  lastEvent = event
  const recipients: (string | null)[] = []
  for (const connection of connections) {
    if (userId === null || connection.userId === userId) {
      connection.emit(event.type, event)
      recipients.push(connection.userId)
    }
  }
  deliveryLog.push({
    type: event.type,
    resourceId: event.resource.id,
    targetUserId: userId,
    recipients,
  })
  if (deliveryLog.length > DELIVERY_LOG_LIMIT) deliveryLog.shift()
}

function nextEventId(): string {
  eventCounter += 1
  return `evt-${Date.now().toString(36)}-${eventCounter}`
}

/** Recomputes the total stock and bumps the version of an NFT that changed. */
export function touchNft(nft: MockNft): void {
  nft.available = nft.editions.reduce((total, edition) => total + edition.available, 0)
  nft.version += 1
}

export function emitNftUpdated(nft: MockNft): void {
  deliver(
    {
      id: nextEventId(),
      type: 'nft.updated',
      resource: { type: 'nft', id: nft.id },
      version: nft.version,
      occurredAt: new Date().toISOString(),
      data: {
        id: nft.id,
        price: nft.price,
        available: nft.available,
        editions: nft.editions.map((edition) => ({ id: edition.id, available: edition.available })),
      },
    },
    null,
  )
}

export function emitOrderUpdated(userId: string, order: Order): void {
  deliver(
    {
      id: nextEventId(),
      type: 'order.updated',
      resource: { type: 'order', id: order.id },
      version: order.version,
      occurredAt: new Date().toISOString(),
      data: order,
    },
    userId,
  )
}

/** Test and demo controls, exposed on `window.kurioMocks.realtime`. */
export const realtimeControls = {
  /** Changes price and/or stock of an edition, as the marketplace would, and emits it. */
  updateNft(nftId: string, changes: { price?: string; editionId?: string; available?: number }) {
    const nft = getDb().nfts.find((item) => item.id === nftId)
    if (!nft) throw new Error(`Unknown NFT ${nftId}`)
    if (changes.price) nft.price = changes.price
    const edition = changes.editionId
      ? nft.editions.find((item) => item.id === changes.editionId)
      : undefined
    if (edition && changes.available !== undefined) edition.available = changes.available
    touchNft(nft)
    emitNftUpdated(nft)
  },
  /** Sends the last event again with the same id (duplicate delivery). */
  replayLast() {
    if (!lastEvent) return
    for (const connection of connections) connection.emit(lastEvent.type, lastEvent)
  },
  /** Sends an event older than what the client already has (out of order). */
  emitStale(nftId: string, price: string) {
    const nft = getDb().nfts.find((item) => item.id === nftId)
    if (!nft) throw new Error(`Unknown NFT ${nftId}`)
    const stale: RealtimeEvent = {
      id: nextEventId(),
      type: 'nft.updated',
      resource: { type: 'nft', id: nft.id },
      version: Math.max(0, nft.version - 1),
      occurredAt: new Date(Date.now() - 60_000).toISOString(),
      data: {
        id: nft.id,
        price,
        available: nft.available,
        editions: nft.editions.map((edition) => ({ id: edition.id, available: edition.available })),
      },
    }
    for (const connection of connections) connection.emit(stale.type, stale)
  },
  /** Drops every connection and refuses new ones for `durationMs`. */
  disconnect(durationMs = 2_000) {
    offlineUntil = Date.now() + durationMs
    for (const connection of [...connections]) connection.close()
  },
  connectionCount() {
    return connections.size
  },
  /** Events sent since the page loaded, with the users that received each one. */
  deliveries() {
    return deliveryLog.map((record) => ({ ...record, recipients: [...record.recipients] }))
  },
}
