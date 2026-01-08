import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Users } from '../../typeorm/entities/users';
import { Admin } from '../../typeorm/entities/admin';
import { Organizer } from '../../typeorm/entities/organizer';
import { Attendees } from '../../typeorm/entities/attendees';
import { LoginDto, SignupDto } from './dto/account-login.dto';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AccountLoginService {
  constructor(
    @InjectRepository(Users)
    private usersRepository: Repository<Users>,
    @InjectRepository(Admin)
    private adminRepository: Repository<Admin>,
    @InjectRepository(Organizer)
    private organizerRepository: Repository<Organizer>,
    @InjectRepository(Attendees)
    private attendeesRepository: Repository<Attendees>,
    private jwtService: JwtService,
  ) {}

  async login(loginDto: LoginDto) {
    const { login, password } = loginDto;

    // Check admin table (by email or username)
    let user = await this.adminRepository.findOne({ where: [{ email: login }, { username: login }] });
    if (user) {
      return await this.validateAndLogin(user, password, 'admin');
    }

    // Check organizer table (by email or username)
    user = await this.organizerRepository.findOne({ where: [{ email: login }, { username: login }] });
    if (user) {
      return await this.validateAndLogin(user, password, 'organizer');
    }

    // Check attendees table (by email or username)
    user = await this.attendeesRepository.findOne({ where: [{ email: login }, { username: login }] });
    if (user) {
      return await this.validateAndLogin(user, password, 'attendees');
    }

    throw new UnauthorizedException('Invalid credentials');
  }

  private async validateAndLogin(user: any, password: string, role: string) {
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload = { 
      userId: user.id, 
      email: user.email, 
      role: role 
    };

    const token = this.jwtService.sign(payload);

    return {
      message: 'Login successful',
      token,
      userId: user.id,
      role: role,
      email: user.email,
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
    };
  }

  async signup(signupDto: SignupDto) {
    const { email, username, password, role, firstName, lastName } = signupDto;

    // Check if user exists in any table by email or username
    let existingUser = await this.adminRepository.findOne({ where: [{ email }, { username }] });
    if (existingUser) throw new ConflictException('Email or username already registered');

    existingUser = await this.organizerRepository.findOne({ where: [{ email }, { username }] });
    if (existingUser) throw new ConflictException('Email or username already registered');

    existingUser = await this.attendeesRepository.findOne({ where: [{ email }, { username }] });
    if (existingUser) throw new ConflictException('Email or username already registered');

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    let newUser: any;

    // Create user in appropriate table
    if (role === 'admin') {
      const adminData = this.adminRepository.create({
        email,
        password: hashedPassword,
        role: 'admin',
        username,
        firstName,
        lastName,
      });
      newUser = await this.adminRepository.save(adminData);
    } else if (role === 'organizer') {
      const organizerData = this.organizerRepository.create({
        email,
        password: hashedPassword,
        role: 'organizer',
        username,
        firstName,
        lastName,
      });
      newUser = await this.organizerRepository.save(organizerData);
    } else if (role === 'attendees') {
      const attendeesData = this.attendeesRepository.create({
        email,
        password: hashedPassword,
        role: 'attendees',
        username,
        firstName,
        lastName,
      });
      newUser = await this.attendeesRepository.save(attendeesData);
    }

    // Also save to users table for reference
    await this.usersRepository.save(
      this.usersRepository.create({
        email,
        password: hashedPassword,
        role,
        username,
        firstName,
        lastName,
      })
    );

    return {
      message: 'User registered successfully',
      userId: newUser.id,
      email: newUser.email,
      role: newUser.role,
    };
  }

  async validateUser(userId: number) {
    // Try to find in all tables
    let user = await this.adminRepository.findOne({ where: { id: userId } });
    if (user) {
      return {
        userId: user.id,
        email: user.email,
        role: user.role,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
      };
    }

    user = await this.organizerRepository.findOne({ where: { id: userId } });
    if (user) {
      return {
        userId: user.id,
        email: user.email,
        role: user.role,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
      };
    }

    user = await this.attendeesRepository.findOne({ where: { id: userId } });
    if (user) {
      return {
        userId: user.id,
        email: user.email,
        role: user.role,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
      };
    }

    throw new UnauthorizedException('User not found');
  }
}
