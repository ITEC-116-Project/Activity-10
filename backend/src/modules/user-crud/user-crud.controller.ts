import { Controller, Get } from '@nestjs/common';
import { UserCrudService } from './user-crud.service';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('users')
@Controller('user-crud')
export class UserCrudController {
  constructor(private readonly userCrudService: UserCrudService) {}

  @Get()
  @ApiOperation({ summary: 'List all users' })
  findAll() {
    return this.userCrudService.findAll(); // fetch all users
  }
}
