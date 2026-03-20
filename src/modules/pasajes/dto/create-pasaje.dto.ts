import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsUUID,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreatePasajeDto {
  @ApiProperty({ description: 'ID del Turno (viaje)' })
  @IsUUID()
  @IsNotEmpty()
  idTurno!: string;

  @ApiProperty({
    description: 'ID del Usuario (Opcional si es pasajero externo)',
  })
  @IsUUID()
  @IsOptional()
  idUsuario?: string;

  @ApiProperty({ description: 'Nombre del Pasajero' })
  @IsString()
  @IsNotEmpty()
  nombrePasajero!: string;

  @ApiProperty({ description: 'Documento del Pasajero', required: false })
  @IsString()
  @IsOptional()
  documentoPasajero?: string;

  @ApiProperty({ description: 'Número de Asiento (String)' })
  @IsString()
  @IsNotEmpty()
  asiento!: string;

  @ApiProperty({ description: 'Precio del Pasaje' })
  @IsNumber()
  @IsNotEmpty()
  precio!: number;

  @ApiProperty({ description: 'Estado del Pasaje', default: 'Reservado' })
  @IsString()
  @IsOptional()
  estado?: string;
}
