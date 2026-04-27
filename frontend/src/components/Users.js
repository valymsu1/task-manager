import React, { useState, useEffect } from 'react';
import { api } from '../api';

function Users() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({
    login: '',
    password: '',
    role: 'executor',
    email: '',
    full_name: '',
  });

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const data = await api.getUsers();
      setUsers(data);
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingUser) {
        const updateData = { ...formData };
        if (!updateData.password) {
          delete updateData.password;
        }
        await api.updateUser(editingUser.id, updateData);
      } else {
        await api.createUser(formData);
      }
      setShowModal(false);
      setEditingUser(null);
      resetForm();
      loadUsers();
    } catch (error) {
      alert('Ошибка при сохранении пользователя');
    }
  };

  const handleEdit = (user) => {
    setEditingUser(user);
    setFormData({
      login: user.login,
      password: '',
      role: user.role,
      email: user.email || '',
      full_name: user.full_name,
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Удалить пользователя?')) {
      try {
        await api.deleteUser(id);
        loadUsers();
      } catch (error) {
        alert('Ошибка при удалении пользователя');
      }
    }
  };

  const resetForm = () => {
    setFormData({
      login: '',
      password: '',
      role: 'executor',
      email: '',
      full_name: '',
    });
  };

  if (loading) return <div className="loading">Загрузка...</div>;

  return (
    <div className="main-content">
      <div className="page-header">
        <h1>Пользователи</h1>
        <button
          className="btn btn-primary"
          onClick={() => {
            resetForm();
            setEditingUser(null);
            setShowModal(true);
          }}
        >
          + Добавить пользователя
        </button>
      </div>

      <div className="card">
        {users.length === 0 ? (
          <div className="empty-state">
            <h3>Нет пользователей</h3>
            <p>Добавьте первого пользователя</p>
          </div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>ФИО</th>
                <th>Логин</th>
                <th>Email</th>
                <th>Роль</th>
                <th>Дата создания</th>
                <th>Действия</th>
              </tr>
            </thead>
            <tbody>
              {users.map(user => (
                <tr key={user.id}>
                  <td><strong>{user.full_name}</strong></td>
                  <td>{user.login}</td>
                  <td>{user.email}</td>
                  <td>
                    {user.role === 'admin' && 'Администратор'}
                    {user.role === 'manager' && 'Руководитель'}
                    {user.role === 'executor' && 'Исполнитель'}
                    {user.role === 'observer' && 'Наблюдатель'}
                  </td>
                  <td>{new Date(user.created_at).toLocaleDateString('ru-RU')}</td>
                  <td>
                    <button
                      className="btn btn-secondary"
                      onClick={() => handleEdit(user)}
                      style={{ marginRight: '8px', padding: '6px 12px' }}
                    >
                      Изменить
                    </button>
                    <button
                      className="btn btn-danger"
                      onClick={() => handleDelete(user.id)}
                      style={{ padding: '6px 12px' }}
                    >
                      Удалить
                    </button>
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
              <h2>{editingUser ? 'Редактировать пользователя' : 'Добавить пользователя'}</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>ФИО *</label>
                <input
                  type="text"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Логин *</label>
                <input
                  type="text"
                  value={formData.login}
                  onChange={(e) => setFormData({ ...formData, login: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Пароль {editingUser ? '(оставьте пустым, чтобы не менять)' : '*'}</label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required={!editingUser}
                />
              </div>
              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Роль *</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  required
                >
                  <option value="admin">Администратор</option>
                  <option value="manager">Руководитель</option>
                  <option value="executor">Исполнитель</option>
                  <option value="observer">Наблюдатель</option>
                </select>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                  Отмена
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingUser ? 'Сохранить' : 'Добавить'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Users;
