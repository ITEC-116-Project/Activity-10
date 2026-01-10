import { Body, Controller, Get, Param, Post, Put } from '@nestjs/common';
import { EventService } from './event.service';
import { CreateEventDto } from './dto/create-event.dto';

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
}
