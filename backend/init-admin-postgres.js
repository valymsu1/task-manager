require('dotenv').config();
const bcrypt = require('bcrypt');
const { Pool } = require('pg');

async function initDatabase() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  });

  console.log('Connected to PostgreSQL database');

  // Create admin user
  const login = 'admin';
  const password = 'admin123';
  const password_hash = await bcrypt.hash(password, 10);

  try {
    await pool.query(
      'INSERT INTO users (login, password_hash, role, email, full_name) VALUES ($1, $2, $3, $4, $5)',
      [login, password_hash, 'admin', 'admin@example.com', 'Администратор']
    );
    console.log('Admin user created successfully');
    console.log('Login: admin');
    console.log('Password: admin123');
    console.log('ВАЖНО: Смените пароль после первого входа!');
  } catch (error) {
    if (error.code === '23505') {
      console.log('Admin user already exists');
    } else {
      console.error('Error creating admin user:', error);
    }
  }

  await pool.end();
}

initDatabase().catch(console.error);
