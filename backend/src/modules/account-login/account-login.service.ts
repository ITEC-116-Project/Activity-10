import { Injectable, UnauthorizedException, ConflictException, BadRequestException } from '@nestjs/common';
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

    const requiresPasswordChange = !!user.temporaryPassword;

    // Activate user if currently inactive (for organizer and attendees)
    if (role !== 'admin' && user.isActive === false) {
      user.isActive = true;
      if (role === 'organizer') {
        await this.organizerRepository.save(user);
      } else if (role === 'attendees') {
        await this.attendeesRepository.save(user);
      }
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
      isActive: user.isActive ?? undefined,
      requiresPasswordChange: requiresPasswordChange,
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

  async validateUser(userId: number, role: string) {
    // Use the role from JWT to fetch from the correct table
    let user: any;

    if (role === 'admin') {
      user = await this.adminRepository.findOne({ where: { id: userId } });
    } else if (role === 'organizer') {
      user = await this.organizerRepository.findOne({ where: { id: userId } });
    } else if (role === 'attendees') {
      user = await this.attendeesRepository.findOne({ where: { id: userId } });
    }

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return {
      userId: user.id,
      email: user.email,
      role: user.role,
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
    };
  }

  async changePassword(userId: number, currentPassword: string, newPassword: string) {
    console.log('[changePassword] called for userId:', userId);

    if (!currentPassword || !newPassword) {
      console.log('[changePassword] missing fields');
      throw new BadRequestException('Both current and new password are required');
    }

    // find user across role tables
    let user: any = await this.adminRepository.findOne({ where: { id: userId } });
    let repo: any = this.adminRepository;
    let roleFound = 'admin';

    if (!user) {
      user = await this.organizerRepository.findOne({ where: { id: userId } });
      repo = this.organizerRepository;
      roleFound = 'organizer';
    }

    if (!user) {
      user = await this.attendeesRepository.findOne({ where: { id: userId } });
      repo = this.attendeesRepository;
      roleFound = 'attendees';
    }

    if (!user) {
      console.log('[changePassword] user not found');
      throw new UnauthorizedException('User not found');
    }

    // Allow changing password without currentPassword when the account is using a temporary password
    let isValid = false;
    if (user.temporaryPassword && (!currentPassword || currentPassword.trim() === '')) {
      // user authenticated with token and account is flagged temporary - allow change
      isValid = true;
      console.log('[changePassword] accepting change using temporary password flag for userId:', userId);
    } else {
      isValid = await bcrypt.compare(currentPassword, user.password);
      if (!isValid) {
        console.log('[changePassword] invalid current password for userId:', userId);
        throw new UnauthorizedException('Current password is incorrect');
      }
    }

    if (newPassword.length < 8) {
      console.log('[changePassword] new password too short');
      throw new BadRequestException('New password must be at least 8 characters long');
    }

    const hashed = await bcrypt.hash(newPassword, 10);
    user.password = hashed;

  // clear temporary password flag when password is changed
  user.temporaryPassword = false;

  await repo.save(user);

    // update global users table if present
    const globalUser = await this.usersRepository.findOne({ where: { email: user.email } });
    if (globalUser) {
      globalUser.password = hashed;
      globalUser.temporaryPassword = false;
      await this.usersRepository.save(globalUser);
    }

    console.log('[changePassword] success for userId:', userId, 'role:', roleFound);

    return { message: 'Password updated successfully' };
  }
}
