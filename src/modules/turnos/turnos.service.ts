import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { v4 as uuidv4 } from 'uuid';
import { CreateTurnoDto, UpdateTurnoDto } from './dto/index';

/**
 * Interfaz para errores de Prisma
 */
interface PrismaError extends Error {
  code?: string;
  meta?: {
    target?: string[];
  };
}

type TurnoBusquedaParams = {
  origen?: string;
  destino?: string;
  origenId?: string;
  destinoId?: string;
  fecha?: string;
};

/**
 * Servicio de Turnos
 * Contiene toda la lógica de negocio relacionada con turnos
 */
@Injectable()
export class TurnosService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Realiza la operación de parse fecha rango.
   * @param fecha - fecha parameter
   * @returns El resultado de la operación.
   */
  private parseFechaRango(fecha?: string): { start?: Date; end?: Date } {
    if (!fecha) return {};
    const start = new Date(`${fecha}T00:00:00.000`);
    if (Number.isNaN(start.getTime())) return {};
    const end = new Date(start);
    end.setDate(end.getDate() + 1);
    return { start, end };
  }

  /**
   * Realiza la operación de parse asiento to number.
   * @param asiento - asiento parameter
   * @returns El resultado de la operación.
   */
  private parseAsientoToNumber(asiento?: string | null): number | null {
    if (!asiento) return null;
    const num = Number.parseInt(asiento, 10);
    return Number.isFinite(num) ? num : null;
  }

  /**
   * Obtiene una lista de todos los registros.
   * @returns El resultado de la operación.
   */
  async findAll() {
    try {
      const turnos = await this.prisma.turnos.findMany({
        include: {
          conductor: {
            include: {
              usuario: true,
            },
          },
          vehiculo: {
            include: {
              tipoVehiculo: true,
              marcaVehiculo: true,
            },
          },
          ruta: {
            include: {
              origen: { include: { ubicacion: true } },
              destino: { include: { ubicacion: true } },
            },
          },
          _count: {
            select: { pasajes: true, encomiendas: true },
          },
        },
        orderBy: {
          fecha: 'desc',
        },
      });

      return {
        success: true,
        data: turnos,
        message: 'Turnos obtenidos exitosamente',
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Error desconocido';
      throw new HttpException(
        {
          success: false,
          error: 'Error al obtener turnos',
          message: errorMessage,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Obtiene un registro por su identificador único.
   * @param id - id parameter
   * @returns El resultado de la operación.
   */
  async findOne(id: string) {
    try {
      const turno = await this.prisma.turnos.findUnique({
        where: { idTurno: id },
        include: {
          conductor: {
            include: {
              usuario: true,
            },
          },
          vehiculo: {
            include: {
              tipoVehiculo: true,
              marcaVehiculo: true,
            },
          },
          ruta: {
            include: {
              origen: { include: { ubicacion: true } },
              destino: { include: { ubicacion: true } },
              paradas: {
                include: { ubicacion: true },
                orderBy: { orden: 'asc' },
              },
            },
          },
          pasajes: {
            orderBy: { createdAt: 'desc' },
          },
          encomiendas: {
            orderBy: { createdAt: 'desc' },
          },
          _count: {
            select: { pasajes: true, encomiendas: true },
          },
        },
      });

      if (!turno) {
        throw new HttpException(
          {
            success: false,
            error: 'Turno no encontrado',
          },
          HttpStatus.NOT_FOUND,
        );
      }

      return {
        success: true,
        data: turno,
        message: 'Turno encontrado',
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      const errorMessage =
        error instanceof Error ? error.message : 'Error desconocido';
      throw new HttpException(
        {
          success: false,
          error: 'Error al buscar turno',
          message: errorMessage,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Crea un nuevo registro en el sistema.
   * @param createTurnoDto - createTurnoDto parameter
   * @returns El resultado de la operación.
   */
  async create(createTurnoDto: CreateTurnoDto) {
    try {
      // Verificar que exista el conductor
      const conductor = await this.prisma.conductores.findUnique({
        where: { idConductor: createTurnoDto.idConductor },
      });

      if (!conductor) {
        throw new HttpException(
          {
            success: false,
            error: 'El conductor especificado no existe',
          },
          HttpStatus.BAD_REQUEST,
        );
      }

      // Verificar que el conductor esté activo
      if (!conductor.estado) {
        throw new HttpException(
          {
            success: false,
            error: 'El conductor especificado está inactivo',
          },
          HttpStatus.BAD_REQUEST,
        );
      }

      // Verificar que exista el vehículo
      const vehiculo = await this.prisma.vehiculos.findUnique({
        where: { idVehiculo: createTurnoDto.idVehiculo },
      });

      if (!vehiculo) {
        throw new HttpException(
          {
            success: false,
            error: 'El vehículo especificado no existe',
          },
          HttpStatus.BAD_REQUEST,
        );
      }

      // Verificar que el vehículo esté activo
      if (!vehiculo.estado) {
        throw new HttpException(
          {
            success: false,
            error: 'El vehículo especificado está inactivo',
          },
          HttpStatus.BAD_REQUEST,
        );
      }

      // Verificar que exista la ruta
      const ruta = await this.prisma.ruta.findUnique({
        where: { idRuta: createTurnoDto.idRuta },
      });

      if (!ruta) {
        throw new HttpException(
          {
            success: false,
            error: 'La ruta especificada no existe',
          },
          HttpStatus.BAD_REQUEST,
        );
      }

      // Preparar datos
      const data = {
        idTurno: createTurnoDto.idTurno || uuidv4(),
        idConductor: createTurnoDto.idConductor,
        idVehiculo: createTurnoDto.idVehiculo,
        idRuta: createTurnoDto.idRuta,
        fecha: new Date(createTurnoDto.fecha),
        hora: createTurnoDto.hora,
        estado: createTurnoDto.estado || 'Programado',
        cuposDisponibles:
          typeof createTurnoDto.cuposDisponibles === 'number'
            ? createTurnoDto.cuposDisponibles
            : vehiculo.capacidadPasajeros,
      };

      const nuevoTurno = await this.prisma.turnos.create({
        data,
        include: {
          conductor: {
            include: {
              usuario: true,
            },
          },
          vehiculo: {
            include: {
              tipoVehiculo: true,
              marcaVehiculo: true,
            },
          },
          ruta: {
            include: {
              origen: { include: { ubicacion: true } },
              destino: { include: { ubicacion: true } },
            },
          },
          _count: {
            select: { pasajes: true, encomiendas: true },
          },
        },
      });

      return {
        success: true,
        data: nuevoTurno,
        message: 'Turno creado exitosamente',
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      const errorMessage =
        error instanceof Error ? error.message : 'Error desconocido';
      throw new HttpException(
        {
          success: false,
          error: 'Error al crear turno',
          message: errorMessage,
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  /**
   * Actualiza un registro existente.
   * @param id - id parameter
   * @param updateTurnoDto - updateTurnoDto parameter
   * @returns El resultado de la operación.
   */
  async update(id: string, updateTurnoDto: UpdateTurnoDto) {
    try {
      const existente = await this.prisma.turnos.findUnique({
        where: { idTurno: id },
      });

      if (!existente) {
        throw new HttpException(
          {
            success: false,
            error: 'Turno no encontrado',
          },
          HttpStatus.NOT_FOUND,
        );
      }

      // Verificar conductor si se está actualizando
      if (updateTurnoDto.idConductor) {
        const conductor = await this.prisma.conductores.findUnique({
          where: { idConductor: updateTurnoDto.idConductor },
        });

        if (!conductor) {
          throw new HttpException(
            {
              success: false,
              error: 'El conductor especificado no existe',
            },
            HttpStatus.BAD_REQUEST,
          );
        }

        if (!conductor.estado) {
          throw new HttpException(
            {
              success: false,
              error: 'El conductor especificado está inactivo',
            },
            HttpStatus.BAD_REQUEST,
          );
        }
      }

      // Verificar vehículo si se está actualizando
      if (updateTurnoDto.idVehiculo) {
        const vehiculo = await this.prisma.vehiculos.findUnique({
          where: { idVehiculo: updateTurnoDto.idVehiculo },
        });

        if (!vehiculo) {
          throw new HttpException(
            {
              success: false,
              error: 'El vehículo especificado no existe',
            },
            HttpStatus.BAD_REQUEST,
          );
        }

        if (!vehiculo.estado) {
          throw new HttpException(
            {
              success: false,
              error: 'El vehículo especificado está inactivo',
            },
            HttpStatus.BAD_REQUEST,
          );
        }
      }

      // Verificar ruta si se está actualizando
      if (updateTurnoDto.idRuta) {
        const ruta = await this.prisma.ruta.findUnique({
          where: { idRuta: updateTurnoDto.idRuta },
        });

        if (!ruta) {
          throw new HttpException(
            {
              success: false,
              error: 'La ruta especificada no existe',
            },
            HttpStatus.BAD_REQUEST,
          );
        }
      }

      // Preparar datos para actualización
      const data: Record<string, unknown> = { ...updateTurnoDto };

      if (data.fecha && typeof data.fecha === 'string') {
        data.fecha = new Date(data.fecha);
      }

      const turnoActualizado = await this.prisma.turnos.update({
        where: { idTurno: id },
        data,
        include: {
          conductor: {
            include: {
              usuario: true,
            },
          },
          vehiculo: {
            include: {
              tipoVehiculo: true,
              marcaVehiculo: true,
            },
          },
          ruta: {
            include: {
              origen: { include: { ubicacion: true } },
              destino: { include: { ubicacion: true } },
            },
          },
          _count: {
            select: { pasajes: true, encomiendas: true },
          },
        },
      });

      return {
        success: true,
        data: turnoActualizado,
        message: 'Turno actualizado exitosamente',
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      const prismaError = error as PrismaError;
      if (prismaError.code === 'P2025') {
        throw new HttpException(
          {
            success: false,
            error: 'Turno no encontrado',
          },
          HttpStatus.NOT_FOUND,
        );
      }

      const errorMessage =
        error instanceof Error ? error.message : 'Error desconocido';
      throw new HttpException(
        {
          success: false,
          error: 'Error al actualizar turno',
          message: errorMessage,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Elimina un registro del sistema.
   * @param id - id parameter
   * @returns El resultado de la operación.
   */
  async remove(id: string) {
    try {
      const existente = await this.prisma.turnos.findUnique({
        where: { idTurno: id },
      });

      if (!existente) {
        throw new HttpException(
          {
            success: false,
            error: 'Turno no encontrado',
          },
          HttpStatus.NOT_FOUND,
        );
      }

      await this.prisma.turnos.delete({
        where: { idTurno: id },
      });

      return {
        success: true,
        message: 'Turno eliminado exitosamente',
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      const prismaError = error as PrismaError;
      if (prismaError.code === 'P2025') {
        throw new HttpException(
          {
            success: false,
            error: 'Turno no encontrado',
          },
          HttpStatus.NOT_FOUND,
        );
      }

      const errorMessage =
        error instanceof Error ? error.message : 'Error desconocido';
      throw new HttpException(
        {
          success: false,
          error: 'Error al eliminar turno',
          message: errorMessage,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Realiza la operación de buscar publico.
   * @param params - params parameter
   * @returns El resultado de la operación.
   */
  async buscarPublico(params: TurnoBusquedaParams) {
    try {
      const { start, end } = this.parseFechaRango(params.fecha);

      const where: Record<string, unknown> = {
        estado: 'Programado',
        ...(start && end
          ? {
              fecha: {
                gte: start,
                lt: end,
              },
            }
          : {}),
      };

      // Filtros por origen/destino.
      // Preferimos IDs (preciso) y dejamos compatibilidad con búsqueda por nombre (contains).
      if (
        params.origen ||
        params.destino ||
        params.origenId ||
        params.destinoId
      ) {
        where.ruta = {
          ...(params.origenId
            ? {
                origen: {
                  idUbicacion: params.origenId,
                },
              }
            : params.origen
              ? {
                  origen: {
                    ubicacion: {
                      nombreUbicacion: {
                        contains: params.origen,
                        mode: 'insensitive',
                      },
                    },
                  },
                }
              : {}),
          ...(params.destinoId
            ? {
                destino: {
                  idUbicacion: params.destinoId,
                },
              }
            : params.destino
              ? {
                  destino: {
                    ubicacion: {
                      nombreUbicacion: {
                        contains: params.destino,
                        mode: 'insensitive',
                      },
                    },
                  },
                }
              : {}),
        };
      }

      const turnos = await this.prisma.turnos.findMany({
        where,
        include: {
          vehiculo: {
            include: {
              tipoVehiculo: true,
              marcaVehiculo: true,
            },
          },
          ruta: {
            include: {
              origen: { include: { ubicacion: true } },
              destino: { include: { ubicacion: true } },
            },
          },
          pasajes: {
            select: { asiento: true },
          },
        },
        orderBy: [{ fecha: 'asc' }, { hora: 'asc' }],
      });

      return {
        success: true,
        data: turnos,
        message: 'Búsqueda de turnos realizada exitosamente',
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Error desconocido';
      throw new HttpException(
        {
          success: false,
          error: 'Error al buscar turnos',
          message: errorMessage,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Realiza la operación de find by ruta publico.
   * @param idRuta - idRuta parameter
   * @param fecha - fecha parameter
   * @returns El resultado de la operación.
   */
  async findByRutaPublico(idRuta: string, fecha?: string) {
    try {
      const { start, end } = this.parseFechaRango(fecha);
      const turnos = await this.prisma.turnos.findMany({
        where: {
          idRuta,
          estado: 'Programado',
          ...(start && end
            ? {
                fecha: {
                  gte: start,
                  lt: end,
                },
              }
            : {}),
        },
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
          pasajes: { select: { asiento: true } },
        },
        orderBy: [{ fecha: 'asc' }, { hora: 'asc' }],
      });

      return {
        success: true,
        data: turnos,
        message: 'Turnos por ruta obtenidos exitosamente',
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Error desconocido';
      throw new HttpException(
        {
          success: false,
          error: 'Error al obtener turnos por ruta',
          message: errorMessage,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Realiza la operación de get asientos publico.
   * @param idTurno - idTurno parameter
   * @returns El resultado de la operación.
   */
  async getAsientosPublico(idTurno: string) {
    try {
      const turno = await this.prisma.turnos.findUnique({
        where: { idTurno },
        include: {
          vehiculo: true,
          pasajes: { select: { asiento: true } },
        },
      });

      if (!turno) {
        throw new HttpException(
          { success: false, error: 'Turno no encontrado' },
          HttpStatus.NOT_FOUND,
        );
      }

      const asientos = (turno.vehiculo?.capacidadPasajeros || 0) + 1;
      const asientosOcupados = (turno.pasajes || [])
        .map((p) => this.parseAsientoToNumber(p.asiento))
        .filter((n): n is number => typeof n === 'number');

      return {
        success: true,
        data: { asientos, asientosOcupados },
        message: 'Asientos obtenidos exitosamente',
      };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      const errorMessage =
        error instanceof Error ? error.message : 'Error desconocido';
      throw new HttpException(
        {
          success: false,
          error: 'Error al obtener asientos',
          message: errorMessage,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Lista los turnos asignados al conductor autenticado.
   * Incluye turnos pasados, de hoy y próximos para facilitar historial y planeación.
   */
  async findMisViajesConductor(idUsuario: string) {
    try {
      const conductor = await this.prisma.conductores.findUnique({
        where: { idUsuario },
        select: { idConductor: true, estado: true },
      });

      if (!conductor || !conductor.estado) {
        return {
          success: true,
          data: [],
          message: 'No se encontró un perfil de conductor activo',
        };
      }

      const turnos = await this.prisma.turnos.findMany({
        where: {
          idConductor: conductor.idConductor,
        },
        include: {
          vehiculo: {
            include: {
              tipoVehiculo: true,
              marcaVehiculo: true,
            },
          },
          ruta: {
            include: {
              origen: { include: { ubicacion: true } },
              destino: { include: { ubicacion: true } },
            },
          },
          _count: {
            select: { pasajes: true },
          },
        },
        orderBy: [{ fecha: 'desc' }, { hora: 'desc' }],
      });

      return {
        success: true,
        data: turnos,
        message: 'Viajes asignados obtenidos exitosamente',
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Error desconocido';
      throw new HttpException(
        {
          success: false,
          error: 'Error al obtener viajes asignados',
          message: errorMessage,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
