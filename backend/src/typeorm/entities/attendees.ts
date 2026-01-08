import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity({ name: 'attendee_ten' })
export class Attendees {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  email: string;

  @Column()
  password: string;

  @Column({ unique: true })
  username: string;

  @Column()
  firstName: string;

  @Column()
  lastName: string;

  @Column({ default: 'attendees' })
  role: string;

  @Column({ nullable: true })
  phone: string;

  @Column({ nullable: true })
  university: string;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
  updatedAt: Date;
}
