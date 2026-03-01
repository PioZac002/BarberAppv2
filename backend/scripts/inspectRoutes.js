// node backend/scripts/inspectRoutes.js
// Wypisuje ścieżki zdefiniowane w routerach oraz łapie błędy przy require
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

function inspectRouter(router) {
    const results = [];
    // express Router instances keep stack of layers
    const stack = router && (router.stack || router._router && router._router.stack);
    if (!stack || !Array.isArray(stack)) {
        return { note: 'No stack found on router', stackLength: stack ? stack.length : 0 };
    }
    for (const layer of stack) {
        // layer.route for route handlers with methods
        if (layer.route) {
            const routePath = layer.route.path;
            const methods = layer.route.methods;
            results.push({ type: 'route', path: routePath, methods });
        } else if (layer.name === 'router' && layer.handle && layer.handle.stack) {
            // nested router - inspect its stack layers
            for (const sub of layer.handle.stack) {
                if (sub.route) {
                    results.push({ type: 'nested-route', path: sub.route.path, methods: sub.route.methods });
                } else {
                    results.push({ type: 'layer', info: sub.name || '<anonymous>' });
                }
            }
        } else {
            // generic layer (could be middleware)
            // try to display regexp or path
            if (layer.regexp && layer.regexp.source) {
                results.push({ type: 'layer-regexp', regexp: layer.regexp.source });
            } else {
                results.push({ type: 'layer', info: layer.name || '<anonymous>' });
            }
        }
    }
    return results;
}

for (const f of routeFiles) {
    console.log('---');
    console.log('FILE:', f);
    try {
        const router = require(f);
        console.log('  -> require OK');
        const info = inspectRouter(router);
        if (Array.isArray(info)) {
            for (const it of info) {
                if (it.type === 'route' || it.type === 'nested-route') {
                    console.log(`    [${it.type}] path="${it.path}" methods=${Object.keys(it.methods || {}).join(',')}`);
                    // quick sanity check: detect "/:" at end or "/:" followed by non-word
                    if (/\/:$|\/:\W|\/:\s/.test(String(it.path))) {
                        console.warn('      !!! Suspicious param pattern detected in path:', it.path);
                    }
                } else if (it.type === 'layer-regexp') {
                    console.log(`    [layer-regexp] ${it.regexp}`);
                } else {
                    console.log(`    [${it.type}] ${it.info || JSON.stringify(it)}`);
                }
            }
            console.log(`  -> total entries: ${info.length}`);
        } else {
            console.log('  -> router info:', info);
        }
    } catch (err) {
        console.error('  -> ERROR while requiring or inspecting router:', err && err.stack ? err.stack : err);
    }
}
console.log('---\nDONE');