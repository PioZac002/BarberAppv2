const jwt = require('jsonwebtoken');
require('dotenv').config();

const generateToken = (user) => {
    return jwt.sign(
        { id: user.id, email: user.email, role: user.role },
        process.env.JWT_SECRET || 'bardzo_tajny_sekret',
        { expiresIn: '30m' }
    );
};

module.exports = { generateToken };