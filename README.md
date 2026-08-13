# JoyoHyD

A full-stack e-commerce platform for furniture and home decoration. It provides a complete shopping experience including product catalog, product customization, shopping cart, order management, user reviews, promotional campaigns, and role-based administration.

---

## Table of Contents

- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Environment Variables](#environment-variables)
- [Installation](#installation)
- [Database Setup](#database-setup)
- [Running the Application](#running-the-application)
- [Demo Quick Runbook](#demo-quick-runbook)
- [Portfolio Deployment (Render)](#portfolio-deployment-render)
- [Available Scripts](#available-scripts)
- [API Reference](#api-reference)
- [Authentication](#authentication)
- [Data Models](#data-models)
- [Frontend Features](#frontend-features)
- [Roles & Permissions](#roles--permissions)

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Angular 20, Angular Material, ngx-translate |
| Backend | Node.js, Express 5, TypeScript |
| Database | MySQL |
| ORM | Prisma 6 |
| Auth | Passport.js (Local + JWT) |
| File uploads | Multer |
| Email | Nodemailer |
| Logging | Winston + Morgan |

---

## Project Structure

```
joyohyd-main/
├── app/                    # Angular frontend application
│   ├── src/
│   │   ├── app/            # Feature modules (product, cart, orders, user, etc.)
│   │   ├── assets/i18n/    # Translation files (internationalization)
│   │   ├── environments/   # API URL configuration per environment
│   │   ├── custom-theme.scss
│   │   └── styles.css
│   ├── angular.json
│   └── package.json
└── Server/                 # Express backend application
    ├── source/
    │   ├── server.ts       # Entry point
    │   ├── config/         # Passport & auth utilities
    │   ├── controllers/    # Business logic handlers
    │   ├── routes/         # API route definitions
    │   ├── middleware/      # Auth & error middleware
    │   └── errors/         # Custom error classes
    ├── prisma/
    │   ├── schema.prisma   # Database schema
    │   ├── seed.ts         # Database seeder
    │   └── seeds/          # Seed data modules
    ├── assets/uploads/     # Uploaded product images
    └── package.json
```

---

## Prerequisites

- **Node.js** v18 or higher
- **npm** v9 or higher
- **MySQL** 8.0 or higher (running locally or remotely)
- **Angular CLI** v20 — install globally:
  ```bash
  npm install -g @angular/cli
  ```

---

## Environment Variables

Create a `.env` file inside the `Server/` directory. This file is not included in the repository.

```env
# Server
PORT=3000

# Database — MySQL connection string
DATABASE_URL="mysql://USER:PASSWORD@HOST:PORT/DATABASE_NAME"

# JWT — use a long, random secret
SECRET_KEY="your_super_secret_jwt_key"

# Email (Nodemailer) — used for password reset emails
EMAIL_HOST="smtp.example.com"
EMAIL_PORT=587
EMAIL_USER="your@email.com"
EMAIL_PASS="your_email_password"
```

> **Never commit `.env` to version control.**

---

## Installation

### 1. Clone the repository

```bash
git clone <repository-url>
cd joyohyd-main
```

### 2. Install backend dependencies

```bash
cd Server
npm install
```

### 3. Install frontend dependencies

```bash
cd ../app
npm install
```

---

## Database Setup

All commands below are run from the `Server/` directory.

### 1. Apply migrations

This creates all tables in your MySQL database:

```bash
npx prisma migrate deploy
```

For local development, you can also use:

```bash
npx prisma migrate dev
```

### 2. Generate the Prisma client

```bash
npx prisma generate
```

### 3. Seed the database (optional)

Populates the database with sample data including categories, products, users, reviews, orders, and promotions:

```bash
npx prisma db seed
```

**Sample seed data includes:**
- 5 product categories: Sillas, Mesas, Sofás, Decoración, Iluminación
- 8+ furniture products with prices and images
- 5 sample customer users + admin accounts
- Product reviews, promotions, and complete order examples

**Test credentials after running the seed:**
- Client (public demo): `camila.rojas@ejemplo.com` / `camila123`
- Admin credentials: keep private (do not publish in public repositories)

Admin password in seed is not hardcoded publicly. Set it only when needed:

```bash
SEED_ADMIN_PASSWORD="your_private_admin_password"
```

You can use any of the seeded client accounts if you want to test the buyer flow:
- `esteban.mora@ejemplo.com` / `esteban123`
- `valeria.mendez@ejemplo.com` / `valeria123`
- `luis.navarro@ejemplo.com` / `luis123`
- `sofia.gonzalez@ejemplo.com` / `sofia123`

---

## Running the Application

Both the frontend and backend must run simultaneously.

### Start the backend (from `Server/`)

```bash
npm run dev
```

The API server starts at **http://localhost:3000**

### Start the frontend (from `app/`)

```bash
npm start
```

The Angular dev server starts at **http://localhost:4200**

If port `4200` is already in use:

```bash
npm start -- --port 4201
```

---

## Demo Quick Runbook

Use this flow to have a reproducible and safe live demo in minutes.

### 1. Initialize DB and sample data (from `Server/`)

If you are coming from older local credentials, recreate DB containers once:

```bash
npm run db:down
```

```bash
npm run db:init
```

### 2. Start backend (from `Server/`)

```bash
npm run dev
```

### 3. Start frontend (from `app/`)

```bash
npm start
```

If needed, use an alternate port:

```bash
npm start -- --port 4201
```

### 4. Verify core demo URLs

- Frontend: `http://localhost:4200` (or selected port)
- Backend: `http://localhost:3000`

### 5. Demo credentials

- Client (public demo): `camila.rojas@ejemplo.com` / `camila123`
- Admin credentials: keep private (do not share publicly)

### 6. Minimum secure setup before sharing publicly

- Set a strong `SECRET_KEY` in `Server/.env` (do not use defaults).
- Set `FRONTEND_URL` in `Server/.env` to your real frontend URL.
- Never publish `Server/.env`.
- Keep admin credentials only for demo and rotate/remove after presentation.
- Override Docker DB credentials before exposing the app:
   - `MYSQL_ROOT_PASSWORD`
   - `MYSQL_USER`
   - `MYSQL_PASSWORD`
- Remove runtime logs from commits (`Server/log` is ignored).

### 7. Post-demo credential rotation

After each public demo:

1. Rotate `SECRET_KEY` in `Server/.env`.
2. Change seeded demo user passwords (admin + clients).
3. Rotate Docker/MySQL credentials and restart DB containers.
4. Invalidate active sessions by restarting backend after rotation.

---

## Portfolio Deployment (Render)

This repository includes a `render.yaml` blueprint to deploy both backend and frontend from the same repo:

- `joyohyd-portfolio-api` (Docker web service, from `Server/`)
- `joyohyd-portfolio-app` (Static site, from `app/`)

### Free MySQL option: TiDB Cloud Serverless

If you want to keep Prisma + MySQL without paying, the simplest option is **TiDB Cloud Serverless** because it is MySQL-compatible.

#### 1. Create the database

- Go to `https://tidbcloud.com/`
- Create an account
- Create a **Serverless** cluster
- Choose any cluster name you want
- Create a database named `joyohyd`

#### 2. Create a database user

- In TiDB Cloud, create a database user and password
- Allow public access from Render if TiDB asks for allowed IPs/connection rules

#### 3. Copy the connection string

Use a Prisma-compatible MySQL URL similar to this:

```env
mysql://USER:PASSWORD@HOST:4000/joyohyd?sslaccept=strict
```

If Render still shows TLS certificate verification errors (`unable to get local issuer certificate`), use this temporary fallback for portfolio demo environments:

```env
mysql://USER:PASSWORD@HOST:4000/joyohyd?sslaccept=accept_invalid_certs
```

Use `sslaccept=strict` whenever possible.

That full string is the value for `DATABASE_URL` in Render.

#### 4. Render URLs if you keep the default service names in this repo

- Frontend URL: `https://joyohyd-portfolio-app.onrender.com`
- API URL: `https://joyohyd-portfolio-api.onrender.com`

If Render tells you the name is already taken and you rename the service, then the URL changes to that new name.

### 1. Push your repo changes

Make sure `render.yaml` is in the repository root.

### 2. Create a new Blueprint on Render

In Render, create a new **Blueprint** and select this repository.

### 3. Set required backend environment variables

- `FRONTEND_URL` = `https://joyohyd-portfolio-app.onrender.com`
- `DATABASE_URL`
- `SECRET_KEY`
- `EMAIL_HOST`
- `EMAIL_PORT`
- `EMAIL_USER`
- `EMAIL_PASS`

### 4. Set frontend environment variable

- `PUBLIC_API_URL` = `https://joyohyd-portfolio-api.onrender.com`

The frontend build rewrites `apiURL` in `app/src/environments/environment.ts` during CI, so you do not need to hardcode production URLs in source control.

### 5. Deploy

Backend container starts the API directly (`npm run start:prod`).

After first successful deploy, run migrations and seed **once** against your remote MySQL URL from your local machine:

```bash
cd Server
```

PowerShell:

```powershell
$env:DATABASE_URL="<TU_DATABASE_URL_REMOTA>"
npx prisma generate
npx prisma migrate deploy
npx prisma db seed
Remove-Item Env:DATABASE_URL
```

This avoids deploy failures caused by startup-time migration issues and keeps the service boot path stable.

---

## Available Scripts

### Backend (`Server/`)

| Script | Command | Description |
|--------|---------|-------------|
| `dev` | `nodemon source/server.ts` | Start development server with auto-restart |

### Frontend (`app/`)

| Script | Command | Description |
|--------|---------|-------------|
| `start` | `ng serve` | Start development server at localhost:4200 |
| `build` | `ng build` | Build for production |
| `watch` | `ng build --watch --configuration development` | Build and watch for changes |
| `test` | `ng test` | Run unit tests with Karma/Jasmine |

### Prisma (run from `Server/`)

| Command | Description |
|---------|-------------|
| `npx prisma migrate dev` | Create and apply a new migration |
| `npx prisma migrate deploy` | Apply pending migrations (CI/production) |
| `npx prisma generate` | Regenerate Prisma client after schema changes |
| `npx prisma db seed` | Seed the database with sample data |
| `npx prisma studio` | Open Prisma Studio GUI to browse data |

---

## API Reference

Base URL: `http://localhost:3000`

Uploaded images are served statically at `http://localhost:3000/images/<filename>`.

### Endpoints

| Resource | Base Path | Notes |
|----------|-----------|-------|
| Products | `GET/POST/PUT/DELETE /producto` | Public read; `GET /producto/productoStockCompo` returns products with components |
| Categories | `/categoria` | Standard CRUD |
| Tags | `/etiqueta` | Standard CRUD |
| Users | `/usuario` | `POST /usuario/login`, `POST /usuario/register`, `POST /usuario/forgot-password`, `POST /usuario/reset-password`, `GET /usuario/profile` 🔐 |
| Orders | `/pedido` | Requires JWT 🔐; `PATCH /pedido/:id/estado` to advance order status |
| Reviews | `/resena` | Standard CRUD |
| Promotions | `/promocion` | Standard CRUD |
| Components | `/componente` | Customizable product parts |
| Component Groups | `/grupo-componente` | Groups for component types |
| Product Images | `/imagen-producto` | Standard CRUD |
| Cart | `/carrito` | Shopping cart management |
| Cart Items | `/carrito-producto` | Items within a cart |
| Customized Products | `/producto-personalizado` | Saved custom product configurations |
| Product-Component | `/producto-componente` | Maps components to products |
| Product-Tag | `/producto-etiqueta` | Maps tags to products |
| Order Items | `/pedido-producto` | Line items within an order |
| Status History | `/estado-transicion` | Order status change log |
| Review Reports | `/reporte-resena` | Flag a review for moderation |
| Review Moderation | `/moderacion-resena` | Admin moderation actions on reviews |
| Roles | `/rol` | Role management |

> 🔐 = Requires `Authorization: Bearer <token>` header

---

## Authentication

The application uses a two-strategy Passport.js setup:

1. **Local Strategy** — `POST /usuario/login`  
   Accepts `correo` (email) and `contrasenna` (password). Returns a JWT on success.

2. **JWT Strategy** — All protected routes  
   Pass the token in the `Authorization` header:
   ```
   Authorization: Bearer <your_jwt_token>
   ```

Password hashing is handled by **bcryptjs**. Tokens are signed with the `SECRET_KEY` environment variable.

---

## Data Models

The database contains 17 models. The core entities are:

| Model | Description |
|-------|-------------|
| `Usuario` | User accounts with roles (ADMIN / CLIENTE) |
| `Producto` | Products with price, stock, category |
| `Categoria` | Product categories |
| `Etiqueta` | Searchable tags for products |
| `Componente` | Customizable parts (e.g. fabric, legs) |
| `ProductoPersonalizado` | A product with a specific component configuration |
| `Carrito` | Shopping cart per user |
| `Pedido` | A placed order with shipping address and payment method |
| `Resena` | Product review (1–5 stars) |
| `Promocion` | Discount campaigns (percentage or fixed amount) |
| `EstadoTransicion` | Audit log of order status changes |
| `ReporteResena` | User-submitted flags on reviews |
| `ModeracionResena` | Admin action on a flagged review |

### Enums

| Enum | Values |
|------|--------|
| `Rol` | `ADMIN`, `CLIENTE` |
| `TipoDescuento` | `PORCENTAJE`, `MONTO_FIJO` |
| `MetodoPago` | `EFECTIVO`, `TARJETA` |
| `EstadoPedido` | `PENDIENTE_PAGO`, `PAGADO`, `EN_PREPARACION`, `ENTREGADO` |
| `EstadoCarrito` | `TEMPORAL`, `PENDIENTE`, `ABANDONADO`, `COMPLETADO` |
| `EstadoReporteResena` | `PENDIENTE`, `ACEPTADO`, `RECHAZADO` |
| `AccionModeracion` | `OCULTAR`, `MANTENER` |

---

## Frontend Features

The Angular application is organized into the following feature modules:

| Module | Description |
|--------|-------------|
| `home` | Landing page |
| `producto` | Product catalog and product detail pages |
| `carrito` | Shopping cart |
| `pedido` | Order placement and order history |
| `resena` | Product reviews |
| `promocion` | Active promotions display |
| `componente` / `producto-componente` | Product customization interface |
| `etiqueta` | Tag browsing and filtering |
| `user` | User profile, password management |
| `access-denied` | 403 error page |
| `core` | Services, HTTP interceptors, route guards |
| `share` | Shared components, pipes, and directives |

**Internationalization:** Translation files are loaded from `src/assets/i18n/` using `@ngx-translate`.  
**UI Framework:** Angular Material with a custom SCSS theme (`custom-theme.scss`).

---

## Roles & Permissions

| Action | CLIENTE | ADMIN |
|--------|---------|-------|
| Browse products & categories | ✅ | ✅ |
| Place orders | ✅ | ✅ |
| View own orders | ✅ | ✅ |
| Write product reviews | ✅ | ✅ |
| Report reviews | ✅ | ✅ |
| Manage products / categories | ❌ | ✅ |
| Advance order status | ❌ | ✅ |
| Moderate reviews | ❌ | ✅ |
| Manage users | ❌ | ✅ |
| Reset user passwords | ❌ | ✅ |
