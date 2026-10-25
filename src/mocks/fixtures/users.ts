/**
 * Demo accounts. Passwords are stored only as SHA-256 hashes of `salt:password`;
 * both accounts use the demo password documented in the README.
 */
export interface MockUser {
  id: string
  name: string
  email: string
  salt: string
  passwordHash: string
  avatarUrl: string | null
  createdAt: string
  /** Collector profile; optional so accounts stored before it existed still load. */
  username?: string
  ensName?: string
  walletNickname?: string
}

export const userFixtures: readonly MockUser[] = [
  {
    id: 'user-ana',
    name: 'Ana Colecionadora',
    email: 'ana@kurio.dev',
    salt: 'k7q2m9x1',
    passwordHash: '401c332eb3fb69ec696976ac215597affc882af407dc3117d42544deec5f74d2',
    avatarUrl: null,
    createdAt: '2026-06-02T12:00:00.000Z',
    username: 'ana',
    ensName: 'anacoleciona',
    walletNickname: 'Cofre da Ana',
  },
  {
    id: 'user-bruno',
    name: 'Bruno Criador',
    email: 'bruno@kurio.dev',
    salt: 'p4w8z3n6',
    passwordHash: '8ed7890ae7bd2e157d5259966bb152c909446a370fd111db90e92a3929680ac9',
    avatarUrl: null,
    createdAt: '2026-07-15T12:00:00.000Z',
    username: 'bruno',
    ensName: 'brunocria',
    walletNickname: 'Ateliê',
  },
]
