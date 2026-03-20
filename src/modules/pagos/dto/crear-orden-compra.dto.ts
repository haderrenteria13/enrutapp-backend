import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class PasajeroCompraDto {
  @ApiProperty({ description: 'Nombre del pasajero', example: 'Juan' })
  @IsString()
  @MaxLength(60)
  nombre!: string;

  @ApiProperty({ description: 'Apellido del pasajero', example: 'Pérez' })
  @IsString()
  @MaxLength(60)
  apellido!: string;

  @ApiProperty({ description: 'Tipo de documento', example: 'CC' })
  @IsString()
  @MaxLength(20)
  tipoDocumento!: string;

  @ApiProperty({ description: 'Número de documento', example: '1023456789' })
  @IsString()
  @MaxLength(30)
  numeroDocumento!: string;
}

export class CrearOrdenCompraDto {
  @ApiProperty({ description: 'ID del turno a comprar' })
  @IsUUID()
  idTurno!: string;

  @ApiProperty({
    description: 'Listado de pasajeros incluidos en la compra',
    type: [PasajeroCompraDto],
  })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(20)
  @ValidateNested({ each: true })
  @Type(() => PasajeroCompraDto)
  pasajeros!: PasajeroCompraDto[];

  @ApiProperty({
    description:
      'Correo de contacto para pago (opcional, por defecto el del usuario)',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  correoPagador?: string;
}
