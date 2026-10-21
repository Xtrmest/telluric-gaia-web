# Telluric Gaia Apparel Lab — Standalone Static App

This repository has been refactored to run 100% independently in the browser using static/mock data and `localStorage` persistence (`frontend/src/data/mockData.js` and `frontend/src/lib/api.js`), without requiring the Python/FastAPI backend.

## Features Handled Client-Side
- **Product Catalog & Filtering**: 8 seeded bio-synthetic tactical apparel items with filtering by material, size, colorway, search query, and sorting (`newest`, `eco`, `price_asc`, `price_desc`).
- **Authentication**: Local email/password authentication, registration, and simulated Google OAuth login.
  - **Admin Demo Credentials**: `admin@telluricgaia.com` / `TelluricAdmin#2026`
  - **Customer Demo Credentials**: `operator@telluricgaia.com` / `TelluricUser#2026`
- **Cart, Wishlist & Checkout**: Persistent cart and wishlist, inventory validation & stock deduction on order placement, and order confirmation with generated tracking hashes (`TG-...`).
- **Admin Panel**: Full product CRUD (create, edit, delete) and order history inspection.
- **Virtual Fitting Room**: Camera/upload 360° frame capture, client-side `<canvas>` try-on look generation, interactive 360° spin viewer, and saved looks gallery.

## Build & Cloudflare Pages Deployment

### From Repository Root
```bash
npm run build
```
Outputs the static production bundle to `frontend/build`, `build`, and `dist` (including `_redirects` for SPA routing).

### From `frontend/` Directory
```bash
cd frontend
npm install
npm run build
```
Outputs the static production bundle to `frontend/build`.

### Cloudflare Pages Settings
- **Root directory**: `frontend` (or `/` if using the root `package.json`)
- **Build command**: `npm run build`
- **Build output directory**: `build` (or `dist` when building from root)
