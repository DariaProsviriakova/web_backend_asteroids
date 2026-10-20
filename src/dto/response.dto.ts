import { ApiProperty } from "@nestjs/swagger";

export class ObserverDto {
  @ApiProperty({ example: 1 }) id!: number;
  @ApiProperty({ example: "Дарья Просвиракова" }) fullName!: string;
  @ApiProperty({ example: "daria@example.com" }) email!: string;
}
export class ObserverEnvelopeDto {
  @ApiProperty({ type: ObserverDto }) data!: ObserverDto;
}
export class AuthDataDto {
  @ApiProperty({ example: 1 }) authenticated!: number;
  @ApiProperty({ type: ObserverDto }) observer!: ObserverDto;
}
export class AuthEnvelopeDto {
  @ApiProperty({ type: AuthDataDto }) data!: AuthDataDto;
}
export class AsteroidDateDto {
  @ApiProperty({ example: 2 }) id!: number;
  @ApiProperty({ example: "2026 KJ" }) designation!: string;
  @ApiProperty({ type: String, example: "Сближение астероида с Землёй", nullable: true }) shortDescription!: string | null;
  @ApiProperty({ enum: ["draft", "published", "deleted"] }) status!: string;
  @ApiProperty({ example: 1, description: "Автор из сессии, не задаётся клиентом" }) creatorId!: number;
  @ApiProperty({ type: String, format: "date-time" }) createdAt!: string;
  @ApiProperty({ type: String, format: "date-time", nullable: true }) formedAt!: string | null;
  @ApiProperty({ example: "/uploads/dates/date-image.png" }) imageUrl!: string;
  @ApiProperty({ example: "/uploads/dates/date-video.mp4" }) videoUrl!: string;
  @ApiProperty({ type: Number, example: 5, nullable: true }) approachMonth!: number | null;
  @ApiProperty({ type: Number, example: 12, nullable: true }) approachDay!: number | null;
  @ApiProperty({ type: Number, example: 0.023, nullable: true }) minimumDistanceAu!: number | null;
  @ApiProperty({ example: 3 }) likesCount!: number;
  @ApiProperty({ enum: [0, 1], description: "1, если текущий пользователь — автор; для гостя 0" }) isCreator!: number;
  @ApiProperty({ enum: [0, 1], description: "Лайк текущего пользователя; для гостя 0" }) isLiked!: number;
}
export class DateEnvelopeDto {
  @ApiProperty({ type: AsteroidDateDto }) data!: AsteroidDateDto;
}
export class DraftEnvelopeDto {
  @ApiProperty({ type: AsteroidDateDto, nullable: true }) data!: AsteroidDateDto | null;
}
export class DateListEnvelopeDto {
  @ApiProperty({ type: [AsteroidDateDto] }) data!: AsteroidDateDto[];
}
export class LikeDataDto {
  @ApiProperty({ enum: [0, 1] }) like!: number;
  @ApiProperty({ type: AsteroidDateDto }) date!: AsteroidDateDto;
}
export class LikeEnvelopeDto {
  @ApiProperty({ type: LikeDataDto }) data!: LikeDataDto;
}
