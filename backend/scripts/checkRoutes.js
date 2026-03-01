// backend/scripts/checkRoutes.js
// Uruchom: node backend/scripts/checkRoutes.js (możesz uruchomić z repo root lub z dowolnego miejsca)
const path = require('path');

const base = path.resolve(__dirname, '..'); // backend/
const routeFiles = [
    path.join(base, 'routes', 'authRoutes.js'),
    path.join(base, 'routes', 'adminRoutes.js'),
    path.join(base, 'routes', 'BarberRoutes.js'),
    path.join(base, 'routes', 'userRoutes.js'),
    path.join(base, 'routes', 'bookingRoutes.js'),
    path.join(base, 'routes', 'publicTeamRoutes.js'),
    path.join(base, 'routes', 'publicServicesRoutes.js'),
];

console.log('Sprawdzam require() dla plików routerów:');
for (const f of routeFiles) {
    try {
        console.log(' -> require', f);
        require(f);
        console.log('[OK] ', f);
    } catch (err) {
        console.error('\n[BŁĄD] podczas require ->', f);
        console.error(err && err.stack ? err.stack : err);
        process.exit(1);
    }
}
console.log('\nWszystkie routery załadowały się poprawnie (nie znaleziono błędu).');