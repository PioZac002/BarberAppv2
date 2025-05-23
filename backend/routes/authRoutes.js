const express = require('express');
const router = express.Router();
const { register, login } = require('../controllers/authController');
const { verifyToken } = require('../middleware/authMiddleware');
const pool = require('../config/database');

// Trasa do rejestracji
router.post('/register', register);

// Trasa do logowania
router.post('/login', login);

// Trasa do weryfikacji tokenu
router.get('/verify-token', verifyToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const result = await pool.query('SELECT id, first_name, last_name, email, role FROM users WHERE id = $1', [userId]);
        const user = result.rows[0];

        if (!user) {
            return res.status(404).json({ error: 'Użytkownik nie znaleziony' });
        }

        res.json({ user });
    } catch (err) {
        console.error(err.stack);
        res.status(500).json({ error: 'Błąd serwera' });
    }
});

module.exports = router;