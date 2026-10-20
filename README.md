# Asteroid Dates Backend — лабораторные 3–4

NestJS + TypeORM + PostgreSQL, сессии в Redis, Swagger/OpenAPI. Предметная «услуга» — карточка даты сближения астероида с Землёй.

## Запуск

Требуются Node.js 24+, Docker Desktop и Docker Compose. Запустите Docker Desktop, затем из корня проекта:

```bash
npm ci
cp .env.example .env
npm run infra:up
npm run start:dev
```

В `.env` задайте `SESSION_SECRET` — случайную строку не короче 32 символов. Сервер автоматически читает этот файл. Можно сгенерировать секрет командой `node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"`.

- Swagger: <http://localhost:3000/swagger>
- OpenAPI JSON: <http://localhost:3000/swagger-json>
- HTML-каталог: <http://localhost:3000/dates>
- PostgreSQL: `localhost:5455`, база `asteroids_lab2`, пользователь/пароль `asteroids`.
- Redis: `localhost:6379`.

Если нужны только БД и сессии: `docker compose up -d --wait postgres redis`. Картинки и видео по умолчанию сохраняются локально в `public/uploads/dates`; для MinIO задайте `DATE_MEDIA_STORAGE=minio` и запустите соответствующие сервисы Compose. Файлы загрузок и `.env` исключены из Git.

## Отдельный запуск ЛР3

Для требований третьей лабораторной используйте `npm run start:lab3` и коллекцию `postman/LR3_Asteroid_Dates.postman_collection.json`. Адрес — `http://localhost:3003`, отдельная база — `asteroids_lab3`, файлы — в MinIO, пользователь фиксирован, вход/выход — заглушки. Полный список десяти методов и порядок проверки: [ЛР3](docs/lab3-api.md). Команды `npm start` и `npm run start:dev` по-прежнему запускают ЛР4 с настоящими Redis-сессиями.

## Вход в Swagger и Postman

1. Откройте Swagger в приватном окне браузера.
2. Один раз выполните `POST /api/users/register`: `fullName`, `email`, `password` (8–128 символов).
3. Выполните `POST /api/users/auth` с теми же `email` и `password`. Ожидается `200` и cookie `asteroids.sid`.
4. Выполните `GET /api/dates` и `GET /api/dates/draft`. Swagger отправит cookie автоматически. Поле Authorize вручную заполнять не нужно: браузер управляет заголовком Cookie.
5. DevTools → Application/Storage → Cookies → `http://localhost:3000`: скопируйте полное значение `asteroids.sid`.
6. Импортируйте `postman/LR4_Asteroid_Dates.postman_collection.json`. В переменную коллекции `sessionCookie` вставьте `asteroids.sid=<скопированное значение>` без `Path`, `HttpOnly` и других атрибутов. Либо выполните вход из самой коллекции: тест автоматически сохранит cookie.

Используйте один hostname для Swagger и API: cookie для `localhost` не отправляется на `127.0.0.1`. SPA должна выполнять `fetch(url, { credentials: 'include' })`; допустимые адреса задаются `CORS_ORIGINS`.

Старые пользователи ЛР3 без пароля не могут войти. Можно зарегистрировать нового наблюдателя. Чтобы один раз установить пароль существующему демонстрационному аккаунту `daria@example.com`, задайте `DEMO_PASSWORD` в `.env` и перезапустите сервер; уже установленный пароль не перезаписывается. Затем удалите эту переменную из `.env`.

## Доступ к API

Ровно **10 методов: 3 GET, 5 POST, 1 PUT, 1 DELETE**. Набор маршрутов одинаков по количеству, но коллекции Postman ЛР3 и ЛР4 используют разные серверы и разную аутентификацию. Первая/следующая карточка ленты — варианты одного GET с параметрами `id` и `next`; установка/снятие лайка — варианты одного POST с `like: 1` или `like: 0`. Для проверки гостя повторяйте тот же запрос без заголовка Cookie. Данные текущего пользователя возвращаются при входе.

