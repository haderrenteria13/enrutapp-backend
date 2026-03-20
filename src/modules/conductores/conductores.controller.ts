import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Put,
  Delete,
  Request,
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
  ApiConflictResponse,
} from '@nestjs/swagger';
import { ConductoresService } from './conductores.service';
import {
  CreateConductorDto,
  UpdateConductorDto,
  CompletarPerfilConductorDto,
} from './dto/index';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

/**
 * Controlador de Conductores
 * Maneja las operaciones CRUD de conductores
 */
@ApiTags('Conductores')
@Controller('conductores')
export class ConductoresController {
  constructor(private readonly conductoresService: ConductoresService) {}

  /**
   * Obtiene una lista de todos los registros.
   * @returns El resultado de la operación.
   */
  @Get()
  @ApiOperation({
    summary: 'Listar todos los conductores',
    description:
      'Obtiene la lista completa de conductores registrados en el sistema con información del usuario asociado',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de conductores obtenida exitosamente',
  })
  async findAll() {
    return this.conductoresService.findAll();
  }

  /**
   * Obtiene un registro por su identificador único.
   * @param id - id parameter
   * @returns El resultado de la operación.
   */
  @ApiBearerAuth('JWT-auth')
  @Get(':id')
  @ApiOperation({
    summary: 'Obtener conductor por ID',
    description: 'Obtiene la información detallada de un conductor específico',
  })
  @ApiParam({
    name: 'id',
    description: 'ID del conductor (UUID)',
    example: '550e8400-e29b-41d4-a716-446655440001',
  })
  @ApiResponse({
    status: 200,
    description: 'Conductor encontrado',
  })
  @ApiNotFoundResponse({
    description: 'Conductor no encontrado',
  })
  @ApiUnauthorizedResponse({
    description: 'Token no válido o expirado',
  })
  async findOne(@Param('id') id: string) {
    return this.conductoresService.findOne(id);
  }

  /**
   * Realiza la operación de verificar licencia.
   * @param id - id parameter
   * @returns El resultado de la operación.
   */
  @ApiBearerAuth('JWT-auth')
  @Get(':id/verificar-licencia')
  @ApiOperation({
    summary: 'Verificar estado de licencia',
    description:
      'Verifica el estado de la licencia de conducción (vigente, próxima a vencer o vencida)',
  })
  @ApiParam({
    name: 'id',
    description: 'ID del conductor (UUID)',
    example: '550e8400-e29b-41d4-a716-446655440001',
  })
  @ApiResponse({
    status: 200,
    description: 'Estado de licencia verificado',
  })
  @ApiNotFoundResponse({
    description: 'Conductor no encontrado',
  })
  @ApiUnauthorizedResponse({
    description: 'Token no válido o expirado',
  })
  async verificarLicencia(@Param('id') id: string) {
    return this.conductoresService.verificarLicencia(id);
  }

