const express = require('express');
const router = express.Router();
const { verifyToken, requireClient } = require('../middleware/authMiddleware');
const {
    getUserAppointments,
    cancelUserAppointment,
    getUserNotifications,
    markUserNotificationAsRead,
    markAllUserNotificationsAsRead,
    deleteUserNotification,
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
router.get('/notifications', getUserNotifications);
router.put('/notifications/read-all', markAllUserNotificationsAsRead);
router.put('/notifications/:notificationId/read', markUserNotificationAsRead);
router.delete('/notifications/:notificationId', deleteUserNotification);

// Trasy Profilu Klienta
router.get('/profile', getUserProfile);
router.put('/profile', updateUserProfile);

// Trasy Statystyk Klienta
router.get('/stats', getUserStats);

// Trasy Recenzji Klienta
router.get('/reviews', getUserReviewsWritten); // Nowa trasa
router.post('/reviews', submitReview); // Nowa trasa
// router.put('/reviews/:reviewId', updateReview); // Opcjonalnie w przyszłości
// router.delete('/reviews/:reviewId', deleteReview); // Opcjonalnie w przyszłości

module.exports = router;