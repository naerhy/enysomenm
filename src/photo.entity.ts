import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity()
export class PhotoEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column()
  url: string;

  @Column()
  people: string;
}
