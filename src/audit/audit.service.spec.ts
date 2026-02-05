import { AuditService } from './audit.service';

describe('AuditService', () => {
  let service: AuditService;
  let prisma: any;

  beforeEach(() => {
    prisma = {
      auditLog: {
        create: jest.fn(),
        findMany: jest.fn(),
      },
    };

    service = new AuditService(prisma);
  });

  it('log debe crear registro', async () => {
    prisma.auditLog.create.mockResolvedValue({ id: 'a1' });

    await service.log('u1', 'LOGIN_SUCCESS', 'ok', '127.0.0.1');

    expect(prisma.auditLog.create).toHaveBeenCalledWith({
      data: {
        userId: 'u1',
        action: 'LOGIN_SUCCESS',
        description: 'ok',
        ipAddress: '127.0.0.1',
      },
    });
  });

  it('getLogs debe aplicar filtros', async () => {
    prisma.auditLog.findMany.mockResolvedValue([{ id: 'a1' }]);

    await expect(
      service.getLogs({ userId: 'u1', action: 'LOGIN_SUCCESS', limit: 10, offset: 0 }),
    ).resolves.toEqual([{ id: 'a1' }]);
  });
});
