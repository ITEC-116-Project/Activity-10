import { Body, Controller, Delete, Get, Param, Post, Put, UseGuards, Request } from '@nestjs/common';
import { AnnouncementService } from './announcement.service';
import { CreateAnnouncementDto } from './dto/create-announcement.dto';
import { UpdateAnnouncementDto } from './dto/update-announcement.dto';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('announcements')
@Controller('announcements')
export class AnnouncementController {
  constructor(private readonly announcementService: AnnouncementService) {}

  @Post()
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new announcement (Admin only)' })
  async create(@Body() createAnnouncementDto: CreateAnnouncementDto, @Request() req) {
    const adminId = req.user?.id;
    return this.announcementService.create(createAnnouncementDto, adminId);
  }

  @Get()
  @ApiOperation({ summary: 'Get all active announcements' })
  async findAll() {
    return this.announcementService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get announcement by id' })
  async findById(@Param('id') id: string) {
    const announcementId = Number(id);
    return this.announcementService.findById(announcementId);
  }

  @Get('admin/:adminId')
  @ApiOperation({ summary: 'Get all announcements created by a specific admin' })
  async findByAdmin(@Param('adminId') adminId: string) {
    const numAdminId = Number(adminId);
    return this.announcementService.findByAdmin(numAdminId);
  }

  @Put(':id')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update announcement (Admin only)' })
  async update(
    @Param('id') id: string,
    @Body() updateAnnouncementDto: UpdateAnnouncementDto,
  ) {
    const announcementId = Number(id);
    return this.announcementService.update(announcementId, updateAnnouncementDto);
  }

  @Delete(':id')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete announcement (Admin only)' })
  async delete(@Param('id') id: string) {
    const announcementId = Number(id);
    return this.announcementService.deleteById(announcementId);
  }
}
