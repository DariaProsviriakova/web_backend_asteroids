import { Controller, Get, Header, Query } from "@nestjs/common";

import type { AsteroidService } from "../model/services.js";
import {
  escapeHtml,
  formatDistance,
  likeCount,
  normalizeSearch
} from "../lib/format.js";
import { fillTemplate, renderPage } from "../lib/template.js";
import { AsteroidsService } from "../services/asteroids.service.js";

const renderCard = (service: AsteroidService, searchDate: string) => {
  const likeParams = new URLSearchParams({ liked: String(service.id) });

  if (searchDate) {
    likeParams.set("approachDate", searchDate);
  }

  return fillTemplate("partials/card.html", {
    id: service.id,
    href: `/feed/${service.id}`,
    likeHref: `/cards?${likeParams.toString()}#like-${service.id}`,
    imageUrl: service.imageUrl,
    videoUrl: service.videoUrl,
    approachDate: service.approachDate,
    distance: formatDistance(service.distanceAu),
    likes: likeCount(service),
    designation: service.designation
  });
};

@Controller("cards")
export class CardsController {
  constructor(private readonly asteroidsService: AsteroidsService) {}

  @Get()
  @Header("Content-Type", "text/html; charset=utf-8")
  renderCards(
    @Query("approachDate") approachDate?: string,
    @Query("liked") liked?: string
  ) {
    const likedId = liked ? Number(liked) : NaN;

    if (Number.isFinite(likedId)) {
      this.asteroidsService.addLike(likedId);
    }

    const searchDate = approachDate ?? "";
    const normalizedSearch = normalizeSearch(searchDate);
    const published = this.asteroidsService.getPublishedServices();
    const visibleServices = normalizedSearch
      ? published.filter((service) =>
          normalizeSearch(service.approachDate).includes(normalizedSearch) ||
          service.approachDateIso.includes(normalizedSearch)
        )
      : published;

    const cards = visibleServices.length
      ? visibleServices.map((service) => renderCard(service, searchDate)).join("")
      : `<p class="empty-list">По дате ${escapeHtml(searchDate)} ничего не найдено.</p>`;

    const body = fillTemplate("cards.html", { searchDate }).replace("{{cards}}", cards);

    return renderPage({
      title: "Выбор даты",
      active: "cards",
      body
    });
  }
}
