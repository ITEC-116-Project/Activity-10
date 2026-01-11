import { Body, Controller, Get, Param, Post, Put, UseGuards, Request } from '@nestjs/common';
import { EventService } from './event.service';
import { CreateEventDto } from './dto/create-event.dto';
import { RegisterForEventDto } from './dto/register-event.dto';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('events')
@Controller('events')
export class EventController {
  constructor(private readonly svc: EventService) {}

  @Post()
  async create(@Body() body: CreateEventDto) {
    return this.svc.create(body);
  }

  @Get()
  async list() {
    return this.svc.findAll();
  }

  @Get('by-creator/:id')
  async byCreator(@Param('id') id: string) {
    return this.svc.findByCreator(id);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() body: Partial<CreateEventDto>) {
    const num = Number(id);
    return this.svc.update(num, body);
  }

  @Post('register')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Register attendee for an event' })
  async registerForEvent(@Body() dto: RegisterForEventDto) {
    return this.svc.registerForEvent(dto);
  }

  @Get(':eventId/attendees')
  @ApiOperation({ summary: 'Get all attendees registered for an event' })
  async getEventAttendees(@Param('eventId') eventId: string) {
    return this.svc.getEventAttendees(Number(eventId));
  }

  @Get('attendee/:attendeeId/registrations')
  @ApiOperation({ summary: 'Get all event registrations for an attendee' })
  async getAttendeeRegistrations(@Param('attendeeId') attendeeId: string) {
    return this.svc.getAttendeeRegistrations(Number(attendeeId));
  }

  @Get(':eventId/attendee/:attendeeId/check')
  @ApiOperation({ summary: 'Check if attendee is registered for an event' })
  async isRegistered(@Param('eventId') eventId: string, @Param('attendeeId') attendeeId: string) {
    const isRegistered = await this.svc.isAttendeeRegistered(Number(eventId), Number(attendeeId));
    return { isRegistered };
  }
}
