# EJEMPLO DE INTEGRACIÓN DE SISTEMAS CLIENTES

> **Fuente de verdad:** LOGIN_GLOBAL_SSO_SPEC.md
> Este ejemplo **no agrega** autenticación local ni cambia arquitectura.

---

## 1) Objetivo

Demostrar cómo un **sistema cliente** consume el Login Global SSO para:
- Autenticar usuarios **solo** a través del Login Global
- Recibir un **JWT RS256**
- Validar permisos de acceso a su sistema

---

## 2) Flujo SSO (obligatorio)

1. **Login** en Login Global:
   - `POST /auth/login` con `email` y `password`
2. **MFA** obligatorio:
   - `POST /auth/mfa/verify` con `sessionId` y `code`
3. **Tokens** emitidos:
   - `accessToken` (JWT RS256)
   - `refreshToken` (persistido en BD)
4. **Sistema cliente** recibe `accessToken`
5. **Sistema cliente** valida JWT con **clave pública**
6. **Sistema cliente** autoriza acceso por `roles` y `systems`

---

## 3) Validación del JWT en el sistema cliente (RS256)

**Regla:** el cliente **no** autentica localmente. Solo verifica el JWT del Login Global.

### Ejemplo (Node.js + Express)

```ts
import express from 'express';
import jwt from 'jsonwebtoken';
import fs from 'fs';

const app = express();
const publicKey = fs.readFileSync('./keys/public.pem', 'utf8');

app.use((req, res, next) => {
  const auth = req.headers.authorization;
  if (!auth?.startsWith('Bearer ')) return res.status(401).json({ message: 'No token' });

  const token = auth.replace('Bearer ', '');
  try {
    const payload = jwt.verify(token, publicKey, { algorithms: ['RS256'] });
    req.user = payload;
    return next();
  } catch (err) {
    return res.status(401).json({ message: 'Token inválido' });
  }
});

// Ejemplo: proteger un recurso del sistema cliente
app.get('/mi-recurso', (req, res) => {
  const user = req.user;
  // Validar acceso por sistema y rol
  if (!user.systems?.includes('PAYMENTS')) {
    return res.status(403).json({ message: 'Sin acceso al sistema' });
  }
  return res.json({ ok: true });
});

app.listen(4000);
```

---

## 4) Validación de acceso por sistema

**Regla:** el JWT incluye `systems`.

- Si el `system.code` del cliente **no** está en `systems`, se bloquea acceso.

Ejemplo:
```ts
if (!payload.systems.includes('TREASURY')) {
  throw new Error('Acceso denegado');
}
```

---

## 5) Validación por rol (RBAC)

**Regla:** el JWT incluye `roles`.

Ejemplo:
```ts
if (!payload.roles.includes('AUTHORIZER')) {
  throw new Error('Rol insuficiente');
}
```

---

## 6) Refresh Token (opcional en cliente)

Si el access token expira:
- Llamar a `POST /auth/refresh` con `refreshToken`
- Reemplazar `accessToken`

---

## 7) Logout Global

Para cerrar sesión en **todos los sistemas**:
- `POST /auth/logout-all`
- El sistema cliente debe invalidar el token local

---

## 8) Reglas de seguridad

- ❌ No almacenar contraseñas en el sistema cliente
- ❌ No usar JWT HS256
- ✅ Validar RS256 con clave pública
- ✅ Respetar `roles` y `systems`

---

**Fin del ejemplo.**
