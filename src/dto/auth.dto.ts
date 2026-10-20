import { Transform } from "class-transformer";
import { IsEmail, IsString, MaxLength, MinLength } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class AuthUserDto {
  @ApiProperty({ example: "daria@example.com", maxLength: 120 })
  @Transform(({ value }) => typeof value === "string" ? value.trim().toLowerCase() : value)
  @IsEmail()
  @MaxLength(120)
  email!: string;

  @ApiProperty({ example: "AsteroidLab4!", minLength: 8, maxLength: 128, format: "password" })
  @IsString()
  @MinLength(8)
  @MaxLength(128)
  password!: string;
}

export class RegisterUserDto extends AuthUserDto {
  @ApiProperty({ example: "Дарья Просвиракова", minLength: 1, maxLength: 80 })
  @Transform(({ value }) => typeof value === "string" ? value.trim() : value)
  @IsString()
  @MinLength(1)
  @MaxLength(80)
  fullName!: string;
}
