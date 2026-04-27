import React, { useState, useEffect } from 'react';
import { api } from '../api';

function Tasks({ user }) {
  const [tasks, setTasks] = useState([]);
  const [clients, setClients] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [formData, setFormData] = useState({
    client_id: '',
    title: '',
    description: '',
    assignee_id: '',
    manager_id: '',
    deadline: '',
    hours: '',
    status: 'pending',
  });

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadData = async () => {
    try {
      const [tasksData, clientsData, usersData] = await Promise.all([
        api.getTasks(),
        api.getClients(),
        user.role === 'admin' || user.role === 'manager' ? api.getUsers() : Promise.resolve([]),
      ]);
      setTasks(tasksData);
      setClients(clientsData);
      setUsers(usersData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingTask) {
        await api.updateTask(editingTask.id, formData);
      } else {
        await api.createTask(formData);
      }
      setShowModal(false);
      setEditingTask(null);
      resetForm();
      loadData();
    } catch (error) {
      alert('Ошибка при сохранении задачи');
    }
  };

  const handleEdit = (task) => {
    setEditingTask(task);
    setFormData({
      client_id: task.client_id,
      title: task.title,
      description: task.description || '',
      assignee_id: task.assignee_id,
      manager_id: task.manager_id,
      deadline: task.deadline.split('T')[0],
      hours: task.hours,
      status: task.status,
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Удалить задачу?')) {
      try {
        await api.deleteTask(id);
        loadData();
      } catch (error) {
        alert('Ошибка при удалении задачи');
      }
    }
  };

  const handleStatusChange = async (taskId, newStatus) => {
    try {
      await api.updateTask(taskId, { status: newStatus });
      loadData();
    } catch (error) {
      alert('Ошибка при изменении статуса');
    }
  };

  const resetForm = () => {
    setFormData({
      client_id: '',
      title: '',
      description: '',
      assignee_id: '',
      manager_id: user.id,
      deadline: '',
      hours: '',
      status: 'pending',
    });
  };

  const canEdit = user.role === 'admin' || user.role === 'manager';
  const canChangeStatus = user.role === 'executor' || canEdit;

  if (loading) return <div className="loading">Загрузка...</div>;

  return (
    <div className="main-content">
      <div className="page-header">
        <h1>Задачи</h1>
        {canEdit && (
          <button
            className="btn btn-primary"
            onClick={() => {
              resetForm();
              setEditingTask(null);
              setShowModal(true);
            }}
          >
            + Создать задачу
          </button>
        )}
      </div>

      <div className="card">
        {tasks.length === 0 ? (
          <div className="empty-state">
            <h3>Нет задач</h3>
            <p>Создайте первую задачу</p>
          </div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Клиент</th>
                <th>Задача</th>
                <th>Исполнитель</th>
                <th>Руководитель</th>
                <th>Дедлайн</th>
                <th>Часы</th>
                <th>Статус</th>
                <th>Действия</th>
              </tr>
            </thead>
            <tbody>
              {tasks.map(task => (
                <tr key={task.id}>
                  <td>{task.client_name}</td>
                  <td>
                    <strong>{task.title}</strong>
                    {task.description && <div style={{ fontSize: '12px', color: '#999' }}>{task.description}</div>}
                  </td>
                  <td>{task.assignee_name}</td>
                  <td>{task.manager_name}</td>
                  <td>{new Date(task.deadline).toLocaleDateString('ru-RU')}</td>
                  <td>{task.hours}ч</td>
                  <td>
                    {canChangeStatus ? (
                      <select
                        value={task.status}
                        onChange={(e) => handleStatusChange(task.id, e.target.value)}
                        className={`status-badge status-${task.status}`}
                        style={{ border: 'none', cursor: 'pointer' }}
                      >
                        <option value="pending">В ожидании</option>
                        <option value="in_progress">В работе</option>
                        <option value="completed">Завершена</option>
                        <option value="cancelled">Отменена</option>
                      </select>
                    ) : (
                      <span className={`status-badge status-${task.status}`}>
                        {task.status === 'pending' && 'В ожидании'}
                        {task.status === 'in_progress' && 'В работе'}
                        {task.status === 'completed' && 'Завершена'}
                        {task.status === 'cancelled' && 'Отменена'}
                      </span>
                    )}
                  </td>
                  <td>
                    {canEdit && (
                      <>
                        <button
                          className="btn btn-secondary"
                          onClick={() => handleEdit(task)}
                          style={{ marginRight: '8px', padding: '6px 12px' }}
                        >
                          Изменить
                        </button>
                        <button
                          className="btn btn-danger"
                          onClick={() => handleDelete(task.id)}
                          style={{ padding: '6px 12px' }}
                        >
                          Удалить
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingTask ? 'Редактировать задачу' : 'Создать задачу'}</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Клиент *</label>
                <select
                  value={formData.client_id}
                  onChange={(e) => setFormData({ ...formData, client_id: e.target.value })}
                  required
                >
                  <option value="">Выберите клиента</option>
                  {clients.map(client => (
                    <option key={client.id} value={client.id}>{client.name}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Название задачи *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Описание</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Исполнитель *</label>
                <select
                  value={formData.assignee_id}
                  onChange={(e) => setFormData({ ...formData, assignee_id: e.target.value })}
                  required
                >
                  <option value="">Выберите исполнителя</option>
                  {users.filter(u => u.role === 'executor' || u.role === 'manager').map(u => (
                    <option key={u.id} value={u.id}>{u.full_name}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Руководитель *</label>
                <select
                  value={formData.manager_id}
                  onChange={(e) => setFormData({ ...formData, manager_id: e.target.value })}
                  required
                >
                  <option value="">Выберите руководителя</option>
                  {users.filter(u => u.role === 'manager' || u.role === 'admin').map(u => (
                    <option key={u.id} value={u.id}>{u.full_name}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Дедлайн *</label>
                <input
                  type="date"
                  value={formData.deadline}
                  onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Трудоемкость (часы) *</label>
                <input
                  type="number"
                  step="0.5"
                  value={formData.hours}
                  onChange={(e) => setFormData({ ...formData, hours: e.target.value })}
                  required
                />
              </div>
              {editingTask && (
                <div className="form-group">
                  <label>Статус</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  >
                    <option value="pending">В ожидании</option>
                    <option value="in_progress">В работе</option>
                    <option value="completed">Завершена</option>
                    <option value="cancelled">Отменена</option>
                  </select>
                </div>
              )}
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                  Отмена
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingTask ? 'Сохранить' : 'Создать'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Tasks;
