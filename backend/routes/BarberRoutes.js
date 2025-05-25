const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/authMiddleware');
const {
    getBarberPortfolio,
    addPortfolioImage,
    deletePortfolioImage,
    getBarberProfile,
    updateBarberProfile,
    getBarberNotifications,
    markNotificationAsRead,
    deleteNotification,
    markAllNotificationsAsRead, // Nowa funkcja
    getBarberStats,
    getBarberAppointments,
    updateAppointmentStatus, // Nowa funkcja
    getBarberSchedule
} = require('../controllers/barberController');

// Middleware do sprawdzania roli barbera
const requireBarber = (req, res, next) => {
    if (req.user.role !== 'barber') {
        return res.status(403).json({ error: 'Brak dostępu' });
    }
    next();
};

// Trasy Portfolio
router.get('/portfolio', verifyToken, requireBarber, getBarberPortfolio);
router.post('/portfolio', verifyToken, requireBarber, addPortfolioImage);
router.delete('/portfolio/:imageId', verifyToken, requireBarber, deletePortfolioImage);

// Trasy Profilu
router.get('/profile', verifyToken, requireBarber, getBarberProfile);
router.put('/profile', verifyToken, requireBarber, updateBarberProfile);

// Trasy Powiadomień
router.get('/notifications', verifyToken, requireBarber, getBarberNotifications);
router.put('/notifications/read-all', verifyToken, requireBarber, markAllNotificationsAsRead); // Nowa trasa
router.put('/notifications/:id/read', verifyToken, requireBarber, markNotificationAsRead);
router.delete('/notifications/:id', verifyToken, requireBarber, deleteNotification);

// Trasy Statystyk
router.get('/stats', verifyToken, requireBarber, getBarberStats);

// Trasy Wizyt
router.get('/appointments', verifyToken, requireBarber, getBarberAppointments);
router.put('/appointments/:id/status', verifyToken, requireBarber, updateAppointmentStatus); // Nowa trasa

// Trasa Harmonogramu
router.get('/schedule', verifyToken, requireBarber, getBarberSchedule);

module.exports = router;