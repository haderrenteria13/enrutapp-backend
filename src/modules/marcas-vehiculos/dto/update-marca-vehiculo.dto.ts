import { PartialType } from '@nestjs/swagger';
import { CreateMarcaVehiculoDto } from './create-marca-vehiculo.dto';

/**
 * DTO para actualizar una marca de vehículo existente
 * Hereda todas las propiedades de CreateMarcaVehiculoDto pero las hace opcionales
 */
export class UpdateMarcaVehiculoDto extends PartialType(
  CreateMarcaVehiculoDto,
) {}
