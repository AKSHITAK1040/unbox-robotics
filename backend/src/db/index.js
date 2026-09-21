const { Pool } = require('pg');

const poolConfig = process.env.DATABASE_URL
  ? {
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.DB_SSL === 'false' ? false : { rejectUnauthorized: false },
    }
  : {
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 5432,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
    };

const pool = new Pool(poolConfig);

// Auto-initialize schema if not exists (for cloud deployment like Render/Neon)
const initDb = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS speed_data (
        id BIGSERIAL PRIMARY KEY,
        speed DOUBLE PRECISION NOT NULL,
        recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_speed_data_recorded_at ON speed_data(recorded_at DESC);
    `);
  } catch (err) {
    // Non-fatal during testing or when DB is initializing
  }
};

initDb();

pool.on('error', (err, client) => {
  console.error('Unexpected error on idle client', err);
});

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool,
};
