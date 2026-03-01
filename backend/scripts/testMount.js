// Uruchom: node backend/scripts/testMount.js (z katalogu repo lub backend/scripts)
const express = require('express');
const path = require('path');

const base = path.resolve(__dirname, '..'); // backend/
const routers = [
    { name: 'authRoutes', path: path.join(base, 'routes', 'authRoutes.js') },
    { name: 'adminRoutes', path: path.join(base, 'routes', 'adminRoutes.js') },
    { name: 'barberRoutes', path: path.join(base, 'routes', 'BarberRoutes.js') },
    { name: 'userRoutes', path: path.join(base, 'routes', 'userRoutes.js') },
    { name: 'bookingRoutes', path: path.join(base, 'routes', 'bookingRoutes.js') },
    { name: 'publicTeamRoutes', path: path.join(base, 'routes', 'publicTeamRoutes.js') },
    { name: 'publicServicesRoutes', path: path.join(base, 'routes', 'publicServicesRoutes.js') },
];

console.log('Tworzę aplikację Express i próbuję zamontować każdy router po kolei...');
const app = express();

for (const r of routers) {
    try {
        console.log(`\n==> Require ${r.name} from ${r.path}`);
        const router = require(r.path);
        console.log(`-> OK require ${r.name}. Teraz mount...`);
        // montujemy pod unikalną ścieżką żeby nie kolidowało
        const mountPath = `/__test_mount__/${r.name}`;
        app.use(mountPath, router);
        console.log(`-> SUCCESS mounted ${r.name} at ${mountPath}`);
    } catch (err) {
        console.error(`\n[ERROR] przy require/mount ${r.name}:`);
        console.error(err && err.stack ? err.stack : err);
        process.exit(1);
    }
}

console.log('\nWszystkie routery zostały zamontowane pomyślnie (nie znaleziono błędu).');