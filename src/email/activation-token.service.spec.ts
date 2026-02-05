import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ActivationTokenService } from './activation-token.service';
import { PrismaService } from '../common/prisma.service';

describe('ActivationTokenService', () => {
  let service: ActivationTokenService;
  let prisma: PrismaService;

  const mockPrismaService = {
    activationToken: {
      deleteMany: jest.fn(),
      create: jest.fn(),
      findUnique: jest.fn(),
      updateMany: jest.fn(),
      delete: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ActivationTokenService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<ActivationTokenService>(ActivationTokenService);
    prisma = module.get<PrismaService>(PrismaService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('generateActivationToken', () => {
    it('should generate a valid activation token', async () => {
      const email = 'user@example.com';
      const futureDate = new Date();
      futureDate.setHours(futureDate.getHours() + 24);

      (mockPrismaService.activationToken.deleteMany as jest.Mock).mockResolvedValue({
        count: 0,
      });
      (mockPrismaService.activationToken.create as jest.Mock).mockResolvedValue({
        email,
        token: 'abc123token',
        expiresAt: futureDate,
        used: false,
      });

      const token = await service.generateActivationToken(email);

      expect(token).toHaveLength(64); // 32 bytes = 64 hex chars
      expect(typeof token).toBe('string');
      expect(mockPrismaService.activationToken.deleteMany).toHaveBeenCalledWith({
        where: { email },
      });
      expect(mockPrismaService.activationToken.create).toHaveBeenCalled();
    });

    it('should delete previous token for same email', async () => {
      const email = 'user@example.com';

      (mockPrismaService.activationToken.deleteMany as jest.Mock).mockResolvedValue({
        count: 1,
      });
      (mockPrismaService.activationToken.create as jest.Mock).mockResolvedValue({
        email,
        token: 'newtoken123',
        expiresAt: new Date(),
        used: false,
      });

      await service.generateActivationToken(email);

      expect(mockPrismaService.activationToken.deleteMany).toHaveBeenCalledWith({
        where: { email },
      });
    });
  });

  describe('validateActivationToken', () => {
    it('should validate a valid token', async () => {
      const futureDate = new Date();
      futureDate.setHours(futureDate.getHours() + 1);

      (mockPrismaService.activationToken.findUnique as jest.Mock).mockResolvedValue({
        email: 'user@example.com',
        token: 'validtoken',
        expiresAt: futureDate,
        used: false,
      });

      const email = await service.validateActivationToken('validtoken');

      expect(email).toBe('user@example.com');
    });

    it('should throw error if token does not exist', async () => {
      (mockPrismaService.activationToken.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.validateActivationToken('invalidtoken')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw error if token is already used', async () => {
      (mockPrismaService.activationToken.findUnique as jest.Mock).mockResolvedValue({
        email: 'user@example.com',
        token: 'usedtoken',
        expiresAt: new Date(),
        used: true,
      });

      await expect(service.validateActivationToken('usedtoken')).rejects.toThrow(
        'Token de activación ya fue utilizado',
      );
    });

    it('should throw error if token is expired', async () => {
      const pastDate = new Date();
      pastDate.setHours(pastDate.getHours() - 1);

      (mockPrismaService.activationToken.findUnique as jest.Mock).mockResolvedValue({
        email: 'user@example.com',
        token: 'expiredtoken',
        expiresAt: pastDate,
        used: false,
      });

      await expect(service.validateActivationToken('expiredtoken')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('markTokenAsUsed', () => {
    it('should mark token as used', async () => {
      (mockPrismaService.activationToken.updateMany as jest.Mock).mockResolvedValue({
        count: 1,
      });

      await service.markTokenAsUsed('token123');

      expect(mockPrismaService.activationToken.updateMany).toHaveBeenCalledWith({
        where: { token: 'token123' },
        data: { used: true },
      });
    });

    it('should throw error if token not found when marking as used', async () => {
      (mockPrismaService.activationToken.updateMany as jest.Mock).mockResolvedValue({
        count: 0,
      });

      await expect(service.markTokenAsUsed('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('cleanupExpiredTokens', () => {
    it('should delete expired tokens', async () => {
      (mockPrismaService.activationToken.deleteMany as jest.Mock).mockResolvedValue({
        count: 5,
      });

      const count = await service.cleanupExpiredTokens();

      expect(count).toBe(5);
      expect(mockPrismaService.activationToken.deleteMany).toHaveBeenCalled();
    });
  });
});
