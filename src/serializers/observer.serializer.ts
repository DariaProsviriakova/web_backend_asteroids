import type { Observer } from "../entities/observer.entity.js";

export const serializeObserver = (observer: Observer) => ({
  id: observer.id,
  fullName: observer.fullName,
  email: observer.email
});
