const knex = require('knex');
require('dotenv').config();

const db = knex({
  client: 'pg',
  connection: {
    host:     process.env.DB_HOST     || 'localhost',
    port:     process.env.DB_PORT     || 5432,
    database: process.env.DB_NAME     || 'autoscan_db',
    user:     process.env.DB_USER     || 'autoscan_user',
    password: process.env.DB_PASSWORD || 'autoscan_pass',
  },
  pool: { min: 2, max: 10 },
  migrations: {
    tableName: 'knex_migrations',
    directory: './db/migrations',
  },
  seeds: {
    directory: './db/seeds',
  },
});

db.raw('SELECT 1')
  .then(() => console.log('[DB] PostgreSQL connected ✅'))
  .catch((err) => console.error('[DB] Connection failed ❌', err.message));

module.exports = db;
