-- BarberShop App — seed data
-- Runs automatically after 01_schema.sql on first container start.
-- All user passwords: User1234!  (admin password: Admin1234!)

-- ═══════════════════════════════════════════════════════════════════════════
-- USERS
-- ═══════════════════════════════════════════════════════════════════════════

INSERT INTO users (first_name, last_name, email, phone, password, role) VALUES
-- Admin
('Admin',    'BarberShop', 'admin@barbershop.com',   '+48 000 000 000',
 '$2b$10$lBL4M.qxkw0zTmiIdrccje9QOGZsHGqmFBAHCY8lbZuIMu3uRvpo.', 'admin'),
-- Barbers
('Marek',    'Kowalski',   'marek@barbershop.com',   '+48 501 111 111',
 '$2b$10$Xjpjdj50/T4Bcr/.UdjkkunkgGvXvhZvQ5litNvCl/dg/EtJRv16K', 'barber'),
('Tomasz',   'Wiśniewski', 'tomasz@barbershop.com',  '+48 501 222 222',
 '$2b$10$Xjpjdj50/T4Bcr/.UdjkkunkgGvXvhZvQ5litNvCl/dg/EtJRv16K', 'barber'),
-- Clients
('Jan',      'Nowak',      'jan@example.com',        '+48 601 001 001',
 '$2b$10$Xjpjdj50/T4Bcr/.UdjkkunkgGvXvhZvQ5litNvCl/dg/EtJRv16K', 'client'),
('Piotr',    'Zając',      'piotr@example.com',      '+48 601 002 002',
 '$2b$10$Xjpjdj50/T4Bcr/.UdjkkunkgGvXvhZvQ5litNvCl/dg/EtJRv16K', 'client'),
('Kamil',    'Lewandowski','kamil@example.com',      '+48 601 003 003',
 '$2b$10$Xjpjdj50/T4Bcr/.UdjkkunkgGvXvhZvQ5litNvCl/dg/EtJRv16K', 'client'),
('Anna',     'Wróbel',     'anna@example.com',       '+48 601 004 004',
 '$2b$10$Xjpjdj50/T4Bcr/.UdjkkunkgGvXvhZvQ5litNvCl/dg/EtJRv16K', 'client'),
('Michał',   'Krawczyk',   'michal@example.com',     '+48 601 005 005',
 '$2b$10$Xjpjdj50/T4Bcr/.UdjkkunkgGvXvhZvQ5litNvCl/dg/EtJRv16K', 'client')
ON CONFLICT (email) DO NOTHING;

-- ═══════════════════════════════════════════════════════════════════════════
-- BARBERS (profile rows)
-- ═══════════════════════════════════════════════════════════════════════════

INSERT INTO barbers (user_id, email, phone, bio, address, working_hours, instagram, facebook, specialties, experience)
SELECT
    u.id,
    u.email,
    u.phone,
    bio,
    address,
    working_hours,
    instagram,
    facebook,
    specialties::TEXT[],
    experience
FROM (VALUES
    ('marek@barbershop.com',
     'Pasjonat klasycznych cięć i prostej brzytwy. Pracuję w zawodzie od ponad 8 lat.',
     'ul. Nowy Świat 12, Warszawa',
     'Pon–Pt 9:00–18:00, Sob 9:00–14:00',
     '@marek_barber',
     'MarekBarber',
     ARRAY['Classic cuts','Straight razor shave','Beard styling'],
     8),
    ('tomasz@barbershop.com',
     'Specjalista od nowoczesnych fryzur i farbowania. Fan streetwear i hip-hopu.',
     'ul. Nowy Świat 12, Warszawa',
     'Pon–Pt 10:00–19:00, Sob 10:00–15:00',
     '@tomasz_cuts',
     'TomaszCuts',
     ARRAY['Fade','Texturizing','Color & highlights'],
     5)
) AS v(email, bio, address, working_hours, instagram, facebook, specialties, experience)
JOIN users u ON u.email = v.email
ON CONFLICT (user_id) DO NOTHING;

-- ═══════════════════════════════════════════════════════════════════════════
-- SERVICES
-- ═══════════════════════════════════════════════════════════════════════════

