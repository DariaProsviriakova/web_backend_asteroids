import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Transform, Type } from "class-transformer";
import { IsIn, IsInt, IsNumber, IsOptional, IsString, Max, MaxLength, Min, MinLength } from "class-validator";

export class CreateDateDto {
  @ApiProperty({ example: "2026 LAB4", maxLength: 120 })
  @Transform(({ value }) => typeof value === "string" ? value.trim() : value)
  @IsString() @MinLength(1) @MaxLength(120)
  designation!: string;
}
export class PublishDateDto {
  @ApiProperty({ example: "Астероид пройдёт рядом с Землёй 18 октября.", maxLength: 700 })
  @Transform(({ value }) => typeof value === "string" ? value.trim() : value)
  @IsString() @MinLength(1) @MaxLength(700)
  shortDescription!: string;

  @ApiProperty({ example: 10, minimum: 1, maximum: 12 })
  @Type(() => Number) @IsInt() @Min(1) @Max(12)
  approachMonth!: number;

  @ApiProperty({ example: 18, minimum: 1, maximum: 31 })
  @Type(() => Number) @IsInt() @Min(1) @Max(31)
  approachDay!: number;

  @ApiPropertyOptional({ example: 0.023, minimum: 0.00001, maximum: 999.99999 })
  @IsOptional() @Type(() => Number) @IsNumber({ maxDecimalPlaces: 5 }) @Min(0.00001) @Max(999.99999)
  minimumDistanceAu?: number;
}
export class LikeDateDto {
  @ApiPropertyOptional({ enum: [0, 1], example: 1, description: "1 — поставить, 0 — снять; требуется like, liked или value" })
  @IsOptional() @Type(() => Number) @IsIn([0, 1])
  like?: number;

  @ApiPropertyOptional({ enum: [0, 1], description: "Альтернативное имя поля like" })
  @IsOptional() @Type(() => Number) @IsIn([0, 1])
  liked?: number;

  @ApiPropertyOptional({ enum: [0, 1], description: "Альтернативное имя поля like" })
  @IsOptional() @Type(() => Number) @IsIn([0, 1])
  value?: number;
}
