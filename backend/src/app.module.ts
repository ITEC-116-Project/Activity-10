import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserCrudModule } from './modules/user-crud/user-crud.module';
import { AccountLoginModule } from './modules/account-login/account-login.module';
import { ManageAccountModule } from './modules/manage-account/manage-account.module';
import { EventModule } from './modules/event/event.module';
import { AnnouncementModule } from './modules/announcement/announcement.module';

@Module({
  imports: [
    // ✅ Load environment variables
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    // ✅ Database connection
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'mysql',
        host: config.get<string>('DB_HOST'),
        port: config.get<number>('DB_PORT'),
        username: config.get<string>('DB_USER'),
        password: config.get<string>('DB_PASS'),
        database: config.get<string>('DB_NAME'),
        autoLoadEntities: true, // automatically load entities
        synchronize: true, // ⚠️ only for dev (creates tables automatically)
      }),
    }),

    UserCrudModule,
    AccountLoginModule, // ✅ Login authentication module
    ManageAccountModule,
    EventModule,
    AnnouncementModule,
  ],
})
export class AppModule {}
