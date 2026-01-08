import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Admin } from '../../typeorm/entities/admin';
import { Organizer } from '../../typeorm/entities/organizer';
import { Attendees } from '../../typeorm/entities/attendees';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    @InjectRepository(Admin)
    private adminRepository: Repository<Admin>,
    @InjectRepository(Organizer)
    private organizerRepository: Repository<Organizer>,
    @InjectRepository(Attendees)
    private attendeesRepository: Repository<Attendees>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'your-secret-key-change-this-in-production',
    });
  }

  async validate(payload: any) {
    let user;

    // Check in appropriate table based on role
    if (payload.role === 'admin') {
      user = await this.adminRepository.findOne({ where: { id: payload.userId } });
    } else if (payload.role === 'organizer') {
      user = await this.organizerRepository.findOne({ where: { id: payload.userId } });
    } else if (payload.role === 'attendees') {
      user = await this.attendeesRepository.findOne({ where: { id: payload.userId } });
    }

    if (!user) {
      throw new UnauthorizedException();
    }

    return { 
      userId: payload.userId, 
      email: payload.email, 
      role: payload.role 
    };
  }
}
