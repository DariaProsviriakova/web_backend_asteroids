import { Body, ConflictException, Controller, HttpCode, Post } from "@nestjs/common";
import { ApiBadRequestResponse, ApiConflictResponse, ApiCreatedResponse, ApiOkResponse, ApiOperation, ApiProperty, ApiPropertyOptional, ApiTags } from "@nestjs/swagger";
import { InjectRepository } from "@nestjs/typeorm";
import { Transform } from "class-transformer";
import { IsEmail, IsOptional, IsString, MaxLength, MinLength } from "class-validator";
import { Repository } from "typeorm";
import { Observer } from "../entities/observer.entity.js";
import { ObserverEnvelopeDto } from "../dto/response.dto.js";
import { serializeObserver } from "../serializers/observer.serializer.js";
import { getCurrentObserver } from "./current-observer.js";

class Lab3RegisterDto {
  @ApiProperty({ example: "Наблюдатель ЛР3", maxLength: 80 })
  @Transform(({ value }) => typeof value === "string" ? value.trim() : value)
  @IsString() @MinLength(1) @MaxLength(80)
  fullName!: string;

  @ApiProperty({ example: "lab3-observer@example.com", maxLength: 120 })
  @Transform(({ value }) => typeof value === "string" ? value.trim().toLowerCase() : value)
  @IsEmail() @MaxLength(120)
  email!: string;
}

class Lab3AuthDto {
  @ApiPropertyOptional({ example: "daria@example.com", description: "Демонстрационные данные: заглушка не меняет текущего пользователя" })
  @IsOptional() @IsEmail()
  email?: string;
}

@ApiTags("Домен пользователя — ЛР3")
@Controller("api/users")
export class Lab3UsersController {
  constructor(@InjectRepository(Observer) private readonly observers: Repository<Observer>) {}

  @Post("register")
  @ApiOperation({ summary: "Регистрация наблюдателя", description: "ЛР3: сохраняет имя и email в БД. Настоящая аутентификация реализована отдельно в ЛР4." })
  @ApiCreatedResponse({ type: ObserverEnvelopeDto })
  @ApiConflictResponse({ description: "Email уже зарегистрирован" })
  @ApiBadRequestResponse({ description: "Некорректные поля" })
  async register(@Body() body: Lab3RegisterDto) {
    try {
      const observer = await this.observers.save(this.observers.create({ ...body, passwordHash: null }));
      return { data: serializeObserver(observer) };
    } catch (error) {
      if ((error as { driverError?: { code?: string } }).driverError?.code === "23505") {
        throw new ConflictException("User with this email already exists");
      }
      throw error;
    }
  }

  @Post("auth")
  @HttpCode(200)
  @ApiOperation({ summary: "Аутентификация — заглушка для ЛР4", description: "Не проверяет пароль, не создаёт cookie или сессию и не меняет фиксированного пользователя ЛР3." })
  @ApiOkResponse({ schema: { example: { data: { authenticated: 1, stub: true, observer: getCurrentObserver() } } } })
  authenticate(@Body() _body: Lab3AuthDto) {
    return { data: { authenticated: 1, stub: true, observer: getCurrentObserver() } };
  }

  @Post("logout")
  @HttpCode(200)
  @ApiOperation({ summary: "Деавторизация — заглушка для ЛР4", description: "Демонстрационный ответ. Фиксированный пользователь ЛР3 сохраняется." })
  @ApiOkResponse({ schema: { example: { data: { authenticated: 0, stub: true } } } })
  logout() { return { data: { authenticated: 0, stub: true } }; }
}
