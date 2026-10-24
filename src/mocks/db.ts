import { nftFixtures, type MockNft } from '@/mocks/fixtures/nfts'

interface MockDb {
  nfts: MockNft[]
}

function createDb(): MockDb {
  return { nfts: structuredClone([...nftFixtures]) }
}

let db = createDb()

export function getDb(): MockDb {
  return db
}

/** Restores the known initial state of every mocked resource. */
export function resetDb(): void {
  db = createDb()
}
