import { Body, Controller, Get, Param, Post, Put, Delete, UseGuards, Request, UseInterceptors, UploadedFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
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

  @Delete(':id')
  @ApiOperation({ summary: 'Delete an event' })
  async delete(@Param('id') id: string) {
    const num = Number(id);
    return this.svc.delete(num);
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

  @Get('admin/:adminId/registrations')
  @ApiOperation({ summary: 'Get all event registrations for an admin' })
  async getAdminRegistrations(@Param('adminId') adminId: string) {
    return this.svc.getAdminRegistrations(Number(adminId));
  }

  @Get(':eventId/attendee/:attendeeId/check')
  @ApiOperation({ summary: 'Check if attendee is registered for an event' })
  async isRegistered(@Param('eventId') eventId: string, @Param('attendeeId') attendeeId: string) {
    const isRegistered = await this.svc.isAttendeeRegistered(Number(eventId), Number(attendeeId));
    return { isRegistered };
  }

  @Post(':registrationId/check-in')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Mark a registration as checked in' })
  async checkIn(@Param('registrationId') registrationId: string) {
    const updated = await this.svc.checkInRegistration(Number(registrationId));
    return updated;
  }

  @Post(':registrationId/cancel')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cancel an event registration' })
  async cancelRegistration(@Param('registrationId') registrationId: string) {
    await this.svc.cancelRegistration(Number(registrationId));
    return { message: 'Registration cancelled successfully' };
  }

  @Post(':registrationId/send-ticket')
  @UseGuards(AuthGuard('jwt'))
  @UseInterceptors(FileInterceptor('file'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Send ticket PNG to attendee email' })
  async sendTicket(@Param('registrationId') registrationId: string, @UploadedFile() file: any) {
    if (!file || !file.buffer) throw new Error('No file uploaded');
    const sent = await this.svc.sendTicketByEmail(Number(registrationId), file.buffer, file.originalname || 'ticket.png');
    return { success: sent };
  }
}
