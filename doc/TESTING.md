# TESTING.md – ESTRATEGIA DE PRUEBAS OBLIGATORIA

> **Fuente de verdad:** LOGIN_GLOBAL_SSO_SPEC.md

---

## 1) Unitarias (Jest)

**Cobertura mínima:** 80%

Módulos a cubrir:
- AuthService
- MfaService
- RolesService
- Regla de ADMIN único

---

## 2) Integración (Supertest)

Escenarios mínimos:
- Login completo
- MFA + emisión de tokens
- Refresh token

---

## 3) End-to-End (Playwright / Cypress)

Escenarios mínimos:
- Login real desde frontend
- Acceso a sistema cliente
- Logout global

---

## 4) Mock SMS

El envío de SMS debe ser **mockeado** en pruebas:
- No enviar SMS reales
- Verificar que el flujo MFA se ejecute correctamente

---

## 5) Reglas

- No deploy sin tests verdes
- Coverage mínimo 80%

---

**Fin del documento.**
