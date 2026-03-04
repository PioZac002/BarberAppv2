-- BarberShop App — default seed data
-- Runs automatically after 01_schema.sql on first start.

-- ── Default admin account ─────────────────────────────────────────────────────
-- Email:    admin@barbershop.com
-- Password: Admin1234!
-- Change the password after first login via the Admin → Profile page.

INSERT INTO users (first_name, last_name, email, phone, password, role)
VALUES (
    'Admin',
    'BarberShop',
    'admin@barbershop.com',
    '+48 000 000 000',
    '$2b$10$lBL4M.qxkw0zTmiIdrccje9QOGZsHGqmFBAHCY8lbZuIMu3uRvpo.',
    'admin'
)
ON CONFLICT (email) DO NOTHING;

-- ── Sample services ───────────────────────────────────────────────────────────
INSERT INTO services (name, description, price, duration, is_active) VALUES
    ('Haircut',           'Classic haircut tailored to your style.',              49.00, 30, TRUE),
    ('Beard Trim',        'Precise beard shaping and trimming.',                  35.00, 20, TRUE),
    ('Haircut + Beard',   'Full haircut and beard grooming combo.',               75.00, 50, TRUE),
    ('Hair Wash & Style', 'Relaxing wash followed by professional styling.',      40.00, 25, TRUE),
    ('Head Shave',        'Clean head shave with hot towel finish.',              55.00, 35, TRUE)
ON CONFLICT DO NOTHING;
