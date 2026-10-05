import type { AsteroidDate } from "../entities/asteroid-date.entity.js";
import type { DatesService } from "../services/dates.service.js";
import { getCurrentObserver } from "../services/current-observer.service.js";

const toIsoString = (date?: Date | null) => date?.toISOString() ?? null;

export const serializeAsteroidDate = (date: AsteroidDate, datesService: DatesService) => {
  const currentObserver = getCurrentObserver();

  return {
    id: date.id,
    designation: date.designation,
    shortDescription: date.shortDescription,
    status: date.status,
    imageUrl: datesService.getImageUrl(date),
    videoUrl: datesService.getVideoUrl(date),
    approachMonth: date.approachMonth,
    approachDay: date.approachDay,
    minimumDistanceAu: date.minimumDistanceAu,
    likes: datesService.getLikeCount(date),
    isCreator: date.creatorId === currentObserver.id ? 1 : 0,
    isLiked: datesService.isLikedByCurrentObserver(date) ? 1 : 0,
    createdAt: toIsoString(date.createdAt),
    formedAt: toIsoString(date.formedAt)
  };
};
