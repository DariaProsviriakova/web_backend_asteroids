import { Controller, Get, Header } from "@nestjs/common";

import {
  formatDistance,
  formatVelocity
} from "../lib/format.js";
import { fillTemplate, renderPage } from "../lib/template.js";
import { AsteroidsService } from "../services/asteroids.service.js";

@Controller("add")
export class AddController {
  constructor(private readonly asteroidsService: AsteroidsService) {}

  @Get()
  @Header("Content-Type", "text/html; charset=utf-8")
  renderAdd() {
    const draft = this.asteroidsService.getDraftService();

    if (!draft) {
      return renderPage({
        title: "Заявка",
        active: "add",
        body: '<main class="phone-page empty-page"><p>Черновик не найден.</p></main>'
      });
    }

    const body = fillTemplate("add.html", {
      id: draft.id,
      status: "Черновик",
      title: draft.title,
      designation: draft.designation,
      approachDate: draft.approachDate,
      distance: formatDistance(draft.distanceAu),
      rightAscension: draft.rightAscension,
      declination: draft.declination,
      velocity: formatVelocity(draft.velocityKms),
      magnitude: draft.magnitudeH.toLocaleString("ru-RU"),
      description: draft.description,
      imageKey: draft.imageKey,
      videoKey: draft.videoKey,
      imageUrl: draft.imageUrl,
      videoUrl: draft.videoUrl
    });

    return renderPage({
      title: "Заявка",
      active: "add",
      body
    });
  }
}
