import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Event } from '../../typeorm/entities/event';
import { EventAttendees } from '../../typeorm/entities/event-attendees';
import { CreateEventDto } from './dto/create-event.dto';
import { RegisterForEventDto } from './dto/register-event.dto';

@Injectable()
export class EventService {
  constructor(
    @InjectRepository(Event)
    private readonly eventRepo: Repository<Event>,
    @InjectRepository(EventAttendees)
    private readonly eventAttendeesRepo: Repository<EventAttendees>,
  ) {}

  async create(createEventDto: CreateEventDto) {
    const ev = this.eventRepo.create(createEventDto as any);
    return this.eventRepo.save(ev);
  }

  async findAll() {
    const events = await this.eventRepo.find({ order: { date: 'DESC' } });
    const now = new Date();
    // ensure status reflects current time (update DB if necessary)
    for (const ev of events) {
      const start = new Date(ev.date as any);
      const end = new Date((ev as any).endDate as any);
  let newStatus = 'upcoming';
  if (start <= now && now <= end) newStatus = 'ongoing';
  else if (end < now) newStatus = 'completed';
      if (ev.status !== newStatus) {
        ev.status = newStatus;
        // persist change
        // don't await here to avoid serializing too long; collect saves
        this.eventRepo.save(ev).catch(err => console.error('Failed updating event status', err));
      }
    }
    return events;
  }

  async findByCreator(creatorId: string) {
    const events = await this.eventRepo.find({ where: { createdBy: creatorId }, order: { date: 'DESC' } });
    const now = new Date();
    for (const ev of events) {
      const start = new Date(ev.date as any);
      const end = new Date((ev as any).endDate as any);
  let newStatus = 'upcoming';
  if (start <= now && now <= end) newStatus = 'ongoing';
  else if (end < now) newStatus = 'completed';
      if (ev.status !== newStatus) {
        ev.status = newStatus;
        this.eventRepo.save(ev).catch(err => console.error('Failed updating event status', err));
      }
    }
    return events;
  }

  async update(id: number, changes: Partial<CreateEventDto>) {
    await this.eventRepo.update(id, changes as any);
    return this.eventRepo.findOneBy({ id });
  }

  async registerForEvent(dto: RegisterForEventDto) {
    // Check if already registered
    const existingRegistration = await this.eventAttendeesRepo.findOne({
      where: {
        eventId: dto.eventId,
        attendeeId: dto.attendeeId
      }
    });

    if (existingRegistration) {
      throw new ConflictException('Attendee is already registered for this event');
    }

    // Check if event exists
    const event = await this.eventRepo.findOne({ where: { id: dto.eventId } });
    if (!event) {
      throw new NotFoundException('Event not found');
    }

    // Create registration
    const registration = this.eventAttendeesRepo.create({
      eventId: dto.eventId,
      attendeeId: dto.attendeeId,
      attendeeName: dto.attendeeName,
      ticketCode: dto.ticketCode,
    });

    const saved = await this.eventAttendeesRepo.save(registration);

    // Update event registered count
    await this.eventRepo.increment({ id: dto.eventId }, 'registered', 1);

    return saved;
  }

  async getEventAttendees(eventId: number) {
    return this.eventAttendeesRepo.find({
      where: { eventId },
      order: { registeredAt: 'DESC' }
    });
  }

  async getAttendeeRegistrations(attendeeId: number) {
    return this.eventAttendeesRepo.find({
      where: { attendeeId },
      order: { registeredAt: 'DESC' }
    });
  }

  async isAttendeeRegistered(eventId: number, attendeeId: number): Promise<boolean> {
    const registration = await this.eventAttendeesRepo.findOne({
      where: { eventId, attendeeId }
    });
    return !!registration;
  }
}

