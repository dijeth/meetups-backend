# Course Vue Backend

## Быстрый старт

##### Подготовка

```shell script
# Установка зависимостей
npm ci

# Сборка
npm run build
```

##### Запуск

```shell script
npm start
```

##### Разработка

```shell script
npm run start:dev
# or for attach debugger
npm run start:debug
```

## Конфигурирование

```dotenv
# .env

PORT=3000
HOST=127.0.0.1
SECRET=secret_key
PUBLIC_URL=http://localhost:3000

# Admin key is used to protect some maintenance features; remove or set empty to disable
# ADMIN_KEY=admin_key

# Database refresh interval in CRON pattern; remove or set empty to disable DB refresh
# DB_REFRESH_CRON=* 15 * * * *
```

## База Данных

Регенерация БД с тестовыми данными:

```shell script
npm run db:refresh
```

Тестовые данные описаны в `src/maintenance/seed-data.ts`.

## Документация API

http://localhost:3000/api

## Fast fix express-session

node_modules/express-session/index.js:230
https://github.com/expressjs/session/issues/837
