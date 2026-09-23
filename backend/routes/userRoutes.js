const express = require('express');
const notifications = require('../controllers/notificationsController');
const router = express.Router();
const { verifyToken, requireClient, blockDemoProfileChange } = require('../middleware/authMiddleware');
const {
    getUserAppointments,
    cancelUserAppointment,
    getUserProfile,
    updateUserProfile,
    getNextUpcomingAppointment,
    getUserStats,
    // Nowe importy dla recenzji
    getUserReviewsWritten,
    getCompletedUnreviewedAppointments,
    submitReview
} = require('../controllers/userController');

router.use(verifyToken, requireClient);

// Trasy Wizyt Klienta
router.get('/appointments', getUserAppointments);
router.put('/appointments/:appointmentId/cancel', cancelUserAppointment);
router.get('/appointments/next-upcoming', getNextUpcomingAppointment);
router.get('/appointments/completed-unreviewed', getCompletedUnreviewedAppointments); // Nowa trasa

// Trasy Powiadomień Klienta
// Notifications are the same four operations for every role; the recipient is
// whoever is holding the token, so one controller serves all three panels.
router.get('/notifications', notifications.list);
router.get('/notifications/unread-count', notifications.unreadCount);
router.put('/notifications/read-all', notifications.markAllRead);
router.put('/notifications/:id/read', notifications.markRead);
router.delete('/notifications/:id', notifications.remove);

// Trasy Profilu Klienta
router.get('/profile', getUserProfile);
router.put('/profile', blockDemoProfileChange, updateUserProfile);

// Trasy Statystyk Klienta
router.get('/stats', getUserStats);

// Trasy Recenzji Klienta
router.get('/reviews', getUserReviewsWritten); // Nowa trasa
router.post('/reviews', submitReview); // Nowa trasa
// router.put('/reviews/:reviewId', updateReview); // Opcjonalnie w przyszłości
// router.delete('/reviews/:reviewId', deleteReview); // Opcjonalnie w przyszłości

module.exports = router;