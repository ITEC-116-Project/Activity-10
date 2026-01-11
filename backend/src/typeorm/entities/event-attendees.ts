import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, JoinColumn } from 'typeorm';
import { Event } from './event';
import { Attendees } from './attendees';
import { Admin } from './admin';

@Entity('event_attendees')
export class EventAttendees {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  eventId: number;

  @Column({ nullable: true })
  attendeeId: number | null;

  @Column({ nullable: true })
  adminId: number | null;

  @Column()
  attendeeName: string;

  @Column()
  ticketCode: string;

  @Column({ default: 'inactive' })
  status: string;

  @CreateDateColumn()
  registeredAt: Date;

  @ManyToOne(() => Event, (event) => event.attendees, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'eventId' })
  event: Event;

  @ManyToOne(() => Attendees, (attendee) => attendee.registrations, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'attendeeId' })
  attendee: Attendees | null;

  @ManyToOne(() => Admin, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'adminId' })
  admin: Admin | null;
}
