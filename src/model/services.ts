export type ServiceStatus = "draft" | "published" | "deleted";

export type AsteroidService = {
  id: number;
  status: ServiceStatus;
  title: string;
  designation: string;
  approachDate: string;
  approachDateIso: string;
  distanceAu: number;
  rightAscension: string;
  declination: string;
  velocityKms: number;
  magnitudeH: number;
  description: string;
  imageKey: string;
  videoKey: string;
  imageUrl: string;
  videoUrl: string;
  likes: string[];
};

const minioPublicBaseUrl = process.env.MINIO_PUBLIC_BASE_URL ?? "http://localhost:9000";
const minioBucket = process.env.MINIO_BUCKET ?? "asteroids-lab";

const minioUrl = (key: string) => `${minioPublicBaseUrl}/${minioBucket}/${key}`;

const makeLikes = (count: number) =>
  Array.from({ length: count }, (_, index) => `u-${String(index + 1).padStart(3, "0")}`);

const feedTitle = "Минимальное расстояние астероида до Земли";

export const asteroidServices: AsteroidService[] = [
  {
    id: 1001,
    status: "published",
    title: feedTitle,
    designation: "2026 KJ",
    approachDate: "12 мая 2026",
    approachDateIso: "2026-05-12",
    distanceAu: 0.02231,
    rightAscension: "15ч 34м 12с",
    declination: "+12° 45' 30\"",
    velocityKms: 8.616,
    magnitudeH: 26.02,
    description:
      "Астероид 2026 KJ проходит около Земли 12 мая 2026. По заданным координатам на небесной сфере минимальное расстояние составляет 0,022 а.е.",
    imageKey: "asteroid-hero.png",
    videoKey: "asteroid-day-12.mp4",
    imageUrl: minioUrl("asteroid-hero.png"),
    videoUrl: minioUrl("asteroid-day-12.mp4"),
    likes: makeLikes(128)
  },
  {
    id: 1002,
    status: "published",
    title: feedTitle,
    designation: "2026 KK3",
    approachDate: "15 мая 2026",
    approachDateIso: "2026-05-15",
    distanceAu: 0.04297,
    rightAscension: "16ч 05м 41с",
    declination: "+08° 14' 08\"",
    velocityKms: 7.161,
    magnitudeH: 25.35,
    description:
      "Астероид 2026 KK3 выбран для расчета на 15 мая 2026. Минимальное расстояние до Земли по координатам и дате расчета равно 0,043 а.е.",
    imageKey: "asteroid-day-15.png",
    videoKey: "asteroid-day-15.mp4",
    imageUrl: minioUrl("asteroid-day-15.png"),
    videoUrl: minioUrl("asteroid-day-15.mp4"),
    likes: makeLikes(97)
  },
  {
    id: 1003,
    status: "published",
    title: feedTitle,
    designation: "2026 KR",
    approachDate: "18 мая 2026",
    approachDateIso: "2026-05-18",
    distanceAu: 0.01385,
    rightAscension: "17ч 22м 09с",
    declination: "-03° 20' 11\"",
    velocityKms: 6.319,
    magnitudeH: 27.74,
    description:
      "Астероид 2026 KR сближается с Землей 18 мая 2026. Расчет показывает минимальное расстояние 0,014 а.е., поэтому день добавлен в список наблюдений.",
    imageKey: "asteroid-day-18.png",
    videoKey: "asteroid-day-18.mp4",
    imageUrl: minioUrl("asteroid-day-18.png"),
    videoUrl: minioUrl("asteroid-day-18.mp4"),
    likes: makeLikes(64)
  },
  {
    id: 1004,
    status: "published",
    title: feedTitle,
    designation: "2026 JD4",
    approachDate: "21 мая 2026",
    approachDateIso: "2026-05-21",
    distanceAu: 0.01088,
    rightAscension: "18ч 10м 27с",
    declination: "+21° 03' 45\"",
    velocityKms: 24.06,
    magnitudeH: 24.91,
    description:
      "Астероид 2026 JD4 имеет высокую относительную скорость. Для 21 мая 2026 минимальное расстояние до Земли составляет 0,011 а.е.",
    imageKey: "asteroid-day-21.png",
    videoKey: "asteroid-day-21.mp4",
    imageUrl: minioUrl("asteroid-day-21.png"),
    videoUrl: minioUrl("asteroid-day-21.mp4"),
    likes: makeLikes(53)
  },
  {
    id: 1005,
    status: "published",
    title: feedTitle,
    designation: "2026 HF4",
    approachDate: "24 мая 2026",
    approachDateIso: "2026-05-24",
    distanceAu: 0.06819,
    rightAscension: "19ч 02м 33с",
    declination: "-11° 47' 02\"",
    velocityKms: 7.441,
    magnitudeH: 24.8,
    description:
      "Астероид 2026 HF4 рассчитан для 24 мая 2026. Его минимальное расстояние до Земли больше, чем у предыдущих дней: 0,068 а.е.",
    imageKey: "asteroid-day-24.png",
    videoKey: "asteroid-day-24.mp4",
    imageUrl: minioUrl("asteroid-day-24.png"),
    videoUrl: minioUrl("asteroid-day-24.mp4"),
    likes: makeLikes(42)
  },
  {
    id: 1006,
    status: "published",
    title: feedTitle,
    designation: "2026 KL2",
    approachDate: "27 мая 2026",
    approachDateIso: "2026-05-27",
    distanceAu: 0.00693,
    rightAscension: "20ч 48м 05с",
    declination: "+04° 18' 51\"",
    velocityKms: 8.267,
    magnitudeH: 28.71,
    description:
      "Астероид 2026 KL2 проходит ближе остальных опубликованных дней. На 27 мая 2026 расчетное минимальное расстояние равно 0,007 а.е.",
    imageKey: "asteroid-day-27.png",
    videoKey: "asteroid-day-27.mp4",
    imageUrl: minioUrl("asteroid-day-27.png"),
    videoUrl: minioUrl("asteroid-day-27.mp4"),
    likes: makeLikes(38)
  },
  {
    id: 1901,
    status: "draft",
    title: "Заявка на расчет",
    designation: "2026 KJ",
    approachDate: "12 мая 2026",
    approachDateIso: "2026-05-12",
    distanceAu: 0.023,
    rightAscension: "15ч 34м 12с",
    declination: "+12° 45' 30\"",
    velocityKms: 8.616,
    magnitudeH: 26.02,
    description:
      "Черновик заявки на расчет минимального расстояния астероида 2026 KJ до Земли по координатам на небесной сфере.",
    imageKey: "asteroid-hero.png",
    videoKey: "asteroid-day-12.mp4",
    imageUrl: minioUrl("asteroid-hero.png"),
    videoUrl: minioUrl("asteroid-day-12.mp4"),
    likes: []
  },
  {
    id: 1999,
    status: "deleted",
    title: feedTitle,
    designation: "2026 XX",
    approachDate: "30 мая 2026",
    approachDateIso: "2026-05-30",
    distanceAu: 0.11,
    rightAscension: "00ч 00м 00с",
    declination: "+00° 00' 00\"",
    velocityKms: 0,
    magnitudeH: 0,
    description: "Удаленная услуга не отображается в интерфейсе.",
    imageKey: "asteroid-day-27.png",
    videoKey: "asteroid-day-27.mp4",
    imageUrl: minioUrl("asteroid-day-27.png"),
    videoUrl: minioUrl("asteroid-day-27.mp4"),
    likes: makeLikes(1)
  }
];
