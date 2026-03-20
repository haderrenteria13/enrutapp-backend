import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { existsSync } from 'fs';
import { join } from 'path';
import type { Prisma } from '@prisma/client';

import { PrismaService } from '../../database/prisma.service';
import { CreateContratoDto } from './dto';

@Injectable()
export class ContratosService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Obtiene una lista de todos los registros.
   * @param params - params parameter
   * @returns El resultado de la operación.
   */
  async findAll(params?: { idTurno?: string; placa?: string }) {
    try {
      const contratos = await this.prisma.contratos.findMany({
        where: {
          ...(params?.idTurno ? { idTurno: params.idTurno } : {}),
          ...(params?.placa
            ? { placa: { contains: params.placa, mode: 'insensitive' } }
            : {}),
        },
        orderBy: { fechaContrato: 'desc' },
      });

      return {
        success: true,
        data: contratos,
        message: 'Contratos obtenidos exitosamente',
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Error desconocido';
      throw new HttpException(
        {
          success: false,
          error: 'Error al obtener contratos',
          message: errorMessage,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Obtiene un registro por su identificador único.
   * @param idContrato - idContrato parameter
   * @returns El resultado de la operación.
   */
  async findOne(idContrato: string) {
    try {
      const contrato = await this.prisma.contratos.findUnique({
        where: { idContrato },
        include: {
          turno: {
            include: {
              vehiculo: {
                include: { tipoVehiculo: true, marcaVehiculo: true },
              },
              ruta: {
                include: {
                  origen: { include: { ubicacion: true } },
                  destino: { include: { ubicacion: true } },
                },
              },
              pasajes: true,
            },
          },
        },
      });

      if (!contrato) {
        throw new HttpException(
          { success: false, error: 'Contrato no encontrado' },
          HttpStatus.NOT_FOUND,
        );
      }

      return {
        success: true,
        data: contrato,
        message: 'Contrato obtenido exitosamente',
      };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      const errorMessage =
        error instanceof Error ? error.message : 'Error desconocido';
      throw new HttpException(
        {
          success: false,
          error: 'Error al obtener contrato',
          message: errorMessage,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Crea un nuevo registro en el sistema.
   * @param dto - dto parameter
   * @param file - file parameter
   * @returns El resultado de la operación.
   */
  async create(dto: CreateContratoDto, file?: Express.Multer.File) {
    try {
      if (!file) {
        throw new HttpException(
          { success: false, error: 'El PDF del contrato es obligatorio' },
          HttpStatus.BAD_REQUEST,
        );
      }

      // Verificar que el turno exista
      const turno = await this.prisma.turnos.findUnique({
        where: { idTurno: dto.idTurno },
        include: { vehiculo: true, ruta: true },
      });
      if (!turno) {
        throw new HttpException(
          { success: false, error: 'Turno no encontrado' },
          HttpStatus.BAD_REQUEST,
        );
      }

      const relativePath = `/uploads/contratos/${file.filename}`;

      const creado = await this.prisma.contratos.create({
        data: {
          idTurno: dto.idTurno,
          titularNombre: dto.titularNombre,
          titularDocumento: dto.titularDocumento || null,
          placa: dto.placa.toUpperCase(),
          tipoVehiculo: dto.tipoVehiculo || null,
          capacidadPasajeros:
            typeof dto.capacidadPasajeros === 'number'
              ? dto.capacidadPasajeros
              : null,
          origen: dto.origen,
          destino: dto.destino,
          fechaOrigen: new Date(dto.fechaOrigen),
          fechaDestino: new Date(dto.fechaDestino),
          pasajeros:
            (dto.pasajeros as unknown as Prisma.InputJsonValue) ?? undefined,
          pdfUrl: relativePath,
        },
      });

      return {
        success: true,
        data: creado,
        message: 'Contrato creado exitosamente',
      };
    } catch (error) {
      // Unique constraint (ya existe contrato por turno)
      const msg = error instanceof Error ? error.message : '';
      if (msg.includes('Unique constraint') || msg.includes('unique')) {
        throw new HttpException(
          {
            success: false,
            error: 'Ya existe un contrato para este turno',
          },
          HttpStatus.CONFLICT,
        );
      }

      if (error instanceof HttpException) throw error;
      const errorMessage =
        error instanceof Error ? error.message : 'Error desconocido';
      throw new HttpException(
        {
          success: false,
          error: 'Error al crear contrato',
          message: errorMessage,
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  /**
   * Realiza la operación de get pdf path.
   * @param idContrato - idContrato parameter
   * @returns El resultado de la operación.
   */
  async getPdfPath(
    idContrato: string,
  ): Promise<{ absolutePath: string; filename: string }> {
    const contrato = await this.prisma.contratos.findUnique({
      where: { idContrato },
    });

    if (!contrato) {
      throw new HttpException(
        { success: false, error: 'Contrato no encontrado' },
        HttpStatus.NOT_FOUND,
      );
    }

    const relative = (contrato.pdfUrl || '').replace(/^\//, '');
    const absolutePath = join(process.cwd(), relative);

    if (!existsSync(absolutePath)) {
      throw new HttpException(
        { success: false, error: 'Archivo PDF no encontrado' },
        HttpStatus.NOT_FOUND,
      );
    }

    return { absolutePath, filename: `contrato-${idContrato}.pdf` };
  }
}
