import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsBoolean,
  IsUUID,
  IsArray,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO para crear un nuevo rol
 */
export class CreateRolDto {
  @ApiProperty({
    description:
      'ID único del rol (UUID v4). Si no se proporciona, se genera automáticamente',
    example: '550e8400-e29b-41d4-a716-446655440003',
    required: false,
    type: String,
    format: 'uuid',
  })
  @IsUUID(4, { message: 'El ID del rol debe ser un UUID válido' })
  @IsOptional()
  idRol?: string;

  @ApiProperty({
    description: 'Nombre del rol (Admin, Conductor, Usuario, etc.)',
    example: 'Conductor',
    type: String,
  })
  @IsString({ message: 'El nombre del rol debe ser texto' })
  @IsNotEmpty({ message: 'El nombre del rol es obligatorio' })
  nombreRol!: string;

  @ApiProperty({
    description: 'Descripción del rol y sus permisos',
    example: 'Rol para conductores de vehículos',
    required: false,
    type: String,
  })
  @IsString({ message: 'La descripción debe ser texto' })
  @IsOptional()
  descripcion?: string;

  @ApiProperty({
    description: 'Estado del rol (activo/inactivo)',
    example: true,
    required: false,
    type: Boolean,
    default: true,
  })
  @IsBoolean({ message: 'El estado debe ser verdadero o falso' })
  @IsOptional()
  estado?: boolean;
  @ApiProperty({
    description: 'Lista de IDs de permisos a asignar',
    example: ['uuid-permiso-1', 'uuid-permiso-2'],
    required: false,
    type: [String],
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  permissions?: string[];
}
