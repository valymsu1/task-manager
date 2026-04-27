const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { getConnection } = require('../db-postgres');

const router = express.Router();

// Login
router.post('/login', async (req, res) => {
  const { login, password } = req.body;

  try {
    const pool = getConnection();
    const result = await pool.query('SELECT * FROM users WHERE login = $1', [login]);
    const user = result.rows[0];

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: user.id, login: user.login, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        login: user.login,
        role: user.role,
        email: user.email,
        full_name: user.full_name
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

module.exports = router;
