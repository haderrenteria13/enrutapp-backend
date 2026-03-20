import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class ForgotPasswordDto {
  @IsEmail({}, { message: 'Debe proporcionar un email válido' })
  @IsNotEmpty({ message: 'El email es obligatorio' })
  correo!: string;
}

export class ResetPasswordDto {
  @IsString({ message: 'El código es obligatorio' })
  @IsNotEmpty({ message: 'El código es obligatorio' })
  code!: string;

  @IsString({ message: 'La nueva contraseña es obligatoria' })
  @IsNotEmpty({ message: 'La nueva contraseña es obligatoria' })
  @MinLength(6, {
    message: 'La nueva contraseña debe tener al menos 6 caracteres',
  })
  newPassword!: string;
}
