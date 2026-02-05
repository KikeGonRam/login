# LOGIN GLOBAL SSO – ESPECIFICACIÓN ESTRICTA DE IMPLEMENTACIÓN

> **DOCUMENTO DE FUENTE ÚNICA (SOURCE OF TRUTH)**
> Este archivo define de forma **estricta y obligatoria** cómo debe construirse el Login Global SSO.
> **NO se permiten cambios de arquitectura, stack, seguridad o modelo de datos** sin modificar este documento.

---

## 1. OBJETIVO DEL SISTEMA

Implementar un **Login Global con Single Sign-On (SSO)** para una **empresa real**, con **seguridad nivel banco**, que centralice la autenticación y autorización de **7 sistemas web internos**.

El sistema actúa como **Identity Provider (IdP)** y es la **única fuente de verdad** para:

* Identidad de usuarios
* Roles y permisos
* Sesiones
* Auditoría

---

## 2. RESTRICCIONES OBLIGATORIAS

* ❌ No autenticación local en sistemas clientes
* ❌ No JWT HS256
* ❌ No contraseñas sin hash
* ❌ No MFA opcional
* ❌ No múltiples administradores
* ❌ No lógica de seguridad en frontend

---

## 3. STACK TECNOLÓGICO (FIJO)

### Backend

* **NestJS (Node.js)**
* **Prisma ORM**
* **MySQL 8.x**

### Frontend

* **Next.js** (Login Global)

### Seguridad

* JWT **RS256** (obligatorio)
* Hash de contraseñas: **argon2**
* MFA obligatorio por SMS

### Infraestructura

* REST API

---

## 4. ARQUITECTURA GENERAL

### Componentes

* Login Global UI (Next.js)
* Auth Server (NestJS)
* Base de datos central MySQL
* Sistemas clientes (7)

### Principio clave

> El Login Global **es el único responsable de autenticación**.

---

## 5. MODELO DE DATOS (OBLIGATORIO)

### Entidades

* users
* user_profiles
* departments
* positions
* roles
* user_roles
* systems
* user_systems
* sessions
* refresh_tokens
* mfa_codes
* audit_logs

### Regla crítica

* ❌ No se permite una tabla `users` monolítica
* ❌ No se guarda la edad (se calcula)

---

## 6. MODELO DE USUARIO

### users

* id (UUID)
* email (único)
* passwordHash
* phone
* status (ACTIVE, BLOCKED, DISABLED)
* createdAt
* updatedAt

### user_profiles

* userId
* firstName
* lastName
* photoUrl
* birthDate
* hireDate
* departmentId
* positionId

---

## 7. ORGANIZACIÓN EMPRESARIAL

### departments

* id
* name
* description

### positions

* id
* name
* hierarchyLevel
* description

---

## 8. ROLES Y AUTORIZACIÓN

### Roles permitidos

* SYSTEM_ADMIN (**solo uno en todo el sistema**)
* SUPPORT_AGENT
* REQUESTOR
* AUTHORIZER
* PAYMENT_EXECUTOR

### Regla estricta

> El backend **debe impedir** la existencia de más de un SYSTEM_ADMIN.

---

## 9. SISTEMAS (SSO)

### systems

* id
* code
* name
* active

### user_systems

* userId
* systemId

---

## 10. AUTENTICACIÓN (FLUJO OBLIGATORIO)

### Paso 1 – Login

* Endpoint: POST /auth/login
* Validar email + password
* Crear sesión
* Enviar MFA

### Paso 2 – MFA

* Endpoint: POST /auth/mfa/verify
* Validar OTP
* Emitir tokens

---

## 11. TOKENS (ESTRICTO)

### Access Token

* JWT RS256
* Expira en 15 minutos

Payload obligatorio:

* sub
* email
* roles
* systems

### Refresh Token

* Persistido en BD
* Revocable
* Expira en 7 días

---

## 12. SESIONES Y LOGOUT GLOBAL

### sessions

* id
* userId
* ipAddress
* userAgent
* active
* expiresAt

### Logout Global

* Invalida todas las sesiones
* Revoca refresh tokens

---

## 13. MFA (OBLIGATORIO)

### mfa_codes

* id
* userId
* code
* expiresAt
* used

Reglas:

* Código de 6 dígitos
* Expira en 5 minutos
* Uso único

---

## 14. AUDITORÍA (NO OPCIONAL)

### audit_logs

* id
* userId (nullable)
* action
* description
* ipAddress
* createdAt

Eventos mínimos:

* LOGIN_SUCCESS
* LOGIN_FAILED
* MFA_VERIFIED
* LOGOUT
* LOGOUT_GLOBAL
* ROLE_ASSIGNED

---

## 15. ENDPOINTS OBLIGATORIOS

### Auth

* POST /auth/login
* POST /auth/mfa/verify
* POST /auth/refresh
* POST /auth/logout
* POST /auth/logout-all

### Usuarios

* POST /users
* GET /users
* GET /users/:id
* PUT /users/:id/profile

### Roles

* POST /roles
* POST /roles/assign

### Auditoría

* GET /audit/logs

---

## 16. SEGURIDAD (CHECKLIST OBLIGATORIO)

* JWT RS256
* MFA obligatorio
* argon2 para passwords
* Rate limiting
* Guards por rol
* Tokens de corta duración
* Refresh revocable
* Auditoría automática

---

## 17. PRUEBAS (OBLIGATORIAS)

* Unitarias: Jest
* Integración: Supertest
* E2E: Playwright / Cypress
* Mock de SMS

---

## 18. CI/CD (OBLIGATORIO)

* GitHub Actions
* Lint
* Tests
* Build
* Deploy

---

## 19. ESTADO ACTUAL

### Implementado conceptualmente

* Arquitectura definida
* Modelo de datos
* Login + MFA
* JWT RS256
* Roles
* ADMIN único
* Auditoría

---

## 20. PENDIENTES OBLIGATORIOS

1. Logout global completo
2. Interceptor automático de auditoría
3. Ejemplo de integración de sistemas clientes
4. Swagger
5. Manual de usuario

---

## 21. REGLA FINAL

> **Este documento es ley.**
> Copilot o cualquier IA **debe seguirlo estrictamente**.
> Si algo no está aquí, **no se implementa**.
