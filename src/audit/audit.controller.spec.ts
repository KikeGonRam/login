import { AuditController } from './audit.controller';

describe('AuditController', () => {
  let controller: AuditController;
  const auditService = {
    getLogs: jest.fn(),
  };

  beforeEach(() => {
    controller = new AuditController(auditService as any);
  });

  it('getLogs debe parsear filtros', async () => {
    auditService.getLogs.mockResolvedValue([{ id: 'a1' }]);

    const result = await controller.getLogs(
      'u1',
      'LOGIN_SUCCESS',
      '2026-02-01',
      '2026-02-05',
      '10',
      '0',
    );

    expect(auditService.getLogs).toHaveBeenCalled();
    expect(result).toEqual([{ id: 'a1' }]);
  });
});
