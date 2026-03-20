import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Request as ExpressRequest } from 'express';
import { Public } from '../../common/decorators';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CrearOrdenCompraDto } from './dto/crear-orden-compra.dto';
import { ConfirmarTransaccionDto } from './dto/confirmar-transaccion.dto';
import { WompiWebhookDto } from './dto/wompi-webhook.dto';
import { PagosService } from './pagos.service';

interface AuthenticatedRequest extends ExpressRequest {
  user: {
    idUsuario: string;
  };
}

@ApiTags('Pagos')
@Controller('pagos')
export class PagosController {
  constructor(private readonly pagosService: PagosService) {}

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @Post('crear-orden')
  @ApiOperation({ summary: 'Crear orden de compra de tiquetes' })
  async crearOrden(
    @Body() dto: CrearOrdenCompraDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.pagosService.crearOrden(dto, req.user.idUsuario);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @Get('checkout-config/:idOrdenCompra')
  @ApiOperation({ summary: 'Obtener configuración de checkout de Wompi' })
  async getCheckoutConfig(
    @Param('idOrdenCompra') idOrdenCompra: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.pagosService.getCheckoutConfig(
      idOrdenCompra,
      req.user.idUsuario,
    );
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @Post('confirmar-transaccion')
  @ApiOperation({ summary: 'Confirmar transacción Wompi y emitir pasajes' })
  async confirmarTransaccion(
    @Body() dto: ConfirmarTransaccionDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.pagosService.confirmarTransaccion(
      dto.idOrdenCompra,
      dto.transactionId,
      req.user.idUsuario,
    );
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @Get('orden/:idOrdenCompra')
  @ApiOperation({ summary: 'Consultar estado de una orden de compra' })
  async getOrden(
    @Param('idOrdenCompra') idOrdenCompra: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.pagosService.getOrden(idOrdenCompra, req.user.idUsuario);
  }

  @Public()
  @Post('webhook/wompi')
  @ApiOperation({ summary: 'Webhook de eventos de Wompi' })
  async webhookWompi(@Body() dto: WompiWebhookDto) {
    return this.pagosService.webhookWompi(dto as Record<string, unknown>);
  }
}
