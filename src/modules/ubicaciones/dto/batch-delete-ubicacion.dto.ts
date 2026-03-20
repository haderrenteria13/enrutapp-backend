import { IsArray, IsString, ArrayMinSize, ArrayMaxSize } from 'class-validator';

export class BatchDeleteUbicacionDto {
  @IsArray({ message: 'ids debe ser un array' })
  @ArrayMinSize(1, { message: 'Debe proporcionar al menos un ID' })
  @ArrayMaxSize(50, {
    message: 'No se pueden eliminar más de 50 ubicaciones a la vez',
  })
  @IsString({ each: true, message: 'Cada ID debe ser una cadena de texto' })
  ids!: string[];
}
