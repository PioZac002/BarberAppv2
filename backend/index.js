const express = require('express');
const cors = require('cors');
require('dotenv').config(); // wczytaj env zanim cokolwiek innego będzie require'owane w routerach/controllers

const app = express();
const port = process.env.PORT || 3000;

// FRONTEND_URL może być pojedynczym adresem lub listą rozdzieloną przecinkami
const rawFrontend = process.env.FRONTEND_URL || 'http://localhost:5173';
const allowedOrigins = rawFrontend.split(',').map(s => s.trim()).filter(Boolean);

const corsOptions = {
    origin: (origin, callback) => {
        // allow requests with no origin (curl, postman) or from allowed list
        if (!origin || allowedOrigins.includes(origin)) {
            return callback(null, true);
        }
        callback(new Error('Not allowed by CORS'));
    },
    optionsSuccessStatus: 200,
    // credentials: true, // odkomentuj tylko jeśli używasz cookies
};

// prosty logger requestów - przydatne w logach Render / lokalnie
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
});

// obsługa preflight dla wszystkich ścieżek
app.options('*', cors(corsOptions));
app.use(cors(corsOptions));

app.use(express.json());

// healthcheck (możesz ustawić tę ścieżkę w Render jako health check)
app.get('/health', (req, res) => res.json({ status: 'ok' }));

// Montowanie routerów dynamicznie (require + mount w try/catch, żeby wyłapać błędy dokładnie)
const routesToMount = [
    { mountPath: '/api', modulePath: './routes/authRoutes', name: 'authRoutes' },
    { mountPath: '/api/admin', modulePath: './routes/adminRoutes', name: 'adminRoutes' },
    { mountPath: '/api/barber', modulePath: './routes/BarberRoutes', name: 'barberRoutes' },
    { mountPath: '/api/user', modulePath: './routes/userRoutes', name: 'userRoutes' },
    { mountPath: '/api/booking', modulePath: './routes/bookingRoutes', name: 'bookingRoutes' },
    { mountPath: '/api/public/team', modulePath: './routes/publicTeamRoutes', name: 'publicTeamRoutes' },
    { mountPath: '/api/public/services', modulePath: './routes/publicServicesRoutes', name: 'publicServicesRoutes' },
];

for (const r of routesToMount) {
    try {
        console.log(`\n[DEBUG] Requiring router module ${r.name} from ${r.modulePath}`);
        const router = require(r.modulePath);
        console.log(`[DEBUG] Require OK for ${r.name}. Now mounting at "${r.mountPath}"`);
        app.use(r.mountPath, router);
        console.log(`[DEBUG] Mounted ${r.name} at "${r.mountPath}"`);
    } catch (err) {
        console.error(`\n[ERROR] Failure while requiring/mounting ${r.name} (${r.modulePath}) at "${r.mountPath}"`);
        console.error(err && err.stack ? err.stack : err);
        // zatrzymujemy proces aby log był widoczny w Render / konsoli i łatwo zdiagnozować
        process.exit(1);
    }
}

// opcjonalnie wyłącz nagłówek X-Powered-By
app.disable('x-powered-by');

app.listen(port, () => {
    console.log(`Serwer działa na porcie ${port}`);
    console.log(`Allowed frontend origins: ${allowedOrigins.join(', ')}`);
});