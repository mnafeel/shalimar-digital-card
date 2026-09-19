# Shalimar Fashions — Digital Visiting Card

Compact premium digital visiting card for the dress shop.

## Live site

**https://digitalcard.shalimarfashions.com/**

Hosted on the `digitalcard` subdomain (GitHub Pages).  
Main site: `shalimarfashions.com` · Dashboard: `dashboard.shalimarfashions.com`

Every push to `main` builds and deploys. In the repo: **Settings → Pages** → Source: **GitHub Actions**, custom domain `digitalcard.shalimarfashions.com`.

DNS (at your domain provider):

| Type  | Host         | Value              |
|-------|--------------|--------------------|
| CNAME | digitalcard  | `mnafeel.github.io` |

## Run locally

```bash
npm install
npm run dev
```

- **Card:** http://localhost:5173/
- **Admin:** http://localhost:5173/admin (password: `shalimar2024`)

## Features

- Save Contact (downloads `.vcf` for phone contacts)
- Call, WhatsApp, Email
- Instagram, Facebook, Website
- Find Shalimar — shop photo + Google Maps
- Logo-matched gold / brown premium look
- Mobile & desktop friendly

## Brand assets

`public/brand/` · `public/shop/`
