import { BadRequestException, Body, Controller, Delete, Get, HttpCode, NotFoundException, Param, ParseIntPipe, Post, Put, Query, UploadedFiles, UseInterceptors } from "@nestjs/common";
import { FileFieldsInterceptor } from "@nestjs/platform-express";
import { ApiBadRequestResponse, ApiBody, ApiConsumes, ApiCookieAuth, ApiCreatedResponse, ApiNotFoundResponse, ApiOkResponse, ApiOperation, ApiParam, ApiQuery, ApiTags, ApiUnauthorizedResponse } from "@nestjs/swagger";
import { Public } from "../auth/session-auth.guard.js";
import { CreateDateDto, LikeDateDto, PublishDateDto } from "../dto/date.dto.js";
import { DateEnvelopeDto, DateListEnvelopeDto, DraftEnvelopeDto, LikeEnvelopeDto } from "../dto/response.dto.js";
import { parseIntegerInRange } from "../lib/format.js";
import { serializeAsteroidDate } from "../serializers/date.serializer.js";
import { DateMediaStorageService, type UploadedDateMediaFile } from "../services/date-media-storage.service.js";
import { DatesService } from "../services/dates.service.js";

type UploadedDateMediaFiles = { image?: UploadedDateMediaFile[]; video?: UploadedDateMediaFile[] };

const positiveId = (id: number) => {
  if (!Number.isSafeInteger(id) || id < 1) throw new BadRequestException("id must be a positive integer");
  return id;
};

