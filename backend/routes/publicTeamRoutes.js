const express = require('express');
const router = express.Router();
const {
    getAllBarberSummaries,
    getAllPublicReviews,
    getBarberDetailsById
} = require('../controllers/publicTeamController');

// Te trasy są publiczne, więc nie wymagają verifyToken ani specyficznej roli
router.get('/barbers', getAllBarberSummaries);
router.get('/barbers/:barberId/details', getBarberDetailsById);
router.get('/reviews', getAllPublicReviews);

module.exports = router;