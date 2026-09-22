import { Controller, Get, Header, Param, Query } from "@nestjs/common";

import {
  formatDistance,
  formatVelocity,
  likeCount
} from "../lib/format.js";
import { fillTemplate, renderPage } from "../lib/template.js";
import { DatesService } from "../services/dates.service.js";

@Controller("dates/feed")
export class DateFeedController {
  constructor(private readonly datesService: DatesService) {}

  @Get(["", ":id"])
  @Header("Content-Type", "text/html; charset=utf-8")
  renderFeed(
    @Param("id") idParam?: string,
    @Query("next") next?: string,
    @Query("liked") liked?: string
  ) {
    const publishedDates = this.datesService.getPublishedDates();

    if (publishedDates.length === 0) {
      return renderPage({
        title: "Лента",
        active: "feed",
        body: '<main class="phone-page empty-page"><p>Нет опубликованных дат.</p></main>'
      });
    }

    const id = idParam ? Number(idParam) : undefined;
    if (liked === "true" && id) {
      this.datesService.addLike(id);
    }

    const requestedDate = id
      ? this.datesService.getPublishedDateById(id)
      : publishedDates[0];
    const currentDate = next === "true" && id
      ? this.datesService.getNextPublishedDate(id) ?? publishedDates[0]
      : requestedDate ?? publishedDates[0];

    const body = fillTemplate("date-feed.html", {
      id: currentDate.id,
      title: currentDate.title.toUpperCase(),
      designation: currentDate.designation,
      approachDate: currentDate.approachDate,
      distance: formatDistance(currentDate.distanceAu),
      rightAscension: currentDate.rightAscension,
      declination: currentDate.declination,
      velocity: formatVelocity(currentDate.velocityKms),
      magnitude: currentDate.magnitudeH.toLocaleString("ru-RU"),
      description: currentDate.description,
      imageUrl: currentDate.imageUrl,
      videoUrl: currentDate.videoUrl,
      likes: likeCount(currentDate),
      likeHref: `/dates/feed/${currentDate.id}?liked=true#like-${currentDate.id}`,
      nextUrl: `/dates/feed/${currentDate.id}?next=true`
    });

    return renderPage({
      title: "Лента",
      active: "feed",
      body
    });
  }
}
