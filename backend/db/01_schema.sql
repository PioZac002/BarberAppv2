-- BarberShop App — database schema
-- Runs automatically on first start of the postgres Docker container.

-- ── Users ────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
    id         SERIAL PRIMARY KEY,
    first_name VARCHAR(100)  NOT NULL,
    last_name  VARCHAR(100)  NOT NULL,
    email      VARCHAR(255)  NOT NULL UNIQUE,
    phone      VARCHAR(30),
    password   VARCHAR(255)  NOT NULL,
    role       VARCHAR(20)   NOT NULL DEFAULT 'client'
                             CHECK (role IN ('admin', 'barber', 'client')),
    created_at TIMESTAMPTZ  DEFAULT NOW()
);

-- ── Barbers ───────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS barbers (
    id                SERIAL PRIMARY KEY,
    user_id           INT          NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    email             VARCHAR(255),
    phone             VARCHAR(30),
    bio               TEXT,
    address           TEXT,
    working_hours     TEXT,
    instagram         VARCHAR(255),
    facebook          VARCHAR(255),
    specialties       TEXT[],
    experience        INT,
    profile_image_url VARCHAR(255),
    created_at        TIMESTAMPTZ  DEFAULT NOW()
);

-- ── Services ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS services (
    id          SERIAL PRIMARY KEY,
    name        VARCHAR(150)    NOT NULL,
    description TEXT,
    price       NUMERIC(8, 2)   NOT NULL,
    duration    INT             NOT NULL,   -- minutes
    is_active   BOOLEAN         NOT NULL DEFAULT TRUE,
    photo_url   VARCHAR(255),
    created_at  TIMESTAMPTZ     DEFAULT NOW()
);

-- ── Appointments ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS appointments (
    id               SERIAL PRIMARY KEY,
    client_id        INT         NOT NULL REFERENCES users(id)    ON DELETE CASCADE,
    barber_id        INT         NOT NULL REFERENCES barbers(id)  ON DELETE CASCADE,
    service_id       INT         NOT NULL REFERENCES services(id) ON DELETE CASCADE,
    appointment_time TIMESTAMPTZ NOT NULL,
    status           VARCHAR(20) NOT NULL DEFAULT 'pending'
                                 CHECK (status IN ('pending','confirmed','completed','canceled','no-show')),
    notes            TEXT,
    created_at       TIMESTAMPTZ DEFAULT NOW()
);

-- ── Reviews ───────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS reviews (
    id             SERIAL PRIMARY KEY,
    appointment_id INT  NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
    client_id      INT  NOT NULL REFERENCES users(id)        ON DELETE CASCADE,
    barber_id      INT  NOT NULL REFERENCES barbers(id)      ON DELETE CASCADE,
    service_id     INT  NOT NULL REFERENCES services(id)     ON DELETE CASCADE,
    rating         INT  NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comment        TEXT,
    created_at     TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (appointment_id, client_id)
);

-- ── Portfolio images ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS portfolio_images (
    id          SERIAL PRIMARY KEY,
    barber_id   INT          NOT NULL REFERENCES barbers(id) ON DELETE CASCADE,
    image_url   VARCHAR(255) NOT NULL,
    title       VARCHAR(100),
    description TEXT,
    created_at  TIMESTAMPTZ  DEFAULT NOW()
);

-- ── Notifications (barber) ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS notifications (
    id                 SERIAL PRIMARY KEY,
    barber_id          INT          NOT NULL REFERENCES barbers(id) ON DELETE CASCADE,
    recipient_user_id  INT          REFERENCES users(id) ON DELETE CASCADE,
    type               VARCHAR(100),
    title              VARCHAR(255),
    message            TEXT,
    link               VARCHAR(255),
    is_read            BOOLEAN      NOT NULL DEFAULT FALSE,
    created_at         TIMESTAMPTZ  DEFAULT NOW()
);

-- ── Notifications (client / user) ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_notifications (
    id         SERIAL PRIMARY KEY,
    user_id    INT          NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type       VARCHAR(100),
    title      VARCHAR(255),
    message    TEXT,
    link       VARCHAR(255),
    is_read    BOOLEAN      NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ  DEFAULT NOW()
);

-- ── Notifications (admin) ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS admin_notifications (
    id                     SERIAL PRIMARY KEY,
    admin_user_id          INT  REFERENCES users(id)        ON DELETE SET NULL,
    type                   VARCHAR(100),
    title                  VARCHAR(255),
    message                TEXT,
    link                   VARCHAR(255),
    is_read                BOOLEAN NOT NULL DEFAULT FALSE,
    related_appointment_id INT  REFERENCES appointments(id) ON DELETE SET NULL,
    related_client_id      INT  REFERENCES users(id)        ON DELETE SET NULL,
    related_barber_id      INT  REFERENCES barbers(id)      ON DELETE SET NULL,
    created_at             TIMESTAMPTZ DEFAULT NOW()
);
