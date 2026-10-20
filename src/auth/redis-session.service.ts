import { Injectable, Logger, OnApplicationShutdown } from "@nestjs/common";
import { RedisStore } from "connect-redis";
import session from "express-session";
import { createClient } from "redis";

export const SESSION_COOKIE_NAME = "asteroids.sid";
export const SESSION_PREFIX = "asteroids:sess:";

@Injectable()
export class RedisSessionService implements OnApplicationShutdown {
  private readonly logger = new Logger(RedisSessionService.name);
  private readonly client = createClient({
    url: process.env.REDIS_URL ?? "redis://localhost:6379",
    socket: { connectTimeout: 5000, reconnectStrategy: false }
  });

  async middleware() {
    const production = process.env.NODE_ENV === "production";
    const secret = process.env.SESSION_SECRET ?? (production ? "" : "asteroids-local-development-secret-change-me");
    if (secret.length < 32) throw new Error("SESSION_SECRET must contain at least 32 characters");
    const ttlSeconds = Number(process.env.SESSION_TTL_SECONDS ?? 86400);
    if (!Number.isSafeInteger(ttlSeconds) || ttlSeconds < 1) throw new Error("SESSION_TTL_SECONDS must be a positive integer");
    this.client.on("error", (error) => this.logger.error("Redis session storage unavailable", error));
    await this.client.connect();
    return session({
      name: SESSION_COOKIE_NAME,
      secret,
      store: new RedisStore({ client: this.client, prefix: SESSION_PREFIX, disableTouch: true }),
      resave: false,
      saveUninitialized: false,
      cookie: { httpOnly: true, sameSite: "lax", secure: production, maxAge: ttlSeconds * 1000 }
    });
  }

  async onApplicationShutdown() {
    if (this.client.isOpen) await this.client.quit();
  }
}
