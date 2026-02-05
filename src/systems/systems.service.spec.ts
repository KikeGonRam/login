import { SystemsService } from './systems.service';

describe('SystemsService', () => {
  let service: SystemsService;
  let prisma: any;

  beforeEach(() => {
    prisma = {
      system: {
        findMany: jest.fn(),
        create: jest.fn(),
        findUnique: jest.fn(),
      },
      userSystem: {
        create: jest.fn(),
        delete: jest.fn(),
        findMany: jest.fn(),
      },
    };

    service = new SystemsService(prisma);
  });

  it('findAll debe retornar sistemas', async () => {
    prisma.system.findMany.mockResolvedValue([{ id: 's1' }]);
    await expect(service.findAll()).resolves.toEqual([{ id: 's1' }]);
  });

  it('assignUserAccess debe fallar si sistema no existe', async () => {
    prisma.system.findUnique.mockResolvedValue(null);
    await expect(service.assignUserAccess('u1', 'SYS')).rejects.toThrow(
      "Sistema 'SYS' no encontrado",
    );
  });

  it('assignUserAccess debe crear relación', async () => {
    prisma.system.findUnique.mockResolvedValue({ id: 's1' });
    prisma.userSystem.create.mockResolvedValue({ userId: 'u1', systemId: 's1' });

    await expect(service.assignUserAccess('u1', 'SYS')).resolves.toEqual({
      userId: 'u1',
      systemId: 's1',
    });
  });

  it('removeUserAccess debe fallar si sistema no existe', async () => {
    prisma.system.findUnique.mockResolvedValue(null);
    await expect(service.removeUserAccess('u1', 'SYS')).rejects.toThrow(
      "Sistema 'SYS' no encontrado",
    );
  });

  it('removeUserAccess debe eliminar acceso', async () => {
    prisma.system.findUnique.mockResolvedValue({ id: 's1' });
    prisma.userSystem.delete.mockResolvedValue({});

    await expect(service.removeUserAccess('u1', 'SYS')).resolves.toEqual({
      message: 'Acceso removido',
    });
  });

  it('getUserSystems debe retornar accesos', async () => {
    prisma.userSystem.findMany.mockResolvedValue([{ id: 'us1' }]);
    await expect(service.getUserSystems('u1')).resolves.toEqual([{ id: 'us1' }]);
  });
});
