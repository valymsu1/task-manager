const express = require('express');
const bcrypt = require('bcrypt');
const db = require('../database');
const { authMiddleware, roleMiddleware } = require('../middleware/auth');

const router = express.Router();

// Get all users (admin only)
router.get('/', authMiddleware, roleMiddleware('admin'), (req, res) => {
  db.all('SELECT id, login, role, email, full_name, created_at FROM users', [], (err, users) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(users);
  });
});

// Create user (admin only)
router.post('/', authMiddleware, roleMiddleware('admin'), async (req, res) => {
  const { login, password, role, email, full_name } = req.body;

  if (!login || !password || !role || !full_name) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const password_hash = await bcrypt.hash(password, 10);

  db.run(
    'INSERT INTO users (login, password_hash, role, email, full_name) VALUES (?, ?, ?, ?, ?)',
    [login, password_hash, role, email, full_name],
    function(err) {
      if (err) {
        if (err.message.includes('UNIQUE')) {
          return res.status(400).json({ error: 'Login already exists' });
        }
        return res.status(500).json({ error: 'Database error' });
      }
      res.status(201).json({ id: this.lastID, login, role, email, full_name });
    }
  );
});

// Update user (admin only)
router.put('/:id', authMiddleware, roleMiddleware('admin'), async (req, res) => {
  const { id } = req.params;
  const { login, password, role, email, full_name } = req.body;

  let query = 'UPDATE users SET ';
  const params = [];
  const updates = [];

  if (login) {
    updates.push('login = ?');
    params.push(login);
  }
  if (password) {
    const password_hash = await bcrypt.hash(password, 10);
    updates.push('password_hash = ?');
    params.push(password_hash);
  }
  if (role) {
    updates.push('role = ?');
    params.push(role);
  }
  if (email !== undefined) {
    updates.push('email = ?');
    params.push(email);
  }
  if (full_name) {
    updates.push('full_name = ?');
    params.push(full_name);
  }

  if (updates.length === 0) {
    return res.status(400).json({ error: 'No fields to update' });
  }

  query += updates.join(', ') + ' WHERE id = ?';
  params.push(id);

  db.run(query, params, function(err) {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({ message: 'User updated successfully' });
  });
});

// Delete user (admin only)
router.delete('/:id', authMiddleware, roleMiddleware('admin'), (req, res) => {
  const { id } = req.params;

  db.run('DELETE FROM users WHERE id = ?', [id], function(err) {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({ message: 'User deleted successfully' });
  });
});

module.exports = router;
