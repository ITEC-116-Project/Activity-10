import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AccountLoginController } from './account-login.controller';
import { AccountLoginService } from './account-login.service';
import { Users } from '../../typeorm/entities/users';
import { Admin } from '../../typeorm/entities/admin';
import { Organizer } from '../../typeorm/entities/organizer';
import { Attendees } from '../../typeorm/entities/attendees';
import { JwtStrategy } from './jwt.strategy';

@Module({
  imports: [
    TypeOrmModule.forFeature([Users, Admin, Organizer, Attendees]),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'your-secret-key-change-this-in-production',
      signOptions: { expiresIn: '24h' },
    }),
  ],
  controllers: [AccountLoginController],
  providers: [AccountLoginService, JwtStrategy],
  exports: [AccountLoginService, JwtStrategy, PassportModule],
})
export class AccountLoginModule {}
