import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsString, IsIn, Matches } from 'class-validator';

/**
 * DTO para completar perfil de Cliente (self-service)
 * Usado cuando un usuario con rol Cliente completa su información faltante.
 */
export class CompletarPerfilClienteDto {
  @ApiProperty({
    description: 'ID del tipo de documento (UUID)',
    example: '550e8400-e29b-41d4-a716-446655440002',
  })
  @IsIn(['TI', 'CC', 'CE', 'Pasaporte'], {
    message: 'El tipo de documento no es válido',
  })
  @IsNotEmpty({ message: 'El tipo de documento es obligatorio' })
  tipoDoc!: string;

  @ApiProperty({
    description: 'Número de documento',
    example: '1234567890',
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
    description: 'Teléfono de contacto',
    example: '+57 3001234567',
  })
  @IsString({ message: 'El teléfono debe ser texto' })
  @IsNotEmpty({ message: 'El teléfono es obligatorio' })
  telefono!: string;

  @ApiProperty({
    description: 'Dirección',
    example: 'Calle 123 #45-67',
  })
  @IsString({ message: 'La dirección debe ser texto' })
  @IsNotEmpty({ message: 'La dirección es obligatoria' })
  direccion!: string;

  @ApiProperty({
    description: 'ID de ciudad',
    example: 1,
    type: Number,
  })
  @IsInt({ message: 'El ID de ciudad debe ser un número entero' })
  @IsNotEmpty({ message: 'La ciudad es obligatoria' })
  idCiudad!: number;
}
