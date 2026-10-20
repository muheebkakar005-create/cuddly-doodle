# Quetta Salon Connect (Q-Salons / سلونز آف کوئٹہ)

Mobile-first marketplace for barber shops, ladies parlours, and spas in **Quetta, Balochistan**. Customers search by neighborhood, pick services in PKR, reserve a slot, and confirm on WhatsApp. Shop owners register for Super Admin approval. Listings rank by views, ratings, and reviews.

## Stack

- Next.js 15 (App Router) + TypeScript + Tailwind CSS v4
- Prisma + SQLite
- JWT httpOnly cookie (`qsc_session`) for Super Admin and shop owners
- WhatsApp via `wa.me` deep links (`+92`)

## Setup

```bash
npm install
npx prisma db push
npx tsx prisma/seed.ts
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Super Admin

- Email: `muheebkakar005@gmail.com`
- Password: `Adminmuheeb`
- Panel: `/admin` — shop approvals, salon CRUD, appointment board

### Demo shop owner

- Email: `owner@royalcuts.pk`
- Password: `Owner1234`
- Panel: `/owner` — profile, hours, services, bookings
- Register a new shop: `/owner/register` (stays hidden until approved)

Customers book with **name + WhatsApp number only**. After a shop marks a visit **COMPLETED**, the customer can rate and tag the visit from **My bookings**.

## Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Local server |
| `npx prisma db push` | Create/update SQLite schema |
| `npx tsx prisma/seed.ts` | Seed Quetta salons + admin + demo owner |
| `npm run build` | Production build |

Copy `.env.example` to `.env` and change `JWT_SECRET` before deploying.
