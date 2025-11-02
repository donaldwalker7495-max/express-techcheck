## Project Setup & Testing Guide

### Prerequisites

- Node.js 20+
- npm or pnpm
- Docker and Docker Compose (for Postgres)

### 1) Clone and install dependencies

```bash
git clone <this-repo-url>
cd express-techcheck
pnpm install
```

### 2) Configure environment

The app reads configuration from environment variables validated by `src/env.js`. Defaults are provided for local dev.

Common variables (optional to override):

```bash
export PORT=3000
export PGHOST=localhost
export PGPORT=5432
export PGDATABASE=express_api
export PGUSER=postgres
export PGPASSWORD=password123
export JWT_SECRET=change-me-in-prod
export JWT_EXPIRES_IN=15m
export RATE_LIMIT_WINDOW_MS=900000
export RATE_LIMIT_MAX_ATTEMPTS=5
```

You can also create a `.env` file and use `npm run dev`/`npm start` which load it via `--env-file=.env`.

### 3) Start Postgres via Docker

```bash
docker compose up -d
```

Notes:
- Container name: `express_api_db`.
- Database: `express_api` with user `postgres` and password `password123` (see `docker-compose.yml`).
- On first start, schema is initialized via `docker/init.sql` (tables, indexes, extensions).

### 4) Run database migrations (optional in dev)

The test suite calls `migrate()` automatically. For local development, the Docker init script already creates the schema. If you need to run migrations at runtime, you can import and call `migrate()` from `src/db.js` in a small script.

### 5) Run the app

```bash
npm run dev
# or
npm start
```

Then visit:
- API root: http://localhost:3000/api/v1
- Health/root: http://localhost:3000/

### 6) API quickstart

Products CRUD:
- List: `GET /api/v1/products`
- Get by id: `GET /api/v1/products/:id`
- Create: `POST /api/v1/products` with `{ name, description, price }`
- Update: `PUT /api/v1/products/:id` with any subset of `{ name, description, price }`
- Delete: `DELETE /api/v1/products/:id`

Product search:
- Search: `GET /api/v1/products/search?q=<query>&page=<n>` (case-insensitive, 10/page)

Auth:
- Register: `POST /api/v1/auth/register` with `{ username, password }`
- Login: `POST /api/v1/auth/login` → `{ token }`
- Protected: `POST /api/v1/auth/protected` with header `Authorization: Bearer <token>`

### 7) Run tests (e2e)

The test suite uses the real Postgres database. Ensure Docker is up (step 3).

```bash
npm test
```

What it does:
- Waits for DB readiness.
- Runs idempotent migrations.
- Truncates tables between tests as needed.
- Executes e2e tests for products CRUD, auth with JWT and rate limiting, and product search.

### Troubleshooting

- Port already in use on start:
  - The server logs an explicit message if `PORT` is in use. Change `PORT` or stop the conflicting process.
- Cannot connect to Postgres:
  - Verify Docker is running and `docker compose ps` shows `express_api_db` healthy.
  - Confirm env vars match `docker-compose.yml` credentials.
- Tests fail on first run due to extensions:
  - Ensure `docker/init.sql` runs once and creates `pg_trgm` extension. Recreate the DB volume if needed:
    ```bash
    docker compose down -v && docker compose up -d
    ```

### Useful commands

```bash
# Start database
docker compose up -d

# Stop and remove containers
docker compose down

# Recreate DB volume and re-init schema
docker compose down -v && docker compose up -d

# Run tests
npm test
```

