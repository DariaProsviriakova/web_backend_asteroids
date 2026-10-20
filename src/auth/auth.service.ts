import { ConflictException, Injectable, UnauthorizedException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Observer } from "../entities/observer.entity.js";
import { hashPassword, verifyPassword } from "./password.js";

@Injectable()
export class AuthService {
  private readonly dummyHash = hashPassword("invalid-user-timing-placeholder");
  constructor(@InjectRepository(Observer) private readonly observers: Repository<Observer>) {}

  async register(fullName: string, email: string, password: string): Promise<Observer> {
    const passwordHash = await hashPassword(password);
    try {
      return await this.observers.save(this.observers.create({ fullName, email, passwordHash }));
    } catch (error) {
      if ((error as { driverError?: { code?: string } }).driverError?.code === "23505") {
        throw new ConflictException("User with this email already exists");
      }
      throw error;
    }
  }

  async authenticate(email: string, password: string): Promise<Observer> {
    const observer = await this.observers.createQueryBuilder("observer")
      .addSelect("observer.passwordHash").where("observer.email = :email", { email }).getOne();
    const valid = await verifyPassword(password, observer?.passwordHash ?? await this.dummyHash);
    if (!observer || !observer.passwordHash || !valid) throw new UnauthorizedException("Invalid email or password");
    return observer;
  }
}
