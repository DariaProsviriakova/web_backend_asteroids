import { ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { NestExpressApplication } from "@nestjs/platform-express";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { join } from "node:path";
import "reflect-metadata";
import { AppModule } from "./app.module.js";
import { RedisSessionService, SESSION_COOKIE_NAME } from "./auth/redis-session.service.js";

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.enableShutdownHooks();
  if (process.env.TRUST_PROXY === "true") app.set("trust proxy", 1);
  app.use(await app.get(RedisSessionService).middleware());
  app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true, forbidNonWhitelisted: true }));
  const origins = (process.env.CORS_ORIGINS ?? "http://localhost:5173,http://localhost:3000").split(",").map((origin) => origin.trim());
  app.enableCors({ origin: origins, credentials: true });
  app.useStaticAssets(join(process.cwd(), "public"));
  app.useStaticAssets(join(process.cwd(), "minio-assets"), { prefix: "/seed-assets/" });

  const config = new DocumentBuilder().setTitle("Asteroid Dates API — ЛР4").setVersion("2.0")
    .setDescription("Даты сближения астероидов с Землёй. Список и лента доступны гостю. Зарегистрируйтесь и выполните POST /api/users/auth в Swagger: браузер сохранит cookie, после чего доступны собственный черновик, публикация, удаление и лайки.")
    .addCookieAuth(SESSION_COOKIE_NAME, { type: "apiKey", in: "cookie" }, "session").build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup("swagger", app, document, {
    jsonDocumentUrl: "/swagger-json",
    swaggerOptions: { withCredentials: true, persistAuthorization: false, defaultModelsExpandDepth: 1 }
  });
  const port = Number(process.env.PORT ?? 3000);
  await app.listen(port, process.env.HOST ?? "127.0.0.1");
  console.log(`Asteroids backend: http://localhost:${port}/dates`);
  console.log(`Swagger: http://localhost:${port}/swagger`);
}

bootstrap().catch((error) => { console.error(error); process.exit(1); });