INSERT INTO services (name, description, price, duration, is_active) VALUES
('Haircut',            'Classic haircut tailored to your style.',             49.00, 30, TRUE),
('Beard Trim',         'Precise beard shaping and trimming.',                 35.00, 20, TRUE),
('Haircut + Beard',    'Full haircut and beard grooming combo.',              75.00, 50, TRUE),
('Hair Wash & Style',  'Relaxing wash followed by professional styling.',     40.00, 25, TRUE),
('Head Shave',         'Clean head shave with hot towel finish.',             55.00, 35, TRUE),
('Fade',               'Modern skin or low fade, perfectly blended.',         55.00, 40, TRUE),
('Color & Highlights', 'Hair coloring and highlighting by a pro.',           120.00, 90, TRUE)
ON CONFLICT DO NOTHING;

-- ═══════════════════════════════════════════════════════════════════════════
-- APPOINTMENTS
-- ═══════════════════════════════════════════════════════════════════════════
-- We use a DO $$ block so we can reference IDs by email/name easily.

DO $$
DECLARE
    -- barber IDs
    b_marek   INT := (SELECT b.id FROM barbers b JOIN users u ON b.user_id=u.id WHERE u.email='marek@barbershop.com');
    b_tomasz  INT := (SELECT b.id FROM barbers b JOIN users u ON b.user_id=u.id WHERE u.email='tomasz@barbershop.com');
    -- client IDs
    c_jan     INT := (SELECT id FROM users WHERE email='jan@example.com');
    c_piotr   INT := (SELECT id FROM users WHERE email='piotr@example.com');
    c_kamil   INT := (SELECT id FROM users WHERE email='kamil@example.com');
    c_anna    INT := (SELECT id FROM users WHERE email='anna@example.com');
    c_michal  INT := (SELECT id FROM users WHERE email='michal@example.com');
    -- service IDs
    s_cut     INT := (SELECT id FROM services WHERE name='Haircut');
    s_beard   INT := (SELECT id FROM services WHERE name='Beard Trim');
    s_combo   INT := (SELECT id FROM services WHERE name='Haircut + Beard');
    s_wash    INT := (SELECT id FROM services WHERE name='Hair Wash & Style');
    s_shave   INT := (SELECT id FROM services WHERE name='Head Shave');
    s_fade    INT := (SELECT id FROM services WHERE name='Fade');
    s_color   INT := (SELECT id FROM services WHERE name='Color & Highlights');
    -- appointment IDs (filled after insert)
    a1 INT; a2 INT; a3 INT; a4 INT; a5 INT;
    a6 INT; a7 INT; a8 INT; a9 INT; a10 INT;
    -- user IDs for barbers
    u_marek   INT := (SELECT id FROM users WHERE email='marek@barbershop.com');
    u_tomasz  INT := (SELECT id FROM users WHERE email='tomasz@barbershop.com');
    -- admin ID
    admin_id  INT := (SELECT id FROM users WHERE email='admin@barbershop.com');
BEGIN

-- ── Completed appointments (past) ──────────────────────────────────────────
INSERT INTO appointments (client_id, barber_id, service_id, appointment_time, status)
VALUES (c_jan, b_marek, s_cut, NOW() - INTERVAL '20 days', 'completed') RETURNING id INTO a1;

INSERT INTO appointments (client_id, barber_id, service_id, appointment_time, status)
VALUES (c_piotr, b_marek, s_combo, NOW() - INTERVAL '15 days', 'completed') RETURNING id INTO a2;

INSERT INTO appointments (client_id, barber_id, service_id, appointment_time, status)
VALUES (c_kamil, b_tomasz, s_fade, NOW() - INTERVAL '12 days', 'completed') RETURNING id INTO a3;

INSERT INTO appointments (client_id, barber_id, service_id, appointment_time, status)
VALUES (c_anna, b_tomasz, s_color, NOW() - INTERVAL '10 days', 'completed') RETURNING id INTO a4;

INSERT INTO appointments (client_id, barber_id, service_id, appointment_time, status)
VALUES (c_michal, b_marek, s_shave, NOW() - INTERVAL '8 days', 'completed') RETURNING id INTO a5;

INSERT INTO appointments (client_id, barber_id, service_id, appointment_time, status)
VALUES (c_jan, b_tomasz, s_wash, NOW() - INTERVAL '5 days', 'completed') RETURNING id INTO a6;

INSERT INTO appointments (client_id, barber_id, service_id, appointment_time, status)
VALUES (c_piotr, b_tomasz, s_beard, NOW() - INTERVAL '3 days', 'completed') RETURNING id INTO a7;

