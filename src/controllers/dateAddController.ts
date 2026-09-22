import { Controller, Get, Header } from "@nestjs/common";

import {
  formatDistance,
  formatVelocity
} from "../lib/format.js";
import { fillTemplate, renderPage } from "../lib/template.js";
import { DatesService } from "../services/dates.service.js";

@Controller("dates/add")
export class DateAddController {
  constructor(private readonly datesService: DatesService) {}

  @Get()
  @Header("Content-Type", "text/html; charset=utf-8")
  renderAdd() {
    const draftDate = this.datesService.getDraftDate();

    if (!draftDate) {
      return renderPage({
        title: "Добавление",
        active: "add",
        body: '<main class="phone-page empty-page"><p>Черновик даты не найден.</p></main>'
      });
    }

    const body = fillTemplate("date-add.html", {
      id: draftDate.id,
      status: "Черновик",
      title: draftDate.title,
      designation: draftDate.designation,
      approachDate: draftDate.approachDate,
      distance: formatDistance(draftDate.distanceAu),
      rightAscension: draftDate.rightAscension,
      declination: draftDate.declination,
      velocity: formatVelocity(draftDate.velocityKms),
      magnitude: draftDate.magnitudeH.toLocaleString("ru-RU"),
      description: draftDate.description,
      imageKey: draftDate.imageKey,
      videoKey: draftDate.videoKey,
      imageUrl: draftDate.imageUrl,
      videoUrl: draftDate.videoUrl
    });

    return renderPage({
      title: "Добавление",
      active: "add",
      body
    });
  }
}
