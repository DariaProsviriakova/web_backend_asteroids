import { Controller, Get, Header, Query } from "@nestjs/common";

import type { AsteroidDate } from "../entities/asteroid-date.entity.js";
import { escapeHtml, formatDistance, formatTopicDate, parseIntegerInRange } from "../lib/format.js";
import { fillTemplate, renderPage } from "../lib/template.js";
import { DatesService } from "../services/dates.service.js";

const renderCard = (date: AsteroidDate, datesService: DatesService) =>
  fillTemplate("partials/date-card.html", {
    id: date.id,
    href: `/dates/feed/${date.id}`,
    deleteUrl: `/dates/${date.id}/delete`,
    imageUrl: datesService.getImageUrl(date),
    videoUrl: datesService.getVideoUrl(date),
    topicDate: formatTopicDate(date.approachMonth, date.approachDay),
    distance: formatDistance(date.minimumDistanceAu),
    likes: datesService.getLikeCount(date),
    designation: date.designation
  });

@Controller("dates")
export class DatesController {
  constructor(private readonly datesService: DatesService) {}

  @Get()
  @Header("Content-Type", "text/html; charset=utf-8")
  async renderDates(@Query("maxMonth") maxMonthQuery?: string) {
    const hasMonthFilter = maxMonthQuery !== undefined && maxMonthQuery.trim() !== "";
    const parsedMaxMonth = parseIntegerInRange(maxMonthQuery, 1, 12);
    const maxMonth = hasMonthFilter ? parsedMaxMonth ?? 0 : undefined;
    const selectedMonth = maxMonth ?? 12;
    const dates = await this.datesService.getPublishedDates(maxMonth);
    const cards = dates.length
      ? dates.map((date) => renderCard(date, this.datesService)).join("")
      : `<p class="empty-list">До месяца ${escapeHtml(selectedMonth)} ничего не найдено.</p>`;

    const monthMarkValues = Array.from({ length: 12 }, (_, index) => index + 1);
    const monthMarks = monthMarkValues
      .map((month) => `<option value="${month}">${month}</option>`)
      .join("");
    const monthLabels = monthMarkValues
      .map((month) => `<span>${month}</span>`)
      .join("");

    const body = fillTemplate("dates.html", {
      minMonth: 1,
      maxMonth: 12,
      selectedMonth,
      selectedMonthLabel: selectedMonth
    })
      .replace("{{monthMarks}}", monthMarks)
      .replace("{{monthLabels}}", monthLabels)
      .replace("{{cards}}", cards);

    return renderPage({
      title: "Выбор даты",
      active: "cards",
      body
    });
  }
}
