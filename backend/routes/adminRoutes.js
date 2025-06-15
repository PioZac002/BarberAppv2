const express = require('express');
const router = express.Router();
const { verifyToken, requireAdmin } = require('../middleware/authMiddleware');
const {
    getStats,
    getRevenue,
    getAdminNotifications,
    markNotificationAsRead,      // DODANO
    markAllNotificationsAsRead,  // DODANO
    deleteNotification,          // DODANO
    getUsers,
    updateUser,
    deleteUser,
    getAppointments,
    updateAppointment,
    deleteAppointment,
    getServices,
    addService,
    updateService,
    deleteService,
    getReviews,
    deleteReview,
    getReportData,
    getBarbersForSelect
} = require('../controllers/adminController');

// Zastosowanie middleware do wszystkich tras w tym pliku
router.use(verifyToken, requireAdmin);

// Trasy główne
router.get('/stats', getStats);
router.get('/revenue', getRevenue);
router.get('/reports-data', getReportData);

// Powiadomienia
router.get('/notifications', getAdminNotifications);
router.put('/notifications/read-all', markAllNotificationsAsRead);
router.put('/notifications/:id/read', markNotificationAsRead);
router.delete('/notifications/:id', deleteNotification);

// Zarządzanie Użytkownikami i Barberami
router.get('/users', getUsers);
router.put('/users/:id', updateUser);
router.delete('/users/:id', deleteUser);
router.get('/barbers-for-select', getBarbersForSelect);

// Zarządzanie Wizytami
router.get('/appointments', getAppointments);
router.put('/appointments/:id', updateAppointment);
router.delete('/appointments/:id', deleteAppointment);

// Zarządzanie Usługami
router.get('/services', getServices);
router.post('/services', addService);
router.put('/services/:id', updateService);
router.delete('/services/:id', deleteService);

// Zarządzanie Recenzjami
router.get('/reviews', getReviews);
router.delete('/reviews/:id', deleteReview);

module.exports = router;
