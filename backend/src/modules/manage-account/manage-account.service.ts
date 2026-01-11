import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, EntityManager } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { Admin } from '../../typeorm/entities/admin';
import { Organizer } from '../../typeorm/entities/organizer';
import { Attendees } from '../../typeorm/entities/attendees';
import { Users } from '../../typeorm/entities/users';
import { EmailService } from '../email/email.service';
import { AccountRole, CreateManageAccountDto, UpdateManageAccountDto } from './dto/manage-account.dto';

type AccountEntity = Admin | Organizer | Attendees;

@Injectable()
export class ManageAccountService {
  constructor(
    @InjectRepository(Admin) private readonly adminRepository: Repository<Admin>,
    @InjectRepository(Organizer) private readonly organizerRepository: Repository<Organizer>,
    @InjectRepository(Attendees) private readonly attendeesRepository: Repository<Attendees>,
    @InjectRepository(Users) private readonly usersRepository: Repository<Users>,
    private readonly dataSource: DataSource,
    private readonly emailService: EmailService,
  ) {}

  async findAll() {
    const [organizers, attendees] = await Promise.all([
      this.organizerRepository.find(),
      this.attendeesRepository.find(),
    ]);

    return [
      ...organizers.map((organizer) => this.toSafeAccount(organizer, 'organizer')),
      ...attendees.map((attendee) => this.toSafeAccount(attendee, 'attendees')),
    ];
  }

  async getActiveCounts() {
    const [activeOrganizers, activeAttendees] = await Promise.all([
      this.organizerRepository.count({ where: { isActive: true } }),
      this.attendeesRepository.count({ where: { isActive: true } }),
    ]);

    return {
      activeOrganizers,
      activeAttendees,
    };
  }

  async getActiveAttendeesList() {
    const attendees = await this.attendeesRepository.find({ where: { isActive: true } });
    return attendees.map((a) => this.toSafeAccount(a, 'attendees'));
  }

  async getActiveOrganizersList() {
    const organizers = await this.organizerRepository.find({ where: { isActive: true } });
    return organizers.map((o) => this.toSafeAccount(o, 'organizer'));
  }

  async findOne(roleInput: string, id: number) {
    const role = this.normalizeRole(roleInput);
    const repository = this.getRepository(role);
    const account = await repository.findOne({ where: { id } });

    if (!account) {
      throw new NotFoundException('Account not found');
    }

    return this.toSafeAccount(account, role);
  }

