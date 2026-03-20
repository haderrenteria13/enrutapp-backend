import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { UpdateRutaDto } from './dto/update-ruta.dto';
import { CreateRutaDto } from './dto/create-ruta.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class RutasService {
  private readonly logger = new Logger(RutasService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Crea un nuevo registro en el sistema.
   * @param data - data parameter
   * @returns El resultado de la operación.
   */
  async create(data: CreateRutaDto & { tiempo?: string | number }) {
    try {
      // Tomar el tiempo desde 'tiempo' o 'tiempoEstimado'
      const tiempoEstimado = data.tiempo || data.tiempoEstimado || null;

      this.logger.log(
        `Creando nueva ruta de ${data.idOrigen} a ${data.idDestino}`,
      );

      const rutaData: Prisma.RutaUncheckedCreateInput = {
        idOrigen: data.idOrigen,
        idDestino: data.idDestino,
        distancia: data.distancia
          ? parseFloat(data.distancia.toString())
          : null,
        precioBase: data.precioBase
          ? parseFloat(data.precioBase.toString())
          : null,
        tiempoEstimado: tiempoEstimado ? String(tiempoEstimado) : null,
        estado: data.estado || 'Activa',
        observaciones: data.observaciones || null,
        paradas:
          data.paradas && Array.isArray(data.paradas) && data.paradas.length > 0
            ? {
                create: data.paradas.map(
                  (idUbicacion: string, index: number) => ({
                    idUbicacion,
                    orden: index + 1,
                  }),
                ),
              }
            : undefined,
      };

      return this.prisma.ruta.create({
        data: rutaData,
        include: {
          origen: { include: { ubicacion: true } },
          destino: { include: { ubicacion: true } },
          paradas: {
            include: { ubicacion: true },
            orderBy: { orden: 'asc' },
          },
        },
      });
    } catch (error) {
      this.logger.error('Error al crear ruta', error);
      throw error;
    }
  }

  /**
   * Obtiene una lista de todos los registros.
   * @returns El resultado de la operación.
   */
  async findAll() {
    return this.prisma.ruta.findMany({
      include: {
        origen: { include: { ubicacion: true } },
        destino: { include: { ubicacion: true } },
        paradas: {
          include: { ubicacion: true },
          orderBy: { orden: 'asc' },
        },
      },
    });
  }

  /**
   * Obtiene un registro por su identificador único.
   * @param idRuta - idRuta parameter
   * @returns El resultado de la operación.
   */
  async findOne(idRuta: string) {
    return this.prisma.ruta.findUnique({
      where: { idRuta },
      include: {
        origen: { include: { ubicacion: true } },
        destino: { include: { ubicacion: true } },
        paradas: {
          include: { ubicacion: true },
          orderBy: { orden: 'asc' },
        },
      },
    });
  }

  /**
   * Actualiza un registro existente.
   * @param idRuta - idRuta parameter
   * @param data - data parameter
   * @returns El resultado de la operación.
   */
  async update(idRuta: string, data: UpdateRutaDto & { paradas?: string[] }) {
    const updateData: Prisma.RutaUncheckedUpdateInput = {
      ...data,
      distancia: data.distancia
        ? parseFloat(data.distancia.toString())
        : undefined,
      precioBase: data.precioBase
        ? parseFloat(data.precioBase.toString())
        : undefined,
      paradas:
        data.paradas && Array.isArray(data.paradas)
          ? {
              deleteMany: {}, // Borrar existentes
              create: data.paradas.map(
                (idUbicacion: string, index: number) => ({
                  idUbicacion,
                  orden: index + 1,
                }),
              ),
            }
          : undefined,
    };

    return this.prisma.ruta.update({
      where: { idRuta },
      data: updateData,
      include: {
        origen: { include: { ubicacion: true } },
        destino: { include: { ubicacion: true } },
        paradas: {
          include: { ubicacion: true },
          orderBy: { orden: 'asc' },
        },
      },
    });
  }

  /**
   * Elimina un registro del sistema.
   * @param idRuta - idRuta parameter
   * @returns El resultado de la operación.
   */
  async remove(idRuta: string) {
    return this.prisma.ruta.delete({ where: { idRuta } });
  }

  /**
   * Realiza la operación de create ubicacion.
   * @param data - data parameter
   * @returns El resultado de la operación.
   */
  async createUbicacion(data: {
    nombreUbicacion: string;
    direccion: string;
    latitud: number;
    longitud: number;
  }) {
    return this.prisma.ubicacion.create({
      data,
    });
  }

  /**
   * Realiza la operación de find all ubicaciones.
   * @returns El resultado de la operación.
   */
  async findAllUbicaciones() {
    // 1. Obtener ubicaciones de la tabla nueva
    const ubicaciones = await this.prisma.ubicacion.findMany({
      orderBy: { nombreUbicacion: 'asc' },
    });

    return ubicaciones;
  }

  /**
   * Realiza la operación de create origen.
   * @param data - data parameter
   * @returns El resultado de la operación.
   */
  async createOrigen(data: { idUbicacion: string; descripcion?: string }) {
    return this.prisma.origen.create({
      data,
      include: { ubicacion: true },
    });
  }

  /**
   * Realiza la operación de find all origenes.
   * @returns El resultado de la operación.
   */
  async findAllOrigenes() {
    return this.prisma.origen.findMany({
      include: { ubicacion: true },
      orderBy: { ubicacion: { nombreUbicacion: 'asc' } },
    });
  }

  /**
   * Realiza la operación de find origen by ubicacion.
   * @param idUbicacion - idUbicacion parameter
   * @returns El resultado de la operación.
   */
  async findOrigenByUbicacion(idUbicacion: string) {
    return this.prisma.origen.findFirst({
      where: { idUbicacion },
      include: { ubicacion: true },
    });
  }

  /**
   * Realiza la operación de create destino.
   * @param data - data parameter
   * @returns El resultado de la operación.
   */
  async createDestino(data: { idUbicacion: string; descripcion?: string }) {
    return this.prisma.destino.create({
      data,
      include: { ubicacion: true },
    });
  }

  /**
   * Realiza la operación de find all destinos.
   * @returns El resultado de la operación.
   */
  async findAllDestinos() {
    return this.prisma.destino.findMany({
      include: { ubicacion: true },
      orderBy: { ubicacion: { nombreUbicacion: 'asc' } },
    });
  }

  /**
   * Realiza la operación de find destino by ubicacion.
   * @param idUbicacion - idUbicacion parameter
   * @returns El resultado de la operación.
   */
  async findDestinoByUbicacion(idUbicacion: string) {
    return this.prisma.destino.findFirst({
      where: { idUbicacion },
      include: { ubicacion: true },
    });
  }
}
