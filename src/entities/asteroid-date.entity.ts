import {
  Check,
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn
} from "typeorm";
import type { Relation } from "typeorm";
import type { ValueTransformer } from "typeorm";

import { ObserverDateLike } from "./observer-date-like.entity.js";
import { Observer } from "./observer.entity.js";

export type DateStatus = "draft" | "published" | "deleted";

const nullableNumber: ValueTransformer = {
  to: (value?: number | null) => value ?? null,
  from: (value?: string | null) => (value === null || value === undefined ? null : Number(value))
};

@Entity({ name: "asteroid_dates" })
@Check("chk_asteroid_date_status", "\"status\" IN ('draft', 'published', 'deleted')")
@Index("uq_one_draft_date_per_observer", ["creatorId"], {
  unique: true,
  where: "\"status\" = 'draft'"
})
export class AsteroidDate {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ length: 120 })
  designation!: string;

  @Column({ name: "short_description", type: "varchar", length: 700, nullable: true })
  shortDescription!: string | null;

  @Column({ length: 16, default: "draft" })
  status!: DateStatus;

  @Column({ name: "image_url", type: "varchar", length: 500, nullable: true })
  imageUrl!: string | null;

  @Column({ name: "video_url", type: "varchar", length: 500, nullable: true })
  videoUrl!: string | null;

  @Column({ name: "approach_month", type: "smallint", nullable: true })
  approachMonth!: number | null;

  @Column({ name: "approach_day", type: "smallint", nullable: true })
  approachDay!: number | null;

  @Column({
    name: "minimum_distance_au",
    type: "numeric",
    precision: 8,
    scale: 5,
    nullable: true,
    transformer: nullableNumber
  })
  minimumDistanceAu!: number | null;

  @CreateDateColumn({ name: "created_at", type: "timestamp" })
  createdAt!: Date;

  @Column({ name: "formed_at", type: "timestamp", nullable: true })
  formedAt!: Date | null;

  @Column({ name: "creator_id" })
  creatorId!: number;

  @ManyToOne(() => Observer, (observer) => observer.dates, { onDelete: "RESTRICT" })
  @JoinColumn({ name: "creator_id" })
  creator!: Relation<Observer>;

  @OneToMany(() => ObserverDateLike, (like) => like.asteroidDate)
  likes!: Relation<ObserverDateLike[]>;
}
