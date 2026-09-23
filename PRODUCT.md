# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Three confirmed roles, all served by one application:

- **Klient** — books a visit online (service → barber → date → time slot), tracks and cancels appointments, writes reviews for completed visits, reads notifications, manages profile. Books mostly from a phone, often outside salon hours; the booking decision is made in the same session as browsing services and team.
- **Barber** — staff member operating the app during the working day, between clients. Reviews the appointment calendar and schedule, accepts / completes / marks no-show on appointments, maintains a portfolio gallery (file upload, clipboard paste, or URL), manages profile and photo, reads notifications.
- **Administrator** — runs the salon's operations. Overview with live stats and charts, user management (admin / barber / client roles), full appointment management with filters, services CRUD, review moderation, reports with PDF export, notifications, profile.

Public visitors (not signed in) browse home, services, team and reviews, and can reach booking, login and register.

## Product Purpose

A full-stack barbershop management application: public presentation of a salon plus an online booking system plus role-based operational panels. It exists as a **portfolio / showcase project** — the salon is fictional and the primary success measure is that a recruiter, reviewer or prospective employer opens the live demo, immediately believes it is real production software, and finds every role's panel complete and coherent. Functional completeness is already achieved; the durable goal is that the interface reads as deliberate, authored design rather than a default component-library build.

## Positioning

The distinguishing fact is **completeness across three role perspectives in one coherent product**: the same booking record is visible to the client who made it, the barber who fulfils it and the admin who reports on it, each through a panel built for that role's job. Most demo projects of this category ship the client-facing half only. The redesign must make that three-sided completeness legible, not hide it behind a marketing page.

## Operating Context

- **Client scene:** phone, evening, deciding between salons. Browses services and team, then books. Later returns to check or cancel an upcoming visit and to leave a review after a completed one.
- **Barber scene:** on the shop floor, standing, between clients, glancing at a phone or a small screen. Needs today's schedule and the next appointment answerable at a glance; state transitions (accept / complete / no-show) must be reachable without hunting.
- **Admin scene:** seated, desktop, longer sessions. Filtering tables, moderating reviews, editing services, exporting PDF reports. Information density and scanability outrank expression here.
- **Deployment reality:** hosted on Render's free tier; the backend cold-starts and can take 30–60 seconds to respond on first load. Loading, waking and empty states are a normal part of the experience, not an edge case.
- **Evaluation ritual:** the app is most often met through one-click demo login buttons on the login page. The login page and the first screen after each demo login are the highest-traffic first impressions in the product.

## Capabilities and Constraints

Confirmed functionality: public home / services / team (with barber portfolios) / reviews; online booking; client, barber and admin dashboards as listed under Users; notifications centre for all three roles; PDF report export (bar, line, pie charts).

Durable technical constraints the redesign must preserve:

- React 19 + TypeScript + Vite; React Router; TanStack Query v5 for data; React Hook Form + Zod for forms.
- Tailwind CSS with a shadcn/ui + Radix UI component layer under `src/components/ui`, driven by CSS custom properties in `src/index.css` and `tailwind.config.ts`.
- MUI `@mui/x-date-pickers` (`DateCalendar`) is used for date selection in booking and currently needs explicit theme overrides; Recharts for charts; jsPDF + html2canvas for export; GSAP present for home-page animation.
- Backend: Node/Express 5 + PostgreSQL, JWT auth, Multer uploads. Barber portfolio images and profile photos are user-supplied at runtime, so image-dependent layouts must survive missing, low-quality and wildly different aspect ratios.
- **Dark and light mode** are a shipped feature, persisted in localStorage — both themes are first-class and must stay at equal quality.
- **Bilingual PL / EN**, persisted in localStorage, with all copy centralised in `src/contexts/LanguageContext.tsx`. Every label must survive Polish string lengths, which run materially longer than English.
- PWA: installable, with app icons and a manifest.
- Demo accounts are restricted by middleware from changing email/password or being deleted; that restriction needs to be communicated in the UI, not silently failing.

Undecided / not established: real salon identity, address, opening hours, pricing authority, and any legal pages (privacy policy and terms exist as footer links only).

## Brand Commitments

None binding. The user has granted a free hand to invent the salon's identity — name, mark, voice and the entire visual world. The incumbent name "BarberShop", `public/BarberShopLogo.png`, the PWA icon set in `public/icons`, and the existing gold-on-carbon palette carry no authority and are explicitly treated as anti-reference material.

Content constraint that survives the rebrand: the product's copy is bilingual and lives in `LanguageContext.tsx`; factual service names, role names and flow labels stay as they are unless the user approves a change.

## Evidence on Hand

- Live deployment: https://barberappv2-1.onrender.com
- Working demo accounts for all three roles (admin / barber / client), surfaced as one-click login buttons.
- Seeded services, team members, appointments and reviews in the database — real data flows through every screen.
- Barber portfolio images uploaded through the product.
- Assets: `public/BarberShopLogo.png`, `public/icons/*` (incumbent, replaceable).

There are **no** real customers, testimonials, press mentions, awards, partner logos, certifications, pricing agreements or usage statistics. Nothing of that kind may be fabricated in copy or in placeholder content; the reviews shown are seeded demo data and must not be presented as verified customer proof.

## Product Principles

1. **Three roles, one product.** Client, barber and admin see the same records through different jobs. A change to one role's view must be answerable in the other two.
2. **The panels are the proof.** Operational depth is what separates this from a landing-page demo, so the dashboards get the same design investment as the public pages — never a simplified afterthought.
3. **Both themes, both languages, always.** Dark and light, Polish and English are shipped states, not variants. Anything that only looks right in one of the four combinations is unfinished.
4. **Real data, real conditions.** User-uploaded photos, cold starts, empty tables and long Polish labels are the normal case; the design must hold under them without apology.
5. **Nothing claimed that is not true.** No invented proof, customers or credentials — the product earns credibility through craft and completeness.

## Accessibility & Inclusion

No formal standard was mandated by the user. Product-specific needs that follow from confirmed facts: text and interactive controls must remain legible in both themes (the incumbent bright-gold-on-white pairing does not), touch targets must work for the barber's on-the-floor phone use, and all interface copy must be translatable without truncation in Polish.
