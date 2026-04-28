const express = require('express');
const bcrypt = require('bcrypt');
const { getSupabase } = require('../db-supabase');

const router = express.Router();

// Get all users
router.get('/', async (req, res) => {
  try {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('users')
      .select('id, login, role, email, full_name, created_at')
      .order('full_name');

    if (error) throw error;
    res.json(data);
  } catch (err) {
    console.error('Get users error:', err);
    res.status(500).json({ error: 'Database error', details: err.message });
  }
});

// Create user (admin only)
router.post('/', authMiddleware, roleMiddleware('admin'), async (req, res) => {
  const { login, password, role, email, full_name } = req.body;

  if (!login || !password || !role || !full_name) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const password_hash = await bcrypt.hash(password, 10);
    const pool = getConnection();
    const result = await pool.query(
      'INSERT INTO users (login, password_hash, role, email, full_name) VALUES ($1, $2, $3, $4, $5) RETURNING id',
      [login, password_hash, role, email, full_name]
    );
    res.status(201).json({ id: result.rows[0].id, login, role, email, full_name });
  } catch (err) {
    if (err.code === '23505') {
      return res.status(400).json({ error: 'Login already exists' });
    }
    console.error('Create user error:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

// Update user (admin only)
router.put('/:id', authMiddleware, roleMiddleware('admin'), async (req, res) => {
  const { id } = req.params;
  const { login, password, role, email, full_name } = req.body;

  const updates = [];
  const params = [];
  let paramIndex = 1;

  if (login) {
    updates.push(`login = $${paramIndex++}`);
    params.push(login);
  }
  if (password) {
    const password_hash = await bcrypt.hash(password, 10);
    updates.push(`password_hash = $${paramIndex++}`);
    params.push(password_hash);
  }
  if (role) {
    updates.push(`role = $${paramIndex++}`);
    params.push(role);
  }
  if (email !== undefined) {
    updates.push(`email = $${paramIndex++}`);
    params.push(email);
  }
  if (full_name) {
    updates.push(`full_name = $${paramIndex++}`);
    params.push(full_name);
  }

  if (updates.length === 0) {
    return res.status(400).json({ error: 'No fields to update' });
  }

  params.push(id);
  const query = `UPDATE users SET ${updates.join(', ')} WHERE id = $${paramIndex}`;

  try {
    const pool = getConnection();
    const result = await pool.query(query, params);
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({ message: 'User updated successfully' });
  } catch (err) {
    console.error('Update user error:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

// Delete user (admin only)
router.delete('/:id', authMiddleware, roleMiddleware('admin'), async (req, res) => {
  const { id } = req.params;

  try {
    const pool = getConnection();
    const result = await pool.query('DELETE FROM users WHERE id = $1', [id]);
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({ message: 'User deleted successfully' });
  } catch (err) {
    console.error('Delete user error:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

module.exports = router;
