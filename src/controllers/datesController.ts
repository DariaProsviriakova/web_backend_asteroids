import { Controller, Get, Header, Query } from "@nestjs/common";

import type { AsteroidDate } from "../model/dates.js";
import {
  escapeHtml,
  formatDistance,
  likeCount,
  normalizeSearch
} from "../lib/format.js";
import { fillTemplate, renderPage } from "../lib/template.js";
import { DatesService } from "../services/dates.service.js";

const renderDateCard = (date: AsteroidDate, searchDate: string) => {
  const likeParams = new URLSearchParams({ liked: String(date.id) });

  if (searchDate) {
    likeParams.set("approachDate", searchDate);
  }

  return fillTemplate("partials/date-card.html", {
    id: date.id,
    href: `/dates/feed/${date.id}`,
    likeHref: `/dates?${likeParams.toString()}#like-${date.id}`,
    imageUrl: date.imageUrl,
    videoUrl: date.videoUrl,
    approachDate: date.approachDate,
    distance: formatDistance(date.distanceAu),
    likes: likeCount(date),
    designation: date.designation
  });
};

@Controller("dates")
export class DatesController {
  constructor(private readonly datesService: DatesService) {}

  @Get()
  @Header("Content-Type", "text/html; charset=utf-8")
  renderDates(
    @Query("approachDate") approachDate?: string,
    @Query("liked") liked?: string
  ) {
    const likedId = liked ? Number(liked) : NaN;

    if (Number.isFinite(likedId)) {
      this.datesService.addLike(likedId);
    }

    const searchDate = approachDate ?? "";
    const normalizedSearch = normalizeSearch(searchDate);
    const publishedDates = this.datesService.getPublishedDates();
    const visibleDates = normalizedSearch
      ? publishedDates.filter((date) =>
          normalizeSearch(date.approachDate).includes(normalizedSearch) ||
          date.approachDateIso.includes(normalizedSearch)
        )
      : publishedDates;

    const dateCards = visibleDates.length
      ? visibleDates.map((date) => renderDateCard(date, searchDate)).join("")
      : `<p class="empty-list">По дате ${escapeHtml(searchDate)} ничего не найдено.</p>`;

    const body = fillTemplate("dates.html", { searchDate }).replace("{{dateCards}}", dateCards);

    return renderPage({
      title: "Выбор даты",
      active: "dates",
      body
    });
  }
}
