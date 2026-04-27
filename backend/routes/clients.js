const express = require('express');
const { getConnection } = require('../db-postgres');

const router = express.Router();

// Get all clients
router.get('/', async (req, res) => {
  try {
    const pool = getConnection();
    const result = await pool.query('SELECT * FROM clients ORDER BY name');
    res.json(result.rows);
  } catch (err) {
    console.error('Get clients error:', err);
    res.status(500).json({ error: 'Database error', details: err.message });
  }
});

// Create client
router.post('/', async (req, res) => {
  const { name, description } = req.body;

  if (!name) {
    return res.status(400).json({ error: 'Name is required' });
  }

  try {
    const pool = getConnection();
    const result = await pool.query(
      'INSERT INTO clients (name, description) VALUES ($1, $2) RETURNING id',
      [name, description]
    );
    res.status(201).json({ id: result.rows[0].id, name, description });
  } catch (err) {
    console.error('Create client error:', err);
    res.status(500).json({ error: 'Database error', details: err.message });
  }
});

// Update client
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { name, description } = req.body;

  try {
    const pool = getConnection();
    const result = await pool.query(
      'UPDATE clients SET name = $1, description = $2 WHERE id = $3',
      [name, description, id]
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Client not found' });
    }
    res.json({ message: 'Client updated successfully' });
  } catch (err) {
    console.error('Update client error:', err);
    res.status(500).json({ error: 'Database error', details: err.message });
  }
});

// Delete client
router.delete('/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const pool = getConnection();
    const result = await pool.query('DELETE FROM clients WHERE id = $1', [id]);
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Client not found' });
    }
    res.json({ message: 'Client deleted successfully' });
  } catch (err) {
    console.error('Delete client error:', err);
    res.status(500).json({ error: 'Database error', details: err.message });
  }
});

module.exports = router;
