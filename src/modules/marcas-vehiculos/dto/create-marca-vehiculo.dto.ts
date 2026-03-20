import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsBoolean,
  IsUUID,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO para crear una nueva marca de vehículo
 */
export class CreateMarcaVehiculoDto {
  @ApiProperty({
    description:
      'ID único de la marca (UUID v4). Si no se proporciona, se genera automáticamente',
    example: '550e8400-e29b-41d4-a716-446655440001',
    required: false,
    type: String,
    format: 'uuid',
  })
  @IsUUID(4, { message: 'El ID de la marca debe ser un UUID válido' })
  @IsOptional()
  idMarcaVehiculo?: string;

  @ApiProperty({
    description:
      'Nombre de la marca de vehículo (Toyota, Chevrolet, Ford, etc.)',
    example: 'Toyota',
    type: String,
    maxLength: 50,
  })
  @IsString({ message: 'El nombre de la marca debe ser texto' })
  @IsNotEmpty({ message: 'El nombre de la marca es obligatorio' })
  nombreMarca!: string;

  @ApiProperty({
    description: 'País de origen de la marca',
    example: 'Japón',
    required: false,
    type: String,
    maxLength: 50,
  })
  @IsString({ message: 'El país debe ser texto' })
  @IsOptional()
  pais?: string;

  @ApiProperty({
    description: 'Estado de la marca (activo/inactivo)',
    example: true,
    required: false,
    type: Boolean,
    default: true,
  })
  @IsBoolean({ message: 'El estado debe ser verdadero o falso' })
  @IsOptional()
  estado?: boolean;
}
