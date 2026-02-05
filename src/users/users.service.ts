import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import * as argon2 from 'argon2';
import { PrismaService } from '../common/prisma.service';
import { AuditService } from '../audit/audit.service';
import { ActivationTokenService } from '../email/activation-token.service';

export interface CreateUserDto {
  email: string;
  password?: string; // Opcional - será ignorado en PENDING_ACTIVATION
  phone?: string;
  firstName: string;
  lastName: string;
  birthDate: Date;
  hireDate: Date;
  departmentId: string;
  positionId: string;
  photoUrl?: string;
}

export interface UpdateProfileDto {
  firstName?: string;
  lastName?: string;
  photoUrl?: string;
  phone?: string;
}

@Injectable()
export class UsersService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
    private activationTokenService: ActivationTokenService,
  ) {}

  /**
   * Crea un nuevo usuario en estado PENDING_ACTIVATION
   * 
   * IMPORTANTE: El usuario NO tiene contraseña al crearse
   * Debe activarse por correo (token de un solo uso)
   * Luego crea su contraseña
   * 
   * Flujo:
   * 1. Admin crea usuario
   * 2. Estado: PENDING_ACTIVATION
   * 3. Token de activación generado
   * 4. Correo enviado (async)
   * 5. Usuario activa + crea contraseña
   * 6. Estado: ACTIVE
   * 7. Auditoría registra TODO
   */
  async create(dto: CreateUserDto, createdByUserId?: string, ip?: string) {
    // Verificar que el email no existe
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existingUser) {
      throw new BadRequestException('El email ya está registrado');
    }

    // Crear usuario en estado PENDING_ACTIVATION sin contraseña
    // Usamos contraseña temporal que será reemplazada en activate()
    const tempPassword = 'TEMPORARY_PASSWORD_' + Date.now();
    const passwordHash = await argon2.hash(tempPassword);

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        passwordHash,
        phone: dto.phone,
        status: 'PENDING_ACTIVATION', // NUEVO: Estado inicial
        profile: {
          create: {
            firstName: dto.firstName,
            lastName: dto.lastName,
            birthDate: dto.birthDate,
            hireDate: dto.hireDate,
            departmentId: dto.departmentId,
            positionId: dto.positionId,
            photoUrl: dto.photoUrl,
          },
        },
      },
      include: {
        profile: {
          include: {
            department: true,
            position: true,
          },
        },
      },
    });

    // Generar token de activación (seguro, un solo uso, máx 24h)
    const activationToken = await this.activationTokenService.generateActivationToken(dto.email);

    await this.auditService.log(
      createdByUserId || null,
      'USER_CREATED',
      `Usuario creado en PENDING_ACTIVATION: ${dto.email}. Token generado.`,
      ip,
    );

    // No retornar passwordHash
    const { passwordHash: _, ...userWithoutPassword } = user;
    return {
      ...userWithoutPassword,
      activationToken, // IMPORTANTE: Retornar token para que se pueda enviar por correo
    };
  }

  /**
   * Obtiene todos los usuarios
   */
  async findAll() {
    const users = await this.prisma.user.findMany({
      include: {
        profile: {
          include: {
            department: true,
            position: true,
          },
        },
        roles: {
          include: { role: true },
        },
        systems: {
          include: { system: true },
        },
      },
    });

    // No retornar passwordHash
    return users.map(({ passwordHash, ...user }) => user);
  }

  /**
   * Obtiene un usuario por ID
   */
  async findById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        profile: {
          include: {
            department: true,
            position: true,
          },
        },
        roles: {
          include: { role: true },
        },
        systems: {
          include: { system: true },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    const { passwordHash, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  /**
   * Actualiza el perfil de un usuario
   */
  async updateProfile(userId: string, dto: UpdateProfileDto, updatedByUserId?: string, ip?: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { profile: true },
    });

    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    // Actualizar teléfono en User si se proporciona
    if (dto.phone !== undefined) {
      await this.prisma.user.update({
        where: { id: userId },
        data: { phone: dto.phone },
      });
    }

    // Actualizar perfil
    const profile = await this.prisma.userProfile.update({
      where: { userId },
      data: {
        firstName: dto.firstName,
        lastName: dto.lastName,
        photoUrl: dto.photoUrl,
      },
      include: {
        department: true,
        position: true,
      },
    });

    await this.auditService.log(
      updatedByUserId || null,
      'USER_UPDATED',
      `Perfil actualizado: ${user.email}`,
      ip,
    );

    return profile;
  }

  /**
   * Deshabilita un usuario
   */
  async disable(userId: string, disabledByUserId?: string, ip?: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: { status: 'DISABLED' },
    });

    // Revocar todas las sesiones y tokens
    await this.prisma.session.updateMany({
      where: { userId },
      data: { active: false },
    });

    await this.prisma.refreshToken.updateMany({
      where: { userId },
      data: { revoked: true },
    });

    await this.auditService.log(
      disabledByUserId || null,
      'USER_DISABLED',
      `Usuario deshabilitado: ${user.email}`,
      ip,
    );

    return { message: 'Usuario deshabilitado exitosamente' };
  }

  /**
   * Activa un usuario con token de un solo uso + contraseña
   *
   * Validaciones:
   * - Token válido (no expirado, no usado)
   * - Contraseña segura (Argon2)
   *
   * Transacción:
   * 1. Validar token
   * 2. Obtener usuario por email
   * 3. Actualizar passwordHash
   * 4. Cambiar estado a ACTIVE
   * 5. Marcar token como usado
   * 6. Auditar evento
   *
   * @param token Token de activación (64 caracteres)
   * @param password Contraseña nueva (validada por DTO)
   * @param ip IP del cliente
   */
  async activate(token: string, password: string, ip?: string) {
    // Validar token (esto lanza BadRequestException si es inválido)
    const email = await this.activationTokenService.validateActivationToken(token);

    // Obtener usuario por email
    const user = await this.prisma.user.findUnique({
      where: { email },
      include: {
        profile: {
          include: {
            department: true,
            position: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    // Verificar que está en PENDING_ACTIVATION
    if (user.status !== 'PENDING_ACTIVATION') {
      throw new BadRequestException(
        `Usuario no puede ser activado. Estado actual: ${user.status}`,
      );
    }

    // Hash de contraseña segura
    const passwordHash = await argon2.hash(password);

    // Actualizar usuario: contraseña + estado ACTIVE
    const activatedUser = await this.prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        status: 'ACTIVE',
      },
      include: {
        profile: {
          include: {
            department: true,
            position: true,
          },
        },
      },
    });

    // Marcar token como usado (no reutilizable)
    await this.activationTokenService.markTokenAsUsed(token);

    // Auditar evento de activación
    await this.auditService.log(
      user.id,
      'USER_ACTIVATED',
      `Usuario completó activación y creó contraseña`,
      ip,
    );

    // No retornar passwordHash
    const { passwordHash: _, ...userWithoutPassword } = activatedUser;
    return {
      ...userWithoutPassword,
      message: 'Cuenta activada exitosamente. Ahora puedes iniciar sesión.',
    };
  }
}
