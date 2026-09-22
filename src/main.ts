import { NestFactory } from "@nestjs/core";
import { NestExpressApplication } from "@nestjs/platform-express";
import { join } from "node:path";
import "reflect-metadata";

import { AppModule } from "./app.module.js";

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.useStaticAssets(join(process.cwd(), "public"));

  const port = Number(process.env.PORT ?? 3000);
  await app.listen(port);
  console.log(`Asteroids backend: http://localhost:${port}`);
}

void bootstrap();
