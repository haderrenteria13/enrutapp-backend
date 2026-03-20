import { PartialType } from '@nestjs/swagger';
import { CreateTipoVehiculoDto } from './create-tipo-vehiculo.dto';

/**
 * DTO para actualizar un tipo de vehículo existente
 * Hereda todas las propiedades de CreateTipoVehiculoDto pero las hace opcionales
 */
export class UpdateTipoVehiculoDto extends PartialType(CreateTipoVehiculoDto) {}
