import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { ThrottlerModule } from '@nestjs/throttler';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

describe('AuthController (integration)', () => {
  let app: INestApplication;
  const authService = {
    login: jest.fn(),
    verifyMfaAndIssueTokens: jest.fn(),
    refresh: jest.fn(),
    logout: jest.fn(),
    logoutAll: jest.fn(),
  };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [
        ThrottlerModule.forRoot([
          {
            name: 'default',
            ttl: 60,
            limit: 5,
          },
        ]),
      ],
      controllers: [AuthController],
      providers: [{ provide: AuthService, useValue: authService }],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  it('POST /auth/login', async () => {
    authService.login.mockResolvedValue({ sessionId: 's1', message: 'Código MFA enviado' });

    await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'admin@loginglobal.com', password: 'Admin@123456' })
      .expect(200)
      .expect({ sessionId: 's1', message: 'Código MFA enviado' });
  });

  it('POST /auth/mfa/verify', async () => {
    authService.verifyMfaAndIssueTokens.mockResolvedValue({
      accessToken: 'access',
      refreshToken: 'refresh',
      user: { id: 'u1', email: 'admin@loginglobal.com', roles: [], systems: [] },
    });

    await request(app.getHttpServer())
      .post('/auth/mfa/verify')
      .send({ sessionId: 's1', code: '123456' })
      .expect(200)
      .expect({
        accessToken: 'access',
        refreshToken: 'refresh',
        user: { id: 'u1', email: 'admin@loginglobal.com', roles: [], systems: [] },
      });
  });

  it('POST /auth/refresh', async () => {
    authService.refresh.mockResolvedValue({ accessToken: 'new-token' });

    await request(app.getHttpServer())
      .post('/auth/refresh')
      .send({ refreshToken: 'refresh' })
      .expect(200)
      .expect({ accessToken: 'new-token' });
  });
});
