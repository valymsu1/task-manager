import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Tasks from './components/Tasks';
import Clients from './components/Clients';
import Users from './components/Users';
import './App.css';

function App() {
  // Временно: автоматический вход как admin
  const [user] = useState({
    id: 1,
    login: 'admin',
    role: 'admin',
    email: 'admin@example.com',
    full_name: 'Администратор'
  });
  const [loading] = useState(false);

  const handleLogout = () => {
    window.location.reload();
  };

  if (loading) {
    return <div className="loading">Загрузка...</div>;
  }

  return (
    <Router>
      <div className="app">
        <div className="dashboard">
          <Sidebar user={user} onLogout={handleLogout} />
          <Routes>
            <Route path="/" element={<Navigate to="/tasks" replace />} />
            <Route path="/tasks" element={<Tasks user={user} />} />
            <Route path="/clients" element={<Clients user={user} />} />
            {user.role === 'admin' && (
              <Route path="/users" element={<Users />} />
            )}
            <Route path="*" element={<Navigate to="/tasks" replace />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;
