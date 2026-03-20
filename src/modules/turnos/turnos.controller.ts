import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Put,
  Delete,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBadRequestResponse,
  ApiNotFoundResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { TurnosService } from './turnos.service';
import { CreateTurnoDto, UpdateTurnoDto } from './dto/index';
import { Public } from '../../common/decorators';
import type { Request as ExpressRequest } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

interface AuthenticatedRequest extends ExpressRequest {
  user: {
    idUsuario: string;
  };
}

/**
 * Controlador de Turnos
 * Maneja las operaciones CRUD de turnos
 */
@ApiTags('Turnos')
@Controller('turnos')
export class TurnosController {
  constructor(private readonly turnosService: TurnosService) {}

  /**
   * Realiza la operación de buscar.
   * @param origen - origen parameter
   * @param destino - destino parameter
   * @param origenId - origenId parameter
   * @param destinoId - destinoId parameter
   * @param fecha - fecha parameter
   * @returns El resultado de la operación.
   */
  @Get('buscar')
  @Public()
  @ApiOperation({
    summary: 'Buscar turnos disponibles (public)',
    description:
      'Busca turnos por origen/destino y fecha. Pensado para la landing/compra pública.',
  })
  async buscar(
    @Query('origen') origen?: string,
    @Query('destino') destino?: string,
    @Query('origenId') origenId?: string,
    @Query('destinoId') destinoId?: string,
    @Query('fecha') fecha?: string,
  ) {
    return this.turnosService.buscarPublico({
      origen,
      destino,
      origenId,
      destinoId,
      fecha,
    });
  }

  /**
   * Realiza la operación de find by ruta.
   * @param idRuta - idRuta parameter
   * @param fecha - fecha parameter
   * @returns El resultado de la operación.
   */
  @Get('ruta/:idRuta')
  @Public()
  @ApiOperation({
    summary: 'Listar turnos por ruta y fecha (public)',
    description:
      'Obtiene turnos de una ruta específica para una fecha. Pensado para consultas públicas.',
  })
  async findByRuta(
    @Param('idRuta') idRuta: string,
    @Query('fecha') fecha?: string,
  ) {
    return this.turnosService.findByRutaPublico(idRuta, fecha);
  }

  /**
   * Realiza la operación de get asientos.
   * @param id - id parameter
   * @returns El resultado de la operación.
   */
  @Get(':id/asientos')
  @Public()
  @ApiOperation({
    summary: 'Obtener asientos de un turno (public)',
    description:
      'Devuelve cantidad de asientos y asientos ocupados según pasajes del turno.',
  })
  async getAsientos(@Param('id') id: string) {
    return this.turnosService.getAsientosPublico(id);
  }

  /**
   * Obtiene una lista de todos los registros.
   * @returns El resultado de la operación.
   */
  @Get()
  @ApiOperation({
    summary: 'Listar todos los turnos',
    description:
      'Obtiene la lista completa de turnos registrados en el sistema con sus relaciones',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de turnos obtenida exitosamente',
  })
  async findAll() {
    return this.turnosService.findAll();
  }

  /**
   * Lista los viajes asignados al conductor autenticado.
   */
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @Get('mis-viajes')
  @ApiOperation({
    summary: 'Listar viajes asignados al conductor autenticado',
  })
  async findMisViajes(@Req() req: AuthenticatedRequest) {
    return this.turnosService.findMisViajesConductor(req.user.idUsuario);
  }

  /**
   * Obtiene un registro por su identificador único.
   * @param id - id parameter
   * @returns El resultado de la operación.
   */
  @ApiBearerAuth('JWT-auth')
  @Get(':id')
  @ApiOperation({
    summary: 'Obtener turno por ID',
    description: 'Obtiene la información detallada de un turno específico',
  })
  @ApiParam({
    name: 'id',
    description: 'ID del turno (UUID)',
    example: '550e8400-e29b-41d4-a716-446655440001',
  })
  @ApiResponse({
    status: 200,
    description: 'Turno encontrado',
  })
  @ApiNotFoundResponse({ description: 'Turno no encontrado' })
  @ApiUnauthorizedResponse({ description: 'Token no válido o expirado' })
  async findOne(@Param('id') id: string) {
    return this.turnosService.findOne(id);
  }

  /**
   * Crea un nuevo registro en el sistema.
   * @param createTurnoDto - createTurnoDto parameter
   * @returns El resultado de la operación.
   */
  @ApiBearerAuth('JWT-auth')
  @Post()
  @ApiOperation({
    summary: 'Crear nuevo turno',
    description: 'Registra un nuevo turno en el sistema',
  })
  @ApiResponse({
    status: 201,
    description: 'Turno creado exitosamente',
  })
  @ApiBadRequestResponse({ description: 'Datos inválidos' })
  @ApiUnauthorizedResponse({ description: 'Token no válido o expirado' })
  async create(@Body() createTurnoDto: CreateTurnoDto) {
    return this.turnosService.create(createTurnoDto);
  }

  /**
   * Actualiza un registro existente.
   * @param id - id parameter
   * @param updateTurnoDto - updateTurnoDto parameter
   * @returns El resultado de la operación.
   */
  @ApiBearerAuth('JWT-auth')
  @Put(':id')
  @ApiOperation({
    summary: 'Actualizar turno',
    description: 'Actualiza la información de un turno existente',
  })
  @ApiParam({
    name: 'id',
    description: 'ID del turno a actualizar (UUID)',
    example: '550e8400-e29b-41d4-a716-446655440001',
  })
  @ApiResponse({
    status: 200,
    description: 'Turno actualizado exitosamente',
  })
  @ApiNotFoundResponse({ description: 'Turno no encontrado' })
  @ApiBadRequestResponse({ description: 'Datos inválidos' })
  @ApiUnauthorizedResponse({ description: 'Token no válido o expirado' })
  async update(
    @Param('id') id: string,
    @Body() updateTurnoDto: UpdateTurnoDto,
  ) {
    return this.turnosService.update(id, updateTurnoDto);
  }

  /**
   * Elimina un registro del sistema.
   * @param id - id parameter
   * @returns El resultado de la operación.
   */
  @ApiBearerAuth('JWT-auth')
  @Delete(':id')
  @ApiOperation({
    summary: 'Eliminar turno',
    description: 'Elimina un turno del sistema',
  })
  @ApiParam({
    name: 'id',
    description: 'ID del turno a eliminar (UUID)',
    example: '550e8400-e29b-41d4-a716-446655440001',
  })
  @ApiResponse({
    status: 200,
    description: 'Turno eliminado exitosamente',
  })
  @ApiNotFoundResponse({ description: 'Turno no encontrado' })
  @ApiUnauthorizedResponse({ description: 'Token no válido o expirado' })
  async remove(@Param('id') id: string) {
    return this.turnosService.remove(id);
  }
}
