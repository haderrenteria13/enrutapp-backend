import { PartialType } from '@nestjs/swagger';
import { CreateVehiculoDto } from './create-vehiculo.dto';

/**
 * DTO para actualizar un vehículo existente
 * Hereda todas las propiedades de CreateVehiculoDto pero las hace opcionales
 * Incluye campos como fotoUrl para actualizar la foto del vehículo
 */
export class UpdateVehiculoDto extends PartialType(CreateVehiculoDto) {}
