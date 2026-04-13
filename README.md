<div align="center">

# 🌾 Grain Shop API

<img src="https://readme-typing-svg.demolab.com?font=Fira+Code&size=22&pause=1000&color=F5A623&center=true&vCenter=true&width=600&lines=Production-ready+E-Commerce+REST+API;TypeScript+%2B+Express.js+v5+%2B+Prisma+7;Stripe+%7C+Clerk+%7C+MeiliSearch+%7C+Redis;Event-Driven+with+Outbox+Pattern" alt="Typing SVG" />

<br/>

[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Node.js](https://img.shields.io/badge/Node.js-20+-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)](https://nodejs.org)
[![Express](https://img.shields.io/badge/Express.js-v5-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com)
[![Prisma](https://img.shields.io/badge/Prisma-7-2D3748?style=for-the-badge&logo=prisma&logoColor=white)](https://prisma.io)

[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791?style=for-the-badge&logo=postgresql&logoColor=white)](https://postgresql.org)
[![Redis](https://img.shields.io/badge/Redis-7-DC382D?style=for-the-badge&logo=redis&logoColor=white)](https://redis.io)
[![RabbitMQ](https://img.shields.io/badge/RabbitMQ-3-FF6600?style=for-the-badge&logo=rabbitmq&logoColor=white)](https://www.rabbitmq.com)
[![MeiliSearch](https://img.shields.io/badge/MeiliSearch-Search-FF5CAA?style=for-the-badge&logo=meilisearch&logoColor=white)](https://www.meilisearch.com)
[![Stripe](https://img.shields.io/badge/Stripe-Payments-008CDD?style=for-the-badge&logo=stripe&logoColor=white)](https://stripe.com)
[![Clerk](https://img.shields.io/badge/Clerk-Auth-6C47FF?style=for-the-badge&logo=clerk&logoColor=white)](https://clerk.com)
[![Resend](https://img.shields.io/badge/Resend-Email-000000?style=for-the-badge&logo=mail.ru&logoColor=white)](https://resend.com)
[![AWS S3](https://img.shields.io/badge/AWS_S3-Storage-FF9900?style=for-the-badge&logo=amazons3&logoColor=white)](https://aws.amazon.com/s3)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?style=for-the-badge&logo=docker&logoColor=white)](https://docker.com)
[![License](https://img.shields.io/badge/License-ISC-22c55e?style=for-the-badge)](./LICENSE)

<br/>

> A robust, production-ready REST API for an e-commerce grain shop.
> Features Stripe payments, Clerk auth, MeiliSearch full-text search,
> Redis caching, rate limiting, graceful shutdown, and an **Outbox Pattern**
> with **React Email** receipts delivered via **Resend**.

</div>

---

## 📋 Table of Contents

- [✨ Features](#-features)
- [🏗️ Architecture](#-architecture)
- [📁 Project Structure](#-project-structure)
- [🚀 Getting Started](#-getting-started)
- [⚙️ Environment Variables](#-environment-variables)
- [📡 API Reference](#-api-reference)
- [🔩 Key Design Decisions](#-key-design-decisions)
- [🗺️ Roadmap](#-roadmap)
- [🧑‍💻 Scripts](#-scripts)
- [🐳 Docker Infrastructure](#-docker-infrastructure)
- [🗄️ Database Schema](#-database-schema)

---

## ✨ Features

| | Feature | Description |
|---|---|---|
| 🔐 | **Authentication & RBAC** | JWT-based auth via Clerk with `user` / `admin` roles |
| 🛍️ | **Product Catalog** | Full CRUD with category filtering, pagination, and cache |
| 🔍 | **Full-text Search** | MeiliSearch-powered instant product search, synced via RabbitMQ |
| 🛒 | **Shopping Cart** | Per-user persistent cart with quantity control |
| 💳 | **Stripe Checkout** | Secure payment sessions with webhook idempotency |
| 📦 | **Order Lifecycle** | `PENDING → PAID → SHIPPED → CANCELLED` state machine |
| 🖼️ | **Image Uploads** | File upload to AWS S3 / LocalStack via Multer |
| 📬 | **Outbox Pattern** | Transactional outbox → RabbitMQ for reliable messaging |
| 📧 | **React Email Receipts** | HTML receipts rendered with React Email, sent via Resend |
| ⚡ | **Redis Caching** | `CacheService` with TTL, prefix invalidation, and distributed locks |
| 🛑 | **Rate Limiting** | Redis-backed `express-rate-limit` with per-route strategies |
| 🔌 | **Graceful Shutdown** | SIGTERM/SIGINT handlers — drains connections before exit |
| 🌍 | **Env Validation** | Zod-based environment schema validation on startup |
| 🛡️ | **Request Validation** | Schema validation with Zod (type-safe end-to-end) |
| 🪵 | **Structured Logging** | JSON logs with Pino + pino-http |
| 🔍 | **Code Quality** | Linting & formatting with Biome |

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      CLIENT / FRONTEND                       │
└──────────────────────────┬──────────────────────────────────┘
                           │ HTTP
┌──────────────────────────▼──────────────────────────────────┐
│                     EXPRESS.JS v5 API                        │
│                                                              │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌────────────┐  │
│  │ Products │  │  Orders  │  │   Cart   │  │   Upload   │  │
│  └──────────┘  └──────────┘  └──────────┘  └────────────┘  │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Rate Limiter (Redis) │ Zod Validation │ Clerk Auth   │   │
│  └──────────────────────────────────────────────────────┘   │
└────┬──────────────┬──────────────────┬──────────────────────┘
     │              │                  │
┌────▼──────┐ ┌─────▼─────┐ ┌─────────▼───────┐
│ PostgreSQL │ │   Redis   │ │    AWS S3 /     │
│ (Prisma 7) │ │  Cache +  │ │   LocalStack    │
│            │ │  Locks    │ │                 │
└────┬───────┘ └───────────┘ └─────────────────┘
     │
     │  Stripe webhook → order PAID → write outbox event (atomic)
     │
┌────▼───────────────────────────────────────────────────────┐
│                   OUTBOX WORKER  (every 5s)                 │
│   outbox_events (processed=false) → RabbitMQ               │
│                 "order_notifications" queue                 │
│                 "product_updates" queue                     │
└────────────────────┬───────────────────────────────────────┘
                     │
       ┌─────────────┴──────────────┐
       │                            │
┌──────▼───────────┐   ┌────────────▼───────────┐
│  EMAIL CONSUMER  │   │   MEILI CONSUMER        │
│  Renders React   │   │   Indexes products into │
│  Email → Resend  │   │   MeiliSearch           │
│  API → inbox 📧  │   │   for instant search 🔍 │
└──────────────────┘   └────────────────────────┘
```

### Tech Stack

| Layer | Technology |
|---|---|
| **Runtime** | Node.js 20+ (ESM) |
| **Language** | TypeScript 5 — strict mode, `nodenext` module resolution |
| **Framework** | Express.js v5 |
| **ORM** | Prisma 7 with `@prisma/adapter-pg` |
| **Database** | PostgreSQL 16 |
| **Cache** | Redis 7 (ioredis) + `CacheService` abstraction |
| **Search** | MeiliSearch (synced via RabbitMQ consumer) |
| **Rate Limiting** | `express-rate-limit` + `rate-limit-redis` |
| **Message Broker** | RabbitMQ 3 (amqplib) |
| **Auth** | Clerk (`@clerk/express`) |
| **Payments** | Stripe v22 |
| **File Storage** | AWS S3 / LocalStack |
| **Email** | Resend API + React Email (`@react-email/components`) |
| **Validation** | Zod v4 (requests + env schema) |
| **Logging** | Pino + pino-http |
| **Linting** | Biome 2 |

---

## 📁 Project Structure

```
grain-shop-api/
│
├── prisma/
│   ├── migrations/             # Full migration history
│   ├── schema.prisma           # Main Prisma config & datasource
│   ├── user.prisma             # User model
│   ├── product.prisma          # Product & Category models
│   ├── cart.prisma             # Cart & CartItem models
│   ├── order.prisma            # Order & OrderItem models
│   ├── events.prisma           # OutboxEvent & StripeEvent models
│   └── enums.prisma            # OrderStatus enum
│
├── src/
│   ├── consumers/
│   │   ├── email.consumer.ts   # RabbitMQ → React Email → Resend
│   │   └── meili.consumer.ts   # RabbitMQ → MeiliSearch indexing
│   │
│   ├── db/
│   │   └── prisma.ts           # Prisma client singleton
│   │
│   ├── errors/
│   │   └── app.error.ts        # AppError, NotFoundError, BadRequestError,
│   │                           # ConflictError, ForbiddenError, UnauthorizedError
│   │
│   ├── features/               # Feature-slice architecture
│   │   ├── cart/               # controller · service · routes · schema
│   │   ├── category/           # controller · service · routes · schema
│   │   ├── order/              # controller · service · routes · schema
│   │   ├── product/            # controller · service · routes · schema
│   │   ├── upload/             # S3 upload controller · service · routes
│   │   ├── user/               # controller · service · routes
│   │   └── webhooks/           # Clerk & Stripe webhook handlers
│   │
│   ├── middlewares/
│   │   ├── auth.middleware.ts      # requireApiAuth, requireAdmin
│   │   ├── error.middleware.ts     # Global error handler
│   │   ├── rate.limit.middleware.ts# globalLimiter, publicReadLimiter (Redis-backed)
│   │   ├── validate.ts             # Zod validation middleware
│   │   └── webhook.middleware.ts   # Clerk webhook signature verification
│   │
│   ├── templates/
│   │   └── ReceiptEmail.tsx    # React Email order receipt template
│   │
│   ├── types/
│   │   ├── express.d.ts        # Express request augmentations
│   │   └── index.ts            # Shared type aliases
│   │
│   ├── utils/
│   │   ├── cache.ts            # CacheService (get/set/del/getOrSet/withLock)
│   │   ├── env.ts              # Zod env schema validation
│   │   ├── logger.ts           # Pino logger instance
│   │   ├── meilisearch.ts      # MeiliSearch client + index setup
│   │   ├── redis.ts            # ioredis client + acquireLock helper
│   │   ├── shutdown.ts         # Graceful shutdown (SIGTERM/SIGINT)
│   │   └── stripe.ts           # Stripe SDK instance
│   │
│   ├── workers/
│   │   └── outbox.worker.ts    # Polls DB every 5s → RabbitMQ
│   │
│   └── server.ts               # Entry point — starts API, worker, consumers
│
├── docker-compose.yml          # PostgreSQL, Redis, RabbitMQ, LocalStack, MeiliSearch
├── init-s3.sh                  # LocalStack S3 bucket bootstrap
├── biome.json                  # Linter & formatter config
├── tsconfig.json               # Strict TypeScript config
└── package.json
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** ≥ 20
- **Docker** & Docker Compose
- [Clerk](https://clerk.com) account
- [Stripe](https://stripe.com) account
- [Resend](https://resend.com) account

### 1 · Clone

```bash
git clone https://github.com/your-username/grain-shop-api.git
cd grain-shop-api
```

### 2 · Install dependencies

```bash
npm install
```

### 3 · Configure environment variables

```bash
cp .env.example .env
# fill in your values — see the section below
```

### 4 · Start infrastructure

```bash
docker compose up -d
# PostgreSQL · Redis · RabbitMQ · LocalStack (S3) · MeiliSearch
```

### 5 · Run database migrations

```bash
npx prisma migrate deploy
```

### 6 · Start the dev server

```bash
npm run dev
# API + Outbox Worker + Email Consumer + Meili Consumer — all in one process
# http://localhost:3000
```

---

## ⚙️ Environment Variables

```env
# ── Server ────────────────────────────────────────
PORT=3000
FRONTEND_URLS=http://localhost:5173

# ── Database ──────────────────────────────────────
DATABASE_URL="postgresql://admin:supersecret@localhost:5432/grain_shop"

# ── Redis ─────────────────────────────────────────
REDIS_URL="redis://localhost:6379"

# ── RabbitMQ ──────────────────────────────────────
RABBITMQ_URL="amqp://admin:supersecret@localhost:5672"

# ── MeiliSearch ───────────────────────────────────
MEILI_HOST=http://localhost:7700
MEILI_MASTER_KEY=supersecret

# ── Clerk ─────────────────────────────────────────
CLERK_SECRET_KEY=sk_test_...
CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_WEBHOOK_SECRET=whsec_...

# ── Stripe ────────────────────────────────────────
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# ── Resend (transactional email) ──────────────────
RESEND_API_KEY=re_...

# ── AWS S3 / LocalStack ───────────────────────────
AWS_ACCESS_KEY_ID=test
AWS_SECRET_ACCESS_KEY=test
AWS_REGION=us-east-1
AWS_ENDPOINT=http://localhost:4566   # remove for real AWS
S3_BUCKET_NAME=grain-shop-images

# ── LocalStack (local dev only) ───────────────────
LOCALSTACK_AUTH_TOKEN=your_token
```

---

## 📡 API Reference

> All endpoints (except webhooks) require a valid Clerk session token in the `Authorization: Bearer <token>` header.
> Routes marked 🔒 require the **Admin** role.

### 👤 Users

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/users/me` | Get current user profile |

### 📦 Products

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/products` | List products (filter, paginate, full-text search) |
| `GET` | `/products/:id` | Get a single product |
| `POST` | `/products` 🔒 | Create a product |
| `PATCH` | `/products/:id` 🔒 | Update a product |
| `DELETE` | `/products/:id` 🔒 | Delete a product |

### 🏷️ Categories

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/categories` | List all categories |
| `POST` | `/categories` 🔒 | Create a category |
| `PATCH` | `/categories/:id` 🔒 | Update a category |
| `DELETE` | `/categories/:id` 🔒 | Delete a category |

### 🛒 Cart

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/cart` | Get current user's cart |
| `POST` | `/cart` | Add item to cart |
| `PATCH` | `/cart/:itemId` | Update item quantity |
| `DELETE` | `/cart/:itemId` | Remove item from cart |

### 💳 Orders

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/orders/checkout` | Create Stripe checkout session from cart |
| `GET` | `/orders` | Get my orders (paginated) |
| `GET` | `/orders/:id` | Get a single order |
| `PATCH` | `/orders/:id/status` 🔒 | Update order status |

### 🖼️ Uploads

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/upload/image` 🔒 | Upload product image to S3 |

### 🔔 Webhooks

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/webhooks/clerk` | Clerk user sync (create / update / delete) |
| `POST` | `/webhooks/stripe` | Stripe payment event (fulfillment + idempotency) |

---

## 🔩 Key Design Decisions

### 📬 Outbox Pattern — Guaranteed Delivery

When a Stripe payment webhook arrives, the order is fulfilled and an outbox event is written to the `outbox_events` table **in the same database transaction**. A background worker polls for unpublished events every **5 seconds** and forwards them to RabbitMQ — guaranteeing at-least-once delivery even when the broker is temporarily unavailable.

```
Stripe webhook → order PAID
     │
     ▼  (single atomic DB transaction)
┌──────────────────────────┐
│  orders     (status=PAID)│
│  outbox_events           │  ← written atomically
└──────────────────────────┘
          │ worker polls every 5s
          ▼
  RabbitMQ "order_notifications"  →  Email Consumer → Resend 📧
  RabbitMQ "product_updates"      →  Meili Consumer → MeiliSearch 🔍
```

### 🔍 MeiliSearch Full-text Search

Products are indexed into MeiliSearch asynchronously via a dedicated RabbitMQ consumer (`meili.consumer.ts`). Search queries bypass PostgreSQL entirely, returning instant, typo-tolerant results.

### ⚡ CacheService — Redis Abstraction

A purpose-built `CacheService` class wraps ioredis with ergonomic methods:

```
getOrSet(key, fetchFn, ttl)   — read-through cache
invalidateByPrefix(prefix)    — bulk cache busting on mutation
withLock(lockKey, fn, ttl)    — distributed lock for critical sections
buildKey(namespace, params)   — deterministic cache key builder
```

### 🛑 Rate Limiting

Two strategies backed by the **Redis store**:

- `globalLimiter` — applied to all routes as a baseline throttle
- `publicReadLimiter` — a more permissive limit for public read endpoints (e.g. product listing)

### 🔌 Graceful Shutdown

`setupGracefulShutdown(server)` registers `SIGTERM` and `SIGINT` handlers. On signal, the HTTP server stops accepting new connections, then waits for in-flight requests to finish before disconnecting Prisma and Redis — ensuring zero dropped requests during deploys.

### 🔁 Stripe Webhook Idempotency

Stripe event IDs are deduplicated using the `stripe_events` table. Retries from Stripe are silently discarded — preventing double order fulfillment.

### 📧 React Email + Resend

Order receipts are built as **React components** (`src/templates/ReceiptEmail.tsx`) and rendered server-side to HTML via `@react-email/render`. The email consumer (`consumers/email.consumer.ts`) delivers them via **Resend API** with nack-based retry on failure.

### 🧩 Feature-Slice Architecture

Every domain is fully self-contained: `controller · service · routes · schema`. No cross-domain imports — each feature is independently readable, testable, and replaceable.

### 🛡️ Strict TypeScript + Zod Env Validation

`noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `verbatimModuleSyntax`, and `strict: true` catch runtime bugs at compile time. All environment variables are validated against a Zod schema at startup — the process exits immediately if any required variable is missing or malformed.

---

## 🗺️ Roadmap

### ✅ Implemented

- [x] **Feature-slice architecture** — each domain fully self-contained
- [x] **Clerk authentication** — JWT + RBAC (`user` / `admin`)
- [x] **Clerk webhooks** — user sync on create / update / delete
- [x] **Stripe Checkout** — hosted payment sessions
- [x] **Stripe webhooks** — order fulfillment on `payment_intent.succeeded`
- [x] **Stripe event idempotency** — dedup via `stripe_events` table
- [x] **Outbox Pattern** — atomic event write + background worker polling every 5s
- [x] **RabbitMQ messaging** — durable queues, persistent messages
- [x] **Dead Letter Queue** — failed messages are nacked without requeue
- [x] **Email consumer** — RabbitMQ → React Email → Resend API
- [x] **MeiliSearch full-text search** — products indexed via dedicated RabbitMQ consumer
- [x] **Redis caching** — `CacheService` with TTL, prefix invalidation, distributed locks
- [x] **Rate limiting** — Redis-backed `express-rate-limit`, global + per-route strategies
- [x] **Graceful shutdown** — SIGTERM/SIGINT drain in-flight requests, disconnect Prisma + Redis
- [x] **Zod env validation** — process fails fast on missing/malformed env vars
- [x] **React Email templates** — `ReceiptEmail.tsx` with order details and product list
- [x] **S3 image uploads** — Multer + AWS SDK, LocalStack for local dev
- [x] **Modular Prisma schema** — one `.prisma` file per domain
- [x] **Structured logging** — Pino + pino-http with request context
- [x] **Biome linting** — consistent formatting across the entire codebase

### 🔜 Planned

- [ ] **Improve AWS storage** — presigned URLs, CDN integration, file size limits
- [ ] **Polish email template** — better styling, logo, footer, mobile responsiveness
- [ ] **API Documentation** — Swagger / OpenAPI spec
- [ ] **Tests** — unit tests for services, integration tests for routes
- [ ] **Optimisation** — query analysis, N+1 prevention, bulk operations
- [ ] **Wishlist** — save products for later, notify on restock
- [ ] **Slug auto-generation** — human-readable URLs for products and categories
- [ ] **RabbitMQ Topic Exchanges** — replace direct queues with topic-based routing

---

## 🧑‍💻 Scripts

```bash
npm run dev      # Start dev server with hot reload (tsx watch)
                 # also boots outbox worker + email consumer + meili consumer
npm run build    # Compile TypeScript → dist/
npm run start    # Run compiled production server
```

---

## 🐳 Docker Infrastructure

```bash
docker compose up -d
```

| Service | Image | Port(s) |
|---|---|---|
| `postgres` | `postgres:16-alpine` | `5432` |
| `redis` | `redis:7-alpine` | `6379` |
| `rabbitmq` | `rabbitmq:3-management-alpine` | `5672` · UI: `15672` |
| `localstack` | `localstack/localstack:latest` | `4566` |
| `meilisearch` | `getmeili/meilisearch:latest` | `7700` |

**RabbitMQ Management UI** → `http://localhost:15672` (`admin` / `supersecret`)
**MeiliSearch Dashboard** → `http://localhost:7700`

The `init-s3.sh` script runs automatically on LocalStack startup and creates the `grain-shop-images` S3 bucket with public-read ACL.

---

## 🗄️ Database Schema

The Prisma schema is split into focused domain files:

| File | Models |
|---|---|
| `user.prisma` | `User` |
| `product.prisma` | `Product`, `Category` |
| `cart.prisma` | `Cart`, `CartItem` |
| `order.prisma` | `Order`, `OrderItem` |
| `events.prisma` | `OutboxEvent`, `StripeEvent` |
| `enums.prisma` | `OrderStatus` |

### Order Lifecycle

```
 PENDING ──► PAID ──► SHIPPED
    │
    └──► CANCELLED
```

---

<div align="center">

Made with ☕ and TypeScript

</div>