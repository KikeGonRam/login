import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';

@Injectable()
export class SystemsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Lista todos los sistemas
   */
  async findAll() {
    return this.prisma.system.findMany();
  }

  /**
   * Crea un nuevo sistema
   */
  async create(code: string, name: string) {
    return this.prisma.system.create({
      data: { code, name },
    });
  }

  /**
   * Asigna acceso a un sistema para un usuario
   */
  async assignUserAccess(userId: string, systemCode: string) {
    const system = await this.prisma.system.findUnique({
      where: { code: systemCode },
    });

    if (!system) {
      throw new Error(`Sistema '${systemCode}' no encontrado`);
    }

    return this.prisma.userSystem.create({
      data: {
        userId,
        systemId: system.id,
      },
    });
  }

  /**
   * Remueve acceso a un sistema para un usuario
   */
  async removeUserAccess(userId: string, systemCode: string) {
    const system = await this.prisma.system.findUnique({
      where: { code: systemCode },
    });

    if (!system) {
      throw new Error(`Sistema '${systemCode}' no encontrado`);
    }

    await this.prisma.userSystem.delete({
      where: {
        userId_systemId: {
          userId,
          systemId: system.id,
        },
      },
    });

    return { message: 'Acceso removido' };
  }

  /**
   * Obtiene los sistemas a los que tiene acceso un usuario
   */
  async getUserSystems(userId: string) {
    return this.prisma.userSystem.findMany({
      where: { userId },
      include: { system: true },
    });
  }
}
