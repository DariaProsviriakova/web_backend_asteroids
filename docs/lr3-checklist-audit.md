# Проверка ЛР3 по чек-листу

## 1. Общий итог

Готовность: 96%
Critical: 0
Warnings: 3
Passed: 28

Проверка выполнена по `/api`-методам ЛР3. HTML-контроллеры `/dates...` оставлены как визуальная часть предыдущей лабораторной и не входят в подсчет REST API ЛР3, потому что по заданию все методы ЛР3 должны начинаться с `/api`.

## 2. HTTP методы

GET count: 3
Expected: 3
Result: PASS

| № | HTTP | URL | Контроллер | Что делает | PASS/FAIL |
|---|---|---|---|---|---|
| 1 | GET | `/api/dates?maxMonth=7` | `ApiDatesController.listPublishedDates`, `src/controllers/apiDatesController.ts:99` | список опубликованных дат с фильтром | PASS |
| 2 | GET | `/api/dates/feed?id=2&next=true` | `ApiDatesController.getFeedDate`, `src/controllers/apiDatesController.ts:114` | лента; без `id` первая запись, с `id` и `next=true` следующая | PASS |
| 3 | GET | `/api/dates/draft` | `ApiDatesController.getCurrentDraft`, `src/controllers/apiDatesController.ts:129` | черновик текущего пользователя | PASS |
| 4 | POST | `/api/dates` | `ApiDatesController.createDraft`, `src/controllers/apiDatesController.ts:138` | создать/обновить черновик с файлами | PASS |
| 5 | PUT | `/api/dates/publish` | `ApiDatesController.publishDraft`, `src/controllers/apiDatesController.ts:163` | публикация черновика | PASS |
| 6 | DELETE | `/api/dates/:id` | `ApiDatesController.deleteDate`, `src/controllers/apiDatesController.ts:191` | soft delete своей даты | PASS |
| 7 | POST | `/api/dates/:id/like` | `ApiDatesController.setLike`, `src/controllers/apiDatesController.ts:203` | поставить/снять лайк `0/1` | PASS |
| 8 | POST | `/api/users/register` | `ApiUsersController.register`, `src/controllers/apiUsersController.ts:35` | регистрация | PASS |
| 9 | POST | `/api/users/auth` | `ApiUsersController.authenticate`, `src/controllers/apiUsersController.ts:52` | заглушка аутентификации | PASS |
| 10 | POST | `/api/users/logout` | `ApiUsersController.logout`, `src/controllers/apiUsersController.ts:62` | заглушка деавторизации | PASS |

## 3. Критические ошибки

Critical FAIL не найдено.

Исправлено в ходе проверки:

- Было 11 `/api` методов и 4 GET из-за отдельного `GET /api/dates/feed/:id`. Исправлено на один `GET /api/dates/feed` с query-параметрами `id` и `next`.
- В JSON карточки были спорные системные поля `status`, `createdAt`, `formedAt`; они убраны из сериализатора.
- Поле количества лайков переименовано из `likes` в `likesCount`, чтобы не путать с флагом `isLiked`.

## 4. Замечания преподавателя, которые относятся к проекту

