const express = require('express');
const router = express.Router();
const { verifyToken, requireAdmin } = require('../middleware/authMiddleware');
const {
    getStats,
    getRevenue,
    getAdminNotifications, // Zmieniono z getRecentActivities
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
    getReportData // Dodano import nowej funkcji
} = require('../controllers/adminController');

router.use(verifyToken, requireAdmin);

router.get('/stats', getStats);
router.get('/revenue', getRevenue);
router.get('/notifications', getAdminNotifications); // Zmieniono ścieżkę i funkcję
router.get('/users', getUsers);
router.put('/users/:id', updateUser);
router.delete('/users/:id', deleteUser);
router.get('/appointments', getAppointments);
router.put('/appointments/:id', updateAppointment);
router.delete('/appointments/:id', deleteAppointment);
router.get('/services', getServices);
router.post('/services', addService);
router.put('/services/:id', updateService);
router.delete('/services/:id', deleteService);
router.get('/reviews', getReviews);
router.delete('/reviews/:id', deleteReview);
router.get('/reports-data', getReportData); // Dodano nową trasę

module.exports = router;