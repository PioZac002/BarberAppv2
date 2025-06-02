// backend/routes/publicServicesRoutes.js
const express = require('express');
const router = express.Router();
const { getAllPublicServices } = require('../controllers/publicServicesController');

// Trasa jest publiczna
router.get('/', getAllPublicServices);

module.exports = router;