-- ── Canceled / no-show (past) ──────────────────────────────────────────────
INSERT INTO appointments (client_id, barber_id, service_id, appointment_time, status)
VALUES (c_kamil, b_marek, s_cut, NOW() - INTERVAL '6 days', 'canceled') RETURNING id INTO a8;

INSERT INTO appointments (client_id, barber_id, service_id, appointment_time, status)
VALUES (c_michal, b_tomasz, s_fade, NOW() - INTERVAL '2 days', 'no-show') RETURNING id INTO a9;

-- ── Upcoming appointments (future) ────────────────────────────────────────
INSERT INTO appointments (client_id, barber_id, service_id, appointment_time, status)
VALUES (c_anna, b_marek, s_combo, NOW() + INTERVAL '2 days', 'confirmed') RETURNING id INTO a10;

INSERT INTO appointments (client_id, barber_id, service_id, appointment_time, status)
VALUES (c_jan, b_marek, s_cut, NOW() + INTERVAL '4 days', 'pending');

INSERT INTO appointments (client_id, barber_id, service_id, appointment_time, status)
VALUES (c_kamil, b_tomasz, s_color, NOW() + INTERVAL '5 days', 'pending');

INSERT INTO appointments (client_id, barber_id, service_id, appointment_time, status)
VALUES (c_piotr, b_marek, s_shave, NOW() + INTERVAL '7 days', 'confirmed');

-- ═══════════════════════════════════════════════════════════════════════════
-- REVIEWS (only for completed appointments)
-- ═══════════════════════════════════════════════════════════════════════════

INSERT INTO reviews (appointment_id, client_id, barber_id, service_id, rating, comment) VALUES
(a1, c_jan,    b_marek,  s_cut,   5, 'Świetna robota! Marek to prawdziwy fachowiec — precyzyjne cięcie i miła rozmowa. Na pewno wrócę.'),
(a2, c_piotr,  b_marek,  s_combo, 5, 'Najlepsza usługa combo jaką miałem. Broda ułożona perfekcyjnie, włosy równo ścięte. Polecam każdemu.'),
(a3, c_kamil,  b_tomasz, s_fade,  4, 'Bardzo dobry fade, blending idealny. Minimalnie za długo czekałem, stąd 4/5, ale robota top.'),
(a4, c_anna,   b_tomasz, s_color, 5, 'Kolory wyszły dokładnie tak jak chciałam. Tomasz świetnie doradził odcień i efekt jest niesamowity!'),
(a5, c_michal, b_marek,  s_shave, 4, 'Klasyczne golenie brzytwą — przyjemne doświadczenie. Skóra gładka i nawilżona. Gorąco polecam.'),
(a6, c_jan,    b_tomasz, s_wash,  5, 'Relaksujące mycie i stylizacja na wysokim poziomie. Tomasz wie co robi. Wyjście z salonu jak nowy człowiek.'),
(a7, c_piotr,  b_tomasz, s_beard, 3, 'Przystrzyżenie brody w porządku, ale miałem wrażenie że Tomasz się spieszył. Efekt okej, nie wow.');

-- ═══════════════════════════════════════════════════════════════════════════
-- NOTIFICATIONS — user (clients)
-- ═══════════════════════════════════════════════════════════════════════════

-- Jan: confirmation for upcoming appointment
INSERT INTO user_notifications (user_id, type, title, message, link, is_read, created_at)
VALUES (c_jan, 'appointment_confirmed', 'Wizyta potwierdzona',
        'Twoja wizyta u Marka Kowalskiego na usługę Haircut za 4 dni została potwierdzona.',
        '/user-dashboard/appointments', FALSE, NOW() - INTERVAL '3 days');

-- Piotr: reminder
INSERT INTO user_notifications (user_id, type, title, message, link, is_read, created_at)
VALUES (c_piotr, 'appointment_reminder', 'Przypomnienie o wizycie',
        'Jutro o 10:00 masz wizytę u Marka Kowalskiego. Pamiętaj o przybyciu na czas!',
        '/user-dashboard/appointments', TRUE, NOW() - INTERVAL '1 day');

