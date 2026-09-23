-- Three tables (notifications, admin_notifications, user_notifications) held
-- the same four columns and were served by three near-identical controller
-- triplets. Worse, each row stored a sentence already rendered into Polish,
-- so notifications never followed the language toggle.
--
-- One table, addressed by recipient and audience, carrying the event type and
-- its values. The sentence is written by whoever reads it, in their language.

CREATE TABLE IF NOT EXISTS app_notifications (
    id             SERIAL PRIMARY KEY,
    recipient_id   INT          NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    audience       VARCHAR(10)  NOT NULL CHECK (audience IN ('client', 'barber', 'admin')),
    type           VARCHAR(64)  NOT NULL,
    params         JSONB        NOT NULL DEFAULT '{}'::jsonb,
    link           VARCHAR(255),
    is_read        BOOLEAN      NOT NULL DEFAULT FALSE,
    appointment_id INT          REFERENCES appointments(id) ON DELETE SET NULL,
    -- rows migrated from the old tables have no params, only the sentence that
    -- was rendered when they were written; they keep it and render from it
    legacy_title   TEXT,
    legacy_message TEXT,
    created_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS app_notifications_recipient_idx
    ON app_notifications (recipient_id, created_at DESC);

-- the unread badge asks only this question, so give it its own small index
CREATE INDEX IF NOT EXISTS app_notifications_unread_idx
    ON app_notifications (recipient_id) WHERE is_read = FALSE;

-- ── carry the existing rows over ──
INSERT INTO app_notifications
    (recipient_id, audience, type, link, is_read, appointment_id,
     legacy_title, legacy_message, created_at)
SELECT un.user_id, 'client', un.type, un.link, un.is_read, NULL,
       un.title, un.message, un.created_at
FROM user_notifications un
JOIN users u ON u.id = un.user_id;

INSERT INTO app_notifications
    (recipient_id, audience, type, link, is_read, appointment_id,
     legacy_title, legacy_message, created_at)
SELECT COALESCE(n.recipient_user_id, b.user_id), 'barber', n.type, n.link,
       n.is_read, NULL, n.title, n.message, n.created_at
FROM notifications n
LEFT JOIN barbers b ON b.id = n.barber_id
WHERE COALESCE(n.recipient_user_id, b.user_id) IS NOT NULL;

INSERT INTO app_notifications
    (recipient_id, audience, type, link, is_read, appointment_id,
     legacy_title, legacy_message, created_at)
SELECT an.admin_user_id, 'admin', an.type, an.link, an.is_read,
       an.related_appointment_id, an.title, an.message, an.created_at
FROM admin_notifications an
JOIN users u ON u.id = an.admin_user_id;

DROP TABLE IF EXISTS user_notifications;
DROP TABLE IF EXISTS admin_notifications;
DROP TABLE IF EXISTS notifications;
