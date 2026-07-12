import 'dotenv/config'
import { query } from '../lib/db'

// Helper to generate CUID-like IDs
function generateId(): string {
  return `c${Date.now().toString(36)}${Math.random().toString(36).substr(2, 9)}`
}

async function seed() {
  console.log('🌱 Starting database seed...')

  try {
    // Create Game Categories
    const categories = [
      { name: 'BC Originaux', slug: 'bc-originaux', order: 1 },
      { name: 'BC Exclusif', slug: 'bc-exclusif', order: 2 },
      { name: 'Jeux populaires', slug: 'jeux-populaires', order: 3 },
      { name: 'Machines à sous', slug: 'machines-a-sous', order: 4 },
      { name: 'Casino en direct', slug: 'casino-en-direct', order: 5 },
      { name: 'Jeux télévisés', slug: 'jeux-televises', order: 6 },
      { name: 'Jeux de table', slug: 'jeux-de-table', order: 7 },
      { name: 'Blackjack', slug: 'blackjack', order: 8 },
      { name: 'Roulette', slug: 'roulette', order: 9 },
      { name: 'Baccarat', slug: 'baccarat', order: 10 },
      { name: 'Poker', slug: 'poker', order: 11 },
      { name: 'Bingo', slug: 'bingo', order: 12 },
    ]

    for (const category of categories) {
      await query(
        `INSERT INTO game_categories (id, name, slug, "order")
         VALUES (?, ?, ?, ?)
         ON CONFLICT (slug) DO NOTHING`,
        [generateId(), category.name, category.slug, category.order]
      )
    }
    console.log('✅ Game categories created')

    // Create Game Providers
    const providers = [
      { name: 'Shartbandee Originals', slug: 'shartbandee-originals' },
      { name: 'Evolution', slug: 'evolution' },
      { name: 'Pragmatic Play', slug: 'pragmatic-play' },
      { name: 'HACKSAW', slug: 'hacksaw' },
      { name: 'PG Soft', slug: 'pg-soft' },
      { name: 'TaDa', slug: 'tada' },
    ]

    for (const provider of providers) {
      await query(
        `INSERT INTO game_providers (id, name, slug)
         VALUES (?, ?, ?)
         ON CONFLICT (slug) DO NOTHING`,
        [generateId(), provider.name, provider.slug]
      )
    }
    console.log('✅ Game providers created')

    // Create Sports
    const sports = [
      { name: 'Football', slug: 'football', order: 1 },
      { name: 'eFootball', slug: 'efootball', order: 2 },
      { name: 'Basketball', slug: 'basketball', order: 3 },
      { name: 'Tennis', slug: 'tennis', order: 4 },
      { name: 'Cricket', slug: 'cricket', order: 5 },
      { name: 'Hockey sur glace', slug: 'hockey-sur-glace', order: 6 },
      { name: 'Baseball', slug: 'baseball', order: 7 },
      { name: 'Handball', slug: 'handball', order: 8 },
    ]

    for (const sport of sports) {
      await query(
        `INSERT INTO sports (id, name, slug, "order")
         VALUES (?, ?, ?, ?)
         ON CONFLICT (slug) DO NOTHING`,
        [generateId(), sport.name, sport.slug, sport.order]
      )
    }
    console.log('✅ Sports created')

    // Create VIP Levels
    const vipLevels = [
      { level: 0, name: 'VIP0', minWager: 0 },
      { level: 1, name: 'VIP1', minWager: 1000 },
      { level: 2, name: 'VIP2', minWager: 5000 },
      { level: 3, name: 'VIP3', minWager: 10000 },
      { level: 4, name: 'VIP4', minWager: 50000 },
      { level: 5, name: 'VIP5', minWager: 100000 },
    ]

    for (const vip of vipLevels) {
      await query(
        `INSERT INTO vip_levels (id, level, name, min_wager)
         VALUES (?, ?, ?, ?)
         ON CONFLICT (level) DO NOTHING`,
        [generateId(), vip.level, vip.name, vip.minWager]
      )
    }
    console.log('✅ VIP levels created')

    console.log('🎉 Database seed completed!')
  } catch (error) {
    console.error('❌ Seed failed:', error)
    process.exit(1)
  }
}

seed()
