import { Module } from "@nestjs/common";

import { DateAddController } from "./controllers/dateAddController.js";
import { DatesController } from "./controllers/datesController.js";
import { DateFeedController } from "./controllers/dateFeedController.js";
import { RootController } from "./controllers/rootController.js";
import { DatesService } from "./services/dates.service.js";

@Module({
  controllers: [RootController, DateFeedController, DateAddController, DatesController],
  providers: [DatesService]
})
export class AppModule {}
