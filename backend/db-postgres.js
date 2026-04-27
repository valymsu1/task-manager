const { Pool } = require('pg');

let pool;

const getConnection = () => {
  if (!pool) {
    pool = new Pool({
      host: process.env.PGHOST || process.env.DB_HOST,
      port: process.env.PGPORT || 5432,
      database: process.env.PGDATABASE || process.env.DB_NAME || 'postgres',
      user: process.env.PGUSER || process.env.DB_USER || 'postgres',
      password: process.env.PGPASSWORD || process.env.DB_PASSWORD,
      ssl: process.env.NODE_ENV === 'production' ? {
        rejectUnauthorized: false
      } : false
    });
  }
  return pool;
};

module.exports = { getConnection };
