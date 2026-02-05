# LOGIN GLOBAL SSO – CONTEXTO COMPLETO DEL PROYECTO

## 1. VISIÓN GENERAL

Este proyecto implementa un **Login Global con Single Sign-On (SSO)** para una **empresa real**, con **nivel de seguridad tipo banco**. El objetivo es centralizar la autenticación y autorización de **7 sistemas web internos**, eliminando la autenticación individual por sistema.

El Login Global actúa como **Identity Provider (IdP)**. Todos los sistemas confían en él mediante **JWT RS256**, **REST API** y **MFA obligatorio por SMS**.

---

## 2. ALCANCE FUNCIONAL

* Single Sign-On (SSO)
* Autenticación centralizada
* MFA obligatorio (SMS)
* JWT con Refresh Token
* Logout global
* Auditoría completa
* Gestión de roles y permisos
* Integración con múltiples sistemas
* Crecimiento escalable

---

## 3. STACK TECNOLÓGICO

### Backend

* **NestJS** (Node.js)
* **Prisma ORM**
* **MySQL 8.x**

### Seguridad

* JWT **RS256** (clave pública / privada)
* Hash de contraseñas: **argon2**
* MFA por SMS (Twilio o equivalente)
* Rate limiting
* Guards por rol
* Auditoría obligatoria

### Frontend

* **Next.js** (Login Global)

### Infraestructura

* Hostinger
* REST API

---

## 4. ARQUITECTURA GENERAL

* Login Global (Frontend Next.js)
* Auth Server (NestJS)
* Base de datos central MySQL
* Sistemas clientes (7 apps internas)

Flujo general:

1. Usuario intenta acceder a un sistema
2. Redirección al Login Global
3. Login + MFA
4. Emisión de JWT
5. Acceso a todos los sistemas sin volver a autenticarse

---

## 5. MODELO DE USUARIO

### Datos del usuario (normalizados)

**users**

* id
* email
* passwordHash
* phone
* status
* createdAt
* updatedAt

**user_profiles**

* userId
* firstName
* lastName
* photoUrl
* birthDate (edad se calcula, no se guarda)
* hireDate
* departmentId
* positionId

**departments**

* id
* name
* description

**positions**

* id
* name
* hierarchyLevel
* description

---

## 6. ROLES Y AUTORIZACIÓN

### Roles del sistema

* SYSTEM_ADMIN (**solo puede existir uno**)
* SUPPORT_AGENT
* REQUESTOR
* AUTHORIZER
* PAYMENT_EXECUTOR

Relación N:M entre usuarios y roles.

Regla crítica:

> **Solo puede existir un usuario con rol SYSTEM_ADMIN**, validado a nivel de backend.

---

## 7. SISTEMAS (SSO)

**systems**

* id
* code
* name
* active

**user_systems**

* userId
* systemId

Cada sistema valida el JWT emitido por el Login Global.

---

## 8. AUTENTICACIÓN (FLUJO COMPLETO)

### Login

1. POST /auth/login
2. Validación email + password
3. Creación de sesión
4. Envío de código MFA

### MFA

1. POST /auth/mfa/verify
2. Validación OTP
3. Emisión de Access Token + Refresh Token

---

## 9. TOKENS

### Access Token

* JWT RS256
* Expiración: 15 minutos

Payload:

* sub (userId)
* email
* roles
* systems

### Refresh Token

* Persistido en BD
* Revocable
* Expiración larga (7 días)

---

## 10. SESIONES Y LOGOUT GLOBAL

**sessions**

* id
* userId
* ipAddress
* userAgent
* active
* expiresAt

Logout global:

* Invalida todas las sesiones
* Revoca refresh tokens

---

## 11. MFA (SMS)

**mfa_codes**

* id

* userId

* code

* expiresAt

* used

* Código de 6 dígitos

* Expira en 5 minutos

* Uso único

---

## 12. AUDITORÍA (OBLIGATORIA)

**audit_logs**

* id
* userId (nullable)
* action
* description
* ipAddress
* createdAt

Eventos auditados:

* LOGIN_SUCCESS
* LOGIN_FAILED
* MFA_VERIFIED
* LOGOUT
* LOGOUT_GLOBAL
* ROLE_ASSIGNED

---

## 13. ENDPOINTS PRINCIPALES

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

## 14. SEGURIDAD (NIVEL BANCO)

* JWT RS256
* MFA obligatorio
* Passwords con argon2
* Rate limiting
* Guards por rol
* Auditoría automática
* Tokens de corta duración
* Refresh tokens revocables

---

## 15. PRUEBAS

* Unitarias: Jest
* Integración: Supertest
* E2E: Playwright / Cypress
* Mock de proveedor SMS

---

## 16. CI/CD

* GitHub Actions
* Lint
* Tests
* Build
* Deploy automático

---

## 17. ESTADO ACTUAL DEL PROYECTO

### Ya implementado conceptualmente:

* Arquitectura SSO
* Modelo de datos completo
* AuthService (login + MFA)
* JWT RS256
* Roles y ADMIN único
* Auditoría

---

## 18. PUNTOS QUE FALTAN IMPLEMENTAR

1. Logout global completo
2. Interceptor de auditoría automático
3. Integración ejemplo con sistemas clientes
4. Swagger (documentación API)
5. CI/CD completo
6. Manual de usuario final

---

## 19. OBJETIVO FINAL

Disponer de un **Login Global corporativo**, seguro, auditable, escalable y mantenible, que sirva como **núcleo de identidad** para todos los sistemas internos de la empresa.

Este documento sirve como **contexto completo** para Copilot o cualquier IA de apoyo al desarrollo.
