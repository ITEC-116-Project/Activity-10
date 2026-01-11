import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Announcement } from '../../typeorm/entities/announcement';
import { CreateAnnouncementDto } from './dto/create-announcement.dto';
import { UpdateAnnouncementDto } from './dto/update-announcement.dto';

@Injectable()
export class AnnouncementService {
  constructor(
    @InjectRepository(Announcement)
    private readonly announcementRepo: Repository<Announcement>,
  ) {}

  async create(createAnnouncementDto: CreateAnnouncementDto, adminId: number) {
    const announcement = this.announcementRepo.create({
      ...createAnnouncementDto,
      adminId,
      isActive: createAnnouncementDto.isActive ?? true,
    });
    return this.announcementRepo.save(announcement);
  }

  async findAll() {
    return this.announcementRepo.find({
      where: { isActive: true },
      relations: ['admin'],
      order: { createdAt: 'DESC' },
    });
  }

  async findById(id: number) {
    const announcement = await this.announcementRepo.findOne({
      where: { id },
      relations: ['admin'],
    });
    if (!announcement) {
      throw new NotFoundException(`Announcement with id ${id} not found`);
    }
    return announcement;
  }

  async findByAdmin(adminId: number) {
    return this.announcementRepo.find({
      where: { adminId },
      order: { createdAt: 'DESC' },
    });
  }

  async update(id: number, updateAnnouncementDto: UpdateAnnouncementDto) {
    const announcement = await this.findById(id);
    Object.assign(announcement, updateAnnouncementDto);
    return this.announcementRepo.save(announcement);
  }

  async delete(id: number) {
    const announcement = await this.findById(id);
    return this.announcementRepo.remove(announcement);
  }

  async deleteById(id: number) {
    const result = await this.announcementRepo.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Announcement with id ${id} not found`);
    }
    return { success: true, message: 'Announcement deleted successfully' };
  }
}
