import { BadRequestException, NotFoundException } from '@nestjs/common';
import * as argon2 from 'argon2';
import { UsersService } from './users.service';

jest.mock('argon2', () => ({
  hash: jest.fn(),
}));

describe('UsersService', () => {
  let service: UsersService;
  let prisma: any;
  let auditService: any;

  beforeEach(() => {
    prisma = {
      user: {
        findUnique: jest.fn(),
        create: jest.fn(),
        findMany: jest.fn(),
        update: jest.fn(),
      },
      userProfile: {
        update: jest.fn(),
      },
      session: {
        updateMany: jest.fn(),
      },
      refreshToken: {
        updateMany: jest.fn(),
      },
    };

    auditService = {
      log: jest.fn(),
    };

     activationTokenService = {
       generateActivationToken: jest.fn().mockResolvedValue('abc123token'),
       validateActivationToken: jest.fn(),
       markTokenAsUsed: jest.fn(),
     };

     service = new UsersService(prisma, auditService, activationTokenService);
  });

  it('create debe fallar si email existe', async () => {
    prisma.user.findUnique.mockResolvedValue({ id: 'u1' });

    await expect(
      service.create({
        email: 'a@b.com',
        password: 'Pass123!',
        firstName: 'A',
        lastName: 'B',
        birthDate: new Date(),
        hireDate: new Date(),
        departmentId: 'd1',
        positionId: 'p1',
      } as any),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('create debe crear usuario y auditar', async () => {
    prisma.user.findUnique.mockResolvedValue(null);
    (argon2.hash as jest.Mock).mockResolvedValue('hashed');
    prisma.user.create.mockResolvedValue({ id: 'u1', email: 'a@b.com', passwordHash: 'hashed' });

    const result = await service.create({
      email: 'a@b.com',
      password: 'Pass123!',
      firstName: 'A',
      lastName: 'B',
      birthDate: new Date(),
      hireDate: new Date(),
      departmentId: 'd1',
      positionId: 'p1',
    } as any);

    expect(result).toHaveProperty('id', 'u1');
    expect(result).toHaveProperty('email', 'a@b.com');
    expect(result).toHaveProperty('activationToken');
    expect(result.activationToken).toBe('abc123token');
    expect(auditService.log).toHaveBeenCalled();
  });

  it('findById debe fallar si no existe', async () => {
    prisma.user.findUnique.mockResolvedValue(null);

    await expect(service.findById('u1')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('findAll debe retornar usuarios sin passwordHash', async () => {
    prisma.user.findMany.mockResolvedValue([
      { id: 'u1', email: 'a@b.com', passwordHash: 'hash' },
    ]);

    await expect(service.findAll()).resolves.toEqual([{ id: 'u1', email: 'a@b.com' }]);
  });

  it('updateProfile debe actualizar perfil y auditar', async () => {
    prisma.user.findUnique.mockResolvedValue({ id: 'u1', email: 'a@b.com', profile: {} });
    prisma.user.update.mockResolvedValue({ id: 'u1' });
    prisma.userProfile.update.mockResolvedValue({ id: 'p1' });

    await expect(
      service.updateProfile('u1', { firstName: 'A', phone: '123' }, 'admin'),
    ).resolves.toEqual({ id: 'p1' });

    expect(auditService.log).toHaveBeenCalled();
  });

  it('disable debe deshabilitar usuario y auditar', async () => {
    prisma.user.findUnique.mockResolvedValue({ id: 'u1', email: 'a@b.com' });
    prisma.user.update.mockResolvedValue({ id: 'u1' });
    prisma.session.updateMany.mockResolvedValue({ count: 1 });
    prisma.refreshToken.updateMany.mockResolvedValue({ count: 1 });

    await expect(service.disable('u1', 'admin')).resolves.toEqual({
      message: 'Usuario deshabilitado exitosamente',
    });

    expect(auditService.log).toHaveBeenCalled();
  });
});
