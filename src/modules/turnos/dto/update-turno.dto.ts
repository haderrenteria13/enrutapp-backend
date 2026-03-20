import { PartialType } from '@nestjs/swagger';
import { CreateTurnoDto } from './create-turno.dto';

/**
 * DTO para actualizar un turno existente
 * Hereda todas las propiedades de CreateTurnoDto pero las hace opcionales
 */
export class UpdateTurnoDto extends PartialType(CreateTurnoDto) {}
