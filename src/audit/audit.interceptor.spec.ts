import { of } from 'rxjs';
import { AuditInterceptor } from './audit.interceptor';

describe('AuditInterceptor', () => {
  it('no audita si no es http', (done) => {
    const auditService = { log: jest.fn() } as any;
    const interceptor = new AuditInterceptor(auditService);

    const context: any = {
      getType: () => 'rpc',
    };

    const next: any = {
      handle: () => of('ok'),
    };

    interceptor.intercept(context, next).subscribe((value) => {
      expect(value).toBe('ok');
      expect(auditService.log).not.toHaveBeenCalled();
      done();
    });
  });

  it('audita si corresponde', (done) => {
    const auditService = { log: jest.fn().mockResolvedValue(undefined) } as any;
    const interceptor = new AuditInterceptor(auditService);

    const context: any = {
      getType: () => 'http',
      switchToHttp: () => ({
        getRequest: () => ({
          method: 'POST',
          originalUrl: '/users',
          ip: '127.0.0.1',
          user: { sub: 'u1' },
        }),
      }),
    };

    const next: any = {
      handle: () => of('ok'),
    };

    interceptor.intercept(context, next).subscribe((value) => {
      expect(value).toBe('ok');
      expect(auditService.log).toHaveBeenCalled();
      done();
    });
  });
});
