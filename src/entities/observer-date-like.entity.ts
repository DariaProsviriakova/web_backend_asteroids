import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique
} from "typeorm";
import type { Relation } from "typeorm";

import { AsteroidDate } from "./asteroid-date.entity.js";
import { Observer } from "./observer.entity.js";

@Entity({ name: "observer_date_likes" })
@Unique("uq_observer_date_like", ["observerId", "asteroidDateId"])
export class ObserverDateLike {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: "observer_id" })
  observerId!: number;

  @Column({ name: "asteroid_date_id" })
  asteroidDateId!: number;

  @ManyToOne(() => Observer, (observer) => observer.likes, { onDelete: "RESTRICT" })
  @JoinColumn({ name: "observer_id" })
  observer!: Relation<Observer>;

  @ManyToOne(() => AsteroidDate, (date) => date.likes, { onDelete: "RESTRICT" })
  @JoinColumn({ name: "asteroid_date_id" })
  asteroidDate!: Relation<AsteroidDate>;
}
