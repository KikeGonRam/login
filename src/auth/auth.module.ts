import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import * as fs from 'fs';
import * as path from 'path';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { LocalStrategy } from './strategies/local.strategy';
import { MfaModule } from '../mfa/mfa.module';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({
      privateKey: fs.readFileSync(
        path.join(process.cwd(), 'keys', 'private.pem'),
      ),
      publicKey: fs.readFileSync(
        path.join(process.cwd(), 'keys', 'public.pem'),
      ),
      signOptions: {
        algorithm: 'RS256',
        expiresIn: '15m',
      },
    }),
    MfaModule,
    AuditModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, LocalStrategy],
  exports: [AuthService, JwtModule],
})
export class AuthModule {}
