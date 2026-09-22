import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import type { Relation } from "typeorm";

import { AsteroidDate } from "./asteroid-date.entity.js";
import { ObserverDateLike } from "./observer-date-like.entity.js";

@Entity({ name: "observers" })
export class Observer {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: "full_name", length: 80 })
  fullName!: string;

  @Column({ length: 120, unique: true })
  email!: string;

  @OneToMany(() => AsteroidDate, (date) => date.creator)
  dates!: Relation<AsteroidDate[]>;

  @OneToMany(() => ObserverDateLike, (like) => like.observer)
  likes!: Relation<ObserverDateLike[]>;
}
