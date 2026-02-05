# Configuración de Email - Gmail y Hostinger

## Resumen

El sistema de activación de usuarios requiere envío de correos electrónicos. Está configurado para trabajar con **Gmail** y **Hostinger SMTP**, permitiendo cambiar entre proveedores mediante variables de entorno.

## Configuración de Gmail

### 1. Habilitar autenticación de 2 factores
1. Ve a [Google Account Settings](https://myaccount.google.com/)
2. Ve a "Seguridad" → "Verificación en 2 pasos"
3. Activa la verificación en 2 pasos

### 2. Generar App Password
1. Ve a [App Passwords](https://myaccount.google.com/apppasswords)
2. Selecciona "Correo" como app
3. Selecciona "Otro" como dispositivo y escribe "Login Global"
4. Copia la contraseña de 16 caracteres generada

### 3. Variables de entorno
```env
EMAIL_PROVIDER=gmail
EMAIL_GMAIL_USER=tu-email@gmail.com
EMAIL_GMAIL_APP_PASSWORD=tu-app-password-de-16-caracteres
EMAIL_FROM=noreply@tu-dominio.com
APP_BASE_URL=https://tu-dominio.com
```

## Configuración de Hostinger

### 1. Obtener credenciales SMTP
1. Ve a tu panel de Hostinger
2. Ve a "Emails" → "Email Accounts"
3. Crea o selecciona una cuenta de email
4. Ve a "Settings" → "SMTP Settings"
5. Copia los datos SMTP

### 2. Variables de entorno
```env
EMAIL_PROVIDER=hostinger
EMAIL_HOSTINGER_HOST=smtp.hostinger.com
EMAIL_HOSTINGER_PORT=587
EMAIL_HOSTINGER_USER=tu-email@tu-dominio.com
EMAIL_HOSTINGER_PASSWORD=tu-password-de-hostinger
EMAIL_FROM=noreply@tu-dominio.com
APP_BASE_URL=https://tu-dominio.com
```

## Variables de Entorno Comunes

| Variable | Descripción | Ejemplo |
|----------|-------------|---------|
| `EMAIL_PROVIDER` | Proveedor a usar | `gmail` o `hostinger` |
| `EMAIL_FROM` | Email remitente | `noreply@tu-dominio.com` |
| `APP_BASE_URL` | URL base para links | `https://tu-dominio.com` |

## Configuración de Gmail (Detallada)

### App Password vs Contraseña Normal
- **NO uses tu contraseña normal de Gmail**
- Usa una "App Password" específica para aplicaciones
- La App Password es de 16 caracteres sin espacios
- Se genera en la configuración de Google Account

### Seguridad
- Las App Passwords se pueden revocar individualmente
- No afectan tu contraseña principal
- Cada aplicación puede tener su propia App Password

## Configuración de Hostinger (Detallada)

### Credenciales SMTP
- **Host**: smtp.hostinger.com
- **Port**: 587 (STARTTLS) o 465 (SSL/TLS)
- **Usuario**: Tu email completo (usuario@dominio.com)
- **Contraseña**: La contraseña de tu cuenta de email

### Consideraciones
- Asegúrate de que la cuenta de email esté creada en Hostinger
- Verifica que tengas suficiente cuota de envío
- Hostinger puede tener límites de envío por hora

## Testing

### Verificar configuración
```bash
# El servicio se inicializa automáticamente al iniciar la aplicación
# Revisa los logs para confirmar:
# "Email service inicializado con provider: gmail"
```

### Probar envío
```bash
# Crear un usuario probará automáticamente el envío de email
curl -X POST http://localhost:3000/users \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "firstName": "Test",
    "lastName": "User",
    "departmentId": "uuid",
    "positionId": "uuid",
    "roleId": "uuid"
  }'
```

## Troubleshooting

### Gmail - Error de autenticación
- Verifica que la App Password sea correcta (16 caracteres)
- Confirma que la verificación en 2 pasos esté activada
- Revisa que no hayas revocado la App Password

### Hostinger - Error de conexión
- Verifica el host y puerto SMTP
- Confirma credenciales de email
- Revisa cuota de envío en Hostinger

### Errores comunes
- **"Invalid login"**: Credenciales incorrectas
- **"Connection timeout"**: Problemas de red o firewall
- **"Quota exceeded"**: Límite de envío alcanzado

## Producción

### Recomendaciones
- Usa Hostinger para producción (más confiable)
- Configura SPF, DKIM y DMARC en tu dominio
- Monitorea logs de envío de email
- Implementa cola de emails (Bull/RabbitMQ) para alta carga

### Variables de entorno seguras
- Nunca commits las contraseñas reales
- Usa variables de entorno del servidor
- Considera usar servicios como AWS Secrets Manager