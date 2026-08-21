#  Expense Tracker (MERN Stack)

A full-stack personal finance tracker built with **MongoDB, Express, React, and Node.js**. Supports authenticated multi-user expense/income tracking, budget alerts, recurring transactions, receipt uploads, CSV export, and analytics dashboards powered by MongoDB aggregation pipelines.

---

##  Features

### Core
- JWT-based signup/login with protected routes and bcrypt password hashing
- Full CRUD on transactions (amount, category, date, type, notes)
- Dashboard with running balance, total income vs. expense
- Category-based filtering, free-text search, and advanced filters (date range, amount range)
- Server-side pagination (`skip`/`limit`) on transaction history

### Data & Visualization
- Pie chart for category breakdown, composed bar/line chart for monthly trends (Recharts)
- Monthly and yearly summary views
- Per-category budget limits with real-time alerts (near-limit and exceeded)

### Nice-to-haves
- CSV export of filtered transaction history
- Recurring transactions (rent, subscriptions) with cron-based auto-generation
- Multi-currency field support (per-transaction currency, user base currency)
- Dark mode (persisted, respects system preference)
- Receipt image upload (Multer → Cloudinary)

### Technical depth
- Client + server-side validation (native form validation + `express-validator`)
- Centralized Express error-handling middleware
- MongoDB **aggregation pipelines** (`$facet`, `$group`, `$project`, `$lookup`-style reshaping) for summary/analytics endpoints
- Rate limiting (`express-rate-limit`) and security hardening (`helmet`, `express-mongo-sanitize`)
- Cursor-free pagination via `skip`/`limit` with metadata (`hasNextPage`, `totalPages`, etc.)
- Mobile-first responsive UI (Tailwind CSS)

### Stretch goals (scaffolded)
- Household/shared-account fields on the User model (`householdMembers`, `role`) as a foundation for shared expense tracking
- Nodemailer utility wired up for budget-exceeded / reminder emails (SMTP config via `.env`)

---

## 🏗️ Architecture

```
┌─────────────────────┐        HTTPS / JSON        ┌──────────────────────┐
│   React (Vite)       │ ─────────────────────────▶ │   Express API         │
│   - Context (auth,    │ ◀───────────────────────── │   - JWT middleware    │
│     theme)            │                             │   - Validators        │
│   - Recharts charts   │                             │   - Rate limiter      │
│   - Axios interceptor │                             │   - Error handler     │
└─────────────────────┘                             └──────────┬───────────┘
                                                                 │ Mongoose ODM
                                                                 ▼
                                                     ┌──────────────────────┐
                                                     │   MongoDB Atlas       │
                                                     │   - users             │
                                                     │   - transactions      │
                                                     │   - budgets           │
                                                     │   - recurring txns    │
                                                     └──────────────────────┘

Background:  node-cron job (daily) ──▶ scans due RecurringTransaction docs
             ──▶ generates Transaction docs ──▶ advances nextRunDate

External:    Multer (memory) ──▶ Cloudinary (receipt image hosting)
             Nodemailer ──▶ SMTP (budget alert / reminder emails)
```

**Request flow example — adding an expense:**
1. React form (`TransactionForm`) validates client-side, optionally uploads a receipt image to `/api/uploads/receipt` (multer buffer → Cloudinary stream), then `POST`s to `/api/transactions`.
2. Express validates the payload (`express-validator`), `protect` middleware verifies the JWT and attaches `req.user`.
3. Controller creates the `Transaction`, then calls `checkBudgetAlert()`, which runs an aggregation over the current period's expenses for that category and returns `{ spent, percentUsed, exceeded, nearLimit }`.
4. Response includes the created transaction **and** the budget alert, so the UI can toast a warning immediately without a second round trip.

**Why aggregation pipelines instead of client-side math:** summary/category/trend endpoints all group and sum in MongoDB (`$group`, `$facet`, `$month`/`$year` operators) rather than pulling every transaction to the client and reducing in JS. This scales with transaction count and is the main "beyond basic CRUD" talking point for interviews.

---

## 📁 Project Structure

