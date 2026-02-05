import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * Configuración de Email Providers
 * Soporta Gmail y Hostinger SMTP
 */
@Injectable()
export class EmailConfig {
  constructor(private configService: ConfigService) {}

  /**
   * Configuración para Gmail SMTP
   */
  getGmailConfig() {
    return {
      host: 'smtp.gmail.com',
      port: 587,
      secure: false, // true para 465, false para otros puertos
      auth: {
        user: this.configService.get<string>('EMAIL_GMAIL_USER'),
        pass: this.configService.get<string>('EMAIL_GMAIL_APP_PASSWORD'), // App Password, no la contraseña normal
      },
    };
  }

  /**
   * Configuración para Hostinger SMTP
   */
  getHostingerConfig() {
    return {
      host: this.configService.get<string>('EMAIL_HOSTINGER_HOST') || 'smtp.hostinger.com',
      port: parseInt(this.configService.get<string>('EMAIL_HOSTINGER_PORT') || '587'),
      secure: false, // Hostinger usa STARTTLS
      auth: {
        user: this.configService.get<string>('EMAIL_HOSTINGER_USER'),
        pass: this.configService.get<string>('EMAIL_HOSTINGER_PASSWORD'),
      },
    };
  }

  /**
   * Configuración activa basada en variable de entorno
   */
  getActiveConfig() {
    const provider = this.configService.get<string>('EMAIL_PROVIDER', 'gmail');

    switch (provider.toLowerCase()) {
      case 'gmail':
        return this.getGmailConfig();
      case 'hostinger':
        return this.getHostingerConfig();
      default:
        throw new Error(`Proveedor de email no soportado: ${provider}`);
    }
  }

  /**
   * Configuración general
   */
  getEmailConfig() {
    return {
      from: this.configService.get<string>('EMAIL_FROM', 'noreply@company.com'),
      provider: this.configService.get<string>('EMAIL_PROVIDER', 'gmail'),
    };
  }
}