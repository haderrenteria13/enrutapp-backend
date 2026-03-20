import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  Patch,
  Delete,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { EncomiendasService } from './encomiendas.service';
import { CreateEncomiendaDto } from './dto/create-encomienda.dto';
import { UpdateEncomiendaDto } from './dto/update-encomienda.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiConsumes, ApiBody } from '@nestjs/swagger';

@ApiTags('Encomiendas')
@Controller('encomiendas')
export class EncomiendasController {
  constructor(private readonly encomiendasService: EncomiendasService) {}

  /**
   * Crea un nuevo registro en el sistema.
   * @param createEncomiendaDto - createEncomiendaDto parameter
   * @returns El resultado de la operación.
   */
  @Post()
  @ApiOperation({ summary: 'Registrar una encomienda' })
  async create(@Body() createEncomiendaDto: CreateEncomiendaDto) {
    return this.encomiendasService.create(createEncomiendaDto);
  }

  /**
   * Obtiene todas las encomiendas.
   */
  @Get()
  @ApiOperation({ summary: 'Obtener todas las encomiendas' })
  async findAll() {
    return this.encomiendasService.findAll();
  }

  /**
   * Obtiene una encomienda por su ID.
   */
  @Get(':id')
  @ApiOperation({ summary: 'Obtener una encomienda por ID' })
  async findOne(@Param('id') id: string) {
    return this.encomiendasService.findOne(id);
  }

  /**
   * Realiza la operación de find by viaje.
   * @param id - id parameter
   * @returns El resultado de la operación.
   */
  @Get('turno/:id')
  @ApiOperation({ summary: 'Listar encomiendas de un turno (viaje)' })
  async findByViaje(@Param('id') id: string) {
    return this.encomiendasService.findAllByTurno(id);
  }

  /**
   * Realiza la operación de update estado.
   * @param id - id parameter
   * @param estado - estado parameter
   * @returns El resultado de la operación.
   */
  @Patch(':id/estado')
  @ApiOperation({ summary: 'Actualizar estado de encomienda' })
  async updateEstado(@Param('id') id: string, @Body('estado') estado: string) {
    return this.encomiendasService.updateEstado(id, estado);
  }

  /**
   * Actualiza una encomienda.
   */
  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar encomienda' })
  async update(
    @Param('id') id: string,
    @Body() updateEncomiendaDto: UpdateEncomiendaDto,
  ) {
    return this.encomiendasService.update(id, updateEncomiendaDto);
  }

  /**
   * Actualiza estado de verificación de una encomienda.
   */
  @Patch(':id/verificado')
  @ApiOperation({ summary: 'Actualizar verificación de encomienda' })
  async updateVerificado(
    @Param('id') id: string,
    @Body('verificado') verificado: boolean,
  ) {
    return this.encomiendasService.updateVerificado(id, Boolean(verificado));
  }

  /**
   * Sube o actualiza la foto de una encomienda.
   */
  @Post(':id/foto')
  @UseInterceptors(FileInterceptor('foto'))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        foto: {
          type: 'string',
          format: 'binary',
        },
      },
      required: ['foto'],
    },
  })
  @ApiOperation({ summary: 'Subir foto de encomienda' })
  async uploadFoto(
    @Param('id') id: string,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.encomiendasService.actualizarFoto(id, file);
  }

  /**
   * Elimina una encomienda.
   */
  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar una encomienda' })
  async remove(@Param('id') id: string) {
    return this.encomiendasService.remove(id);
  }
}
