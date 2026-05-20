# FinSight — AI-Powered Personal Finance Tracker

> A full-stack personal finance API built with **NestJS**, **PostgreSQL**, and **OpenAI GPT-4o**. Track income, expenses, and investments — and get AI-generated insights on your spending behavior.

---

## Tech Stack

| Layer            | Technology                    |
| ---------------- | ----------------------------- |
| Framework        | NestJS (Node.js)              |
| Database         | PostgreSQL + TypeORM          |
| Auth             | JWT (Access + Refresh tokens) |
| AI               | OpenAI GPT-4o                 |
| Validation       | class-validator               |
| Password Hashing | bcrypt                        |

---

## Features

- **Auth** — Register, login (email or phone), JWT access + refresh token rotation, logout, password update
- **Transactions** — Full CRUD with filters (type, category, date range, amount range, keyword search, sorting)
- **Analytics** — Income/expense/investment summary, spending by category with percentages, monthly trends
- **AI Insights** — GPT-4o generated spending analysis for the last week, month, or year — and per-category tips

---

## Project Structure

```
src/
├── auth/                      # Auth module
│   ├── auth.service.ts        # Register, login, refresh, logout, update password
│   ├── auth.controller.ts     # Auth routes
│   ├── utils/
│   │   └── auth-util.service.ts  # JWT generation, bcrypt helpers
│   ├── decorators/
│   │   └── current-user.decorator.ts
│   └── dto/
│       ├── register.dto.ts
│       ├── login.dto.ts
│       ├── password.dto.ts
│       └── refreshToken.dto.ts
├── users/
│   ├── users.service.ts       # Profile update, find by ID
│   ├── users.controller.ts
│   ├── guards/
│   │   └── jwt-auth.guard.ts
│   └── jwt.strategy.ts
├── transactions/
│   ├── transactions.service.ts   # CRUD + analytics queries
│   ├── transactions.controller.ts
│   ├── utils/
│   │   └── transaction.enum.ts   # TransactionType, Category, PaymentModes
│   └── dto/
│       └── transaction.dto.ts
├── insights/
│   ├── insights.service.ts    # OpenAI integration
│   └── insights.controller.ts
├── entities/
│   ├── user.entity.ts
│   ├── credentials.entity.ts
│   └── transactions.entity.ts
└── types/
    ├── auth-types.ts
    └── common-types.ts
```

---

## Getting Started

### Prerequisites

- Node.js v18+
- PostgreSQL running locally or via Docker
- OpenAI API key

### Installation

```bash
git clone https://github.com/titas1803/finsight-backend
cd finsight-backend
npm install
```

### Environment Variables

Create a `.env` file in the root:

```env
# Database
DATABASE_URL=postgresql://postgres:password@localhost:5432/finsight

# JWT
JWT_ACCESS_SECRET=your-access-token-secret
JWT_REFRESH_SECRET=your-refresh-token-secret

# Bcrypt
PASSWORD_SALT=10

# OpenAI
OPENAI_API_KEY=sk-...

# App
PORT=3000

#Redis
REDIS_HOST=redis://localhost:6379
```

### Run

```bash
# Development
npm run start:dev

# Production
npm run build
npm run start:prod
```

---

## API Reference

### Auth — `/auth`

| Method | Endpoint                | Auth | Description                          |
| ------ | ----------------------- | ---- | ------------------------------------ |
| POST   | `/auth/register`        | ❌   | Create a new account                 |
| POST   | `/auth/login`           | ❌   | Login with email or phone + password |
| POST   | `/auth/refresh`         | ❌   | Get new access + refresh token pair  |
| PATCH  | `/auth/update-password` | ✅   | Change password                      |
| POST   | `/auth/logout`          | ✅   | Invalidate refresh token             |

#### Register

```json
POST /auth/register
{
  "firstName": "Arjun",
  "lastName": "Das",
  "email": "arjun@example.com",
  "phoneNumber": "9876543210",
  "password": "StrongPass@123"
}
```

#### Login

```json
POST /auth/login
{
  "email": "arjun@example.com",
  "password": "StrongPass@123"
}

// Response
{
  "message": "Login successful!",
  "user": { "id": "uuid", "email": "...", "role": "USER", ... },
}
```

#### Refresh Tokens