```
expense-tracker/
├── backend/
│   ├── config/          # db.js, cloudinary.js
│   ├── controllers/      # auth, transaction, analytics, budget, recurring, upload
│   ├── middleware/       # auth (JWT), errorHandler, rateLimiter, upload (multer)
│   ├── models/           # User, Transaction, Budget, RecurringTransaction
│   ├── routes/           # REST route definitions per resource
│   ├── utils/             # asyncHandler, generateToken, scheduler (cron), sendEmail
│   ├── validators/       # express-validator chains
│   └── server.js          # app bootstrap, middleware wiring, cron start
└── frontend/
    ├── src/
    │   ├── api/axios.js           # JWT-attaching axios instance + 401 handling
    │   ├── context/                # AuthContext, ThemeContext
    │   ├── components/             # Navbar, forms, list, filters, pagination, charts/
    │   └── pages/                  # Login, Register, Dashboard, Transactions, Budgets, Recurring
    └── vite.config.js              # dev proxy → backend on :5000
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- A MongoDB connection string (local `mongod` or [MongoDB Atlas](https://www.mongodb.com/atlas))
- (Optional) Cloudinary account for receipt uploads
- (Optional) SMTP credentials for email alerts

### 1. Backend

```bash
cd backend
cp .env.example .env       # fill in MONGO_URI, JWT_SECRET, etc.
npm install
npm run dev                 # nodemon, http://localhost:5000
```

### 2. Frontend

```bash
cd frontend
cp .env.example .env
npm install
npm run dev                 # http://localhost:5173 (proxies /api to :5000)
```

### 3. Try it out
1. Register an account (choose a base currency).
2. Add a few transactions — the dashboard charts and running balance update immediately.
3. Set a budget for a category, then add an expense that crosses 80%/100% of it to see the alert.
4. Create a recurring "Rent" expense — it will auto-generate a real transaction on its `nextRunDate` (the cron job also runs once at server boot, so you can test by setting a start date in the past).

---

## 🔌 API Overview

| Method | Endpoint                              | Description                                  |
|--------|----------------------------------------|-----------------------------------------------|
| POST   | `/api/auth/register`                   | Create account, returns JWT                   |
| POST   | `/api/auth/login`                      | Login, returns JWT                             |
| GET    | `/api/auth/me`                         | Current user profile                           |
| GET    | `/api/transactions`                    | Paginated/filterable/searchable list           |
| POST   | `/api/transactions`                    | Create transaction (+ budget alert in response)|
| PUT    | `/api/transactions/:id`                | Update transaction                             |
| DELETE | `/api/transactions/:id`                | Delete transaction                             |
| GET    | `/api/transactions/export/csv`         | CSV export (respects filters)                  |
| GET    | `/api/analytics/summary`               | Total income/expense/balance                   |
| GET    | `/api/analytics/category-breakdown`    | Pie chart data                                 |
| GET    | `/api/analytics/monthly-trend`         | 12-month income/expense/balance series         |
| GET    | `/api/analytics/yearly-summary`        | Year-over-year totals                          |
| GET/POST | `/api/budgets`                       | List / create-or-update category budgets       |
| DELETE | `/api/budgets/:id`                     | Delete budget                                  |
| GET/POST | `/api/recurring`                     | List / create recurring transactions           |
| PUT/DELETE | `/api/recurring/:id`               | Update (pause/resume) / delete                 |
| POST   | `/api/uploads/receipt`                 | Upload receipt image → Cloudinary URL          |

All routes except `/auth/register` and `/auth/login` require `Authorization: Bearer <token>`.

---

## ☁️ Deployment Notes

- **Backend:** Deploy to Render/Railway as a Node web service. Set all `.env` variables in the platform's dashboard. Point `MONGO_URI` at a MongoDB Atlas cluster (whitelist the platform's outbound IPs or use `0.0.0.0/0` for simplicity).
- **Frontend:** Deploy to Vercel/Netlify as a static Vite build (`npm run build` → `dist/`). Set `VITE_API_BASE_URL` (or configure a rewrite/proxy) to point at the deployed backend URL.
- **CI/CD:** A simple GitHub Actions workflow can run `npm install && npm run build` for both packages on push, and trigger Render/Vercel deploy hooks on success.

---

## 🔒 Security Checklist

- [x] Passwords hashed with bcrypt (10 salt rounds)
- [x] JWT expiry configurable via `JWT_EXPIRES_IN`
- [x] `helmet()` for secure HTTP headers
- [x] `express-mongo-sanitize` to strip `$`/`.` operators from user input (NoSQL injection)
- [x] Rate limiting on all routes, stricter limits on `/auth/*`
- [x] Request body size capped (`express.json({ limit: '10kb' })`)
- [x] All mutating endpoints scoped to `req.user._id` (no cross-user data access)

---

## 🗺️ Possible Next Steps

- FX-rate service integration for true multi-currency conversion (currently amounts are stored per-transaction currency + a base-currency field, ready to wire up a conversion step)
- Cursor-based pagination for very large transaction histories
- Shared/family accounts: the `User.householdMembers` field is scaffolded but access-control logic (shared queries across household members) isn't implemented yet
- Automated tests (Jest + Supertest for API, React Testing Library for UI)
