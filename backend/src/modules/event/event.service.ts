import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Event } from '../../typeorm/entities/event';
import { CreateEventDto } from './dto/create-event.dto';

@Injectable()
export class EventService {
  constructor(
    @InjectRepository(Event)
    private readonly eventRepo: Repository<Event>,
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
}
