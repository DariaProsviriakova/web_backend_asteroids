import { Injectable } from "@nestjs/common";

import {
  asteroidDates,
  type AsteroidDate
} from "../model/dates.js";

@Injectable()
export class DatesService {
  private localLikeIndex = 0;

  getPublishedDates(): AsteroidDate[] {
    return asteroidDates.filter((date) => date.status === "published");
  }

  getDraftDate(): AsteroidDate | undefined {
    return asteroidDates.find((date) => date.status === "draft");
  }

  getPublishedDateById(id: number): AsteroidDate | undefined {
    return this.getPublishedDates().find((date) => date.id === id);
  }

  getNextPublishedDate(id: number): AsteroidDate | undefined {
    const publishedDates = this.getPublishedDates();
    const currentIndex = publishedDates.findIndex((date) => date.id === id);

    if (publishedDates.length === 0) {
      return undefined;
    }

    if (currentIndex === -1) {
      return publishedDates[0];
    }

    return publishedDates[(currentIndex + 1) % publishedDates.length];
  }

  addLike(id: number): AsteroidDate | undefined {
    const date = this.getPublishedDateById(id);

    if (!date) {
      return undefined;
    }

    this.localLikeIndex += 1;
    date.likes.push(`click-${id}-${this.localLikeIndex}`);

    return date;
  }
}
