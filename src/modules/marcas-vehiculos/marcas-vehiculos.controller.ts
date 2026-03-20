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
import { MarcasVehiculosService } from './marcas-vehiculos.service';
import { Public } from '../../common/decorators';
import { CreateMarcaVehiculoDto, UpdateMarcaVehiculoDto } from './dto';

/**
 * Controlador de Marcas de Vehículos
 * Maneja las operaciones CRUD de marcas de vehículos
 */
@ApiTags('Marcas de Vehículos')
@ApiBearerAuth('JWT-auth')
@Controller('marcas-vehiculos')
export class MarcasVehiculosController {
  constructor(
    private readonly marcasVehiculosService: MarcasVehiculosService,
  ) {}

  /**
   * Obtiene una lista de todos los registros.
   * @returns El resultado de la operación.
   */
  @Public()
  @Get()
  @ApiOperation({
    summary: 'Listar todas las marcas de vehículos',
    description:
      'Obtiene la lista completa de marcas de vehículos disponibles en el sistema',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de marcas de vehículos obtenida exitosamente',
    schema: {
      example: {
        success: true,
        data: [
          {
            idMarcaVehiculo: '550e8400-e29b-41d4-a716-446655440001',
            nombreMarca: 'Toyota',
            pais: 'Japón',
            estado: true,
            createdAt: '2025-10-20T10:00:00.000Z',
            updatedAt: '2025-10-20T10:00:00.000Z',
          },
        ],
        message: 'Marcas de vehículos obtenidas exitosamente',
      },
    },
  })
  async findAll() {
    return this.marcasVehiculosService.findAll();
  }

  /**
   * Obtiene un registro por su identificador único.
   * @param id - id parameter
   * @returns El resultado de la operación.
   */
  @Get(':id')
  @ApiOperation({
    summary: 'Obtener marca de vehículo por ID',
    description:
      'Obtiene la información detallada de una marca de vehículo específica',
  })
  @ApiParam({
    name: 'id',
    description: 'ID de la marca de vehículo (UUID)',
    example: '550e8400-e29b-41d4-a716-446655440001',
  })
  @ApiResponse({
    status: 200,
    description: 'Marca de vehículo encontrada',
  })
  @ApiNotFoundResponse({
    description: 'Marca de vehículo no encontrada',
  })
  @ApiUnauthorizedResponse({
    description: 'Token no válido o expirado',
  })
  async findOne(@Param('id') id: string) {
    return this.marcasVehiculosService.findOne(id);
  }

  /**
   * Crea un nuevo registro en el sistema.
   * @param createMarcaVehiculoDto - createMarcaVehiculoDto parameter
   * @returns El resultado de la operación.
   */
  @Post()
  @ApiOperation({
    summary: 'Crear nueva marca de vehículo',
    description: 'Registra una nueva marca de vehículo en el sistema',
  })
  @ApiResponse({
    status: 201,
    description: 'Marca de vehículo creada exitosamente',
    schema: {
      example: {
        success: true,
        data: {
          idMarcaVehiculo: '550e8400-e29b-41d4-a716-446655440001',
          nombreMarca: 'Toyota',
          pais: 'Japón',
          estado: true,
        },
        message: 'Marca de vehículo creada exitosamente',
      },
    },
  })
  @ApiBadRequestResponse({
    description: 'Datos inválidos',
  })
  @ApiConflictResponse({
    description: 'La marca de vehículo ya existe',
  })
  @ApiUnauthorizedResponse({
    description: 'Token no válido o expirado',
  })
  async create(
    @Body()
    createMarcaVehiculoDto: CreateMarcaVehiculoDto | CreateMarcaVehiculoDto[],
  ) {
    if (Array.isArray(createMarcaVehiculoDto)) {
      return this.marcasVehiculosService.createMany(createMarcaVehiculoDto);
    }
    return this.marcasVehiculosService.create(createMarcaVehiculoDto);
  }

  /**
   * Actualiza un registro existente.
   * @param id - id parameter
   * @param updateMarcaVehiculoDto - updateMarcaVehiculoDto parameter
   * @returns El resultado de la operación.
   */
  @Put(':id')
  @ApiOperation({
    summary: 'Actualizar marca de vehículo',
    description: 'Actualiza la información de una marca de vehículo existente',
  })
  @ApiParam({
    name: 'id',
    description: 'ID de la marca de vehículo a actualizar (UUID)',
    example: '550e8400-e29b-41d4-a716-446655440001',
  })
  @ApiResponse({
    status: 200,
    description: 'Marca de vehículo actualizada exitosamente',
  })
  @ApiNotFoundResponse({
    description: 'Marca de vehículo no encontrada',
  })
  @ApiBadRequestResponse({
    description: 'Datos inválidos',
  })
  @ApiUnauthorizedResponse({
    description: 'Token no válido o expirado',
  })
  async update(
    @Param('id') id: string,
    @Body() updateMarcaVehiculoDto: UpdateMarcaVehiculoDto,
  ) {
    return this.marcasVehiculosService.update(id, updateMarcaVehiculoDto);
  }

  /**
   * Elimina un registro del sistema.
   * @param id - id parameter
   * @returns El resultado de la operación.
   */
  @Delete(':id')
  @ApiOperation({
    summary: 'Eliminar marca de vehículo',
    description:
      'Elimina una marca de vehículo del sistema. No permite eliminar si tiene vehículos asociados.',
  })
  @ApiParam({
    name: 'id',
    description: 'ID de la marca de vehículo a eliminar (UUID)',
    example: '550e8400-e29b-41d4-a716-446655440001',
  })
  @ApiResponse({
    status: 200,
    description: 'Marca de vehículo eliminada exitosamente',
  })
  @ApiNotFoundResponse({
    description: 'Marca de vehículo no encontrada',
  })
  @ApiConflictResponse({
    description: 'No se puede eliminar una marca con vehículos asociados',
  })
  @ApiUnauthorizedResponse({
    description: 'Token no válido o expirado',
  })
  async remove(@Param('id') id: string) {
    return this.marcasVehiculosService.remove(id);
  }
}
