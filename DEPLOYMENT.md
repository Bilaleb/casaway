# Casaway Deployment Guide

## Quick Deploy to Vercel

### Option 1: Web Interface (Easiest)

1. Go to [vercel.com](https://vercel.com)
2. Click **"Add New..."** → **"Project"**
3. Select **"Import Git Repository"**
4. Search and import `Bilaleb/casaway`
5. Configure:
   - **Framework Preset**: Vite
   - **Root Directory**: `frontend/client`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
6. Click **"Deploy"**

Your app will be live at a Vercel URL like `https://casaway-xxxxx.vercel.app`

### Option 2: Vercel CLI

```bash
# Install Vercel CLI
npm install -g vercel

# Navigate to project
cd casaway

# Deploy
vercel

# Follow the prompts
# - Select the Vercel account
# - Confirm project name
# - Link to existing project or create new
# - Accept defaults for framework (Vite) and settings
```

### Option 3: GitHub Actions (Auto-Deploy)

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Vercel

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: vercel/action@main
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          working-directory: ./frontend/client
```

Then add secrets to GitHub:
1. Go to repo **Settings** → **Secrets and variables** → **Actions**
2. Add:
   - `VERCEL_TOKEN`: Get from [vercel.com/account/tokens](https://vercel.com/account/tokens)
   - `VERCEL_ORG_ID`: From Vercel account settings
   - `VERCEL_PROJECT_ID`: From Vercel project settings

## Environment Variables (Optional)

Create `.env.local` in `frontend/client/`:

```
VITE_MAP_CENTER_LAT=33.5731
VITE_MAP_CENTER_LNG=-7.5898
VITE_MAP_ZOOM=12
VITE_TILE_LAYER_URL=https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png
```

## Post-Deployment Checklist

- [ ] Vercel deployment successful
- [ ] Map loads and displays markers
- [ ] Routes dropdown populates from `/routes/manifest.json`
- [ ] GPX traces render in golden color
- [ ] Search and filter work
- [ ] Responsive design on mobile

## Monitoring

Visit your Vercel project dashboard to:
- View deployment logs
- Monitor performance
- Set up custom domains
- Configure edge functions

## Rollback

If needed, roll back to a previous deployment:

```bash
vercel rollback
```

Or use the Vercel dashboard to select a previous deployment.

## Custom Domain

1. Go to Vercel project settings
2. **Domains** → **Add** → Enter your domain
3. Follow DNS configuration instructions
4. Wait for DNS propagation (typically 24-48 hours)

## Support

- [Vercel Documentation](https://vercel.com/docs)
- [Vite Guide](https://vitejs.dev/guide/)
- [Leaflet API](https://leafletjs.com/)
