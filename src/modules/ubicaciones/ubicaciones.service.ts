import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateUbicacionDto } from './dto/create-ubicacion.dto';
import { UpdateUbicacionDto } from './dto/update-ubicacion.dto';

@Injectable()
export class UbicacionesService {
  constructor(private prisma: PrismaService) {}

  /**
   * Crea un nuevo registro en el sistema.
   * @param data - data parameter
   * @returns El resultado de la operación.
   */
  async create(data: CreateUbicacionDto) {
    // Validar nombre único (case insensitive)
    const existe = await this.prisma.ubicacion.findFirst({
      where: {
        nombreUbicacion: {
          equals: data.nombreUbicacion,
          mode: 'insensitive',
        },
      },
    });

    if (existe) {
      throw new ConflictException(
        `Ya existe una ubicación con el nombre "${data.nombreUbicacion}"`,
      );
    }

    // Asegurar que latitud y longitud sean convertidos a Decimal o manejados correctamente
    return this.prisma.ubicacion.create({
      data: {
        ...data,
        estado: true, // Default active on create
      },
    });
  }

  /**
   * Obtiene una lista de todos los registros.
   * @returns El resultado de la operación.
   */
  async findAll() {
    return this.prisma.ubicacion.findMany({
      orderBy: { nombreUbicacion: 'asc' }, // Ordenar por nombre
    });
  }

  /**
   * Obtiene un registro por su identificador único.
   * @param id - id parameter
   * @returns El resultado de la operación.
   */
  async findOne(id: string) {
    const ubicacion = await this.prisma.ubicacion.findUnique({
      where: { idUbicacion: id },
    });

    if (!ubicacion) {
      throw new NotFoundException(`Ubicación con ID ${id} no encontrada`);
    }

    return ubicacion;
  }

  /**
   * Actualiza un registro existente.
   * @param id - id parameter
   * @param data - data parameter
   * @returns El resultado de la operación.
   */
  async update(id: string, data: UpdateUbicacionDto) {
    // Verificar que existe
    await this.findOne(id);

    // Validar nombre único al actualizar (si se cambia el nombre)
    if (data.nombreUbicacion) {
      const existe = await this.prisma.ubicacion.findFirst({
        where: {
          nombreUbicacion: {
            equals: data.nombreUbicacion,
            mode: 'insensitive',
          },
          NOT: { idUbicacion: id }, // Excluir la ubicación actual
        },
      });

      if (existe) {
        throw new ConflictException(
          `Ya existe una ubicación con el nombre "${data.nombreUbicacion}"`,
        );
      }
    }

    return this.prisma.ubicacion.update({
      where: { idUbicacion: id },
      data,
    });
  }

  /**
   * Elimina un registro del sistema.
   * @param id - id parameter
   * @returns El resultado de la operación.
   */
  async remove(id: string) {
    // Verificar que existe
    const ubicacion = await this.findOne(id);

    // Verificar si tiene rutas activas antes de eliminar (si está activo)
    if (ubicacion.estado) {
      const rutasActivas = await this.checkRutasActivas(id);
      if (rutasActivas.tieneRutasActivas) {
        throw new ConflictException({
          message: 'La ubicación tiene rutas activas asociadas',
          data: rutasActivas,
        });
      }
    }

    // Hard Delete (gracias a OnDelete: Cascade en el esquema, borrará dependencias)
    return this.prisma.ubicacion.delete({
      where: { idUbicacion: id },
    });
  }

  /**
   * Realiza la operación de check rutas activas.
   * @param id - id parameter
   * @returns El resultado de la operación.
   */
  async checkRutasActivas(id: string) {
    await this.findOne(id);

    // Buscar rutas donde esta ubicación es el Origen
    const origenes = await this.prisma.origen.findMany({
      where: { idUbicacion: id },
      include: {
        rutasOrigen: {
          include: {
            destino: {
              include: {
                ubicacion: true,
              },
            },
            origen: {
              include: {
                ubicacion: true,
              },
            },
            paradas: {
              include: {
                ubicacion: true,
              },
              orderBy: { orden: 'asc' },
            },
          },
        },
      },
    });

    // Buscar rutas donde esta ubicación es el Destino
    const destinos = await this.prisma.destino.findMany({
      where: { idUbicacion: id },
      include: {
        rutasDestino: {
          include: {
            origen: {
              include: {
                ubicacion: true,
              },
            },
            destino: {
              include: {
                ubicacion: true,
              },
            },
            paradas: {
              include: {
                ubicacion: true,
              },
              orderBy: { orden: 'asc' },
            },
          },
        },
      },
    });

    const rutasActivas: {
      idRuta: string;
      origen: string;
      destino: string;
      paradas: { idParada: string; orden: number; nombreUbicacion: string }[];
    }[] = [];

    // Procesar rutas como Origen
    origenes.forEach((origen) => {
      origen.rutasOrigen.forEach((ruta) => {
        rutasActivas.push({
          idRuta: ruta.idRuta,
          origen: ruta.origen.ubicacion.nombreUbicacion,
          destino: ruta.destino.ubicacion.nombreUbicacion,
          paradas: (ruta.paradas || []).map((p) => ({
            idParada: p.idParada,
            orden: p.orden,
            nombreUbicacion: p.ubicacion.nombreUbicacion,
          })),
        });
      });
    });

    // Procesar rutas como Destino
    destinos.forEach((destino) => {
      destino.rutasDestino.forEach((ruta) => {
        rutasActivas.push({
          idRuta: ruta.idRuta,
          origen: ruta.origen.ubicacion.nombreUbicacion,
          destino: ruta.destino.ubicacion.nombreUbicacion,
          paradas: (ruta.paradas || []).map((p) => ({
            idParada: p.idParada,
            orden: p.orden,
            nombreUbicacion: p.ubicacion.nombreUbicacion,
          })),
        });
      });
    });

    // Eliminar duplicados si una ruta va de A a A (raro pero posible)
    const uniqueRutas = rutasActivas.filter(
      (ruta, index, self) =>
        index === self.findIndex((t) => t.idRuta === ruta.idRuta),
    );

    return {
      tieneRutasActivas: uniqueRutas.length > 0,
      totalRutasActivas: uniqueRutas.length,
      rutasActivas: uniqueRutas,
    };
  }

  /**
   * Realiza la operación de force delete.
   * @param id - id parameter
   * @returns El resultado de la operación.
   */
  async forceDelete(id: string) {
    // Verificar que existe
    await this.findOne(id);

    // Hard Delete directo (el esquema cascade se encarga de lo demás)
    return this.prisma.ubicacion.delete({
      where: { idUbicacion: id },
    });
  }
}
