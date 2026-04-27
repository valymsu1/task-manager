import React, { useState, useEffect } from 'react';
import { api } from '../api';

function Clients({ user }) {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingClient, setEditingClient] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
  });

  useEffect(() => {
    loadClients();
  }, []);

  const loadClients = async () => {
    try {
      const data = await api.getClients();
      setClients(data);
    } catch (error) {
      console.error('Error loading clients:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingClient) {
        await api.updateClient(editingClient.id, formData);
      } else {
        await api.createClient(formData);
      }
      setShowModal(false);
      setEditingClient(null);
      resetForm();
      loadClients();
    } catch (error) {
      alert('Ошибка при сохранении клиента');
    }
  };

  const handleEdit = (client) => {
    setEditingClient(client);
    setFormData({
      name: client.name,
      description: client.description || '',
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Удалить клиента?')) {
      try {
        await api.deleteClient(id);
        loadClients();
      } catch (error) {
        alert('Ошибка при удалении клиента');
      }
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
    });
  };

  const canEdit = user.role === 'admin' || user.role === 'manager';

  if (loading) return <div className="loading">Загрузка...</div>;

  return (
    <div className="main-content">
      <div className="page-header">
        <h1>Клиенты</h1>
        {canEdit && (
          <button
            className="btn btn-primary"
            onClick={() => {
              resetForm();
              setEditingClient(null);
              setShowModal(true);
            }}
          >
            + Добавить клиента
          </button>
        )}
      </div>

      <div className="card">
        {clients.length === 0 ? (
          <div className="empty-state">
            <h3>Нет клиентов</h3>
            <p>Добавьте первого клиента</p>
          </div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Название</th>
                <th>Описание</th>
                <th>Дата создания</th>
                {canEdit && <th>Действия</th>}
              </tr>
            </thead>
            <tbody>
              {clients.map(client => (
                <tr key={client.id}>
                  <td><strong>{client.name}</strong></td>
                  <td>{client.description}</td>
                  <td>{new Date(client.created_at).toLocaleDateString('ru-RU')}</td>
                  {canEdit && (
                    <td>
                      <button
                        className="btn btn-secondary"
                        onClick={() => handleEdit(client)}
                        style={{ marginRight: '8px', padding: '6px 12px' }}
                      >
                        Изменить
                      </button>
                      {user.role === 'admin' && (
                        <button
                          className="btn btn-danger"
                          onClick={() => handleDelete(client.id)}
                          style={{ padding: '6px 12px' }}
                        >
                          Удалить
                        </button>
                      )}
                    </td>
                  )}
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
              <h2>{editingClient ? 'Редактировать клиента' : 'Добавить клиента'}</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Название *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
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
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                  Отмена
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingClient ? 'Сохранить' : 'Добавить'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Clients;
