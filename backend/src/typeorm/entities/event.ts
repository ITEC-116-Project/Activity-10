import { Column, Entity, PrimaryGeneratedColumn, OneToMany } from 'typeorm';
import { EventAttendees } from './event-attendees';

@Entity({ name: 'event_ten' })
export class Event {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column({ type: 'datetime' })
  date: Date;

  @Column({ type: 'datetime' })
  endDate: Date;

  @Column()
  time: string;

  @Column()
  location: string;

  @Column({ type: 'int', default: 0 })
  capacity: number;

  @Column({ type: 'int', default: 0 })
  registered: number;

  @Column({ default: 'upcoming' })
  status: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  createdBy: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  createdByName: string | null;

  @OneToMany(() => EventAttendees, (eventAttendee) => eventAttendee.event)
  attendees: EventAttendees[];
}
