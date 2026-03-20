import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Put,
  Delete,
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
import { TiposVehiculoService } from './tipos-vehiculo.service';
import { Public } from '../../common/decorators';
import { CreateTipoVehiculoDto, UpdateTipoVehiculoDto } from './dto';

/**
 * Controlador de Tipos de Vehículo
 * Maneja las operaciones CRUD de tipos de vehículos
 */
@ApiTags('Tipos de Vehículo')
@ApiBearerAuth('JWT-auth')
@Controller('tipos-vehiculo')
export class TiposVehiculoController {
  constructor(private readonly tiposVehiculoService: TiposVehiculoService) {}

  /**
   * Obtiene una lista de todos los registros.
   * @returns El resultado de la operación.
   */
  @Public()
  @Get()
  @ApiOperation({
    summary: 'Listar todos los tipos de vehículo',
    description:
      'Obtiene la lista completa de tipos de vehículos disponibles en el sistema',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de tipos de vehículo obtenida exitosamente',
    schema: {
      example: {
        success: true,
        data: [
          {
            idTipoVehiculo: '550e8400-e29b-41d4-a716-446655440001',
            nombreTipoVehiculo: 'Automóvil',
            descripcion:
              'Vehículo de pasajeros con capacidad de hasta 5 personas',
            estado: true,
            createdAt: '2025-10-20T10:00:00.000Z',
            updatedAt: '2025-10-20T10:00:00.000Z',
          },
        ],
        message: 'Tipos de vehículo obtenidos exitosamente',
      },
    },
  })
  async findAll() {
    return this.tiposVehiculoService.findAll();
  }

  /**
   * Obtiene un registro por su identificador único.
   * @param id - id parameter
   * @returns El resultado de la operación.
   */
  @Get(':id')
  @ApiOperation({
    summary: 'Obtener tipo de vehículo por ID',
    description:
      'Obtiene la información detallada de un tipo de vehículo específico',
  })
  @ApiParam({
    name: 'id',
    description: 'ID del tipo de vehículo (UUID)',
    example: '550e8400-e29b-41d4-a716-446655440001',
  })
  @ApiResponse({
    status: 200,
    description: 'Tipo de vehículo encontrado',
  })
  @ApiNotFoundResponse({
    description: 'Tipo de vehículo no encontrado',
  })
  @ApiUnauthorizedResponse({
    description: 'Token no válido o expirado',
  })
  async findOne(@Param('id') id: string) {
    return this.tiposVehiculoService.findOne(id);
  }

  /**
   * Crea un nuevo registro en el sistema.
   * @param createTipoVehiculoDto - createTipoVehiculoDto parameter
   * @returns El resultado de la operación.
   */
  @Post()
  @ApiOperation({
    summary: 'Crear nuevo tipo de vehículo',
    description: 'Registra un nuevo tipo de vehículo en el sistema',
  })
  @ApiResponse({
    status: 201,
    description: 'Tipo de vehículo creado exitosamente',
    schema: {
      example: {
        success: true,
        data: {
          idTipoVehiculo: '550e8400-e29b-41d4-a716-446655440001',
          nombreTipoVehiculo: 'Automóvil',
          descripcion: 'Vehículo de pasajeros',
          estado: true,
        },
        message: 'Tipo de vehículo creado exitosamente',
      },
    },
  })
  @ApiBadRequestResponse({
    description: 'Datos inválidos',
  })
  @ApiConflictResponse({
    description: 'El tipo de vehículo ya existe',
  })
  @ApiUnauthorizedResponse({
    description: 'Token no válido o expirado',
  })
  async create(@Body() createTipoVehiculoDto: CreateTipoVehiculoDto) {
    return this.tiposVehiculoService.create(createTipoVehiculoDto);
  }

  /**
   * Actualiza un registro existente.
   * @param id - id parameter
   * @param updateTipoVehiculoDto - updateTipoVehiculoDto parameter
   * @returns El resultado de la operación.
   */
  @Put(':id')
  @ApiOperation({
    summary: 'Actualizar tipo de vehículo',
    description: 'Actualiza la información de un tipo de vehículo existente',
  })
  @ApiParam({
    name: 'id',
    description: 'ID del tipo de vehículo a actualizar (UUID)',
    example: '550e8400-e29b-41d4-a716-446655440001',
  })
  @ApiResponse({
    status: 200,
    description: 'Tipo de vehículo actualizado exitosamente',
  })
  @ApiNotFoundResponse({
    description: 'Tipo de vehículo no encontrado',
  })
  @ApiBadRequestResponse({
    description: 'Datos inválidos',
  })
  @ApiUnauthorizedResponse({
    description: 'Token no válido o expirado',
  })
  async update(
    @Param('id') id: string,
    @Body() updateTipoVehiculoDto: UpdateTipoVehiculoDto,
  ) {
    return this.tiposVehiculoService.update(id, updateTipoVehiculoDto);
  }

  /**
   * Elimina un registro del sistema.
   * @param id - id parameter
   * @returns El resultado de la operación.
   */
  @Delete(':id')
  @ApiOperation({
    summary: 'Eliminar tipo de vehículo',
    description:
      'Elimina un tipo de vehículo del sistema. No permite eliminar si tiene vehículos asociados.',
  })
  @ApiParam({
    name: 'id',
    description: 'ID del tipo de vehículo a eliminar (UUID)',
    example: '550e8400-e29b-41d4-a716-446655440001',
  })
  @ApiResponse({
    status: 200,
    description: 'Tipo de vehículo eliminado exitosamente',
  })
  @ApiNotFoundResponse({
    description: 'Tipo de vehículo no encontrado',
  })
  @ApiConflictResponse({
    description: 'No se puede eliminar un tipo con vehículos asociados',
  })
  @ApiUnauthorizedResponse({
    description: 'Token no válido o expirado',
  })
  async remove(@Param('id') id: string) {
    return this.tiposVehiculoService.remove(id);
  }
}
