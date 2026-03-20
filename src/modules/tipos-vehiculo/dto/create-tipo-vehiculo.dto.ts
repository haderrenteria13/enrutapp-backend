import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsBoolean,
  IsUUID,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO para crear un nuevo tipo de vehículo
 */
export class CreateTipoVehiculoDto {
  @ApiProperty({
    description:
      'ID único del tipo de vehículo (UUID v4). Si no se proporciona, se genera automáticamente',
    example: '550e8400-e29b-41d4-a716-446655440001',
    required: false,
    type: String,
    format: 'uuid',
  })
  @IsUUID(4, { message: 'El ID del tipo de vehículo debe ser un UUID válido' })
  @IsOptional()
  idTipoVehiculo?: string;

  @ApiProperty({
    description:
      'Nombre del tipo de vehículo (Automóvil, Camioneta, Bus, Camión, etc.)',
    example: 'Automóvil',
    type: String,
    maxLength: 50,
  })
  @IsString({ message: 'El nombre del tipo de vehículo debe ser texto' })
  @IsNotEmpty({ message: 'El nombre del tipo de vehículo es obligatorio' })
  nombreTipoVehiculo!: string;

  @ApiProperty({
    description: 'Descripción del tipo de vehículo y sus características',
    example: 'Vehículo de pasajeros con capacidad de hasta 5 personas',
    required: false,
    type: String,
  })
  @IsString({ message: 'La descripción debe ser texto' })
  @IsOptional()
  descripcion?: string;

  @ApiProperty({
    description: 'Estado del tipo de vehículo (activo/inactivo)',
    example: true,
    required: false,
    type: Boolean,
    default: true,
  })
  @IsBoolean({ message: 'El estado debe ser verdadero o falso' })
  @IsOptional()
  estado?: boolean;
}
