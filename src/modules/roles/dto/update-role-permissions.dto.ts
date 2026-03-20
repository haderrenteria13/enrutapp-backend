import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsString } from 'class-validator';

export class UpdateRolePermissionsDto {
  @ApiProperty({
    description: 'Array of Permission IDs to assign to the role',
    example: ['permiso-uuid-1', 'permiso-uuid-2'],
  })
  @IsArray()
  @IsString({ each: true })
  permissions!: string[];
}
