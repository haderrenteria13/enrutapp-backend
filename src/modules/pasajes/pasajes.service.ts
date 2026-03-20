import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreatePasajeDto } from './dto/create-pasaje.dto';

@Injectable()
export class PasajesService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Crea un nuevo registro en el sistema.
   * @param createPasajeDto - createPasajeDto parameter
   * @returns El resultado de la operación.
   */
  async create(createPasajeDto: CreatePasajeDto) {
    try {
      const turno = await this.prisma.turnos.findUnique({
        where: { idTurno: createPasajeDto.idTurno },
      });

      if (!turno) {
        throw new HttpException('Turno no encontrado', HttpStatus.NOT_FOUND);
      }

      if (turno.cuposDisponibles <= 0) {
        throw new HttpException(
          'No hay cupos disponibles',
          HttpStatus.BAD_REQUEST,
        );
      }

      const result = await this.prisma.$transaction(async (tx) => {
        const pasaje = await tx.pasajes.create({
          data: {
            idTurno: createPasajeDto.idTurno,
            idUsuario: createPasajeDto.idUsuario,
            nombrePasajero: createPasajeDto.nombrePasajero,
            documentoPasajero: createPasajeDto.documentoPasajero,
            asiento: createPasajeDto.asiento,
            precio: createPasajeDto.precio,
            estado: createPasajeDto.estado || 'Reservado',
          },
        });

        await tx.turnos.update({
          where: { idTurno: createPasajeDto.idTurno },
          data: { cuposDisponibles: { decrement: 1 } },
        });

        return pasaje;
      });

      return {
        success: true,
        data: result,
        message: 'Pasaje creado exitosamente',
      };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new HttpException(
        {
          success: false,
          error: 'Error al crear pasaje',
          message: error instanceof Error ? error.message : 'Error desconocido',
        },
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
    return this.prisma.pasajes.findMany({
      where: { idTurno },
      include: {
        usuario: true,
        ordenCompra: true,
      },
    });
  }

  /**
   * Obtiene los pasajes del cliente autenticado.
   */
  async findMyPasajes(idUsuario: string) {
    try {
      const pasajes = await this.prisma.pasajes.findMany({
        where: { idUsuario },
        include: {
          ordenCompra: true,
          turno: {
            include: {
              ruta: {
                include: {
                  origen: { include: { ubicacion: true } },
                  destino: { include: { ubicacion: true } },
                },
              },
              vehiculo: {
                include: {
                  marcaVehiculo: true,
                  tipoVehiculo: true,
                },
              },
              conductor: {
                include: {
                  usuario: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      return {
        success: true,
        data: pasajes,
        message: 'Pasajes del cliente obtenidos exitosamente',
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          error: 'Error al obtener pasajes del cliente',
          message: error instanceof Error ? error.message : 'Error desconocido',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Obtiene los pasajes vendidos para vista administrativa.
   */
  async findVentas(params?: { idTurno?: string; estado?: string }) {
    try {
      const pasajes = await this.prisma.pasajes.findMany({
        where: {
          ...(params?.idTurno ? { idTurno: params.idTurno } : {}),
          ...(params?.estado ? { estado: params.estado } : {}),
        },
        include: {
          usuario: true,
          ordenCompra: true,
          turno: {
            include: {
              ruta: {
                include: {
                  origen: { include: { ubicacion: true } },
                  destino: { include: { ubicacion: true } },
                },
              },
              vehiculo: {
                include: {
                  marcaVehiculo: true,
                  tipoVehiculo: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      return {
        success: true,
        data: pasajes,
        message: 'Pasajes vendidos obtenidos exitosamente',
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          error: 'Error al obtener pasajes vendidos',
          message: error instanceof Error ? error.message : 'Error desconocido',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
