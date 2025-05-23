const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/authMiddleware');
const {
    getStats,
    getRevenue,
    getRecentActivities,
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
    deleteReview
} = require('../controllers/adminController');

const requireAdmin = (req, res, next) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Brak dostępu' });
    }
    next();
};

router.get('/stats', verifyToken, requireAdmin, getStats);
router.get('/revenue', verifyToken, requireAdmin, getRevenue);
router.get('/recent-activities', verifyToken, requireAdmin, getRecentActivities);
router.get('/users', verifyToken, requireAdmin, getUsers);
router.put('/users/:id', verifyToken, requireAdmin, updateUser);
router.delete('/users/:id', verifyToken, requireAdmin, deleteUser);
router.get('/appointments', verifyToken, requireAdmin, getAppointments);
router.put('/appointments/:id', verifyToken, requireAdmin, updateAppointment);
router.delete('/appointments/:id', verifyToken, requireAdmin, deleteAppointment);
router.get('/services', verifyToken, requireAdmin, getServices);
router.post('/services', verifyToken, requireAdmin, addService);
router.put('/services/:id', verifyToken, requireAdmin, updateService);
router.delete('/services/:id', verifyToken, requireAdmin, deleteService);
router.get('/reviews', verifyToken, requireAdmin, getReviews);
router.delete('/reviews/:id', verifyToken, requireAdmin, deleteReview);

module.exports = router;