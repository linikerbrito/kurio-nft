import Decimal from 'decimal.js'
import type { CategoryId, Network, Nft, NftEdition, Rarity } from '@/features/catalog/types/catalog'

/** Catalog record as stored by the mock API. `popularity` is internal and never sent. */
export interface MockNft extends Nft {
  popularity: number
}

export const categoryLabels: Record<CategoryId, string> = {
  'digital-art': 'Arte digital',
  photography: 'Fotografia',
  music: 'Música',
  '3d-art': 'Arte 3D',
  collectibles: 'Colecionáveis',
  generative: 'Generativa',
  gaming: 'Jogos',
  memberships: 'Assinaturas',
  utility: 'Utilidade',
}

export const networkLabels: Record<Network, string> = {
  ethereum: 'Ethereum',
  polygon: 'Polygon',
  solana: 'Solana',
}

/** The four artworks of the prototype, exported from the design file. */
const artworks = {
  emerald: '/nfts/ape-emerald.jpg',
  sage: '/nfts/ape-sage.jpg',
  onyx: '/nfts/ape-onyx.jpg',
  golden: '/nfts/ape-golden.jpg',
} as const
type Artwork = keyof typeof artworks
const artworkCycle: Artwork[] = ['emerald', 'sage', 'onyx', 'golden']
const NEWEST_LISTING = Date.UTC(2026, 9, 20, 15, 0, 0)
const DAY = 86_400_000

interface Seed {
  name: string
  price: string
  previousPrice?: string
  category: CategoryId
  network: Network
  collection: string
  rarity?: Rarity
  attributes: string[]
  artwork: Artwork
}

/** First page of "Listados recentemente", matching the desktop home frame. */
const designSeeds: Seed[] = [
  {
    name: 'Emerald Ape #042',
    artwork: 'emerald',
    price: '1.19',
    category: 'digital-art',
    network: 'ethereum',
    collection: 'Kurio Apes',
    rarity: 'rare',
    attributes: ['Óculos', 'Esmeralda', 'Raro'],
  },
  {
    name: 'Sage Nomad #009',
    artwork: 'sage',
    price: '1.69',
    category: 'digital-art',
    network: 'ethereum',
    collection: 'Kurio Apes',
    attributes: ['Chapéu', 'Moletom'],
  },
  {
    name: 'Neon Vessel #552',
    artwork: 'onyx',
    price: '1.99',
    previousPrice: '2.29',
    category: 'collectibles',
    network: 'polygon',
    collection: 'Kurio Apes',
    rarity: 'rare',
    attributes: ['Gola alta', 'Blazer', 'Raro'],
  },
  {
    name: 'Cosmic Bloom #118',
    artwork: 'sage',
    price: '1.29',
    category: 'generative',
    network: 'ethereum',
    collection: 'Kurio Apes',
    attributes: ['Chapéu', 'Moletom'],
  },
  {
    name: 'Violet Nomad #314',
    artwork: 'sage',
    price: '1.39',
    category: 'digital-art',
    network: 'solana',
    collection: 'Kurio Apes',
    attributes: ['Chapéu', 'Violeta'],
  },
  {
    name: 'Ivory Baron #088',
    artwork: 'onyx',
    price: '1.79',
    category: '3d-art',
    network: 'polygon',
    collection: 'Kurio Apes',
    rarity: 'rare',
    attributes: ['Blazer', 'Marfim', 'Raro'],
  },
  {
    name: 'Golden Beat #207',
    artwork: 'golden',
    price: '0.99',
    category: 'music',
    network: 'ethereum',
    collection: 'Kurio Sound',
    attributes: ['Fones', 'Dourado'],
  },
  {
    name: 'Amber Echo #233',
    artwork: 'golden',
    price: '0.79',
    category: 'music',
    network: 'solana',
    collection: 'Kurio Sound',
    attributes: ['Fones', 'Âmbar'],
  },
  {
    name: 'Golden Signal #160',
    artwork: 'golden',
    price: '0.39',
    category: 'music',
    network: 'polygon',
    collection: 'Kurio Sound',
    attributes: ['Fones', 'Dourado'],
  },
]

const adjectives = [
  'Amber',
  'Azure',
  'Crimson',
  'Dusk',
  'Ember',
  'Frost',
  'Hollow',
  'Iron',
  'Jade',
  'Lunar',
  'Marble',
  'Midnight',
  'Obsidian',
  'Pearl',
  'Quiet',
  'Rust',
  'Scarlet',
  'Silver',
  'Solar',
  'Tidal',
  'Umber',
  'Velvet',
  'Wild',
  'Copper',
  'Onyx',
  'Coral',
  'Saffron',
  'Cobalt',
  'Ochre',
  'Ashen',
  'Gilded',
]
const nouns = [
  'Monarch',
  'Drifter',
  'Oracle',
  'Pilgrim',
  'Ranger',
  'Sentinel',
  'Wanderer',
  'Mystic',
  'Herald',
  'Voyager',
  'Keeper',
  'Rogue',
  'Scholar',
  'Dreamer',
  'Warden',
  'Echo',
]
const collections = ['Kurio Apes', 'Kurio Sound', 'Kurio Editions', 'Kurio Lens']
const categoryCycle: CategoryId[] = [
  'photography',
  'music',
  '3d-art',
  'collectibles',
  'generative',
  'gaming',
  'memberships',
  'utility',
  'digital-art',
  'music',
  '3d-art',
]
const networkCycle: Network[] = ['ethereum', 'polygon', 'solana', 'ethereum', 'solana']
/** Spread over the price range of the design (0.02 to 12.30 ETH). */
const generatedPrices = [
  '0.02',
  '0.05',
  '0.12',
  '0.18',
  '0.25',
  '0.33',
  '0.45',
  '0.58',
  '0.64',
  '0.72',
  '0.85',
  '0.92',
  '1.05',
  '1.15',
  '1.45',
  '1.55',
  '2.10',
  '2.40',
  '2.75',
  '3.20',
  '3.60',
  '4.15',
  '4.80',
  '5.50',
  '6.25',
  '7.10',
  '8.40',
  '9.90',
  '10.75',
  '11.60',
  '12.30',
]
const attributePool = ['Coroa', 'Capuz', 'Brinco', 'Cachecol', 'Luvas', 'Tatuagem', 'Jaqueta']

