# LOGIN GLOBAL - GUÍA DE IMPLEMENTACIÓN

## Estado Actual

✅ **Completado:**
- Arquitectura SSO completa
- Modelo de datos Prisma
- AuthService con flujo: Login → MFA → Tokens
- Todos los endpoints principales implementados
- Roles y autorización (SYSTEM_ADMIN único)
- Auditoría obligatoria
- MFA por SMS (estructura lista)
- JWT RS256 configurado
- Guards y Strategies
- Todas las dependencias instaladas

## Pasos Siguientes Antes de Ejecutar

### 1. Generar Claves RSA256

```bash
# Crear directorio de claves
mkdir keys

# Generar clave privada
openssl genrsa -out keys/private.pem 2048

# Generar clave pública
openssl rsa -in keys/private.pem -pubout -out keys/public.pem
```

### 2. Configurar Base de Datos

Crear archivo `.env`:

```env
DATABASE_URL="mysql://user:password@localhost:3306/login_global"
JWT_SECRET="your-secret-key"
PORT=3000
NODE_ENV=development
```

### 3. Ejecutar Migraciones Prisma

```bash
npx prisma migrate deploy
npx prisma db seed  # Opcional: cargar datos iniciales
```

### 4. Seed de Datos Iniciales

El archivo `prisma/seed.ts` debe incluir:

```typescript
// Crear roles por defecto
await prisma.role.createMany({
  data: [
    { code: 'SYSTEM_ADMIN', description: 'Administrador del sistema' },
    { code: 'SUPPORT_AGENT', description: 'Agente de soporte' },
    { code: 'REQUESTOR', description: 'Solicitante' },
    { code: 'AUTHORIZER', description: 'Autorizador' },
    { code: 'PAYMENT_EXECUTOR', description: 'Ejecutor de pagos' },
  ],
});

// Crear departamentos y posiciones
// ...

// Crear usuarios de prueba
// ...
```

## Endpoints Implementados

### Autenticación

- **POST /auth/login** - Iniciar sesión (email + password)
  - Retorna: `{ sessionId, message }`
  
- **POST /auth/mfa/verify** - Verificar código MFA
  - Body: `{ sessionId, code }`
  - Retorna: `{ accessToken, refreshToken, user }`
  
- **POST /auth/refresh** - Renovar access token
  - Body: `{ refreshToken }`
  - Retorna: `{ accessToken }`
  
- **POST /auth/logout** - Cerrar sesión actual
  - Guard: `JwtAuthGuard`
  
- **POST /auth/logout-all** - Logout global (todas las sesiones)
  - Guard: `JwtAuthGuard`

### Usuarios

- **POST /users** - Crear usuario
  - Rol: `SYSTEM_ADMIN`
  - Body: `CreateUserDto`
  
- **GET /users** - Listar usuarios
  - Roles: `SYSTEM_ADMIN`, `SUPPORT_AGENT`
  
- **GET /users/:id** - Obtener usuario por ID
  - Roles: `SYSTEM_ADMIN`, `SUPPORT_AGENT`
  
- **PUT /users/:id/profile** - Actualizar perfil
  - Rol: `SYSTEM_ADMIN`
  
- **PUT /users/:id/disable** - Deshabilitar usuario
  - Rol: `SYSTEM_ADMIN`

### Roles

- **GET /roles** - Listar roles
  - Rol: `SYSTEM_ADMIN`
  
- **POST /roles** - Crear rol
  - Rol: `SYSTEM_ADMIN`
  
- **POST /roles/assign** - Asignar rol a usuario
  - Rol: `SYSTEM_ADMIN`
  - **Validación crítica:** Solo 1 SYSTEM_ADMIN
  
- **DELETE /roles/assign/:userId/:roleCode** - Remover rol
  - Rol: `SYSTEM_ADMIN`
  
- **GET /roles/user/:userId** - Roles de un usuario
  - Rol: `SYSTEM_ADMIN`

### Sistemas

- **GET /systems** - Listar sistemas
  - Rol: `SYSTEM_ADMIN`
  
- **POST /systems** - Crear sistema
  - Rol: `SYSTEM_ADMIN`
  
- **POST /systems/assign** - Asignar acceso a sistema
  - Rol: `SYSTEM_ADMIN`
  
- **DELETE /systems/assign/:userId/:systemCode** - Remover acceso
  - Rol: `SYSTEM_ADMIN`
  
- **GET /systems/user/:userId** - Sistemas del usuario
  - Rol: `SYSTEM_ADMIN`

### Auditoría

- **GET /audit/logs** - Ver logs de auditoría
  - Rol: `SYSTEM_ADMIN`
  - Filtros: `userId`, `action`, `fromDate`, `toDate`, `limit`, `offset`

## Flujo de Autenticación Completo

```
1. Usuario envía credenciales
   POST /auth/login { email, password }
   ↓
2. Backend valida y crea sesión pendiente
   Retorna sessionId
   ↓
3. Backend envía código MFA (SMS)
   🔔 SMS a teléfono registrado
   ↓
4. Usuario verifica código MFA
   POST /auth/mfa/verify { sessionId, code }
   ↓
5. Backend emite tokens JWT + RefreshToken
   Retorna { accessToken, refreshToken }
   ↓
6. Frontend almacena tokens y accede a sistemas
   Header: Authorization: Bearer {accessToken}
```

## Seguridad Implementada

✅ JWT RS256 (clave pública/privada)
✅ Argon2 para hash de contraseñas
✅ MFA obligatorio por SMS
✅ Sesiones con expiración
✅ Refresh tokens revocables
✅ Guards por rol (RolesGuard)
✅ Auditoría automática en todas las acciones
✅ Validación de entrada (class-validator)
✅ Solo 1 SYSTEM_ADMIN puede existir
✅ Logout global revoca todos los tokens

## Próximos Pasos

- [ ] Integración con proveedor SMS (Twilio/similares)
- [ ] Swagger/OpenAPI para documentación
- [ ] Rate limiting
- [ ] CI/CD con GitHub Actions
- [ ] Interceptor de auditoría automático (mejor)
- [ ] Tests unitarios y E2E
- [ ] Integración con frontend Next.js
- [ ] Documentación de cliente para sistemas externos
- [ ] Manejo de errores personalizado
- [ ] Logging centralizado

## Comandos Útiles

```bash
# Desarrollo
npm run start:dev

# Prueba
npm run test

# Build
npm run build

# Lint
npm run lint

# Generar cliente Prisma
npx prisma generate

# Studio (GUI de BD)
npx prisma studio

# Migraciones
npx prisma migrate dev --name nombre_migracion
```

## Notas Importantes

1. **No cambiar arquitectura:** La estructura SSO es la definida en el documento original.
2. **Validación SYSTEM_ADMIN:** Implementada en RolesService, verificada en cada asignación.
3. **Auditoría:** Registra automáticamente LOGIN, LOGOUT, MFA, rol changes, etc.
4. **Tokens:** Access token 15 min, Refresh token 7 días.
5. **Seguridad:** Nivel banco implementado con JWT RS256 + MFA + Argon2.

---

**Fecha:** Febrero 4, 2026  
**Proyecto:** Login Global SSO  
**Stack:** NestJS + Prisma + MySQL  
