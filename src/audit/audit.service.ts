import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';

export type AuditAction =
  | 'LOGIN_SUCCESS'
  | 'LOGIN_FAILED'
  | 'LOGIN_PENDING_MFA'
  | 'MFA_VERIFIED'
  | 'MFA_FAILED'
  | 'LOGOUT'
  | 'LOGOUT_GLOBAL'
  | 'TOKEN_REFRESHED'
  | 'ROLE_ASSIGNED'
  | 'ROLE_REMOVED'
  | 'USER_CREATED'
  | 'USER_UPDATED'
  | 'USER_DISABLED'
  | 'SYSTEM_ACCESS';

@Injectable()
export class AuditService {
  constructor(private prisma: PrismaService) {}

  /**
   * Registra una acción de auditoría
   */
  async log(
    userId: string | null,
    action: AuditAction | string,
    description?: string,
    ipAddress?: string,
  ) {
    await this.prisma.auditLog.create({
      data: {
        userId,
        action,
        description,
        ipAddress,
      },
    });
  }

  /**
   * Obtiene logs de auditoría con filtros
   */
  async getLogs(filters?: {
    userId?: string;
    action?: string;
    fromDate?: Date;
    toDate?: Date;
    limit?: number;
    offset?: number;
  }) {
    const { userId, action, fromDate, toDate, limit = 50, offset = 0 } = filters || {};

    return this.prisma.auditLog.findMany({
      where: {
        ...(userId && { userId }),
        ...(action && { action }),
        ...(fromDate || toDate
          ? {
              createdAt: {
                ...(fromDate && { gte: fromDate }),
                ...(toDate && { lte: toDate }),
              },
            }
          : {}),
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    });
  }
}

