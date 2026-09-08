import { Module } from "@nestjs/common";

import { AddController } from "./controllers/addController.js";
import { CardsController } from "./controllers/cardsController.js";
import { FeedController } from "./controllers/feedController.js";
import { RootController } from "./controllers/rootController.js";
import { AsteroidsService } from "./services/asteroids.service.js";

@Module({
  controllers: [RootController, FeedController, AddController, CardsController],
  providers: [AsteroidsService]
})
export class AppModule {}
