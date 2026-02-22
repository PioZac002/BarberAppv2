const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/authRoutes');
const adminRoutes = require('./routes/adminRoutes');
const barberRoutes = require('./routes/BarberRoutes');
const userRoutes = require('./routes/userRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const publicTeamRoutes = require('./routes/publicTeamRoutes');
const publicServicesRoutes = require('./routes/publicServicesRoutes');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

// FRONTEND_URL może być pojedynczym adresem lub listą rozdzieloną przecinkami
const rawFrontend = process.env.FRONTEND_URL || 'http://localhost:5173';
const allowedOrigins = rawFrontend.split(',').map(s => s.trim()).filter(Boolean);

const corsOptions = {
    origin: (origin, callback) => {
        // allow requests with no origin (like curl, postman) or from allowed list
        if (!origin || allowedOrigins.includes(origin)) {
            return callback(null, true);
        }
        callback(new Error('Not allowed by CORS'));
    },
    optionsSuccessStatus: 200,
    // jeśli używasz cookies/auth, odkomentuj poniższe:
    // credentials: true,
};

app.use((req, res, next) => {
    // prosty logger requestów - przydatne w Render logs
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
});

// obsługa preflight dla wszystkich ścieżek
app.options('*', cors(corsOptions));
app.use(cors(corsOptions));

app.use(express.json());

// proste healthcheck - Render może go użyć do health checks
app.get('/health', (req, res) => res.json({ status: 'ok' }));

// zarejestruj routy
app.use('/api', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/barber', barberRoutes);
app.use('/api/user', userRoutes);
app.use('/api/booking', bookingRoutes);
app.use('/api/public/team', publicTeamRoutes);
app.use('/api/public/services', publicServicesRoutes);

// opcjonalnie wyłącz nagłówek X-Powered-By
app.disable('x-powered-by');

app.listen(port, () => {
    console.log(`Serwer działa na porcie ${port}`);
    console.log(`Allowed frontend origins: ${allowedOrigins.join(', ')}`);
});