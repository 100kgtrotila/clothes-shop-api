<div align="center">

# 🌾 Grain Shop API

<img src="https://readme-typing-svg.demolab.com?font=Fira+Code&size=22&pause=1000&color=F5A623&center=true&vCenter=true&width=600&lines=Production-ready+E-Commerce+REST+API;TypeScript+%2B+Express.js+v5+%2B+Prisma+7;Stripe+Payments+%7C+Clerk+Auth+%7C+S3+Uploads;Event-Driven+with+Outbox+Pattern" alt="Typing SVG" />

<br/>

[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Node.js](https://img.shields.io/badge/Node.js-20+-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)](https://nodejs.org)
[![Express](https://img.shields.io/badge/Express.js-v5-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com)
[![Prisma](https://img.shields.io/badge/Prisma-7-2D3748?style=for-the-badge&logo=prisma&logoColor=white)](https://prisma.io)

[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791?style=for-the-badge&logo=postgresql&logoColor=white)](https://postgresql.org)
[![Redis](https://img.shields.io/badge/Redis-7-DC382D?style=for-the-badge&logo=redis&logoColor=white)](https://redis.io)
[![RabbitMQ](https://img.shields.io/badge/RabbitMQ-3-FF6600?style=for-the-badge&logo=rabbitmq&logoColor=white)](https://www.rabbitmq.com)
[![Stripe](https://img.shields.io/badge/Stripe-Payments-008CDD?style=for-the-badge&logo=stripe&logoColor=white)](https://stripe.com)
[![Clerk](https://img.shields.io/badge/Clerk-Auth-6C47FF?style=for-the-badge&logo=clerk&logoColor=white)](https://clerk.com)
[![AWS S3](https://img.shields.io/badge/AWS_S3-Storage-FF9900?style=for-the-badge&logo=amazons3&logoColor=white)](https://aws.amazon.com/s3)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?style=for-the-badge&logo=docker&logoColor=white)](https://docker.com)
[![License](https://img.shields.io/badge/License-ISC-22c55e?style=for-the-badge)](./LICENSE)

<br/>

> A robust, production-ready REST API for an e-commerce grain shop.
> Features Stripe payments, Clerk authentication, S3 uploads,
> and a reliable **Outbox Pattern** for event-driven messaging.

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
- [🧑‍💻 Scripts](#-scripts)
- [🐳 Docker Infrastructure](#-docker-infrastructure)
- [🗄️ Database Schema](#-database-schema)

---

## ✨ Features

| | Feature | Description |
|---|---|---|
| 🔐 | **Authentication & RBAC** | JWT-based auth via Clerk with `user` / `admin` roles |
| 🛍️ | **Product Catalog** | Full CRUD with category filtering and pagination |
| 🛒 | **Shopping Cart** | Per-user persistent cart with quantity control |
| 💳 | **Stripe Checkout** | Secure payment sessions with webhook idempotency |
| 📦 | **Order Lifecycle** | `PENDING → PAID → SHIPPED → CANCELLED` state machine |
| 🖼️ | **Image Uploads** | File upload to AWS S3 / LocalStack via Multer |
| 📬 | **Outbox Pattern** | Transactional outbox → RabbitMQ for reliable messaging |
| ⚡ | **Redis Caching** | Fast data access with ioredis |
| 🛡️ | **Request Validation** | Schema validation with Zod (type-safe end-to-end) |
| 🪵 | **Structured Logging** | JSON logs with Pino + pino-http |
| 🔍 | **Code Quality** | Linting & formatting with Biome |

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     CLIENT / FRONTEND                    │
└────────────────────────┬────────────────────────────────┘
                         │ HTTP
┌────────────────────────▼────────────────────────────────┐
│                     EXPRESS.JS v5 API                    │
│                                                          │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌────────┐  │
│  │ Products │  │  Orders  │  │   Cart   │  │ Upload │  │
│  └──────────┘  └──────────┘  └──────────┘  └────────┘  │
│                                                          │
│  ┌────────────────────────────────────────────────────┐  │
│  │            Zod Validation │ Auth Middleware         │  │
│  └────────────────────────────────────────────────────┘  │
└──────┬───────────────┬──────────────────┬───────────────┘
       │               │                  │
┌──────▼──────┐ ┌──────▼──────┐ ┌────────▼──────┐
│  PostgreSQL  │ │    Redis    │ │    AWS S3 /   │
│  (Prisma 7)  │ │   Cache     │ │  LocalStack   │
└─────────────┘ └─────────────┘ └───────────────┘
       │
┌──────▼────────────────────────────────────────────────┐
│                   OUTBOX WORKER                        │
│   DB Outbox Events ──► RabbitMQ Exchange ──► Consumer  │
└───────────────────────────────────────────────────────┘
       │
┌──────▼────────────────────────────────────────────────┐
│              CLERK & STRIPE WEBHOOKS                   │
│  User sync (create/update/delete)                      │
│  payment_intent.succeeded → Order fulfillment          │
│  Idempotency via stripe_events dedup table             │
└───────────────────────────────────────────────────────┘
```

### Tech Stack

| Layer | Technology |
|---|---|
| **Runtime** | Node.js 20+ (ESM) |
| **Language** | TypeScript 5 — strict mode, `nodenext` module resolution |
| **Framework** | Express.js v5 |
| **ORM** | Prisma 7 with `@prisma/adapter-pg` |
| **Database** | PostgreSQL 16 |
| **Cache** | Redis 7 (ioredis) |
| **Message Broker** | RabbitMQ 3 (amqplib) |
| **Auth** | Clerk (`@clerk/express`) |
| **Payments** | Stripe v22 |
| **File Storage** | AWS S3 / LocalStack |
| **Validation** | Zod v4 |
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
│   ├── db/
│   │   └── prisma.ts           # Prisma client singleton
│   │
│   ├── errors/
│   │   └── app.error.ts        # AppError, NotFoundError, BadRequestError
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
│   │   ├── auth.middleware.ts  # requireApiAuth, requireAdmin
│   │   ├── error.middleware.ts # Global error handler
│   │   ├── validate.ts         # Zod validation middleware
│   │   └── webhook.middleware.ts
│   │
│   ├── types/
│   │   ├── express.d.ts        # Express request augmentations
│   │   └── index.ts            # Shared type aliases
│   │
│   ├── utils/
│   │   ├── logger.ts           # Pino logger instance
│   │   ├── redis.ts            # ioredis client
│   │   └── stripe.ts           # Stripe SDK instance
│   │
│   ├── workers/
│   │   └── outbox.worker.ts    # Transactional outbox → RabbitMQ
│   │
│   └── server.ts               # App entry point
│
├── docker-compose.yml          # PostgreSQL, Redis, RabbitMQ, LocalStack
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
# then fill in your values — see the section below
```

### 4 · Start infrastructure

```bash
docker compose up -d
# starts PostgreSQL · Redis · RabbitMQ · LocalStack (S3)
```

### 5 · Run database migrations

```bash
npx prisma migrate deploy
```

### 6 · Start the dev server

```bash
npm run dev
# API available at http://localhost:3000
```

---

## ⚙️ Environment Variables

```env
# ── Server ────────────────────────────────────────
PORT=3000

# ── Database ──────────────────────────────────────
DATABASE_URL="postgresql://admin:supersecret@localhost:5432/grain_shop"

# ── Redis ─────────────────────────────────────────
REDIS_URL="redis://localhost:6379"

# ── RabbitMQ ──────────────────────────────────────
RABBITMQ_URL="amqp://admin:supersecret@localhost:5672"

# ── Clerk ─────────────────────────────────────────
CLERK_SECRET_KEY=sk_test_...
CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_WEBHOOK_SECRET=whsec_...

# ── Stripe ────────────────────────────────────────
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

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
| `GET` | `/products` | List products (filter, paginate) |
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

Order state changes are persisted to the `outbox_events` table **in the same database transaction** as the business data. A background worker polls for unpublished events and forwards them to RabbitMQ — ensuring at-least-once delivery even when the broker is temporarily unavailable.

```
Order Created
     │
     ▼  (single atomic DB transaction)
┌──────────────────────────┐
│  orders table            │
│  outbox_events table  ◄──┼── event written here
└──────────────────────────┘
          │
          │  worker polls every N seconds
          ▼
     RabbitMQ Exchange
          │
          ▼
     Downstream Consumers
```

### 🔁 Stripe Webhook Idempotency

Before processing any Stripe webhook, the event ID is checked against the `stripe_events` table. Duplicate webhook deliveries (Stripe retries on network failure) are silently discarded — preventing double order fulfillment.

### 🧩 Feature-Slice Architecture

Every domain is fully self-contained with its own `controller · service · routes · schema`. Features are independently readable, testable, and extendable with no cross-domain coupling.

### 🛡️ Strict TypeScript

`noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `verbatimModuleSyntax`, and `strict: true` are all enabled — catching entire classes of runtime bugs at compile time.

---

## 🧑‍💻 Scripts

```bash
npm run dev      # Start dev server with hot reload (tsx watch)
npm run build    # Compile TypeScript → dist/
npm run start    # Run compiled production server
```

---

## 🐳 Docker Infrastructure

```bash
docker compose up -d
```

| Service | Image | Port |
|---|---|---|
| `postgres` | `postgres:16-alpine` | `5432` |
| `redis` | `redis:7-alpine` | `6379` |
| `rabbitmq` | `rabbitmq:3-management-alpine` | `5672` · UI: `15672` |
| `localstack` | `localstack/localstack:latest` | `4566` |

**RabbitMQ Management UI** → `http://localhost:15672` (`admin` / `supersecret`)

The `init-s3.sh` script runs automatically on LocalStack startup and creates the `grain-shop-images` S3 bucket with public-read ACL.

---

## 🗄️ Database Schema

The Prisma schema is split into focused domain files for clarity:

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
