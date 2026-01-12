# Sports Filter Update - American Football vs Football/Soccer

## Problem
The sports filters were not properly distinguishing between American Football and European Football (Soccer), and matches weren't showing which sport they belong to.

## Solution Applied

### 1. **Updated Sport Mapping** (`lib/odds-api-transform.ts`)
- **American Football**: Maps `americanfootball_*` keys to `american-football` slug and "American Football" name
- **Football/Soccer**: Maps `soccer_*` keys to `football` slug and "Football" name
- Added `sport_key` field to transformed matches for proper filtering

### 2. **Updated Sports List** (`app/api/sports/sports-list/route.ts`)
- Groups sports by main category (American Football, Football, Basketball, etc.)
- **American Football** and **Football** (Soccer) are now separate categories
- Uses most popular league from each category as the filter key:
  - American Football → `americanfootball_nfl`
  - Football → `soccer_epl`
  - Basketball → `basketball_nba`
  - etc.

### 3. **Updated Sport Icons** (`app/sports/page.tsx`)
- `getSportIcon()` now distinguishes between:
  - **American Football**: Uses `Target` icon
  - **Football/Soccer**: Uses `Activity` icon
- Icons are determined by checking the sport key, not just the slug

### 4. **Match Display**
- Matches now include `sport_key`, `sport_name`, and `sport_slug`
- Match cards show `league_name` (e.g., "NFL", "EPL") or `sport_name` (e.g., "American Football", "Football")
- Each match clearly shows which sport it belongs to

## Sport Categories

### American Football
- **Key**: `americanfootball_nfl`, `americanfootball_ncaaf`
- **Name**: "American Football"
- **Slug**: `american-football`
- **Icon**: Target
- **Leagues**: NFL, NCAAF

### Football (Soccer)
- **Key**: `soccer_epl`, `soccer_spain_la_liga`, `soccer_italy_serie_a`, etc.
- **Name**: "Football"
- **Slug**: `football`
- **Icon**: Activity
- **Leagues**: EPL, La Liga, Serie A, Bundesliga, Ligue 1, etc.

### Other Sports
- **Basketball**: `basketball_nba`, `basketball_ncaab`, etc.
- **Ice Hockey**: `icehockey_nhl`, `icehockey_ahl`, etc.
- **Tennis**: `tennis_atp_aus_open_singles`, etc.
- **Baseball**: `baseball_mlb`
- **MMA**: `mma_mixed_martial_arts`
- **Boxing**: `boxing_boxing`
- **Rugby**: `rugbyleague_*`, `rugbyunion_*`
- **Cricket**: `cricket_*`

## How Filtering Works

### When "Tous" (All) is Selected:
- Shows matches from all sports
- Each match card displays its sport/league name

### When "American Football" is Selected:
- Filters to `americanfootball_nfl` (most popular)
- Shows only NFL and NCAAF matches
- Match cards show "NFL" or "NCAAF" as league name

### When "Football" is Selected:
- Filters to `soccer_epl` (most popular)
- Shows only Soccer/Football matches (EPL, La Liga, etc.)
- Match cards show league name (e.g., "EPL", "La Liga")

## Match Data Structure

Each match now includes:
```typescript
{
  id: string
  sport_key: string        // e.g., "americanfootball_nfl" or "soccer_epl"
  sport_name: string       // e.g., "American Football" or "Football"
  sport_slug: string       // e.g., "american-football" or "football"
  league_name: string      // e.g., "NFL", "EPL", "NBA"
  home_team: string
  away_team: string
  // ... other fields
}
```

## UI Changes

1. **Filter Buttons**: Now show distinct names:
   - "American Football" (not "Football")
   - "Football" (for Soccer)
   - Other sports with proper names

2. **Match Cards**: Display league name (NFL, EPL, NBA) in the header

3. **Icons**: Different icons for American Football vs Football/Soccer

## Testing

1. **Visit `/sports` page**
2. **Check filter buttons**: Should see "American Football" and "Football" as separate options
3. **Select "American Football"**: Should show only NFL/NCAAF matches
4. **Select "Football"**: Should show only Soccer matches (EPL, La Liga, etc.)
5. **Check match cards**: Should display correct league name (NFL, EPL, etc.)

## Expected Behavior

✅ **American Football filter**: Shows only NFL/NCAAF matches  
✅ **Football filter**: Shows only Soccer matches (EPL, La Liga, etc.)  
✅ **Match cards**: Display correct sport/league name  
✅ **Icons**: Different icons for different sports  
✅ **No confusion**: American Football and Football are clearly separate  

