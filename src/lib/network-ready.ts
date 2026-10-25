let ready: Promise<void> = Promise.resolve()

/**
 * The app renders before its network layer is ready (in the demo build, the mock service worker
 * starting). Requests and the realtime socket wait for this gate instead of the first paint.
 */
export function setNetworkReady(promise: Promise<void>): void {
  ready = promise
}

export function whenNetworkReady(): Promise<void> {
  return ready
}
