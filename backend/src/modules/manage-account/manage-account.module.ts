import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Users } from '../../typeorm/entities/users';
import { Admin } from '../../typeorm/entities/admin';
import { Organizer } from '../../typeorm/entities/organizer';
import { Attendees } from '../../typeorm/entities/attendees';
import { ManageAccountController } from './manage-account.controller';
import { ManageAccountService } from './manage-account.service';

@Module({
  imports: [TypeOrmModule.forFeature([Users, Admin, Organizer, Attendees])],
  controllers: [ManageAccountController],
  providers: [ManageAccountService],
})
export class ManageAccountModule {}
