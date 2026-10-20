import { Injectable } from "@nestjs/common";
import type { CurrentObserver } from "../services/current-observer.service.js";

const observer: CurrentObserver = Object.freeze({
  id: 1, email: "daria@example.com", fullName: "Дарья Просвирякова"
});

export const getCurrentObserver = (): CurrentObserver => observer;

@Injectable()
export class Lab3CurrentObserverService {
  get(): CurrentObserver { return getCurrentObserver(); }
  require(): CurrentObserver { return getCurrentObserver(); }
}
