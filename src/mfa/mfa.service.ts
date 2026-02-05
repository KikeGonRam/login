import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';

@Injectable()
export class MfaService {
  constructor(private prisma: PrismaService) {}

  async sendCode(userId: string) {
    const code = Math.floor(100000 + Math.random() * 900000).toString();

    await this.prisma.mfaCode.create({
      data: {
        userId,
        code,
        expiresAt: new Date(Date.now() + 5 * 60 * 1000),
      },
    });

    // 👉 Aquí va Twilio / proveedor SMS
    console.log(`📲 MFA Code: ${code}`);
  }

  async verifyCode(sessionId: string, code: string) {
    const session = await this.prisma.session.findUnique({
      where: { id: sessionId },
    });

    if (!session) {
      throw new UnauthorizedException('Sesión inválida');
    }

    // Nota: No verificamos session.active aquí porque la sesión se activa
    // después de verificar el código MFA correctamente

    const mfa = await this.prisma.mfaCode.findFirst({
      where: {
        userId: session.userId,
        code,
        used: false,
        expiresAt: { gt: new Date() },
      },
    });

    if (!mfa) {
      throw new UnauthorizedException('Código MFA inválido');
    }

    await this.prisma.mfaCode.update({
      where: { id: mfa.id },
      data: { used: true },
    });

    return session.userId;
  }
}
