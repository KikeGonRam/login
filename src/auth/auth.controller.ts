import {
  Controller,
  Post,
  Body,
  Req,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import type { Request } from 'express';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { MfaVerifyDto } from './dto/mfa.dto';
import { RefreshDto } from './dto/refresh.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  /**
   * POST /auth/login
   * Inicia sesión con email y password
   * Retorna sessionId para verificar MFA
   */
  @Post('login')
  @UseGuards(ThrottlerGuard)
  @Throttle({
    default: {
      limit: 5,
      ttl: 60,
    },
  })
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: LoginDto, @Req() req: Request) {
    const ip = req.ip || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];

    return this.authService.login(
      loginDto.email,
      loginDto.password,
      ip,
      userAgent,
    );
  }

  /**
   * POST /auth/mfa/verify
   * Verifica código MFA y emite tokens JWT
   */
  @Post('mfa/verify')
  @HttpCode(HttpStatus.OK)
  async verifyMfa(@Body() mfaDto: MfaVerifyDto, @Req() req: Request) {
    const ip = req.ip || req.socket.remoteAddress;

    return this.authService.verifyMfaAndIssueTokens(
      mfaDto.sessionId,
      mfaDto.code,
      ip,
    );
  }

  /**
   * POST /auth/refresh
   * Renueva access token usando refresh token
   */
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(@Body() refreshDto: RefreshDto, @Req() req: Request) {
    const ip = req.ip || req.socket.remoteAddress;

    return this.authService.refresh(refreshDto.refreshToken, ip);
  }

  /**
   * POST /auth/logout
   * Cierra la sesión actual
   */
  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async logout(@Req() req: Request) {
    const user = req.user as { sub: string; sessionId?: string };
    const ip = req.ip || req.socket.remoteAddress;

    // sessionId debería venir del token o del body
    const sessionId = req.body?.sessionId || user.sessionId;

    return this.authService.logout(user.sub, sessionId, ip);
  }

  /**
   * POST /auth/logout-all
   * Cierra todas las sesiones del usuario (Logout Global)
   */
  @Post('logout-all')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async logoutAll(@Req() req: Request) {
    const user = req.user as { sub: string };
    const ip = req.ip || req.socket.remoteAddress;

    return this.authService.logoutAll(user.sub, ip);
  }
}
