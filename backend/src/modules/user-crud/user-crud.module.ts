import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserCrudService } from './user-crud.service';
import { UserCrudController } from './user-crud.controller';
import { Users } from '../../typeorm/entities/users';

@Module({
  imports: [
    TypeOrmModule.forFeature([Users]), // Make repository available for injection
  ],
  controllers: [UserCrudController],
  providers: [UserCrudService],
})
export class UserCrudModule {}
