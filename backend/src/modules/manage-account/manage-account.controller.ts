import { Controller, Get, Post, Patch, Delete, Param, Body, ParseIntPipe } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ManageAccountService } from './manage-account.service';
import { CreateManageAccountDto, UpdateManageAccountDto } from './dto/manage-account.dto';

@ApiTags('manage-account')
@Controller('manage-account')
export class ManageAccountController {
  constructor(private readonly manageAccountService: ManageAccountService) {}

  @Get()
  @ApiOperation({ summary: 'List all accounts across roles' })
  findAll() {
    return this.manageAccountService.findAll();
  }

  @Get(':role/:id')
  @ApiOperation({ summary: 'Get a single account by role and id' })
  findOne(@Param('role') role: string, @Param('id', ParseIntPipe) id: number) {
    return this.manageAccountService.findOne(role, id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new account for any role' })
  create(@Body() dto: CreateManageAccountDto) {
    return this.manageAccountService.create(dto);
  }

  @Patch(':role/:id')
  @ApiOperation({ summary: 'Update account details for a specific role' })
  update(
    @Param('role') role: string,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateManageAccountDto,
  ) {
    return this.manageAccountService.update(role, id, dto);
  }

  @Delete(':role/:id')
  @ApiOperation({ summary: 'Delete an account by role and id' })
  remove(@Param('role') role: string, @Param('id', ParseIntPipe) id: number) {
    return this.manageAccountService.remove(role, id);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get active counts for organizers and attendees' })
  getActiveCounts() {
    return this.manageAccountService.getActiveCounts();
  }

  @Get('attendees/active')
  @ApiOperation({ summary: 'List active attendees only' })
  getActiveAttendeesList() {
    return this.manageAccountService.getActiveAttendeesList();
  }

  @Get('organizers/active')
  @ApiOperation({ summary: 'List active organizers only' })
  getActiveOrganizersList() {
    return this.manageAccountService.getActiveOrganizersList();
  }
}
