# BarberShop App

A full-stack barbershop management application with online booking, role-based dashboards, dark/light mode, and bilingual (PL/EN) support.

**Live demo:** [https://barberappv2-1.onrender.com](https://barberappv2-1.onrender.com)

> The live instance runs on Render's free tier — the backend may take 30–60 seconds to wake up on first load.

---

## Features

**Public pages**
- Home page with service highlights and CTA
- Services catalogue
- Team / barber profiles with portfolio
- Customer reviews
- Online appointment booking

**User dashboard**
- View, track and cancel appointments
- Write reviews for completed visits
- Notification centre
- Profile management

**Barber dashboard**
- Appointment calendar and schedule overview
- Accept / complete / mark no-show on appointments
- Portfolio gallery (upload file, paste from clipboard, or add by URL)
- Profile and photo management
- Notification centre

**Admin dashboard**
- Overview with live stats and charts
- User management (roles: admin / barber / client)
- Full appointment management with filters
- Services management (add / edit / delete)
- Reviews moderation
- Reports with PDF export (bar, line, pie charts)
- Notification centre
- Profile management

**UI / UX**
- Dark / light mode toggle (persisted in localStorage)
- Polish / English language toggle (persisted in localStorage)
- Fully responsive — mobile, tablet, desktop
- PWA — installable on mobile devices

---

## Tech Stack

| Layer          | Technology                        |
|----------------|-----------------------------------|
| Frontend       | React 19, TypeScript, Vite        |
| Styling        | Tailwind CSS, shadcn/ui, Radix UI |
| Forms          | React Hook Form, Zod              |
| Data fetching  | TanStack Query v5                 |
| Charts         | Recharts                          |
| PDF export     | jsPDF, html2canvas                |
| Animations     | GSAP (home page)                  |
| Backend        | Node.js, Express 5                |
| Database       | PostgreSQL (hosted on Render)     |
| Auth           | JWT (jsonwebtoken), bcryptjs      |
| File uploads   | Multer                            |

---

## Running with Docker (recommended)

The easiest way to run the full stack locally — no need to install Node.js or PostgreSQL separately.

### Prerequisites

- [Docker](https://docs.docker.com/get-docker/) + [Docker Compose](https://docs.docker.com/compose/install/) (included with Docker Desktop)

### 1. Create your secrets file

```bash
cp .env.docker.example .env.docker
```

Edit `.env.docker` — at minimum set a strong `JWT_SECRET`. The file is gitignored so it will never be committed.

### 2. Start everything

```bash
docker compose up --build
```

| Service  | URL                   |
|----------|-----------------------|
| Frontend | http://localhost      |
| Backend  | http://localhost:3000 |
| Database | localhost:5432        |

> **First run:** the database schema and a default admin account are created automatically. See [Default credentials](#default-credentials) below.

### Stop

```bash
docker compose down
```

To also remove stored data (database + uploads):

```bash
docker compose down -v
```



Then start only the backend and frontend (skip the local `db` container):

```bash
docker compose up --build frontend backend
```

### Default credentials

When the local `db` container starts for the first time it automatically runs `backend/db/01_schema.sql` (tables) and `backend/db/02_seed.sql` (seed data), so the database is ready with no extra steps.

| Account | Email                    | Password     |
|---------|--------------------------|--------------|
| Admin   | admin@barbershop.com     | Admin1234!   |

> Change the password after first login via **Admin dashboard → Profile**.

Barber and client accounts can be registered normally via `/register`. Role assignment is done by the admin in the Users panel.

---

## Running Locally

### Prerequisites

- Node.js 18+
- npm
- A PostgreSQL database (local or remote, e.g. Render free tier)

### 1. Clone the repository

```bash
git clone https://github.com/PioZac002/BarberAppv2.git
cd Barberapplication
```

### 2. Configure the backend

```bash
cd backend
```

Create a `.env` file:

```env
DATABASE_URL=postgresql:
PORT=
JWT_SECRET=
FRONTEND_URL=http://localhost:5173
BACKEND_URL=--
```

Install dependencies and start:

```bash
npm install
node index.js
```


### 3. Configure the frontend

Go back to the project root:

```bash
cd ..
```

The `.env.development` file is already present and points to the local backend:

```env
VITE_API_URL=http:
```

Install dependencies and start the dev server:

```bash
npm install
npm run dev
```

Frontend runs at `http://localhost:5173`.

---

## Environment Variables

### Frontend (`/.env.development` / `/.env.production`)

| Variable        | Description                  |
|-----------------|------------------------------|
| `VITE_API_URL`  | Base URL of the backend API  |

### Backend (`/backend/.env`)

| Variable        | Description                                              |
|-----------------|----------------------------------------------------------|
| `DATABASE_URL`  | PostgreSQL connection string                             |
| `PORT`          | Port the server listens on (default: `3000`)             |
| `JWT_SECRET`    | Secret key used to sign JWT tokens                       |
| `FRONTEND_URL`  | Allowed CORS origin(s), comma-separated                  |
| `BACKEND_URL`   | Public URL of the backend (used for uploaded file URLs)  |

---

## Scripts

### Frontend

| Command             | Description                          |
|---------------------|--------------------------------------|
| `npm run dev`       | Start Vite dev server                |
| `npm run build`     | TypeScript check + production build  |
| `npm run preview`   | Preview production build locally     |
| `npm run test`      | Run unit tests (Vitest)              |

### Backend

| Command          | Description                  |
|------------------|------------------------------|
| `node index.js`  | Start the Express server     |
| `npm test`       | Run backend tests (Vitest)   |

---

## Project Structure

```
Barberapplication/
├── src/                        # Frontend source
│   ├── components/             # Shared UI components (Navigation, Footer, etc.)
│   ├── contexts/               # React contexts (Auth, Theme, Language)
│   ├── hooks/                  # Custom hooks
│   ├── pages/
│   │   ├── admin-dashboard/    # Admin panel pages
│   │   ├── barber-dashboard/   # Barber panel pages
│   │   ├── user-dashboard/     # User panel pages
│   │   └── *.tsx               # Public pages (Home, Booking, etc.)
│   └── index.css               # Global styles + dark mode CSS vars
├── backend/
│   ├── controllers/            # Route handler logic
│   ├── middleware/             # Auth middleware (verifyToken, requireAdmin, etc.)
│   ├── routes/                 # Express routers
│   ├── uploads/                # Uploaded files (portfolio, profile photos)
│   └── index.js                # Express app entry point
├── .env.development            # Frontend env — local dev
└── .env.production             # Frontend env — production
```

---

## User Roles

| Role      | Access                                  |
|-----------|-----------------------------------------|
| `client`  | Public pages + User dashboard           |
| `barber`  | Public pages + Barber dashboard         |
| `admin`   | All pages + Admin dashboard             |

Register a new account via `/register`. Role assignment is done by an admin through the Users panel.
