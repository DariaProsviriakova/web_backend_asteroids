import type { AsteroidDate } from "../entities/asteroid-date.entity.js";
import type { DatesService } from "../services/dates.service.js";

export const serializeAsteroidDate = (date: AsteroidDate, datesService: DatesService) => {
  return {
    id: date.id,
    designation: date.designation,
    status: date.status,
    creatorId: date.creatorId,
    createdAt: date.createdAt,
    formedAt: date.formedAt,
    shortDescription: date.shortDescription,
    imageUrl: datesService.getImageUrl(date),
    videoUrl: datesService.getVideoUrl(date),
    approachMonth: date.approachMonth,
    approachDay: date.approachDay,
    minimumDistanceAu: date.minimumDistanceAu,
    likesCount: datesService.getLikeCount(date),
    isCreator: datesService.isCreatedByCurrentObserver(date) ? 1 : 0,
    isLiked: datesService.isLikedByCurrentObserver(date) ? 1 : 0
  };
};
