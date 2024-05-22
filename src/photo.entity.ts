import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity()
export class PhotoEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ type: "bigint" })
  timestamp: number;

  @Column()
  url: string;

  @Column()
  thumbnailURL: string;

  @Column()
  source: string;

  @Column()
  subjects: string;
}
