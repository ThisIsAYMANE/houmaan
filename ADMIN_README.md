# Admin Dashboard - boz.Topol

The admin dashboard is a **completely separate application** from the betting website. It has its own layout, styling, and components, and runs on a different port (3001). It uses the same database but has no connection to the user-facing betting website interface.

## Key Features

- **Completely Isolated**: No shared components, layouts, or styles with the main betting website
- **Separate Authentication**: Admin sessions are completely separate from user sessions
- **Own Styling**: Uses its own CSS and design system
- **Different Port**: Runs on port 3001 (main app runs on 3000)
- **Same Database**: Shares the same SQLite database for data access

## Setup

### 1. Run Database Migration

First, apply the admin role migration:

```bash
npx tsx scripts/migrate.ts
```

This will:
- Add `role` and `is_admin` columns to the `users` table
- Create `admin_sessions` table for separate admin authentication
- Add necessary indexes

### 2. Create Admin User

Create an admin user account:

```bash
npm run admin:create [email] [password] [username]
```

Example:
```bash
npm run admin:create admin@boztopol.com admin123 admin
```

If no arguments are provided, it defaults to:
- Email: `admin@boztopol.com`
- Password: `admin123`
- Username: `admin`

### 3. Start Admin Dashboard

Run the admin dashboard on port 3001:

```bash
npm run dev:admin
```

The admin dashboard will be available at: `http://localhost:3001`

**Note**: The main betting website runs on port 3000. These are completely separate applications.

## Access

1. Navigate to `http://localhost:3001/admin/login`
2. Login with your admin credentials
3. You'll be redirected to the dashboard at `/admin/dashboard`

## Architecture

### Route Group Structure

The admin portal uses Next.js route groups `(admin)` to create a completely separate layout:

```
app/
  (admin)/              # Route group - separate layout
    layout.tsx          # Admin root layout (no MainLayout, Header, Sidebar, etc.)
    admin-globals.css   # Admin-specific styles
    admin/
      login/
        page.tsx        # Admin login page
      dashboard/
        page.tsx        # Admin dashboard
```

### Complete Isolation

- **No MainLayout**: Admin pages don't use the main app's `MainLayout` component
- **No Header/Sidebar**: Admin has its own header and navigation
- **No Footer**: Admin doesn't use the main app's footer
- **No AdBanner**: Admin doesn't show promotional banners
- **Separate CSS**: Uses `admin-globals.css` instead of `globals.css`
- **Own Design System**: Uses gray-900/gray-800 color scheme instead of the betting site's colors

## Features

### Current Features

- **Authentication**: Separate admin login system
- **Dashboard**: Overview statistics including:
  - User statistics (total, active, new today)
  - Game statistics (total, active)
  - Betting statistics (total, pending, total wagered)
  - Financial statistics (deposits, withdrawals, total balance)
  - Recent activity (users and bets)

### Admin Routes

- `/admin/login` - Admin login page
- `/admin/dashboard` - Main dashboard with statistics

### API Routes

- `POST /api/admin/auth/login` - Admin login
- `GET /api/admin/auth/session` - Get current admin session
- `POST /api/admin/auth/logout` - Admin logout
- `GET /api/admin/stats` - Get dashboard statistics

## Security

- Admin sessions are separate from user sessions
- Admin sessions expire after 1 day (vs 30 days for users)
- Admin authentication is required for all admin API routes
- Admin sessions track IP address and user agent
- Admin portal is completely isolated from user-facing routes

## Database

The admin dashboard uses the same SQLite database as the main application:
- Location: `data/bcgame.db`
- Admin users are stored in the `users` table with `is_admin = 1` or `role = 'admin'`
- Admin sessions are stored in the `admin_sessions` table

## Development

### Adding New Admin Pages

1. Create pages in `app/(admin)/admin/[page-name]/page.tsx`
2. Use the `requireAdmin` middleware in API routes
3. Check for admin session token in client components
4. **Do NOT** import any components from the main app (components/layout, components/games, etc.)

### Example Admin Page

```tsx
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function AdminPage() {
  const router = useRouter()
  const [data, setData] = useState(null)

  useEffect(() => {
    const token = localStorage.getItem('admin_session_token')
    if (!token) {
      router.push('/admin/login')
      return
    }

    // Fetch data with admin token
    fetch('/api/admin/your-endpoint', {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    })
      .then(res => res.json())
      .then(data => setData(data))
  }, [])

  // Your page content - use admin-specific styling
  return (
    <div className="min-h-screen bg-gray-900">
      {/* Admin-specific content */}
    </div>
  )
}
```

## Production

For production, you can:

1. Build the application:
   ```bash
   npm run build
   ```

2. Start the admin server on port 3001:
   ```bash
   npm run start:admin
   ```

3. Configure a reverse proxy (nginx) to route `/admin/*` to port 3001

## Important Notes

- **Complete Separation**: The admin portal is a completely separate application with no dependencies on the betting website's UI components
- **Different Port**: Always runs on port 3001 (main app on 3000)
- **Own Styling**: Uses its own CSS file and design system
- **No Shared Components**: Do not import components from the main app
- **Same Database**: Shares the database for data access only
- **Separate Authentication**: Admin sessions are completely independent
