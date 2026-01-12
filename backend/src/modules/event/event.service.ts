import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Event } from '../../typeorm/entities/event';
import { EventAttendees } from '../../typeorm/entities/event-attendees';
import { Attendees } from '../../typeorm/entities/attendees';
import { Admin } from '../../typeorm/entities/admin';
import { Organizer } from '../../typeorm/entities/organizer';
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
    @InjectRepository(Organizer)
    private readonly organizerRepo: Repository<Organizer>,
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
    await this.populateOrganizerDetails(events);
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
    await this.populateOrganizerDetails(events);
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
      relations: ['attendee', 'admin'],
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
    const events = registrations
      .map((reg) => reg.event)
      .filter((ev): ev is Event => !!ev);
    await this.populateOrganizerDetails(events);
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

  private async populateOrganizerDetails(events: Event[]): Promise<void> {
    if (!events.length) return;

    const organizerIds = Array.from(
      new Set(
        events
          .map((ev) => {
            if (!ev.createdBy) return null;
            const id = Number(ev.createdBy);
            return Number.isNaN(id) ? null : id;
          })
          .filter((id): id is number => id !== null)
      )
    );

    if (!organizerIds.length) {
      events.forEach((ev) => {
        if (!ev.createdByName) {
          const composed = `${ev.createdByFirstName || ''} ${ev.createdByLastName || ''}`.trim();
          ev.createdByName = composed || ev.createdByName || null;
        }
      });
      return;
    }

    const organizers = await this.organizerRepo.findBy({ id: In(organizerIds) });
    const organizerMap = new Map<number, Organizer>();
    organizers.forEach((org) => organizerMap.set(org.id, org));

    events.forEach((ev) => {
      const organizerId = ev.createdBy ? Number(ev.createdBy) : NaN;
      if (Number.isNaN(organizerId)) {
        if (!ev.createdByName) {
          const composed = `${ev.createdByFirstName || ''} ${ev.createdByLastName || ''}`.trim();
          ev.createdByName = composed || ev.createdByName || null;
        }
        return;
      }

      const organizer = organizerMap.get(organizerId);
      if (!organizer) {
        if (!ev.createdByName) {
          const fallback = `${ev.createdByFirstName || ''} ${ev.createdByLastName || ''}`.trim();
          ev.createdByName = fallback || ev.createdByName || null;
        }
        return;
      }

      ev.createdByFirstName = organizer.firstName;
      ev.createdByLastName = organizer.lastName;
      ev.createdByEmail = organizer.email;
      const fullName = `${organizer.firstName || ''} ${organizer.lastName || ''}`.trim();
      ev.createdByName = fullName || organizer.username || organizer.email;
      (ev as any).organizerName = ev.createdByName;
      (ev as any).organizerEmail = organizer.email;
    });
  }
}

