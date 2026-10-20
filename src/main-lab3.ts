import "./lab3/config.js";
import "reflect-metadata";
import { ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { NestExpressApplication } from "@nestjs/platform-express";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { join } from "node:path";
import { Lab3Module } from "./lab3/app.module.js";

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(Lab3Module);
  app.enableShutdownHooks();
  app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true, forbidNonWhitelisted: true }));
  app.useStaticAssets(join(process.cwd(), "public"));
  const config = new DocumentBuilder().setTitle("Asteroid Dates API — ЛР3").setVersion("1.0")
    .setDescription("10 методов: 3 GET, 5 POST, 1 PUT, 1 DELETE. Текущий наблюдатель фиксирован (id=1), вход и выход — заглушки. Файлы загружаются в MinIO, в БД сохраняются сгенерированные латинские имена.").build();
  const document = SwaggerModule.createDocument(app, config);
  const descriptions: Record<string, string> = {
    "GET /api/dates": "Только опубликованные даты, maxMonth — фильтр. isCreator=1, если creatorId совпадает с фиксированным текущим пользователем.",
    "GET /api/dates/feed": "Только опубликованные даты. Без id — первая карточка; с id и next=true — следующая, учитываются пропуски id. isLiked — лайк текущего пользователя.",
    "GET /api/dates/draft": "Не более одного черновика фиксированного пользователя, без id в запросе. При отсутствии data=null.",
    "POST /api/dates": "Multipart: designation, image и video как файлы. MinIO хранит файлы, БД — сгенерированные латинские имена. Автор фиксирован на сервере.",
    "PUT /api/dates/publish": "Публикация собственного черновика: поля публикации, status=published, formedAt.",
    "DELETE /api/dates/{id}": "Только soft delete собственной карточки: status=deleted. Чужая карточка возвращает 404.",
    "POST /api/dates/{id}/like": "От текущего пользователя: like=1 устанавливает лайк, like=0 отменяет. Повтор не создаёт дубликатов."
  };
  for (const [path, methods] of Object.entries(document.paths)) {
    for (const [method, operation] of Object.entries(methods ?? {})) {
      if (!operation || typeof operation !== "object" || !("responses" in operation)) continue;
      delete operation.security;
      delete operation.responses?.["401"];
      const description = descriptions[`${method.toUpperCase()} ${path}`];
      if (description) operation.description = description;
    }
  }
  SwaggerModule.setup("swagger", app, document, { jsonDocumentUrl: "/swagger-json" });
  const port = Number(process.env.PORT ?? 3003);
  await app.listen(port, "127.0.0.1");
  console.log(`ЛР3: http://localhost:${port}/swagger`);
}

bootstrap().catch((error) => { console.error(error); process.exit(1); });
