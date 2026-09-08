import { Injectable } from "@nestjs/common";

import {
  asteroidServices,
  type AsteroidService
} from "../model/services.js";

@Injectable()
export class AsteroidsService {
  private localLikeIndex = 0;

  getPublishedServices(): AsteroidService[] {
    return asteroidServices.filter((service) => service.status === "published");
  }

  getDraftService(): AsteroidService | undefined {
    return asteroidServices.find((service) => service.status === "draft");
  }

  getPublishedServiceById(id: number): AsteroidService | undefined {
    return this.getPublishedServices().find((service) => service.id === id);
  }

  getNextPublishedService(id: number): AsteroidService | undefined {
    const published = this.getPublishedServices();
    const currentIndex = published.findIndex((service) => service.id === id);

    if (published.length === 0) {
      return undefined;
    }

    if (currentIndex === -1) {
      return published[0];
    }

    return published[(currentIndex + 1) % published.length];
  }

  addLike(id: number): AsteroidService | undefined {
    const service = this.getPublishedServiceById(id);

    if (!service) {
      return undefined;
    }

    this.localLikeIndex += 1;
    service.likes.push(`click-${id}-${this.localLikeIndex}`);

    return service;
  }
}
