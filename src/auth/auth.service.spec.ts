import { UnauthorizedException } from '@nestjs/common';
import * as argon2 from 'argon2';
import { AuthService } from './auth.service';

jest.mock('argon2', () => ({
  verify: jest.fn(),
}));

describe('AuthService', () => {
  let service: AuthService;
  let prisma: any;
  let jwtService: any;
  let mfaService: any;
  let auditService: any;

  beforeEach(() => {
    prisma = {
      user: {
        findUnique: jest.fn(),
      },
      session: {
        create: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn(),
      },
      refreshToken: {
        create: jest.fn(),
        findFirst: jest.fn(),
        updateMany: jest.fn(),
      },
    };

    jwtService = {
      sign: jest.fn(),
      verify: jest.fn(),
    };

    mfaService = {
      sendCode: jest.fn(),
      verifyCode: jest.fn(),
    };

    auditService = {
      log: jest.fn(),
    };

    service = new AuthService(prisma, jwtService, mfaService, auditService);
  });

  it('debe rechazar login con credenciales inválidas', async () => {
    jest.spyOn(service, 'validateUser').mockResolvedValue(null);

    await expect(service.login('x@y.com', 'bad')).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('debe rechazar refresh token inválido', async () => {
    prisma.refreshToken.findFirst.mockResolvedValue(null);

    await expect(service.refresh('invalid')).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('validateUser debe validar credenciales', async () => {
    prisma.user.findUnique.mockResolvedValue({
      id: 'u1',
      email: 'a@b.com',
      status: 'ACTIVE',
      passwordHash: 'hash',
    });
    (argon2.verify as jest.Mock).mockResolvedValue(true);

    await expect(service.validateUser('a@b.com', 'pass')).resolves.toEqual({
      id: 'u1',
      email: 'a@b.com',
      status: 'ACTIVE',
      passwordHash: 'hash',
    });
  });

  it('login debe crear sesión y enviar MFA', async () => {
    jest.spyOn(service, 'validateUser').mockResolvedValue({ id: 'u1', email: 'a@b.com' } as any);
    prisma.session.create.mockResolvedValue({ id: 's1' });

    await expect(service.login('a@b.com', 'pass', '127.0.0.1', 'agent')).resolves.toEqual({
      sessionId: 's1',
      message: 'Código MFA enviado',
    });

    expect(mfaService.sendCode).toHaveBeenCalledWith('u1');
  });

  it('verifyMfaAndIssueTokens debe emitir tokens', async () => {
    mfaService.verifyCode.mockResolvedValue('u1');
    prisma.session.update.mockResolvedValue({ id: 's1' });
    prisma.user.findUnique.mockResolvedValue({
      id: 'u1',
      email: 'a@b.com',
      roles: [{ role: { code: 'SYSTEM_ADMIN' } }],
      systems: [{ system: { code: 'SYS' } }],
    });
    jwtService.sign.mockReturnValue('access');
    prisma.refreshToken.create.mockResolvedValue({ id: 'r1' });

    await expect(service.verifyMfaAndIssueTokens('s1', '123456')).resolves.toMatchObject({
      accessToken: 'access',
      refreshToken: expect.any(String),
      user: {
        id: 'u1',
        email: 'a@b.com',
        roles: ['SYSTEM_ADMIN'],
        systems: ['SYS'],
      },
    });
  });

  it('logout debe desactivar sesión', async () => {
    prisma.session.updateMany.mockResolvedValue({ count: 1 });
    await expect(service.logout('u1', 's1')).resolves.toEqual({
      message: 'Sesión cerrada exitosamente',
    });
  });

  it('logoutAll debe revocar sesiones y tokens', async () => {
    prisma.session.updateMany.mockResolvedValue({ count: 1 });
    prisma.refreshToken.updateMany.mockResolvedValue({ count: 1 });

    await expect(service.logoutAll('u1')).resolves.toEqual({
      message: 'Todas las sesiones cerradas exitosamente',
    });
  });
});
