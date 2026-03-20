import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsUUID,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateEncomiendaDto {
  @ApiProperty({ description: 'ID del Turno (viaje)' })
  @IsUUID()
  @IsNotEmpty()
  idTurno!: string;

  @ApiProperty({ description: 'Nombre del Remitente' })
  @IsString()
  @IsNotEmpty()
  remitenteNombre!: string;

  @ApiProperty({ description: 'Teléfono del Remitente' })
  @IsString()
  @IsNotEmpty()
  remitenteTel!: string;

  @ApiProperty({ description: 'Nombre del Destinatario' })
  @IsString()
  @IsNotEmpty()
  destinatarioNombre!: string;

  @ApiProperty({ description: 'Teléfono del Destinatario' })
  @IsString()
  @IsNotEmpty()
  destinatarioTel!: string;

  @ApiProperty({ description: 'Descripción de la encomienda' })
  @IsString()
  @IsNotEmpty()
  descripcion!: string;

  @ApiProperty({ description: 'Peso en Kg (Opcional)', required: false })
  @IsNumber()
  @IsOptional()
  peso?: number;

  @ApiProperty({ description: 'Precio del envío' })
  @IsNumber()
  @IsNotEmpty()
  precio!: number;

  @ApiProperty({ description: 'Estado', default: 'Pendiente' })
  @IsString()
  @IsOptional()
  estado?: string;
}
