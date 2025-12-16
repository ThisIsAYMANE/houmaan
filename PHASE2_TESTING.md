# Phase 2 Testing Guide

## Quick Start

1. **Start the development server** (if not already running):
   ```bash
   npm run dev
   ```

2. **Open your browser**:
   - Navigate to: http://localhost:3000

---

## Testing Checklist

### ✅ 1. Header Component

#### Desktop View (≥ 1024px)
- [ ] **Left Section**
  - Hamburger menu button is visible
  - Clicking hamburger opens/closes sidebar
  - BC.GAME logo is visible and clickable (links to home)

- [ ] **Center Section**
  - BC Jeton card displays "BC Jeton 0.00"
  - Search bar is visible with search icon
  - Currency dropdown shows "MAD" (or selected currency)
  - "Dépôt" button is visible and green

- [ ] **Right Section**
  - Gift icon button
  - Chat icon button
  - Notifications icon with red badge dot
  - Profile dropdown with user icon

#### Mobile View (< 1024px)
- [ ] Center section (search, currency, deposit) is hidden
- [ ] Only hamburger menu, logo, and right icons visible

---

### ✅ 2. Sidebar Navigation

#### Desktop View
- [ ] Sidebar is visible on the left
- [ ] BC Jeton card appears at top of sidebar
- [ ] Navigation sections are visible:
  - Main navigation (Casino, Sports, etc.)
  - VIP Club section (collapsible)
  - Info section (collapsible)

- [ ] **Active State**
  - Current page has green background
  - Text is dark (on green background)

- [ ] **Expandable Sections**
  - Click "VIP Club" - section expands/collapses
  - Click "Info" - section expands/collapses
  - Chevron icon rotates when expanded

#### Mobile View
- [ ] Sidebar is hidden by default
- [ ] Click hamburger menu - sidebar slides in from left
- [ ] Dark overlay appears behind sidebar
- [ ] Click overlay or X button - sidebar closes
- [ ] Clicking a nav link closes sidebar

---

### ✅ 3. Footer Component

- [ ] Footer appears at bottom of page
- [ ] **5 Columns** visible on desktop:
  - Casino links
  - Sports links
  - Assistance links
  - Legal links
  - About links

- [ ] **Social Media Icons**
  - Facebook, Twitter, Instagram, YouTube, Telegram icons
  - Icons have hover effects

- [ ] **Copyright Section**
  - "© 2025 BC.GAME. Tous droits réservés."
  - "Jeu responsable - 18+"

- [ ] **Mobile View**
  - Footer stacks vertically
  - Links remain clickable

---

### ✅ 4. Navigation Testing

Test each navigation link:

- [ ] **Home** (`/`)
  - Click logo or "Home" in sidebar
  - Page loads correctly
  - Active state shows in sidebar

- [ ] **Casino** (`/casino`)
  - Click "Casino" in sidebar
  - Page loads with "Casino" heading
  - Active state shows in sidebar

- [ ] **Sports** (`/sports`)
  - Click "Sports" in sidebar
  - Page loads with "Sports Betting" heading
  - Active state shows in sidebar

- [ ] **Wallet** (`/wallet`)
  - Navigate to wallet page
  - Page loads correctly

- [ ] **Profile** (`/profile`)
  - Navigate to profile page
  - Page loads correctly

---

### ✅ 5. Profile Dropdown

- [ ] Click profile icon in header
- [ ] Dropdown menu appears with:
  - "Connexion" (Login)
  - "Inscription" (Register)
  - Divider
  - "Paramètres" (Settings)

- [ ] Click outside dropdown - it closes
- [ ] Click a menu item - navigates and closes

---

### ✅ 6. Responsive Design Testing

#### Test Breakpoints:

**Mobile (< 1024px)**
- [ ] Resize browser to mobile width
- [ ] Header: Only hamburger, logo, and right icons visible
- [ ] Sidebar: Hidden, opens as drawer
- [ ] Footer: Stacks vertically

**Desktop (≥ 1024px)**
- [ ] Resize browser to desktop width
- [ ] Header: Full header with search bar visible
- [ ] Sidebar: Always visible on left
- [ ] Footer: Multi-column layout

#### Test Interactions:
- [ ] Hamburger menu works on mobile
- [ ] Sidebar drawer opens/closes smoothly
- [ ] Overlay appears/disappears correctly
- [ ] All links work on both mobile and desktop

---

### ✅ 7. Visual Design Testing

- [ ] **Colors**
  - Dark background (`#1a1a1a`)
  - Green accents (`#00ff00`) for active states
  - Proper text contrast

- [ ] **Hover States**
  - Buttons change color on hover
  - Links change color on hover
  - Icons have hover effects

- [ ] **Active States**
  - Current page highlighted in sidebar (green background)
  - Active navigation item clearly visible

- [ ] **Spacing**
  - Proper padding and margins
  - Content doesn't overlap
  - Footer stays at bottom

---

### ✅ 8. Functionality Testing

- [ ] **Search Bar** (desktop)
  - Click search bar - focus works
  - Type text - input works
  - Green border appears on focus

- [ ] **Currency Dropdown**
  - Click dropdown - options appear
  - Can select different currency

- [ ] **BC Jeton Card**
  - Displays "BC Jeton 0.00"
  - Styled correctly with green accent

- [ ] **Notification Badge**
  - Red dot visible on bell icon
  - Positioned correctly

---

## Browser Testing

Test in multiple browsers:
- [ ] Chrome/Edge
- [ ] Firefox
- [ ] Safari (if available)

---

## Device Testing

If possible, test on:
- [ ] Mobile device (phone)
- [ ] Tablet
- [ ] Desktop

---

## Common Issues to Check

- [ ] No console errors
- [ ] No layout shifts on page load
- [ ] Smooth animations
- [ ] No overlapping elements
- [ ] Footer stays at bottom on all pages
- [ ] Sidebar doesn't cover content
- [ ] Header stays fixed at top

---

## Quick Test Commands

```bash
# Start dev server
npm run dev

# Type check
npm run type-check

# Lint
npm run lint
```

---

## Expected Results

✅ **All navigation links work**  
✅ **Active states show correctly**  
✅ **Responsive design works on mobile and desktop**  
✅ **All components render without errors**  
✅ **Hover and click interactions work**  
✅ **Footer stays at bottom**  
✅ **Header stays fixed at top**  

---

*Testing Guide for Phase 2: Core Layout & Navigation*

