import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Users } from '../../typeorm/entities/users';

@Injectable()
export class UserCrudService {
  constructor(
    @InjectRepository(Users) // Inject the repository for Users entity
    private userRepository: Repository<Users>,
  ) {}

  findAll() {
    return this.userRepository.find(); // fetch all users from DB
  }
}
