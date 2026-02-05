import { IsString, Length } from 'class-validator';

export class MfaVerifyDto {
  @IsString()
  sessionId: string;

  @IsString()
  @Length(6, 6, { message: 'El código MFA debe tener 6 dígitos' })
  code: string;
}