```json
POST /auth/refresh

// Response
{
  "message": "Tokens refreshed successfully",
}
```

---

### Users — `/users`

| Method | Endpoint        | Auth | Description                         |
| ------ | --------------- | ---- | ----------------------------------- |
| PATCH  | `/users/update` | ✅   | Update profile (name, email, phone) |

---

### Transactions — `/transactions`

> All routes require a valid `Authorization: Bearer <accessToken>` header.

| Method | Endpoint                   | Description                             |
| ------ | -------------------------- | --------------------------------------- |
| POST   | `/transactions`            | Create a transaction                    |
| GET    | `/transactions`            | Get all transactions (with filters)     |
| GET    | `/transactions/summary`    | Income / expense / investment summary   |
| GET    | `/transactions/last-days`  | Transactions for last week/month/year   |
| GET    | `/transactions/:id`        | Get single transaction                  |
| GET    | `/transactions/type/:type` | Spending grouped by category for a type |
| PATCH  | `/transactions/:id`        | Update a transaction                    |
| DELETE | `/transactions/:id`        | Delete a transaction                    |

#### Create Transaction

```json
POST /transactions
{
  "amount": 500,
  "description": "Grocery shopping",
  "category": "food",
  "type": "expense",
  "paymentMode": "upi",
  "date": "2026-05-01"
}
```

#### Get All — Query Filters

```
GET /transactions?type=expense
GET /transactions?category=food
GET /transactions?startDate=2026-04-01&endDate=2026-04-30
GET /transactions?startAmount=100&endAmount=1000
GET /transactions?search=netflix
GET /transactions?sortBy=amount&order=DESC
```

All filters are optional and combinable.

#### Summary

```
GET /transactions/summary
GET /transactions/summary?startDate=2026-04-01&endDate=2026-04-30

// Response
{
  "totalIncome": 50000,
  "totalExpense": 18000,
  "totalInvestment": 10000,
  "netBalance": 22000,
  "transactionCount": 34
}
```

#### By Type and Category

```
GET /transactions/type/expense
GET /transactions/type/expense?category=food

// Response
[
  { "category": "food",      "total": 4500, "percentage": "37.50", "count": 12 },
  { "category": "transport", "total": 3200, "percentage": "26.67", "count": 8  }
]
```

---

### Insights — `/insights`

> All routes require a valid `Authorization: Bearer <accessToken>` header.

| Method | Endpoint                           | Description                    |
| ------ | ---------------------------------- | ------------------------------ |
| GET    | `/insights?period=week`            | AI insights for last 7 days    |
| GET    | `/insights?period=month`           | AI insights for last 30 days   |
| GET    | `/insights?period=year`            | AI insights for last 1 year    |
| GET    | `/insights/category?category=food` | AI tip for a specific category |

#### Insights Response

```json
{
  "period": "week",
  "insight": "You spent ₹8,200 this week with food being your biggest expense at ₹3,100. Great job on keeping your investment consistent! Tip: Try cooking at home 2–3 days a week to cut your food spend by around 25%.",
  "transactionCount": 12,
  "stats": {
    "totalIncome": "25000.00",
    "totalExpense": "8200.00",
    "totalInvestment": "5000.00",
    "netBalance": "11800.00",
    "topExpenseCategory": "food (₹3100.00)",
    "transactionCount": 12
  }
}
```

---

## Data Models

### Transaction Types

```
income | expense | investment
```

### Categories

```
food | transport | entertainment | health | shopping | bills | salary | other
```

### Payment Modes

```
cash | upi | card | netbanking | other
```

---

## Auth Flow

```
Register → Login → { accessToken (1h), refreshToken (7d) }
         ↓
   Use accessToken for all protected routes
         ↓
   401 Unauthorized? → POST /auth/refresh with refreshToken
         ↓
   New { accessToken, refreshToken } pair issued (old token invalidated)
         ↓
   Logout → refreshToken cleared from DB
```

**Security notes:**

- Access tokens expire in **1 hour**
- Refresh tokens expire in **7 days**
- Refresh tokens are **bcrypt-hashed** before storage — raw tokens are never persisted
- Every refresh call **rotates** the token — the old refresh token is immediately invalidated
- Logout sets `refreshToken = null` in the database, blocking all future refresh attempts

---

## License

MIT
