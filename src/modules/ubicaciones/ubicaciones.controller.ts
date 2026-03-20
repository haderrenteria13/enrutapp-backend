import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Put,
  Delete,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { UbicacionesService } from './ubicaciones.service';
import { CreateUbicacionDto } from './dto/create-ubicacion.dto';
import { UpdateUbicacionDto } from './dto/update-ubicacion.dto';

import { Public } from '../../common/decorators';

import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('ubicaciones')
@ApiBearerAuth()
@Controller('ubicaciones')
export class UbicacionesController {
  constructor(private readonly ubicacionesService: UbicacionesService) {}

  /**
   * Crea un nuevo registro en el sistema.
   * @param createUbicacionDto - createUbicacionDto parameter
   * @returns El resultado de la operación.
   */
  @Post()
  @UsePipes(new ValidationPipe())
  @ApiOperation({ summary: 'Crear registro' })
  create(@Body() createUbicacionDto: CreateUbicacionDto) {
    return this.ubicacionesService.create(createUbicacionDto);
  }

  /**
   * Obtiene una lista de todos los registros.
   * @returns El resultado de la operación.
   */
  @Get()
  @Public()
  @ApiOperation({ summary: 'Listar registros' })
  findAll() {
    return this.ubicacionesService.findAll();
  }

  /**
   * Obtiene un registro por su identificador único.
   * @param id - id parameter
   * @returns El resultado de la operación.
   */
  @Get(':id')
  @Public()
  @ApiOperation({ summary: 'Obtener por ID' })
  findOne(@Param('id') id: string) {
    return this.ubicacionesService.findOne(id);
  }

  /**
   * Actualiza un registro existente.
   * @param id - id parameter
   * @param updateUbicacionDto - updateUbicacionDto parameter
   * @returns El resultado de la operación.
   */
  @Put(':id')
  @UsePipes(new ValidationPipe())
  @ApiOperation({ summary: 'Actualizar registro' })
  update(
    @Param('id') id: string,
    @Body() updateUbicacionDto: UpdateUbicacionDto,
  ) {
    return this.ubicacionesService.update(id, updateUbicacionDto);
  }

  /**
   * Realiza la operación de check rutas activas.
   * @param id - id parameter
   * @returns El resultado de la operación.
   */
  @Get(':id/rutas-activas')
  @ApiOperation({ summary: 'Check rutas activas' })
  checkRutasActivas(@Param('id') id: string) {
    return this.ubicacionesService.checkRutasActivas(id);
  }

  /**
   * Realiza la operación de force delete.
   * @param id - id parameter
   * @returns El resultado de la operación.
   */
  @Delete(':id/force')
  @ApiOperation({ summary: 'Force delete' })
  forceDelete(@Param('id') id: string) {
    return this.ubicacionesService.forceDelete(id);
  }

  /**
   * Realiza la operación de remove batch.
   * @param _body - _body parameter
   * @returns El resultado de la operación.
   */
  @Post('batch-delete')
  @ApiOperation({ summary: 'Remove batch' })
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  removeBatch(@Body() _body: { ids: string[] }) {
    // Implement batch delete logic in service or verify if frontend iterates.
    // Frontend `handleDeleteMultipleConfirm` maps and calls remove one by one (Wait, line 387 in UbicacionesPage.jsx).
    // But `removeBatch` is defined in service line 40 as `apiClient.post('/ubicaciones/batch-delete', { ids })`.
    // UbicacionesPage.jsx DOES NOT USE removeBatch! It iterates:
    // const deletePromises = selectedUbicaciones.map(async ubicacionId => ... ubicacionesService.remove(ubicacionId) ...)
    // So `batch-delete` endpoint is NOT used by the current Page logic, but the Service has it.
    // I will implement it just in case, or leave it.
    // Actually, user said "al seleccionar masivamente... no se eliminan".
    // If UbicacionesPage iterates, it calls `remove` multiple times.
    // If `remove` fails because of dependencies, it returns error.
    // The frontend alerts: "FailedCount passed".

    // I don't STRICTLY need batch-delete if the frontend iterates.
    // But I DO need checkRutasActivas and forceDelete.
    return {
      message: 'Batch delete not implemented, checking iterative delete',
    };
  }

  /**
   * Elimina un registro del sistema.
   * @param id - id parameter
   * @returns El resultado de la operación.
   */
  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar registro' })
  remove(@Param('id') id: string) {
    console.log(`[DEBUG] Attempting to delete Ubicacion with ID: ${id}`);
    return this.ubicacionesService.remove(id);
  }
}
