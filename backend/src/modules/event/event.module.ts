import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Event } from '../../typeorm/entities/event';
import { EventAttendees } from '../../typeorm/entities/event-attendees';
import { Attendees } from '../../typeorm/entities/attendees';
import { Admin } from '../../typeorm/entities/admin';
import { EventService } from './event.service';
import { EventController } from './event.controller';
import { EmailModule } from '../email/email.module';

@Module({
  imports: [TypeOrmModule.forFeature([Event, EventAttendees, Attendees, Admin]), EmailModule],
  providers: [EventService],
  controllers: [EventController],
  exports: [EventService],
})
export class EventModule {}
