import {
  BadRequestException,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
  Res,
  Body,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiConsumes,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import type { Response } from 'express';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';

import { ContratosService } from './contratos.service';
import { CreateContratoDto } from './dto';

@ApiTags('Contratos')
@ApiBearerAuth('JWT-auth')
@Controller('contratos')
export class ContratosController {
  constructor(private readonly contratosService: ContratosService) {}

  /**
   * Obtiene una lista de todos los registros.
   * @param idTurno - idTurno parameter
   * @param placa - placa parameter
   * @returns El resultado de la operación.
   */
  @Get()
  @ApiOperation({ summary: 'Listar contratos' })
  @ApiResponse({ status: 200, description: 'Lista de contratos' })
  async findAll(
    @Query('idTurno') idTurno?: string,
    @Query('placa') placa?: string,
  ) {
    return this.contratosService.findAll({ idTurno, placa });
  }

  /**
   * Obtiene un registro por su identificador único.
   * @param id - id parameter
   * @returns El resultado de la operación.
   */
  @Get(':id')
  @ApiOperation({ summary: 'Obtener contrato por ID' })
  @ApiParam({ name: 'id', description: 'ID del contrato (UUID)' })
  async findOne(@Param('id') id: string) {
    return this.contratosService.findOne(id);
  }

  /**
   * Crea un nuevo registro en el sistema.
   * @param file - file parameter
   * @param data - data parameter
   * @returns El resultado de la operación.
   */
  @Post()
  @UseInterceptors(FileInterceptor('pdf'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: 'Crear contrato (sube PDF + data)',
    description:
      'Recibe el PDF generado y un campo data (JSON) con la metadata del contrato.',
  })
  @ApiResponse({ status: 201, description: 'Contrato creado' })
  @ApiBadRequestResponse({ description: 'Datos inválidos o falta PDF' })
  async create(
    @UploadedFile() file: Express.Multer.File,
    @Body('data') data: string,
  ) {
    if (!data) {
      throw new BadRequestException('Campo data (JSON) es obligatorio');
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(data);
    } catch {
      throw new BadRequestException('Campo data debe ser JSON válido');
    }

    const dto = plainToInstance(CreateContratoDto, parsed);
    const errors = await validate(dto, {
      whitelist: true,
      forbidNonWhitelisted: true,
    });
    if (errors.length) {
      throw new BadRequestException(errors);
    }

    return this.contratosService.create(dto, file);
  }

  /**
   * Realiza la operación de download pdf.
   * @param id - id parameter
   * @param res - res parameter
   * @returns El resultado de la operación.
   */
  @Get(':id/pdf')
  @ApiOperation({ summary: 'Descargar PDF de un contrato' })
  @ApiParam({ name: 'id', description: 'ID del contrato (UUID)' })
  async downloadPdf(@Param('id') id: string, @Res() res: Response) {
    const { absolutePath, filename } =
      await this.contratosService.getPdfPath(id);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    return res.sendFile(absolutePath);
  }
}
