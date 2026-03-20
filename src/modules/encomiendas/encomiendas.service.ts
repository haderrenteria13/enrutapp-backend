import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateEncomiendaDto } from './dto/create-encomienda.dto';
import { UpdateEncomiendaDto } from './dto/update-encomienda.dto';
import { existsSync, unlinkSync } from 'fs';
import { join } from 'path';

@Injectable()
export class EncomiendasService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Crea un nuevo registro en el sistema.
   * @param createEncomiendaDto - createEncomiendaDto parameter
   * @returns El resultado de la operación.
   */
  async create(createEncomiendaDto: CreateEncomiendaDto) {
    try {
      const turno = await this.prisma.turnos.findUnique({
        where: { idTurno: createEncomiendaDto.idTurno },
      });

      if (!turno) {
        throw new HttpException('Turno no encontrado', HttpStatus.NOT_FOUND);
      }

      const uniqueSuffix = Date.now().toString().slice(-6);
      const random = Math.floor(Math.random() * 1000)
        .toString()
        .padStart(3, '0');
      const guia = `ENC-${uniqueSuffix}${random}`;

      const encomienda = await this.prisma.encomiendas.create({
        data: {
          ...createEncomiendaDto,
          guia,
          estado: createEncomiendaDto.estado || 'Pendiente',
        },
      });

      return encomienda;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Error al crear encomienda',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Realiza la operación de find all by turno.
   * @param idTurno - idTurno parameter
   * @returns El resultado de la operación.
   */
  async findAllByTurno(idTurno: string) {
    return this.prisma.encomiendas.findMany({
      where: { idTurno },
    });
  }

  /**
   * Realiza la operación de update estado.
   * @param id - id parameter
   * @param estado - estado parameter
   * @returns El resultado de la operación.
   */
  async updateEstado(id: string, estado: string) {
    return this.prisma.encomiendas.update({
      where: { idEncomienda: id },
      data: { estado },
    });
  }

  /**
   * Actualiza una encomienda.
   */
  async update(id: string, updateEncomiendaDto: UpdateEncomiendaDto) {
    const encomienda = await this.prisma.encomiendas.findUnique({
      where: { idEncomienda: id },
    });

    if (!encomienda) {
      throw new HttpException('Encomienda no encontrada', HttpStatus.NOT_FOUND);
    }

    if (updateEncomiendaDto.idTurno) {
      const turno = await this.prisma.turnos.findUnique({
        where: { idTurno: updateEncomiendaDto.idTurno },
      });

      if (!turno) {
        throw new HttpException('Turno no encontrado', HttpStatus.NOT_FOUND);
      }
    }

    return this.prisma.encomiendas.update({
      where: { idEncomienda: id },
      data: updateEncomiendaDto,
      include: {
        turno: {
          include: {
            ruta: {
              include: {
                origen: { include: { ubicacion: true } },
                destino: { include: { ubicacion: true } },
              },
            },
            conductor: {
              include: { usuario: true },
            },
            vehiculo: true,
          },
        },
      },
    });
  }

  /**
   * Actualiza estado de verificación de una encomienda.
   */
  async updateVerificado(id: string, verificado: boolean) {
    return this.prisma.encomiendas.update({
      where: { idEncomienda: id },
      data: { verificado },
      include: {
        turno: {
          include: {
            ruta: {
              include: {
                origen: { include: { ubicacion: true } },
                destino: { include: { ubicacion: true } },
              },
            },
            conductor: {
              include: { usuario: true },
            },
            vehiculo: true,
          },
        },
      },
    });
  }

  /**
   * Sube o actualiza la foto de una encomienda.
   */
  async actualizarFoto(id: string, file?: Express.Multer.File) {
    const encomienda = await this.prisma.encomiendas.findUnique({
      where: { idEncomienda: id },
    });

    if (!encomienda) {
      throw new HttpException('Encomienda no encontrada', HttpStatus.NOT_FOUND);
    }

    if (!file) {
      throw new HttpException(
        'No se recibió archivo de imagen',
        HttpStatus.BAD_REQUEST,
      );
    }

    const relativePath = `/uploads/encomiendas/${file.filename}`;

    if (encomienda.fotoUrl) {
      const prev = encomienda.fotoUrl.replace('/uploads/', '');
      const prevPath = join(process.cwd(), 'uploads', prev);
      try {
        if (existsSync(prevPath)) unlinkSync(prevPath);
      } catch {
        // No bloquear el flujo si falla al borrar archivo anterior.
      }
    }

    return this.prisma.encomiendas.update({
      where: { idEncomienda: id },
      data: { fotoUrl: relativePath },
      include: {
        turno: {
          include: {
            ruta: {
              include: {
                origen: { include: { ubicacion: true } },
                destino: { include: { ubicacion: true } },
              },
            },
            conductor: {
              include: { usuario: true },
            },
            vehiculo: true,
          },
        },
      },
    });
  }

  /**
   * Obtiene todas las encomiendas
   */
  async findAll() {
    return this.prisma.encomiendas.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        turno: {
          include: {
            ruta: {
              include: {
                origen: { include: { ubicacion: true } },
                destino: { include: { ubicacion: true } },
              },
            },
            conductor: {
              include: { usuario: true },
            },
            vehiculo: true,
          },
        },
      },
    });
  }

  /**
   * Obtiene una encomienda por su ID
   */
  async findOne(id: string) {
    const encomienda = await this.prisma.encomiendas.findUnique({
      where: { idEncomienda: id },
      include: {
        turno: {
          include: {
            ruta: {
              include: {
                origen: { include: { ubicacion: true } },
                destino: { include: { ubicacion: true } },
              },
            },
            conductor: {
              include: { usuario: true },
            },
            vehiculo: true,
          },
        },
      },
    });

    if (!encomienda) {
      throw new HttpException('Encomienda no encontrada', HttpStatus.NOT_FOUND);
    }
    return encomienda;
  }

  /**
   * Elimina una encomienda
   */
  async remove(id: string) {
    try {
      return await this.prisma.encomiendas.delete({
        where: { idEncomienda: id },
      });
    } catch {
      throw new HttpException(
        'Error al eliminar encomienda',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
