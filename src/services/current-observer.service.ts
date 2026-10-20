import { Inject, Injectable, Scope, UnauthorizedException } from "@nestjs/common";
import { REQUEST } from "@nestjs/core";
import type { Request } from "express";

export type CurrentObserver = { id: number; email: string; fullName: string };

declare module "express-session" {
  interface SessionData { observer?: CurrentObserver; }
}

@Injectable({ scope: Scope.REQUEST })
export class CurrentObserverService {
  constructor(@Inject(REQUEST) private readonly request: Request) {}

  get(): CurrentObserver | undefined { return this.request.session?.observer; }

  require(): CurrentObserver {
    const observer = this.get();
    if (!observer) throw new UnauthorizedException("Authentication required");
    return observer;
  }
}