| Метод | URL | Доступ и назначение |
| --- | --- | --- |
| GET | `/api/dates?maxMonth=7` | Всем: опубликованные карточки, месяц ≤ `maxMonth` (1–12) |
| GET | `/api/dates/feed` | Всем: первая опубликованная карточка |
| GET | `/api/dates/feed?id=2&next=true` | Всем: следующая по id, с переходом к началу |
| POST | `/api/users/register` | Всем: регистрация, без автоматического входа |
| POST | `/api/users/auth` | Всем: проверка пароля, создание Redis-сессии |
| POST | `/api/users/logout` | Сессия: удаление сессии и cookie |
| GET | `/api/dates/draft` | Сессия: только собственный черновик или `data: null` |
| POST | `/api/dates` | Сессия: создать/обновить собственный черновик; `multipart/form-data` с `designation`, необязательными `image`, `video` |
| PUT | `/api/dates/publish` | Сессия: публикация собственного черновика |
| POST | `/api/dates/:id/like` | Сессия: `like: 1` поставить, `like: 0` снять |
| DELETE | `/api/dates/:id` | Сессия: логическое удаление собственной карточки |

Без входа закрытые методы возвращают **401**; вход не предоставляет доступ к чужим черновикам и удалению чужих карточек (**404**, чтобы не раскрывать их наличие). Регистрация и вход — публичные исключения, необходимые для получения сессии. Неверная/отсутствующая cookie не мешает публичному чтению.

Пример тела `PUT /api/dates/publish`:

```json
{
  "shortDescription": "Астероид пройдёт рядом с Землёй 18 октября.",
  "approachMonth": 10,
  "approachDay": 18,
  "minimumDistanceAu": 0.023
}
```

Публикация устанавливает `status: "published"` и `formedAt`; эти поля, `creatorId`, `createdAt` и `id` возвращаются в ответе, но не принимаются для изменения. Автор определяется из сессии. `isCreator` и `isLiked` вычисляются для текущего запроса, у гостя равны `0`. Пароли и хеши не возвращаются.

## Redis

Cookie содержит подписанный случайный идентификатор, данные пользователя находятся только в Redis, ключ `asteroids:sess:<session-id>`. Срок по умолчанию 86400 секунд, задаётся `SESSION_TTL_SECONDS`. Выход удаляет ключ, повторный вход меняет идентификатор, истёкшая/подделанная cookie не даёт доступа. Пароль хранится в PostgreSQL как scrypt-хеш с индивидуальной солью.

```bash
docker compose exec redis redis-cli PING
docker compose exec redis redis-cli --scan --pattern 'asteroids:sess:*'
# Подставьте ключ из предыдущей команды:
docker compose exec redis redis-cli GET 'asteroids:sess:<session-id>'
docker compose exec redis redis-cli TTL 'asteroids:sess:<session-id>'
# Все активные сессии с id, email, именем пользователя и TTL:
npm run redis:sessions
```

`SESSION_SECRET` обязателен в production. Cookie имеет `HttpOnly`, `SameSite=Lax`, а в production также `Secure`; для production нужен HTTPS, за доверенным reverse proxy — `TRUST_PROXY=true`. Текущая лабораторная схема обновляется через TypeORM `synchronize`; при использовании управляемых миграций отключите её через `DB_SYNCHRONIZE=false`.

## Проверки и материалы

```bash
npm test
# С запущенными PostgreSQL и Redis:
npm run test:e2e
```

Интеграционные тесты создают и удаляют отдельную временную PostgreSQL-базу, проверяют реальные HTTP-запросы и Redis. Основные данные приложения не очищаются.

- [Техническое задание](docs/lab4-technical-specification.md).
- [Диаграммы и пояснение signature](docs/lab4-diagrams.md).
- [Проект StarUML: классы + Sequence](docs/asteroid-dates-lab4.mdj).
- [Коллекция Postman ЛР4](postman/LR4_Asteroid_Dates.postman_collection.json).
- [Краткие ответы на контрольные вопросы](docs/lab4-defense.md).

Использованы [методические указания по Redis](https://github.com/iu5git/Web/blob/main/tutorials/redis/README.md), официальная [документация NestJS по сессиям](https://docs.nestjs.com/techniques/session), [Swagger cookie authentication](https://docs.nestjs.com/openapi/security) и [connect-redis](https://github.com/tj/connect-redis).