| Пункт | Результат | Код | Пояснение |
|---|---|---|---|
| Ровно 10 методов | PASS | `src/controllers/apiDatesController.ts:99`, `src/controllers/apiUsersController.ts:35` | В `/api` ровно 10 endpoint'ов. |
| Ровно 3 GET | PASS | `src/controllers/apiDatesController.ts:99`, `src/controllers/apiDatesController.ts:114`, `src/controllers/apiDatesController.ts:129` | Лишний feed-by-id GET объединен с `/api/dates/feed`. |
| Лента | PASS | `src/controllers/apiDatesController.ts:114`, `src/services/dates.service.ts:63` | Возвращает массив `data` с карточкой ленты; `next` ищется через БД. |
| Поле 0/1 лайка | PASS | `src/serializers/date.serializer.ts:19`, `src/services/dates.service.ts:199` | `isLiked` показывает лайк текущего пользователя, не количество. |
| Второй 0/1 признак | PASS | `src/serializers/date.serializer.ts:18` | `isCreator` показывает принадлежность карточки текущему пользователю. |
| INSERT лайка | PASS | `src/services/dates.service.ts:169` | Создается запись `observer_date_likes`. |
| DELETE unlike | PASS | `src/services/dates.service.ts:178` | Удаляется найденная запись лайка. |
| Защита от дублей | PASS | `src/entities/observer-date-like.entity.ts:15`, `src/services/dates.service.ts:165` | Есть unique constraint и проверка существующего лайка. |
| Подсчет лайков | PASS | `src/services/dates.service.ts:193` | Считается по relation `date.likes`; поле называется `likesCount`. |
| Текущий пользователь | WARNING | `src/services/current-observer.service.ts:7` | Пользователь зафиксирован singleton-константой, это прямо разрешено ЛР3. |
| Лишние поля JSON | PASS | `src/serializers/date.serializer.ts:8` | Карточка не возвращает `status`, `createdAt`, `formedAt`, `message`, `hasNext`. |
| HTTP semantics | PASS | `src/controllers/apiDatesController.ts:99` | GET получает, POST создает/действует, PUT публикует, DELETE удаляет. |
| Далее/create | PASS | `src/controllers/apiDatesController.ts:138` | Первый этап принимает только `designation`, `image`, `video`. |
| Опубликовать | PASS | `src/controllers/apiDatesController.ts:163`, `src/services/dates.service.ts:128` | Публикуется существующий черновик, новый объект не создается. |
| Файлы | PASS | `src/controllers/apiDatesController.ts:138` | Файлы принимает только create, publish файлы не принимает. |
| Статусы | PASS | `src/entities/asteroid-date.entity.ts:18`, `src/services/dates.service.ts:115` | `draft -> published -> deleted`; удаленные не выбираются из ленты. |
| Logical delete | PASS | `src/services/dates.service.ts:145` | Используется `UPDATE ... SET status = deleted`, строка не удаляется физически. |
| ORM | PASS | `src/services/dates.service.ts:35`, `src/services/dates.service.ts:145` | Используются Repository/QueryBuilder TypeORM. |
| Raw SQL injection | PASS | `src/services/dates.service.ts:39`, `src/services/dates.service.ts:150` | Raw SQL нет; QueryBuilder параметры передаются отдельно. |
| M:N лайки | PASS | `src/entities/observer-date-like.entity.ts:14` | Таблица `observer_date_likes`: `observer_id`, `asteroid_date_id`, unique. |
| Entity/model | PASS | `src/entities/asteroid-date.entity.ts:25`, `src/entities/observer.entity.ts:7`, `src/entities/observer-date-like.entity.ts:14` | Все таблицы описаны entity. |
| Controller vs Service | PASS | `src/controllers/apiDatesController.ts:147`, `src/services/dates.service.ts:98` | Контроллер читает запрос, сервис содержит бизнес-логику/БД. |
| Клиентский JS | PASS | `templates/date-add.html:6`, `templates/date-feed.html:26` | `<script>`, frontend fetch/ajax не найдены. |
| HTML формы | PASS | `templates/date-add.html:6`, `templates/date-add.html:35`, `templates/partials/date-card.html:14` | Формы соответствуют HTML-контроллерам и визуал не менялся. |
| Следующий | PASS | `src/services/dates.service.ts:73` | Не `id + 1`; выбор через БД с учетом `status='published'`. |
| README | PASS | `README.md:25` | Описаны 10 методов, таблицы, singleton, поля ответа. |
| Код соответствует README | PASS | `README.md:29`, `src/controllers/apiDatesController.ts:99` | URL и методы синхронизированы после правок. |
| HTTPS/TLS | PASS | `README.md:142` | Есть краткое объяснение HTTPS, TLS, OSI. |
| Minio | WARNING | `src/services/date-media-storage.service.ts:45` | По умолчанию локальное хранение, Minio включается через `DATE_MEDIA_STORAGE=minio`; это соответствует последнему требованию "по умолчанию не Minio", но преподаватель может спросить. |
| Старые HTML endpoint'ы | WARNING | `src/app.module.ts:36` | В проекте остаются `/dates...` страницы для визуала. При подсчете ЛР3 считать только `/api`. |

