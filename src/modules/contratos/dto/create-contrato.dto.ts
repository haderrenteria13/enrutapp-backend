import {
  IsArray,
  IsDateString,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateContratoDto {
  @ApiProperty({
    description: 'ID del turno (viaje) para el cual se genera el contrato',
    format: 'uuid',
  })
  @IsUUID('all', { message: 'El ID del turno debe ser un UUID válido' })
  idTurno!: string;

  @ApiProperty({ description: 'Nombre del titular (pasajero principal)' })
  @IsString({ message: 'El nombre del titular debe ser texto' })
  @IsNotEmpty({ message: 'El nombre del titular es obligatorio' })
  @MaxLength(100)
  titularNombre!: string;

  @ApiProperty({
    description: 'Documento del titular (opcional)',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'El documento del titular debe ser texto' })
  @MaxLength(20)
  titularDocumento?: string;

  @ApiProperty({ description: 'Placa del vehículo', maxLength: 10 })
  @IsString({ message: 'La placa debe ser texto' })
  @IsNotEmpty({ message: 'La placa es obligatoria' })
  @MaxLength(10)
  placa!: string;

  @ApiProperty({
    description: 'Tipo de vehículo (texto) (opcional)',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'El tipo de vehículo debe ser texto' })
  @MaxLength(50)
  tipoVehiculo?: string;

  @ApiProperty({
    description: 'Capacidad de pasajeros (opcional)',
    required: false,
  })
  @IsOptional()
  @IsInt({ message: 'La capacidad debe ser un entero' })
  @Min(0)
  capacidadPasajeros?: number;

  @ApiProperty({ description: 'Lugar de origen' })
  @IsString({ message: 'El origen debe ser texto' })
  @IsNotEmpty({ message: 'El origen es obligatorio' })
  @MaxLength(120)
  origen!: string;

  @ApiProperty({ description: 'Lugar de destino' })
  @IsString({ message: 'El destino debe ser texto' })
  @IsNotEmpty({ message: 'El destino es obligatorio' })
  @MaxLength(120)
  destino!: string;

  @ApiProperty({
    description: 'Fecha de origen (YYYY-MM-DD)',
    example: '2025-12-11',
  })
  @IsDateString({}, { message: 'La fecha de origen debe ser una fecha válida' })
  fechaOrigen!: string;

  @ApiProperty({
    description: 'Fecha de destino (YYYY-MM-DD)',
    example: '2025-12-11',
  })
  @IsDateString(
    {},
    { message: 'La fecha de destino debe ser una fecha válida' },
  )
  fechaDestino!: string;

  @ApiProperty({
    description: 'Lista de pasajeros (opcional)',
    required: false,
    type: Array,
  })
  @IsOptional()
  @IsArray({ message: 'Pasajeros debe ser un arreglo' })
  pasajeros?: unknown[];
}
