require('dotenv').config();
const bcrypt = require('bcrypt');
const mysql = require('mysql2/promise');

async function initDatabase() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    ssl: {
      rejectUnauthorized: true
    }
  });

  console.log('Connected to MySQL database');

  // Create admin user
  const login = 'admin';
  const password = 'admin123';
  const password_hash = await bcrypt.hash(password, 10);

  try {
    await connection.execute(
      'INSERT INTO users (login, password_hash, role, email, full_name) VALUES (?, ?, ?, ?, ?)',
      [login, password_hash, 'admin', 'admin@example.com', 'Администратор']
    );
    console.log('Admin user created successfully');
    console.log('Login: admin');
    console.log('Password: admin123');
    console.log('ВАЖНО: Смените пароль после первого входа!');
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      console.log('Admin user already exists');
    } else {
      console.error('Error creating admin user:', error);
    }
  }

  await connection.end();
}

initDatabase().catch(console.error);
