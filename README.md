# Community Events Board

A small app where an admin posts local events (music nights, workshops, food fairs…) and visitors browse them, save favourite categories, set reminders and design a personal card for an event.

Built with **Next.js 16 (App Router)**, **SQLite + Prisma 7**, **Tailwind CSS 4** and **shadcn/ui**. Every page talks to the app's own **JSON API**, so a mobile app could use the same endpoints later.

| Laptop | Phone: filters | Phone: event + card designer | Phone: admin |
|---|---|---|---|
| <img src="docs/screenshots/laptop-events.jpg" width="420"> | <img src="docs/screenshots/phone-filters.jpg" width="150"> | <img src="docs/screenshots/phone-event.jpg" width="150"> | <img src="docs/screenshots/phone-admin.jpg" width="150"> |

---

## Setup (about 2 minutes)

Requires **Node.js 20.9 or newer**. No database server is needed: SQLite is a file inside the project.

```bash
git clone https://github.com/jaydippatel83/community-events.git
cd community-events
npm install                # also generates the Prisma client
cp .env.example .env       # works as-is for local use
npm run db:setup           # creates the database and adds the admin + 15 sample events
npm run dev
```

Open **http://localhost:3000**.

To reset the sample data at any time, run `npx prisma db seed`. Event dates are relative to today, so the sample events are always upcoming.

### Logins

| Role | Email | Password |
|---|---|---|
| Admin | `admin@events.test` | `Admin@123` |
| Visitor | Sign up with any email | at least 8 characters |

The admin can be changed with `ADMIN_EMAIL` / `ADMIN_PASSWORD` in `.env` before seeding.

### Sample data

15 events across all 5 categories and 5 cities: **9 active and upcoming**, **3 inactive** and **3 in the past**. Prices range from free to ₹1,50,000. Try **Music + Coimbatore + "night"**, which returns 2 events.

### Deploying (Vercel + Turso)

Vercel's filesystem is temporary, so production uses **Turso** (hosted SQLite) through the same Prisma libSQL adapter. Locally nothing changes: `DATABASE_URL="file:./dev.db"`.

```bash
turso db create community-events
turso db shell community-events < prisma/migrations/20261010152704_init/migration.sql   # create tables
DATABASE_URL="$(turso db show community-events --url)" TURSO_AUTH_TOKEN="$(turso db tokens create community-events)" npx tsx prisma/seed.ts
```

In Vercel, set `DATABASE_URL`, `TURSO_AUTH_TOKEN` and `JWT_SECRET`, then deploy.

---

## API

All endpoints return JSON. Errors always have the shape `{ "error": "message" }` with a matching HTTP status. Auth uses a JWT sent either as an httpOnly cookie (web) or as `Authorization: Bearer <token>` (mobile).

| Method | Endpoint | Auth | Purpose |
|---|---|---|---|
| POST | `/api/auth/signup` | | `{ email, password }` → `{ token, user }` |
| POST | `/api/auth/login` | | `{ email, password }` → `{ token, user }` |
| POST | `/api/auth/logout` | | Clears the cookie |
| GET | `/api/me` | User | Current user |
| GET | `/api/events?category=&city=&q=&page=&limit=` | | Active, upcoming events, nearest first, paginated |
| GET | `/api/events/cities` | | Cities that have visible events (for the filter) |
| GET | `/api/events/:id` | | One event (inactive events only for admin) |
| GET / PUT | `/api/me/favourites` | User | `{ categories: ["Music", "Food"] }` |
| GET | `/api/feed?page=` | User | Upcoming events from favourite categories |
| GET | `/api/me/reminders` | User | `{ eventIds: [...] }` |
| PUT / DELETE | `/api/events/:id/reminder` | User | Turn a reminder on / off |
| GET / PUT | `/api/events/:id/card` | User | `{ theme, stickers }`: theme is `sunset`/`ocean`/`forest`; up to 3 of `music`/`party`/`heart`/`star`/`fire` |
| GET / POST | `/api/admin/events` | Admin | List all events / create an event |
| PATCH | `/api/admin/events/:id` | Admin | `{ isActive }`. There is no DELETE: events are deactivated, never deleted |

---

## Three questions

### 1. What is the database structure, and why?

```
User              (id, email UNIQUE, passwordHash, role USER|ADMIN, createdAt)
Event             (id, title, category, city, startsAt, pricePaise INT, description, imageUrl, isActive)
FavouriteCategory (userId, category)                 PK (userId, category)
Reminder          (userId, eventId, createdAt)       PK (userId, eventId)
CardDesign        (userId, eventId, theme, stickers) PK (userId, eventId)
```

