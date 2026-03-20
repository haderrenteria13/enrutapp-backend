import { ApiProperty } from '@nestjs/swagger';
import { IsObject, IsOptional, IsString } from 'class-validator';

export class WompiWebhookDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  event?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsObject()
  data?: Record<string, unknown>;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsObject()
  signature?: Record<string, unknown>;
}
