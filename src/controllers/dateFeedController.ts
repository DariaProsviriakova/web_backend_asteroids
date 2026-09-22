import { Controller, Get, Header, Param, Query } from "@nestjs/common";

import { formatDistance, formatTopicDate } from "../lib/format.js";
import { fillTemplate, renderPage } from "../lib/template.js";
import { DatesService } from "../services/dates.service.js";

@Controller("dates/feed")
export class DateFeedController {
  constructor(private readonly datesService: DatesService) {}

  @Get(["", ":id"])
  @Header("Content-Type", "text/html; charset=utf-8")
  async renderFeed(@Param("id") idParam?: string, @Query("next") next?: string) {
    const id = idParam ? Number(idParam) : undefined;
    const requestedDate = id ? await this.datesService.getPublishedDateById(id) : null;
    const directUnavailableDate = id !== undefined && !requestedDate && next !== "true";
    const firstDate = requestedDate || directUnavailableDate
      ? null
      : await this.datesService.getFirstPublishedDate();
    const currentDate =
      next === "true" && id
        ? await this.datesService.getNextPublishedDate(id)
        : requestedDate ?? firstDate;

    if (!currentDate) {
      return renderPage({
        title: "Лента",
        active: "feed",
        body: '<main class="phone-page empty-page"><p>Дата удалена или недоступна.</p></main>'
      });
    }

    const body = fillTemplate("date-feed.html", {
      id: currentDate.id,
      title: "МИНИМАЛЬНОЕ РАССТОЯНИЕ ДО ЗЕМЛИ",
      designation: currentDate.designation,
      topicDate: formatTopicDate(currentDate.approachMonth, currentDate.approachDay),
      distance: formatDistance(currentDate.minimumDistanceAu),
      description: currentDate.shortDescription,
      imageUrl: this.datesService.getImageUrl(currentDate),
      videoUrl: this.datesService.getVideoUrl(currentDate),
      likes: this.datesService.getLikeCount(currentDate),
      nextUrl: `/dates/feed/${currentDate.id}?next=true`
    });

    return renderPage({
      title: "Лента",
      active: "feed",
      body
    });
  }
}
