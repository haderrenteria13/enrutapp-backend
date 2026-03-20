import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsUUID,
  IsDateString,
  IsIn,
  Matches,
  IsInt,
  Min,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO para crear un nuevo turno
 */
export class CreateTurnoDto {
  @ApiProperty({
    description:
      'ID único del turno (UUID v4). Si no se proporciona, se genera automáticamente',
    example: '550e8400-e29b-41d4-a716-446655440001',
    required: false,
    type: String,
    format: 'uuid',
  })
  @IsUUID(4, { message: 'El ID del turno debe ser un UUID válido' })
  @IsOptional()
  idTurno?: string;

  @ApiProperty({
    description: 'ID del conductor asignado al turno',
    example: '550e8400-e29b-41d4-a716-446655440001',
    type: String,
  })
  @IsString({ message: 'El ID del conductor debe ser texto' })
  @IsNotEmpty({ message: 'El ID del conductor es obligatorio' })
  @IsUUID(4, { message: 'El ID del conductor debe ser un UUID válido' })
  idConductor!: string;

  @ApiProperty({
    description: 'ID del vehículo asignado al turno',
    example: '550e8400-e29b-41d4-a716-446655440002',
    type: String,
  })
  @IsString({ message: 'El ID del vehículo debe ser texto' })
  @IsNotEmpty({ message: 'El ID del vehículo es obligatorio' })
  @IsUUID(4, { message: 'El ID del vehículo debe ser un UUID válido' })
  idVehiculo!: string;

  @ApiProperty({
    description: 'ID de la ruta asignada al turno (ruta del viaje)',
    example: '550e8400-e29b-41d4-a716-446655440010',
    type: String,
  })
  @IsString({ message: 'El ID de la ruta debe ser texto' })
  @IsNotEmpty({ message: 'El ID de la ruta es obligatorio' })
  @IsUUID(4, { message: 'El ID de la ruta debe ser un UUID válido' })
  idRuta!: string;

  @ApiProperty({
    description: 'Fecha del turno (formato ISO 8601)',
    example: '2025-05-20T00:00:00.000Z',
    type: String,
    format: 'date-time',
  })
  @IsDateString({}, { message: 'La fecha debe ser válida (ISO 8601)' })
  @IsNotEmpty({ message: 'La fecha es obligatoria' })
  fecha!: string;

  @ApiProperty({
    description: 'Hora del turno (formato HH:MM AM/PM)',
    example: '4:00 AM',
    type: String,
  })
  @IsString({ message: 'La hora debe ser texto' })
  @IsNotEmpty({ message: 'La hora es obligatoria' })
  @Matches(/^(0?[1-9]|1[0-2]):[0-5][0-9]\s?(AM|PM)$/i, {
    message: 'La hora debe tener el formato HH:MM AM/PM (ej: 4:00 AM)',
  })
  hora!: string;

  @ApiProperty({
    description: 'Estado del turno',
    example: 'Programado',
    enum: ['Programado', 'En curso', 'Completado', 'Cancelado'],
    required: false,
    default: 'Programado',
  })
  @IsString({ message: 'El estado debe ser texto' })
  @IsIn(['Programado', 'En curso', 'Completado', 'Cancelado'], {
    message: 'El estado debe ser: Programado, En curso, Completado o Cancelado',
  })
  @IsOptional()
  estado?: string;

  @ApiProperty({
    description: 'Cupos disponibles para pasajeros (sin contar conductor)',
    example: 12,
    required: false,
  })
  @IsInt({ message: 'Los cupos disponibles deben ser un número entero' })
  @Min(0, { message: 'Los cupos disponibles no pueden ser negativos' })
  @IsOptional()
  cuposDisponibles?: number;
}
