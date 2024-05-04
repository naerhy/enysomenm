import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity()
export class FileEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column()
  url: string;

  @Column()
  people: string;
}
