const express = require('express');
const router = express.Router();
const path = require('path');
const multer = require('multer');
const { verifyToken, requireBarber, blockDemoProfileChange } = require('../middleware/authMiddleware');
const {
    getBarberPortfolio,
    addPortfolioImage,
    deletePortfolioImage,
    uploadPortfolioImage,
    uploadProfilePhoto,
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

// ── Multer storage configs ──
const portfolioStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, '..', 'uploads', 'portfolio'));
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase();
        cb(null, `portfolio-${req.user.id}-${Date.now()}${ext}`);
    },
});

const profileStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, '..', 'uploads', 'profiles'));
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase();
        cb(null, `profile-${req.user.id}-${Date.now()}${ext}`);
    },
});

const imageFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);
    } else {
        cb(new Error('Dozwolone są tylko pliki graficzne.'), false);
    }
};

const uploadPortfolio = multer({
    storage: portfolioStorage,
    fileFilter: imageFilter,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
});

const uploadProfile = multer({
    storage: profileStorage,
    fileFilter: imageFilter,
    limits: { fileSize: 3 * 1024 * 1024 }, // 3 MB
});

// Apply auth middleware to all routes
router.use(verifyToken, requireBarber);

// Portfolio routes
router.get('/portfolio', getBarberPortfolio);
router.post('/portfolio', addPortfolioImage);
router.post('/portfolio/upload', uploadPortfolio.single('image'), uploadPortfolioImage);
router.delete('/portfolio/:imageId', deletePortfolioImage);

// Profile routes
router.get('/profile', getBarberProfile);
router.put('/profile', blockDemoProfileChange, updateBarberProfile);
router.post('/profile/upload-photo', uploadProfile.single('photo'), uploadProfilePhoto);

// Notifications
router.get('/notifications', getBarberNotifications);
router.put('/notifications/read-all', markAllNotificationsAsRead);
router.put('/notifications/:id/read', markNotificationAsRead);
router.delete('/notifications/:id', deleteNotification);

// Stats
router.get('/stats', getBarberStats);

// Appointments
router.get('/appointments', getBarberAppointments);
router.put('/appointments/:id/status', updateAppointmentStatus);

// Schedule
router.get('/schedule', getBarberSchedule);

module.exports = router;
