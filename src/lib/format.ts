import type { AsteroidDate } from "../model/dates.js";

export const escapeHtml = (value: unknown) =>
  String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

export const formatDistance = (distanceAu: number) =>
  `${distanceAu.toLocaleString("ru-RU", {
    minimumFractionDigits: 3,
    maximumFractionDigits: 3
  })} а.е.`;

export const formatVelocity = (velocityKms: number) =>
  `${velocityKms.toLocaleString("ru-RU", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1
  })} км/с`;

export const likeCount = (date: AsteroidDate) => date.likes.length;

export const normalizeSearch = (value: string) =>
  value.trim().toLowerCase().replaceAll("ё", "е");
