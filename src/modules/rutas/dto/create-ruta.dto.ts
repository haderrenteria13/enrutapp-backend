import { IsString, IsOptional, IsNumber, IsPositive } from 'class-validator';

export class CreateRutaDto {
  @IsString()
  idOrigen!: string;

  @IsString()
  idDestino!: string;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  distancia?: number;

  @IsOptional()
  @IsString()
  observaciones?: string;

  @IsOptional()
  @IsString()
  tiempoEstimado?: string;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  precioBase?: number;

  @IsOptional()
  @IsString()
  estado?: string;

  @IsOptional()
  paradas?: string[];
}
