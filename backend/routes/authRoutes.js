const express = require('express');
const router = express.Router();
const { register, login } = require('../controllers/authController');
const { verifyToken } = require('../middleware/authMiddleware'); // Tylko verifyToken jest tu potrzebne
const pool = require('../config/database');

// Trasa do rejestracji
router.post('/register', register);

// Trasa do logowania
router.post('/login', login);

// Trasa do weryfikacji tokenu i pobrania danych użytkownika
router.get('/verify-token', verifyToken, async (req, res) => {
    try {
        // req.user jest ustawiane przez verifyToken i zawiera id oraz role
        const userId = req.user.id;
        const userRole = req.user.role;

        // Pobierz dodatkowe dane użytkownika z bazy, jeśli są potrzebne
        // Na przykład, jeśli useAuth hook na frontendzie oczekuje więcej niż tylko id i role
        const result = await pool.query(
            'SELECT id, first_name, last_name, email, role FROM users WHERE id = $1',
            [userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Użytkownik nie znaleziony po weryfikacji tokenu.' });
        }

        const userFromDb = result.rows[0];

        // Upewnij się, że rola z tokenu zgadza się z rolą w bazie (opcjonalny dodatkowy check)
        if (userFromDb.role !== userRole) {
            console.warn(`Niezgodność roli dla użytkownika ${userId}: token (${userRole}), DB (${userFromDb.role})`);
            // Możesz zdecydować, jak obsłużyć taką sytuację, np. unieważnić token
            // return res.status(403).json({ error: 'Niezgodność danych sesji.' });
        }

        // Zwróć dane użytkownika, które będą użyte do ustawienia kontekstu Auth na frontendzie
        res.json({
            user: {
                id: userFromDb.id,
                firstName: userFromDb.first_name,
                lastName: userFromDb.last_name,
                email: userFromDb.email,
                role: userFromDb.role
            }
        });
    } catch (err) {
        console.error("Błąd w /verify-token:", err.stack);
        res.status(500).json({ error: 'Błąd serwera podczas weryfikacji tokenu.' });
    }
});

module.exports = router;