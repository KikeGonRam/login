# 📧 INTEGRACIÓN: CÓMO ENVIAR EL CORREO EN POST /users

**Importante**: Este es un ejemplo de cómo conectar todo. El correo se envía ASYNC.

---

## 🔗 CONEXIÓN ACTUAL

### 1. UsersController.create()

```typescript
@Post()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('SYSTEM_ADMIN')
async create(@Body() dto: CreateUserDto, @Req() req: Request) {
  const adminUser = req.user as { sub: string };
  const ip = req.ip || req.socket.remoteAddress;

  return this.usersService.create(dto, adminUser.sub, ip);
}
```

**Retorna:**
```json
{
  "id": "user-uuid",
  "email": "nuevo@company.com",
  "status": "PENDING_ACTIVATION",
  "activationToken": "a3f5b8c9d2e1f4g...",  // ← Aquí está el token
  "profile": { ... }
}
```

---

## 2. OPCIÓN A: Enviar correo desde el Controller (NO RECOMENDADO)

```typescript
// ❌ EVITAR: Esto causa locking
@Post()
async create(@Body() dto: CreateUserDto, @Req() req: Request) {
  // Crear usuario
  const user = await this.usersService.create(dto, adminUser.sub, ip);

  // ❌ MALO: Espera a que se envíe el correo
  await this.emailService.sendWelcomeEmail(
    user.email,
    user.profile.firstName,
    user.profile.lastName,
    user.activationToken,
    [], // sistemas
    'REQUESTOR'
  );

  return user;
}
```

**Problema**: El response espera a que el correo se envíe (100-500ms)

---

## 3. OPCIÓN B: Enviar correo Async (RECOMENDADO)

```typescript
@Post()
async create(@Body() dto: CreateUserDto, @Req() req: Request) {
  // Crear usuario (rapido)
  const user = await this.usersService.create(dto, adminUser.sub, ip);

  // ✅ BUENO: Enviar async (no espera)
  this.emailService.sendWelcomeEmail(
    user.email,
    user.profile.firstName,
    user.profile.lastName,
    user.activationToken,
    [],
    'REQUESTOR'
  ).catch((error) => {
    // Loguear error pero NO retornar al usuario
    console.error(`Email failed for ${user.email}: ${error.message}`);
  });

  // Respuesta inmediata
  return {
    ...user,
    message: 'Usuario creado. Correo de activación enviado.',
  };
}
```

**Ventaja**: Response en ~10ms, correo se envía en background

---

## 4. OPCIÓN C: Con Cola (PRODUCCIÓN)

```typescript
// Inyectar Queue
constructor(
  private usersService: UsersService,
  private emailService: EmailService,
  @InjectQueue('emails') private emailQueue: Queue,
) {}

@Post()
async create(@Body() dto: CreateUserDto, @Req() req: Request) {
  const user = await this.usersService.create(dto, adminUser.sub, ip);

  // Agregar a cola (Bull/RabbitMQ)
  await this.emailQueue.add('welcome-email', {
    email: user.email,
    firstName: user.profile.firstName,
    lastName: user.profile.lastName,
    token: user.activationToken,
    systems: [],
    role: 'REQUESTOR',
  });

  return {
    ...user,
    message: 'Usuario creado. Correo en cola de envío.',
  };
}
```

---

## 5. MÉTODOS PARA OBTENER SISTEMAS ASIGNADOS

El correo debe incluir "¿Qué 7 sistemas puede usar?". Aquí hay opciones:

### Opción 1: Sistema por defecto para el rol

```typescript
// En UsersService.create() o UsersController.create()
const systemsByRole = {
  'SYSTEM_ADMIN': ['Todos'],
  'SUPPORT_AGENT': ['Panel de Soporte', 'CRM'],
  'REQUESTOR': ['Portal de Solicitudes'],
  'AUTHORIZER': ['Panel de Aprobaciones'],
  'PAYMENT_EXECUTOR': ['Pagos'],
};

const systems = systemsByRole[role] || [];
```

### Opción 2: Obtener de UserSystems (si ya se asignaron)

```typescript
// En UsersService
const userSystems = await this.prisma.userSystem.findMany({
  where: { userId: user.id },
  include: { system: true },
});

const systemNames = userSystems.map(us => us.system.name);
```

### Opción 3: Pasar en POST (recomendado)

```typescript
// En CreateUserDto
export interface CreateUserDto {
  email: string;
  firstName: string;
  // ... campos normales ...
  systemIds?: string[];  // NUEVO: sistemas a asignar
  roleCode?: string;     // NUEVO: rol a asignar
}

// En controller
const user = await this.usersService.create(dto, adminUser.sub, ip);

// Asignar sistemas si se pasaron
if (dto.systemIds?.length) {
  for (const systemId of dto.systemIds) {
    await this.systemsService.assignSystemToUser(user.id, systemId);
  }
  
  const systems = dto.systemIds.map(id => 'Sistema-' + id);
  
  // Enviar correo con sistemas
  this.emailService.sendWelcomeEmail(
    user.email,
    user.profile.firstName,
    user.profile.lastName,
    user.activationToken,
    systems,  // ← Aquí
    dto.roleCode || 'REQUESTOR'
  ).catch(error => console.error(error));
}

return user;
```