## 5. JSON-ответы

| Метод | URL | Что возвращает | Лишние поля | Не хватает полей | PASS/FAIL |
|---|---|---|---|---|---|
| GET | `/api/dates` | `{ "data": [{ "id": 1, "designation": "...", "shortDescription": "...", "imageUrl": "...", "videoUrl": "...", "approachMonth": 5, "approachDay": 12, "minimumDistanceAu": 0.023, "likesCount": 5, "isCreator": 0, "isLiked": 1 }] }` | нет | нет | PASS |
| GET | `/api/dates/feed` | `{ "data": [{ ...карточка ленты... }] }` | нет | нет | PASS |
| GET | `/api/dates/draft` | `{ "data": null }` или `{ "data": { ...черновик... } }` | нет | нет | PASS |
| POST | `/api/dates` | `{ "data": { ...черновик... } }` | нет | нет | PASS |
| PUT | `/api/dates/publish` | `{ "data": { ...опубликованная карточка... } }` | нет | нет | PASS |
| DELETE | `/api/dates/:id` | `{ "data": { "id": 7, "isDeleted": 1 } }` | нет | нет | PASS |
| POST | `/api/dates/:id/like` | `{ "data": { "like": 1, "date": { ...карточка... } } }` | нет | нет | PASS |
| POST | `/api/users/register` | `{ "data": { "id": 141, "fullName": "...", "email": "..." } }` | нет | нет | PASS |
| POST | `/api/users/auth` | `{ "data": { "authenticated": 1, "email": "..." } }` | нет | нет | PASS |
| POST | `/api/users/logout` | `{ "data": { "authenticated": 0 } }` | нет | нет | PASS |

## 6. ORM и SQL по методам

| Метод | Реализация БД | Код |
|---|---|---|
| GET `/api/dates` | TypeORM QueryBuilder | `src/services/dates.service.ts:35` |
| GET `/api/dates/feed` | TypeORM QueryBuilder с `CASE WHEN date.id > :id` | `src/services/dates.service.ts:63` |
| GET `/api/dates/draft` | TypeORM Repository `findOne` | `src/services/dates.service.ts:91` |
| POST `/api/dates` | Repository `findOne` + `save/create` | `src/services/dates.service.ts:98` |
| PUT `/api/dates/publish` | Repository `findOne` + `save` | `src/services/dates.service.ts:128` |
| DELETE `/api/dates/:id` | QueryBuilder `update` | `src/services/dates.service.ts:145` |
| POST `/api/dates/:id/like` | Repository `findOne`, `save`, `delete` | `src/services/dates.service.ts:158` |
| POST `/api/users/register` | Repository `findOne`, `save/create` | `src/controllers/apiUsersController.ts:39` |
| POST `/api/users/auth` | БД не нужна, заглушка ЛР4 | `src/controllers/apiUsersController.ts:52` |
| POST `/api/users/logout` | БД не нужна, заглушка ЛР4 | `src/controllers/apiUsersController.ts:62` |

Raw SQL в проекте ЛР3 не используется. QueryBuilder использует параметры `:status`, `:id`, `:creatorId`, а не конкатенацию строк.

## 7. Entity / Model

`asteroid_dates`: PK `id`; поля `designation`, `short_description`, `status`, `image_url`, `video_url`, `approach_month`, `approach_day`, `minimum_distance_au`, `created_at`, `formed_at`, `creator_id`; CHECK для статуса и unique partial index одного черновика на пользователя. Код: `src/entities/asteroid-date.entity.ts:25`.

`observers`: PK `id`; `full_name`; unique `email`; связи с датами и лайками. Код: `src/entities/observer.entity.ts:7`.

`observer_date_likes`: PK `id`; FK-поля `observer_id`, `asteroid_date_id`; unique `(observerId, asteroidDateId)`; связи ManyToOne. Код: `src/entities/observer-date-like.entity.ts:14`.

## 8. Вопросы на защиту