  /**
   * Realiza la operación de verificar perfil completo.
   * @param req - req parameter
   * @returns El resultado de la operación.
   */
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard)
  @Get('verificar-perfil/me')
  @ApiOperation({
    summary: 'Verificar perfil de conductor del usuario autenticado',
    description:
      'Verifica si el usuario autenticado con rol Conductor tiene su perfil completo en el módulo de conductores',
  })
  @ApiResponse({
    status: 200,
    description: 'Estado del perfil verificado',
    schema: {
      example: {
        success: true,
        data: {
          esConductor: true,
          completado: false,
          conductor: null,
        },
        message: 'El conductor debe completar su perfil',
      },
    },
  })
  @ApiUnauthorizedResponse({
    description: 'Token no válido o expirado',
  })
  async verificarPerfilCompleto(
    @Request() req: { user: { idUsuario: string } },
  ) {
    // req.user contiene el usuario completo retornado por validateUser
    const idUsuario = req.user.idUsuario;
    return this.conductoresService.verificarPerfilCompleto(idUsuario);
  }

  /**
   * Realiza la operación de completar perfil.
   * @param req - req parameter
   * @param completarPerfilDto - completarPerfilDto parameter
   * @returns El resultado de la operación.
   */
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard)
  @Post('completar-perfil/me')
  @ApiOperation({
    summary: 'Completar perfil de conductor',
    description:
      'Permite que un usuario con rol Conductor complete su propio perfil con información de su licencia',
  })
  @ApiResponse({
    status: 201,
    description: 'Perfil de conductor completado exitosamente',
  })
  @ApiBadRequestResponse({
    description: 'Datos inválidos o usuario sin rol de conductor',
  })
  @ApiConflictResponse({
    description: 'El perfil ya está completo',
  })
  @ApiUnauthorizedResponse({
    description: 'Token no válido o expirado',
  })
  async completarPerfil(
    @Request() req: { user: { idUsuario: string } },
    @Body() completarPerfilDto: CompletarPerfilConductorDto,
  ) {
    // req.user contiene el usuario completo retornado por validateUser
    const idUsuario = req.user.idUsuario;
    return this.conductoresService.completarPerfil(
      idUsuario,
      completarPerfilDto,
    );
  }

  /**
   * Crea un nuevo registro en el sistema.
   * @param createConductorDto - createConductorDto parameter
   * @returns El resultado de la operación.
   */
  @ApiBearerAuth('JWT-auth')
  @Post()
  @ApiOperation({
    summary: 'Crear nuevo conductor',
    description:
      'Registra un nuevo conductor en el sistema asociado a un usuario con rol de conductor',
  })
  @ApiResponse({
    status: 201,
    description: 'Conductor creado exitosamente',
  })
  @ApiBadRequestResponse({ description: 'Datos inválidos' })
  @ApiUnauthorizedResponse({ description: 'Token no válido o expirado' })
  @ApiConflictResponse({
    description: 'El conductor o el número de licencia ya existe',
  })
  async create(@Body() createConductorDto: CreateConductorDto) {
    return this.conductoresService.create(createConductorDto);
  }

  /**
   * Actualiza un registro existente.
   * @param id - id parameter
   * @param updateConductorDto - updateConductorDto parameter
   * @returns El resultado de la operación.
   */
  @ApiBearerAuth('JWT-auth')
  @Put(':id')
  @ApiOperation({
    summary: 'Actualizar conductor',
    description: 'Actualiza la información de un conductor existente',
  })
  @ApiParam({
    name: 'id',
    description: 'ID del conductor a actualizar (UUID)',
    example: '550e8400-e29b-41d4-a716-446655440001',
  })
  @ApiResponse({
    status: 200,
    description: 'Conductor actualizado exitosamente',
  })
  @ApiNotFoundResponse({
    description: 'Conductor no encontrado',
  })
  @ApiBadRequestResponse({
    description: 'Datos inválidos',
  })
  @ApiConflictResponse({
    description: 'El número de licencia ya está en uso',
  })
  @ApiUnauthorizedResponse({
    description: 'Token no válido o expirado',
  })
  async update(
    @Param('id') id: string,
    @Body() updateConductorDto: UpdateConductorDto,
  ) {
    return this.conductoresService.update(id, updateConductorDto);
  }

  /**
   * Elimina un registro del sistema.
   * @param id - id parameter
   * @returns El resultado de la operación.
   */
  @ApiBearerAuth('JWT-auth')
  @Delete(':id')
  @ApiOperation({
    summary: 'Eliminar conductor',
    description: 'Elimina un conductor del sistema',
  })
  @ApiParam({
    name: 'id',
    description: 'ID del conductor a eliminar (UUID)',
    example: '550e8400-e29b-41d4-a716-446655440001',
  })
  @ApiResponse({
    status: 200,
    description: 'Conductor eliminado exitosamente',
  })
  @ApiNotFoundResponse({
    description: 'Conductor no encontrado',
  })
  @ApiUnauthorizedResponse({
    description: 'Token no válido o expirado',
  })
  async remove(@Param('id') id: string) {
    return this.conductoresService.remove(id);
  }
}
