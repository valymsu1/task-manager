const express = require('express');
const db = require('../database');
const { authMiddleware, roleMiddleware } = require('../middleware/auth');
const { notifyNewTask, notifyStatusChange } = require('../notifications');

const router = express.Router();

// Get tasks (filtered by role)
router.get('/', authMiddleware, (req, res) => {
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
    query += ' WHERE t.assignee_id = ?';
    params.push(id);
  } else if (role === 'manager') {
    query += ' WHERE t.manager_id = ?';
    params.push(id);
  }
  // admin and observer see all tasks

  query += ' ORDER BY t.deadline ASC';

  db.all(query, params, (err, tasks) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(tasks);
  });
});

// Get single task
router.get('/:id', authMiddleware, (req, res) => {
  const { id } = req.params;

  db.get(
    `SELECT
      t.*,
      c.name as client_name,
      u1.full_name as assignee_name,
      u2.full_name as manager_name
    FROM tasks t
    LEFT JOIN clients c ON t.client_id = c.id
    LEFT JOIN users u1 ON t.assignee_id = u1.id
    LEFT JOIN users u2 ON t.manager_id = u2.id
    WHERE t.id = ?`,
    [id],
    (err, task) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      if (!task) {
        return res.status(404).json({ error: 'Task not found' });
      }
      res.json(task);
    }
  );
});

// Create task (admin, manager)
router.post('/', authMiddleware, roleMiddleware('admin', 'manager'), (req, res) => {
  const { client_id, title, description, assignee_id, manager_id, deadline, hours } = req.body;

  if (!client_id || !title || !assignee_id || !manager_id || !deadline || !hours) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  db.run(
    `INSERT INTO tasks (client_id, title, description, assignee_id, manager_id, deadline, hours)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [client_id, title, description, assignee_id, manager_id, deadline, hours],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      const taskId = this.lastID;

      // Get assignee and manager info for notifications
      db.get('SELECT * FROM users WHERE id = ?', [assignee_id], async (err, assignee) => {
        if (!err && assignee) {
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
      });

      res.status(201).json({ id: taskId, message: 'Task created successfully' });
    }
  );
});

// Update task
router.put('/:id', authMiddleware, (req, res) => {
  const { id } = req.params;
  const { client_id, title, description, assignee_id, manager_id, deadline, hours, status } = req.body;
  const { role, id: userId } = req.user;

  // Check permissions
  db.get('SELECT * FROM tasks WHERE id = ?', [id], (err, task) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    // Executors can only update status of their own tasks
    if (role === 'executor' && task.assignee_id !== userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    let query = 'UPDATE tasks SET updated_at = CURRENT_TIMESTAMP';
    const params = [];

    if (role === 'executor') {
      // Executor can only update status
      if (status) {
        query += ', status = ?';
        params.push(status);
      }
    } else if (role === 'admin' || role === 'manager') {
      // Admin and manager can update everything
      if (client_id) {
        query += ', client_id = ?';
        params.push(client_id);
      }
      if (title) {
        query += ', title = ?';
        params.push(title);
      }
      if (description !== undefined) {
        query += ', description = ?';
        params.push(description);
      }
      if (assignee_id) {
        query += ', assignee_id = ?';
        params.push(assignee_id);
      }
      if (manager_id) {
        query += ', manager_id = ?';
        params.push(manager_id);
      }
      if (deadline) {
        query += ', deadline = ?';
        params.push(deadline);
      }
      if (hours) {
        query += ', hours = ?';
        params.push(hours);
      }
      if (status) {
        query += ', status = ?';
        params.push(status);
      }
    } else {
      return res.status(403).json({ error: 'Access denied' });
    }

    query += ' WHERE id = ?';
    params.push(id);

    const oldStatus = task.status;

    db.run(query, params, function(err) {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      // Notify manager if executor changed status
      if (status && status !== oldStatus && role === 'executor') {
        db.get('SELECT u.*, t.title, t.assignee_id FROM users u, tasks t WHERE u.id = t.manager_id AND t.id = ?', [id], async (err, manager) => {
          if (!err && manager) {
            const taskData = {
              id,
              title: task.title,
              assignee_name: req.user.full_name || 'Исполнитель'
            };
            await notifyStatusChange(taskData, manager, status);
          }
        });
      }

      res.json({ message: 'Task updated successfully' });
    });
  });
});

// Delete task (admin, manager)
router.delete('/:id', authMiddleware, roleMiddleware('admin', 'manager'), (req, res) => {
  const { id } = req.params;

  db.run('DELETE FROM tasks WHERE id = ?', [id], function(err) {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }
    res.json({ message: 'Task deleted successfully' });
  });
});

module.exports = router;
