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
* Hostinger

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

---

## 22. SECURITY.md – POLÍTICA DE SEGURIDAD ESTRICTA

### 22.1 Principios

* Zero Trust
* Defense in Depth
* Least Privilege
* Centralized Identity

### 22.2 Autenticación

* MFA obligatorio para TODOS los usuarios
* Prohibido desactivar MFA
* Contraseñas con argon2
* Política de contraseñas fuertes

### 22.3 Tokens

* JWT RS256 obligatorio
* Prohibido HS256
* Access Token ≤ 15 minutos
* Refresh Token revocable

### 22.4 Protección

* Rate limiting en /auth/login
* Protección brute force
* Helmet habilitado
* Validación DTO estricta

### 22.5 Auditoría

* Todo evento sensible debe auditarse
* No se permite bypass de auditoría

---

## 23. TESTING.md – ESTRATEGIA DE PRUEBAS OBLIGATORIA

### 23.1 Unitarias

* Servicios de auth
* MFA
* Roles
* Reglas de ADMIN único

### 23.2 Integración

* Login completo
* MFA + emisión de tokens
* Refresh token

### 23.3 End-to-End

* Login real desde frontend
* Acceso a sistema cliente
* Logout global

### 23.4 Reglas

* No deploy sin tests verdes
* Coverage mínimo 80%

---

## 24. ADR – DECISIONES DE ARQUITECTURA

### ADR-001

**Decisión:** NestJS como Auth Server
**Motivo:** Escalabilidad, estructura, soporte empresarial

### ADR-002

**Decisión:** Prisma + MySQL
**Motivo:** Tipado fuerte, migraciones controladas

### ADR-003

**Decisión:** JWT RS256
**Motivo:** Separación de claves, seguridad nivel banco

### ADR-004

**Decisión:** ADMIN único
**Motivo:** Gobierno y control

---

## 25. REGLA FINAL ABSOLUTA

> Este conjunto de documentos define el sistema de identidad.
> Cualquier cambio requiere:
>
> 1. Modificar esta especificación
> 2. Justificarlo en un ADR
> 3. Revisar impacto en seguridad

> **Sin excepción.**

---

## 26. THREAT_MODEL.md – MODELO DE AMENAZAS (STRIDE)

### 26.1 Spoofing

* Mitigado con MFA obligatorio
* Tokens firmados RS256

### 26.2 Tampering

* HTTPS obligatorio
* Validación estricta de payloads

### 26.3 Repudiation

* Logs inmutables
* Auditoría con timestamp y actor

### 26.4 Information Disclosure

* Datos sensibles cifrados
* No exponer PII en JWT

### 26.5 Denial of Service

* Rate limit
* Protección brute force

### 26.6 Elevation of Privilege

* Roles separados
* ADMIN único validado por regla dura

---

## 27. CI_CD.md – PIPELINE OBLIGATORIO

### 27.1 Pipeline

* Lint
* Tests unitarios
* Tests integración
* Coverage
* Build

### 27.2 Reglas

* Merge bloqueado si falla un paso
* Deploy solo desde main

---

## 28. COPILOT_RULES.md – REGLAS PARA IA

* No modificar arquitectura
* No cambiar seguridad
* No agregar roles
* No eliminar MFA
* No generar código sin tests

Si hay duda:

* Preguntar

---

## 29. CHECKLIST_FINAL.md

### Seguridad

* [ ] MFA activo
* [ ] RS256
* [ ] Rate limit

### Backend

* [ ] NestJS
* [ ] Prisma
* [ ] MySQL

### Testing

* [ ] Unitarias
* [ ] Integración
* [ ] E2E

---

## 30. CIERRE

Este documento es la fuente única de verdad.
Cualquier desviación es un error de implementación.
