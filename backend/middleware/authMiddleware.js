const jwt = require('jsonwebtoken');
require('dotenv').config();

const verifyToken = (req, res, next) => {
    const token = req.headers['authorization']?.split(' ')[1]; // Pobierz token z nagłówka
    if (!token) {
        return res.status(403).json({ error: 'Brak tokena' });
    }
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET); // Zweryfikuj token
        req.user = decoded; // Zapisz zdekodowane dane w obiekcie żądania
        next(); // Przejdź do następnego middleware lub trasy
    } catch (err) {
        return res.status(401).json({ error: 'Nieprawidłowy token' });
    }
};

module.exports = { verifyToken };