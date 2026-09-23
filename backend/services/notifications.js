/**
 * Notifications.
 *
 * One table, one vocabulary. A notification records *what happened* — an
 * event type and the values that describe it — and never the sentence about
 * it. The sentence is written when someone reads it, in their own language,
 * by `src/lib/notification-text.ts`.
 *
 * Adding a type means adding it here and adding its two strings to both
 * languages. Nothing else in the stack needs to know.
 */
const pool = require('../config/database');

const AUDIENCES = ['client', 'barber', 'admin'];

/** Insert one notification. Pass a transaction client to enlist in it. */
async function notify(db, { recipientId, audience, type, params = {}, link = null, appointmentId = null }) {
    if (!recipientId) return;
    if (!AUDIENCES.includes(audience)) {
        throw new Error(`notify: unknown audience "${audience}"`);
    }
    await (db || pool).query(
        `INSERT INTO app_notifications
             (recipient_id, audience, type, params, link, appointment_id)
         VALUES ($1, $2, $3, $4::jsonb, $5, $6)`,
        [recipientId, audience, type, JSON.stringify(params), link, appointmentId]
    );
}

/**
 * Notify every admin in one statement. The previous code opened a query per
 * administrator inside the booking transaction, so the cost of booking grew
 * with the size of the staff.
 */
async function notifyAdmins(db, { type, params = {}, link = null, appointmentId = null }) {
    await (db || pool).query(
        `INSERT INTO app_notifications
             (recipient_id, audience, type, params, link, appointment_id)
         SELECT id, 'admin', $1, $2::jsonb, $3, $4
         FROM users WHERE role = 'admin'`,
        [type, JSON.stringify(params), link, appointmentId]
    );
}

async function listFor(recipientId, { limit } = {}) {
    const capped = Math.min(Math.max(Number(limit) || 50, 1), 100);
    const { rows } = await pool.query(
        `SELECT id, type, params, link, is_read, appointment_id,
                legacy_title, legacy_message, created_at
           FROM app_notifications
          WHERE recipient_id = $1
          ORDER BY created_at DESC
          LIMIT $2`,
        [recipientId, capped]
    );
    return rows;
}

async function unreadCount(recipientId) {
    const { rows } = await pool.query(
        'SELECT COUNT(*)::int AS count FROM app_notifications WHERE recipient_id = $1 AND is_read = FALSE',
        [recipientId]
    );
    return rows[0].count;
}

/** Ownership is part of the WHERE clause, so one user can never touch another's row. */
async function markRead(id, recipientId) {
    const { rowCount } = await pool.query(
        'UPDATE app_notifications SET is_read = TRUE WHERE id = $1 AND recipient_id = $2',
        [id, recipientId]
    );
    return rowCount > 0;
}

async function markAllRead(recipientId) {
    const { rowCount } = await pool.query(
        'UPDATE app_notifications SET is_read = TRUE WHERE recipient_id = $1 AND is_read = FALSE',
        [recipientId]
    );
    return rowCount;
}

async function remove(id, recipientId) {
    const { rowCount } = await pool.query(
        'DELETE FROM app_notifications WHERE id = $1 AND recipient_id = $2',
        [id, recipientId]
    );
    return rowCount > 0;
}

module.exports = { notify, notifyAdmins, listFor, unreadCount, markRead, markAllRead, remove };
