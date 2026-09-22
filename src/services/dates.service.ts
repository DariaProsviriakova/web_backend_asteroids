import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { DataSource, Repository } from "typeorm";

import { AsteroidDate } from "../entities/asteroid-date.entity.js";

export const CURRENT_OBSERVER_ID = 1;
export const DEFAULT_IMAGE_URL = "/assets/default-date.png";
export const DEFAULT_VIDEO_URL = "/assets/default-date.mp4";

export type CreateDraftInput = {
  designation: string;
};

export type PublishDraftInput = {
  shortDescription: string;
  approachMonth: number;
  approachDay: number;
};

@Injectable()
export class DatesService {
  constructor(
    @InjectRepository(AsteroidDate)
    private readonly datesRepository: Repository<AsteroidDate>,
    private readonly dataSource: DataSource
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
    return this.datesRepository.findOne({
      where: { id, status: "published" },
      relations: { likes: true }
    });
  }

  async getFirstPublishedDate(): Promise<AsteroidDate | null> {
    return this.datesRepository.findOne({
      where: { status: "published" },
      order: { approachMonth: "ASC", approachDay: "ASC", id: "ASC" },
      relations: { likes: true }
    });
  }

  async getNextPublishedDate(id: number): Promise<AsteroidDate | null> {
    const dates = await this.getPublishedDates();
    const currentIndex = dates.findIndex((date) => date.id === id);

    if (dates.length === 0) {
      return null;
    }

    if (currentIndex === -1) {
      return dates[0];
    }

    return dates[(currentIndex + 1) % dates.length];
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
      return this.datesRepository.save(existingDraft);
    }

    return this.datesRepository.save(
      this.datesRepository.create({
        designation: input.designation,
        status: "draft",
        shortDescription: null,
        imageUrl: null,
        videoUrl: null,
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
    draft.minimumDistanceAu ??= 0.023;
    draft.status = "published";
    draft.formedAt = new Date();

    return this.datesRepository.save(draft);
  }

  async deleteDateWithSqlUpdate(id: number): Promise<void> {
    const queryRunner = this.dataSource.createQueryRunner();

    await queryRunner.connect();
    try {
      await queryRunner.query(
        "UPDATE asteroid_dates SET status = $1 WHERE id = $2 AND status = $3",
        ["deleted", id, "published"]
      );
    } finally {
      await queryRunner.release();
    }
  }

  getImageUrl(date: AsteroidDate): string {
    return date.imageUrl?.trim() ? date.imageUrl : DEFAULT_IMAGE_URL;
  }

  getVideoUrl(date: AsteroidDate): string {
    return date.videoUrl?.trim() ? date.videoUrl : DEFAULT_VIDEO_URL;
  }

  getLikeCount(date: AsteroidDate): number {
    return date.likes?.length ?? 0;
  }
}
