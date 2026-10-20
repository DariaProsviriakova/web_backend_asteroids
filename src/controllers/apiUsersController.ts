import { Body, Controller, HttpCode, Post, Req, Res } from "@nestjs/common";
import { ApiBadRequestResponse, ApiConflictResponse, ApiCookieAuth, ApiCreatedResponse, ApiOkResponse, ApiOperation, ApiTags, ApiUnauthorizedResponse } from "@nestjs/swagger";
import type { Request, Response } from "express";
import { AuthService } from "../auth/auth.service.js";
import { SESSION_COOKIE_NAME } from "../auth/redis-session.service.js";
import { Public } from "../auth/session-auth.guard.js";
import { AuthUserDto, RegisterUserDto } from "../dto/auth.dto.js";
import { AuthEnvelopeDto, ObserverEnvelopeDto } from "../dto/response.dto.js";
import { serializeObserver } from "../serializers/observer.serializer.js";

@ApiTags("Пользователи")
@Controller("api/users")
export class ApiUsersController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post("register")
  @ApiOperation({ summary: "Регистрация наблюдателя", description: "Создаёт пользователя с хешем пароля. Для входа вызовите POST /api/users/auth." })
  @ApiCreatedResponse({ description: "Пользователь создан", type: ObserverEnvelopeDto })
  @ApiBadRequestResponse({ description: "Некорректные поля; пароль должен содержать 8–128 символов" })
  @ApiConflictResponse({ description: "Email уже зарегистрирован" })
  async register(@Body() body: RegisterUserDto) {
    const observer = await this.authService.register(body.fullName, body.email, body.password);
    return { data: serializeObserver(observer) };
  }

  @Public()
  @Post("auth")
  @HttpCode(200)
  @ApiOperation({ summary: "Вход по email и паролю", description: "Создаёт сессию в Redis и устанавливает HttpOnly cookie asteroids.sid. Swagger автоматически отправляет cookie с этого же адреса. Для Postman скопируйте cookie из Application браузера в заголовок Cookie: asteroids.sid=... . Ручной ввод Cookie через Authorize в Swagger UI не требуется." })
  @ApiOkResponse({ description: "Вход выполнен; Set-Cookie: asteroids.sid=...", type: AuthEnvelopeDto })
  @ApiBadRequestResponse({ description: "Некорректные поля" })
  @ApiUnauthorizedResponse({ description: "Неверный email или пароль" })
  async authenticate(@Body() body: AuthUserDto, @Req() request: Request) {
    const observer = await this.authService.authenticate(body.email, body.password);
    await new Promise<void>((resolve, reject) => request.session.regenerate((error) => error ? reject(error) : resolve()));
    request.session.observer = serializeObserver(observer);
    await new Promise<void>((resolve, reject) => request.session.save((error) => error ? reject(error) : resolve()));
    return { data: { authenticated: 1, observer: serializeObserver(observer) } };
  }

  @Post("logout")
  @HttpCode(200)
  @ApiCookieAuth("session")
  @ApiOperation({ summary: "Выход", description: "Удаляет текущую сессию из Redis и cookie из браузера. Повторное использование старой cookie даёт 401." })
  @ApiOkResponse({ description: "Сессия удалена", schema: { example: { data: { authenticated: 0 } } } })
  @ApiUnauthorizedResponse({ description: "Сессия отсутствует или истекла" })
  async logout(@Req() request: Request, @Res({ passthrough: true }) response: Response) {
    await new Promise<void>((resolve, reject) => request.session.destroy((error) => error ? reject(error) : resolve()));
    response.clearCookie(SESSION_COOKIE_NAME, { path: "/", httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production" });
    return { data: { authenticated: 0 } };
  }
}
