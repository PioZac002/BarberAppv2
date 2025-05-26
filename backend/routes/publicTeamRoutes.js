const express = require('express');
const router = express.Router();
const {
    getAllBarberSummaries,
    getBarberDetailsById
} = require('../controllers/publicTeamController');

// Te trasy są publiczne, więc nie wymagają verifyToken ani specyficznej roli
router.get('/barbers', getAllBarberSummaries);
router.get('/barbers/:barberId/details', getBarberDetailsById);

module.exports = router;