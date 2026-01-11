import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, JoinColumn } from 'typeorm';
import { Event } from './event';
import { Attendees } from './attendees';

@Entity('event_attendees')
export class EventAttendees {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  eventId: number;

  @Column()
  attendeeId: number;

  @Column()
  attendeeName: string;

  @Column()
  ticketCode: string;

  @CreateDateColumn()
  registeredAt: Date;

  @ManyToOne(() => Event, (event) => event.attendees, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'eventId' })
  event: Event;

  @ManyToOne(() => Attendees, (attendee) => attendee.registrations, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'attendeeId' })
  attendee: Attendees;
}
