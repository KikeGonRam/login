# MANUAL DE USUARIO – LOGIN GLOBAL SSO

> **Fuente de verdad:** LOGIN_GLOBAL_SSO_SPEC.md
> Este manual describe el uso del Login Global sin cambiar arquitectura.

---

## 1) ¿Qué es Login Global?

Login Global es el sistema central de autenticación (SSO) para los 7 sistemas internos de la empresa. Es el **único** punto de login y control de acceso.

---

## 2) Iniciar sesión

1. Ingrese su **correo** y **contraseña** en Login Global.
2. El sistema enviará un **código MFA** por SMS.
3. Ingrese el código MFA en la pantalla de verificación.
4. Si el código es correcto, se inicia sesión.

---

## 3) Código MFA (obligatorio)

- El código tiene **6 dígitos**.
- Expira en **5 minutos**.
- Es de **uso único**.

Si el código expira, solicite un nuevo login.

---

## 4) Acceso a sistemas internos

Al iniciar sesión, su acceso se determina por:
- **Roles** asignados
- **Sistemas** permitidos

Si no tiene acceso, verá un mensaje de bloqueo. Contacte a su administrador.

---

## 5) Cerrar sesión

### Cerrar sesión actual
Use la opción de **Cerrar sesión** en el sistema activo.

### Logout global
Para cerrar sesión en **todos los sistemas**:
- Use la opción **Cerrar sesión en todos**.
- Esto invalida todas las sesiones y tokens.

---

## 6) Políticas de seguridad

- MFA es **obligatorio**.
- No comparta su contraseña ni su código MFA.
- Cambie su contraseña si sospecha acceso no autorizado.

---

## 7) Roles disponibles

- **SYSTEM_ADMIN**: Administración total del sistema.
- **SUPPORT_AGENT**: Soporte operativo.
- **REQUESTOR**: Solicitud de operaciones.
- **AUTHORIZER**: Autorización de operaciones.
- **PAYMENT_EXECUTOR**: Ejecución de pagos.

---

## 8) Soporte

Si tiene problemas para acceder:
1. Verifique su correo y contraseña.
2. Asegúrese de ingresar el MFA antes de 5 minutos.
3. Contacte al área de soporte interno.

---

**Fin del manual.**
