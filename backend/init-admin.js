const bcrypt = require('bcrypt');
const db = require('./database');

async function createAdminUser() {
  const login = 'admin';
  const password = 'admin123';
  const password_hash = await bcrypt.hash(password, 10);

  db.run(
    'INSERT INTO users (login, password_hash, role, email, full_name) VALUES (?, ?, ?, ?, ?)',
    [login, password_hash, 'admin', 'admin@example.com', 'Администратор'],
    function(err) {
      if (err) {
        if (err.message.includes('UNIQUE')) {
          console.log('Admin user already exists');
        } else {
          console.error('Error creating admin user:', err);
        }
      } else {
        console.log('Admin user created successfully');
        console.log('Login: admin');
        console.log('Password: admin123');
        console.log('ВАЖНО: Смените пароль после первого входа!');
      }
      db.close();
    }
  );
}

createAdminUser();
