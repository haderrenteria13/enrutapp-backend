import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { v4 as uuidv4 } from 'uuid';
import { CreateTipoVehiculoDto, UpdateTipoVehiculoDto } from './dto';

// Interfaz para errores de Prisma
interface PrismaError extends Error {
  code?: string;
  meta?: {
    target?: string[];
  };
}

/**
 * Servicio de Tipos de Vehículo
 * Contiene toda la lógica de negocio relacionada con tipos de vehículos
 */
@Injectable()
export class TiposVehiculoService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Obtiene una lista de todos los registros.
   * @returns El resultado de la operación.
   */
  async findAll() {
    try {
      const tiposVehiculo = await this.prisma.tiposVehiculo.findMany({
        include: {
          vehiculos: true,
        },
        orderBy: {
          nombreTipoVehiculo: 'asc',
        },
      });

      return {
        success: true,
        data: tiposVehiculo,
        message: 'Tipos de vehículo obtenidos exitosamente',
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Error desconocido';
      throw new HttpException(
        {
          success: false,
          error: 'Error al obtener tipos de vehículo',
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
      const tipoVehiculo = await this.prisma.tiposVehiculo.findUnique({
        where: { idTipoVehiculo: id },
        include: {
          vehiculos: true,
        },
      });

      if (!tipoVehiculo) {
        throw new HttpException(
          {
            success: false,
            error: 'Tipo de vehículo no encontrado',
          },
          HttpStatus.NOT_FOUND,
        );
      }

      return {
        success: true,
        data: tipoVehiculo,
        message: 'Tipo de vehículo encontrado',
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
          error: 'Error al buscar tipo de vehículo',
          message: errorMessage,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Crea un nuevo registro en el sistema.
   * @param createTipoVehiculoDto - createTipoVehiculoDto parameter
   * @returns El resultado de la operación.
   */
  async create(createTipoVehiculoDto: CreateTipoVehiculoDto) {
    try {
      // Preparar datos
      const data = {
        idTipoVehiculo: createTipoVehiculoDto.idTipoVehiculo || uuidv4(),
        nombreTipoVehiculo: createTipoVehiculoDto.nombreTipoVehiculo,
        descripcion: createTipoVehiculoDto.descripcion || null,
        estado:
          typeof createTipoVehiculoDto.estado === 'boolean'
            ? createTipoVehiculoDto.estado
            : true,
      };

      const nuevoTipoVehiculo = await this.prisma.tiposVehiculo.create({
        data,
      });

      return {
        success: true,
        data: nuevoTipoVehiculo,
        message: 'Tipo de vehículo creado exitosamente',
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      // Error de duplicado
      const prismaError = error as PrismaError;
      if (prismaError.code === 'P2002') {
        throw new HttpException(
          {
            success: false,
            error: 'El nombre del tipo de vehículo ya existe',
          },
          HttpStatus.CONFLICT,
        );
      }
      const errorMessage =
        error instanceof Error ? error.message : 'Error desconocido';
      throw new HttpException(
        {
          success: false,
          error: 'Error al crear tipo de vehículo',
          message: errorMessage,
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  /**
   * Actualiza un registro existente.
   * @param id - id parameter
   * @param updateTipoVehiculoDto - updateTipoVehiculoDto parameter
   * @returns El resultado de la operación.
   */
  async update(id: string, updateTipoVehiculoDto: UpdateTipoVehiculoDto) {
    try {
      const existente = await this.prisma.tiposVehiculo.findUnique({
        where: { idTipoVehiculo: id },
      });

      if (!existente) {
        throw new HttpException(
          { success: false, error: 'Tipo de vehículo no encontrado' },
          HttpStatus.NOT_FOUND,
        );
      }

      const tipoVehiculoActualizado = await this.prisma.tiposVehiculo.update({
        where: { idTipoVehiculo: id },
        data: updateTipoVehiculoDto,
      });

      return {
        success: true,
        data: tipoVehiculoActualizado,
        message: 'Tipo de vehículo actualizado exitosamente',
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      const prismaError = error as PrismaError;
      if (prismaError.code === 'P2002') {
        throw new HttpException(
          { success: false, error: 'Nombre de tipo de vehículo duplicado' },
          HttpStatus.CONFLICT,
        );
      }
      if (prismaError.code === 'P2025') {
        throw new HttpException(
          { success: false, error: 'Tipo de vehículo no encontrado' },
          HttpStatus.NOT_FOUND,
        );
      }
      const errorMessage =
        error instanceof Error ? error.message : 'Error desconocido';
      throw new HttpException(
        {
          success: false,
          error: 'Error al actualizar tipo de vehículo',
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
      const existente = await this.prisma.tiposVehiculo.findUnique({
        where: { idTipoVehiculo: id },
        include: { vehiculos: true },
      });

      if (!existente) {
        throw new HttpException(
          { success: false, error: 'Tipo de vehículo no encontrado' },
          HttpStatus.NOT_FOUND,
        );
      }

      // Verificar que no tenga vehículos asociados
      if (existente.vehiculos && existente.vehiculos.length > 0) {
        throw new HttpException(
          {
            success: false,
            error:
              'No se puede eliminar un tipo de vehículo con vehículos asociados',
          },
          HttpStatus.CONFLICT,
        );
      }

      await this.prisma.tiposVehiculo.delete({
        where: { idTipoVehiculo: id },
      });

      return {
        success: true,
        message: 'Tipo de vehículo eliminado exitosamente',
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      const prismaError = error as PrismaError;
      if (prismaError.code === 'P2025') {
        throw new HttpException(
          { success: false, error: 'Tipo de vehículo no encontrado' },
          HttpStatus.NOT_FOUND,
        );
      }
      const errorMessage =
        error instanceof Error ? error.message : 'Error desconocido';
      throw new HttpException(
        {
          success: false,
          error: 'Error al eliminar tipo de vehículo',
          message: errorMessage,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
