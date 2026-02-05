import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { EmailService } from './email.service';
import { EmailConfig } from './email.config';

// Mock nodemailer
jest.mock('nodemailer', () => ({
  createTransport: jest.fn(() => ({
    sendMail: jest.fn().mockResolvedValue({ messageId: 'test-message-id' }),
  })),
}));

describe('EmailService', () => {
  let service: EmailService;
  let configService: ConfigService;

  beforeEach(async () => {
    const mockConfigService = {
      get: jest.fn((key: string) => {
        const config = {
          EMAIL_PROVIDER: 'gmail',
          EMAIL_GMAIL_USER: 'test@gmail.com',
          EMAIL_GMAIL_APP_PASSWORD: 'test-app-password',
          EMAIL_FROM: 'noreply@test.com',
          APP_BASE_URL: 'https://test.com',
        };
        return config[key];
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmailService,
        EmailConfig,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<EmailService>(EmailService);
    configService = module.get<ConfigService>(ConfigService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('sendWelcomeEmail', () => {
    it('should send welcome email successfully', async () => {
      const result = await service.sendWelcomeEmail(
        'user@example.com',
        'John',
        'Doe',
        'abc123token',
        ['System1', 'System2'],
        'REQUESTOR',
      );

      expect(result).toBe(true);
    });

    it('should include required content in email', async () => {
      // Verificar que el contenido HTML contiene elementos obligatorios
      const content = service['buildWelcomeEmailContent'](
        'John',
        'Doe',
        'abc123token',
        ['System1'],
        'ADMIN',
      );

      expect(content).toContain('John Doe');
      expect(content).toContain('System1');
      expect(content).toContain('ADMIN');
      expect(content).toContain('ACTIVAR MI CUENTA');
      expect(content).toContain('⚠️ Importante'); // Secuencia de seguridad
      expect(content).toContain('24 horas');
      expect(content).toContain('support@company.com');
    });

    it('should not include password in email content', async () => {
      const content = service['buildWelcomeEmailContent'](
        'John',
        'Doe',
        'token123',
        [],
        'ROLE',
      );

      expect(content).not.toContain('password');
      expect(content).not.toContain('Password');
      expect(content).not.toContain('pwd');
    });
  });

  describe('sendActivationConfirmation', () => {
    it('should send activation confirmation email', async () => {
      const result = await service.sendActivationConfirmation(
        'user@example.com',
        'John',
      );

      expect(result).toBe(true);
    });
  });
});
