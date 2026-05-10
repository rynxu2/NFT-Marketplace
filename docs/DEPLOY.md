# NEXUS NFT Marketplace - Cloudflare Pages Deployment

## Quick Deploy

### 1. Install adapter
```bash
npm install @opennextjs/cloudflare
```

### 2. Add build script to package.json
```json
{
  "scripts": {
    "build:cf": "npx @opennextjs/cloudflare build",
    "preview:cf": "npx wrangler pages dev .open-next/assets --compatibility-date=2024-09-23 --compatibility-flags=nodejs_compat"
  }
}
```

### 3. Configure wrangler (wrangler.jsonc)
Already created at project root.

### 4. Deploy
```bash
# First time: link to Cloudflare
npx wrangler pages deploy .open-next/assets

# Or use Cloudflare Dashboard:
# 1. Connect GitHub repo
# 2. Build command: npm run build:cf
# 3. Output dir: .open-next/assets
```

### 5. Environment Variables (Cloudflare Dashboard → Settings → Environment Variables)
```
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx
NEXT_PUBLIC_SOLANA_NETWORK=devnet
NEXT_PUBLIC_SOLANA_RPC_DEVNET=https://api.devnet.solana.com
NEXT_PUBLIC_SOLANA_RPC_MAINNET=https://api.mainnet-beta.solana.com
NEXT_PUBLIC_SITE_URL=https://your-domain.pages.dev
PINATA_API_KEY=xxx
PINATA_SECRET=xxx
PINATA_GATEWAY=https://gateway.pinata.cloud
CLOUDINARY_CLOUD_NAME=xxx
CLOUDINARY_API_KEY=xxx
CLOUDINARY_API_SECRET=xxx
```

## Alternative: Self-hosted with Docker

```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./
EXPOSE 3000
CMD ["npm", "start"]
```