  async create(dto: CreateManageAccountDto) {
    const role = this.normalizeRole(dto.role);
    const username = dto.username?.trim() || this.generateUsername(dto.email);
    const rawPassword = dto.password?.trim() || this.generateTempPassword();

    await this.assertUnique(dto.email, username);

    const hashedPassword = await bcrypt.hash(rawPassword, 10);
    let created: AccountEntity;

    if (role === 'admin') {
      created = await this.adminRepository.save(
        this.adminRepository.create({
          email: dto.email,
          username: username,
          password: hashedPassword,
          firstName: dto.firstName,
          lastName: dto.lastName,
          role,
        }),
      );
    } else if (role === 'organizer') {
      const organizer = this.organizerRepository.create();
      organizer.email = dto.email;
      organizer.username = username;
      organizer.password = hashedPassword;
      organizer.firstName = dto.firstName;
      organizer.lastName = dto.lastName;
      organizer.role = role;
      organizer.phone = dto.phone ?? null;
      organizer.companyName = dto.companyName ?? null;
      organizer.isActive = false; // new accounts start inactive

      created = await this.organizerRepository.save(organizer);
    } else {
      const attendee = this.attendeesRepository.create();
      attendee.email = dto.email;
      attendee.username = username;
      attendee.password = hashedPassword;
      attendee.firstName = dto.firstName;
      attendee.lastName = dto.lastName;
      attendee.role = role;
      attendee.phone = dto.phone ?? null;
      attendee.university = dto.university ?? null;
      attendee.companyName = dto.companyName ?? null;
      attendee.isActive = false; // new accounts start inactive

      created = await this.attendeesRepository.save(attendee);
    }

    // Use transaction to ensure both role table and users table are persisted atomically
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // save into role table using the manager
      let saved = await queryRunner.manager.save(created as any);

      // also persist into global users table for reference
      try {
        const u = this.usersRepository.create({
          email: saved.email,
          username: saved.username,
          password: (saved.password as string) || hashedPassword,
          role,
          firstName: saved.firstName,
          lastName: saved.lastName,
          temporaryPassword: !dto.password,
        });
        await queryRunner.manager.save(u as any);
      } catch (err) {
        // non-fatal: continue even if users table save fails
        console.warn('Failed to save to users table', err);
      }

      await queryRunner.commitTransaction();

      const safe = this.toSafeAccount(saved, role) as any;
      if (!dto.password) {
        safe.temporaryPassword = rawPassword; // surface only when auto-generated
        // mark the saved account as temporary so login flow can require a password change
        (saved as any).temporaryPassword = true;
        try {
          await queryRunner.manager.save(saved as any);
        } catch (err) {
          console.warn('Failed to mark temporaryPassword on saved account', err);
        }

        // send welcome email with temporary password (non-blocking)
        try {
          await this.emailService.sendAccountCreationEmail(saved.email, rawPassword, `${saved.firstName || ''} ${saved.lastName || ''}`.trim(), role);
        } catch (err) {
          console.warn('Failed to send account creation email', err);
        }
      }

      return safe;
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  async update(roleInput: string, id: number, dto: UpdateManageAccountDto) {
    const role = this.normalizeRole(roleInput);
    const repository = this.getRepository(role);
    const account = await repository.findOne({ where: { id } });

    if (!account) {
      throw new NotFoundException('Account not found');
    }

    const email = dto.email ?? account.email;
    const username = dto.username ?? account.username;

    await this.assertUnique(email, username, {
      role,
      id,
      currentEmail: account.email,
      currentUsername: account.username,
    });

    const password = dto.password ? await bcrypt.hash(dto.password, 10) : account.password;

    Object.assign(account, {
      email,
      username,
      firstName: dto.firstName ?? account.firstName,
      lastName: dto.lastName ?? account.lastName,
      password,
    });

    if (role === 'organizer') {
      (account as Organizer).companyName = dto.companyName ?? (account as Organizer).companyName ?? null;
      (account as Organizer).phone = dto.phone ?? (account as Organizer).phone ?? null;
      (account as Organizer).isActive = dto.isActive ?? (account as Organizer).isActive ?? false;
    } else if (role === 'attendees') {
      (account as Attendees).phone = dto.phone ?? (account as Attendees).phone ?? null;
      (account as Attendees).university = dto.university ?? (account as Attendees).university ?? null;
      (account as Attendees).companyName = dto.companyName ?? (account as Attendees).companyName ?? null;
      (account as Attendees).isActive = dto.isActive ?? (account as Attendees).isActive ?? false;
    }

    const saved = await repository.save(account);

    return this.toSafeAccount(saved, role);
  }

  async remove(roleInput: string, id: number) {
    const role = this.normalizeRole(roleInput);
    const repository = this.getRepository(role);
    const account = await repository.findOne({ where: { id } });

    if (!account) {
      throw new NotFoundException('Account not found');
    }

    await repository.delete(id);

    return { message: 'Account deleted' };
  }

  private getRepository(role: AccountRole): Repository<AccountEntity> {
    if (role === 'admin') return this.adminRepository as unknown as Repository<AccountEntity>;
    if (role === 'organizer') return this.organizerRepository as unknown as Repository<AccountEntity>;
    return this.attendeesRepository as unknown as Repository<AccountEntity>;
  }

  private normalizeRole(role: string): AccountRole {
    const normalized = (role || '').toLowerCase();

    if (normalized === 'admin' || normalized === 'organizer' || normalized === 'attendees') {
      return normalized as AccountRole;
    }

    throw new NotFoundException('Role not supported');
  }

  private async assertUnique(
    email: string,
    username: string,
    ignore?: { role: AccountRole; id: number; currentEmail: string; currentUsername: string },
  ) {
    const conflicts = await Promise.all([
      this.findConflict(this.adminRepository, email, username, ignore, 'admin'),
      this.findConflict(this.organizerRepository, email, username, ignore, 'organizer'),
      this.findConflict(this.attendeesRepository, email, username, ignore, 'attendees'),
    ]);

    if (conflicts.some(Boolean)) {
      throw new ConflictException('Email or username already exists');
    }
  }

  private async findConflict<T extends { id: number }>(
    repository: Repository<T>,
    email: string,
    username: string,
    ignore: { role: AccountRole; id: number } | undefined,
    role: AccountRole,
  ) {
    const existing = await repository.findOne({ where: [{ email }, { username }] as any });

    if (!existing) return false;
    if (ignore && ignore.role === role && ignore.id === existing.id) return false;

    return true;
  }



  private toSafeAccount(account: any, role: AccountRole) {
    return {
      id: account.id,
      role: role,
      email: account.email,
      username: account.username,
      firstName: account.firstName,
      lastName: account.lastName,
      phone: account.phone ?? undefined,
      companyName: account.companyName ?? undefined,
      university: account.university ?? undefined,
      isActive: account.isActive ?? false,
      createdAt: account.createdAt ?? undefined,
      updatedAt: account.updatedAt ?? undefined,
    };
  }

  // Generates a simple username from email prefix with a short random suffix if needed
  private generateUsername(email: string) {
    const prefix = (email || '').split('@')[0] || 'user';
    const suffix = Math.random().toString(36).slice(2, 6);
    return `${prefix}-${suffix}`;
  }

  // Creates a 12-char alphanumeric temporary password
  private generateTempPassword() {
    return Math.random().toString(36).slice(2, 10) + Math.random().toString(36).slice(2, 6);
  }
}
