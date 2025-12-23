# Roast Package Registry

A complete package registry server for the Roast language, deployable to Cloudflare Workers.

## Features

- 📦 **Package Management**: Publish, download, search packages
- 🔐 **Authentication**: Token-based auth for publishing
- ✍️ **Signing Support**: Package signatures and publisher verification
- 🗄️ **Turso Database**: SQLite-based edge database for metadata
- 📁 **R2 Storage**: Package tarballs stored in Cloudflare R2
- ⚡ **Edge Computing**: Fast global access via Cloudflare's edge network
- 🔍 **Search**: Full SQL-powered search across packages

## Tech Stack

| Component | Technology |
|-----------|------------|
| Compute | Cloudflare Workers |
| Database | Turso (libSQL) |
| File Storage | Cloudflare R2 |
| Language | TypeScript |

## Prerequisites

1. [Cloudflare Account](https://dash.cloudflare.com/sign-up)
2. [Turso Account](https://turso.tech/)
3. Node.js 18+

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Install CLIs

```bash
# Turso CLI
curl -sSfL https://get.tur.so/install.sh | bash

# Login to both services
turso auth login
npx wrangler login
```

### 3. Create Turso Database

```bash
# Create database
turso db create roast-registry --location sjc

# Get credentials (save these!)
turso db show roast-registry --url
turso db tokens create roast-registry
```

### 4. Create Database Tables

```bash
turso db shell roast-registry
```

```sql
CREATE TABLE packages (
    name TEXT PRIMARY KEY,
    description TEXT DEFAULT '',
    authors TEXT DEFAULT '[]',
    license TEXT DEFAULT 'MIT',
    repository TEXT,
    homepage TEXT,
    keywords TEXT DEFAULT '[]',
    downloads INTEGER DEFAULT 0,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

CREATE TABLE versions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    package_name TEXT NOT NULL,
    version TEXT NOT NULL,
    published_at TEXT NOT NULL,
    yanked INTEGER DEFAULT 0,
    checksum TEXT NOT NULL,
    size INTEGER NOT NULL,
    signature TEXT,
    publisher_fingerprint TEXT,
    UNIQUE(package_name, version)
);

CREATE TABLE users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    created_at TEXT NOT NULL
);

CREATE TABLE tokens (
    token TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    created_at TEXT NOT NULL
);

CREATE TABLE user_packages (
    user_id TEXT NOT NULL,
    package_name TEXT NOT NULL,
    PRIMARY KEY (user_id, package_name)
);

.quit
```

### 5. Create R2 Bucket

```bash
npx wrangler r2 bucket create roast-packages
```

### 6. Set Secrets in Cloudflare

```bash
# Turso Database URL
npx wrangler secret put TURSO_DATABASE_URL
# Enter: libsql://roast-registry-<username>.turso.io

# Turso Auth Token
npx wrangler secret put TURSO_AUTH_TOKEN
# Enter: <your-turso-token>

# Admin Token (generate: openssl rand -hex 32)
npx wrangler secret put ADMIN_TOKEN
```

### 7. Deploy

```bash
# Local development
npm run dev

# Production
npm run deploy
```

## API Endpoints

### Registry Info
```
GET /api/v1
```

### List Packages
```
GET /api/v1/packages
```

### Get Package Metadata
```
GET /api/v1/packages/:name
```

### Search Packages
```
GET /api/v1/search?q=query
```

### Download Package
```
GET /api/v1/packages/:name/:version/download
```

### Publish Package
```
POST /api/v1/packages
Authorization: Bearer <token>
Content-Type: application/gzip
X-Package-Name: my-package
X-Package-Version: 1.0.0
X-Package-Description: My awesome package

<tarball binary data>
```

### Yank/Unyank Version
```
POST /api/v1/packages/:name/:version/yank
POST /api/v1/packages/:name/:version/unyank
Authorization: Bearer <token>
```

### Register User
```
POST /api/v1/users/register
Content-Type: application/json

{
  "email": "user@example.com",
  "name": "Your Name"
}
```

Response:
```json
{
  "message": "User registered successfully",
  "user_id": "uuid",
  "api_token": "your-token"
}
```

## Environment Variables

### Secrets (set via `wrangler secret put`)

| Name | Description |
|------|-------------|
| `TURSO_DATABASE_URL` | Turso database URL |
| `TURSO_AUTH_TOKEN` | Turso auth token |
| `ADMIN_TOKEN` | Admin authentication token |

### Variables (in wrangler.toml)

| Name | Description |
|------|-------------|
| `REGISTRY_NAME` | Display name for the registry |
| `REGISTRY_VERSION` | API version |

## Custom Domain

1. Add your domain to Cloudflare
2. Update `wrangler.toml`:

```toml
routes = [
  { pattern = "registry.roast-lang.org/*", zone_name = "roast-lang.org" }
]
```

3. Redeploy: `npm run deploy`

## Using with Kitchen

```toml
# ~/.config/kitchen/config.toml
[registry]
url = "https://registry.roast-lang.org"
```

```bash
kitchen login    # Enter your API token
kitchen publish  # Publish a package
```

## Cost (Free Tier)

| Service | Free Allocation |
|---------|-----------------|
| Cloudflare Workers | 100K requests/day |
| Turso | 9 GB storage, 1B row reads/month |
| Cloudflare R2 | 10 GB storage, 10M reads/month |

**Total: $0/month** for small-to-medium registries.

## Development

```bash
npm run dev      # Local development
npm run deploy   # Deploy to production
npm run tail     # View logs
```

## License

MIT
