import { Module } from '@nestjs/common';
import { ThrottlerModule } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './common/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { RolesModule } from './roles/roles.module';
import { AuditModule } from './audit/audit.module';
import { MfaModule } from './mfa/mfa.module';
import { SessionsModule } from './sessions/sessions.module';
import { SystemsModule } from './systems/systems.module';
import { EmailModule } from './email/email.module';

@Module({
  imports: [
    ThrottlerModule.forRoot([
      {
        name: 'default',
        ttl: 60,
        limit: 5,
      },
    ]),
    PrismaModule,
    AuthModule,
    UsersModule,
    RolesModule,
    AuditModule,
    MfaModule,
    SessionsModule,
    SystemsModule,
    EmailModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

