import { Column, Entity, PrimaryGeneratedColumn, OneToMany } from "typeorm";
import { EventAttendees } from "./event-attendees";

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

  @Column({ type: 'varchar', length: 50, nullable: true })
  phone: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  university: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  companyName: string | null;

  @Column({ type: 'boolean', default: false })
  isActive: boolean; 

  @Column({ type: 'boolean', default: false })
  temporaryPassword: boolean;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
  updatedAt: Date;

  @OneToMany(() => EventAttendees, (eventAttendee) => eventAttendee.attendee)
  registrations: EventAttendees[];
}
