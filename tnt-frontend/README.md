# TNT — Premium Clothing E-commerce (Frontend, Phase 1)

This is **Phase 1** of the full build: project scaffold, design system, global layout
(TopBar, Header w/ search + mobile drawer, Footer), Redux store (cart/wishlist/auth with
localStorage persistence), and a fully built **Home page** matching your reference screenshots.

## Why you need to run install yourself
This sandbox has no internet access, so `npm install` couldn't be run here. Everything is
hand-written and ready — just install locally.

## Setup
```bash
cd tnt-frontend
npm install
npm run dev
```
Open http://localhost:5173

## What's included
- Vite + React (JavaScript, no TypeScript) + Tailwind, configured with exact TNT design tokens
  (colors, spacing, type scale) derived from your screenshots
- React Router with routes stubbed for **every** page in your spec (Product List, PDP, Cart,
  Checkout, Account dashboard, Orders, Wishlist, Reviews, Lookbook, Search, About, Contact, etc.)
  — Home is fully built; the rest currently render a lightweight "coming soon" placeholder so
  the whole app is navigable end-to-end today
- Redux Toolkit slices: `cart`, `wishlist`, `auth` (JWT-ready, persisted to localStorage; guest
  cart persistence works out of the box, ready to merge into a user cart on login)
- Reusable `ProductCard`, `TrustStrip`, `SearchDrawer`, `MobileDrawer` components
- Mock product data in `src/data/products.js` — swap for real API calls once the backend
  (Node/Express + PostgreSQL + Prisma) is built in Phase 2

## Design tokens (tailwind.config.js)
| Token | Hex | Use |
|---|---|---|
| `ink` | #111111 | Text, buttons, header |
| `paper` | #FFFFFF | Base background |
| `sand` | #E7DFD3 | Hero / lifestyle backdrop |
| `stone` | #F4F2EE | Section / card background |
| `line` | #E3E1DC | Hairline borders |
| `muted` | #6B6B6B | Secondary text |

Responsive breakpoints cover 360 / 480 / 640 / 768 / 992 / 1024 / 1280 / 1366 / 1440 / 1600 / 1920px.

## Next phases
2. Product List, Product Detail, Cart, Checkout, Search — fully built
3. Account area (dashboard, orders, tracking, wishlist, reviews, empty states)
4. Backend: Express + PostgreSQL + Prisma schema, JWT auth, OTP, Cloudinary, all REST APIs
5. Wire frontend to real backend + Admin panel

Say "continue with Phase 2" (or name a specific page) any time to keep going.
