# 🔧 GUÍA DE TROUBLESHOOTING - LOGIN GLOBAL

## Problemas Comunes y Soluciones

### 1. Error: "Cannot find module '@nestjs/jwt'"

**Síntoma:**
```
Error: Cannot find module '@nestjs/jwt'
```

**Solución:**
```bash
npm install
# o si usas yarn:
yarn install
```

---

### 2. Error: "ENOENT: no such file or directory, open 'keys/private.pem'"

**Síntoma:**
```
Error: ENOENT: no such file or directory, open 'keys/private.pem'
```

**Causa:** Las claves RSA256 no existen

**Solución:**
```bash
mkdir keys

# En Linux/macOS
openssl genrsa -out keys/private.pem 2048
openssl rsa -in keys/private.pem -pubout -out keys/public.pem

# En Windows (con OpenSSL instalado)
# O usar: https://github.com/openssl/openssl
```

**Verificar:**
```bash
ls -la keys/
# Debería mostrar:
# private.pem
# public.pem
```

---

### 3. Error: "connect ECONNREFUSED 127.0.0.1:3306"

**Síntoma:**
```
Error: connect ECONNREFUSED 127.0.0.1:3306
```

**Causa:** MySQL no está corriendo o DATABASE_URL es incorrecto

**Solución:**

a) Iniciar MySQL:
```bash
# Linux
sudo service mysql start

# macOS
brew services start mysql-server

# Windows (si está instalado)
net start MySQL80
```

b) Verificar DATABASE_URL en `.env`:
```env
DATABASE_URL="mysql://root:password@localhost:3306/login_global"
```

c) Crear base de datos si no existe:
```sql
CREATE DATABASE login_global;
```

---

### 4. Error: "relation "User" does not exist"

**Síntoma:**
```
Error: relation "User" does not exist
```

**Causa:** Las migraciones no se han ejecutado

**Solución:**
```bash
npx prisma migrate deploy

# Si quieres resetear la BD completamente:
npx prisma migrate reset --force
```

---

### 5. Error: "port 3000 already in use"

**Síntoma:**
```
Error: listen EADDRINUSE :::3000
```

**Solución:**

a) Cambiar puerto en `.env`:
```env
PORT=3001
```

b) O matar el proceso:
```bash
# Linux/macOS
lsof -i :3000
kill -9 <PID>

# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

---

### 6. Error: "Invalid JWT"

**Síntoma:**
```
UnauthorizedException: Invalid JWT
```

**Posibles causas:**
- Token expirado (15 minutos)
- Clave pública no coincide con privada
- Header Authorization mal formado

**Solución:**
```bash
# Regenerar claves (deshabilitar tokens previos)
rm keys/private.pem keys/public.pem
openssl genrsa -out keys/private.pem 2048
openssl rsa -in keys/private.pem -pubout -out keys/public.pem

# Obtener nuevo token con /auth/mfa/verify
```

**Header correcto:**
```
Authorization: Bearer <access_token>
```

---

### 7. Error: "Password hashing failed"

**Síntoma:**
```
Error: Password hashing failed
```

**Causa:** argon2 no está instalado correctamente

**Solución:**
```bash
npm install argon2
# En Windows, puede necesitar build tools:
npm install --build-from-source
```

---

### 8. Error: "Class validator not working"

**Síntoma:** DTOs no validan aunque tengan decoradores

**Causa:** ValidationPipe no está habilitado

**Solución:** Verificar `src/main.ts`:
```typescript
app.useGlobalPipes(
  new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }),
);
```

---

### 9. Error: "RolesGuard not found" en decoradores

**Síntoma:**
```
Error: Cannot find name 'RolesGuard'
```

**Solución:** Importar correctamente en controller:
```typescript
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/guards/roles.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
```

---

### 10. Error: "MFA code not sent"

**Síntoma:** Código MFA no llega al usuario

**Causa:** Twilio/SMS no está configurado

**Solución:**
1. Implementar integraci con proveedor SMS en `src/mfa/mfa.service.ts`
2. Actualmente solo hace console.log

```typescript
// En mfa.service.ts - sendCode()
async sendCode(userId: string) {
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  
  await this.prisma.mfaCode.create({
    data: {
      userId,
      code,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000),
    },
  });

  // TODO: Integrar Twilio aquí
  // await twilio.sendSMS(phone, `Tu código: ${code}`);
  
  console.log(`📲 MFA Code: ${code}`); // Por ahora
}
```

---

### 11. "No lo califica como SYSTEM_ADMIN único"

**Síntoma:** Se permite crear múltiples SYSTEM_ADMIN

**Causa:** No están usando la RolesService

**Verificación:**
```typescript
// Correcto (en RolesService)
if (roleCode === 'SYSTEM_ADMIN') {
  const adminCount = await this.prisma.userRole.count({
    where: { role: { code: 'SYSTEM_ADMIN' } },
  });
  if (adminCount >= 1) {
    throw new BadRequestException('...');
  }
}
```

---

### 12. Error: "Prisma Studio no abre"

**Síntoma:**
```
Could not start Prisma Studio
```

**Solución:**
```bash
npx prisma studio

# Si sigue sin funcionar, usar interfaz web directamente:
# http://localhost:5555
```

---

## ✅ VERIFICACIÓN DE SETUP

Ejecutar este checklist:

```bash
# 1. Verificar claves
ls -la keys/
# ✅ private.pem y public.pem existen

# 2. Verificar .env
cat .env
# ✅ DATABASE_URL es correcto

# 3. Verificar dependencias
npm list @nestjs/jwt
# ✅ Versión instalada

# 4. Verificar conexión BD
npx prisma db execute --stdin < /dev/null
# ✅ Sin errores

# 5. Verificar migraciones
npx prisma migrate status
# ✅ "All migrations have been applied"

# 6. Iniciar servidor
npm run start:dev
# ✅ "Login Global Server running on port 3000"

# 7. Probar endpoint
curl http://localhost:3000/auth/login -X POST \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@loginglobal.com","password":"Admin@123456"}'
# ✅ Responde con sessionId
```

---

## 🆘 SOPORTE AVANZADO

### Limpiar caché de módulos
```bash
rm -rf node_modules
npm install
```

### Resetear BD completamente
```bash
npx prisma migrate reset --force
npm run seed
```

### Ver logs detallados
```bash
# En main.ts, agregar logging
import { Logger } from '@nestjs/common';
const logger = new Logger();
logger.log('Evento importante');
```

### Modo debug
```bash
npm run start:debug
# Luego conectar debugger en http://localhost:9229
```

### Verificar Prisma
```bash
npx prisma generate
npx prisma db push
npx prisma studio
```

---

## 📞 CONTACTO Y RECURSOS

- **Documentación:** Ver `IMPLEMENTATION_GUIDE.md`
- **Resumen:** Ver `COMPLETION_SUMMARY.md`
- **Archivos:** Ver `FILES_SUMMARY.md`
- **Quick Start:** Ejecutar `./quick-start.sh`

---

**Última actualización:** 4 de Febrero de 2026  
**Proyecto:** Login Global SSO  
**Soporte:** Este documento cubre 90% de problemas comunes
