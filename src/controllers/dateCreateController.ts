import { Body, Controller, Post, Redirect } from "@nestjs/common";

import { DatesService } from "../services/dates.service.js";

@Controller("dates/add")
export class DateCreateController {
  constructor(private readonly datesService: DatesService) {}

  @Post()
  @Redirect("/dates/add", 303)
  async createDraft(@Body("designation") designation?: string) {
    await this.datesService.createDraftForCurrentObserver({
      designation: designation?.trim() || "Новый астероид"
    });

    return { url: "/dates/add" };
  }
}