@ApiTags("Даты сближения астероидов")
@ApiBadRequestResponse({ description: "Некорректные параметры запроса" })
@Controller("api/dates")
export class ApiDatesController {
  constructor(private readonly datesService: DatesService, private readonly mediaStorageService: DateMediaStorageService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: "Список опубликованных дат", description: "Доступен гостю и пользователю, в том числе с неверной cookie. Черновики и удалённые записи не включаются." })
  @ApiQuery({ name: "maxMonth", required: false, type: Number, example: 7, minimum: 1, maximum: 12, description: "Месяц сближения не позднее указанного" })
  @ApiOkResponse({ type: DateListEnvelopeDto })
  async listPublishedDates(@Query("maxMonth") maxMonthQuery?: string) {
    const maxMonth = maxMonthQuery ? parseIntegerInRange(maxMonthQuery, 1, 12) : undefined;
    if (maxMonthQuery && maxMonth === undefined) throw new BadRequestException("maxMonth must be from 1 to 12");
    const dates = await this.datesService.getPublishedDates(maxMonth);
    return { data: dates.map((date) => serializeAsteroidDate(date, this.datesService)) };
  }

  @Public()
  @Get("feed")
  @ApiOperation({ summary: "Лента астероидов", description: "Без id — первая запись; с id — выбранная запись; с id и next=true — следующая по id с переходом к началу. Только опубликованные даты." })
  @ApiQuery({ name: "id", required: false, type: Number, minimum: 1 })
  @ApiQuery({ name: "next", required: false, type: Boolean, example: true })
  @ApiOkResponse({ type: DateListEnvelopeDto })
  @ApiNotFoundResponse({ description: "Опубликованная дата не найдена" })
  async getFeedDate(@Query("id") idQuery?: string, @Query("next") next?: string) {
    const id = idQuery ? positiveId(Number(idQuery)) : undefined;
    if (next !== undefined && next !== "true" && next !== "false") throw new BadRequestException("next must be true or false");
    const date = await this.datesService.getPublishedFeedDate({ id, next: next === "true" });
    if (!date) throw new NotFoundException("Date not found");
    return { data: [serializeAsteroidDate(date, this.datesService)] };
  }

  @Get("draft")
  @ApiCookieAuth("session")
  @ApiOperation({ summary: "Черновик текущего наблюдателя", description: "Чужие черновики недоступны. При отсутствии собственного черновика data=null." })
  @ApiOkResponse({ type: DraftEnvelopeDto })
  @ApiUnauthorizedResponse({ description: "Требуется вход" })
  async getCurrentDraft() {
    const draft = await this.datesService.getDraftForCurrentObserver();
    return { data: draft ? serializeAsteroidDate(draft, this.datesService) : null };
  }

  @Post()
  @ApiCookieAuth("session")
  @ApiOperation({ summary: "Создать или обновить собственный черновик", description: "Не более одного черновика на пользователя. Автор автоматически берётся из Redis-сессии. Картинка и видео необязательны, до 50 МБ каждый." })
  @ApiConsumes("multipart/form-data")
  @ApiBody({ schema: { type: "object", required: ["designation"], properties: {
    designation: { type: "string", maxLength: 120, example: "2026 LAB4" },
    image: { type: "string", format: "binary", description: "PNG, JPEG, GIF или WebP" },
    video: { type: "string", format: "binary", description: "MP4, WebM или QuickTime" }
  } } })
  @ApiCreatedResponse({ type: DateEnvelopeDto })
  @ApiUnauthorizedResponse({ description: "Требуется вход" })
  @UseInterceptors(FileFieldsInterceptor([{ name: "image", maxCount: 1 }, { name: "video", maxCount: 1 }], {
    limits: { fileSize: 50 * 1024 * 1024, files: 2, fields: 1 },
    fileFilter: (_request, file, callback) => {
      const types = file.fieldname === "image" ? ["image/png", "image/jpeg", "image/gif", "image/webp"] : ["video/mp4", "video/webm", "video/quicktime"];
      if (!types.includes(file.mimetype)) return callback(new BadRequestException(`Unsupported ${file.fieldname} media type`), false);
      callback(null, true);
    }
  }))
  async createDraft(@Body() body: CreateDateDto, @UploadedFiles() files?: UploadedDateMediaFiles) {
    const imageUrl = files?.image?.[0] ? await this.mediaStorageService.saveDateMedia("image", files.image[0]) : undefined;
    const videoUrl = files?.video?.[0] ? await this.mediaStorageService.saveDateMedia("video", files.video[0]) : undefined;
    const draft = await this.datesService.createDraftForCurrentObserver({ designation: body.designation, imageUrl, videoUrl });
    return { data: serializeAsteroidDate(draft, this.datesService) };
  }

  @Put("publish")
  @ApiCookieAuth("session")
  @ApiOperation({ summary: "Опубликовать собственный черновик", description: "Обновляет описание, дату и расстояние, устанавливает status=published и formedAt. Гость получает 401." })
  @ApiOkResponse({ type: DateEnvelopeDto })
  @ApiUnauthorizedResponse({ description: "Требуется вход" })
  @ApiNotFoundResponse({ description: "Собственный черновик не найден" })
  async publishDraft(@Body() body: PublishDateDto) {
    const calendarDate = new Date(Date.UTC(2000, body.approachMonth - 1, body.approachDay));
    if (calendarDate.getUTCMonth() + 1 !== body.approachMonth) throw new BadRequestException("Invalid calendar date");
    const date = await this.datesService.publishDraftForCurrentObserver(body);
    if (!date) throw new NotFoundException("Draft not found");
    return { data: serializeAsteroidDate(date, this.datesService) };
  }

  @Delete(":id")
  @ApiCookieAuth("session")
  @ApiOperation({ summary: "Удалить собственную дату", description: "Логическое удаление: status=deleted. Чужие записи изменять нельзя." })
  @ApiParam({ name: "id", schema: { type: "integer", minimum: 1 } })
  @ApiOkResponse({ schema: { example: { data: { id: 8, isDeleted: 1 } } } })
  @ApiUnauthorizedResponse({ description: "Требуется вход" })
  @ApiNotFoundResponse({ description: "Собственная неудалённая дата не найдена" })
  async deleteDate(@Param("id", ParseIntPipe) id: number) {
    if (!await this.datesService.deleteDateForCurrentObserver(positiveId(id))) throw new NotFoundException("Own non-deleted date not found");
    return { data: { id, isDeleted: 1 } };
  }

  @Post(":id/like")
  @HttpCode(200)
  @ApiCookieAuth("session")
  @ApiOperation({ summary: "Поставить или снять свой лайк", description: "Повторная установка лайка не создаёт дубликатов." })
  @ApiParam({ name: "id", schema: { type: "integer", minimum: 1 } })
  @ApiOkResponse({ type: LikeEnvelopeDto })
  @ApiUnauthorizedResponse({ description: "Требуется вход" })
  @ApiNotFoundResponse({ description: "Опубликованная дата не найдена" })
  async setLike(@Param("id", ParseIntPipe) id: number, @Body() body: LikeDateDto) {
    const like = body.like ?? body.liked ?? body.value;
    if (like !== 0 && like !== 1) throw new BadRequestException("like must be 0 or 1");
    const date = await this.datesService.setLikeForCurrentObserver(positiveId(id), like);
    if (!date) throw new NotFoundException("Published date not found");
    return { data: { like, date: serializeAsteroidDate(date, this.datesService) } };
  }
}
