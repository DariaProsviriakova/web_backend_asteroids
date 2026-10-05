import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  Post,
  Put,
  Query,
  UploadedFiles,
  UseInterceptors
} from "@nestjs/common";
import { FileFieldsInterceptor } from "@nestjs/platform-express";

import { parseIntegerInRange } from "../lib/format.js";
import { serializeAsteroidDate } from "../serializers/date.serializer.js";
import {
  DateMediaStorageService,
  type UploadedDateMediaFile
} from "../services/date-media-storage.service.js";
import { DatesService } from "../services/dates.service.js";

type UploadedDateMediaFiles = {
  image?: UploadedDateMediaFile[];
  video?: UploadedDateMediaFile[];
};

type CreateDateBody = {
  designation?: string;
};

type PublishDateBody = {
  shortDescription?: string;
  approachMonth?: string | number;
  approachDay?: string | number;
  minimumDistanceAu?: string | number;
};

type LikeDateBody = {
  like?: string | number;
  liked?: string | number;
  value?: string | number;
};

const requiredText = (value: unknown, fieldName: string) => {
  const text = typeof value === "string" ? value.trim() : "";

  if (!text) {
    throw new BadRequestException(`${fieldName} is required`);
  }

  return text;
};

const parseNumericId = (value: string) => {
  const id = Number(value);

  if (!Number.isInteger(id) || id < 1) {
    throw new BadRequestException("id must be a positive integer");
  }

  return id;
};

const parseLikeValue = (body: LikeDateBody): 0 | 1 => {
  const rawValue = body.like ?? body.liked ?? body.value;
  const like = Number(rawValue);

  if (like !== 0 && like !== 1) {
    throw new BadRequestException("like must be 0 or 1");
  }

  return like;
};

const parseDistance = (value: string | number | undefined) => {
  if (value === undefined || value === "") {
    return undefined;
  }

  const distance = Number(value);

  if (!Number.isFinite(distance) || distance <= 0) {
    throw new BadRequestException("minimumDistanceAu must be a positive number");
  }

  return distance;
};

@Controller("api/dates")
export class ApiDatesController {
  constructor(
    private readonly datesService: DatesService,
    private readonly mediaStorageService: DateMediaStorageService
  ) {}

  @Get()
  async listPublishedDates(@Query("maxMonth") maxMonthQuery?: string) {
    const maxMonth = maxMonthQuery ? parseIntegerInRange(maxMonthQuery, 1, 12) : undefined;

    if (maxMonthQuery && maxMonth === undefined) {
      throw new BadRequestException("maxMonth must be from 1 to 12");
    }

    const dates = await this.datesService.getPublishedDates(maxMonth);

    return {
      data: dates.map((date) => serializeAsteroidDate(date, this.datesService))
    };
  }

  @Get("feed")
  async getFirstFeedDate() {
    const date = await this.datesService.getPublishedFeedDate();

    if (!date) {
      throw new NotFoundException("No published dates found");
    }

    return { data: serializeAsteroidDate(date, this.datesService) };
  }

  @Get("feed/:id")
  async getFeedDate(@Param("id") idParam: string, @Query("next") next?: string) {
    const id = parseNumericId(idParam);
    const date = await this.datesService.getPublishedFeedDate({
      id,
      next: next === "true"
    });

    if (!date) {
      throw new NotFoundException("Date not found");
    }

    return { data: serializeAsteroidDate(date, this.datesService) };
  }

  @Get("draft")
  async getCurrentDraft() {
    const draft = await this.datesService.getDraftForCurrentObserver();

    return {
      data: draft ? serializeAsteroidDate(draft, this.datesService) : null
    };
  }

  @Post()
  @UseInterceptors(FileFieldsInterceptor([
    { name: "image", maxCount: 1 },
    { name: "video", maxCount: 1 }
  ]))
  async createDraft(
    @Body() body: CreateDateBody,
    @UploadedFiles() files?: UploadedDateMediaFiles
  ) {
    const designation = requiredText(body.designation, "designation");
    const imageUrl = files?.image?.[0]
      ? await this.mediaStorageService.saveDateMedia("image", files.image[0])
      : undefined;
    const videoUrl = files?.video?.[0]
      ? await this.mediaStorageService.saveDateMedia("video", files.video[0])
      : undefined;
    const draft = await this.datesService.createDraftForCurrentObserver({
      designation,
      imageUrl,
      videoUrl
    });

    return { data: serializeAsteroidDate(draft, this.datesService) };
  }

  @Put("publish")
  async publishDraft(@Body() body: PublishDateBody) {
    const shortDescription = requiredText(body.shortDescription, "shortDescription");
    const approachMonth = parseIntegerInRange(String(body.approachMonth ?? ""), 1, 12);
    const approachDay = parseIntegerInRange(String(body.approachDay ?? ""), 1, 31);

    if (approachMonth === undefined) {
      throw new BadRequestException("approachMonth must be from 1 to 12");
    }

    if (approachDay === undefined) {
      throw new BadRequestException("approachDay must be from 1 to 31");
    }

    const publishedDate = await this.datesService.publishDraftForCurrentObserver({
      shortDescription,
      approachMonth,
      approachDay,
      minimumDistanceAu: parseDistance(body.minimumDistanceAu)
    });

    if (!publishedDate) {
      throw new NotFoundException("Draft not found");
    }

    return { data: serializeAsteroidDate(publishedDate, this.datesService) };
  }

  @Delete(":id")
  async deleteDate(@Param("id") idParam: string) {
    const id = parseNumericId(idParam);
    const deleted = await this.datesService.deleteDateForCurrentObserver(id);

    if (!deleted) {
      throw new NotFoundException("Own non-deleted date not found");
    }

    return { data: { id, status: "deleted" } };
  }

  @Post(":id/like")
  async setLike(@Param("id") idParam: string, @Body() body: LikeDateBody) {
    const id = parseNumericId(idParam);
    const like = parseLikeValue(body);
    const date = await this.datesService.setLikeForCurrentObserver(id, like);

    if (!date) {
      throw new NotFoundException("Published date not found");
    }

    return {
      data: {
        like,
        date: serializeAsteroidDate(date, this.datesService)
      }
    };
  }
}