Everything a user does to an event is a small table whose primary key is the pair `(userId, eventId)`. The database itself then guarantees one reminder and one card design per user per event, so saving twice can't create duplicates and saves can be simple upserts. Events have an `isActive` flag instead of being deleted, and money is stored as whole paise to avoid floating-point rounding. Categories, themes and stickers are plain strings checked by the API (zod), which keeps the SQLite schema simple.

### 2. How does the filter query work, and what index would you add?

The API builds a single Prisma `where`: `isActive = true AND startsAt >= now`, plus `category = ?`, `city = ?` and `(title LIKE %q% OR description LIKE %q%)`, each added only when that filter is given. Because they are all ANDed, the filters narrow each other down (Music + Coimbatore + "night"). Results are ordered by `startsAt ASC`, and pagination uses `skip`/`take` plus a `count` for the total pages. I added a composite index on **`(category, city, startsAt)`**, which matches the filter and the sort, and one on **`(isActive, startsAt)`** for the unfiltered list. A `LIKE '%q%'` text search can't use a normal index; with more data I'd move it to SQLite FTS5 or Postgres full-text search.

### 3. How do you store passwords and protect the admin pages and APIs?

Passwords are hashed with **bcrypt** (10 rounds, a random salt per password) and never stored or returned in plain text. Login returns a signed **JWT** (HS256, 7-day expiry). The web keeps it in an **httpOnly, SameSite=Lax cookie**, which JavaScript can't read. Admin access is checked **on the server in three places**: `proxy.ts` redirects non-admins before any `/admin` page renders; `app/admin/layout.tsx` verifies the token again on the server; and every `/api/admin/*` route calls `requireAdmin()`, which returns 401 or 403. Hiding the Admin link in the UI is only cosmetic. The server checks are what protect the pages and data.

---

## Notes on a few choices

- **Optimistic "Remind me"** (`hooks/use-reminders.ts`): the button changes at once, then saves with `PUT`/`DELETE`. If saving fails it changes back and shows a toast. `PUT` and `DELETE` are safe to repeat, which keeps the rollback simple.
- **Filters live in the URL** (`?category=Music&city=Coimbatore&q=night&page=2`), so they survive a refresh and can be shared as a link. The search box waits 400 ms after typing before searching.
- **Card designer** (`components/card-designer.tsx`): the 3 theme gradients are stacked and only their opacity changes, because CSS can't animate between gradients directly. Stickers animate in and out with `tw-animate-css`. Changes save automatically 600 ms after the last tap.
- **Next.js 16 keeps recently visited pages alive** (React `<Activity>`). Because of this, pending states and form fields are reset after a successful submit, and logout does a full page reload so no user data stays in memory.
- **Dates and money**: all dates are shown in IST, e.g. `Sat, 18 Oct, 6:30 PM`, and prices use Indian grouping, e.g. `₹1,50,000` (`lib/format.ts`).

## Project structure

```
app/
  api/…                  JSON API (route handlers)
  page.tsx, events/…     Visitor pages: events list, event detail
  login, signup, favourites, feed
  admin/…                Admin list + add-event form (server-protected layout)
components/              UI pieces (event card, card designer, states…); ui/ = shadcn/ui
hooks/                   useApi (data loading), useReminders (optimistic reminders)
lib/                     auth, prisma client, formatting, validation helpers, API client
prisma/                  schema, migration, seed
proxy.ts                 First layer of /admin protection
```

---

## What's left

Everything in the brief is implemented. Things I would do next with more time:

- **Automated tests**: I tested the API with curl scripts and the pages manually on phone and laptop sizes. The next step would be API tests (Vitest) and a Playwright test for the main flows.
- **Reminders are saved but not sent**: there is no email or push notification yet.
- **Logout only clears the cookie**: a JWT stays valid until it expires (7 days). A token blocklist or short-lived tokens with refresh would fix that.
- **No rate limiting on login.**
- **Text search** is case-insensitive only for English letters (SQLite `LIKE`), and doesn't scale; see question 2.

## Use of AI tools

I used **Claude Code** (an AI coding assistant) during this project to plan the steps, generate first drafts of the code, look up Next.js 16 changes (Proxy, Cache Components, `<Activity>`), and debug problems such as npm 12 blocking install scripts and a stale dev-server cache. It also helped take screenshots for checking the layout at phone and laptop sizes. I reviewed and tested every part, and I can explain each file.
