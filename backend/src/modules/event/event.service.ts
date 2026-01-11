import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Event } from '../../typeorm/entities/event';
import { EventAttendees } from '../../typeorm/entities/event-attendees';
import { Attendees } from '../../typeorm/entities/attendees';
import { Admin } from '../../typeorm/entities/admin';
import { EmailService } from '../email/email.service';
import { CreateEventDto } from './dto/create-event.dto';
import { RegisterForEventDto } from './dto/register-event.dto';

@Injectable()
export class EventService {
  constructor(
    @InjectRepository(Event)
    private readonly eventRepo: Repository<Event>,
    @InjectRepository(EventAttendees)
    private readonly eventAttendeesRepo: Repository<EventAttendees>,
    @InjectRepository(Attendees)
    private readonly attendeeRepo: Repository<Attendees>,
    @InjectRepository(Admin)
    private readonly adminRepo: Repository<Admin>,
    private readonly emailService: EmailService,
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
    // Validate that either attendeeId or adminId is provided
    if (!dto.attendeeId && !dto.adminId) {
      throw new ConflictException('Either attendeeId or adminId must be provided');
    }

    // Check if already registered
    const whereCondition: any = { eventId: dto.eventId };
    if (dto.attendeeId) {
      whereCondition.attendeeId = dto.attendeeId;
    }
    if (dto.adminId) {
      whereCondition.adminId = dto.adminId;
    }

    const existingRegistration = await this.eventAttendeesRepo.findOne({
      where: whereCondition
    });

    if (existingRegistration) {
      throw new ConflictException('User is already registered for this event');
    }

    // Check if event exists
    const event = await this.eventRepo.findOne({ where: { id: dto.eventId } });
    if (!event) {
      throw new NotFoundException('Event not found');
    }

    // Create registration
    const registration = this.eventAttendeesRepo.create({
      eventId: dto.eventId,
      attendeeId: dto.attendeeId || null,
      adminId: dto.adminId || null,
      attendeeName: dto.attendeeName,
      ticketCode: dto.ticketCode,
      status: 'inactive',
    });

    const saved = await this.eventAttendeesRepo.save(registration);

    // Update event registered count
    await this.eventRepo.increment({ id: dto.eventId }, 'registered', 1);

    // Fire-and-forget email: attempt to send registration details to the attendee's email
    (async () => {
      try {
        let recipientEmail: string | undefined;
        let recipientName: string | undefined;
        if (dto.attendeeId) {
          const at = await this.attendeeRepo.findOne({ where: { id: dto.attendeeId } });
          if (at) {
            recipientEmail = at.email;
            recipientName = `${at.firstName} ${at.lastName}`.trim();
          }
        } else if (dto.adminId) {
          const ad = await this.adminRepo.findOne({ where: { id: dto.adminId } });
          if (ad) {
            recipientEmail = ad.email;
            recipientName = `${ad.firstName} ${ad.lastName}`.trim();
          }
        }

        // reload event to ensure latest fields
        const ev = await this.eventRepo.findOne({ where: { id: dto.eventId } });
        if (recipientEmail && ev) {
          await this.emailService.sendRegistrationEmail(ev, saved, recipientEmail);
        }
      } catch (err) {
        console.error('Failed to send registration email', err);
      }
    })();

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

  async getAdminRegistrations(adminId: number) {
    const registrations = await this.eventAttendeesRepo.find({
      where: { adminId },
      relations: ['event'],
      order: { registeredAt: 'DESC' }
    });
    return registrations;
  }

  async isAttendeeRegistered(eventId: number, attendeeId: number): Promise<boolean> {
    const registration = await this.eventAttendeesRepo.findOne({
      where: { eventId, attendeeId }
    });
    return !!registration;
  }

  async cancelRegistration(registrationId: number): Promise<void> {
    const registration = await this.eventAttendeesRepo.findOne({
      where: { id: registrationId }
    });

    if (!registration) {
      throw new NotFoundException('Registration not found');
    }

    // Decrement event registered count
    await this.eventRepo.decrement({ id: registration.eventId }, 'registered', 1);

    // Delete registration
    await this.eventAttendeesRepo.delete(registrationId);
  }

  async checkInRegistration(registrationId: number) {
    const registration = await this.eventAttendeesRepo.findOne({ where: { id: registrationId } });
    if (!registration) {
      throw new NotFoundException('Registration not found');
    }
    registration.status = 'active';
    return this.eventAttendeesRepo.save(registration);
  }

  async sendTicketByEmail(registrationId: number, buffer: Buffer, filename: string) {
    const registration = await this.eventAttendeesRepo.findOne({ where: { id: registrationId } });
    if (!registration) throw new NotFoundException('Registration not found');
    const ev = await this.eventRepo.findOne({ where: { id: registration.eventId } });
    if (!ev) throw new NotFoundException('Event not found');
    // determine recipient email
    let recipientEmail: string | undefined = undefined;
    if (registration.attendeeId) {
      const at = await this.attendeeRepo.findOne({ where: { id: registration.attendeeId } });
      if (at) recipientEmail = at.email;
    } else if (registration.adminId) {
      const ad = await this.adminRepo.findOne({ where: { id: registration.adminId } });
      if (ad) recipientEmail = ad.email;
    }
    // send using EmailService
    await this.emailService.sendRegistrationWithAttachment(ev, registration, buffer, filename, recipientEmail);
    return true;
  }
}

