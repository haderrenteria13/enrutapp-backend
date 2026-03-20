import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCiudadDto {
  @ApiProperty({
    description: 'Nombre de la ciudad',
    example: 'Cali',
  })
  @IsString()
  @IsNotEmpty()
  nombreCiudad!: string;
}
