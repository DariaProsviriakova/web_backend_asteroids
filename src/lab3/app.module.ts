import "./config.js";
import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ApiDatesController } from "../controllers/apiDatesController.js";
import { AsteroidDate } from "../entities/asteroid-date.entity.js";
import { Observer } from "../entities/observer.entity.js";
import { ObserverDateLike } from "../entities/observer-date-like.entity.js";
import { DateSeedService } from "../database/date-seed.service.js";
import { CurrentObserverService } from "../services/current-observer.service.js";
import { DateMediaStorageService } from "../services/date-media-storage.service.js";
import { DatesService } from "../services/dates.service.js";
import { Lab3CurrentObserverService } from "./current-observer.js";
import { Lab3DatesService } from "./dates.service.js";
import { Lab3MediaStorageService } from "./media-storage.service.js";
import { Lab3UsersController } from "./users.controller.js";

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: "postgres",
      host: process.env.POSTGRES_HOST ?? "localhost",
      port: Number(process.env.POSTGRES_PORT ?? 5455),
      username: process.env.POSTGRES_USER ?? "asteroids",
      password: process.env.POSTGRES_PASSWORD ?? "asteroids",
      database: process.env.POSTGRES_DB ?? "asteroids_lab3",
      entities: [AsteroidDate, Observer, ObserverDateLike],
      synchronize: process.env.DB_SYNCHRONIZE !== "false"
    }),
    TypeOrmModule.forFeature([AsteroidDate, Observer, ObserverDateLike])
  ],
  controllers: [ApiDatesController, Lab3UsersController],
  providers: [
    { provide: CurrentObserverService, useClass: Lab3CurrentObserverService },
    { provide: DatesService, useClass: Lab3DatesService },
    { provide: DateMediaStorageService, useClass: Lab3MediaStorageService },
    DateSeedService
  ]
})
export class Lab3Module {}
