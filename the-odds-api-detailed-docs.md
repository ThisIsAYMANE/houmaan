# The Odds API (v4) — Complete Reference for "All Sports, All Games, All Odds"

Source: https://the-odds-api.com/liveapi/guides/v4 (+ linked sub-pages: betting-markets.html, bookmaker-apis.html)

This document is built to answer one specific goal: **pull every sport, all their live/upcoming games, and every available odds market/bookmaker info for each**, including sport-specific special requests (player props, period markets, etc).

---

## 1. Host & Auth

- Base host: `https://api.the-odds-api.com`
- IPv6-only: `https://ipv6-api.the-odds-api.com`
- Every request needs `apiKey={apiKey}` as a query parameter (get one free via the site's signup — the free plan has a limited monthly quota).

---

## 2. The Workflow to Get "Everything"

There is **no single endpoint** that returns all sports + all games + all odds/markets in one call — you must chain 2 calls per sport:

```
Step 1: GET /v4/sports                         → list every in-season sport (free, no quota cost)
Step 2: For each sport key returned:
          GET /v4/sports/{sport}/odds           → live + upcoming games with odds for chosen markets/regions
```

If you also want **every possible market** (not just h2h/spreads/totals), you need a 3rd call per event, because non-featured markets (player props, alternate lines, period markets) are **not returned by `/odds`** — they must be queried one event at a time via `/events/{eventId}/odds`.

```
Step 3 (optional, for full market coverage):
          GET /v4/sports/{sport}/events          → get eventId list for that sport (free)
          GET /v4/sports/{sport}/events/{id}/odds?markets=<full market list>  → per-event full market odds
```

This 3-step structure is unavoidable — it's how the API is designed, per the docs ("Since the volume of data returned can be large, these requests will only query one event at a time" for non-featured markets).

---

## 3. Step 1 — GET all sports

**Endpoint:** `GET /v4/sports/?apiKey={apiKey}`

**Parameters:**
- `apiKey` — required
- `all` — optional, `all=true` returns both in- and out-of-season sports (default only returns in-season)

**Cost:** Free (does not count against usage quota)

**Example:**
```
GET https://api.the-odds-api.com/v4/sports/?apiKey=YOUR_API_KEY
```

**Response shape:**
```json
[
  {
    "key": "americanfootball_nfl",
    "group": "American Football",
    "title": "NFL",
    "description": "US Football",
    "active": true,
    "has_outrights": false
  },
  ...
]
```

Use the `key` field from this response as the `{sport}` path parameter in every other endpoint. `upcoming` is a special always-valid sport key that returns live games plus the next 8 upcoming games across **all** sports.

---

## 4. Step 2 — GET odds (live + upcoming games) for a sport

**Endpoint:**
```
GET /v4/sports/{sport}/odds/?apiKey={apiKey}&regions={regions}&markets={markets}
```

### Parameters

| Param | Required | Notes |
|---|---|---|
| `sport` | Yes | Sport key from `/sports`, or `upcoming` |
| `apiKey` | Yes | Your key |
| `regions` | Yes | Bookmaker region(s): `us`, `us2`, `uk`, `au`, `eu` (comma-delimited for multiple). See §6 for exact bookmakers per region. |
| `markets` | No (default `h2h`) | `h2h`, `spreads`, `totals`, `outrights` — comma-delimited. `spreads`/`totals` are mainly US sports/bookmakers. Each market costs 1 quota credit per region. |
| `dateFormat` | No (default `iso`) | `unix` or `iso` |
| `oddsFormat` | No (default `decimal`) | `decimal` or `american` |
| `eventIds` | No | Comma-separated game ids to filter |
| `bookmakers` | No | Comma-separated bookmaker keys; overrides `regions` if both given. Every 10 bookmakers = 1 region-equivalent for quota purposes |
| `commenceTimeFrom` / `commenceTimeTo` | No | ISO8601 filters on game start time (no effect if sport=`upcoming`) |
| `includeLinks` | No | `true`/`false` — bookmaker deep links to events/markets/betslips |
| `includeSids` | No | `true`/`false` — bookmaker source IDs for events/markets/outcomes |
| `includeBetLimits` | No | `true`/`false` — bet limits (mainly for exchanges) |
| `includeRotationNumbers` | No | `true`/`false` — home/away rotation numbers if available |

### Important behavioral notes (from docs, verbatim logic)
- The event list mirrors what major bookmakers currently list — usually just the current round.
- Events can vanish temporarily between rounds, or if a sport is out of season.
- If zero events are returned, the call does **not** count against your quota.
- A game is "in-play" if `commence_time` is in the past; `/odds` never returns completed games (use `/scores` for that).
- Lay odds (`h2h_lay`) are auto-included for exchanges (Betfair, Matchbook, etc.) alongside `h2h`.
- Sports with outright-only markets (e.g. Golf) default `markets` to `outrights` if you don't specify it, and `outrights_lay` is added automatically for exchanges.

### Quota cost
```
cost = [number of markets] x [number of regions]
```
Examples: 1 market/1 region = 1; 3 markets/1 region = 3; 1 market/3 regions = 3; 3 markets/3 regions = 9.

### Response headers (every call)
- `x-requests-remaining`
- `x-requests-used`
- `x-requests-last`

### Example
```
GET https://api.the-odds-api.com/v4/sports/americanfootball_nfl/odds/?apiKey=YOUR_API_KEY&regions=us&markets=h2h,spreads&oddsFormat=american
```

Response includes, per game: `id`, `sport_key`, `commence_time`, `home_team`, `away_team`, then a `bookmakers[]` array, each with `key`, `title`, `last_update`, and `markets[]` (each with `key` and `outcomes[]` containing `name`, `price`, and `point` for spreads/totals).

---

## 5. GET scores (needed if you also want live scores, not just odds)

**Endpoint:**
```
GET /v4/sports/{sport}/scores/?apiKey={apiKey}&daysFrom={daysFrom}&dateFormat={dateFormat}
```

- Returns upcoming, live, and recently completed games. Live/completed games include `scores`.
- Live scores update roughly every 30 seconds.
- `daysFrom` (1–3) — how many days back to include completed games. Omit it to get only live+upcoming.
- `eventIds` — optional filter.
- Coverage is sport-dependent and expanding (see the sports/leagues coverage page linked from the docs).
- The `id` field matches the `id` in the `/odds` response, so you can join scores to odds by game id.

**Quota cost:** 2 if `daysFrom` is specified, otherwise 1.

---

## 6. Regions & Bookmakers (exact list, from bookmaker-apis.html)

Regions you can pass into `regions=`: `us`, `us2`, `us_dfs` (US daily fantasy), `us_ex` (US exchanges), `uk`, `eu`, `fr`, `se`, `au`.

### US Bookmakers (`us`)
betonlineag (BetOnline.ag), betmgm (BetMGM), betrivers (BetRivers), betus (BetUS), bovada (Bovada), williamhill_us (Caesars — paid only), draftkings (DraftKings), fanatics (Fanatics — paid only), fanduel (FanDuel), lowvig (LowVig.ag), mybookieag (MyBookie.ag)

### US Bookmakers (`us2`)
ballybet (Bally Bet), betanysports (BetAnything, formerly BetAnySports), betparx (betPARX), espnbet (theScore Bet, formerly ESPN Bet), fliff (Fliff), hardrockbet / hardrockbet_az / hardrockbet_fl / hardrockbet_oh (Hard Rock Bet, state variants), rebet (ReBet — paid only)

### US Daily Fantasy Sports (`us_dfs`)
betr_us_dfs (Betr Picks), pick6 (DraftKings Pick6), prizepicks (PrizePicks), underdog (Underdog Fantasy)
— Note: odds are indicative only since they vary per user selection; non-default multiplier selections appear under `_alternate` markets. PrizePicks demons/goblins are folded into `_alternate` markets too.

### US Exchanges (`us_ex`)
betopenly (BetOpenly — use `includeBetLimits` to see open bets), kalshi (Kalshi), novig (Novig), polymarket (Polymarket), prophetx (ProphetX)

### UK Bookmakers (`uk`)
sport888 (888sport), betfair_ex_uk (Betfair Exchange), betfair_sb_uk (Betfair Sportsbook), betfred_uk (Betfred UK), betvictor (Bet Victor), betway (Betway), boylesports (BoyleSports), casumo (Casumo), coral (Coral), grosvenor (Grosvenor), ladbrokes_uk (Ladbrokes), leovegas (LeoVegas), livescorebet (LiveScore Bet), matchbook (Matchbook), paddypower (Paddy Power), skybet (Sky Bet), smarkets (Smarkets), unibet_uk (Unibet), virginbet (Virgin Bet), williamhill (William Hill UK)

### EU Bookmakers (`eu`)
onexbet (1xBet), sport888 (888sport), betclic_fr (Betclic FR), betanysports (BetAnySports), betfair_ex_eu (Betfair Exchange), betonlineag (BetOnline.ag), betsson (Betsson), codere_it (Codere IT), betvictor (Bet Victor), coolbet (Coolbet), everygame (Everygame), gtbets (GTbets), leovegas_se (LeoVegas SE), marathonbet (Marathon Bet), matchbook (Matchbook), mybookieag (MyBookie.ag), nordicbet (NordicBet), pinnacle (Pinnacle — from public site, may have delay), pmu_fr (PMU FR), suprabets (Suprabets), tipico_de (Tipico DE), unibet_fr/it/nl/se (Unibet variants), williamhill (William Hill), winamax_de/fr (Winamax variants)

### FR Bookmakers (`fr`)
betclic_fr (Betclic), netbet_fr (NetBet), pmu_fr (PMU), unibet_fr (Unibet), winamax_fr (Winamax)

### SE Bookmakers (`se`)
atg_se (ATG), betinia_se (Betinia), betmgm_se (BetMGM SE), betsson (Betsson), campobet_se (CampoBet), expekt_se (Nya Expekt), hajper_se (Hajper), leovegas_se (LeoVegas SE), mrgreen_se (Mr Green), nordicbet (NordicBet), sport888_se (888sport SE), svenskaspel_se (Svenska Spel), unibet_se (Unibet SE)

### AU Bookmakers (`au`)
betfair_ex_au (Betfair Exchange), betr_au (Betr), betright (Bet Right), bet365_au (Bet365 AU — paid only, currently limited to h2h/spreads/totals for AFL & NRL), dabble_au (Dabble AU — paid only), ladbrokes_au (Ladbrokes), neds (Neds), playup (PlayUp), pointsbetau (PointsBet AU), sportsbet (SportsBet), tab (TAB), tabtouch (TABtouch), unibet (Unibet)

**Notes from the docs:**
- Not every bookmaker lists odds for every (less popular) sport.
- Bookmakers occasionally disappear temporarily (site maintenance, site changes) or get delisted permanently and rarely.

---

## 7. Betting Markets — Full Catalogue (this is the "special request per sport" answer)

Markets are requested via the `markets=` param (comma-delimited). Featured markets work on `/odds`; everything else (additional/period/player-prop markets) must be queried per-event via `/events/{eventId}/odds`.

### 7.1 Featured markets (work on `/odds`, default endpoint)

| Market key | Name | Description |
|---|---|---|
| `h2h` | Moneyline | Winner of the game (includes draw for soccer) |
| `spreads` | Points spread / Handicap | Winner after a points handicap |
| `totals` | Over/Under | Total score above/below a threshold |
| `outrights` | Futures | Final outcome of a tournament (default market for sports like Golf) |
| `h2h_lay` | Lay h2h | Bet against an h2h outcome (exchanges only) |
| `outrights_lay` | Lay outrights | Bet against an outrights outcome (exchanges only) |

`spreads`/`totals` mainly available for US sports/bookmakers.

### 7.2 Additional markets (per-event odds endpoint only; update every 1 min)

| Market key | Description |
|---|---|
| `alternate_spreads` | All available point-spread lines |
| `alternate_totals` | All available over/under lines |
| `btts` | Both Teams to Score (soccer) |
| `draw_no_bet` | Match winner excluding draw (soccer) |
| `h2h_3_way` | Match winner including draw |
| `team_totals` | Featured team totals (O/U) |
| `alternate_team_totals` | All team totals lines (O/U) |

### 7.3 Game period markets (quarters/halves/periods/innings/sets — sport-specific)

Generic pattern: `h2h_q1..q4`, `h2h_h1/h2`, `h2h_p1..p3` (ice hockey), `h2h_3_way_*` (same splits, 3-way), `h2h_1st_1/3/5/7_innings` + 3-way versions (baseball), `h2h_s1/s2` (tennis, per set). Same pattern repeats for `spreads_*`, `alternate_spreads_*`, `totals_*`, `alternate_totals_*`, `team_totals_*`, `alternate_team_totals_*` across quarters/halves/periods/innings/sets. Full key list:

```
h2h_q1, h2h_q2, h2h_q3, h2h_q4, h2h_h1, h2h_h2, h2h_p1, h2h_p2, h2h_p3
h2h_3_way_q1..q4, h2h_3_way_h1, h2h_3_way_h2, h2h_3_way_p1..p3
h2h_1st_1_innings, h2h_1st_3_innings, h2h_1st_5_innings, h2h_1st_7_innings   (baseball)
h2h_3_way_1st_1_innings, h2h_3_way_1st_3_innings, h2h_3_way_1st_5_innings, h2h_3_way_1st_7_innings  (baseball)
h2h_s1, h2h_s2   (tennis, per set)

spreads_q1..q4, spreads_h1, spreads_h2, spreads_p1..p3
spreads_1st_1_innings, spreads_1st_3_innings, spreads_1st_5_innings, spreads_1st_7_innings (baseball)
spreads_s1  (tennis)
alternate_spreads_1st_1/3/5/7_innings (baseball)
alternate_spreads_q1..q4, alternate_spreads_h1/h2, alternate_spreads_p1..p3

totals_q1..q4, totals_h1, totals_h2, totals_p1..p3
totals_1st_1/3/5/7_innings (baseball), totals_s1 (tennis)
alternate_totals_1st_1/3/5/7_innings (baseball), alternate_totals_s1 (tennis)
alternate_totals_q1..q4, alternate_totals_h1/h2, alternate_totals_p1..p3

team_totals_h1, team_totals_h2, team_totals_q1..q4, team_totals_p1..p3
alternate_team_totals_h1, alternate_team_totals_h2, alternate_team_totals_q1..q4, alternate_team_totals_p1..p3
```
(`p1/p2/p3` = ice hockey periods; `_innings` = baseball only; `_s1/_s2` = tennis sets)

### 7.4 Player Props — by sport (per-event odds endpoint only)

**NFL / NCAAF / CFL:**
`player_assists`, `player_defensive_interceptions`, `player_field_goals`, `player_kicking_points`, `player_pass_attempts`, `player_pass_completions`, `player_pass_interceptions`, `player_pass_longest_completion`, `player_pass_rush_yds`, `player_pass_rush_reception_tds`, `player_pass_rush_reception_yds`, `player_pass_tds`, `player_pass_yds`, `player_pass_yds_q1`, `player_pats`, `player_receptions`, `player_reception_longest`, `player_reception_tds`, `player_reception_yds`, `player_rush_attempts`, `player_rush_longest`, `player_rush_reception_tds`, `player_rush_reception_yds`, `player_rush_tds`, `player_rush_yds`, `player_sacks`, `player_solo_tackles`, `player_tackles_assists`, `player_tds_over`, `player_1st_td`, `player_anytime_td`, `player_last_td`
— plus `_alternate` versions of most of these (e.g. `player_pass_yds_alternate`, `player_rush_tds_alternate`, etc. — 25 alternate keys total).

**NBA / NCAAB / WNBA:**
`player_points`, `player_points_q1`, `player_rebounds`, `player_rebounds_q1`, `player_assists`, `player_assists_q1`, `player_threes`, `player_blocks`, `player_steals`, `player_blocks_steals`, `player_turnovers`, `player_points_rebounds_assists`, `player_points_rebounds`, `player_points_assists`, `player_rebounds_assists`, `player_field_goals`, `player_frees_made`, `player_frees_attempts`, `player_first_basket`, `player_first_team_basket`, `player_double_double`, `player_triple_double`, `player_method_of_first_basket`, `player_fantasy_points` (DFS only)
— plus alternates: `player_points_alternate`, `player_rebounds_alternate`, `player_assists_alternate`, `player_blocks_alternate`, `player_steals_alternate`, `player_turnovers_alternate`, `player_threes_alternate`, `player_points_assists_alternate`, `player_points_rebounds_alternate`, `player_rebounds_assists_alternate`, `player_points_rebounds_assists_alternate`, `player_fantasy_points_alternate`

**MLB:**
`batter_home_runs`, `batter_first_home_run`, `batter_hits`, `batter_total_bases`, `batter_rbis`, `batter_runs_scored`, `batter_hits_runs_rbis`, `batter_singles`, `batter_doubles`, `batter_triples`, `batter_walks`, `batter_strikeouts`, `batter_stolen_bases`, `batter_fantasy_score` (DFS only), `pitcher_strikeouts`, `pitcher_record_a_win`, `pitcher_hits_allowed`, `pitcher_walks`, `pitcher_earned_runs`, `pitcher_outs`
— plus alternates: `batter_total_bases_alternate`, `batter_home_runs_alternate`, `batter_hits_alternate`, `batter_rbis_alternate`, `batter_walks_alternate`, `batter_strikeouts_alternate`, `batter_runs_scored_alternate`, `batter_hits_runs_rbis_alternate`, `batter_singles_alternate`, `batter_doubles_alternate`, `batter_triples_alternate`, `batter_fantasy_score_alternate`, `pitcher_hits_allowed_alternate`, `pitcher_walks_alternate`, `pitcher_earned_runs_alternate`, `pitcher_strikeouts_alternate`, `pitcher_outs_alternate`

**NHL:**
`player_points`, `player_power_play_points`, `player_assists`, `player_blocked_shots`, `player_shots_on_goal`, `player_goals`, `player_total_saves`, `player_goal_scorer_first`, `player_goal_scorer_last`, `player_goal_scorer_anytime`
— plus alternates: `player_points_alternate`, `player_assists_alternate`, `player_power_play_points_alternate`, `player_goals_alternate`, `player_shots_on_goal_alternate`, `player_blocked_shots_alternate`, `player_total_saves_alternate`

**AFL** (select AU bookmakers: Sportsbet, Ladbrokes, TAB, Pointsbet, Betr):
`player_disposals`, `player_disposals_over`, `player_goal_scorer_first`, `player_goal_scorer_last`, `player_goal_scorer_anytime`, `player_goals_scored_over`, `player_marks_over`, `player_marks_most`, `player_tackles_over`, `player_tackles_most`, `player_afl_fantasy_points`, `player_afl_fantasy_points_over`, `player_afl_fantasy_points_most`, `player_clearances_over`, `player_kicks_over`, `player_handballs_over`

**Rugby League / NRL** (select AU bookmakers):
`player_try_scorer_first`, `player_try_scorer_last`, `player_try_scorer_anytime`, `player_try_scorer_over`

**Soccer** (EPL, Ligue 1, Bundesliga, Serie A, La Liga, MLS — mainly US bookmakers):
`player_goal_scorer_anytime`, `player_first_goal_scorer`, `player_last_goal_scorer`, `player_to_receive_card`, `player_to_receive_red_card`, `player_shots_on_target`, `player_shots`, `player_assists`

**Other soccer markets (non-player):**
`alternate_spreads_corners`, `alternate_totals_corners`, `alternate_spreads_cards`, `alternate_team_totals_corners`, `alternate_totals_cards`, `btts`, `btts_h1`, `correct_score`, `correct_score_h1`, `corners_1x2`, `double_chance`, `double_chance_h1`, `halftime_fulltime`, `to_qualify`

---

## 8. GET events (event list without odds — used to get `eventId`s)

**Endpoint:** `GET /v4/sports/{sport}/events?apiKey={apiKey}`

- Free (no quota cost).
- Returns `id`, `sport_key`, `sport_title`, `commence_time`, `home_team`, `away_team` for in-play + pre-match events. No odds.
- Params: `dateFormat`, `eventIds`, `commenceTimeFrom`, `commenceTimeTo`, `includeRotationNumbers`.
- Use this to get every `eventId` for a sport, then loop `/events/{eventId}/odds` to pull full/player-prop markets per game.

---

## 9. GET event odds (single event, ANY market — this is how you get "all odds" beyond featured markets)

**Endpoint:**
```
GET /v4/sports/{sport}/events/{eventId}/odds?apiKey={apiKey}&regions={regions}&markets={markets}&dateFormat={dateFormat}&oddsFormat={oddsFormat}
```

- Same params as `/odds`, plus:
  - `eventId` (required, from `/events`)
  - `includeMultipliers` — optional, for US DFS sites, includes selection multipliers
- Use this when you want anything beyond h2h/spreads/totals — since non-featured markets are too large to return for a whole sport at once, they're event-scoped only.
- Response differs slightly from `/odds`: single game returned; `last_update` lives at the **market** level (not bookmaker level, since markets update independently); relevant outcomes include a `description` field (e.g. player name for props).

**Quota cost:** `[unique markets returned] x [regions specified]`. Empty-data responses are free. If you request 5 markets but only 2 have data, you're only charged for the 2 that returned data.

---

## 10. GET event markets (discover which markets a bookmaker currently has open for an event)

**Endpoint:** `GET /v4/sports/{sport}/events/{eventId}/markets?apiKey={apiKey}&regions={regions}&dateFormat={dateFormat}`

- Costs 1 credit.
- Only shows **recently seen** market keys per bookmaker — not exhaustive; more markets appear as commence_time approaches.
- Useful to know, per event, exactly which of the giant market list in §7 is actually queryable right now, so you don't waste quota requesting markets with no data.

---

## 11. GET participants (team/player whitelist per sport)

**Endpoint:** `GET /v4/sports/{sport}/participants?apiKey={apiKey}`

- Costs 1 credit.
- Returns a whitelist of `full_name` + `id` per participant (teams for team sports, players for individual sports like tennis). Doesn't return rosters (players on a team).
- May include inactive participants.

---

## 12. Historical data (paid plans only)

Three historical endpoints mirror the live ones but take a `date` snapshot parameter (ISO8601) and return the **closest snapshot at or before** that timestamp, wrapped with `timestamp`, `previous_timestamp`, `next_timestamp` for paging back/forward in time:

| Endpoint | Mirrors | Quota cost |
|---|---|---|
| `GET /v4/historical/sports/{sport}/odds?date=...` | `/odds` | `10 x markets x regions` |
| `GET /v4/historical/sports/{sport}/events?date=...` | `/events` | 1 (free if empty) |
| `GET /v4/historical/sports/{sport}/events/{eventId}/odds?date=...` | `/events/{eventId}/odds` | `10 x unique markets x regions` |

Notes:
- Odds snapshots available from June 6, 2020 at 10-min intervals; from Sept 2022 onward, 5-min intervals.
- Additional (non-featured) markets historically available only after 2023-05-03T05:30:00Z.
- Pre-Sept 18, 2022, only decimal odds were captured — American odds before that date are back-calculated and may have small rounding differences.

---

## 13. Rate Limiting

HTTP 429 = you're bursting too fast; space requests out over a few seconds and retry.

---

## 14. Putting It All Together — Recommended Pull Strategy for "all sports, all games, all odds"

Given the API's structure, "get everything" is inherently a multi-call, multi-tier process. There is no bulk/all-in-one call — this is intentional on their end because of response-size limits on non-featured markets. Recommended approach:

1. `GET /v4/sports` (free) → get every active sport key.
2. For each sport, `GET /v4/sports/{sport}/odds?regions=us,uk,eu,au&markets=h2h,spreads,totals,outrights` → get live/upcoming games with all **featured** market odds across all regions in one shot per sport (cost = markets × regions per sport).
3. For each sport, `GET /v4/sports/{sport}/events` (free) → get eventIds.
4. For each eventId, `GET /v4/sports/{sport}/events/{eventId}/markets?regions=...` (1 credit each) → discover which non-featured markets are actually open right now for that specific event (avoids wasting quota on empty markets).
5. For each eventId + sport, `GET /v4/sports/{sport}/events/{eventId}/odds?markets=<the sport-specific list from step 4/§7>` → pull full player props / period markets / alternates for that event.
6. Optionally, `GET /v4/sports/{sport}/scores?daysFrom=1..3` to attach live/completed scores by matching the shared `id` field between scores and odds responses.
7. Optionally, `GET /v4/sports/{sport}/participants` for a clean team/player master list per sport.

**Quota-heavy warning:** Step 5 is where cost explodes — pulling every player-prop market for every event across every sport in a large region set can burn quota fast, since it's `markets × regions` per event (not per sport), and there can be dozens of relevant markets per event for popular sports like NFL/NBA/MLB/NHL/Soccer. Use step 4 (`/markets`) first to only request markets that are actually populated, and consider narrowing `regions`/`bookmakers` to what you actually need.

---

## 15. Quick Quota Cost Cheat Sheet

| Call | Cost |
|---|---|
| `/sports` | Free |
| `/sports/{sport}/events` | Free |
| `/sports/{sport}/odds` | markets × regions |
| `/sports/{sport}/scores` (no `daysFrom`) | 1 |
| `/sports/{sport}/scores?daysFrom=N` | 2 |
| `/sports/{sport}/events/{id}/odds` | unique markets × regions |
| `/sports/{sport}/events/{id}/markets` | 1 |
| `/sports/{sport}/participants` | 1 |
| `/historical/.../odds` | 10 × markets × regions |
| `/historical/.../events` | 1 (free if empty) |
| `/historical/.../events/{id}/odds` | 10 × unique markets × regions |

Empty responses (no events/no market data) never cost quota, across all endpoints.

---

## Source Pages Used
- https://the-odds-api.com/liveapi/guides/v4 — main API reference (all endpoints, parameters, examples)
- https://the-odds-api.com/sports-odds-data/betting-markets.html — full market key catalogue
- https://the-odds-api.com/sports-odds-data/bookmaker-apis.html — full bookmaker/region list