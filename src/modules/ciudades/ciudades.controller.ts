import { Controller, Get, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { CiudadesService } from './ciudades.service';
import { CreateCiudadDto } from './dto/create-ciudad.dto';
import { Public } from '../../common/decorators';

/**
 * Controlador de Ciudades
 * Maneja las operaciones relacionadas con ciudades
 */
@ApiTags('Ciudades')
@Controller('ciudades')
export class CiudadesController {
  constructor(private readonly ciudadesService: CiudadesService) {}

  /**
   * Crea un nuevo registro en el sistema.
   * @param createCiudadDto - createCiudadDto parameter
   * @returns El resultado de la operación.
   */
  @Public()
  @Post()
  @ApiOperation({
    summary: 'Crear ciudad',
    description: 'Crea una nueva ciudad en el catálogo',
  })
  @ApiResponse({
    status: 201,
    description: 'Ciudad creada exitosamente',
  })
  async create(@Body() createCiudadDto: CreateCiudadDto) {
    return this.ciudadesService.create(createCiudadDto);
  }

  /**
   * Obtiene una lista de todos los registros.
   * @returns El resultado de la operación.
   */
  @Public()
  @Get()
  @ApiOperation({
    summary: 'Listar ciudades',
    description:
      'Obtiene el catálogo completo de ciudades disponibles en el sistema',
  })
  @ApiResponse({
    status: 200,
    description: 'Catálogo de ciudades',
    schema: {
      example: {
        success: true,
        data: [
          {
            idCiudad: 1,
            nombreCiudad: 'Bogotá',
            departamento: 'Cundinamarca',
          },
          {
            idCiudad: 2,
            nombreCiudad: 'Medellín',
            departamento: 'Antioquia',
          },
        ],
      },
    },
  })
  async findAll() {
    return this.ciudadesService.findAll();
  }
}
