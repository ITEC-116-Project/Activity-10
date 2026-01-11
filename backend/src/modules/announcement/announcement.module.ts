import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Announcement } from '../../typeorm/entities/announcement';
import { AnnouncementService } from './announcement.service';
import { AnnouncementController } from './announcement.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Announcement])],
  providers: [AnnouncementService],
  controllers: [AnnouncementController],
  exports: [AnnouncementService],
})
export class AnnouncementModule {}
