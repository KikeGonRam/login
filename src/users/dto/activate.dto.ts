import { IsString, IsStrongPassword, MinLength } from 'class-validator';

/**
 * DTO para activación de usuario
 *
 * Requiere:
 * - Token de un solo uso (validado en ActivationTokenService)
 * - Contraseña segura (con validaciones)
 */
export class ActivateUserDto {
  @IsString({ message: 'El token debe ser texto' })
  @MinLength(64, { message: 'Token inválido' })
  token: string;

  @IsStrongPassword(
    {
      minLength: 12,
      minLowercase: 1,
      minNumbers: 1,
      minSymbols: 1,
      minUppercase: 1,
    },
    {
      message:
        'La contraseña debe contener: mínimo 12 caracteres, 1 mayúscula, 1 minúscula, 1 número, 1 símbolo especial',
    },
  )
  password: string;
}
