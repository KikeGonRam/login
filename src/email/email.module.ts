import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EmailService } from './email.service';
import { EmailConfig } from './email.config';
import { ActivationTokenService } from './activation-token.service';
import { PrismaModule } from '../common/prisma.module';

@Module({
  imports: [ConfigModule, PrismaModule],
  providers: [EmailService, EmailConfig, ActivationTokenService],
  exports: [EmailService, EmailConfig, ActivationTokenService],
})
export class EmailModule {}
