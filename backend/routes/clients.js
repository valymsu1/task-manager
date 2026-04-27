const express = require('express');
const db = require('../database');
const { authMiddleware, roleMiddleware } = require('../middleware/auth');

const router = express.Router();

// Get all clients
router.get('/', authMiddleware, (req, res) => {
  db.all('SELECT * FROM clients ORDER BY name', [], (err, clients) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(clients);
  });
});

// Create client (admin, manager)
router.post('/', authMiddleware, roleMiddleware('admin', 'manager'), (req, res) => {
  const { name, description } = req.body;

  if (!name) {
    return res.status(400).json({ error: 'Name is required' });
  }

  db.run(
    'INSERT INTO clients (name, description) VALUES (?, ?)',
    [name, description],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      res.status(201).json({ id: this.lastID, name, description });
    }
  );
});

// Update client (admin, manager)
router.put('/:id', authMiddleware, roleMiddleware('admin', 'manager'), (req, res) => {
  const { id } = req.params;
  const { name, description } = req.body;

  db.run(
    'UPDATE clients SET name = ?, description = ? WHERE id = ?',
    [name, description, id],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Client not found' });
      }
      res.json({ message: 'Client updated successfully' });
    }
  );
});

// Delete client (admin only)
router.delete('/:id', authMiddleware, roleMiddleware('admin'), (req, res) => {
  const { id } = req.params;

  db.run('DELETE FROM clients WHERE id = ?', [id], function(err) {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Client not found' });
    }
    res.json({ message: 'Client deleted successfully' });
  });
});

module.exports = router;
