# Настройка Email уведомлений

## Для Gmail

1. Включите двухфакторную аутентификацию в вашем Google аккаунте
2. Создайте пароль приложения:
   - Перейдите в https://myaccount.google.com/apppasswords
   - Выберите "Почта" и "Другое устройство"
   - Скопируйте сгенерированный пароль

3. Создайте файл `.env` в папке `backend`:
```
PORT=3001
JWT_SECRET=your-secret-key-change-in-production
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password-here
```

## Для других почтовых сервисов

### Yandex
```
EMAIL_HOST=smtp.yandex.ru
EMAIL_PORT=465
EMAIL_USER=your-email@yandex.ru
EMAIL_PASS=your-password
```

### Mail.ru
```
EMAIL_HOST=smtp.mail.ru
EMAIL_PORT=465
EMAIL_USER=your-email@mail.ru
EMAIL_PASS=your-password
```

### Outlook/Hotmail
```
EMAIL_HOST=smtp-mail.outlook.com
EMAIL_PORT=587
EMAIL_USER=your-email@outlook.com
EMAIL_PASS=your-password
```

## Тестирование

После настройки email, перезапустите сервер:
```bash
cd backend
npm start
```

Уведомления будут отправляться:
- При создании новой задачи (исполнителю)
- При изменении статуса задачи (руководителю)
- За 7, 3 и 1 день до дедлайна (исполнителю)

## Проверка дедлайнов

Автоматическая проверка запускается каждый день в 9:00.

Для ручной проверки можно добавить endpoint в `server.js`:
```javascript
app.get('/api/check-deadlines', async (req, res) => {
  const { checkUpcomingDeadlines } = require('./notifications');
  await checkUpcomingDeadlines();
  res.json({ message: 'Deadline check completed' });
});
```

Затем вызвать: `curl http://localhost:3001/api/check-deadlines`
