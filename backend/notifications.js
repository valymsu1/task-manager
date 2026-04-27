const nodemailer = require('nodemailer');
const db = require('./database');

// Создаем транспорт для отправки email
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
};

// Отправка email уведомления
const sendEmail = async (to, subject, html) => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.log('Email not configured, skipping email notification');
    return;
  }

  try {
    const transporter = createTransporter();
    await transporter.sendMail({
      from: `"Task Manager" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
    });
    console.log(`Email sent to ${to}`);
  } catch (error) {
    console.error('Error sending email:', error);
  }
};

// Создание уведомления в БД
const createNotification = (userId, taskId, message) => {
  return new Promise((resolve, reject) => {
    db.run(
      'INSERT INTO notifications (user_id, task_id, message) VALUES (?, ?, ?)',
      [userId, taskId, message],
      function(err) {
        if (err) reject(err);
        else resolve(this.lastID);
      }
    );
  });
};

// Уведомление о новой задаче
const notifyNewTask = async (task, assignee) => {
  const message = `Вам назначена новая задача: ${task.title}`;

  // Создаем уведомление в системе
  await createNotification(assignee.id, task.id, message);

  // Отправляем email если указан
  if (assignee.email) {
    const html = `
      <h2>Новая задача</h2>
      <p>Вам назначена новая задача:</p>
      <h3>${task.title}</h3>
      <p><strong>Описание:</strong> ${task.description || 'Не указано'}</p>
      <p><strong>Дедлайн:</strong> ${new Date(task.deadline).toLocaleDateString('ru-RU')}</p>
      <p><strong>Трудоемкость:</strong> ${task.hours} часов</p>
      <p><strong>Руководитель:</strong> ${task.manager_name}</p>
      <br>
      <p>Войдите в систему для просмотра деталей.</p>
    `;
    await sendEmail(assignee.email, 'Новая задача', html);
  }
};

// Уведомление о приближающемся дедлайне
const notifyUpcomingDeadline = async (task, user, daysLeft) => {
  const message = `Дедлайн задачи "${task.title}" через ${daysLeft} дн.`;

  await createNotification(user.id, task.id, message);

  if (user.email) {
    const html = `
      <h2>Напоминание о дедлайне</h2>
      <p>Дедлайн задачи приближается!</p>
      <h3>${task.title}</h3>
      <p><strong>Дедлайн:</strong> ${new Date(task.deadline).toLocaleDateString('ru-RU')}</p>
      <p><strong>Осталось дней:</strong> ${daysLeft}</p>
      <p><strong>Статус:</strong> ${task.status === 'pending' ? 'В ожидании' : task.status === 'in_progress' ? 'В работе' : 'Завершена'}</p>
      <br>
      <p>Пожалуйста, завершите задачу вовремя.</p>
    `;
    await sendEmail(user.email, `Дедлайн через ${daysLeft} дн.: ${task.title}`, html);
  }
};

// Уведомление об изменении статуса
const notifyStatusChange = async (task, manager, newStatus) => {
  const statusText = {
    pending: 'В ожидании',
    in_progress: 'В работе',
    completed: 'Завершена',
    cancelled: 'Отменена'
  };

  const message = `Статус задачи "${task.title}" изменен на: ${statusText[newStatus]}`;

  await createNotification(manager.id, task.id, message);

  if (manager.email) {
    const html = `
      <h2>Изменение статуса задачи</h2>
      <h3>${task.title}</h3>
      <p><strong>Новый статус:</strong> ${statusText[newStatus]}</p>
      <p><strong>Исполнитель:</strong> ${task.assignee_name}</p>
      <br>
      <p>Войдите в систему для просмотра деталей.</p>
    `;
    await sendEmail(manager.email, `Изменение статуса: ${task.title}`, html);
  }
};

// Проверка приближающихся дедлайнов
const checkUpcomingDeadlines = async () => {
  const now = new Date();
  const threeDaysLater = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
  const sevenDaysLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  // Получаем задачи с дедлайном в ближайшие 3 и 7 дней
  db.all(
    `SELECT t.*, u.email, u.full_name
     FROM tasks t
     LEFT JOIN users u ON t.assignee_id = u.id
     WHERE t.status IN ('pending', 'in_progress')
     AND t.deadline BETWEEN ? AND ?`,
    [now.toISOString(), sevenDaysLater.toISOString()],
    async (err, tasks) => {
      if (err) {
        console.error('Error checking deadlines:', err);
        return;
      }

      for (const task of tasks) {
        const deadline = new Date(task.deadline);
        const daysLeft = Math.ceil((deadline - now) / (1000 * 60 * 60 * 24));

        // Уведомляем за 7, 3 и 1 день
        if (daysLeft === 7 || daysLeft === 3 || daysLeft === 1) {
          const user = {
            id: task.assignee_id,
            email: task.email,
            full_name: task.full_name
          };
          await notifyUpcomingDeadline(task, user, daysLeft);
        }
      }
    }
  );
};

module.exports = {
  sendEmail,
  createNotification,
  notifyNewTask,
  notifyUpcomingDeadline,
  notifyStatusChange,
  checkUpcomingDeadlines,
};
