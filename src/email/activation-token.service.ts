import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { randomBytes } from 'crypto';

/**
 * Activation Token Service
 *
 * Responsabilidades:
 * - Generar tokens seguros de un solo uso
 * - Validar tokens (no expirados, no usados)
 * - Marcar tokens como usados
 * - Limpiar tokens expirados
 *
 * SEGURIDAD:
 * - Tokens aleatorios (32 bytes = 64 caracteres hex)
 * - Máxima validez: 24 horas
 * - Una sola vez (flag 'used')
 * - No reutilizables
 */
@Injectable()
export class ActivationTokenService {
  private readonly TOKEN_LENGTH = 32; // 32 bytes = 256 bits
  private readonly TOKEN_EXPIRY_HOURS = 24;

  constructor(private prisma: PrismaService) {}

  /**
   * Genera un token de activación seguro
   * @param email Email del usuario
   * @returns Token aleatorio (64 caracteres hex)
   */
  async generateActivationToken(email: string): Promise<string> {
    // Limpiar token anterior si existe
    await this.prisma.activationToken.deleteMany({
      where: { email },
    });

    // Generar token seguro
    const token = randomBytes(this.TOKEN_LENGTH).toString('hex');
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + this.TOKEN_EXPIRY_HOURS);

    // Guardar token
    await this.prisma.activationToken.create({
      data: {
        email,
        token,
        expiresAt,
      },
    });

    return token;
  }

  /**
   * Valida un token de activación
   * Verifica:
   * - Existe
   * - No ha expirado
   * - No ha sido usado
   *
   * @param token Token a validar
   * @returns Email asociado al token válido
   * @throws BadRequestException si token inválido/expirado/usado
   */
  async validateActivationToken(token: string): Promise<string> {
    const activationToken = await this.prisma.activationToken.findUnique({
      where: { token },
    });

    if (!activationToken) {
      throw new BadRequestException('Token de activación inválido o no existe');
    }

    if (activationToken.used) {
      throw new BadRequestException('Token de activación ya fue utilizado');
    }

    const now = new Date();
    if (activationToken.expiresAt < now) {
      throw new BadRequestException(
        `Token de activación expirado. Válido hasta: ${activationToken.expiresAt.toISOString()}`,
      );
    }

    return activationToken.email;
  }

  /**
   * Marca un token como usado
   * Se ejecuta después de activación exitosa
   *
   * @param token Token a marcar como usado
   */
  async markTokenAsUsed(token: string): Promise<void> {
    const result = await this.prisma.activationToken.updateMany({
      where: { token },
      data: { used: true },
    });

    if (result.count === 0) {
      throw new NotFoundException('Token no encontrado');
    }
  }

  /**
   * Limpia tokens expirados (tarea programada - cron)
   * Ejecutar diariamente en horario de bajo uso
   */
  async cleanupExpiredTokens(): Promise<number> {
    const result = await this.prisma.activationToken.deleteMany({
      where: {
        expiresAt: {
          lt: new Date(),
        },
      },
    });

    return result.count;
  }

  /**
   * Obtiene información del token (para debugging)
   */
  async getTokenInfo(token: string) {
    return this.prisma.activationToken.findUnique({
      where: { token },
      select: {
        email: true,
        expiresAt: true,
        used: true,
        createdAt: true,
      },
    });
  }
}
