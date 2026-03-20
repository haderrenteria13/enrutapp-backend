import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  Query,
  Req,
  HttpException,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { PasajesService } from './pasajes.service';
import { CreatePasajeDto } from './dto/create-pasaje.dto';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import type { Request as ExpressRequest } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

interface AuthenticatedRequest extends ExpressRequest {
  user: {
    idUsuario: string;
    rol?: {
      nombreRol?: string;
    };
  };
}

@ApiTags('Pasajes')
@Controller('pasajes')
export class PasajesController {
  constructor(private readonly pasajesService: PasajesService) {}

  /**
   * Lista pasajes comprados por el cliente autenticado.
   */
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @Get('mis-pasajes')
  @ApiOperation({ summary: 'Listar pasajes del cliente autenticado' })
  async findMyPasajes(@Req() req: AuthenticatedRequest) {
    return this.pasajesService.findMyPasajes(req.user.idUsuario);
  }

  /**
   * Lista pasajes vendidos para uso administrativo.
   */
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @Get('ventas')
  @ApiOperation({ summary: 'Listar pasajes vendidos (admin)' })
  async findVentas(
    @Req() req: AuthenticatedRequest,
    @Query('idTurno') idTurno?: string,
    @Query('estado') estado?: string,
  ) {
    const nombreRol = req.user?.rol?.nombreRol?.toLowerCase?.() || '';
    const esAdmin = nombreRol === 'administrador' || nombreRol === 'admin';

    if (!esAdmin) {
      throw new HttpException(
        {
          success: false,
          error: 'No autorizado para consultar ventas de pasajes',
        },
        HttpStatus.FORBIDDEN,
      );
    }

    return this.pasajesService.findVentas({ idTurno, estado });
  }

  /**
   * Crea un nuevo registro en el sistema.
   * @param createPasajeDto - createPasajeDto parameter
   * @returns El resultado de la operación.
   */
  @Post()
  @ApiOperation({ summary: 'Vender un pasaje' })
  async create(@Body() createPasajeDto: CreatePasajeDto) {
    return this.pasajesService.create(createPasajeDto);
  }

  /**
   * Realiza la operación de find by viaje.
   * @param id - id parameter
   * @returns El resultado de la operación.
   */
  @Get('turno/:id')
  @ApiOperation({ summary: 'Listar pasajes de un turno (viaje)' })
  async findByViaje(@Param('id') id: string) {
    return this.pasajesService.findAllByTurno(id);
  }
}
