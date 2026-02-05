import { SessionsService } from './sessions.service';

describe('SessionsService', () => {
  let service: SessionsService;
  let prisma: any;

  beforeEach(() => {
    prisma = {
      session: {
        findMany: jest.fn(),
        updateMany: jest.fn(),
        deleteMany: jest.fn(),
      },
    };

    service = new SessionsService(prisma);
  });

  it('getActiveSessions debe consultar sesiones activas', async () => {
    prisma.session.findMany.mockResolvedValue([{ id: 's1' }]);
    await expect(service.getActiveSessions('u1')).resolves.toEqual([{ id: 's1' }]);
  });

  it('invalidateSession debe desactivar sesión', async () => {
    prisma.session.updateMany.mockResolvedValue({ count: 1 });
    await expect(service.invalidateSession('s1', 'u1')).resolves.toEqual({
      message: 'Sesión invalidada',
    });
  });

  it('cleanExpiredSessions debe retornar count', async () => {
    prisma.session.deleteMany.mockResolvedValue({ count: 3 });
    await expect(service.cleanExpiredSessions()).resolves.toEqual({ cleaned: 3 });
  });
});
