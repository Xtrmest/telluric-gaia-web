# PRD — Telluric Gaia Apparel Lab Inc.

## Original Problem Statement
Build a fully functional e-commerce web app for apparel brand "Telluric Gaia Apparel Lab Inc." with a responsive, dark, tech-forward aesthetic. Home page showcasing new collections (hemp, bamboo, thermochromic inks); product catalog with filters (sizing, material type, color activation palettes); product detail pages with Add to Cart, image galleries, sizing charts/tech packs; slide-out shopping cart + streamlined checkout; About/Eco-review sustainability page; persistent nav; loading animations; fully responsive.

## User Choices
- Checkout: SIMULATED / demo (no real payment).
- Accounts: BOTH email/password (JWT) AND Emergent-managed Google login.
- Products: managed via an Admin panel (add/edit/delete).
- Design: agent-decided dark, tech-forward (bio-synthetic tactical / thermochromic theme).

## Architecture
- Frontend: React 19 + react-router-dom 7, Tailwind + shadcn/ui, framer-motion, recharts, sonner. Contexts: Auth, Cart (localStorage), Temp (thermochromic accent via CSS var `--thermo`).
- Backend: FastAPI (`/api` prefix), MongoDB (motor). Unified `users` collection (`user_id` UUID, `role`). JWT httpOnly cookies for password auth; `user_sessions` + session_token cookie for Google auth.
- Collections: users, user_sessions, products, orders.

## User Personas
- Customer: browses, filters, adds to cart, checks out (guest or account), views order history.
- Admin: manages product catalog and views all orders.

## Core Requirements (static)
- Catalog with material/size/palette filters + sort.
- Product detail: gallery, size select, composition + tech pack, add to cart.
- Slide-out cart, 3-step simulated checkout producing a tracking hash.
- About/Eco-review with lifecycle chart + metrics.
- Dual auth + admin CRUD. Thermochromic temperature simulator.

## Implemented (2026-06)
- [x] Home (hero, live thermal widget, material stack, featured products)
- [x] Catalog with filter chips + sort + loading skeletons
- [x] Product detail (gallery, thermal view, size, tech pack tabs, add to cart)
- [x] Slide-out cart drawer (qty, remove, carbon offset, subtotal)
- [x] 3-step simulated checkout + order confirmation (tracking hash)
- [x] About / Eco-review (recharts lifecycle, sourcing, chemistry safety)
- [x] Email/password JWT auth + Emergent Google auth (AuthCallback)
- [x] Admin panel: product CRUD + orders view; admin-gated routes & API
- [x] Account page with order history
- [x] 8 seeded products; seeded admin user
- Verified: 20/20 backend pytest + all frontend flows (100%).

## Implemented (2026-06 · AI Virtual Fitting Room)
- [x] Phone-camera capture (getUserMedia) with "360 Spin" multi-frame + "Single Shot" modes, plus photo-upload fallback
- [x] Reusable body model saved to account (Emergent Object Storage), swap outfits onto the same turn without recapturing
- [x] AI try-on generation via Gemini Nano Banana (gemini-3.1-flash-image-preview) editing person+garment per frame, async job + progress polling
- [x] Drag-to-rotate / auto-spin 360° SpinViewer for results
- [x] Saved looks gallery (list + delete) per user
- [x] "Try It On" deep-link from each product page (/fitting-room?product=id)
- [x] Robust auth: localStorage Bearer token + httpOnly cookie; try-on images served via cookie/Bearer/?token=
- Verified: 32/32 backend pytest (7 new try-on) + 7/7 fitting-room frontend flows (100%)

## Backlog
- P1: Recompute order totals server-side (currently trusts client; low-risk in demo).
- P1: Product search bar in header (backend already supports `search`).
- P2: Wishlist / saved tech specs; inventory decrement on order.
- P2: Add DialogDescription to dialogs (a11y warning cleanup).
- P2: Split server.py into routers if it grows past ~700 lines.

## Next Tasks

## Updates (2026-06)
- [x] Removed ALL thermochromic-ink content: dropped material "Thermochromic Ink Shell" (→ "Recycled Bio-Polymer"), palette "Thermal Amber" (→ "Ember Amber"), cleaned all product descriptions/compositions, removed the thermal temperature slider + thermal-reactive badges + thermal view + "Color Activation" filter (→ "Colorway") and all thermochromic copy on Home/About/Footer/Admin. Startup migration purges legacy docs + reseeds cleaned catalog (8 products). Cyan accent theme retained.
- [~] PayPal integration (Sandbox) added as a checkout OPTION alongside demo flow. Backend REST Orders v2: GET /api/paypal/config, POST /api/paypal/create-order (server-side amount calc + pending record), POST /api/paypal/capture/{id} (capture → inventory decrement → order persisted as payment_method=paypal). Frontend Smart Buttons (PayPal + card) via @paypal/react-paypal-js. AWAITING user's PAYPAL_CLIENT_ID + PAYPAL_SECRET to go live/testable; gracefully shows "not configured" until then.
- Add header search; server-side total validation; inventory updates on checkout.
