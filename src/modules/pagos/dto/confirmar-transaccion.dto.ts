import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsUUID } from 'class-validator';

export class ConfirmarTransaccionDto {
  @ApiProperty({ description: 'ID de la orden de compra' })
  @IsUUID()
  idOrdenCompra!: string;

  @ApiProperty({ description: 'ID de transacción de Wompi' })
  @IsString()
  transactionId!: string;
}
