export const escapeHtml = (value: unknown) =>
  String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

export const formatDistance = (distanceAu?: number | null) =>
  `${(distanceAu ?? 0).toLocaleString("ru-RU", {
    minimumFractionDigits: 3,
    maximumFractionDigits: 3
  })} а.е.`;

const monthNames = [
  "января",
  "февраля",
  "марта",
  "апреля",
  "мая",
  "июня",
  "июля",
  "августа",
  "сентября",
  "октября",
  "ноября",
  "декабря"
];

export const formatMonthRu = (month?: number | null) =>
  month && month >= 1 && month <= 12 ? monthNames[month - 1] : "";

export const formatTopicDate = (
  month?: number | null,
  day?: number | null,
  year = 2026
) => {
  const monthName = formatMonthRu(month);

  return monthName && day ? `${day} ${monthName} ${year}` : "";
};

export const parseIntegerInRange = (value: string | undefined, min: number, max: number) => {
  const numberValue = Number(value?.trim());

  return Number.isInteger(numberValue) && numberValue >= min && numberValue <= max
    ? numberValue
    : undefined;
};
