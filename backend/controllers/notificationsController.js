/**
 * Notification endpoints, shared by all three panels.
 *
 * The recipient is always the authenticated user, so there is nothing
 * role-specific left to duplicate: the same four handlers serve the client,
 * the barber and the administrator.
 */
const notifications = require('../services/notifications');

const userId = req => req.user?.id ?? req.user?.userId;

exports.list = async (req, res) => {
    try {
        const rows = await notifications.listFor(userId(req), { limit: req.query.limit });
        res.json(rows);
    } catch (err) {
        console.error('Error listing notifications:', err.stack);
        res.status(500).json({ code: 'notifications.listFailed' });
    }
};

exports.unreadCount = async (req, res) => {
    try {
        res.json({ count: await notifications.unreadCount(userId(req)) });
    } catch (err) {
        console.error('Error counting notifications:', err.stack);
        res.status(500).json({ code: 'notifications.listFailed' });
    }
};

exports.markRead = async (req, res) => {
    try {
        const ok = await notifications.markRead(req.params.id, userId(req));
        if (!ok) return res.status(404).json({ code: 'notifications.notFound' });
        res.json({ id: Number(req.params.id), is_read: true });
    } catch (err) {
        console.error('Error marking notification read:', err.stack);
        res.status(500).json({ code: 'notifications.markFailed' });
    }
};

exports.markAllRead = async (req, res) => {
    try {
        res.json({ updated: await notifications.markAllRead(userId(req)) });
    } catch (err) {
        console.error('Error marking all notifications read:', err.stack);
        res.status(500).json({ code: 'notifications.markAllFailed' });
    }
};

exports.remove = async (req, res) => {
    try {
        const ok = await notifications.remove(req.params.id, userId(req));
        if (!ok) return res.status(404).json({ code: 'notifications.notFound' });
        res.status(204).end();
    } catch (err) {
        console.error('Error deleting notification:', err.stack);
        res.status(500).json({ code: 'notifications.deleteFailed' });
    }
};
