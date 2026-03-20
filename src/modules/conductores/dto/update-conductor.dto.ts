import { PartialType } from '@nestjs/swagger';
import { CreateConductorDto } from './create-conductor.dto';

/**
 * DTO para actualizar un conductor existente
 * Hereda todas las propiedades de CreateConductorDto pero las hace opcionales
 */
export class UpdateConductorDto extends PartialType(CreateConductorDto) {}
