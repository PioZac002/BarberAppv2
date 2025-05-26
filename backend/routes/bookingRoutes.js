const express = require('express');
const router = express.Router();
const { verifyToken, requireClient } = require('../middleware/authMiddleware'); // Zakładamy, że requireClient istnieje

const {
    getServicesForBooking,
    getBarbersForBooking,
    getAvailableTimeSlots,
    createBooking
} = require('../controllers/bookingController');

// Wszystkie trasy rezerwacji wymagają zalogowanego klienta
router.use(verifyToken, requireClient);

router.get('/services', getServicesForBooking);
router.get('/barbers', getBarbersForBooking);
router.get('/availability', getAvailableTimeSlots); // Oczekuje parametrów: date, serviceId, barberId
router.post('/create', createBooking);

module.exports = router;