import { ApiExcludeController } from "@nestjs/swagger";
import { Controller, Param, Post, Redirect } from "@nestjs/common";

import { DatesService } from "../services/dates.service.js";

@ApiExcludeController()
@Controller("dates/:id/delete")
export class DateDeleteController {
  constructor(private readonly datesService: DatesService) {}

  @Post()
  @Redirect("/dates", 303)
  async deleteDate(@Param("id") idParam: string) {
    const id = Number(idParam);

    if (Number.isFinite(id)) {
      await this.datesService.deleteDateForCurrentObserver(id);
    }

    return { url: "/dates" };
  }
}
