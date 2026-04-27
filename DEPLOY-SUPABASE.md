# Деплой на Netlify + Supabase

Пошаговая инструкция по размещению системы управления задачами на бесплатном хостинге.

## Шаг 1: Подготовка репозитория

1. Создайте аккаунт на GitHub (если нет)
2. Создайте новый репозиторий `task-manager`
3. Загрузите проект:

```bash
cd C:\Scripts\task-manager
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/ваш-username/task-manager.git
git push -u origin main
```

## Шаг 2: Настройка Supabase (База данных PostgreSQL)

1. Зарегистрируйтесь на https://supabase.com
2. Создайте новый проект:
   - Нажмите "New project"
   - Название: `task-manager`
   - Database Password: придумайте надежный пароль (сохраните его!)
   - Регион: выберите ближайший
   - Plan: Free (500MB, неограниченный API)

3. Создайте схему базы данных:
   - Откройте "SQL Editor" в левом меню
   - Нажмите "New query"
   - Скопируйте содержимое файла `backend/schema-postgres.sql`
   - Вставьте и нажмите "Run"

4. Получите строку подключения:
   - Перейдите в "Settings" → "Database"
   - Найдите "Connection string" → выберите "URI"
   - Скопируйте строку (формат: `postgresql://postgres:[password]@[host]:5432/postgres`)
   - Замените `[password]` на ваш пароль из шага 2

5. Инициализируйте админа:
   - Создайте файл `.env` локально:
   ```
   DATABASE_URL=postgresql://postgres:ваш-пароль@db.xxx.supabase.co:5432/postgres
   ```
   - Установите зависимости: `npm install pg`
   - Запустите: `node backend/init-admin-postgres.js`

## Шаг 3: Настройка Netlify (Хостинг)

1. Зарегистрируйтесь на https://netlify.com
2. Нажмите "Add new site" → "Import an existing project"
3. Выберите GitHub и авторизуйтесь
4. Выберите репозиторий `task-manager`
5. Настройки сборки:
   - Build command: `cd frontend && npm install && npm run build`
   - Publish directory: `frontend/build`
   - Functions directory: `backend`

6. Добавьте переменные окружения:
   - Перейдите в "Site settings" → "Environment variables"
   - Добавьте:
     ```
     DATABASE_URL=postgresql://postgres:ваш-пароль@db.xxx.supabase.co:5432/postgres
     JWT_SECRET=ваш-секретный-ключ-минимум-32-символа
     NODE_ENV=production
     ```
   
   Опционально (для email уведомлений):
     ```
     EMAIL_HOST=smtp.gmail.com
     EMAIL_PORT=587
     EMAIL_USER=ваш-email@gmail.com
     EMAIL_PASS=ваш-пароль-приложения
     ```

7. Нажмите "Deploy site"

## Шаг 4: Настройка Frontend

1. Обновите файл `frontend/.env`:
```
REACT_APP_API_URL=https://ваш-сайт.netlify.app/api
```

2. Закоммитьте изменения:
```bash
git add .
git commit -m "Update API URL"
git push
```

Netlify автоматически пересоберет сайт.

## Шаг 5: Проверка

1. Откройте ваш сайт: `https://ваш-сайт.netlify.app`
2. Войдите:
   - Логин: `admin`
   - Пароль: `admin123`
3. Смените пароль в настройках

## Настройка собственного домена (опционально)

1. В Netlify перейдите в "Domain settings"
2. Нажмите "Add custom domain"
3. Введите ваш домен (можно получить бесплатно на freenom.com)
4. Следуйте инструкциям по настройке DNS

## Бесплатные домены

- **Freenom**: .tk, .ml, .ga, .cf, .gq (бесплатно на 12 месяцев)
- **Netlify**: автоматический поддомен `ваш-сайт.netlify.app`

## Ограничения бесплатного плана

**Supabase Free:**
- 500MB хранилища базы данных
- 2GB трансфера данных/месяц
- Неограниченный API запросы
- Достаточно для ~500 пользователей

**Netlify Free:**
- 100GB трафика/месяц
- 300 минут сборки/месяц
- Неограниченные сайты
- Достаточно для ~10,000 посещений/месяц

## Обновление сайта

Просто делайте push в GitHub:
```bash
git add .
git commit -m "Ваши изменения"
git push
```

Netlify автоматически пересоберет и задеплоит сайт.

## Мониторинг

- **Netlify**: Dashboard показывает статистику посещений
- **Supabase**: Dashboard показывает использование базы данных и API

## Резервное копирование

Supabase автоматически делает бэкапы каждый день (хранятся 7 дней на Free плане).

Для ручного бэкапа:
1. Перейдите в "Database" → "Backups"
2. Нажмите "Create backup"

## Устранение проблем

**Ошибка подключения к БД:**
- Проверьте переменные окружения в Netlify
- Убедитесь, что DATABASE_URL правильный
- Проверьте, что пароль не содержит специальных символов (или они экранированы)

**Сайт не открывается:**
- Проверьте логи в Netlify: "Deploys" → последний деплой → "Deploy log"

**API не работает:**
- Проверьте Functions в Netlify: "Functions" → "server-netlify"
- Проверьте логи функции

## Поддержка

- Netlify: https://docs.netlify.com
- Supabase: https://supabase.com/docs
