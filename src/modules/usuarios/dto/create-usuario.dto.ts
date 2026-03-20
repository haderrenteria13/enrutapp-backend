import {
  IsEmail,
  IsString,
  IsUUID,
  IsNotEmpty,
  MinLength,
  IsOptional,
  IsBoolean,
  IsInt,
  IsIn,
  Matches,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO para crear un nuevo usuario
 */
export class CreateUsuarioDto {
  @ApiProperty({
    description: 'ID del rol asignado al usuario',
    example: '550e8400-e29b-41d4-a716-446655440001',
    type: String,
    format: 'uuid',
  })
  @IsUUID(4, { message: 'El ID del rol debe ser un UUID válido' })
  @IsNotEmpty({ message: 'El rol es obligatorio' })
  idRol!: string;

  @ApiProperty({
    description: 'ID del tipo de documento (CC, TI, Pasaporte, etc.)',
    example: '550e8400-e29b-41d4-a716-446655440002',
    required: false,
    type: String,
    format: 'string',
  })
  @IsIn(['TI', 'CC', 'CE', 'Pasaporte'], {
    message: 'El tipo de documento no es válido',
  })
  @IsOptional()
  tipoDoc?: string;

  @ApiProperty({
    description: 'Número de documento de identidad',
    example: '1234567890',
    type: String,
  })
  @IsString({ message: 'El número de documento debe ser texto' })
  @IsNotEmpty({ message: 'El número de documento es obligatorio' })
  @Matches(/^\S+$/, {
    message: 'El número de documento no puede contener espacios',
  })
  @Matches(/^\d+$/, {
    message: 'El número de documento solo permite números',
  })
  numDocumento!: string;

  @ApiProperty({
    description: 'Nombre completo del usuario',
    example: 'María González López',
    type: String,
  })
  @IsString({ message: 'El nombre debe ser texto' })
  @IsNotEmpty({ message: 'El nombre es obligatorio' })
  nombre!: string;

  @ApiProperty({
    description: 'Número de teléfono de contacto',
    example: '+57 3109876543',
    required: false,
    type: String,
  })
  @IsString({ message: 'El teléfono debe ser texto' })
  @IsOptional()
  telefono?: string;

  @ApiProperty({
    description: 'Correo electrónico único del usuario',
    example: 'maria.gonzalez@example.com',
    type: String,
    format: 'email',
  })
  @IsEmail({}, { message: 'Debe proporcionar un correo electrónico válido' })
  @IsNotEmpty({ message: 'El correo es obligatorio' })
  correo!: string;

  @ApiProperty({
    description: 'Contraseña del usuario (mínimo 6 caracteres)',
    example: 'password123',
    minLength: 6,
    type: String,
  })
  @IsString({ message: 'La contraseña debe ser texto' })
  @IsNotEmpty({ message: 'La contraseña es obligatoria' })
  @MinLength(6, { message: 'La contraseña debe tener al menos 6 caracteres' })
  contrasena!: string;

  @ApiProperty({
    description: 'Dirección de residencia',
    example: 'Carrera 45 #123-45',
    required: false,
    type: String,
  })
  @IsString({ message: 'La dirección debe ser texto' })
  @IsOptional()
  direccion?: string;

  @ApiProperty({
    description: 'ID de la ciudad de residencia',
    example: 1,
    required: false,
    type: Number,
  })
  @IsInt({ message: 'El ID de ciudad debe ser un número entero' })
  @IsOptional()
  idCiudad?: number;

  @ApiProperty({
    description: 'Estado del usuario (activo/inactivo)',
    example: true,
    required: false,
    type: Boolean,
    default: true,
  })
  @IsBoolean({ message: 'El estado debe ser verdadero o falso' })
  @IsOptional()
  estado?: boolean;
}
