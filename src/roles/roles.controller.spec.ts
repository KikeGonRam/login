import { RolesController } from './roles.controller';

describe('RolesController', () => {
  let controller: RolesController;
  const rolesService = {
    findAll: jest.fn(),
    create: jest.fn(),
    assignRole: jest.fn(),
    removeRole: jest.fn(),
    getUserRoles: jest.fn(),
  };

  beforeEach(() => {
    controller = new RolesController(rolesService as any);
  });

  it('findAll debe retornar roles', async () => {
    rolesService.findAll.mockResolvedValue([{ id: 'r1' }]);
    await expect(controller.findAll()).resolves.toEqual([{ id: 'r1' }]);
  });

  it('create debe delegar a service', async () => {
    rolesService.create.mockResolvedValue({ id: 'r1' });
    await expect(controller.create({ code: 'SUPPORT_AGENT' })).resolves.toEqual({ id: 'r1' });
  });

  it('assignRole debe delegar a service', async () => {
    rolesService.assignRole.mockResolvedValue({ id: 'ur1' });
    const req = { user: { sub: 'admin' }, ip: '127.0.0.1', socket: {} } as any;
    await expect(controller.assignRole({ userId: 'u1', roleCode: 'SUPPORT_AGENT' }, req)).resolves.toEqual({
      id: 'ur1',
    });
  });

  it('removeRole debe delegar a service', async () => {
    rolesService.removeRole.mockResolvedValue({ message: 'ok' });
    const req = { user: { sub: 'admin' }, ip: '127.0.0.1', socket: {} } as any;
    await expect(controller.removeRole('u1', 'SUPPORT_AGENT', req)).resolves.toEqual({ message: 'ok' });
  });

  it('getUserRoles debe delegar a service', async () => {
    rolesService.getUserRoles.mockResolvedValue([{ id: 'r1' }]);
    await expect(controller.getUserRoles('u1')).resolves.toEqual([{ id: 'r1' }]);
  });
});
