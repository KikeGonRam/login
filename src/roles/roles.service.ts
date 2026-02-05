import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class RolesService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
  ) {}

  /**
   * Obtiene todos los roles
   */
  async findAll() {
    return this.prisma.role.findMany();
  }

  /**
   * Crea un nuevo rol
   */
  async create(code: string, description?: string) {
    return this.prisma.role.create({
      data: { code, description },
    });
  }

  /**
   * Asigna un rol a un usuario
   * Regla crítica: Solo puede existir UN usuario con rol SYSTEM_ADMIN
   */
  async assignRole(userId: string, roleCode: string, assignedByUserId?: string, ip?: string) {
    // Verificar que el usuario existe
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    // Regla crítica: Solo un SYSTEM_ADMIN puede existir
    if (roleCode === 'SYSTEM_ADMIN') {
      const adminCount = await this.prisma.userRole.count({
        where: {
          role: { code: 'SYSTEM_ADMIN' },
        },
      });

      if (adminCount >= 1) {
        throw new BadRequestException(
          'Ya existe un administrador del sistema. Solo puede haber uno.',
        );
      }
    }

    // Obtener el rol
    const role = await this.prisma.role.findUnique({
      where: { code: roleCode },
    });

    if (!role) {
      throw new NotFoundException(`Rol '${roleCode}' no encontrado`);
    }

    // Verificar que el usuario no tenga ya ese rol
    const existingAssignment = await this.prisma.userRole.findUnique({
      where: {
        userId_roleId: {
          userId,
          roleId: role.id,
        },
      },
    });

    if (existingAssignment) {
      throw new BadRequestException('El usuario ya tiene este rol asignado');
    }

    // Asignar el rol
    const userRole = await this.prisma.userRole.create({
      data: {
        userId,
        roleId: role.id,
      },
      include: {
        role: true,
        user: true,
      },
    });

    // Auditar la asignación
    await this.auditService.log(
      assignedByUserId || null,
      'ROLE_ASSIGNED',
      `Rol ${roleCode} asignado al usuario ${user.email}`,
      ip,
    );

    return userRole;
  }

  /**
   * Remueve un rol de un usuario
   */
  async removeRole(userId: string, roleCode: string, removedByUserId?: string, ip?: string) {
    const role = await this.prisma.role.findUnique({
      where: { code: roleCode },
    });

    if (!role) {
      throw new NotFoundException(`Rol '${roleCode}' no encontrado`);
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    await this.prisma.userRole.delete({
      where: {
        userId_roleId: {
          userId,
          roleId: role.id,
        },
      },
    });

    await this.auditService.log(
      removedByUserId || null,
      'ROLE_REMOVED',
      `Rol ${roleCode} removido del usuario ${user.email}`,
      ip,
    );

    return { message: 'Rol removido exitosamente' };
  }

  /**
   * Obtiene los roles de un usuario
   */
  async getUserRoles(userId: string) {
    return this.prisma.userRole.findMany({
      where: { userId },
      include: { role: true },
    });
  }
}

