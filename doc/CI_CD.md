# CI_CD.md – PIPELINE OBLIGATORIO

> **Fuente de verdad:** LOGIN_GLOBAL_SSO_SPEC.md

---

## 1) Pipeline

Etapas obligatorias:
1. Lint
2. Tests unitarios
3. Tests de integración
4. Coverage
5. Build

---

## 2) Reglas

- Merge bloqueado si falla un paso
- Deploy solo desde main

---

## 3) GitHub Actions

El workflow debe ejecutarse en:
- push a main
- pull_request a main

---

**Fin del documento.**
