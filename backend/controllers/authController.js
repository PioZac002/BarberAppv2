const bcrypt = require('bcryptjs');
const pool = require('../config/database');
const { generateToken } = require('../utils/jwtUtils');

const hashPassword = async (password) => {
    const salt = await bcrypt.genSalt(10);
    return await bcrypt.hash(password, salt);
};

const register = async (req, res) => {
    const { firstName, lastName, email, phone, password } = req.body;

    if (!firstName || !lastName || !email || !phone || !password) {
        return res.status(400).json({ error: 'Wszystkie pola są wymagane' });
    }

    try {
        const emailCheck = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        if (emailCheck.rows.length > 0) {
            return res.status(400).json({ error: 'Email jest już zarejestrowany' });
        }

        const hashedPassword = await hashPassword(password);
        const result = await pool.query(
            'INSERT INTO users (first_name, last_name, email, phone, password, role) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, first_name, last_name, email, role',
            [firstName, lastName, email, phone, hashedPassword, 'client']
        );

        const user = result.rows[0];
        res.status(201).json({ message: 'Użytkownik zarejestrowany', user });
    } catch (err) {
        console.error(err.stack);
        res.status(500).json({ error: 'Błąd serwera' });
    }
};

const login = async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: 'Email i hasło są wymagane' });
    }

    try {
        const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        const user = result.rows[0];

        if (!user) {
            return res.status(400).json({ error: 'Nieprawidłowy email lub hasło' });
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(400).json({ error: 'Nieprawidłowy email lub hasło' });
        }

        const token = generateToken(user);
        res.json({
            message: 'Zalogowano pomyślnie',
            token,
            user: { id: user.id, firstName: user.first_name, lastName: user.last_name, email: user.email, role: user.role },
        });
    } catch (err) {
        console.error(err.stack);
        res.status(500).json({ error: 'Błąd serwera' });
    }
};

module.exports = { register, login };