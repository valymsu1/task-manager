# Быстрый старт - Деплой за 10 минут

## 1. PlanetScale (2 минуты)

1. Регистрация: https://planetscale.com
2. Create database → `task-manager` → Free plan
3. Console → вставьте `backend/schema.sql` → Execute
4. Settings → Passwords → New password → Сохраните данные

## 2. Netlify (3 минуты)

1. Регистрация: https://netlify.com
2. New site → Import from Git → GitHub → выберите репозиторий
3. Build settings:
   - Build: `cd frontend && npm install && npm run build`
   - Publish: `frontend/build`
   - Functions: `backend`
4. Deploy

## 3. Переменные окружения (2 минуты)

Netlify → Site settings → Environment variables → Add:

```
DB_HOST=ваш-хост.psdb.cloud
DB_USER=ваш-username
DB_PASSWORD=ваш-password
DB_NAME=task-manager
JWT_SECRET=любая-длинная-строка-минимум-32-символа
NODE_ENV=production
```

## 4. Создание админа (2 минуты)

Локально:
```bash
# Создайте .env с данными PlanetScale
npm install mysql2
node backend/init-admin-mysql.js
```

## 5. Обновите API URL (1 минута)

`frontend/.env`:
```
REACT_APP_API_URL=https://ваш-сайт.netlify.app/api
```

Commit и push → Netlify автоматически пересоберет.

## Готово!

Откройте `https://ваш-сайт.netlify.app`
- Логин: `admin`
- Пароль: `admin123`

---

**Полная инструкция:** см. `DEPLOY.md`
