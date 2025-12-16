# Website Design Documentation

## Overview
This document contains notes and descriptions about the website design based on provided screenshots. Focus is on components and design elements.

---

## Design System

### Color Palette
- **Primary Background**: Dark grey/black (#1a1a1a or similar)
- **Secondary Background**: Dark grey for sidebars and cards
- **Elevated Background**: Lighter dark grey for cards (BC Jeton, Application, Award badges)
- **Primary Accent**: Vibrant green (#00ff00 or similar) - used for buttons, highlights, active states, and interactive elements
- **Secondary Accent**: Purple - used for live match cards and special sections
- **Live Indicator**: Red - used for "En Live" text and live match indicators
- **Text Primary**: White
- **Text Secondary**: Light grey
- **Notification Badges**: Red/orange for alerts
- **Email Links**: Green for emphasis
- **Award Accents**: Golden/yellow for award badges and decorative elements
- **Bonus Banners**: Yellow background for promotional bonus information
- **Odds Indicators**: Red for decreasing odds (downward triangle), green for increasing odds (upward triangle)
- **Match Status**: Blue for match time/status indicators
- **Medals**: Golden/yellow for achievement medals, purple for medal symbols
- **Social Icons**: White/light grey on dark circular backgrounds

### Typography
- **Logo**: Stylized "BC" in green with "GAME" in white
- **Headings**: Bold, white text
- **Body Text**: Regular weight, light grey/white
- **Language**: French interface

---

## Layout Structure

### Overall Layout
- **Layout Type**: Fixed header + left sidebar + scrollable main content area
- **Grid System**: Horizontal scrollable rows for game cards
- **Responsive**: Cards arranged in horizontal carousels with navigation arrows

---

## Page Structure and Organization

### Page Types

The website is organized into distinct page types, each with its own structure and content organization:

#### 1. Home/Main Page
**Purpose**: Landing page showcasing all game types and promotions

**Structure:**
- **Top Section**: Promotional banner carousel (3-4 large banners)
- **Search Bar**: Game search functionality
- **Category Tabs**: Horizontal filter tabs (Lobby, BC Originaux, Jeux populaires, etc.)
- **Multiple Game Section Carousels**:
  - "Continuer à jouer" (Continue Playing)
  - "BC Originaux" (BC Originals)
  - "Jeux populaires" (Popular Games)
  - "Grandes victoires récentes" (Recent Big Wins)
  - Additional category-specific carousels

**Categories Available:**
- Lobby (All games)
- BC Originaux (BC Originals)
- Jeux populaires (Popular Games)
- Machines à sous (Slot Machines)
- Casino en direct (Live Casino)
- Jeux télévisés (TV Games)
- Jeux de table (Table Games)
- Blackjack
- Roulette
- Baccarat
- And more...

#### 2. Casino Page
**Purpose**: Dedicated casino games browsing

**Structure:**
- **Top Section**: Casino-specific promotional banners
- **Search Bar**: Casino game search
- **Category Tabs**: Casino-specific filters
- **Sidebar Navigation**: Expanded casino categories
  - Favoris (Favorites)
  - Récent (Recent)
  - BC Originaux
  - BC Exclusif
  - Jeux populaires
  - Machines à sous
  - Casino en direct
  - Fonctionnalité Buy-in
  - Nouveautés
  - Jeux Burst
  - Poker
  - Bingo
  - Jeux de table
  - Blackjack

**Game Section Carousels:**
- Multiple horizontal carousels organized by category
- Each carousel contains related games
- "Tous" (All) button and navigation arrows for each section

**Categories:**
- BC Originaux (BC Originals)
- BC Exclusif (BC Exclusive)
- Jeux populaires (Popular Games)
- Machines à sous (Slots)
- Casino en direct (Live Casino)
- Jeux télévisés (TV Games)
- Jeux de table (Table Games)
- Nouveautés (New Games)
- Poker
- Bingo

#### 3. Sports Page
**Purpose**: Sports betting interface

**Structure:**
- **Top Section**: Sports-specific promotional content
- **Search Bar**: Sports event search
- **Primary Navigation Tabs**: 
  - "TEMPS FORTS" (Highlights)
  - "UN PROGRAMME" (A Program)
  - "FLUX DE PARIS" (Betting Stream)
- **Sport Category Filters**: Horizontal tabs (Football, eFootball, Basketball, etc.)
- **Live Events Section**: "En Live" with live match cards
- **Upcoming Events**: Scheduled matches

**Categories:**
- Football
- eFootball
- eFootball : Volta
- Basketball
- Hockey sur glace
- Handball
- Volley-ball
- eTennis
- Tennis
- Cricket
- And more...

**Sub-categories within Sports:**
- Football (Soccer)
- Tennis
- Basketball
- Cricket
- FIFA
- Football Américain (American Football)
- Hockey sur glace (Ice Hockey)
- Baseball
- Handball
- Course (Horse Racing)

---

## Carousel Components

### Promotional Banner Carousel (Top of Page)

**Location**: Top of main content area, below header

**Structure:**
- Large rectangular banners (2-3 visible at once)
- Horizontal scrolling carousel
- Navigation arrows (left/right) for browsing
- Auto-play capability (likely)

**Banner Types:**
1. **UFC Banner**
   - Features muscular fighter (Conor McGregor) with glowing effects
   - Golden coins graphics
   - Text: "UFC ASSURANCE KO"
   - Green "OUER MAINTENANT" (BET NOW) button

2. **Deposit Bonus Banner**
   - Green background with golden coins illustration
   - "180% Bonus" text prominently displayed
   - Two buttons: primary green "Dépôsez Maintenant" + text link "En savoir plus"
   - "S'inscrire -> Dépôt -> Obtenez un bonus" (Register -> Deposit -> Get a bonus) text

3. **Anniversary Banner**
   - Brown/gold background with fireworks
   - Cartoon character (red alligator in suit) holding champagne glass
   - Multi-tiered birthday cake illustration
   - Text: "ANNIVERSAIRE 2025 C'EST LA FÊTE CHEZ BC.GAME!"
   - Green "OUER MAINTENANT" button

4. **Lottery Banner**
   - Brown/gold background with coins and gifts
   - Cartoon character (red alligator) with gift box and coin
   - "NEW PLAYER" badge in top-right corner
   - Text: "JACKPOT LOTERIE GRATUITE" (Free Lottery Jackpot)
   - Green "OUER MAINTENANT" button

**Design Notes:**
- Full-width or large format banners
- Eye-catching visuals and illustrations
- Clear call-to-action buttons
- Consistent button styling (green, rounded)
- Carousel allows multiple promotions to be displayed
- Smooth transitions between banners
- Responsive sizing for different screen sizes

### Game Section Carousels

**Location**: Throughout main content area, organized by category

**Structure:**
- Section title on left
- "Tous" (All) button and navigation arrows on right
- Horizontal scrollable row of game cards
- Each carousel contains 6-10+ game cards

**Carousel Sections on Home Page:**
1. **"Continuer à jouer" (Continue Playing)**
   - Games user has recently played or favorited
   - Mix of game types

2. **"BC Originaux" (BC Originals)**
   - Proprietary BC.GAME games
   - Games like LIMBO, CRASH TRENBALL, PLINKO, etc.

3. **"Jeux populaires" (Popular Games)**
   - Most played games
   - Mix of providers and game types

4. **"Grandes victoires récentes" (Recent Big Wins)**
   - Showcases recent player wins
   - Filter tabs: Tous, BC Originaux, Machines à sous, Casino en direct
   - Win amounts displayed with currency

5. **"Machines à sous" (Slot Machines)**
   - Slot machine games
   - Various providers

6. **"Casino en direct" (Live Casino)**
   - Live dealer games
   - Dealer photos, provider branding

7. **"Jeux télévisés" (TV Games)**
   - Game show style games
   - Live hosts/dealers

8. **"Nouveautés" (New Games)**
   - Recently added games
   - "NEW" badges on cards

**Carousel Sections on Casino Page:**
- Similar structure to home page
- More casino-focused categories
- Additional sections like:
  - "BC Exclusif" (BC Exclusive)
  - "Jeux Burst" (Burst Games)
  - "Poker"
  - "Bingo"
  - "Jeux de table" (Table Games)

**Carousel Navigation:**
- Left/right arrow buttons
- "Tous" (All) button links to full category page
- Horizontal scrolling
- Smooth transitions

**Design Notes:**
- Consistent card dimensions within each carousel
- Clear section titles
- Easy navigation with arrows
- "Tous" button provides quick access to full category

### Category Organization

**Hierarchical Structure:**

**Level 1: Main Page Types**
- Home/Main
- Casino
- Sports
- Lottery
- Promotions
- VIP Club
- etc.

**Level 2: Categories within Each Page**
- **Casino Categories:**
  - BC Originaux
  - BC Exclusif
  - Jeux populaires
  - Machines à sous
  - Casino en direct
  - Jeux télévisés
  - Jeux de table
  - Poker
  - Bingo
  - Blackjack
  - Roulette
  - Baccarat

- **Sports Categories:**
  - Football
  - eFootball
  - Basketball
  - Tennis
  - Cricket
  - Hockey sur glace
  - Baseball
  - Handball
  - Course (Horse Racing)
  - And more...

**Level 3: Sub-categories and Filters**
- Provider filters (Evolution, Pragmatic Play, HACKSAW, etc.)
- Game type filters
- Special features (Buy-in, Burst, etc.)

**Category Navigation:**
- **Sidebar**: Main category navigation with expandable sections
- **Top Tabs**: Quick category switching within page
- **Breadcrumbs**: (Likely present for deep navigation)
- **Filter Dropdowns**: Additional filtering options

---

## Component Design

### 1. Header Bar (Top Navigation)

**Structure:**
- Full-width bar across the top
- Dark grey background
- Fixed position

**Left Section:**
- Hamburger menu icon (three horizontal lines)
- BC.GAME logo (green "BC." with crown/starburst icon + white "GAME")
- Animated burst of stars above logo (when visible)

**Center Section:**
- **BC Jeton Card** (in header): Dark grey rectangular card with:
  - Green token icon
  - Token value: "$0.0076"
  - Percentage change: "1.79%" (red for decrease, green for increase)
  - Right arrow icon indicating clickable
- Search icon (magnifying glass)
- Currency display: "0,00 MAD" with dropdown arrow
- Green "Dépôt" (Deposit) button - prominent CTA

**Right Section:**
- Gift icon with notification badge (red circle with "1")
- Chat bubble icon
- Bell icon (notifications)
- User profile icon (dark creature avatar with party hat) with dropdown
- Search icon (magnifying glass) - may appear on far right

**Design Notes:**
- Clean, minimal design
- Green button stands out as primary action
- Notification badges use red for visibility
- BC Jeton card integrated into header for quick access
- Multiple search icon placements for accessibility

---

### 2. Left Sidebar Navigation

**Structure:**
- Vertical sidebar on the left
- Dark grey background
- Fixed or sticky positioning
- Scrollable if content exceeds viewport

**Top Section:**
- BC Jeton display: Shows token value "$0.0076" with percentage change (green/red indicator) and right arrow icon

**Navigation Items:**
Each item contains:
- Green icon (card, trophy, ticket, chart, tag, crown, gift, scroll, handshake, chat bubble, scale, shield, document, info)
- Text label in white
- Dropdown arrow (when applicable)
- Badges: "New +" tags, "+180%" indicators

**Active State:**
- Active item highlighted with green background
- Green icon and text
- Upward-pointing chevron (when expanded)

**Navigation Items Include:**
- **Casino** (can be active) - card icon
- **Favoris** (Favorites) - star icon
- **Récent** (Recent) - clock icon
- **BC Originaux** (BC Originals) - stylized 'b' icon, right arrow
- **BC Exclusif** (BC Exclusive) - flame icon
- **Jeux populaires** (Popular Games) - flame icon
- **Machines à sous** (Slots) - slot machine icon
- **Casino en direct** (Live Casino) - camera icon
- **Fonctionnalité Buy-in** (Buy-in Feature) - star icon
- **Nouveautés** (New) - rocket icon
- **Jeux Burst** (Burst Games) - explosion icon
- **Poker** - poker chip icon
- **Bingo** - bingo card icon
- **Jeux de table** (Table Games) - dice icon
- **Blackjack** - card icon

**Sections:**
1. **Main Navigation**: Casino, Sports, Anniversaire, Loterie, Contrats à terme, Promotions
2. **VIP Club Section**: VIP Club, Bonus, Centre de quêtes, Parrainage, Forum
3. **Info Section**: Jeux prouvé-équitable, Responsable Jeu d'argent, Blog, Informations sur les paris

**Design Notes:**
- Consistent icon + text pattern
- Green icons for visual consistency
- Active state clearly indicated with green background
- Badges use green background with white text
- Clear visual hierarchy through spacing
- Chevron indicators show expandable sections

---

### 3. Game Section Carousel Component

**Structure:**
- Horizontal scrollable carousel container
- Section title on the left
- "Tous" (All) button and left/right navigation arrows on the right
- Multiple game cards arranged horizontally
- Smooth scrolling functionality

**Carousel Controls:**
- **Left Arrow**: Scrolls carousel left (shows previous games)
- **Right Arrow**: Scrolls carousel right (shows next games)
- **"Tous" Button**: Links to full category page/grid view
- **Scrollbar**: Horizontal scrollbar (when applicable)

**Usage:**
- Used throughout Home page and Casino page
- Each carousel represents a game category
- Multiple carousels stacked vertically on page
- Consistent structure across all carousels

### 4. Game Category Cards (Within Carousels)

**Structure:**
- Individual cards within horizontal carousels
- Part of game section carousel component

**Card Design:**
- Rectangular cards with rounded corners
- Game thumbnail/illustration as background
- Overlay information:
  - Game title (white, bold)
  - Provider label (e.g., "JEUX ORIGINAL", "Evolution", "HACKSAW")
  - Player count with icon (e.g., "406" players)
  - Multiplier information (e.g., "500x", "999x") when applicable

**Card Variations:**
- **BC Originals**: Green/purple backgrounds, rocket/explosion graphics, multiplier displays
- **Live Casino**: Dark backgrounds with dealer photos, provider branding
- **Slot Machines**: Themed illustrations (western, fantasy, holiday, etc.)
- **Sports**: Green "► En direct" (Live) badges, team names, scores, betting odds

**Detailed Card Design Examples:**
- **CRASH TRENBALL**: Vibrant purple background with radial gradient, white explosion cloud, golden "999x" 3D text, falling coin graphic
- **TIREUR DE BULLES**: Dark teal-green background, cartoon green alligator character in bubble, white play button overlay, "Bubble Shooter" text
- **LIMBO**: Bright gradient green background, stylized white rocket launching with yellow/orange flames, "500x" multiplier in yellow

**Design Notes:**
- Consistent card dimensions
- High contrast text overlays for readability
- Provider badges for game categorization
- Player count creates social proof
- Gradient backgrounds for visual depth
- Multiplier badges prominently displayed
- Play button overlays for direct access

---

### 5. Sports Betting Cards

**Structure:**
- Horizontal cards for live events
- Green "► En direct" (Live) indicator badge

**Content Layout:**
- League/competition name (e.g., "Football • Premier League")
- Team names and current score
- Match time/status (e.g., "1ère mi-temps")
- Betting odds displayed as buttons (1, Match nul, 2)
- "+6" or "+1" button for additional betting options

**Design Notes:**
- Green accent for live status
- Odds displayed as clickable buttons
- Clear typography hierarchy
- Score prominently displayed

---

### 6. Lottery/Keno Cards

**Structure:**
- Horizontal grid of lottery game cards
- Each card shows:
  - Country flag icon
  - Game name (e.g., "Marruecos Keno 20/80")
  - Prize amount (e.g., "22 947,32 MAD")
  - Countdown timer (e.g., "00h : 00m : 00s")
  - Green "Pari maintenant" (Bet now) button

**Design Notes:**
- Flag icons for country identification
- Large prize amounts for emphasis
- Countdown creates urgency
- Consistent button styling

---

### 7. Live Casino Game Cards

**Structure:**
- Horizontal scrollable grid
- Thumbnail shows:
  - Female dealer photo
  - Game title
  - Provider name (e.g., "Evolution", "Pragmatic Play")
  - Player count

**Design Notes:**
- Professional dealer photos
- Provider branding for trust
- Player count for popularity indication

---

### 8. Bingo Game Cards

**Structure:**
- Horizontal scrollable row
- Themed illustrations (Halloween, pirate, carnival, etc.)
- Game title
- Provider branding
- Player count

**Design Notes:**
- Colorful, themed artwork
- Distinct visual identity per game
- Consistent information layout

---

### 9. Recent Wins Section

**Structure:**
- Section title: "Grandes victoires récentes"
- Filter tabs: "Tous", "BC Originaux", "Machines à sous", "Casino en direct"
- Horizontal scrollable cards

**Card Content:**
- Game thumbnail
- Game title
- Player name (sometimes truncated)
- Win amount with currency flag/icon

**Design Notes:**
- Social proof through visible wins
- Filter tabs for categorization
- Currency indicators for international users

---

### 10. Game Activity Table

**Structure:**
- Tabbed interface: "Dernier pari", "Rouleau Haut", "Concours de paris"
- Table with columns:
  - "Jeu" (Game) - with icon
  - "Joueur" (Player)
  - "Montant du pari" (Bet amount) - with currency icon
  - "Multiplicateur" (Multiplier)
  - "Bénéfice" (Profit) - with currency icon, color-coded (green for positive, red for negative)

**Design Notes:**
- Clean table layout
- Color coding for profit/loss
- Currency icons for multi-currency support
- Scrollable for long lists

---

### 11. Payment Methods Section

**Layout:**
- Horizontal row of payment method logos
- Includes: Apple Pay, Mastercard, Visa, Google Pay, PicPay, cryptocurrencies (Bitcoin, Ethereum, Tron, Solana, Dogecoin, Cardano, Binance Coin, etc.)

**Design Notes:**
- Logo grid layout
- Multiple payment options displayed
- Cryptocurrency emphasis

---

### 12. Floating Support Button

**Design:**
- Green circular button
- Headphone/chat icon
- Fixed position (bottom-right corner)

**Design Notes:**
- Always accessible
- Green for visibility
- Simple icon-based design

---

### 13. Information/Content Sections

**Structure:**
- Large text blocks for informational content
- White headings on dark background
- Body text in light grey/white

**Sections:**

**"Casino en ligne crypto" Section:**
- Large heading in white
- Descriptive paragraph text detailing platform features
- Mentions: 1000+ games, live dealers, original games, sports betting, instant deposits, low fees, fast withdrawals, provably fair systems, mobile compatibility, bonuses

**"Aidez-nous à améliorer votre expérience" (Feedback) Section:**
- Heading in white
- Feedback encouragement text
- Email addresses highlighted in green:
  - `feedback@bcgame.com` (green text)
  - `security@bcgame.com` (green text)
- Security reporting information

**Design Notes:**
- Long-form content for trust building
- Green email links for emphasis
- Clear typography hierarchy
- Adequate line spacing for readability

---

### 14. Award Badges Section

**Structure:**
- Horizontal row of award badges
- Slightly lighter dark grey background
- Golden laurel wreath design on each badge

**Badge Design:**
- Rectangular cards with rounded corners
- Golden decorative border (laurel wreath)
- Award text in center:
  - Award name (e.g., "BEST ON MOBILE")
  - Category (e.g., "SIGMA AFRICA")
  - Year (e.g., "2024")

**Awards Displayed:**
- "BEST ON MOBILE SIGMA AFRICA 2024"
- "BEST CRYPTO CASINO SIGMA EUROPE 2024"
- "BEST CASINO OPERATOR SIGMA EUROPE 2023"
- "CRYPTO GAME PLATFORM OF THE YEAR SIGMA ASIA 2023"
- "CRYPTO CASINO PLATFORM OF THE YEAR SIGMA AMERICA 2022"
- "BLOCKCHAIN GAMING PLATFORM OF THE YEAR AIBC AMERICA 2022"
- "CRYPTO CASINO OF THE YEAR SIGMA EUROPE 2022"
- "CRYPTO CASINO OF THE YEAR AFFPAPA 2022"

**Design Notes:**
- Social proof through industry recognition
- Consistent badge design
- Horizontal scrollable layout
- Golden accents for prestige

---

### 15. Footer Component

**Structure:**
- Multi-column layout (5 columns)
- Dark grey background
- Full-width section at bottom of page

**Column Layout:**

**Column 1: "Casino"**
- Bold white heading
- List of links in light grey:
  - Accueil Casino
  - Machines à sous
  - Casino en direct
  - BlackJack
  - Roulette
  - Baccarat

**Column 2: "Sports"**
- Bold white heading
- List of links:
  - Accueil Sport
  - En direct
  - Règlements
  - Informations sur les paris sportifs (with external link icon)

**Column 3: "Assistance"**
- Bold white heading
- Links for support and features:
  - Club VIP
  - Parrainage
  - Promotions
  - Loterie
  - Parrainez un ami
  - BC Magasin (with external link icon)

**Column 4: "Assistance/Mentions légales"**
- Bold white heading
- Legal and support links:
  - Licences
  - Centre d'aide
  - FAQ
  - Politique de confidentialité
  - Conditions d'utilisation
  - Lutte contre le blanchiment de capitaux (LCB)
  - Support en ligne
  - Ressources de conception (with external link icon)

**Column 5: "Assistance"**
- Bold white heading
- Additional links:
  - Nouveautés (with external link icon)
  - Rejoignez-nous (with external link icon)
  - Contacts professionnels
  - Bureau d'aide (with external link icon)
  - Vérifier un représentant
  - Vérifiez ce site

**Design Notes:**
- Organized information architecture
- External link icons for clarity
- Consistent typography
- Clear column separation

---

### 16. Social Media Icons Section

**Structure:**
- Grid layout of social media icons
- Located below footer columns
- Section heading: "Rejoignez notre communauté mondiale" (Join our global community)

**Icons Displayed:**
- Telegram
- Twitter (X)
- Facebook
- Discord
- WhatsApp
- Instagram

**Design Notes:**
- Circular or square icon buttons
- Consistent sizing
- Brand colors for each platform
- Encourages community engagement

---

## Filtering and Search Functionality

### Filtering by Page Type

#### Casino Page Filtering

**Category Tabs (Top Navigation):**
- Horizontal row of filter tabs
- Active tab highlighted in green
- Tabs include:
  - Lobby (All games)
  - BC Originaux
  - Jeux populaires
  - Machines à sous
  - Casino en direct
  - Jeux télévisés
  - Jeux de table
  - Blackjack
  - Roulette
  - Baccarat
  - More categories available via scroll

**Sidebar Category Filters:**
- Favoris (Favorites) - shows favorited games
- Récent (Recent) - shows recently played games
- BC Originaux - filters to original games
- BC Exclusif - filters to exclusive games
- Jeux populaires - filters to popular games
- Machines à sous - filters to slot machines
- Casino en direct - filters to live casino
- And more...

**Advanced Filtering (Explorer/Grid View):**
- **Sort Dropdown**: "Trier par: Populaire" (Sort by: Popular)
  - Options: Popular, New, Alphabetical, etc.
- **Provider Dropdown**: "Prestataires: Tous" (Providers: All)
  - Filter by game provider (Evolution, Pragmatic Play, HACKSAW, etc.)

**Filter Behavior:**
- Filters apply to all visible game carousels
- Multiple filters can be combined
- Active filters are visually indicated
- "Clear filters" option available

#### Sports Page Filtering

**Primary Navigation Tabs:**
- "TEMPS FORTS" (Highlights) - featured/important matches
- "UN PROGRAMME" (A Program) - scheduled matches
- "FLUX DE PARIS" (Betting Stream) - live betting feed

**Sport Category Filters:**
- Horizontal row of sport tabs
- Active tab: Green background with white text and icon
- Inactive tabs: White text on dark background
- Categories:
  - Football
  - eFootball
  - eFootball : Volta
  - Basketball
  - Hockey sur glace
  - Handball
  - Volley-ball
  - eTennis
  - Tennis
  - And more...

**Live/Upcoming Filter:**
- "En Live" section for live matches
- Upcoming matches section
- Filter by match status

**Additional Filters:**
- League/Competition filters
- Date filters
- Odds format selector

### Search Functionality

#### Casino Game Search

**Search Bar Location:**
- Top of main content area
- Below promotional banners
- Prominent placement

**Search Features:**
- **Input Field**: "Rechercher des jeux" (Search for games)
- **Magnifying Glass Icon**: Visual search indicator
- **Active State**: Green border when focused
- **Validation**: Requires minimum 3 characters
- **Real-time Results**: Results update as user types

**Search Results:**
- Game cards matching search query
- Filtered by game title, provider, category
- Results displayed in grid or list format

**Suggested Terms:**
- "Suggéré" (Suggested) section below search
- Popular game names as clickable tags
- Quick access to frequently searched games
- Examples: The Luxe, Wanted Dead or a Wild, Blackjack, etc.

#### Sports Event Search

**Search Bar Location:**
- Top of sports page content
- Below header navigation
- "Rechercher" (Search) label

**Search Features:**
- **Input Field**: Search for teams, leagues, competitions
- **Close Button**: "Fermer" (Close) to clear search
- **Empty State**: 
  - Large magnifying glass icon with football
  - Text: "Vous cherchez quelque chose en particulier ?" (Are you looking for something in particular?)
  - Helpful prompt for users

**Suggested Categories:**
- Horizontal row of clickable tags
- Popular competitions and events:
  - Ligue des Champions UEFA (UEFA Champions League)
  - Copa Libertadores
  - Tirs au but (Penalty Shootout)
  - Coupe d'Angleterre (FA Cup)
  - Coupe du Roi (Copa del Rey)
  - ATP Finales NextGen
  - And more...

**Search Results:**
- Matching matches/events displayed
- Filtered by team names, league names, competition names
- Results show match cards with betting options

**Quick Filter Icons:**
- Row of circular icons above search prompt
- Quick filtering by sport type
- Basketball, Football, American Football, etc.

---

## Authentication Flow

### Login Modal (Contextual)

**Trigger:**
- **NOT a separate page**
- Appears as modal overlay when user attempts to:
  - Place a bet (sports or casino)
  - Access account-restricted features
  - Make a deposit
  - Withdraw funds
  - Access VIP features

**Modal Behavior:**
- Overlays current page content
- Darkens background content
- Centered on screen
- Cannot interact with background content while modal is open
- Must login or close modal to continue

**Login Options:**
- Password login (email/phone/username + password)
- One-time code (OTP)
- Social login (Google, X, Telegram, MetaMask, WalletConnect, Line, Steam)

**Post-Login:**
- Modal closes automatically
- User returns to page they were on
- Action they attempted is completed (bet placed, deposit initiated, etc.)
- User session maintained

**Design Notes:**
- Non-intrusive but required for protected actions
- Quick access to multiple login methods
- Seamless user experience
- No page navigation required

---

## User Account Pages and Information

### User Account Structure

**Access Points:**
- User profile icon in header (dropdown menu)
- Direct links from sidebar navigation
- Contextual access from various pages

### Account Pages and Sections

#### 1. User Profile ("Mon profil")

**Access**: Profile icon dropdown → "Mon profil"

**Content:**
- **User Information:**
  - Avatar (customizable character with party hat)
  - Username
  - User ID
  - VIP Level badge (VIP0, VIP1, etc.)
  - Likes/Favorites count

- **Médailles (Medals):**
  - Achievement medals display
  - 8 different medal types
  - Progress tracking
  - "Détails >" link for more info

- **Statistiques (Statistics):**
  - Total des gains (Total winnings)
  - Nombre total de paris (Total number of bets)
  - Total des mises (Total wagers)
  - "Détails >" link for detailed statistics

**Actions:**
- Edit profile (pencil icon)
- View detailed statistics
- View medal details

#### 2. Portefeuille (Wallet)

**Access**: Profile dropdown → "Portefeuille"

**Content:**
- Current balance display
- Multiple currency support
- Transaction history
- Deposit/Withdraw options
- Crypto wallet addresses

#### 3. Retirer (Withdraw)

**Access**: Profile dropdown → "Retirer"

**Content:**
- Withdrawal form
- Available balance
- Withdrawal methods
- Minimum withdrawal amounts
- Processing times
- Withdrawal history

#### 4. Acheter des crypto-monna (Buy Crypto)

**Access**: Profile dropdown → "Acheter des crypto-monna"

**Content:**
- Crypto purchase options
- Supported cryptocurrencies
- Payment methods
- Exchange rates
- Purchase history

#### 5. Transactions

**Access**: Profile dropdown → "Transactions"

**Content:**
- Complete transaction history
- Filter by type (deposit, withdraw, bet, win)
- Filter by date
- Filter by currency
- Transaction details
- Export options

#### 6. Historique des paris (Bet History)

**Access**: Profile dropdown → "Historique des paris"

**Content:**
- All past bets
- Bet details (game, amount, outcome)
- Win/loss information
- Filter by date
- Filter by game type
- Filter by status (pending, won, lost)

#### 7. Vue d'ensemble Rollover (Rollover Overview)

**Access**: Profile dropdown → "Vue d'ensemble Rollover"

**Content:**
- Bonus rollover requirements
- Progress tracking
- Remaining rollover amount
- Time remaining
- Eligible bets

#### 8. Club VIP (VIP Club)

**Access**: Profile dropdown → "Club VIP" or Sidebar → "VIP Club"

**Content:**
- Current VIP level
- VIP benefits and perks
- Progress to next level
- VIP exclusive games
- VIP support
- Special promotions

#### 9. Coffre-fort Pro (Pro Vault)

**Access**: Profile dropdown → "Coffre-fort Pro"

**Content:**
- Secure storage for funds
- Separate from main balance
- Transfer in/out options
- Security features

#### 10. Parrainage (Referral)

**Access**: Profile dropdown → "Parrainage" or Sidebar → "Parrainage"

**Content:**
- Referral link/code
- Referred users list
- Referral bonuses earned
- Referral statistics
- Share options

#### 11. Paramètres principaux (Main Settings)

**Access**: Profile dropdown → "Paramètres principaux"

**Content:**
- Account settings
- Security settings
- Notification preferences
- Language selection
- Currency selection
- Theme selection (Dark/Light)
- Privacy settings
- Responsible gaming settings

#### 12. Dépôt (Deposit)

**Access**: 
- Header "Dépôt" button
- Profile dropdown → "Portefeuille" → Deposit
- Contextual from various pages

**Content:**
- Deposit modal with multiple methods:
  - Crypto deposits (Smart Deposit, MetaMask, Direct Wallet, Manual)
  - Fiat currency deposits
  - Payment method selection
  - Deposit address/QR code
  - Deposit history
  - Bonus information

#### 13. Déconnexion (Logout)

**Access**: Profile dropdown → "Déconnexion"

**Action:**
- Logs user out
- Clears session
- Returns to public homepage

### User Information Display

**Header Display:**
- Balance: "0,00 MAD" (or selected currency)
- Currency selector dropdown
- BC Jeton value and percentage change

**Profile Icon:**
- Customizable avatar
- Party hat decoration
- Notification badges (if applicable)

**Quick Access:**
- Deposit button (always visible in header)
- Gift icon (notifications/bonuses)
- Bell icon (notifications)
- Chat icon (support)

### Account Navigation Pattern

**Primary Access:**
- Profile icon dropdown (12 menu items)
- Sidebar navigation (VIP Club, Bonus, etc.)
- Header buttons (Deposit, etc.)

**Secondary Access:**
- Contextual links from game pages
- Links from promotional banners
- Links from transaction pages

**Design Notes:**
- Consistent navigation pattern
- Quick access to all account features
- Clear visual hierarchy
- Organized by function (wallet, betting, settings, etc.)

---

### 17. Search Bar Component

**Structure:**
- Horizontal input field
- Located in main content area, below promotional banners
- Dark grey background matching site theme

**Design Elements:**
- Magnifying glass icon on the left
- Placeholder text: "Rechercher des jeux" (Search for games)
- Text input field with rounded corners
- Full-width or contained width

**Design Notes:**
- Prominent placement for easy access
- Icon provides clear visual cue
- Consistent with overall dark theme
- Accessible and user-friendly

---

### 18. Category Tabs/Filter Bar

**Structure:**
- Horizontal row of clickable tabs
- Located below search bar in main content area
- Dark grey background

**Tab Design:**
- Text labels with optional icons
- Active tab: Green underline and/or green text/icon
- Inactive tabs: White text on dark background
- Right arrow chevron indicates more categories available

**Categories Include:**
- "Lobby" (can be active)
- "BC Originaux" (BC Originals)
- "Jeux populaires" (Popular Games)
- "Machines à sous" (Slots)
- "Casino en direct" (Live Casino)
- "Jeux télévisés" (TV Games)
- "Jeux de table" (Table Games)
- "Blackjack"
- "Roulette"
- "Bac" (Baccarat, truncated)
- More categories available via scroll

**Design Notes:**
- Clear active state indication
- Horizontal scrolling for many options
- Consistent typography
- Easy filtering of game content

---

### 19. TV Games Section

**Structure:**
- Section title: "Jeux televises" (TV Games)
- Horizontal carousel with "Tous" button and navigation arrows
- Game cards with live dealer/host imagery

**Card Design:**
- Prominent image of live dealer or game host (often female)
- Dark background with colorful game-specific graphics
- Game title overlaid
- Provider logo (e.g., "Evolution", "BC.GAME")
- Player count with icon
- "Live" badge when applicable

**Game Examples:**
- Lightning Storm Live
- XXXTREME Lightning Roulette Live
- Lightning Roulette
- Crazy Time
- Ice Fishing Live
- Football Studio
- Crazy Coin Flip Live

**Design Notes:**
- Focus on live dealer/host imagery
- Professional presentation
- Clear provider branding
- Player count for social proof

---

### 20. Language Selection Modal

**Structure:**
- Centered modal overlay
- Dark grey background with rounded corners
- Modal backdrop darkens main content

**Header:**
- Two tabs: "Langue" (Language) and "Afficher en devise" (Display in currency)
- Active tab: Green underline
- Close button: White 'X' in dark circular background (top-right)

**Search Bar:**
- Input field labeled "Chercher" (Search)
- Magnifying glass icon on the left
- Allows filtering of language list

**Language List:**
- Scrollable list of languages
- Each language with:
  - Language name (e.g., "English", "Français", "Español")
  - Radio button on the right
- Selected language: Dark green background, green filled radio button
- Unselected languages: Standard background, empty radio button

**Languages Include:**
- English
- Indian English
- Tiếng việt (Vietnamese)
- Indonesian
- 日本語 (Japanese)
- 한국어 (Korean)
- Français (French)
- Español (Spanish)
- Español (México)
- Filipino
- And more (scrollable)

**Design Notes:**
- Standard modal pattern
- Tabbed interface for multiple settings
- Search functionality for long lists
- Clear selected state indication
- Accessible close button

---

### 21. Theme Toggle Component (Detailed)

**Structure:**
- Horizontal, rounded rectangular container
- Two side-by-side options
- Integrated into sidebar settings

**Active State - "Sombre" (Dark):**
- Background: Slightly lighter dark grey rounded rectangle
- Icon: White crescent moon (left side)
- Text: "Sombre" in white, bold
- Indicates currently selected theme

**Inactive State - "Lumière" (Light):**
- Background: Darker grey, blends with overall background
- Icon: Light grey sun with rays (left side)
- Text: "Lumière" in light grey
- Indicates non-selected option

**Design Notes:**
- Clear visual distinction between active/inactive
- Icon-based for quick recognition
- Rounded container for modern look
- High contrast for active state
- Accessible and intuitive

---

### 22. Deposit Modal

**Structure:**
- Large centered modal overlay
- Dark grey background with rounded corners
- Backdrop darkens main content
- Standard modal pattern

**Header:**
- Title: "Dépôt" (Deposit) in white, centered
- Close button: White 'X' in dark circular background (top-right)

**Tabbed Navigation:**
- Two tabs: "Crypto" (active, green underline) and "Devise" (Currency)
- Standard tab pattern

**"Dépôt intelligent" (Smart Deposit) Section:**
- Label: "Dépôt intelligent" in white
- Cryptocurrency icons: Horizontal row of colorful circular icons (BNB, ETH, BTC, DOGE, XRP, etc.)
- Bonus indicator: "+300" displayed alongside icons

**Direct Deposit Options:**
- **"Dépôt avec MetaMask" Button:**
  - Rectangular button
  - MetaMask fox logo on left
  - Text: "Dépôt avec MetaMask" in white
  - Right arrow icon on right
- **"Déposer directement depuis un autre portefeuille" Button:**
  - Similar rectangular button
  - Wallet icon on left
  - Text: "Déposer directement depuis un autre portefeuille"
  - Right arrow icon on right

**Separator:**
- Horizontal line with "Or" (Or) centered in light grey

**"Dépôt manuel" (Manual Deposit) Section:**
- **Collapsible Header**: "Dépôt manuel" with downward chevron (expandable, currently expanded)
- **Cryptocurrency Selection**: Horizontal row of circular icons (ETH, BTC, USDT, USDC) plus "Plus >" for more options
- **Currency Addition Link**: "Vous n'avez pas vu votre devise ? Ajoutez-la ici" with "Ajoutez-la ici" in green
- **Deposit Currency Dropdown**: "Devise de dépôt" label, shows "MATIC" with Polygon logo
- **CoinNetwork Dropdown**: "Choisissez CoinNetwork" label, shows "ERC20 (Old Matic)"
- **Help Link**: "How to Deposit Crypto?" in green, underlined, with question mark icon
- **Bonus Banner**: Yellow rectangular banner with star icon, text: "Obtenez un bonus supplémentaire 180% sur un dépôt minimum de 45,37205 MATIC" (bonus percentage and amount in green)
- **Deposit Address Display**:
  - Label: "Adresse du dépôt" (Deposit Address)
  - Large QR code (black and white)
  - Alphanumeric wallet address string
  - Copy icon

**Design Notes:**
- Clear step-by-step deposit flow
- Multiple deposit methods (smart, direct wallet, manual)
- QR code for easy mobile scanning
- Bonus information prominently displayed
- Collapsible sections for organization
- Consistent button styling

---

### 23. User Profile Dropdown Menu

**Structure:**
- Dark grey rectangular panel
- Rounded corners
- Extends vertically from profile icon
- Overlay/modal-like behavior

**Layout:**
- Vertical list of menu items
- Each item: Icon on left, white text label on right
- Consistent spacing

**Menu Items:**
1. **Portefeuille** (Wallet) - wallet icon
2. **Retirer** (Withdraw) - money bag icon
3. **Acheter des crypto-monna** (Buy crypto) - dollar sign with upward arrow
4. **Transactions** - Bitcoin symbol icon
5. **Historique des paris** (Bet history) - clock icon
6. **Vue d'ensemble Rollover** (Rollover overview) - bar chart icon
7. **Club VIP** (VIP Club) - crown icon
8. **Coffre-fort Pro** (Pro Vault) - safe/box icon
9. **Parrainage** (Referral) - gear/cog icon
10. **Mon profil** (My profile) - person icon
11. **Paramètres principaux** (Main settings) - hexagon/gear icon
12. **Déconnexion** (Logout) - door with arrow pointing out

**Design Notes:**
- Clean, organized list
- Simple line-based icons
- Consistent icon + text pattern
- All items in white text for readability
- Logical grouping of account-related actions

---

### 24. Enhanced Search Interface

**Structure:**
- Search bar with active/focused state
- Validation message below
- Suggested terms section

**Search Bar (Active State):**
- Horizontal rectangular input field
- Rounded corners
- Dark grey background (slightly lighter than page)
- **Vibrant green border** (indicates active/focused state)
- Magnifying glass icon on left (light grey)
- Placeholder text: "Rechercher des jeux" (Search for games) in light grey

**Validation Message:**
- Centered below search bar
- Light grey text
- Message: "La recherche nécessite au moins 3 caractères." (The search requires at least 3 characters)

**Suggested Terms Section:**
- Heading: "Suggéré" (Suggested) in bold white
- Grid of rounded rectangular buttons/tags
- Dark grey background (slightly lighter than main)
- Light grey text
- Two-row layout

**Suggested Terms Include:**
- The Luxe H.V.
- Wanted Dead or a Wild
- Le Bandit
- First Person Blackjack
- Baccarat
- Blackjack
- The Count
- Wild Bounty Showdown
- Roulette
- Spinman
- Miami Mayhem
- Clover Coins 3x3
- Big Bass Boxing Bonus Round

**Design Notes:**
- Green border clearly indicates active search state
- Validation message provides helpful guidance
- Suggested terms offer quick access to popular searches
- Clickable tags for easy selection
- Clean, organized layout

---

### 25. Explorer/Game Grid View

**Structure:**
- Alternative view mode for browsing games
- Grid layout instead of carousels
- Enhanced filtering and sorting

**Header:**
- "Explorer" text at top
- Close button: Dark circular button with white 'X' (top-right)

**Search and Filter Bar:**
- "Casino" dropdown menu on left
- Search input field with magnifying glass icon
- Placeholder: "Rechercher des jeux" (Search for games)

**Category Tabs:**
- Horizontal row of tabs
- Active tab: "Tous les jeux" (All games) with vibrant green background
- Other tabs: "BC Originaux", "Jeux populaires", "Machines à sous", "Casino en direct", "Jeu de table", "Nouveautés", "Poker", "Fonctionnalité Bi"
- Right arrow indicates more tabs available

**Sorting and Filtering Controls:**
- "Trier par: Populaire" (Sort by: Popular) dropdown
- "Prestataires: Tous" (Providers: All) dropdown

**Game Cards Grid:**
- Responsive grid layout
- Multiple columns
- Each card contains:
  - Visual thumbnail (vibrant, game-specific graphics)
  - Game title (white, prominent)
  - Provider/Category label (e.g., "JEUX ORIGINAL", "Evolution", "HACKSAW", "PG", "TaDa", "PRAGMATIC PLAY")
  - Player count/activity indicator (person icon + number)
  - Special badges (multipliers like "999x", "2.1k", "420x", "500x" or "Achat Bonus")

**Design Notes:**
- Grid layout allows browsing many games at once
- Enhanced filtering and sorting options
- Consistent card design across all games
- Special badges highlight features (multipliers, bonus buy)
- Provider labels for game categorization
- Player counts for social proof

---

## Sports Betting Flow and Bet Slip

### Live Match Detail Page

**Purpose**: Detailed view of a live sports match with comprehensive betting options and real-time match tracking

**Structure:**
- **Top Section**: Horizontal scrollable row of other live matches (mini cards)
- **Main Match Display**: Featured live match with detailed information
- **Right Sidebar**: Match tracker with live visualization
- **Betting Markets**: Multiple tabs with various betting options

**Live Matches Overview (Top Row):**
- Horizontal scrollable section
- Small cards showing:
  - Red "live" indicator with minute count
  - Team names
  - Current scores
  - Match time (e.g., "55' 2ème mi-temps")
- Example: "2 Manchester United FC" vs "3 AFC Bournemouth"

**Featured Match Header:**
- League name: "Angleterre Premier League"
- Live indicator: Red "live" badge with match time (e.g., "55' 2ème mi-temps")
- Current score: "2 : 3" prominently displayed
- First half score: "1ère mi-temps 2:1"

**Team Information:**
- **Team 1 (Home)**: Manchester United FC
  - Team logo
  - Team name
  - Small colored squares indicator (0, 2, 4) - likely representing stats
- **Team 2 (Away)**: AFC Bournemouth
  - Team logo
  - Team name
  - Small colored squares indicator (0, 1, 2)

**Betting Market Tabs:**
- Horizontal row of tabs for different betting categories
- Active tab highlighted in green
- Tabs include:
  - "Principal 17" (Main - 17 markets) - Active
  - "Créateur de pari 13" (Bet Builder - 13 markets)
  - "Buts 9" (Goals - 9 markets)
  - "Statistique 21" (Statistics - 21 markets)
  - "Propriétés de joueur 8" (Player Props - 8 markets)
  - "Extras 7" (Extras - 7 markets)
  - "Handicaps 4" (Handicaps - 4 markets)

**Betting Options Display:**
- Cards for each betting option
- Each card shows:
  - Selection name (e.g., "Manchester United FC", "Match nul")
  - Odds displayed prominently
  - Clickable to add to bet slip

**Betting Market Examples:**
1. **1x2 (Full-Time Result):**
   - "Manchester United FC" (odds 3.6)
   - "Match nul" (Draw)
   - "AFC Bournemouth" (odds 2.1)

2. **Double Chance:**
   - "Manchester United FC ou Match nul" (odds 1.7)
   - "Manchester United FC ou AFC Bournemouth" (odds 1.35)
   - "Match nul ou AFC Bournemouth" (odds 1.28)

3. **Total (Over/Under Goals):**
   - "Plus de 5.5" (Over 5.5 goals, odds 1.16)
   - "Plus de 6" (Over 6 goals, odds 1.3)

### Match Tracker (Right Sidebar)

**Structure:**
- Dedicated section for real-time match visualization
- Fixed or sticky positioning on right side

**Components:**
- **Header**: "✔ Tracker" title
- **Scoreboard**: 
  - Match time: "2ème mi-temps | 54:24"
  - Table showing:
    - Team abbreviations (MAN, BOU)
    - Scores for 1st half, 2nd half, and total
    - Example: MAN: 2, BOU: 3

- **Live Pitch Visualization:**
  - Simplified green football pitch with white lines
  - Animated player dots:
    - Red dots (Manchester United)
    - Blue dots (AFC Bournemouth)
  - White circle indicating ball position
  - Ball position labeled (e.g., "BOU")
  - Timeline above pitch showing match events with icons and minute markers
  - Event text (e.g., "ENTRÉE DE B" - Entry of B)

- **Interactive Controls (Below Pitch):**
  - Play/pause icon
  - Statistics icon
  - Team lineup icon
  - Match events icon
  - Head-to-head icon
  - Favorites icon
  - Full-screen icon

**Design Notes:**
- Real-time updates during live matches
- Visual representation of match state
- Interactive controls for additional information
- Color-coded teams for easy identification

### Bet Slip (Coupon)

**Access:**
- "Coupon" button in floating action bar (bottom)
- Appears as overlay/sidebar when opened
- Mobile-first design

**Structure:**
- Dark grey background
- Rounded corners on all elements
- Tabbed interface at top
- Bet entry cards
- Quick action buttons
- Bet summary section
- Primary action button

**Top Navigation Tabs:**
- Three tabs in horizontal row:
  - "Simple" (Single bet) - Active (green underline, white text)
  - "Pari combiné" (Combined bet/Accumulator) - Light grey text
  - "Système" (System bet) - Light grey text

**Bet Slip Card:**
- Dark grey rectangular card with rounded corners
- Each bet selection appears as a card

**Card Components:**
- **Close Button**: Light grey 'X' in circular light grey background (top-left)
  - Removes bet from slip

- **Match Details:**
  - Football icon
  - Red "((•))" live indicator
  - Selection type: "Match nul" (Draw)
  - Match participants: "Manchester United FC vs AFC Bournemouth"
  - Betting market: "1x2"

- **Odds Display:**
  - Odds value: "3.1" in green
  - Small green upward triangle (indicating odds increased)
  - Visual indication of odds movement

- **Bet Amount Input:**
  - Black rectangular input field
  - White text displaying amount (e.g., "5 $")
  - User can enter or adjust stake
  - Currency symbol displayed

- **"MAX" Button:**
  - Dark grey button with "MAX" in white text
  - Positioned to right of bet amount input
  - Sets maximum allowable bet amount

**Quick Bet Amount Buttons:**
- Row of four dark grey, rounded rectangular buttons
- White text labels: "1", "10", "50", "100"
- Quick selection of common bet amounts
- One-click bet amount setting

**Bet Summary:**
- **"Mise Totale" (Total Stake):**
  - Label in white text (left)
  - Value in white text (right)
  - Example: "5 $"
  - Matches entered bet amount

- **"GAINS POTENTIELS" (Potential Winnings):**
  - Label in white text (left)
  - Calculated value in white text (right)
  - Example: "15.5 $"
  - Automatically calculated based on odds and stake

**Action Buttons:**
- **"PLACER UN PARI" (PLACE A BET):**
  - Large, prominent button
  - Vibrant green background
  - Rounded rectangular shape
  - White text: "PLACER UN PARI"
  - Primary call-to-action to finalize bet
  - Positioned prominently at bottom

- **"CODE DU PARI" (BET CODE):**
  - Dark grey, rounded rectangular button
  - White text: "CODE DU PARI"
  - Positioned below primary action button
  - For generating or entering bet code
  - Secondary action

**Bottom Bar/Footer:**
- Dark grey bar at bottom
- **Trash Can Icon**: Light grey icon on left
  - Clears entire bet slip
  - Removes all bets
- **Settings Icon**: Light grey gear icon
  - Label: "Réglages de cotes" (Odds settings)
  - Light grey text
  - Access to betting preferences
- **Status Indicator**: Small green dot on far right
  - Possibly indicates bet slip status or notifications

**Branding:**
- BC.GAME logo centrally placed below bet slip card
- Stylized green 'BC' forming checkmark/leaf icon
- "GAME" in white text

**Betting Flow:**
1. User browses live matches or upcoming events
2. Clicks on a match to view details
3. Selects betting market tab (Principal, Buts, etc.)
4. Clicks on desired betting option (odds button)
5. Bet is added to bet slip (Coupon)
6. User adjusts bet amount (input field or quick buttons)
7. Reviews bet summary (stake and potential winnings)
8. Clicks "PLACER UN PARI" to place bet
9. If not logged in, login modal appears
10. After login, bet is placed and confirmed

**Design Notes:**
- Mobile-first design approach
- Clear visual hierarchy
- Green for primary actions and positive indicators
- Real-time odds updates with visual indicators
- Quick bet amount selection for convenience
- Automatic calculation of potential winnings
- Easy bet removal with close button
- Settings access for customization

---

### 26. Live Sports Betting Interface

**Structure:**
- Main content area focused on live sports events
- Tabbed navigation at top
- Category filters below
- Match cards in grid/list layout

**Primary Navigation Tabs:**
- "TEMPS FORTS" (Highlights) - Active, green underline, small green square icon
- "UN PROGRAMME" (A Program)
- "FLUX DE PARIS" (Betting Stream)

**Category Filters:**
- Horizontal scrollable row of sport tabs
- Active tab: Green background with white text and icon
- Inactive tabs: White text on dark background
- Examples: Football, eFootball, eFootball : Volta, Basketball, Hockey sur glace, Handball, Volley-ball, eTennis

**Live Match Cards (Purple Background):**
- Distinct purple background for live matches
- Cartoon crocodile mascots representing teams
- Team logos and names
- Current score prominently displayed
- Match time/status (e.g., "49' 1ère mi-temps")
- Live indicator: Red "((•))" icon
- Betting odds as buttons (1, Match nul, 2)
- Additional icons: Play, TV, Statistics
- Star icon for favorites

**Upcoming Match Cards (Dark Grey Background):**
- Darker grey background, more subdued
- Similar information layout
- "Demain" (Tomorrow) or "Aujourd'hui" (Today) with time
- Team logos and names
- Betting odds displayed

**Design Notes:**
- Purple creates distinction for live events
- Mascots add brand personality
- Clear visual separation between live and upcoming
- Odds presented as interactive buttons

---

### 27. "En Live" Section

**Structure:**
- Dedicated live betting section
- Red "((•)) En Live" heading
- Sport category tabs below heading

**Sport Category Tabs:**
- Horizontal row of tabs
- Active tab: Green background, white text, sport icon
- Inactive tabs: White text on dark background
- Examples: Football (active), BC.GAME: Originaux, eFootball, Tennis, Basketball

**Live Match Betting Cards:**
- Rounded corner rectangles
- Slightly lighter dark grey background
- Card header with:
  - League name (e.g., "Angleterre Premier League")
  - Match time/status (e.g., "36' 1ère mi-temps")
  - Small icons (play, TV, stats)
  - Star icon for favorites
  - Red "((•))" live indicator
- Team information:
  - Team logos
  - Team names
  - Current scores
- Betting options (1x2):
  - Three buttons: "1" (Home), "Match nul" (Draw), "2" (Away)
  - Odds displayed on each button
  - Dropdown arrow for more markets

**Design Notes:**
- Red accent for live status creates urgency
- Card-based layout for easy scanning
- Clear betting option presentation
- Icons provide quick access to additional features

---

### 28. Sub-Header Navigation (Sport Icons)

**Structure:**
- Horizontal scrollable menu below main header
- Circular icon buttons
- Sport-specific icons

**Icons:**
- Football
- Tennis
- Basketball
- eSport
- Dota 2
- Cricket
- Volleyball
- Ice Hockey
- Boxing
- "HER LINES" (highlighted)

**Design Notes:**
- Quick access to sport categories
- Circular icons for visual consistency
- Red notification badges on some icons (e.g., football with "6")
- Horizontal scrolling for many options

---

### 29. Floating Action Bar

**Structure:**
- Horizontal bar fixed at bottom-right
- Contains action buttons and toggles

**Components:**
- **"Coupon" Button**: Green background, white text, document icon
- **"PARI ÉCLAIR" (Flash Bet) Toggle**: Toggle switch with lightning bolt icon, green when active
- **Support Button**: Green circular button with headphone icon (separate from action bar)

**Design Notes:**
- Quick access to betting slip/coupon
- Flash bet feature for quick betting
- Always accessible at bottom
- Green accent for primary actions

---

### 30. Left Sidebar - Vertical Sport Icons

**Structure:**
- Vertical column of circular icons
- Represents different sports/game categories

**Icons Include:**
- Home
- Live
- Favorites
- Document
- Football
- Basketball
- Tennis
- Various other sports
- Trophy
- Dice
- Chart
- Wallet
- Gift

**Active State:**
- Active icon: Solid green circular background
- Inactive icons: Outline or grey background

**Design Notes:**
- Quick navigation to sport categories
- Visual indication of active section
- Consistent circular icon design
- Vertical stacking for space efficiency

---

### 31. User Profile Modal ("Mon profil")

**Structure:**
- Centered modal overlay
- Dark grey background with rounded corners
- Standard modal pattern

**Header:**
- Title: "Mon profil" (My profile) in white, centered
- Left arrow icon (back navigation) on left
- Pencil icon (edit) on right

**User Information Section:**
- **Likes/Favorites**: Red heart icon with count "0"
- **Avatar**: Circular avatar of dark creature with colorful party hat
- **VIP Badge**: "VIP0" badge displayed below avatar
- **Username**: "ma3alla" in bold white text
- **User ID**: "Identifiant d'utilisateur:101079157" below username

**"Médailles 0" (Medals 0) Section:**
- Section title: "Médailles 0" with medal icon
- "Détails >" (Details >) link on right (green)
- Horizontal row of eight golden medal icons
- Each medal has different purple symbol (document, star, gift, thumbs up, hexagon, flame, crown)
- All medals appear inactive/unearned (indicated by "0" count)

**"Statistiques" (Statistics) Section:**
- Section title: "Statistiques" with bar chart icon
- "Détails >" (Details >) link on right (green)
- **Two-column layout:**
  - "Total des gains" (Total winnings) with diamond icon, value "0"
  - "Nombre total de paris" (Total number of bets) with casino chip icon, value "0"
- **Single row:**
  - "Total des mises" (Total wagers) with stack of coins icon, value "0,00 MAD"

**Design Notes:**
- Clean, organized profile information
- Visual representation of achievements (medals)
- Statistics displayed with icons for clarity
- Green links for "Détails" actions
- Consistent with overall dark theme

---

### 32. Sports Navigation Dropdown

**Structure:**
- Vertical dropdown menu
- Dark grey background
- Expandable/collapsible section

**Header:**
- Background: Slightly lighter dark grey or greenish-dark grey
- Icon: Vibrant green stylized basketball/globe icon (left)
- Text: "Sports" in bold vibrant green (active selection)
- Indicator: Light grey upward caret (^) on right (collapse/expand)

**Sport Category List:**
Each item contains:
- Light grey sport-specific icon (left)
- White text label (right)
- Consistent dark grey background

**Sports Include:**
- **Football** - Soccer ball icon (hexagonal/pentagonal patterns)
- **Tennis** - Tennis ball icon with characteristic lines
- **Basketball** - Basketball icon with seam lines
- **Cricket** - Two crossed cricket bats icon
- **FIFA** - Soccer ball icon (similar to Football)
- **Football Américain** - American football icon with laces
- **Hockey sur glace** - Hockey puck icon
- **Baseball** - Baseball icon with visible stitching
- **Handball** - Handball icon with lines
- **Course** - Horse head icon (horse racing)

**Design Notes:**
- Clear visual identification through distinct sport icons
- Active state clearly indicated with green
- Consistent icon + text pattern
- Clean, functional navigation
- Good color contrast for readability

---

### 33. Live Sports Betting Card (Detailed)

**Structure:**
- Rectangular card with rounded corners
- Dark grey background
- Live match information display

**Match Header:**
- **League Information**: "Angleterre Premier League" in white text, preceded by small football icon
- **Match Status**: "41' 1ère mi-temps" (41' 1st half) in blue text
- **Live Indicators:**
  - Red play button icon (video feed)
  - Blue T-shirt icon (team info)
  - Blue three-horizontal-lines icon (statistics/lineups)
  - Red "((•))" icon on far right (live indicator)
  - Star icon above live indicator (favorite)

**Team Information and Score:**
- **Team 1 (Home)**: "Manchester United FC" in white
  - Club crest on left (red shield with yellow devil holding trident)
- **Team 2 (Away)**: "AFC Bournemouth" in white
  - Club crest on left (black and red shield with football and cherry)
- **Current Score**: "1" in light grey rounded rectangular badge for each team (1-1 tie)

**Betting Odds Section (1x2):**
- **Label**: "1x2" in light grey (full-time result market)
- **Odds Buttons**: Three dark grey rectangular buttons with rounded corners
  - **Home Win (1)**: "1" label, odds "1.72", red downward triangle (decreasing odds)
  - **Draw (Match nul)**: "Match nul" label, odds "3.5", green upward triangle (increasing odds)
  - **Away Win (2)**: "2" label, odds "4.9", green upward triangle (increasing odds)
- **More Options Button**: Dark grey button with downward arrow icon (more betting markets)

**Color Coding:**
- **Red**: Live indicator, score badges, decreasing odds
- **Blue**: Match status icons
- **Green**: Increasing odds
- **Yellow/Gold**: Team crests

**Design Notes:**
- Color-coded odds changes (red down, green up)
- Multiple live indicators for different features
- Clear team identification with crests
- Prominent score display
- Easy access to more betting options

---

### 34. Sports Search Interface

**Structure:**
- Search interface for sports events
- Empty state with prompt
- Suggested categories section

**Search Bar:**
- Large input field labeled "Rechercher" (Search)
- "Fermer" (Close) button on far right

**Suggested Categories/Events:**
- Horizontal row of clickable tags/buttons
- Each tag has icon and text
- Examples:
  - "Ligue des Champions UEFA" (UEFA Champions League) with globe icon
  - "Copa Libertadores" with globe icon
  - "Tirs au but (10 tirs)" (Penalty Shootout) with BC.GAME logo
  - "Coupe d'Angleterre (2x6 min)" (FA Cup) with England flag icon
  - "Coupe du Roi (2x6 min)" (Copa del Rey) with Spain flag icon
  - "ATP Finales NextGen" with tennis logo

**Central Search Prompt (Empty State):**
- Large magnifying glass icon with football/soccer ball inside
- Text: "Vous cherchez quelque chose en particulier ?" (Are you looking for something in particular?)
- Centered in content area

**Sport Icons (Quick Filter):**
- Row of circular icons above search prompt
- Represents different sports (basketball, helmet, football/soccer, American football)
- Quick filtering option

**Bottom Elements:**
- **Odds Format**: "FORMAT DE COTES" (Odds Format) with "Décimale" (Decimal) button
- **Disclaimer**: French text block about information quality and reliability (indicative purposes only)
- **Floating Buttons**:
  - Green rectangular "Coupon" button with upward arrow
  - Green rectangular "PARI ÉCLAIR" (Flash Bet) button with lightning bolt icon
  - Green circular headphone icon (support)

**Design Notes:**
- Clear empty state with helpful prompt
- Suggested categories for quick access
- Quick filter icons for sports
- Legal disclaimer for transparency
- Floating action buttons always accessible

---

### 35. Login Modal ("Se connecter")

**Structure:**
- Large centered modal overlay
- Dark grey background with rounded corners
- Standard modal pattern

**Header:**
- Title: "Se connecter" (Login) in white, bold, centered
- Close button: White 'X' in dark circular background (top-right)

**Tabbed Navigation:**
- Two tabs: "Mot de passe" (Password) and "Code à usage unique" (One-time code)
- Active tab: "Mot de passe" with green underline
- Inactive tab: Standard appearance

**Input Fields:**
- **Email/Phone/Username Field**: Placeholder "Adresse e-mail / Numéro de téléphone / Nom d'utili" (Email address / Phone number / Username)
- **Password Field**: "Mot de passe" (Password) label
  - Eye icon on right (toggle password visibility)

**Forgot Password Link:**
- "Mot de passe oublié?" (Forgot password?) text link
- Aligned right below password field
- Green text (clickable)

**Primary Login Button:**
- Large rectangular button
- Vibrant green background
- White text: "Se connecter" (Login)
- Centrally placed below input fields

**Signup Prompt:**
- Text: "Nouveau sur BC.GAME? Créer un compte" (New to BC.GAME? Create an account)
- "Créer un compte" highlighted in green (clickable link)

**Social Login Section:**
- Heading: "Connectez-vous directement avec" (Connect directly with)
- Horizontal row of circular icons:
  - Google (G icon)
  - X (Twitter icon)
  - Telegram (paper plane icon)
  - MetaMask (fox icon)
  - WalletConnect (wallet icon)
  - Line (chat bubble icon)
  - Steam (steam icon)
- Icons: White/light grey on dark circular backgrounds

**Alternative Login Button:**
- "Se connecter avec un mot de passe" (Connect with a password)
- Person icon and lock icon
- Dark background with white text

**Design Notes:**
- Multiple login methods (password, OTP, social)
- Clear visual hierarchy
- Green for primary actions and links
- Social icons in consistent circular format
- Password visibility toggle for UX
- Easy signup flow access

---

### 36. Expanded Sidebar Components

**BC Jeton Card:**
- Prominent rectangular card with lighter dark grey background
- Displays:
  - "BC Jeton" label with green token icon
  - Token value: "$0.0076"
  - Percentage change: "1.79%" (red for decrease, green for increase)
  - Right arrow indicating clickable
- Design: Card format with rounded corners, elevated appearance

**Application Promotion Card:**
- Distinct rectangular card with lighter dark grey background
- Title: "Application" in white
- Description: "Débloquez du plaisir avec des fonctionnalités exclusives" (smaller white text)
- Embedded mobile phone mockup on the right showing app interface
- Design: Promotional card format, visual preview of mobile app

**Settings Section:**
- **Language Selector**: "Français" with globe icon and right arrow
- **Currency Selector**: "MAD" with Moroccan flag icon and right arrow
- **Theme Toggle**: Two side-by-side buttons
  - "Sombre" (Dark): Moon icon, lighter background when active
  - "Lumière" (Light): Sun icon, standard dark background when inactive

**Design Notes:**
- Cards use elevated background for distinction
- Settings use consistent icon + text pattern
- Theme toggle shows active state clearly
- Mobile app preview adds visual interest

---

### 37. Footer Copyright Section

**Structure:**
- Bottom of page
- Full-width section
- Dark background

**Content:**
- Copyright text: "Droits d'auteur ©2025 Twocent Technology Limited TOUS LES DROITS RÉSERVÉS"
- Currency conversion: "1BTC=786 265,04 MAD"
- Light grey text on dark background

**Design Notes:**
- Standard footer information
- Legal compliance
- Currency conversion for transparency
- Minimal, unobtrusive design

---

## Design Patterns

### Navigation Patterns
- **Horizontal Carousels**: All game sections use horizontal scrolling with arrow navigation
- **Tabbed Interfaces**: Used for filtering (game types, bet history, sports categories, modal settings)
- **Dropdown Menus**: Navigation items with sub-menus use dropdown arrows
- **Multi-Level Navigation**: Header, sub-header (sport icons), sidebar, and footer navigation
- **Circular Icon Navigation**: Vertical and horizontal sport icon menus
- **Category Filtering**: Horizontal tabs for game category filtering
- **Search Functionality**: Global search and modal search for settings

### Card Patterns
- **Consistent Dimensions**: Game cards maintain uniform size
- **Overlay Information**: Text and badges overlay on game thumbnails
- **Color-Coded Cards**: Purple for live matches, dark grey for upcoming/standard matches
- **Elevated Cards**: BC Jeton and Application cards use lighter background for emphasis
- **Hover States**: Likely interactive (not visible in static screenshots)

### Button Patterns
- **Primary Actions**: Green buttons (Deposit, Bet Now, Play Now, Coupon)
- **Secondary Actions**: Text links or outlined buttons
- **Badge Buttons**: Small badges for notifications and indicators
- **Toggle Switches**: Theme toggle and Flash Bet toggle with active/inactive states
- **Odds Buttons**: Betting odds displayed as clickable buttons

### Visual Hierarchy
- **Prominent CTAs**: Green buttons stand out
- **Section Titles**: Bold, white text
- **Player Counts**: Small icons with numbers for social proof
- **Provider Badges**: Small labels for game categorization
- **Status Indicators**: Red for live matches, green for active states
- **Color Coding**: Purple for live events, green for active/interactive elements

### Branding Elements
- **Mascots**: Cartoon crocodile characters used in live match cards
- **Logo Variations**: BC.GAME logo with party hat, confetti, starburst graphics, animated star bursts
- **Celebratory Theme**: Party hats, confetti, fireworks in promotional content

### Modal Patterns
- **Overlay Modals**: Centered modals with darkened backdrop
- **Tabbed Modals**: Multiple settings categories within single modal
- **Searchable Lists**: Filter functionality within modals for long lists
- **Radio Button Selection**: Single selection from list with clear visual indication
- **Complex Forms**: Multi-step forms with collapsible sections (deposit modal)
- **QR Code Integration**: QR codes for quick scanning (crypto deposits)

### Dropdown Patterns
- **Profile Dropdown**: User menu with icon + text items
- **Currency Dropdowns**: Multiple dropdowns for currency and network selection
- **Sort/Filter Dropdowns**: Sorting and filtering options in grid view
- **Expandable Navigation**: Sports navigation with expandable sub-menus
- **Category Dropdowns**: Expandable sections with caret indicators

### View Modes
- **Carousel View**: Horizontal scrolling carousels for game sections
- **Grid View**: Responsive grid layout for browsing all games (Explorer mode)
- **Toggle Between Views**: Different layouts for different browsing needs

### Authentication Patterns
- **Multiple Login Methods**: Password, OTP, and social login options
- **Social Login Icons**: Circular icons for various platforms
- **Password Visibility Toggle**: Eye icon for showing/hiding password
- **Signup Integration**: Easy transition from login to signup

---

## UI Elements

### Icons
- **Style**: Green, outlined or filled
- **Usage**: Navigation, actions, status indicators
- **Consistency**: Same icon set throughout
- **Sport Icons**: Circular icons for sport categories (football, basketball, tennis, etc.)
- **Status Icons**: Play, TV, statistics, favorites (star), live indicator (red "((•))")

### Badges
- **Notification Badges**: Red circles with numbers
- **Status Badges**: "New +", "+180%", "EXCLUSIVE"
- **Live Badges**: Green "► En direct", Red "((•)) En Live"
- **Country Flags**: Used in lottery/keno cards and currency selectors

### Typography Hierarchy
- **Large Headings**: Section titles
- **Medium Text**: Game titles, card labels
- **Small Text**: Player counts, provider names, metadata
- **Email Links**: Green text for feedback and security emails

### Spacing
- **Card Gaps**: Consistent spacing between cards
- **Section Spacing**: Clear separation between sections
- **Padding**: Adequate padding in cards and buttons
- **Column Spacing**: Footer columns have consistent gaps

### Interactive Elements
- **Theme Toggle**: Side-by-side buttons (Dark/Light) with icon indicators
- **Toggle Switches**: Flash Bet toggle with lightning bolt icon
- **Dropdown Arrows**: Right arrows for expandable sections
- **External Link Icons**: Square with arrow for external links
- **Navigation Arrows**: Left/right arrows for carousel navigation
- **Modal Close Button**: White 'X' in dark circular background
- **Radio Buttons**: Circular selection indicators (filled green when selected)
- **Search Input**: Text field with magnifying glass icon
- **Tab Indicators**: Green underline for active tabs
- **Collapsible Sections**: Chevron icons for expandable content
- **QR Codes**: For quick crypto deposit scanning
- **Copy Icons**: For copying deposit addresses
- **Cryptocurrency Icons**: Circular icons representing different cryptocurrencies
- **Password Visibility Toggle**: Eye icon for showing/hiding password
- **Odds Change Indicators**: Red downward triangles (decreasing), green upward triangles (increasing)
- **Caret Indicators**: Upward/downward carets for expandable sections
- **Edit Icons**: Pencil icon for editing profile
- **Back Navigation**: Left arrow icon in modals

### Branding Elements
- **Mascots**: Cartoon crocodile characters in sports betting cards
- **Logo Graphics**: Party hat on "G", confetti, starburst, pinwheel graphics
- **Illustrations**: Game-specific artwork, promotional graphics, themed designs

---

*Phase 4 Complete - Documentation fully restored with all components, patterns, and design elements*

*Last updated: December 15, 2025 - Complete documentation restored in 4 phases*

