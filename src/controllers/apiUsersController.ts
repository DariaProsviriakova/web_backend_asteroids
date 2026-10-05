import { BadRequestException, Body, ConflictException, Controller, Post } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { Observer } from "../entities/observer.entity.js";
import { serializeObserver } from "../serializers/observer.serializer.js";
import { getCurrentObserver } from "../services/current-observer.service.js";

type RegisterUserBody = {
  fullName?: string;
  email?: string;
};

type AuthUserBody = {
  email?: string;
};

const requiredText = (value: unknown, fieldName: string) => {
  const text = typeof value === "string" ? value.trim() : "";

  if (!text) {
    throw new BadRequestException(`${fieldName} is required`);
  }

  return text;
};

@Controller("api/users")
export class ApiUsersController {
  constructor(
    @InjectRepository(Observer)
    private readonly observersRepository: Repository<Observer>
  ) {}

  @Post("register")
  async register(@Body() body: RegisterUserBody) {
    const fullName = requiredText(body.fullName, "fullName");
    const email = requiredText(body.email, "email").toLowerCase();
    const existingObserver = await this.observersRepository.findOne({ where: { email } });

    if (existingObserver) {
      throw new ConflictException("User with this email already exists");
    }

    const observer = await this.observersRepository.save(
      this.observersRepository.create({ fullName, email })
    );

    return { data: serializeObserver(observer) };
  }

  @Post("auth")
  async authenticate(@Body() body: AuthUserBody) {
    return {
      data: {
        authenticated: 1,
        email: body.email ?? getCurrentObserver().email,
        message: "Authentication stub for lab 4"
      }
    };
  }

  @Post("logout")
  async logout() {
    return {
      data: {
        authenticated: 0,
        message: "Logout stub for lab 4"
      }
    };
  }
}
