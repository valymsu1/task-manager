const express = require('express');
const { getConnection } = require('../db-postgres');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// Get notifications for current user
router.get('/', authMiddleware, async (req, res) => {
  const { id } = req.user;

  try {
    const pool = getConnection();
    const result = await pool.query(
      `SELECT n.*, t.title as task_title
       FROM notifications n
       LEFT JOIN tasks t ON n.task_id = t.id
       WHERE n.user_id = $1
       ORDER BY n.created_at DESC
       LIMIT 50`,
      [id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Get notifications error:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

// Mark notification as read
router.put('/:id/read', authMiddleware, async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  try {
    const pool = getConnection();
    const result = await pool.query(
      'UPDATE notifications SET is_read = TRUE WHERE id = $1 AND user_id = $2',
      [id, userId]
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Notification not found' });
    }
    res.json({ message: 'Notification marked as read' });
  } catch (err) {
    console.error('Mark notification read error:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

// Mark all notifications as read
router.put('/read-all', authMiddleware, async (req, res) => {
  const userId = req.user.id;

  try {
    const pool = getConnection();
    await pool.query(
      'UPDATE notifications SET is_read = TRUE WHERE user_id = $1',
      [userId]
    );
    res.json({ message: 'All notifications marked as read' });
  } catch (err) {
    console.error('Mark all notifications read error:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

module.exports = router;
