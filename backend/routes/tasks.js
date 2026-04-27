const express = require('express');
const { getConnection } = require('../db-postgres');
const { authMiddleware, roleMiddleware } = require('../middleware/auth');
const { notifyNewTask, notifyStatusChange } = require('../notifications');

const router = express.Router();

// Get tasks (filtered by role)
router.get('/', authMiddleware, async (req, res) => {
  const { role, id } = req.user;
  let query = `
    SELECT
      t.*,
      c.name as client_name,
      u1.full_name as assignee_name,
      u2.full_name as manager_name
    FROM tasks t
    LEFT JOIN clients c ON t.client_id = c.id
    LEFT JOIN users u1 ON t.assignee_id = u1.id
    LEFT JOIN users u2 ON t.manager_id = u2.id
  `;

  const params = [];

  if (role === 'executor') {
    query += ' WHERE t.assignee_id = $1';
    params.push(id);
  } else if (role === 'manager') {
    query += ' WHERE t.manager_id = $1';
    params.push(id);
  }
  // admin and observer see all tasks

  query += ' ORDER BY t.deadline ASC';

  try {
    const pool = getConnection();
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error('Get tasks error:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

// Get single task
router.get('/:id', authMiddleware, async (req, res) => {
  const { id } = req.params;

  try {
    const pool = getConnection();
    const result = await pool.query(
      `SELECT
        t.*,
        c.name as client_name,
        u1.full_name as assignee_name,
        u2.full_name as manager_name
      FROM tasks t
      LEFT JOIN clients c ON t.client_id = c.id
      LEFT JOIN users u1 ON t.assignee_id = u1.id
      LEFT JOIN users u2 ON t.manager_id = u2.id
      WHERE t.id = $1`,
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Get task error:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

// Create task (admin, manager)
router.post('/', authMiddleware, roleMiddleware('admin', 'manager'), async (req, res) => {
  const { client_id, title, description, assignee_id, manager_id, deadline, hours } = req.body;

  if (!client_id || !title || !assignee_id || !manager_id || !deadline || !hours) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const pool = getConnection();
    const result = await pool.query(
      `INSERT INTO tasks (client_id, title, description, assignee_id, manager_id, deadline, hours)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
      [client_id, title, description, assignee_id, manager_id, deadline, hours]
    );

    const taskId = result.rows[0].id;

    // Get assignee info for notifications
    const assigneeResult = await pool.query('SELECT * FROM users WHERE id = $1', [assignee_id]);
    if (assigneeResult.rows.length > 0) {
      const assignee = assigneeResult.rows[0];
      const task = {
        id: taskId,
        title,
        description,
        deadline,
        hours,
        manager_name: req.user.full_name || 'Руководитель'
      };
      await notifyNewTask(task, assignee);
    }

    res.status(201).json({ id: taskId, message: 'Task created successfully' });
  } catch (err) {
    console.error('Create task error:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

// Update task
router.put('/:id', authMiddleware, async (req, res) => {
  const { id } = req.params;
  const { client_id, title, description, assignee_id, manager_id, deadline, hours, status } = req.body;
  const { role, id: userId } = req.user;

  try {
    const pool = getConnection();

    // Check permissions
    const taskResult = await pool.query('SELECT * FROM tasks WHERE id = $1', [id]);
    if (taskResult.rows.length === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }
    const task = taskResult.rows[0];

    // Executors can only update status of their own tasks
    if (role === 'executor' && task.assignee_id !== userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const updates = [];
    const params = [];
    let paramIndex = 1;

    if (role === 'executor') {
      // Executor can only update status
      if (status) {
        updates.push(`status = $${paramIndex++}`);
        params.push(status);
      }
    } else if (role === 'admin' || role === 'manager') {
      // Admin and manager can update everything
      if (client_id) {
        updates.push(`client_id = $${paramIndex++}`);
        params.push(client_id);
      }
      if (title) {
        updates.push(`title = $${paramIndex++}`);
        params.push(title);
      }
      if (description !== undefined) {
        updates.push(`description = $${paramIndex++}`);
        params.push(description);
      }
      if (assignee_id) {
        updates.push(`assignee_id = $${paramIndex++}`);
        params.push(assignee_id);
      }
      if (manager_id) {
        updates.push(`manager_id = $${paramIndex++}`);
        params.push(manager_id);
      }
      if (deadline) {
        updates.push(`deadline = $${paramIndex++}`);
        params.push(deadline);
      }
      if (hours) {
        updates.push(`hours = $${paramIndex++}`);
        params.push(hours);
      }
      if (status) {
        updates.push(`status = $${paramIndex++}`);
        params.push(status);
      }
    } else {
      return res.status(403).json({ error: 'Access denied' });
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    params.push(id);
    const query = `UPDATE tasks SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = $${paramIndex}`;

    const oldStatus = task.status;

    await pool.query(query, params);

    // Notify manager if executor changed status
    if (status && status !== oldStatus && role === 'executor') {
      const managerResult = await pool.query(
        'SELECT u.*, t.title FROM users u, tasks t WHERE u.id = t.manager_id AND t.id = $1',
        [id]
      );
      if (managerResult.rows.length > 0) {
        const manager = managerResult.rows[0];
        const taskData = {
          id,
          title: task.title,
          assignee_name: req.user.full_name || 'Исполнитель'
        };
        await notifyStatusChange(taskData, manager, status);
      }
    }

    res.json({ message: 'Task updated successfully' });
  } catch (err) {
    console.error('Update task error:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

// Delete task (admin, manager)
router.delete('/:id', authMiddleware, roleMiddleware('admin', 'manager'), async (req, res) => {
  const { id } = req.params;

  try {
    const pool = getConnection();
    const result = await pool.query('DELETE FROM tasks WHERE id = $1', [id]);
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }
    res.json({ message: 'Task deleted successfully' });
  } catch (err) {
    console.error('Delete task error:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

module.exports = router;
