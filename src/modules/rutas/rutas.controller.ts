import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { RutasService } from './rutas.service';
import { CreateRutaDto } from './dto/create-ruta.dto';
import { UpdateRutaDto } from './dto/update-ruta.dto';

@ApiTags('Rutas')
@Controller('rutas')
export class RutasController {
  constructor(private readonly rutasService: RutasService) {}

  /**
   * Crea un nuevo registro en el sistema.
   * @param dto - dto parameter
   * @returns El resultado de la operación.
   */
  @Post()
  @ApiOperation({ summary: 'Crear una nueva ruta' })
  create(@Body() dto: CreateRutaDto) {
    return this.rutasService.create(dto);
  }

  /**
   * Obtiene una lista de todos los registros.
   * @returns El resultado de la operación.
   */
  @Get()
  @ApiOperation({ summary: 'Listar todas las rutas' })
  findAll() {
    return this.rutasService.findAll();
  }

  /**
   * Realiza la operación de create ubicacion.
   * @param body - body parameter
   * @returns El resultado de la operación.
   */
  @Post('ubicaciones')
  @ApiOperation({ summary: 'Crear ubicación' })
  createUbicacion(
    @Body()
    body: {
      nombreUbicacion: string;
      direccion: string;
      latitud: number;
      longitud: number;
    },
  ) {
    return this.rutasService.createUbicacion(body);
  }

  /**
   * Realiza la operación de find all ubicaciones.
   * @returns El resultado de la operación.
   */
  @Get('ubicaciones')
  @ApiOperation({ summary: 'Listar ubicaciones' })
  findAllUbicaciones() {
    return this.rutasService.findAllUbicaciones();
  }

  /**
   * Realiza la operación de create origen.
   * @param body - body parameter
   * @returns El resultado de la operación.
   */
  @Post('origen')
  @ApiOperation({ summary: 'Crear origen' })
  createOrigen(@Body() body: { idUbicacion: string; descripcion?: string }) {
    return this.rutasService.createOrigen(body);
  }

  /**
   * Realiza la operación de find all origenes.
   * @returns El resultado de la operación.
   */
  @Get('origen')
  @ApiOperation({ summary: 'Listar orígenes' })
  findAllOrigenes() {
    return this.rutasService.findAllOrigenes();
  }

  /**
   * Realiza la operación de find origen by ubicacion.
   * @param id - id parameter
   * @returns El resultado de la operación.
   */
  @Get('origen/por-ubicacion/:id')
  @ApiOperation({ summary: 'Buscar origen por ubicación' })
  findOrigenByUbicacion(@Param('id') id: string) {
    return this.rutasService.findOrigenByUbicacion(id);
  }

  /**
   * Realiza la operación de create destino.
   * @param body - body parameter
   * @returns El resultado de la operación.
   */
  @Post('destino')
  @ApiOperation({ summary: 'Crear destino' })
  createDestino(@Body() body: { idUbicacion: string; descripcion?: string }) {
    return this.rutasService.createDestino(body);
  }

  /**
   * Realiza la operación de find all destinos.
   * @returns El resultado de la operación.
   */
  @Get('destino')
  @ApiOperation({ summary: 'Listar destinos' })
  findAllDestinos() {
    return this.rutasService.findAllDestinos();
  }

  /**
   * Realiza la operación de find destino by ubicacion.
   * @param id - id parameter
   * @returns El resultado de la operación.
   */
  @Get('destino/por-ubicacion/:id')
  @ApiOperation({ summary: 'Buscar destino por ubicación' })
  findDestinoByUbicacion(@Param('id') id: string) {
    return this.rutasService.findDestinoByUbicacion(id);
  }

  /**
   * Obtiene un registro por su identificador único.
   * @param id - id parameter
   * @returns El resultado de la operación.
   */
  @Get(':id')
  @ApiOperation({ summary: 'Obtener ruta por ID' })
  findOne(@Param('id') id: string) {
    return this.rutasService.findOne(id);
  }

  /**
   * Actualiza un registro existente.
   * @param id - id parameter
   * @param dto - dto parameter
   * @returns El resultado de la operación.
   */
  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar una ruta existente' })
  update(@Param('id') id: string, @Body() dto: UpdateRutaDto) {
    return this.rutasService.update(id, dto);
  }

  /**
   * Elimina un registro del sistema.
   * @param id - id parameter
   * @returns El resultado de la operación.
   */
  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar una ruta' })
  remove(@Param('id') id: string) {
    return this.rutasService.remove(id);
  }
}
