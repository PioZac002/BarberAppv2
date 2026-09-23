/**
 * The root test run also covers backend/**, but Node resolves those imports
 * from backend/node_modules first. Without it the backend suites fail on a
 * missing dependency, which reads like a broken test rather than a missing
 * install. Install them once, quietly, before the tests run.
 */
import { existsSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const marker = join(root, 'backend', 'node_modules', 'jsonwebtoken');

if (!existsSync(marker)) {
    console.log('[pretest] installing backend dependencies…');
    execSync('npm install --no-audit --no-fund --loglevel=error', {
        cwd: join(root, 'backend'),
        stdio: 'inherit',
    });
}
