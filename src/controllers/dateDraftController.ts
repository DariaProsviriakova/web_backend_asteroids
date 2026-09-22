import { Controller, Get, Header } from "@nestjs/common";

import { fillTemplate, renderPage } from "../lib/template.js";
import { DatesService } from "../services/dates.service.js";

@Controller("dates/add")
export class DateDraftController {
  constructor(private readonly datesService: DatesService) {}

  @Get()
  @Header("Content-Type", "text/html; charset=utf-8")
  async renderDraft() {
    const draft = await this.datesService.getDraftForCurrentObserver();
    const body = draft
      ? fillTemplate("date-add.html", {
          modeClass: "publish-mode",
          createHidden: "hidden",
          publishHidden: "",
          id: draft.id,
          designation: draft.designation,
          approachMonth: draft.approachMonth ?? "",
          approachDay: draft.approachDay ?? "",
          description: draft.shortDescription ?? "",
          imageUrl: this.datesService.getImageUrl(draft),
          videoUrl: this.datesService.getVideoUrl(draft)
        })
      : fillTemplate("date-add.html", {
          modeClass: "create-mode",
          createHidden: "",
          publishHidden: "hidden",
          id: "",
          designation: "",
          approachMonth: "",
          approachDay: "",
          description: "",
          imageUrl: "/assets/default-date.png",
          videoUrl: "/assets/default-date.mp4"
        });

    return renderPage({
      title: "Добавление",
      active: "add",
      body
    });
  }
}
