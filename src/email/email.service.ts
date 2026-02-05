import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { EmailConfig } from './email.config';

/**
 * Email Service - Con integración real SMTP
 *
 * Responsabilidades:
 * - Envío de correos via Gmail o Hostinger SMTP
 * - Reintentos automáticos
 * - Logging de fallos
 * - Configurable por variables de entorno
 *
 * Variables de entorno requeridas:
 *
 * Para Gmail:
 * - EMAIL_PROVIDER=gmail
 * - EMAIL_GMAIL_USER=tu-email@gmail.com
 * - EMAIL_GMAIL_APP_PASSWORD=tu-app-password
 *
 * Para Hostinger:
 * - EMAIL_PROVIDER=hostinger
 * - EMAIL_HOSTINGER_HOST=smtp.hostinger.com
 * - EMAIL_HOSTINGER_PORT=587
 * - EMAIL_HOSTINGER_USER=tu-email@tu-dominio.com
 * - EMAIL_HOSTINGER_PASSWORD=tu-password
 *
 * General:
 * - EMAIL_FROM=noreply@tu-dominio.com
 */
@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly maxRetries = 3;
  private readonly retryDelayMs = 1000;
  private transporter: nodemailer.Transporter;

  constructor(private emailConfig: EmailConfig) {
    this.initializeTransporter();
  }

  /**
   * Inicializa el transporter de nodemailer
   */
  private initializeTransporter() {
    try {
      const config = this.emailConfig.getActiveConfig();
      this.transporter = nodemailer.createTransport(config);

      this.logger.log(`Email service inicializado con provider: ${this.emailConfig.getEmailConfig().provider}`);
    } catch (error) {
      this.logger.error(`Error inicializando email service: ${error.message}`);
      throw error;
    }
  }

  /**
   * Envía correo de bienvenida (OBLIGATORIO)
   *
   * Contenido:
   * - Quién es el usuario
   * - Bienvenida corporativa
   * - Sistemas disponibles
   * - Rol asignado
   * - MFA obligatorio
   * - Link de activación (token de un solo uso)
   * - Contacto de soporte
   *
   * @param email Email del usuario
   * @param firstName Nombre del usuario
   * @param lastName Apellido del usuario
   * @param activationToken Token de un solo uso (máx 24h)
   * @param assignedSystems Lista de sistemas a los que tiene acceso
   * @param roleName Nombre del rol asignado
   */
  async sendWelcomeEmail(
    email: string,
    firstName: string,
    lastName: string,
    activationToken: string,
    assignedSystems: string[],
    roleName: string,
  ): Promise<boolean> {
    return this.sendWithRetries(
      email,
      this.buildWelcomeEmailContent(
        firstName,
        lastName,
        activationToken,
        assignedSystems,
        roleName,
        email,
      ),
      `Bienvenida a Login Global - ${firstName} ${lastName}`,
    );
  }

  /**
   * Envía notificación de activación completada
   */
  async sendActivationConfirmation(
    email: string,
    firstName: string,
  ): Promise<boolean> {
    const content = `
      <h2>¡Bienvenido, ${firstName}!</h2>
      <p>Tu cuenta ha sido activada exitosamente.</p>
      <p>Ya puedes acceder a <strong>Login Global</strong> con tus credenciales.</p>
      <hr/>
      <p><strong>Soporte:</strong> support@company.com | +56 9 XXXX XXXX</p>
    `;

    return this.sendWithRetries(
      email,
      content,
      'Activación Completada - Login Global',
    );
  }

  /**
   * Construye contenido HTML del correo de bienvenida
   * SEGURIDAD: Token incluido en URL con expiración
   */
  private buildWelcomeEmailContent(
    firstName: string,
    lastName: string,
    activationToken: string,
    assignedSystems: string[],
    roleName: string,
    emailParam: string,
  ): string {
    const activationUrl = `${process.env.APP_BASE_URL || 'https://login.company.com'}/activate?token=${activationToken}`;
    const systemsList = assignedSystems.length > 0 
      ? assignedSystems.map(s => `<li>${s}</li>`).join('')
      : '<li>Ninguno asignado aún</li>';

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; }
            .header { background: #2c3e50; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; }
            .button { 
              display: inline-block; 
              padding: 12px 24px; 
              background: #3498db; 
              color: white; 
              text-decoration: none; 
              border-radius: 5px;
              margin: 20px 0;
            }
            .warning { 
              background: #fff3cd; 
              border: 1px solid #ffc107; 
              padding: 10px; 
              margin: 15px 0; 
              border-radius: 3px;
            }
            .footer { background: #ecf0f1; padding: 10px; text-align: center; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🔐 Login Global - Bienvenida</h1>
            </div>

            <div class="content">
              <h2>Hola ${firstName} ${lastName},</h2>
              <p>Tu cuenta corporativa ha sido creada exitosamente en <strong>Login Global</strong>.</p>

              <h3>📋 Información de tu Cuenta</h3>
              <ul>
                <li><strong>Email:</strong> ${emailParam}</li>
                <li><strong>Rol Asignado:</strong> ${roleName}</li>
              </ul>

              <h3>🖥️ Sistemas Disponibles</h3>
              <ul>
                ${systemsList}
              </ul>

              <h3>🔐 Seguridad Obligatoria</h3>
              <p>Para completar tu onboarding, debes:</p>
              <ol>
                <li><strong>Activar tu cuenta</strong> con el botón abajo</li>
                <li><strong>Crear una contraseña segura</strong></li>
                <li><strong>Configurar autenticación multifactor (MFA)</strong> - OBLIGATORIO</li>
              </ol>

              <div style="text-align: center;">
                <a href="${activationUrl}" class="button">✅ ACTIVAR MI CUENTA</a>
              </div>

              <div class="warning">
                <strong>⚠️ Importante:</strong>
                <ul>
                  <li>Este enlace expira en <strong>24 horas</strong></li>
                  <li>Token válido una sola vez</li>
                  <li>No compartas este correo con terceros</li>
                  <li>Nunca pedimos contraseñas por correo</li>
                </ul>
              </div>

              <h3>📞 ¿Necesitas Ayuda?</h3>
              <p>Contacta al equipo de soporte:</p>
              <ul>
                <li>📧 Email: <strong>support@company.com</strong></li>
                <li>📞 Teléfono: <strong>+56 9 XXXX XXXX</strong></li>
                <li>⏰ Horario: Lunes a Viernes 9:00 - 18:00</li>
              </ul>
            </div>

            <div class="footer">
              <p>© 2026 Login Global. Todos los derechos reservados.</p>
              <p>Este es un correo automático de seguridad. No respondas a este correo.</p>
            </div>
          </div>
        </body>
      </html>
    `;
  }

  /**
   * Envía correo con reintentos automáticos
   * Usa nodemailer con configuración SMTP real
   */
  private async sendWithRetries(
    to: string,
    htmlContent: string,
    subject: string,
    attempt: number = 1,
  ): Promise<boolean> {
    try {
      this.logger.log(`[Intento ${attempt}/${this.maxRetries}] Enviando correo a ${to}`);

      const emailConfig = this.emailConfig.getEmailConfig();

      const mailOptions = {
        from: emailConfig.from,
        to: to,
        subject: subject,
        html: htmlContent,
      };

      // Enviar email real
      const info = await this.transporter.sendMail(mailOptions);

      this.logger.log(`Correo enviado exitosamente a ${to}. MessageId: ${info.messageId}`);
      return true;
    } catch (error) {
      this.logger.warn(
        `Error en intento ${attempt} para ${to}: ${error.message}`,
      );

      if (attempt < this.maxRetries) {
        // Esperar antes de reintentar (exponencial backoff opcional)
        await this.delay(this.retryDelayMs * attempt);
        return this.sendWithRetries(to, htmlContent, subject, attempt + 1);
      }

      // Si fallan todos los reintentos, loguear error crítico
      this.logger.error(
        `FALLO CRÍTICO: No se pudo enviar correo a ${to} después de ${this.maxRetries} intentos`,
      );
      return false;
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
