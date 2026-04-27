import React from 'react';
import { useNavigate } from 'react-router-dom';
import Notifications from './Notifications';

function Sidebar({ user, onLogout }) {
  const navigate = useNavigate();

  const menuItems = [
    { path: '/tasks', label: 'Задачи', roles: ['admin', 'manager', 'executor', 'observer'] },
    { path: '/clients', label: 'Клиенты', roles: ['admin', 'manager', 'observer'] },
    { path: '/users', label: 'Пользователи', roles: ['admin'] },
  ];

  const visibleItems = menuItems.filter(item => item.roles.includes(user.role));

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <h2>Task Manager</h2>
        <div className="sidebar-user">
          <div className="user-name">{user.full_name}</div>
          <div className="user-role">
            {user.role === 'admin' && 'Администратор'}
            {user.role === 'manager' && 'Руководитель'}
            {user.role === 'executor' && 'Исполнитель'}
            {user.role === 'observer' && 'Наблюдатель'}
          </div>
        </div>
        <div style={{ marginTop: '16px' }}>
          <Notifications user={user} />
        </div>
      </div>
      <nav>
        <ul className="sidebar-nav">
          {visibleItems.map(item => (
            <li key={item.path}>
              <a
                href={item.path}
                onClick={(e) => {
                  e.preventDefault();
                  navigate(item.path);
                }}
                className={window.location.pathname === item.path ? 'active' : ''}
              >
                {item.label}
              </a>
            </li>
          ))}
        </ul>
      </nav>
      <div className="sidebar-footer">
        <button onClick={onLogout} className="btn btn-secondary" style={{ width: '100%' }}>
          Выйти
        </button>
      </div>
    </div>
  );
}

export default Sidebar;
