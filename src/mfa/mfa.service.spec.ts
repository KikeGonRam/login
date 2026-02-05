import { UnauthorizedException } from '@nestjs/common';
import { MfaService } from './mfa.service';

describe('MfaService', () => {
  let service: MfaService;
  let prisma: any;

  beforeEach(() => {
    prisma = {
      mfaCode: {
        create: jest.fn(),
        findFirst: jest.fn(),
        update: jest.fn(),
      },
      session: {
        findUnique: jest.fn(),
      },
    };

    service = new MfaService(prisma);
  });

  it('debe rechazar si sesión inválida', async () => {
    prisma.session.findUnique.mockResolvedValue(null);

    await expect(service.verifyCode('s1', '123456')).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('debe validar código MFA', async () => {
    prisma.session.findUnique.mockResolvedValue({ id: 's1', userId: 'u1', active: true });
    prisma.mfaCode.findFirst.mockResolvedValue({ id: 'm1', userId: 'u1' });
    prisma.mfaCode.update.mockResolvedValue({ id: 'm1', used: true });

    await expect(service.verifyCode('s1', '123456')).resolves.toBe('u1');
  });
});
