import { Injectable, OnApplicationBootstrap } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { AsteroidDate } from "../entities/asteroid-date.entity.js";
import { ObserverDateLike } from "../entities/observer-date-like.entity.js";
import { Observer } from "../entities/observer.entity.js";

const minioPublicBaseUrl = process.env.MINIO_PUBLIC_BASE_URL ?? "http://localhost:9000";
const minioBucket = process.env.MINIO_BUCKET ?? "asteroids-lab";

const minioUrl = (key: string) => `${minioPublicBaseUrl}/${minioBucket}/${key}`;

const publishedDates = [
  {
    designation: "2026 KJ",
    shortDescription:
      "2026 KJ пройдет 12 мая 2026. Расчетное минимальное расстояние до Земли — 0,022 а.е.",
    approachMonth: 5,
    approachDay: 12,
    minimumDistanceAu: 0.02231,
    imageUrl: minioUrl("asteroid-hero.png"),
    videoUrl: minioUrl("asteroid-day-12.mp4"),
    likesCount: 128
  },
  {
    designation: "2026 KK3",
    shortDescription:
      "2026 KK3 пройдет 15 мая 2026. Расчетное минимальное расстояние до Земли — 0,043 а.е.",
    approachMonth: 5,
    approachDay: 15,
    minimumDistanceAu: 0.04297,
    imageUrl: minioUrl("asteroid-day-15.png"),
    videoUrl: minioUrl("asteroid-day-15.mp4"),
    likesCount: 97
  },
  {
    designation: "2026 KR",
    shortDescription:
      "2026 KR пройдет 18 июня 2026. Расчетное минимальное расстояние до Земли — 0,014 а.е.",
    approachMonth: 6,
    approachDay: 18,
    minimumDistanceAu: 0.01385,
    imageUrl: minioUrl("asteroid-day-18.png"),
    videoUrl: minioUrl("asteroid-day-18.mp4"),
    likesCount: 64
  },
  {
    designation: "2026 JD4",
    shortDescription:
      "2026 JD4 пройдет 21 июня 2026. Расчетное минимальное расстояние до Земли — 0,011 а.е.",
    approachMonth: 6,
    approachDay: 21,
    minimumDistanceAu: 0.01088,
    imageUrl: minioUrl("asteroid-day-21.png"),
    videoUrl: minioUrl("asteroid-day-21.mp4"),
    likesCount: 53
  },
  {
    designation: "2026 HF4",
    shortDescription:
      "2026 HF4 пройдет 24 июля 2026. Расчетное минимальное расстояние до Земли — 0,068 а.е.",
    approachMonth: 7,
    approachDay: 24,
    minimumDistanceAu: 0.06819,
    imageUrl: minioUrl("asteroid-day-24.png"),
    videoUrl: minioUrl("asteroid-day-24.mp4"),
    likesCount: 42
  },
  {
    designation: "2026 KL2",
    shortDescription:
      "2026 KL2 пройдет 27 июля 2026. Расчетное минимальное расстояние до Земли — 0,007 а.е.",
    approachMonth: 7,
    approachDay: 27,
    minimumDistanceAu: 0.00693,
    imageUrl: minioUrl("asteroid-day-27.png"),
    videoUrl: minioUrl("asteroid-day-27.mp4"),
    likesCount: 38
  }
];

@Injectable()
export class DateSeedService implements OnApplicationBootstrap {
  constructor(
    @InjectRepository(Observer)
    private readonly observersRepository: Repository<Observer>,
    @InjectRepository(AsteroidDate)
    private readonly datesRepository: Repository<AsteroidDate>,
    @InjectRepository(ObserverDateLike)
    private readonly likesRepository: Repository<ObserverDateLike>
  ) {}

  async onApplicationBootstrap() {
    const observersCount = await this.observersRepository.count();
    const datesCount = await this.datesRepository.count();

    const observers = observersCount
      ? await this.observersRepository.find({ order: { id: "ASC" } })
      : await this.observersRepository.save(
          Array.from({ length: 140 }, (_, index) =>
            this.observersRepository.create({
              fullName: index === 0 ? "Дарья Просвиракова" : `Наблюдатель ${index + 1}`,
              email:
                index === 0
                  ? "daria@example.com"
                  : `observer-${String(index + 1).padStart(3, "0")}@example.com`
            })
          )
        );

    if (datesCount > 0) {
      const dates = await this.datesRepository.find();
      const knownDays = new Map(
        publishedDates.map((date) => [date.designation, {
          approachMonth: date.approachMonth,
          approachDay: date.approachDay,
          minimumDistanceAu: date.minimumDistanceAu,
          shortDescription: date.shortDescription
        }])
      );

      for (const date of dates) {
        const knownDate = knownDays.get(date.designation);

        if (
          date.approachMonth === null ||
          date.approachDay === null ||
          date.minimumDistanceAu === null
        ) {
          date.approachMonth = knownDate?.approachMonth ?? 5;
          date.approachDay = knownDate?.approachDay ?? 12;
          date.minimumDistanceAu = knownDate?.minimumDistanceAu ?? 0.023;
          if (knownDate?.shortDescription) {
            date.shortDescription = knownDate.shortDescription;
          }
          await this.datesRepository.save(date);
        }
      }

      return;
    }

    const currentObserver = observers[0];
    const savedDates = await this.datesRepository.save([
      this.datesRepository.create({
        designation: "2026 KJ",
        shortDescription:
          "Для 2026 KJ нужно проверить дату и минимальное расстояние до Земли по координатам.",
        status: "draft",
        imageUrl: null,
        videoUrl: null,
        approachMonth: 5,
        approachDay: 12,
        minimumDistanceAu: 0.023,
        formedAt: null,
        creatorId: currentObserver.id
      }),
      ...publishedDates.map((date, index) =>
        this.datesRepository.create({
          designation: date.designation,
          shortDescription: date.shortDescription,
          approachMonth: date.approachMonth,
          approachDay: date.approachDay,
          minimumDistanceAu: date.minimumDistanceAu,
          imageUrl: date.imageUrl,
          videoUrl: date.videoUrl,
          status: "published",
          formedAt: new Date(`2026-05-${String(12 + index * 3).padStart(2, "0")}T10:00:00Z`),
          creatorId: observers[index + 1]?.id ?? currentObserver.id
        })
      ),
      this.datesRepository.create({
        designation: "2026 XX",
        shortDescription:
          "Удаленная запись оставлена в БД для демонстрации логического удаления через статус.",
        status: "deleted",
        imageUrl: minioUrl("asteroid-day-27.png"),
        videoUrl: minioUrl("asteroid-day-27.mp4"),
        approachMonth: 5,
        approachDay: 30,
        minimumDistanceAu: 0.11,
        formedAt: new Date("2026-05-30T10:00:00Z"),
        creatorId: observers[7]?.id ?? currentObserver.id
      })
    ]);

    const savedPublishedDates = savedDates.filter((date) => date.status === "published");

    await this.likesRepository.save(
      savedPublishedDates.flatMap((date, dateIndex) =>
        observers.slice(0, publishedDates[dateIndex].likesCount).map((observer) =>
          this.likesRepository.create({
            observerId: observer.id,
            asteroidDateId: date.id
          })
        )
      )
    );
  }
}
