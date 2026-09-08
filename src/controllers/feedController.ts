import { Controller, Get, Header, Param, Query } from "@nestjs/common";

import {
  formatDistance,
  formatVelocity,
  likeCount
} from "../lib/format.js";
import { fillTemplate, renderPage } from "../lib/template.js";
import { AsteroidsService } from "../services/asteroids.service.js";

@Controller("feed")
export class FeedController {
  constructor(private readonly asteroidsService: AsteroidsService) {}

  @Get(["", ":id"])
  @Header("Content-Type", "text/html; charset=utf-8")
  renderFeed(
    @Param("id") idParam?: string,
    @Query("next") next?: string,
    @Query("liked") liked?: string
  ) {
    const published = this.asteroidsService.getPublishedServices();

    if (published.length === 0) {
      return renderPage({
        title: "Лента",
        active: "feed",
        body: '<main class="phone-page empty-page"><p>Нет опубликованных услуг.</p></main>'
      });
    }

    const id = idParam ? Number(idParam) : undefined;
    if (liked === "true" && id) {
      this.asteroidsService.addLike(id);
    }

    const requestedService = id
      ? this.asteroidsService.getPublishedServiceById(id)
      : published[0];
    const currentService = next === "true" && id
      ? this.asteroidsService.getNextPublishedService(id) ?? published[0]
      : requestedService ?? published[0];

    const body = fillTemplate("feed.html", {
      id: currentService.id,
      title: currentService.title.toUpperCase(),
      designation: currentService.designation,
      approachDate: currentService.approachDate,
      distance: formatDistance(currentService.distanceAu),
      rightAscension: currentService.rightAscension,
      declination: currentService.declination,
      velocity: formatVelocity(currentService.velocityKms),
      magnitude: currentService.magnitudeH.toLocaleString("ru-RU"),
      description: currentService.description,
      imageUrl: currentService.imageUrl,
      videoUrl: currentService.videoUrl,
      likes: likeCount(currentService),
      likeHref: `/feed/${currentService.id}?liked=true#like-${currentService.id}`,
      nextUrl: `/feed/${currentService.id}?next=true`
    });

    return renderPage({
      title: "Лента",
      active: "feed",
      body
    });
  }
}
