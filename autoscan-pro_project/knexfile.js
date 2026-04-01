require('dotenv').config();

module.exports = {
  development: {
    client: 'pg',
    connection: {
      host:     process.env.DB_HOST     || 'localhost',
      port:     process.env.DB_PORT     || 5432,
      database: process.env.DB_NAME     || 'autoscan_db',
      user:     process.env.DB_USER     || 'autoscan_user',
      password: process.env.DB_PASSWORD || 'autoscan_pass',
    },
    migrations: {
      tableName: 'knex_migrations',
      directory: './db/migrations',
    },
    seeds: {
      directory: './db/seeds',
    },
  },

  production: {
    client: 'pg',
    connection: process.env.DATABASE_URL,
    migrations: {
      tableName: 'knex_migrations',
      directory: './db/migrations',
    },
  },
};
