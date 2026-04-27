# Быстрый старт - Деплой за 10 минут (Supabase + Netlify)

## 1. Supabase (3 минуты)

1. Регистрация: https://supabase.com
2. New project → Название: `task-manager` → Free plan
3. SQL Editor → New query → вставьте `backend/schema-postgres.sql` → Run
4. Settings → Database → Connection string → Copy (URI mode)

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
DATABASE_URL=postgresql://postgres:[password]@[host]:5432/postgres
JWT_SECRET=любая-длинная-строка-минимум-32-символа
NODE_ENV=production
```

Опционально (для email уведомлений):
```
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=ваш-email@gmail.com
EMAIL_PASS=ваш-пароль-приложения
```

## 4. Создание админа (1 минута)

Локально:
```bash
# Создайте .env с DATABASE_URL из Supabase
npm install pg
node backend/init-admin-postgres.js
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

**Полная инструкция:** см. `DEPLOY-SUPABASE.md`