/** Deterministic pseudo-random generator so every reset yields the same catalog. */
function createRandom(seed: number) {
  let state = seed
  return () => {
    state = (state * 1_103_515_245 + 12_345) % 2_147_483_648
    return state / 2_147_483_648
  }
}

const random = createRandom(42)

function pick<T>(items: readonly T[], index: number): T {
  const item = items[index % items.length]
  if (item === undefined) throw new Error('Empty fixture list')
  return item
}

function hex(length: number): string {
  let value = ''
  for (let i = 0; i < length; i++) value += Math.floor(random() * 16).toString(16)
  return value.toUpperCase()
}

const generatedSeeds: Seed[] = generatedPrices.map((price, index) => {
  const tokenNumber = String(Math.floor(random() * 900) + 100)
  const rare = index % 4 === 1
  return {
    name: `${pick(adjectives, index)} ${pick(nouns, index * 3 + 1)} #${tokenNumber}`,
    price,
    previousPrice: index % 7 === 3 ? new Decimal(price).times('1.15').toFixed(2) : undefined,
    category: pick(categoryCycle, index),
    network: pick(networkCycle, index),
    collection: pick(collections, index),
    rarity: rare ? 'rare' : 'common',
    attributes: [
      pick(attributePool, index),
      pick(attributePool, index + 3),
      ...(rare ? ['Raro'] : []),
    ],
    artwork: pick(artworkCycle, index),
  }
})

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace('#', '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

function buildEditions(id: string, index: number): NftEdition[] {
  return [
    { id: `${id}-1-1`, label: '1/1', supply: 1, available: index % 3 === 0 ? 0 : 1 },
    {
      id: `${id}-1-10`,
      label: '1/10',
      supply: 10,
      available: index % 5 === 2 ? 0 : 3 + (index % 7),
    },
    { id: `${id}-1-50`, label: '1/50', supply: 50, available: 12 + ((index * 7) % 38) },
    { id: `${id}-open`, label: 'ABERTA', supply: null, available: 100 },
  ]
}

function buildNft(seed: Seed, index: number): MockNft {
  const id = slugify(seed.name)
  const tokenId = `#${seed.name.split('#')[1]?.padStart(4, '0') ?? String(index)}`
  const networkLabel = networkLabels[seed.network]
  const editions = buildEditions(id, index)
  const image = {
    src: artworks[seed.artwork],
    alt: `${seed.name}, NFT da coleção ${seed.collection}`,
  }

  return {
    id,
    tokenId,
    name: seed.name,
    image,
    price: seed.price,
    previousPrice: seed.previousPrice ?? null,
    network: seed.network,
    category: seed.category,
    collection: { id: slugify(seed.collection), name: seed.collection },
    rarity: seed.rarity ?? 'common',
    available: editions.reduce((total, edition) => total + edition.available, 0),
    version: 1,
    description: `Um colecionável digital finalizado à mão da coleção ${seed.collection}, verificado na ${networkLabel}, com arte desbloqueável e acesso para colecionadores.`,
    story: [
      `${seed.name} é uma obra digital finalizada à mão da coleção ${seed.collection}. Cada atributo fica armazenado nos metadados do token e verificado na ${networkLabel}.`,
      'A propriedade inclui a arte em alta resolução, lançamentos exclusivos para colecionadores e um registro permanente de procedência registrada na rede.',
    ],
    gallery: Array.from({ length: 4 }, (_, position) => ({
      src: artworks[seed.artwork],
      alt: `${seed.name}, imagem ${position + 1} de 4`,
    })),
    editions,
    attributes: seed.attributes,
    rating: { average: 4 + ((index * 3) % 10) / 10, count: 5 + ((index * 11) % 40) },
    contract: { address: `0x${hex(40)}`, standard: 'ERC-721' },
    royaltyPercent: 5,
    listedAt: new Date(NEWEST_LISTING - index * DAY).toISOString(),
    popularity: Math.round(random() * 1000),
  }
}

export const nftFixtures: readonly MockNft[] = [...designSeeds, ...generatedSeeds].map(buildNft)

/** Hero carousel and sidebar spotlight of the home frame. */
export const featuredFixture = {
  slideIds: ['emerald-ape-042', 'sage-nomad-009', 'golden-beat-207'],
  spotlightId: 'cosmic-bloom-118',
} as const
