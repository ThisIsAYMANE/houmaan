# BC.GAME - Setup Instructions

## Phase 1: Foundation & Infrastructure Setup

This document provides step-by-step instructions to set up the BC.GAME development environment.

---

## Prerequisites

- Node.js 18+ installed
- Docker and Docker Compose installed
- Git installed

---

## Step 1: Install Dependencies

```bash
npm install
```

---

## Step 2: Set Up Environment Variables

1. Copy the example environment file:
```bash
cp .env.example .env
```

2. Edit `.env` and update the following if needed:
   - `DATABASE_URL` - PostgreSQL connection string
   - `NEXTAUTH_SECRET` - Generate a random secret (use `openssl rand -base64 32`)
   - Other API keys as needed

---

## Step 3: Start Docker Containers

Start PostgreSQL and Redis containers:

```bash
npm run docker:up
```

Or manually:
```bash
docker-compose up -d
```

Verify containers are running:
```bash
docker-compose ps
```

---

## Step 4: Set Up Database

1. Run database migrations:
```bash
npm run db:migrate
```

2. Seed the database:
```bash
npm run db:seed
```

3. (Optional) Reset database (drops all tables and re-runs migrations):
```bash
npm run db:reset
```

---

## Step 5: Start Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Project Structure

```
bc.game-houman/
├── app/                    # Next.js App Router
│   ├── layout.tsx          # Root layout
│   ├── page.tsx            # Home page
│   └── globals.css         # Global styles
├── components/             # React components (to be created)
├── lib/                    # Utility functions
│   ├── db.ts              # PostgreSQL client (pg Pool)
│   ├── utils.ts           # Helper functions
│   ├── errors.ts          # Error classes
│   ├── api-response.ts    # API response helpers
│   └── validation.ts      # Zod schemas
├── sql/                    # SQL migrations
│   └── migrations/         # Migration files
│       └── 001_initial_schema.sql
├── scripts/                # Database scripts
│   ├── migrate.ts         # Migration runner
│   ├── seed.ts            # Seed script
│   └── reset-db.ts        # Database reset script
├── types/                 # TypeScript types
├── docker-compose.yml      # Docker configuration
├── package.json           # Dependencies
└── tsconfig.json          # TypeScript config
```

---

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run type-check` - Type check without emitting
- `npm run db:migrate` - Run database migrations
- `npm run db:seed` - Seed database with initial data
- `npm run db:reset` - Reset database (drop all tables and re-run migrations)
- `npm run docker:up` - Start Docker containers
- `npm run docker:down` - Stop Docker containers
- `npm run docker:logs` - View Docker logs

---

## Database Connection

The database is accessible at:
- **Host**: localhost
- **Port**: 5432
- **Database**: bcgame
- **User**: bcgame
- **Password**: bcgame123 (change in production!)

Connection string format:
```
postgresql://bcgame:bcgame123@localhost:5432/bcgame?schema=public
```

---

## Redis Connection

Redis is accessible at:
- **Host**: localhost
- **Port**: 6379

---

## Troubleshooting

### Docker containers not starting
- Check if ports 5432 and 6379 are available
- Try: `docker-compose down` then `docker-compose up -d`

### Database connection errors
- Verify Docker containers are running: `docker-compose ps`
- Check environment variables in `.env`
- Ensure database URL is correct

### Database migration errors
- Ensure Docker containers are running: `npm run docker:up`
- Check database connection in `.env`
- Run `npm run db:reset` to start fresh (⚠️ This will delete all data)

### Port already in use
- Change ports in `docker-compose.yml` and `.env`
- Or stop the service using the port

---

## Next Steps

After completing Phase 1 setup:

1. ✅ Verify the home page loads at http://localhost:3000
2. ✅ Verify database tables were created (connect with a PostgreSQL client)
3. ✅ Review the database schema in `sql/migrations/001_initial_schema.sql`
4. ✅ Proceed to Phase 2: Core Layout & Navigation

---

## Development Notes

- The project uses **Next.js 14+** with App Router
- **TypeScript** for type safety
- **PostgreSQL** with direct SQL queries (using `pg` library)
- **Tailwind CSS** for styling
- **Docker** for database and Redis

---

*Last updated: December 2025*



