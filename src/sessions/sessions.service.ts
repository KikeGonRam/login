import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';

@Injectable()
export class SessionsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Obtiene sesiones activas de un usuario
   */
  async getActiveSessions(userId: string) {
    return this.prisma.session.findMany({
      where: {
        userId,
        active: true,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Invalida una sesión específica
   */
  async invalidateSession(sessionId: string, userId: string) {
    await this.prisma.session.updateMany({
      where: {
        id: sessionId,
        userId,
      },
      data: { active: false },
    });

    return { message: 'Sesión invalidada' };
  }

  /**
   * Limpia sesiones expiradas (para cron job)
   */
  async cleanExpiredSessions() {
    const result = await this.prisma.session.deleteMany({
      where: {
        expiresAt: { lt: new Date() },
      },
    });

    return { cleaned: result.count };
  }
}
