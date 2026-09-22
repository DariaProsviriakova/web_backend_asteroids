import { Body, Controller, Post, Redirect } from "@nestjs/common";

import { parseIntegerInRange } from "../lib/format.js";
import { DatesService } from "../services/dates.service.js";

@Controller("dates/publish")
export class DatePublishController {
  constructor(private readonly datesService: DatesService) {}

  @Post()
  @Redirect("/dates", 303)
  async publishDraft(
    @Body("shortDescription") shortDescription?: string,
    @Body("approachMonth") approachMonth?: string,
    @Body("approachDay") approachDay?: string
  ) {
    const published = await this.datesService.publishDraftForCurrentObserver({
      shortDescription:
        shortDescription?.trim() ||
        "Минимальное расстояние астероида до Земли рассчитано по выбранной дате.",
      approachMonth: parseIntegerInRange(approachMonth, 1, 12) ?? 5,
      approachDay: parseIntegerInRange(approachDay, 1, 31) ?? 12
    });

    return { url: published ? `/dates/feed/${published.id}` : "/dates/add" };
  }
}
