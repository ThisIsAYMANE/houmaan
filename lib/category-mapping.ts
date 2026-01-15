/**
 * Shared category mapping utility
 * Maps Slotegrator game types to category slugs dynamically
 */

// Map Slotegrator game type to category slug
// This function dynamically creates slugs from game types to ensure all categories are properly mapped
export function mapTypeToCategorySlug(type: string): string {
  if (!type) return 'other'
  
  // Normalize type to handle case variations
  const normalizedType = type.trim()
  
  // Standard mappings for common game types
  const typeMap: Record<string, string> = {
    'slots': 'slots',
    'Slots': 'slots',
    'table games': 'table-games',
    'Table Games': 'table-games',
    'live casino': 'live-casino',
    'Live Casino': 'live-casino',
    'roulette': 'roulette',
    'Roulette': 'roulette',
    'blackjack': 'blackjack',
    'Blackjack': 'blackjack',
    'baccarat': 'baccarat',
    'Baccarat': 'baccarat',
    'poker': 'poker',
    'Poker': 'poker',
    'video poker': 'video-poker',
    'Video Poker': 'video-poker',
    'lottery': 'lottery',
    'Lottery': 'lottery',
    'keno': 'keno',
    'Keno': 'keno',
    'virtual sports': 'virtual-sports',
    'Virtual Sports': 'virtual-sports',
    'crash': 'crash',
    'Crash': 'crash',
    'dice': 'dice',
    'Dice': 'dice',
    'fruit game': 'fruit-game',
    'Fruit Game': 'fruit-game',
  }
  
  // Check exact match first
  if (typeMap[normalizedType]) {
    return typeMap[normalizedType]
  }
  
  // Check lowercase match
  const lowerType = normalizedType.toLowerCase()
  if (typeMap[lowerType]) {
    return typeMap[lowerType]
  }
  
  // If no match, dynamically create slug from the type name
  // This ensures ALL game types get unique category slugs
  const dynamicSlug = lowerType
    .replace(/[^a-z0-9]+/g, '-')  // Replace non-alphanumeric with hyphens
    .replace(/^-|-$/g, '')         // Remove leading/trailing hyphens
  
  return dynamicSlug || 'other'
}