1. Сколько HTTP-методов в ЛР3? Ровно 10 `/api` методов, см. `README.md:25`.
2. Почему именно 10? 7 методов домена дат и 3 метода пользователя.
3. Сколько GET? Ровно 3: список, лента, черновик.
4. Что делает каждый GET? Список фильтрует, лента возвращает текущую/следующую карточку, draft возвращает черновик.
5. Где лента? `ApiDatesController.getFeedDate`, `src/controllers/apiDatesController.ts:114`.
6. Где одна карточка? Та же лента возвращает массив из одной карточки по `id`/`next`.
7. Что возвращает лента? `{ data: [{ ...card }] }`, `src/controllers/apiDatesController.ts:126`.
8. Что означает поле `0/1`? `isLiked` - лайк текущего пользователя.
9. Почему это не количество лайков? Количество отдельно в `likesCount`, `src/serializers/date.serializer.ts:17`.
10. Где считается количество лайков? `DatesService.getLikeCount`, `src/services/dates.service.ts:193`.
11. Как поставить лайк? `POST /api/dates/:id/like` с `{ "like": 1 }`.
12. Что происходит в БД? Создается строка в `observer_date_likes`.
13. Где INSERT? `likesRepository.save`, `src/services/dates.service.ts:170`.
14. Как убрать лайк? `POST /api/dates/:id/like` с `{ "like": 0 }`.
15. Где DELETE unlike? `likesRepository.delete`, `src/services/dates.service.ts:179`.
16. Какая таблица хранит лайки? `observer_date_likes`, `src/entities/observer-date-like.entity.ts:14`.
17. Почему это many-to-many? Пользователь может лайкать много дат, дата может иметь лайки многих пользователей.
18. Как определяется текущий пользователь? Singleton `getCurrentObserver`, `src/services/current-observer.service.ts:15`.
19. Почему выбран POST/PUT/DELETE? POST создает/действует, PUT меняет статус черновика, DELETE выполняет удаление.
20. Что возвращает метод лайка? `like` и обновленную `date`, `src/controllers/apiDatesController.ts:213`.
21. Как выглядит JSON? Примеры в разделе 5 этого отчета.
22. Где Controller? `src/controllers/apiDatesController.ts`, `src/controllers/apiUsersController.ts`.
23. Где Service? `src/services/dates.service.ts`.
24. Где ORM-запрос? Например `getPublishedDates`, `src/services/dates.service.ts:35`.
25. Где raw SQL? Raw SQL нет.
26. Как защищен SQL от injection? QueryBuilder параметры, например `:id`, `src/services/dates.service.ts:77`.
27. Как работает logical delete? UPDATE статуса на `deleted`, `src/services/dates.service.ts:145`.
28. Почему удаленная карточка не попадает в ленту? Все выборки фильтруют `status='published'`, `src/services/dates.service.ts:67`.
29. Как работает кнопка «Далее»? HTML ведет на `/dates/feed/:id?next=true`, сервис ищет следующую опубликованную запись через БД.
30. Чем она отличается от «Опубликовать»? «Далее» создает draft, «Опубликовать» меняет статус draft.
31. Где загружаются файлы? `FileFieldsInterceptor`, `src/controllers/apiDatesController.ts:138`.
32. Почему файлы не передаются при публикации? Publish DTO не содержит файлов, `src/controllers/apiDatesController.ts:34`.
33. Как выбирается следующая карточка? QueryBuilder с `CASE WHEN date.id > :id`, `src/services/dates.service.ts:75`.
34. Что если следующей карточки нет? Запрос делает циклический выбор первой опубликованной записи из-за сортировки CASE.

## 9. Что исправить перед сдачей

СРОЧНО

Нет срочных исправлений после текущих правок.

ЖЕЛАТЕЛЬНО

1. Перед защитой проговорить, что `/dates...` - старый HTML-визуал, а проверяемые REST-методы ЛР3 находятся только под `/api`.
2. Если преподаватель требует обязательный Minio даже локально, запускать с `DATE_MEDIA_STORAGE=minio`.
3. В Postman/Insomnia показать `GET /api/dates/feed?id=<id>&next=true`, а не старый вариант `/api/dates/feed/:id`.

## 10. Проверка

Команда `npm run check` выполнена успешно.
