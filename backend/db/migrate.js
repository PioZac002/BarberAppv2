/**
 * Schema migrations.
 *
 * The SQL in db/01_schema.sql only runs when Postgres initialises an empty
 * data directory, so a database that already exists never sees a change made
 * there. Anything that has to reach a deployed database goes here instead:
 * every step is idempotent, applied once, recorded by name, and run before
 * the server accepts traffic.
 */
const fs = require('fs');
const path = require('path');
const pool = require('../config/database');

const DIR = path.join(__dirname, 'migrations');

async function runMigrations() {
    await pool.query(`
        CREATE TABLE IF NOT EXISTS schema_migrations (
            name       TEXT PRIMARY KEY,
            applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
    `);

    const files = fs.existsSync(DIR)
        ? fs.readdirSync(DIR).filter(f => f.endsWith('.sql')).sort()
        : [];

    const { rows } = await pool.query('SELECT name FROM schema_migrations');
    const applied = new Set(rows.map(r => r.name));

    for (const file of files) {
        if (applied.has(file)) continue;

        const sql = fs.readFileSync(path.join(DIR, file), 'utf8');
        const client = await pool.connect();
        try {
            await client.query('BEGIN');
            await client.query(sql);
            await client.query('INSERT INTO schema_migrations (name) VALUES ($1)', [file]);
            await client.query('COMMIT');
            console.log(`[migrate] applied ${file}`);
        } catch (err) {
            await client.query('ROLLBACK');
            throw new Error(`migration ${file} failed: ${err.message}`);
        } finally {
            client.release();
        }
    }
}

module.exports = { runMigrations };