---

## 📋 PLANTILLA RECOMENDADA (Opción B + 3)

```typescript
// src/users/users.controller.ts

@Post()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('SYSTEM_ADMIN')
async create(@Body() dto: CreateUserDto, @Req() req: Request) {
  const adminUser = req.user as { sub: string };
  const ip = req.ip || req.socket.remoteAddress;

  // 1. Crear usuario
  const user = await this.usersService.create(dto, adminUser.sub, ip);

  // 2. Asignar sistemas (opcional)
  let systemNames: string[] = [];
  if (dto.systemIds?.length) {
    for (const systemId of dto.systemIds) {
      try {
        await this.systemsService.assignSystemToUser(user.id, systemId);
      } catch (error) {
        console.warn(`No se pudo asignar sistema ${systemId}:`, error.message);
      }
    }
    
    // Obtener nombres de sistemas
    const systems = await this.systemsService.getSystemsByIds(dto.systemIds);
    systemNames = systems.map(s => s.name);
  }

  // 3. Enviar correo ASYNC (no espera)
  this.emailService.sendWelcomeEmail(
    user.email,
    user.profile.firstName,
    user.profile.lastName,
    user.activationToken,
    systemNames,
    dto.roleCode || 'REQUESTOR'
  ).catch((error) => {
    console.error(`[WARN] Email failed for ${user.email}:`, error.message);
    // Importante: NO lanzar error al usuario
    // El usuario existe, el correo falla = reintentar después
  });

  // 4. Respuesta inmediata
  return {
    id: user.id,
    email: user.email,
    status: user.status,
    profile: user.profile,
    activationToken: user.activationToken,
    message: 'Usuario creado en PENDING_ACTIVATION. Correo de activación enviado.',
    systemsAssigned: systemNames.length,
  };
}
```

---

## 🔧 CAMBIOS NECESARIOS EN CreateUserDto

```typescript
// src/users/users.service.ts

export interface CreateUserDto {
  email: string;
  firstName: string;
  lastName: string;
  birthDate: Date;
  hireDate: Date;
  departmentId: string;
  positionId: string;
  phone?: string;
  photoUrl?: string;
  
  // NUEVOS (opcionales)
  systemIds?: string[];  // [uuid1, uuid2, ...]
  roleCode?: string;     // 'REQUESTOR', 'SUPPORT_AGENT', etc.
}
```

---

## ✅ CHECKLIST PARA INTEGRACIÓN

- [ ] `EmailService` inyectado en `UsersController`
- [ ] `SystemsService` inyectado (si asignas sistemas)
- [ ] Método `create()` retorna `activationToken`
- [ ] Correo se envía ASYNC (sin await)
- [ ] Error handling en `.catch()` (no lanza excepción)
- [ ] Tests para POST /users que verifiquen activationToken
- [ ] Documentar cambios en API (Swagger)

---

## 📊 RESPUESTA ESPERADA

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "email": "carlos@company.com",
  "status": "PENDING_ACTIVATION",
  "profile": {
    "firstName": "Carlos",
    "lastName": "López",
    "birthDate": "1990-05-15T00:00:00.000Z",
    "hireDate": "2026-02-05T00:00:00.000Z",
    "phone": "+56912345678",
    "photoUrl": null,
    "department": {
      "id": "dept-uuid",
      "name": "Finance"
    },
    "position": {
      "id": "pos-uuid",
      "name": "Analyst"
    }
  },
  "activationToken": "a3f5b8c9d2e1f4g6h7i8j9k0l1m2n3o4p5q6r7s8t9u0v1w2x3y4z5a6b7c8d9",
  "message": "Usuario creado en PENDING_ACTIVATION. Correo de activación enviado.",
  "systemsAssigned": 2
}
```

---

## 🚨 DEBUGGING

### Si el correo no se envía:

1. **Verificar logs en terminal** (service imprime todo)
2. **Verificar status del usuario** → Debe ser PENDING_ACTIVATION
3. **Verificar token existe** → Buscar en tabla `ActivationToken`
4. **Verificar retry logic** → El servicio reintenta 3 veces

### Si el usuario no puede activarse:

1. **Token válido?** → No expirado (< 24h)
2. **Token no usado?** → Flag `used = false`
3. **Usuario existe?** → Buscar por email en tabla `ActivationToken`
4. **Status correcto?** → Debe ser PENDING_ACTIVATION

---

## 📝 RESUMEN

```
Create User (Admin)
  └─ Genera token (EmailService)
  └─ Envía correo ASYNC (no espera)
  └─ Retorna usuario + token + activationToken
  └─ Usuario recibe correo en bg

Usuario activa
  └─ POST /users/activate { token, password }
  └─ Valida token
  └─ Crea contraseña
  └─ Status ACTIVE
  └─ Token → used
  └─ Puede login

Auditoría
  └─ USER_CREATED (creación)
  └─ USER_ACTIVATED (activación)
```

¡LISTO PARA PRODUCCIÓN! 🚀
