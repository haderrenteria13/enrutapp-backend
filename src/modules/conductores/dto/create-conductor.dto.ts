import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsUUID,
  IsDateString,
  Length,
  IsEnum,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { CategoriaLicencia } from '@prisma/client';

/**
 * DTO para crear un nuevo conductor
 * El conductor es una extensión del usuario con información específica de conducción
 */
export class CreateConductorDto {
  @ApiProperty({
    description:
      'ID único del conductor (UUID v4). Si no se proporciona, se genera automáticamente',
    example: '550e8400-e29b-41d4-a716-446655440001',
    required: false,
    type: String,
    format: 'uuid',
  })
  @IsUUID(4, { message: 'El ID del conductor debe ser un UUID válido' })
  @IsOptional()
  idConductor?: string;

  @ApiProperty({
    description:
      'ID del usuario asociado al conductor. El usuario debe tener rol de conductor',
    example: '550e8400-e29b-41d4-a716-446655440001',
    type: String,
    format: 'uuid',
  })
  @IsUUID(4, { message: 'El ID del usuario debe ser un UUID válido' })
  @IsNotEmpty({ message: 'El ID del usuario es obligatorio' })
  idUsuario!: string;

  @ApiProperty({
    description: 'Número de licencia de conducción (único)',
    example: 'CC123456789ABC',
    type: String,
    maxLength: 50,
  })
  @IsString({ message: 'El número de licencia debe ser texto' })
  @IsNotEmpty({ message: 'El número de licencia es obligatorio' })
  @Length(5, 50, {
    message: 'El número de licencia debe tener entre 5 y 50 caracteres',
  })
  numeroLicencia!: string;

  @ApiProperty({
    description: 'Categoría de la licencia (A1, A2, B1, B2, B3, C1, C2, C3)',
    example: 'C2',
    enum: CategoriaLicencia,
  })
  @IsEnum(CategoriaLicencia, {
    message: 'La categoría de licencia no es válida',
  })
  @IsNotEmpty({ message: 'La categoría de la licencia es obligatoria' })
  categoriaLicencia!: CategoriaLicencia;

  @ApiProperty({
    description:
      'Fecha de vencimiento de la licencia (formato ISO 8601: YYYY-MM-DD)',
    example: '2026-12-31',
    type: String,
    format: 'date',
  })
  @IsDateString(
    {},
    { message: 'La fecha de vencimiento debe ser una fecha válida' },
  )
  @IsNotEmpty({
    message: 'La fecha de vencimiento de la licencia es obligatoria',
  })
  fechaVencimientoLicencia!: string;

  @ApiProperty({
    description: 'Observaciones adicionales sobre el conductor',
    example: 'Conductor con experiencia en rutas intermunicipales',
    required: false,
    type: String,
  })
  @IsString({ message: 'Las observaciones deben ser texto' })
  @IsOptional()
  observaciones?: string;
}
