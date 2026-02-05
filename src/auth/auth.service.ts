import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';
import * as crypto from 'crypto';
import { PrismaService } from '../common/prisma.service';
import { MfaService } from '../mfa/mfa.service';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private mfaService: MfaService,
    private auditService: AuditService,
  ) {}

  /**
   * Valida credenciales del usuario
   */
  async validateUser(email: string, password: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return null;
    }

    if (user.status !== 'ACTIVE') {
      return null;
    }

    const isValid = await argon2.verify(user.passwordHash, password);
    if (!isValid) {
      return null;
    }

    return user;
  }

  /**
   * Inicia sesión: valida credenciales, crea sesión y envía código MFA
   */
  async login(email: string, password: string, ip?: string, userAgent?: string) {
    const user = await this.validateUser(email, password);

    if (!user) {
      await this.auditService.log(null, 'LOGIN_FAILED', `Email: ${email}`, ip);
      throw new UnauthorizedException('Credenciales inválidas');
    }

    // Crear sesión pendiente de MFA
    const session = await this.prisma.session.create({
      data: {
        userId: user.id,
        ipAddress: ip,
        userAgent: userAgent,
        active: false, // Se activa después del MFA
        expiresAt: new Date(Date.now() + 15 * 60 * 1000), // 15 min para completar MFA
      },
    });

    // Enviar código MFA
    await this.mfaService.sendCode(user.id);

    await this.auditService.log(user.id, 'LOGIN_PENDING_MFA', 'Login exitoso, pendiente MFA', ip);

    return {
      sessionId: session.id,
      message: 'Código MFA enviado',
    };
  }

  /**
   * Verifica código MFA y emite tokens
   */
  async verifyMfaAndIssueTokens(sessionId: string, code: string, ip?: string) {
    const userId = await this.mfaService.verifyCode(sessionId, code);

    // Activar sesión
    await this.prisma.session.update({
      where: { id: sessionId },
      data: {
        active: true,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 horas
      },
    });

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        roles: { include: { role: true } },
        systems: { include: { system: true } },
      },
    });

    if (!user) {
      throw new UnauthorizedException('Usuario no encontrado');
    }

    const payload = {
      sub: user.id,
      email: user.email,
      roles: user.roles.map((r) => r.role.code),
      systems: user.systems.map((s) => s.system.code),
    };

    const accessToken = this.jwtService.sign(payload);
    const refreshToken = crypto.randomUUID();

    await this.prisma.refreshToken.create({
      data: {
        userId: user.id,
        token: refreshToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 días
      },
    });

    await this.auditService.log(user.id, 'MFA_VERIFIED', 'MFA verificado, tokens emitidos', ip);
    await this.auditService.log(user.id, 'LOGIN_SUCCESS', 'Login completado exitosamente', ip);

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        roles: payload.roles,
        systems: payload.systems,
      },
    };
  }

  /**
   * Renueva access token usando refresh token
   */
  async refresh(refreshTokenValue: string, ip?: string) {
    const refreshToken = await this.prisma.refreshToken.findFirst({
      where: {
        token: refreshTokenValue,
        revoked: false,
        expiresAt: { gt: new Date() },
      },
      include: {
        user: {
          include: {
            roles: { include: { role: true } },
            systems: { include: { system: true } },
          },
        },
      },
    });

    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token inválido o expirado');
    }

    if (refreshToken.user.status !== 'ACTIVE') {
      throw new UnauthorizedException('Usuario deshabilitado');
    }

    const payload = {
      sub: refreshToken.user.id,
      email: refreshToken.user.email,
      roles: refreshToken.user.roles.map((r) => r.role.code),
      systems: refreshToken.user.systems.map((s) => s.system.code),
    };

    const accessToken = this.jwtService.sign(payload);

    await this.auditService.log(refreshToken.user.id, 'TOKEN_REFRESHED', 'Access token renovado', ip);

    return {
      accessToken,
    };
  }

  /**
   * Cierra sesión actual
   */
  async logout(userId: string, sessionId: string, ip?: string) {
    // Desactivar sesión específica
    await this.prisma.session.updateMany({
      where: {
        id: sessionId,
        userId: userId,
      },
      data: { active: false },
    });

    await this.auditService.log(userId, 'LOGOUT', 'Sesión cerrada', ip);

    return { message: 'Sesión cerrada exitosamente' };
  }

  /**
   * Cierra todas las sesiones del usuario (Logout Global)
   */
  async logoutAll(userId: string, ip?: string) {
    // Desactivar todas las sesiones
    await this.prisma.session.updateMany({
      where: { userId },
      data: { active: false },
    });

    // Revocar todos los refresh tokens
    await this.prisma.refreshToken.updateMany({
      where: {
        userId,
        revoked: false,
      },
      data: { revoked: true },
    });

    await this.auditService.log(userId, 'LOGOUT_GLOBAL', 'Todas las sesiones cerradas', ip);

    return { message: 'Todas las sesiones cerradas exitosamente' };
  }

  /**
   * Valida un JWT y retorna el payload
   */
  async validateToken(token: string) {
    try {
      const payload = this.jwtService.verify(token);
      return payload;
    } catch {
      throw new UnauthorizedException('Token inválido');
    }
  }
}
