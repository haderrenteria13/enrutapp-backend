import {
  IsDateString,
  IsString,
  IsOptional,
  IsEnum,
  IsNotEmpty,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { CategoriaLicencia } from '@prisma/client';

/**
 * DTO para completar perfil de conductor (self-service)
 * Usado cuando un usuario con rol Conductor completa su propio perfil
 */
export class CompletarPerfilConductorDto {
  @ApiProperty({
    description: 'Categoría de la licencia de conducción',
    example: 'C2',
    enum: CategoriaLicencia,
  })
  @IsEnum(CategoriaLicencia)
  @IsNotEmpty()
  categoriaLicencia!: CategoriaLicencia;

  @ApiProperty({
    description:
      'Fecha de vencimiento de la licencia (YYYY-MM-DD). Debe ser mayor a la fecha actual',
    example: '2025-12-31',
  })
  @IsDateString()
  fechaVencimientoLicencia!: string;

  @ApiProperty({
    description: 'Observaciones adicionales sobre el conductor (opcional)',
    example: 'Licencia actualizada recientemente',
    required: false,
  })
  @IsString()
  @IsOptional()
  observaciones?: string;
}
