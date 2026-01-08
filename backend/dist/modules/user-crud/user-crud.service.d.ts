import { Repository } from 'typeorm';
import { Users } from '../../typeorm/entities/users';
export declare class UserCrudService {
    private userRepository;
    constructor(userRepository: Repository<Users>);
    findAll(): Promise<Users[]>;
}
