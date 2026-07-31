# Freedive

A self-hosted, mobile-first training log and breath-hold table runner for freedivers.

Freedive combines session logging, personal-best tracking, progression charts, and configurable CO₂ training tables in an installable Progressive Web App. It is designed for individual divers and small groups who want to own their training data.

> [!WARNING]
> Breath-hold training can cause loss of consciousness. Never practise apnea in water alone. Use appropriate supervision and follow guidance from a qualified freediving instructor.

## Features

### Training log

- Log STA, DYN, DNF, CWT, FIM, and CNF sessions
- Record time, distance, or depth according to discipline
- Capture location, environment, buddy, water temperature, equalisation notes, and subjective rating
- Edit and delete your own sessions

### Progress tracking

- Automatically calculate personal bests from logged sessions
- View running PB progression by discipline
- See training totals and recent activity on the dashboard

### Breath-hold tables

- Generate a CO₂ table from 50% of your logged STA PB
- Run a coach-style U-table with 30-second breathe-ups and open holds
- Build fully custom tables with timed and maximum holds
- Configure every round's breathe time, hold duration, and optional open-hold target
- Reorder, duplicate, add, and remove rounds
- Receive generated audio cues without external audio files
- Keep the display awake during a run where the Wake Lock API is supported
- Save completed and partial runs to history

### Templates

- Save any generated or custom table as a reusable template
- Run saved templates without reconfiguring them
- Share templates with other users on the same instance

### PWA

- Installable on supported mobile and desktop browsers
- Responsive phone, tablet, and desktop interface
- Static application assets available offline
- Authenticated pages are deliberately excluded from persistent service-worker caching

## Tech stack

- [Next.js](https://nextjs.org/) App Router
- React and TypeScript
- Tailwind CSS
- PostgreSQL
- Prisma ORM
- Recharts
- `jose` JWT sessions and bcrypt password hashing
- Workbox through `@ducanh2912/next-pwa`
- Docker and Docker Compose

## Run with Docker

### Requirements

- Docker Desktop or Docker Engine with Compose
- OpenSSL, or another secure random-secret generator

### 1. Clone the repository

```bash
git clone https://github.com/harunmansor/freedive.git
cd freedive
```

### 2. Configure the environment

```bash
cp .env.example .env
openssl rand -base64 32
```

Paste the generated value into `AUTH_SECRET` in `.env`:

```env
AUTH_SECRET="your-generated-secret"
AUTH_COOKIE_SECURE="false"
```

`AUTH_COOKIE_SECURE=false` is required when accessing the bundled Compose deployment directly over HTTP, including through a LAN IP address.

### 3. Start the application

```bash
docker compose up --build -d
```

Open [http://localhost:3000](http://localhost:3000).

To access it from another device on the same network, find the host machine's LAN address and open:

```text
http://YOUR_LAN_IP:3000
```

PostgreSQL is exposed only on `127.0.0.1:5432`, not to other LAN devices.

### Useful Docker commands

```bash
# Follow application logs
docker compose logs -f app

# Check service health
docker compose ps

# Stop the stack without deleting data
docker compose down
```

The PostgreSQL data is stored in the `pgdata` Docker volume. Do not run `docker compose down -v` unless you intend to delete the database.

## HTTPS deployment

For anything beyond trusted local testing, place the application behind an HTTPS reverse proxy such as Caddy, Nginx, or Traefik.

When HTTPS is active, set:

```env
AUTH_COOKIE_SECURE="true"
```

The direct LAN deployment uses HTTP for convenience. HTTP does not encrypt passwords, session cookies, or training data in transit.

## Local development

### Requirements

- Node.js 22 or newer
- npm
- PostgreSQL, or the database service from Docker Compose

Install dependencies:

```bash
npm ci
```

Start PostgreSQL:

```bash
docker compose up -d db
```

Configure `.env`, then start Next.js:

```bash
npm run dev
```

Development mode disables the service worker to prevent stale assets during iteration.

## Commands

| Command | Purpose |
|---|---|
| `npm run dev` | Start the development server |
| `npm run build` | Generate Prisma Client and build the production app |
| `npm run start` | Start a completed production build |
| `npm run lint` | Run ESLint |
| `npm run db:push` | Push the Prisma schema to a development database |
| `npm run db:migrate` | Create and apply a development migration |
| `npm run db:studio` | Open Prisma Studio |

## Data model

```text
User
├── TrainingSession
│   └── discipline, result, conditions, notes
├── TableTemplate
│   └── ordered JSON rounds and sharing state
└── TableRun
    └── round snapshot, completion count, longest hold
```

Personal bests are calculated from training sessions rather than stored separately, preventing stale PB records.

## Project structure

```text
src/app/                 Next.js pages, client components, and server actions
src/components/          Shared application shell and navigation
src/lib/                 Authentication, Prisma, disciplines, PBs, and table logic
prisma/schema.prisma     PostgreSQL data model
scripts/apply-schema.mjs Container database bootstrap
public/                  Manifest, icons, and generated PWA assets
```

All reads and mutations involving private records are scoped to the authenticated user. Shared table templates are read-only for users who do not own them.

## Security notes

- Passwords are hashed with bcrypt using cost factor 12.
- Sessions use signed HS256 JWTs in `HttpOnly`, `SameSite=Strict` cookies.
- Login failures are throttled in process for the single-container deployment.
- Server actions validate input with Zod and use parameterised Prisma queries.
- Security headers include CSP, frame denial, MIME sniffing protection, and a restrictive permissions policy.
- The application container runs as an unprivileged user.

Current limitations:

- LAN HTTP is not encrypted.
- Login throttling is process-local and resets when the container restarts.
- JWT sessions cannot currently be revoked individually.
- Docker's bootstrap script creates a fresh schema but is not a replacement for production database migrations.

## Current scope

Freedive is focused on personal training. It does not currently include social feeds, coaching accounts, club management, public profiles, or native mobile applications.

## Contributing

Issues and focused pull requests are welcome. Before submitting a change, run:

```bash
npm run lint
npx tsc --noEmit
npm run build
```

## License

No open-source license has been selected yet. Until a license is added, the source remains publicly viewable but standard copyright restrictions apply.
