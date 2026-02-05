import { UsersController } from './users.controller';

describe('UsersController', () => {
  let controller: UsersController;
  const usersService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findById: jest.fn(),
    updateProfile: jest.fn(),
    disable: jest.fn(),
  };

  beforeEach(() => {
    controller = new UsersController(usersService as any);
  });

  it('create debe delegar a service', async () => {
    usersService.create.mockResolvedValue({ id: 'u1' });

    const req = { user: { sub: 'admin' }, ip: '127.0.0.1', socket: {} } as any;
    const dto = {
      email: 'a@b.com',
      password: 'Pass123!',
      firstName: 'A',
      lastName: 'B',
      birthDate: new Date(),
      hireDate: new Date(),
      departmentId: 'd1',
      positionId: 'p1',
    };

    await expect(controller.create(dto as any, req)).resolves.toEqual({ id: 'u1' });
  });

  it('findAll debe retornar usuarios', async () => {
    usersService.findAll.mockResolvedValue([{ id: 'u1' }]);
    await expect(controller.findAll()).resolves.toEqual([{ id: 'u1' }]);
  });

  it('findById debe retornar usuario', async () => {
    usersService.findById.mockResolvedValue({ id: 'u1' });
    await expect(controller.findById('u1')).resolves.toEqual({ id: 'u1' });
  });

  it('updateProfile debe delegar a service', async () => {
    usersService.updateProfile.mockResolvedValue({ id: 'p1' });

    const req = { user: { sub: 'admin' }, ip: '127.0.0.1', socket: {} } as any;
    await expect(controller.updateProfile('u1', { firstName: 'A' }, req)).resolves.toEqual({
      id: 'p1',
    });
  });

  it('disable debe delegar a service', async () => {
    usersService.disable.mockResolvedValue({ message: 'ok' });

    const req = { user: { sub: 'admin' }, ip: '127.0.0.1', socket: {} } as any;
    await expect(controller.disable('u1', req)).resolves.toEqual({ message: 'ok' });
  });
});
