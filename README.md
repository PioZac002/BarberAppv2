# BarberShop App

A full-stack barbershop management application with online booking, role-based dashboards, dark/light mode, and bilingual (PL/EN) support.

**Live demo:** [https://barberappv2-1.onrender.com](https://barberappv2-1.onrender.com)

> The live instance runs on Render's free tier — the backend may take 30–60 seconds to wake up on first load.

### Try it instantly — demo accounts

Use the one-click demo login buttons on the login page, or enter the credentials manually:

| Role      | Email                  | Password     |
|-----------|------------------------|--------------|
| Admin     | admin@barbershop.com   | `Admin1234!` |
| Barber    | marek@barbershop.com   | `User1234!`  |
| Client    | jan@example.com        | `User1234!`  |

> Demo accounts cannot change their email or password, and cannot be deleted — everything else is fully functional.

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

All seeded passwords: **User1234!** (admin: **Admin1234!**)

| Role   | Email                    | Name                |
|--------|--------------------------|---------------------|
| Admin  | admin@barbershop.com     | Admin BarberShop    |
| Barber | marek@barbershop.com     | Marek Kowalski      |
| Barber | tomasz@barbershop.com    | Tomasz Wiśniewski   |
| Client | jan@example.com          | Jan Nowak           |
| Client | piotr@example.com        | Piotr Zając         |
| Client | kamil@example.com        | Kamil Lewandowski   |
| Client | anna@example.com         | Anna Wróbel         |
| Client | michal@example.com       | Michał Krawczyk     |

The seed also inserts sample services, appointments (various statuses), reviews, and notifications so the dashboards look populated from day one.

> Change the admin password after first login via **Admin dashboard → Profile**.

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

Create a `backend/.env` file (or copy from an existing example):

```env
DATABASE_URL=postgresql://<user>:<password>@<host>/<dbname>
PORT=3000
JWT_SECRET=your_long_random_secret
FRONTEND_URL=http://localhost:5173
BACKEND_URL=http://localhost:3000
```

**Using the local Docker database instead of a remote one?**

Start the Docker DB container first (`docker compose up db`), then create a local override:

```bash
cp backend/.env.local.example backend/.env.local
```

`backend/.env.local` is gitignored and overrides only `DATABASE_URL` and `DATABASE_SSL` — everything else is inherited from `.env`. The Docker database is pre-seeded with demo data (see [Demo accounts](#try-it-instantly--demo-accounts)).

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

### Local override (`/backend/.env.local`)

Overrides variables from `.env` for local development. Gitignored — never committed.
Copy from the example: `cp backend/.env.local.example backend/.env.local`

| Variable        | Description                                      |
|-----------------|--------------------------------------------------|
| `DATABASE_URL`  | Points to the local Docker DB (`localhost:5432`) |
| `DATABASE_SSL`  | Set to `false` for local Docker                  |

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
│   ├── db/                     # SQL schema + seed file
│   ├── middleware/             # Auth middleware (verifyToken, requireAdmin, demoGuard, etc.)
│   ├── routes/                 # Express routers
│   ├── uploads/                # Uploaded files (portfolio, profile photos)
│   ├── index.js                # Express app entry point
│   ├── .env                    # Backend env — gitignored
│   ├── .env.local              # Local DB override — gitignored, copy from .env.local.example
│   └── .env.local.example      # Template for local Docker DB setup
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
