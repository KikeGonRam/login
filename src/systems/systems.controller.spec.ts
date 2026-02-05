import { SystemsController } from './systems.controller';

describe('SystemsController', () => {
  let controller: SystemsController;
  const systemsService = {
    findAll: jest.fn(),
    create: jest.fn(),
    assignUserAccess: jest.fn(),
    removeUserAccess: jest.fn(),
    getUserSystems: jest.fn(),
  };

  beforeEach(() => {
    controller = new SystemsController(systemsService as any);
  });

  it('findAll debe retornar sistemas', async () => {
    systemsService.findAll.mockResolvedValue([{ id: 's1' }]);
    await expect(controller.findAll()).resolves.toEqual([{ id: 's1' }]);
  });

  it('create debe delegar a service', async () => {
    systemsService.create.mockResolvedValue({ id: 's1' });
    await expect(controller.create({ code: 'SYS', name: 'Sistema' })).resolves.toEqual({ id: 's1' });
  });

  it('assignAccess debe delegar a service', async () => {
    systemsService.assignUserAccess.mockResolvedValue({ id: 'us1' });
    await expect(controller.assignAccess({ userId: 'u1', systemCode: 'SYS' })).resolves.toEqual({ id: 'us1' });
  });

  it('removeAccess debe delegar a service', async () => {
    systemsService.removeUserAccess.mockResolvedValue({ message: 'ok' });
    await expect(controller.removeAccess('u1', 'SYS')).resolves.toEqual({ message: 'ok' });
  });

  it('getUserSystems debe delegar a service', async () => {
    systemsService.getUserSystems.mockResolvedValue([{ id: 'us1' }]);
    await expect(controller.getUserSystems('u1')).resolves.toEqual([{ id: 'us1' }]);
  });
});