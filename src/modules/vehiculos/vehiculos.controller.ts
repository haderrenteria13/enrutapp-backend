import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Put,
  Delete,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
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
  ApiConsumes,
} from '@nestjs/swagger';
import { VehiculosService } from './vehiculos.service';
import { CreateVehiculoDto, UpdateVehiculoDto } from './dto';

/**
 * Controlador de Vehículos
 * Maneja las operaciones CRUD de vehículos
 */
@ApiTags('Vehículos')
@Controller('vehiculos')
export class VehiculosController {
  constructor(private readonly vehiculosService: VehiculosService) {}

  /**
   * Obtiene una lista de todos los registros.
   * @returns El resultado de la operación.
   */
  @Get()
  @ApiOperation({
    summary: 'Listar todos los vehículos',
    description:
      'Obtiene la lista completa de vehículos registrados en el sistema con sus tipos y marcas',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de vehículos obtenida exitosamente',
    schema: {
      example: {
        success: true,
        data: [
          {
            idVehiculo: '550e8400-e29b-41d4-a716-446655440001',
            placa: 'ABC123',
            linea: 'Corolla',
            modelo: 2023,
            color: 'Blanco',
            capacidadPasajeros: 5,
            capacidadCarga: 500.5,
            estado: true,
            tipoVehiculo: {
              idTipoVehiculo: '550e8400-e29b-41d4-a716-446655440010',
              nombreTipoVehiculo: 'Automóvil',
            },
            marcaVehiculo: {
              idMarcaVehiculo: '550e8400-e29b-41d4-a716-446655440020',
              nombreMarca: 'Toyota',
            },
          },
        ],
        message: 'Vehículos obtenidos exitosamente',
      },
    },
  })
  async findAll() {
    return this.vehiculosService.findAll();
  }

  /**
   * Obtiene un registro por su identificador único.
   * @param id - id parameter
   * @returns El resultado de la operación.
   */
  @ApiBearerAuth('JWT-auth')
  @Get(':id')
  @ApiOperation({
    summary: 'Obtener vehículo por ID',
    description: 'Obtiene la información detallada de un vehículo específico',
  })
  @ApiParam({
    name: 'id',
    description: 'ID del vehículo (UUID)',
    example: '550e8400-e29b-41d4-a716-446655440001',
  })
  @ApiResponse({
    status: 200,
    description: 'Vehículo encontrado',
  })
  @ApiNotFoundResponse({
    description: 'Vehículo no encontrado',
  })
  @ApiUnauthorizedResponse({
    description: 'Token no válido o expirado',
  })
  async findOne(@Param('id') id: string) {
    return this.vehiculosService.findOne(id);
  }

  /**
   * Crea un nuevo registro en el sistema.
   * @param createVehiculoDto - createVehiculoDto parameter
   * @param file - file parameter
   * @returns El resultado de la operación.
   */
  @ApiBearerAuth('JWT-auth')
  @Post()
  @UseInterceptors(FileInterceptor('foto'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: 'Crear nuevo vehículo',
    description: 'Registra un nuevo vehículo en el sistema',
  })
  @ApiResponse({
    status: 201,
    description: 'Vehículo creado exitosamente',
  })
  @ApiBadRequestResponse({ description: 'Datos inválidos' })
  @ApiUnauthorizedResponse({ description: 'Token no válido o expirado' })
  @ApiConflictResponse({
    description: 'La placa del vehículo ya existe',
  })
  async create(
    @Body() createVehiculoDto: CreateVehiculoDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.vehiculosService.create(createVehiculoDto, file);
  }

  /**
   * Actualiza un registro existente.
   * @param id - id parameter
   * @param updateVehiculoDto - updateVehiculoDto parameter
   * @returns El resultado de la operación.
   */
  @ApiBearerAuth('JWT-auth')
  @Put(':id')
  @ApiOperation({
    summary: 'Actualizar vehículo',
    description: 'Actualiza la información de un vehículo existente',
  })
  @ApiParam({
    name: 'id',
    description: 'ID del vehículo a actualizar (UUID)',
    example: '550e8400-e29b-41d4-a716-446655440001',
  })
  @ApiResponse({
    status: 200,
    description: 'Vehículo actualizado exitosamente',
  })
  @ApiNotFoundResponse({
    description: 'Vehículo no encontrado',
  })
  @ApiBadRequestResponse({
    description: 'Datos inválidos',
  })
  @ApiConflictResponse({
    description: 'La placa ya está en uso',
  })
  @ApiUnauthorizedResponse({
    description: 'Token no válido o expirado',
  })
  async update(
    @Param('id') id: string,
    @Body() updateVehiculoDto: UpdateVehiculoDto,
  ) {
    return this.vehiculosService.update(id, updateVehiculoDto);
  }

  /**
   * Elimina un registro del sistema.
   * @param id - id parameter
   * @returns El resultado de la operación.
   */
  @ApiBearerAuth('JWT-auth')
  @Delete(':id')
  @ApiOperation({
    summary: 'Eliminar vehículo',
    description: 'Elimina un vehículo del sistema',
  })
  @ApiParam({
    name: 'id',
    description: 'ID del vehículo a eliminar (UUID)',
    example: '550e8400-e29b-41d4-a716-446655440001',
  })
  @ApiResponse({
    status: 200,
    description: 'Vehículo eliminado exitosamente',
  })
  @ApiNotFoundResponse({
    description: 'Vehículo no encontrado',
  })
  @ApiUnauthorizedResponse({
    description: 'Token no válido o expirado',
  })
  async remove(@Param('id') id: string) {
    return this.vehiculosService.remove(id);
  }

  /**
   * Realiza la operación de upload foto.
   * @param id - id parameter
   * @param file - file parameter
   * @returns El resultado de la operación.
   */
  @ApiBearerAuth('JWT-auth')
  @Post(':id/foto')
  @UseInterceptors(FileInterceptor('foto'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: 'Subir o actualizar foto del vehículo',
    description:
      'Sube un archivo de imagen (jpg, png, webp) y actualiza el campo fotoUrl del vehículo',
  })
  @ApiParam({
    name: 'id',
    description: 'ID del vehículo (UUID)',
    example: '550e8400-e29b-41d4-a716-446655440001',
  })
  @ApiResponse({ status: 200, description: 'Foto actualizada correctamente' })
  @ApiBadRequestResponse({
    description: 'Archivo inválido o datos incorrectos',
  })
  @ApiNotFoundResponse({ description: 'Vehículo no encontrado' })
  async uploadFoto(
    @Param('id') id: string,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.vehiculosService.actualizarFoto(id, file);
  }
}
