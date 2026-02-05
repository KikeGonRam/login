# STAKEHOLDERS – DOCUMENTACIÓN PARA NO TÉCNICOS

> **Fuente de verdad:** LOGIN_GLOBAL_SSO_SPEC.md
> Este documento traduce el alcance técnico a lenguaje ejecutivo.

---

## 1) ¿Qué es Login Global?

Login Global es el sistema central de identidad de la empresa. Permite que todos los sistemas internos utilicen **un solo inicio de sesión**, de forma segura, controlada y auditada.

---

## 2) ¿Por qué se implementa?

Actualmente, cada sistema maneja usuarios por separado, lo que genera:

- Duplicidad de cuentas
- Riesgos de seguridad
- Dificultad para desactivar accesos
- Falta de trazabilidad

Login Global resuelve esto centralizando la identidad.

---

## 3) ¿Qué problemas elimina?

- ❌ Múltiples contraseñas por usuario
- ❌ Usuarios activos en sistemas antiguos
- ❌ Falta de control de accesos
- ❌ Ausencia de auditoría

---

## 4) Beneficios para la empresa

### Seguridad

- Autenticación multifactor obligatoria
- Tokens seguros de corta duración
- Registro de todas las acciones sensibles

### Control

- Un solo administrador central
- Roles claramente definidos
- Accesos revocables en tiempo real

### Escalabilidad

- Preparado para crecimiento futuro
- Fácil integración de nuevos sistemas

---

## 5) ¿Cómo funciona a alto nivel?

1. El usuario inicia sesión una sola vez
2. El sistema valida su identidad
3. Se le otorga acceso a los sistemas permitidos
4. Todas las acciones quedan registradas

---

## 6) Roles explicados en lenguaje simple

- **Administrador**: Control total del sistema (solo una persona)
- **Soporte**: Apoya a usuarios, sin permisos críticos
- **Solicitante**: Inicia procesos
- **Aprobador**: Autoriza solicitudes
- **Pagador**: Ejecuta pagos autorizados

---

## 7) ¿Qué pasa si un usuario deja la empresa?

- Se desactiva en Login Global
- Automáticamente pierde acceso a TODOS los sistemas
- Queda registro de la acción

---

## 8) Auditoría y cumplimiento

- Cada acción importante queda registrada
- Se puede saber quién hizo qué y cuándo
- Facilita auditorías internas y externas

---

## 9) Estado del proyecto

- Definición funcional: ✅ Completa
- Seguridad: ✅ Definida
- Arquitectura: ✅ Cerrada
- Implementación: ✅ En curso

---

## 10) Mensaje clave para directivos

> Login Global no es un gasto técnico.
> Es una inversión en seguridad, control y crecimiento.
