# 🌾 Grain Shop API

A robust, production-ready REST API for an e-commerce grain shop, built with **Node.js**, **TypeScript**, and **Express.js v5**. Features Stripe payments, Clerk authentication, S3 file uploads, and a reliable Outbox pattern for event-driven messaging.

---

## ✨ Features

- 🔐 **Authentication** — JWT-based auth powered by [Clerk](https://clerk.com), with role-based access control (user / admin)
- 🛍️ **Product Catalog** — Full CRUD for products and categories with filtering and pagination
- 🛒 **Shopping Cart** — Per-user cart management with item quantity control
- 💳 **Stripe Checkout** — Secure payment sessions via Stripe, with webhook processing and idempotency via event deduplication
- 📦 **Order Management** — Order lifecycle tracking (`PENDING → PAID → SHIPPED → CANCELLED`)
- 🖼️ **Image Uploads** — File upload to AWS S3 (or LocalStack for local dev) via Multer
- 📬 **Outbox Pattern** — Reliable event publishing to RabbitMQ using a transactional outbox worker
- 🗄️ **Redis Caching** — Fast data access with ioredis
- 📋 **Request Validation** — Schema validation with [Zod](https://zod.dev)
- 🪵 **Structured Logging** — JSON logging with [Pino](https://getpino.io)

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js (ESM) |
| Language | TypeScript 5 |
| Framework | Express.js v5 |
| ORM | Prisma 7 |
| Database | PostgreSQL 16 |
| Cache | Redis 7 |
| Message Broker | RabbitMQ 3 |
| Auth | Clerk |
| Payments | Stripe |
| File Storage | AWS S3 / LocalStack |
| Validation | Zod |
| Logging | Pino + pino-http |
| Linting | Biome |

---

## 📁 Project Structure

```
src/
├── db/                    # Prisma client singleton
├── errors/                # Custom error classes (AppError, NotFoundError, etc.)
├── features/
│   ├── cart/              # Cart controller, service, routes, schema
│   ├── category/          # Category controller, service, routes, schema
│   ├── order/             # Order controller, service, routes, schema
│   ├── product/           # Product controller, service, routes, schema
│   ├── upload/            # S3 upload controller, service, routes
│   ├── user/              # User controller, service, routes
│   └── webhooks/          # Clerk & Stripe webhook handlers
├── middlewares/
│   ├── auth.middleware.ts  # requireApiAuth, requireAdmin
│   ├── error.middleware.ts # Global error handler
│   ├── validate.ts         # Zod validation middleware
│   └── webhook.middleware.ts
├── types/                 # Shared TypeScript types & Express augmentations
├── utils/                 # logger, redis, stripe utilities
├── workers/
│   └── outbox.worker.ts   # Transactional outbox → RabbitMQ
└── server.ts
prisma/
├── schema.prisma           # Main Prisma config
├── *.prisma                # Modular schema files (user, product, cart, order, events)
└── migrations/
```

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org) >= 20
- [Docker](https://www.docker.com) & Docker Compose
- A [Clerk](https://clerk.com) account
- A [Stripe](https://stripe.com) account

### 1. Clone the repository

```bash
git clone https://github.com/your-username/grain-shop-api.git
cd grain-shop-api
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Create a `.env` file in the project root:

```env
# Server
PORT=3000

# Database
DATABASE_URL="postgresql://admin:supersecret@localhost:5432/clothes_shop"

# Redis
REDIS_URL="redis://localhost:6379"

# RabbitMQ
RABBITMQ_URL="amqp://admin:supersecret@localhost:5672"

# Clerk
CLERK_SECRET_KEY=sk_test_...
CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_WEBHOOK_SECRET=whsec_...

# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# AWS S3 / LocalStack
AWS_ACCESS_KEY_ID=test
AWS_SECRET_ACCESS_KEY=test
AWS_REGION=us-east-1
AWS_ENDPOINT=http://localhost:4566
S3_BUCKET_NAME=clothes-shop-images

# LocalStack (local dev only)
LOCALSTACK_AUTH_TOKEN=your_token
```

### 4. Start infrastructure services

```bash
docker compose up -d
```

This starts PostgreSQL, Redis, RabbitMQ, and LocalStack (S3 emulation).

### 5. Run database migrations

```bash
npx prisma migrate deploy
```

### 6. Start the development server

```bash
npm run dev
```

The API will be available at `http://localhost:3000`.

---

## 📡 API Endpoints

> All routes except webhooks require a valid Clerk session token in the `Authorization` header.
> Routes marked 🔒 require admin role.

### Users

| Method | Path | Description |
|---|---|---|
| `GET` | `/users/me` | Get current user profile |

### Products

| Method | Path | Description |
|---|---|---|
| `GET` | `/products` | List products (with filtering & pagination) |
| `GET` | `/products/:id` | Get a single product |
| `POST` | `/products` 🔒 | Create a product |
| `PATCH` | `/products/:id` 🔒 | Update a product |
| `DELETE` | `/products/:id` 🔒 | Delete a product |

### Categories

| Method | Path | Description |
|---|---|---|
| `GET` | `/categories` | List all categories |
| `POST` | `/categories` 🔒 | Create a category |
| `PATCH` | `/categories/:id` 🔒 | Update a category |
| `DELETE` | `/categories/:id` 🔒 | Delete a category |

### Cart

| Method | Path | Description |
|---|---|---|
| `GET` | `/cart` | Get current user's cart |
| `POST` | `/cart` | Add item to cart |
| `PATCH` | `/cart/:itemId` | Update item quantity |
| `DELETE` | `/cart/:itemId` | Remove item from cart |

### Orders

| Method | Path | Description |
|---|---|---|
| `POST` | `/orders/checkout` | Create Stripe checkout session from cart |
| `GET` | `/orders` | Get current user's orders |
| `GET` | `/orders/:id` | Get a single order |
| `PATCH` | `/orders/:id/status` 🔒 | Update order status |

### Uploads

| Method | Path | Description |
|---|---|---|
| `POST` | `/upload/image` 🔒 | Upload an image to S3 |

### Webhooks

| Method | Path | Description |
|---|---|---|
| `POST` | `/webhooks/clerk` | Clerk user sync webhook |
| `POST` | `/webhooks/stripe` | Stripe payment event webhook |

---

## 🏗️ Architecture Notes

### Outbox Pattern

Orders trigger Stripe checkout sessions and persist outbox events to the database in a single transaction. A background worker (`outbox.worker.ts`) polls for unpublished events and reliably forwards them to RabbitMQ — guaranteeing at-least-once delivery even if the broker is temporarily unavailable.

### Stripe Webhook Idempotency

Stripe events are deduplicated using a `stripe_events` table. Before processing any webhook, the event ID is checked against the table, preventing duplicate fulfillment on retry.

### Feature-Based Structure

Each domain (product, cart, order, etc.) is fully self-contained with its own `controller`, `service`, `routes`, and `schema` — making it easy to locate, test, and extend any feature in isolation.

---

## 🧑‍💻 Development Scripts

```bash
npm run dev      # Start dev server with hot reload (tsx watch)
npm run build    # Compile TypeScript to dist/
npm run start    # Run compiled production server
```

---

## 📦 Database Schema

The Prisma schema is split into modular files for clarity:

- `user.prisma` — User model
- `product.prisma` — Product & Category models
- `cart.prisma` — Cart & CartItem models
- `order.prisma` — Order & OrderItem models
- `events.prisma` — OutboxEvent & StripeEvent models
- `enums.prisma` — `OrderStatus` enum (`PENDING`, `PAID`, `SHIPPED`, `CANCELLED`)

---

## 📄 License

ISC
