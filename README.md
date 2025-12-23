# Roast Package Registry - Cloudflare Workers

A complete package registry server for the Roast language, deployable to Cloudflare Workers.

## Features

- 📦 **Package Management**: Publish, download, search packages
- 🔐 **Authentication**: Token-based auth for publishing
- ✍️ **Signing Support**: Package signatures and publisher verification
- 🗄️ **R2 Storage**: Package tarballs stored in Cloudflare R2
- ⚡ **Edge Computing**: Fast global access via Cloudflare's edge network
- 🔍 **Search**: Full-text search across packages

## Prerequisites

1. [Cloudflare Account](https://dash.cloudflare.com/sign-up)
2. [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/install-and-update/)
3. Node.js 18+

## Setup

### 1. Install Dependencies

```bash
cd registry-server
npm install
```

### 2. Configure Cloudflare Resources

First, log in to Wrangler:
```bash
npx wrangler login
```

Create the required KV namespaces:
```bash
# Package metadata
npx wrangler kv:namespace create PACKAGES
npx wrangler kv:namespace create PACKAGES --preview

# User data
npx wrangler kv:namespace create USERS
npx wrangler kv:namespace create USERS --preview

# API tokens
npx wrangler kv:namespace create TOKENS
npx wrangler kv:namespace create TOKENS --preview
```

Create the R2 bucket:
```bash
npx wrangler r2 bucket create roast-packages
```

### 3. Update wrangler.toml

Copy the namespace IDs from the commands above into `wrangler.toml`:

```toml
[[kv_namespaces]]
binding = "PACKAGES"
id = "your-packages-kv-id"
preview_id = "your-packages-preview-id"

[[kv_namespaces]]
binding = "USERS"
id = "your-users-kv-id"
preview_id = "your-users-preview-id"

[[kv_namespaces]]
binding = "TOKENS"
id = "your-tokens-kv-id"
preview_id = "your-tokens-preview-id"
```

### 4. Set Secrets

```bash
# Admin token for administrative operations
npx wrangler secret put ADMIN_TOKEN
# Enter a strong random token when prompted

# JWT secret (optional, for future JWT auth)
npx wrangler secret put JWT_SECRET
```

### 5. Deploy

```bash
# Development (local)
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

### Yank Version
```
POST /api/v1/packages/:name/:version/yank
Authorization: Bearer <token>
```

### Unyank Version
```
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

Response includes your API token:
```json
{
  "message": "User registered successfully",
  "user_id": "uuid",
  "api_token": "your-token"
}
```

## Custom Domain

To use a custom domain like `registry.roast-lang.org`:

1. Add your domain to Cloudflare
2. Update `wrangler.toml`:

```toml
routes = [
  { pattern = "registry.roast-lang.org/*", zone_name = "roast-lang.org" }
]
```

3. Redeploy:
```bash
npm run deploy
```

## Using with Kitchen (Roast Package Manager)

Configure kitchen to use your registry:

```toml
# ~/.config/kitchen/config.toml
[registry]
url = "https://registry.roast-lang.org"
# or your workers.dev URL
# url = "https://roast-registry.your-account.workers.dev"
```

Login with your token:
```bash
kitchen login
# Enter your API token
```

Publish a package:
```bash
kitchen publish
```

## Cost Estimation

Cloudflare Workers has a generous free tier:
- **Workers**: 100,000 requests/day free
- **KV**: 100,000 reads/day, 1,000 writes/day free
- **R2**: 10 GB storage, 10 million reads/month free

For a small-to-medium registry, this should be completely free.

## Development

```bash
# Run locally with wrangler dev
npm run dev

# View logs
npm run tail

# Deploy to production
npm run deploy
```

## Security Considerations

1. **ADMIN_TOKEN**: Keep this secret, use a strong random value
2. **Rate Limiting**: Consider adding rate limiting for publish endpoints
3. **Package Validation**: The current implementation does basic validation; consider adding more thorough tarball inspection
4. **Signature Verification**: Implement signature verification in `handlePublishPackage` for production use

## License

MIT
