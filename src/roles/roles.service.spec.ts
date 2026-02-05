import { BadRequestException, NotFoundException } from '@nestjs/common';
import { RolesService } from './roles.service';

describe('RolesService', () => {
  let service: RolesService;
  let prisma: any;
  let auditService: any;

  beforeEach(() => {
    prisma = {
      user: {
        findUnique: jest.fn(),
      },
      role: {
        findUnique: jest.fn(),
      },
      userRole: {
        count: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        delete: jest.fn(),
      },
    };

    auditService = {
      log: jest.fn(),
    };

    service = new RolesService(prisma, auditService);
  });

  it('debe impedir múltiples SYSTEM_ADMIN', async () => {
    prisma.user.findUnique.mockResolvedValue({ id: 'u1', email: 'a@b.com' });
    prisma.userRole.count.mockResolvedValue(1);

    await expect(
      service.assignRole('u1', 'SYSTEM_ADMIN', 'admin'),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('debe lanzar error si usuario no existe', async () => {
    prisma.user.findUnique.mockResolvedValue(null);

    await expect(service.assignRole('u1', 'SUPPORT_AGENT')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('debe asignar rol correctamente', async () => {
    prisma.user.findUnique.mockResolvedValue({ id: 'u1', email: 'a@b.com' });
    prisma.userRole.count.mockResolvedValue(0);
    prisma.role.findUnique.mockResolvedValue({ id: 'r1', code: 'SUPPORT_AGENT' });
    prisma.userRole.findUnique.mockResolvedValue(null);
    prisma.userRole.create.mockResolvedValue({ id: 'ur1' });

    await expect(
      service.assignRole('u1', 'SUPPORT_AGENT', 'admin', '127.0.0.1'),
    ).resolves.toEqual({ id: 'ur1' });
  });

  it('debe remover rol correctamente', async () => {
    prisma.role.findUnique.mockResolvedValue({ id: 'r1', code: 'SUPPORT_AGENT' });
    prisma.user.findUnique.mockResolvedValue({ id: 'u1', email: 'a@b.com' });
    prisma.userRole.delete.mockResolvedValue({});

    await expect(
      service.removeRole('u1', 'SUPPORT_AGENT', 'admin', '127.0.0.1'),
    ).resolves.toEqual({ message: 'Rol removido exitosamente' });
  });
});
