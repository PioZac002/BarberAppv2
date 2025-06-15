const express = require('express');
const router = express.Router();
// Importujemy verifyToken i requireBarber z authMiddleware
const { verifyToken, requireBarber } = require('../middleware/authMiddleware');
const {
    getBarberPortfolio,
    addPortfolioImage,
    deletePortfolioImage,
    getBarberProfile,
    updateBarberProfile,
    getBarberNotifications,
    markNotificationAsRead,
    deleteNotification,
    markAllNotificationsAsRead,
    getBarberStats,
    getBarberAppointments,
    updateAppointmentStatus,
    getBarberSchedule
} = require('../controllers/BarberController');

// Stosujemy middleware do wszystkich tras w tym routerze
router.use(verifyToken, requireBarber);

// Trasy Portfolio (już nie potrzebują indywidualnego verifyToken i requireBarber)
router.get('/portfolio', getBarberPortfolio);
router.post('/portfolio', addPortfolioImage);
router.delete('/portfolio/:imageId', deletePortfolioImage);

// Trasy Profilu
router.get('/profile', getBarberProfile);
router.put('/profile', updateBarberProfile);

// Trasy Powiadomień
router.get('/notifications', getBarberNotifications);
router.put('/notifications/read-all', markAllNotificationsAsRead);
router.put('/notifications/:id/read', markNotificationAsRead);
router.delete('/notifications/:id', deleteNotification);

// Trasy Statystyk
router.get('/stats', getBarberStats);

// Trasy Wizyt
router.get('/appointments', getBarberAppointments);
router.put('/appointments/:id/status', updateAppointmentStatus);

// Trasa Harmonogramu
router.get('/schedule', getBarberSchedule);

module.exports = router;