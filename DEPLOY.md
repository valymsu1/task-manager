# Деплой на Netlify + PlanetScale

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

## Шаг 2: Настройка PlanetScale (База данных)

1. Зарегистрируйтесь на https://planetscale.com
2. Создайте новую базу данных:
   - Нажмите "Create database"
   - Название: `task-manager`
   - Регион: выберите ближайший
   - Plan: Free (5GB)

3. Создайте схему базы данных:
   - Откройте вкладку "Console"
   - Скопируйте содержимое файла `backend/schema.sql`
   - Вставьте и выполните

4. Создайте пароль для подключения:
   - Перейдите в "Settings" → "Passwords"
   - Нажмите "New password"
   - Название: `netlify`
   - Сохраните данные подключения:
     - Host
     - Username
     - Password
     - Database name

5. Инициализируйте админа:
   - Создайте файл `.env` локально:
   ```
   DB_HOST=ваш-хост.psdb.cloud
   DB_USER=ваш-username
   DB_PASSWORD=ваш-password
   DB_NAME=task-manager
   ```
   - Установите зависимости: `npm install mysql2`
   - Запустите: `node backend/init-admin-mysql.js`

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
     DB_HOST=ваш-хост.psdb.cloud
     DB_USER=ваш-username
     DB_PASSWORD=ваш-password
     DB_NAME=task-manager
     JWT_SECRET=ваш-секретный-ключ-минимум-32-символа
     EMAIL_HOST=smtp.gmail.com
     EMAIL_PORT=587
     EMAIL_USER=ваш-email@gmail.com
     EMAIL_PASS=ваш-пароль-приложения
     NODE_ENV=production
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

**PlanetScale Free:**
- 5GB хранилища
- 1 миллиард строк чтения/месяц
- 10 миллионов строк записи/месяц
- Достаточно для ~100 пользователей

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
- **PlanetScale**: Insights показывает использование базы данных

## Резервное копирование

PlanetScale автоматически делает бэкапы каждый день.

Для ручного бэкапа:
1. Перейдите в "Backups"
2. Нажмите "Create backup"

## Устранение проблем

**Ошибка подключения к БД:**
- Проверьте переменные окружения в Netlify
- Убедитесь, что IP не заблокирован в PlanetScale

**Сайт не открывается:**
- Проверьте логи в Netlify: "Deploys" → последний деплой → "Deploy log"

**API не работает:**
- Проверьте Functions в Netlify: "Functions" → "server-netlify"
- Проверьте логи функции

## Поддержка

- Netlify: https://docs.netlify.com
- PlanetScale: https://docs.planetscale.com
