interface ImportMetaEnv {
  readonly VITE_API_URL?: string
  readonly VITE_ENABLE_MOCKS?: string
  readonly VITE_MOCK_SCENARIO?: string
  /** Socket.IO server; defaults to the app origin (where the mocks answer). */
  readonly VITE_SOCKET_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
