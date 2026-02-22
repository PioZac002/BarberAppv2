const jwt = require('jsonwebtoken');
require('dotenv').config();

// Weryfikacja tokenu JWT
const verifyToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
        return res.status(403).json({ error: 'Brak tokena uwierzytelniającego.' });
    }
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (err) {
        console.error("Błąd weryfikacji tokenu:", err.message);
        if (err.name === 'TokenExpiredError') {
            return res.status(401).json({ error: 'Token wygasł.', code: 'TOKEN_EXPIRED' });
        }
        return res.status(401).json({ error: 'Nieprawidłowy lub nieważny token.' });
    }
};

// Middleware sprawdzające rolę 'client'
const requireClient = (req, res, next) => {
    if (!req.user || req.user.role !== 'client') {
        return res.status(403).json({ error: 'Dostęp zabroniony. Wymagana rola klienta.' });
    }
    next();
};

// Middleware sprawdzające rolę 'barber'
const requireBarber = (req, res, next) => {
    if (!req.user || req.user.role !== 'barber') {
        return res.status(403).json({ error: 'Dostęp zabroniony. Wymagana rola barbera.' });
    }
    next();
};

// Middleware sprawdzające rolę 'admin'
const requireAdmin = (req, res, next) => {
    if (!req.user || req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Dostęp zabroniony. Wymagana rola administratora.' });
    }
    next();
};

module.exports = {
    verifyToken,
    requireClient,
    requireBarber,
    requireAdmin
};