# Asteroid Dates Backend

Бэкенд лабораторной 3 для SPA про даты сближения астероидов с Землей. Все API-методы начинаются с `/api`, работают через NestJS + TypeORM + PostgreSQL, а удаленные записи клиенту не отдаются.

## Запуск

```bash
npm install
npm run infra:up
npm run start:dev
```

## Singleton пользователя

В лабораторной авторизация еще не реализуется, поэтому текущий пользователь зафиксирован в функции-singleton `getCurrentObserver()` из `src/services/current-observer.service.ts`. Все методы создания, публикации, удаления и лайков получают пользователя через эту функцию, а не из тела запроса.

## HTTP методы

| Метод | URL | Назначение | Тело/параметры |
| --- | --- | --- | --- |
| `GET` | `/api/dates?maxMonth=7` | Список опубликованных дат с фильтром по месяцу | `maxMonth` 1-12 |
| `GET` | `/api/dates/feed?id=2&next=true` | Лента: без `id` возвращает первую запись, с `id` и `next=true` возвращает следующую; id могут идти с пропусками | `id`, `next=true` |
| `GET` | `/api/dates/draft` | Черновик текущего пользователя, не больше одной записи | нет |
| `POST` | `/api/dates` | Создать или обновить черновик с файлами | `multipart/form-data`: `designation`, `image`, `video` |
| `PUT` | `/api/dates/publish` | Опубликовать текущий черновик | `shortDescription`, `approachMonth`, `approachDay`, `minimumDistanceAu` |
| `POST` | `/api/dates/:id/like` | Поставить или снять лайк текущего пользователя | `like`: `1` поставить, `0` снять |
| `DELETE` | `/api/dates/:id` | Soft delete только своей записи | нет |
| `POST` | `/api/users/register` | Регистрация пользователя | `fullName`, `email` |
| `POST` | `/api/users/auth` | Заглушка аутентификации для 4 лабораторной | `email` |
| `POST` | `/api/users/logout` | Заглушка деавторизации для 4 лабораторной | нет |

Системные поля `id`, `status`, `creatorId`, `createdAt`, `formedAt` не принимаются от клиента для изменения. Они рассчитываются на бэкенде. Карточки в JSON возвращают `id`, `designation`, `shortDescription`, `imageUrl`, `videoUrl`, `approachMonth`, `approachDay`, `minimumDistanceAu`, `likesCount`, `isCreator`, `isLiked`.

## Проверка в Postman/Insomnia

1. `GET /api/dates?maxMonth=7`
2. `POST /api/dates` с `designation`, `image`, `video`
3. `GET /api/dates/draft`
4. `PUT /api/dates/publish`
5. `GET /api/dates/feed`
6. `GET /api/dates/feed?id=2&next=true`
7. `POST /api/dates/2/like` с `{ "like": 1 }`
8. `POST /api/dates/2/like` с `{ "like": 0 }`
9. `DELETE /api/dates/:id` для своей опубликованной записи
10. `POST /api/users/register`
