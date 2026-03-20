import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

/**
 * DTO para actualizar la ubicación del conductor
 */
export class UpdateLocationDto {
  @IsNotEmpty()
  @IsString()
  driverId!: string; // UUID del usuario

  @IsNotEmpty()
  @IsNumber()
  latitude!: number;

  @IsNotEmpty()
  @IsNumber()
  longitude!: number;

  @IsOptional()
  @IsNumber()
  heading?: number; // Dirección en grados (0-360)

  @IsOptional()
  @IsNumber()
  speed?: number; // Velocidad en m/s

  @IsOptional()
  @IsString()
  timestamp?: string;
}