-- Kamil: cancellation
INSERT INTO user_notifications (user_id, type, title, message, link, is_read, created_at)
VALUES (c_kamil, 'appointment_canceled', 'Wizyta anulowana',
        'Twoja wizyta na usługę Haircut u Marka Kowalskiego została anulowana.',
        '/user-dashboard/appointments', TRUE, NOW() - INTERVAL '6 days');

-- Anna: upcoming confirmed
INSERT INTO user_notifications (user_id, type, title, message, link, is_read, created_at)
VALUES (c_anna, 'appointment_confirmed', 'Wizyta potwierdzona',
        'Wizyta Haircut + Beard u Marka Kowalskiego za 2 dni została potwierdzona. Do zobaczenia!',
        '/user-dashboard/appointments', FALSE, NOW() - INTERVAL '12 hours');

-- Michał: no-show info
INSERT INTO user_notifications (user_id, type, title, message, link, is_read, created_at)
VALUES (c_michal, 'no_show', 'Nieobecność na wizycie',
        'Odnotowano Twoją nieobecność na wizycie Fade u Tomasza Wiśniewskiego. Zarezerwuj nowy termin.',
        '/booking', FALSE, NOW() - INTERVAL '2 days');

-- ═══════════════════════════════════════════════════════════════════════════
-- NOTIFICATIONS — barbers
-- ═══════════════════════════════════════════════════════════════════════════

INSERT INTO notifications (barber_id, recipient_user_id, type, title, message, link, is_read, created_at)
VALUES
(b_marek, u_marek, 'new_booking_barber', 'Nowa rezerwacja',
 'Jan Nowak zarezerwował wizytę Haircut za 4 dni.',
 '/barber-dashboard/schedule', FALSE, NOW() - INTERVAL '1 day'),

(b_marek, u_marek, 'appointment_confirmed_by_admin_staff', 'Wizyta potwierdzona',
 'Wizyta Anny Wróbel (Haircut + Beard) za 2 dni została potwierdzona.',
 '/barber-dashboard/appointments', TRUE, NOW() - INTERVAL '12 hours'),

(b_tomasz, u_tomasz, 'new_booking_barber', 'Nowa rezerwacja',
 'Kamil Lewandowski zarezerwował Color & Highlights za 5 dni.',
 '/barber-dashboard/schedule', FALSE, NOW() - INTERVAL '3 hours'),

(b_tomasz, u_tomasz, 'new_review', 'Nowa opinia',
 'Piotr Zając wystawił Ci ocenę 3/5. Sprawdź komentarz.',
 '/barber-dashboard/schedule', FALSE, NOW() - INTERVAL '2 days');

-- ═══════════════════════════════════════════════════════════════════════════
-- NOTIFICATIONS — admin
-- ═══════════════════════════════════════════════════════════════════════════

INSERT INTO admin_notifications (admin_user_id, type, title, message, link, related_appointment_id, related_client_id, related_barber_id, is_read, created_at)
VALUES
(admin_id, 'new_appointment_booked', 'Nowa wizyta zarezerwowana',
 'Jan Nowak zarezerwował Haircut u Marka Kowalskiego za 4 dni.',
 '/admin-dashboard/appointments', NULL, c_jan, b_marek, TRUE, NOW() - INTERVAL '1 day'),

(admin_id, 'new_appointment_booked', 'Nowa wizyta zarezerwowana',
 'Kamil Lewandowski zarezerwował Color & Highlights u Tomasza Wiśniewskiego za 5 dni.',
 '/admin-dashboard/appointments', NULL, c_kamil, b_tomasz, FALSE, NOW() - INTERVAL '3 hours'),

(admin_id, 'new_user_registered', 'Nowy użytkownik',
 'Anna Wróbel zarejestrowała się w systemie.',
 '/admin-dashboard/users', NULL, c_anna, NULL, TRUE, NOW() - INTERVAL '20 days'),

(admin_id, 'new_user_registered', 'Nowy użytkownik',
 'Michał Krawczyk zarejestrował się w systemie.',
 '/admin-dashboard/users', NULL, c_michal, NULL, FALSE, NOW() - INTERVAL '15 days'),

(admin_id, 'appointment_status_changed_by_barber', 'Zmiana statusu wizyty',
 'Marek Kowalski oznaczył wizytę Piotra Zająca jako zakończoną.',
 '/admin-dashboard/appointments', a2, c_piotr, b_marek, FALSE, NOW() - INTERVAL '15 days');

END $$;
