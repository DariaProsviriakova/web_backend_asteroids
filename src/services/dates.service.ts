import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { AsteroidDate } from "../entities/asteroid-date.entity.js";
import { ObserverDateLike } from "../entities/observer-date-like.entity.js";
import { getCurrentObserver } from "./current-observer.service.js";

export const CURRENT_OBSERVER_ID = getCurrentObserver().id;
export const DEFAULT_IMAGE_URL = "/assets/default-date.png";
export const DEFAULT_VIDEO_URL = "/assets/default-date.mp4";

export type CreateDraftInput = {
  designation: string;
  imageUrl?: string | null;
  videoUrl?: string | null;
};

export type PublishDraftInput = {
  shortDescription: string;
  approachMonth: number;
  approachDay: number;
  minimumDistanceAu?: number | null;
};

@Injectable()
export class DatesService {
  constructor(
    @InjectRepository(AsteroidDate)
    private readonly datesRepository: Repository<AsteroidDate>,
    @InjectRepository(ObserverDateLike)
    private readonly likesRepository: Repository<ObserverDateLike>
  ) {}

  async getPublishedDates(maxMonth?: number): Promise<AsteroidDate[]> {
    const query = this.datesRepository
      .createQueryBuilder("date")
      .leftJoinAndSelect("date.likes", "likes")
      .where("date.status = :status", { status: "published" })
      .orderBy("date.approachMonth", "ASC")
      .addOrderBy("date.approachDay", "ASC")
      .addOrderBy("date.id", "ASC");

    if (maxMonth !== undefined) {
      query.andWhere("date.approachMonth <= :maxMonth", { maxMonth });
    }

    return query.getMany();
  }

  async getPublishedDateById(id: number): Promise<AsteroidDate | null> {
    return this.getPublishedFeedDate({ id });
  }

  async getFirstPublishedDate(): Promise<AsteroidDate | null> {
    return this.getPublishedFeedDate();
  }

  async getNextPublishedDate(id: number): Promise<AsteroidDate | null> {
    return this.getPublishedFeedDate({ id, next: true });
  }

  async getPublishedFeedDate(options: { id?: number; next?: boolean } = {}) {
    const query = this.datesRepository
      .createQueryBuilder("date")
      .leftJoinAndSelect("date.likes", "likes")
      .where("date.status = :status", { status: "published" });

    if (options.id !== undefined && !options.next) {
      return query.andWhere("date.id = :id", { id: options.id }).getOne();
    }

    if (options.id !== undefined && options.next) {
      return query
        .orderBy("CASE WHEN date.id > :id THEN 0 ELSE 1 END", "ASC")
        .addOrderBy("date.id", "ASC")
        .setParameter("id", options.id)
        .take(1)
        .getOne();
    }

    return this.datesRepository
      .createQueryBuilder("date")
      .leftJoinAndSelect("date.likes", "likes")
      .where("date.status = :status", { status: "published" })
      .orderBy("date.id", "ASC")
      .take(1)
      .getOne();
  }

  async getDraftForCurrentObserver(): Promise<AsteroidDate | null> {
    return this.datesRepository.findOne({
      where: { creatorId: CURRENT_OBSERVER_ID, status: "draft" },
      relations: { likes: true }
    });
  }

  async createDraftForCurrentObserver(input: CreateDraftInput): Promise<AsteroidDate> {
    const existingDraft = await this.getDraftForCurrentObserver();

    if (existingDraft) {
      existingDraft.designation = input.designation;
      if (input.imageUrl !== undefined) {
        existingDraft.imageUrl = input.imageUrl;
      }
      if (input.videoUrl !== undefined) {
        existingDraft.videoUrl = input.videoUrl;
      }
      return this.datesRepository.save(existingDraft);
    }

    return this.datesRepository.save(
      this.datesRepository.create({
        designation: input.designation,
        status: "draft",
        shortDescription: null,
        imageUrl: input.imageUrl ?? null,
        videoUrl: input.videoUrl ?? null,
        approachMonth: null,
        approachDay: null,
        minimumDistanceAu: 0.023,
        formedAt: null,
        creatorId: CURRENT_OBSERVER_ID
      })
    );
  }

  async publishDraftForCurrentObserver(input: PublishDraftInput): Promise<AsteroidDate | null> {
    const draft = await this.getDraftForCurrentObserver();

    if (!draft) {
      return null;
    }

    draft.shortDescription = input.shortDescription;
    draft.approachMonth = input.approachMonth;
    draft.approachDay = input.approachDay;
    draft.minimumDistanceAu = input.minimumDistanceAu ?? draft.minimumDistanceAu ?? 0.023;
    draft.status = "published";
    draft.formedAt = new Date();

    return this.datesRepository.save(draft);
  }

  async deleteDateForCurrentObserver(id: number): Promise<boolean> {
    const result = await this.datesRepository
      .createQueryBuilder()
      .update(AsteroidDate)
      .set({ status: "deleted" })
      .where("id = :id", { id })
      .andWhere("creator_id = :creatorId", { creatorId: CURRENT_OBSERVER_ID })
      .andWhere("status <> :deletedStatus", { deletedStatus: "deleted" })
      .execute();

    return (result.affected ?? 0) > 0;
  }

  async setLikeForCurrentObserver(id: number, like: 0 | 1): Promise<AsteroidDate | null> {
    const publishedDate = await this.getPublishedDateById(id);

    if (!publishedDate) {
      return null;
    }

    const existingLike = await this.likesRepository.findOne({
      where: { asteroidDateId: id, observerId: CURRENT_OBSERVER_ID }
    });

    if (like === 1 && !existingLike) {
      await this.likesRepository.save(
        this.likesRepository.create({
          asteroidDateId: id,
          observerId: CURRENT_OBSERVER_ID
        })
      );
    }

    if (like === 0 && existingLike) {
      await this.likesRepository.delete({ id: existingLike.id });
    }

    return this.getPublishedDateById(id);
  }

  getImageUrl(date: AsteroidDate): string {
    return date.imageUrl?.trim() ? date.imageUrl : DEFAULT_IMAGE_URL;
  }

  getVideoUrl(date: AsteroidDate): string {
    return date.videoUrl?.trim() ? date.videoUrl : DEFAULT_VIDEO_URL;
  }

  getLikeCount(date: AsteroidDate): number {
    const likesCount = date.likes?.length ?? 0;

    return Math.min(5, Math.max(1, likesCount));
  }

  isLikedByCurrentObserver(date: AsteroidDate): boolean {
    return date.likes?.some((like) => like.observerId === CURRENT_OBSERVER_ID) ?? false;
  }
}
