import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { DateCreateController } from "./controllers/dateCreateController.js";
import { DateDeleteController } from "./controllers/dateDeleteController.js";
import { DateDraftController } from "./controllers/dateDraftController.js";
import { DateFeedController } from "./controllers/dateFeedController.js";
import { DatePublishController } from "./controllers/datePublishController.js";
import { DatesController } from "./controllers/datesController.js";
import { DateSeedService } from "./database/date-seed.service.js";
import { AsteroidDate } from "./entities/asteroid-date.entity.js";
import { ObserverDateLike } from "./entities/observer-date-like.entity.js";
import { Observer } from "./entities/observer.entity.js";
import { DatesService } from "./services/dates.service.js";

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: "postgres",
      host: process.env.POSTGRES_HOST ?? "localhost",
      port: Number(process.env.POSTGRES_PORT ?? 5455),
      username: process.env.POSTGRES_USER ?? "asteroids",
      password: process.env.POSTGRES_PASSWORD ?? "asteroids",
      database: process.env.POSTGRES_DB ?? "asteroids_lab2",
      entities: [AsteroidDate, Observer, ObserverDateLike],
      synchronize: true
    }),
    TypeOrmModule.forFeature([AsteroidDate, Observer, ObserverDateLike])
  ],
  controllers: [
    DateFeedController,
    DateDraftController,
    DateCreateController,
    DatePublishController,
    DatesController,
    DateDeleteController
  ],
  providers: [DatesService, DateSeedService]
})
export class AppModule {}
