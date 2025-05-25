const express = require('express');
const router = express.Router();
// Importujemy verifyToken i requireAdmin z authMiddleware
const { verifyToken, requireAdmin } = require('../middleware/authMiddleware');
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

// Stosujemy middleware do wszystkich tras w tym routerze
router.use(verifyToken, requireAdmin);

// Trasy (już nie potrzebują indywidualnego verifyToken i requireAdmin)
router.get('/stats', getStats);
router.get('/revenue', getRevenue);
router.get('/recent-activities', getRecentActivities);
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

module.exports = router;