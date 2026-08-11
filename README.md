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
- [ ] [Automatically close issues from merge requests](https://docs.gitlab.com/ee/user/project/issues/managing_issues.html#closing-issues-automatically)
- [ ] [Enable merge request approvals](https://docs.gitlab.com/ee/user/project/merge_requests/approvals/)
- [ ] [Set auto-merge](https://docs.gitlab.com/user/project/merge_requests/auto_merge/)

## Test and Deploy

Use the built-in continuous integration in GitLab.

- [ ] [Get started with GitLab CI/CD](https://docs.gitlab.com/ee/ci/quick_start/)
- [ ] [Analyze your code for known vulnerabilities with Static Application Security Testing (SAST)](https://docs.gitlab.com/ee/user/application_security/sast/)
- [ ] [Deploy to Kubernetes, Amazon EC2, or Amazon ECS using Auto Deploy](https://docs.gitlab.com/ee/topics/autodevops/requirements.html)
- [ ] [Use pull-based deployments for improved Kubernetes management](https://docs.gitlab.com/ee/user/clusters/agent/)
- [ ] [Set up protected environments](https://docs.gitlab.com/ee/ci/environments/protected_environments.html)

***

# Editing this README

When you're ready to make this README your own, just edit this file and use the handy template below (or feel free to structure it however you want - this is just a starting point!). Thanks to [makeareadme.com](https://www.makeareadme.com/) for this template.

## Suggestions for a good README

Every project is different, so consider which of these sections apply to yours. The sections used in the template are suggestions for most open source projects. Also keep in mind that while a README can be too long and detailed, too long is better than too short. If you think your README is too long, consider utilizing another form of documentation rather than cutting out information.

## Name
Choose a self-explaining name for your project.

## Description
Let people know what your project can do specifically. Provide context and add a link to any reference visitors might be unfamiliar with. A list of Features or a Background subsection can also be added here. If there are alternatives to your project, this is a good place to list differentiating factors.

## Badges
On some READMEs, you may see small images that convey metadata, such as whether or not all the tests are passing for the project. You can use Shields to add some to your README. Many services also have instructions for adding a badge.

## Visuals
Depending on what you are making, it can be a good idea to include screenshots or even a video (you'll frequently see GIFs rather than actual videos). Tools like ttygif can help, but check out Asciinema for a more sophisticated method.

## Installation
Within a particular ecosystem, there may be a common way of installing things, such as using Yarn, NuGet, or Homebrew. However, consider the possibility that whoever is reading your README is a novice and would like more guidance. Listing specific steps helps remove ambiguity and gets people to using your project as quickly as possible. If it only runs in a specific context like a particular programming language version or operating system or has dependencies that have to be installed manually, also add a Requirements subsection.

## Usage
Use examples liberally, and show the expected output if you can. It's helpful to have inline the smallest example of usage that you can demonstrate, while providing links to more sophisticated examples if they are too long to reasonably include in the README.

## Support
Tell people where they can go to for help. It can be any combination of an issue tracker, a chat room, an email address, etc.

## Roadmap
If you have ideas for releases in the future, it is a good idea to list them in the README.

## Contributing
State if you are open to contributions and what your requirements are for accepting them.

For people who want to make changes to your project, it's helpful to have some documentation on how to get started. Perhaps there is a script that they should run or some environment variables that they need to set. Make these steps explicit. These instructions could also be useful to your future self.

You can also document commands to lint the code or run tests. These steps help to ensure high code quality and reduce the likelihood that the changes inadvertently break something. Having instructions for running tests is especially helpful if it requires external setup, such as starting a Selenium server for testing in a browser.

## Authors and acknowledgment
Show your appreciation to those who have contributed to the project.

## License
For open source projects, say how it is licensed.

## Project status
If you have run out of energy or time for your project, put a note at the top of the README saying that development has slowed down or stopped completely. Someone may choose to fork your project or volunteer to step in as a maintainer or owner, allowing your project to keep going. You can also make an explicit request for maintainers.
