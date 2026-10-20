import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { AsteroidDate } from "../entities/asteroid-date.entity.js";
import { ObserverDateLike } from "../entities/observer-date-like.entity.js";
import { CurrentObserverService } from "../services/current-observer.service.js";
import { DatesService } from "../services/dates.service.js";

@Injectable()
export class Lab3DatesService extends DatesService {
  constructor(
    @InjectRepository(AsteroidDate) dates: Repository<AsteroidDate>,
    @InjectRepository(ObserverDateLike) likes: Repository<ObserverDateLike>,
    observer: CurrentObserverService
  ) { super(dates, likes, observer); }

  private mediaUrl(name: string): string {
    if (name.startsWith("/") || /^https?:\/\//.test(name)) return name;
    const base = process.env.MINIO_PUBLIC_BASE_URL ?? process.env.MINIO_ENDPOINT ?? "http://localhost:9000";
    return `${base.replace(/\/$/, "")}/${process.env.MINIO_BUCKET ?? "asteroids-lab"}/${encodeURIComponent(name)}`;
  }

  override getImageUrl(date: AsteroidDate): string { return this.mediaUrl(super.getImageUrl(date)); }
  override getVideoUrl(date: AsteroidDate): string { return this.mediaUrl(super.getVideoUrl(date)); }
}
