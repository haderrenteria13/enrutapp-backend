import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { existsSync, unlinkSync } from 'fs';
import { join } from 'path';
import { PrismaService } from '../../database/prisma.service';
import { v4 as uuidv4 } from 'uuid';
import { CreateVehiculoDto, UpdateVehiculoDto } from './dto';
import { Prisma, ColorVehiculo } from '@prisma/client';

// Interfaz para errores de Prisma
interface PrismaError extends Error {
  code?: string;
  meta?: {
    target?: string[];
  };
}

/**
 * Servicio de Vehículos
 * Contiene toda la lógica de negocio relacionada con vehículos
 */
@Injectable()
export class VehiculosService {
  constructor(private readonly prisma: PrismaService) {}

  private startOfToday(): Date {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), today.getDate());
  }

  /**
   * Obtiene una lista de todos los registros.
   * @returns El resultado de la operación.
   */
  async findAll() {
    try {
      const vehiculos = await this.prisma.vehiculos.findMany({
        include: {
          tipoVehiculo: true,
          marcaVehiculo: true,
          propietario: true,
        },
        orderBy: {
          placa: 'asc',
        },
      });

      return {
        success: true,
        data: vehiculos,
        message: 'Vehículos obtenidos exitosamente',
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Error desconocido';
      throw new HttpException(
        {
          success: false,
          error: 'Error al obtener vehículos',
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
      const vehiculo = await this.prisma.vehiculos.findUnique({
        where: { idVehiculo: id },
        include: {
          tipoVehiculo: true,
          marcaVehiculo: true,
          propietario: true,
        },
      });

      if (!vehiculo) {
        throw new HttpException(
          {
            success: false,
            error: 'Vehículo no encontrado',
          },
          HttpStatus.NOT_FOUND,
        );
      }

      return {
        success: true,
        data: vehiculo,
        message: 'Vehículo encontrado',
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
          error: 'Error al buscar vehículo',
          message: errorMessage,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Crea un nuevo registro en el sistema.
   * @param createVehiculoDto - createVehiculoDto parameter
   * @param file - file parameter
   * @returns El resultado de la operación.
   */
  async create(
    createVehiculoDto: CreateVehiculoDto,
    file?: Express.Multer.File,
  ) {
    try {
      const today = this.startOfToday();
      if (
        !createVehiculoDto.soatVencimiento ||
        !createVehiculoDto.tecnomecanicaVencimiento ||
        !createVehiculoDto.seguroVencimiento
      ) {
        throw new HttpException(
          {
            success: false,
            error:
              'SOAT, tecnomecánica y seguro son obligatorios para crear el vehículo',
          },
          HttpStatus.BAD_REQUEST,
        );
      }

      const soatDate = new Date(createVehiculoDto.soatVencimiento);
      const tecnoDate = new Date(createVehiculoDto.tecnomecanicaVencimiento);
      const seguroDate = new Date(createVehiculoDto.seguroVencimiento);

      if (soatDate < today) {
        throw new HttpException(
          {
            success: false,
            error:
              'La fecha de vencimiento del SOAT no puede ser anterior a hoy',
          },
          HttpStatus.BAD_REQUEST,
        );
      }
      if (tecnoDate < today) {
        throw new HttpException(
          {
            success: false,
            error:
              'La fecha de vencimiento de la tecnomecánica no puede ser anterior a hoy',
          },
          HttpStatus.BAD_REQUEST,
        );
      }
      if (seguroDate < today) {
        throw new HttpException(
          {
            success: false,
            error:
              'La fecha de vencimiento del seguro no puede ser anterior a hoy',
          },
          HttpStatus.BAD_REQUEST,
        );
      }

      const tipoVehiculo = await this.prisma.tiposVehiculo.findUnique({
        where: { idTipoVehiculo: createVehiculoDto.idTipoVehiculo },
      });

      if (!tipoVehiculo) {
        throw new HttpException(
          {
            success: false,
            error: 'El tipo de vehículo especificado no existe',
          },
          HttpStatus.BAD_REQUEST,
        );
      }

      const marcaVehiculo = await this.prisma.marcasVehiculos.findUnique({
        where: { idMarcaVehiculo: createVehiculoDto.idMarcaVehiculo },
      });

      if (!marcaVehiculo) {
        throw new HttpException(
          {
            success: false,
            error: 'La marca de vehículo especificada no existe',
          },
          HttpStatus.BAD_REQUEST,
        );
      }

      // Validar que se envíe al menos un propietario (interno o externo)
      if (
        !createVehiculoDto.idPropietario &&
        (!createVehiculoDto.propietarioExternoNombre ||
          !createVehiculoDto.propietarioExternoDocumento)
      ) {
        throw new HttpException(
          {
            success: false,
            error:
              'Debe especificar un propietario (Conductor registrado o Persona externa)',
          },
          HttpStatus.BAD_REQUEST,
        );
      }

      // Si se envía idPropietario, verificar que el usuario exista
      if (createVehiculoDto.idPropietario) {
        const propietario = await this.prisma.usuarios.findUnique({
          where: { idUsuario: createVehiculoDto.idPropietario },
        });
        if (!propietario) {
          throw new HttpException(
            { success: false, error: 'El propietario seleccionado no existe' },
            HttpStatus.BAD_REQUEST,
          );
        }
      }

      type VehiculoData = {
        idVehiculo: string;
        idTipoVehiculo: string;
        idMarcaVehiculo: string;
        idPropietario: string | null;
        propietarioExternoNombre: string | null;
        propietarioExternoDocumento: string | null;
        propietarioExternoTelefono: string | null;
        idConductorAsignado: string | null;
        placa: string;
        tipoPlaca: 'Blanca' | 'Amarilla';
        linea: string;
        modelo: number;
        color: ColorVehiculo;
        capacidadPasajeros: number;
        capacidadCarga: Prisma.Decimal | null;
        soatVencimiento: Date | null;
        tecnomecanicaVencimiento: Date | null;
        seguroVencimiento: Date | null;
        estado: boolean;
        fotoUrl: string | null;
      };

      const data: VehiculoData = {
        idVehiculo: createVehiculoDto.idVehiculo || uuidv4(),
        idTipoVehiculo: createVehiculoDto.idTipoVehiculo,
        idMarcaVehiculo: createVehiculoDto.idMarcaVehiculo,
        idPropietario: createVehiculoDto.idPropietario || null,
        propietarioExternoNombre:
          createVehiculoDto.propietarioExternoNombre || null,
        propietarioExternoDocumento:
          createVehiculoDto.propietarioExternoDocumento || null,
        propietarioExternoTelefono:
          createVehiculoDto.propietarioExternoTelefono || null,
        idConductorAsignado: createVehiculoDto.idConductorAsignado || null,
        placa: createVehiculoDto.placa.toUpperCase(),
        tipoPlaca:
          createVehiculoDto.tipoPlaca?.toUpperCase() === 'AMARILLA'
            ? 'Amarilla'
            : 'Blanca',
        linea: createVehiculoDto.linea,
        modelo: createVehiculoDto.modelo,
        color: createVehiculoDto.color,
        capacidadPasajeros: createVehiculoDto.capacidadPasajeros,
        capacidadCarga: createVehiculoDto.capacidadCarga
          ? new Prisma.Decimal(createVehiculoDto.capacidadCarga)
          : null,
        soatVencimiento: createVehiculoDto.soatVencimiento
          ? new Date(createVehiculoDto.soatVencimiento)
          : null,
        tecnomecanicaVencimiento: createVehiculoDto.tecnomecanicaVencimiento
          ? new Date(createVehiculoDto.tecnomecanicaVencimiento)
          : null,
        seguroVencimiento: createVehiculoDto.seguroVencimiento
          ? new Date(createVehiculoDto.seguroVencimiento)
          : null,
        estado:
          typeof createVehiculoDto.estado === 'boolean'
            ? createVehiculoDto.estado
            : true,
        fotoUrl: file ? `/uploads/vehiculos/${file.filename}` : null,
      };

      const nuevoVehiculo = await this.prisma.vehiculos.create({
        data,
        include: {
          tipoVehiculo: true,
          marcaVehiculo: true,
        },
      });

      return {
        success: true,
        data: nuevoVehiculo,
        message: 'Vehículo creado exitosamente',
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      // Error de duplicado
      const prismaError = error as PrismaError;
      if (prismaError.code === 'P2002') {
        const target = prismaError.meta?.target?.[0];
        if (target === 'placa') {
          throw new HttpException(
            { success: false, error: 'La placa del vehículo ya existe' },
            HttpStatus.CONFLICT,
          );
        }
        throw new HttpException(
          { success: false, error: 'El vehículo ya existe' },
          HttpStatus.CONFLICT,
        );
      }
      const errorMessage =
        error instanceof Error ? error.message : 'Error desconocido';
      throw new HttpException(
        {
          success: false,
          error: 'Error al crear vehículo',
          message: errorMessage,
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  /**
   * Actualiza un registro existente.
   * @param id - id parameter
   * @param updateVehiculoDto - updateVehiculoDto parameter
   * @returns El resultado de la operación.
   */
  async update(id: string, updateVehiculoDto: UpdateVehiculoDto) {
    try {
      const existente = await this.prisma.vehiculos.findUnique({
        where: { idVehiculo: id },
      });

      if (!existente) {
        throw new HttpException(
          { success: false, error: 'Vehículo no encontrado' },
          HttpStatus.NOT_FOUND,
        );
      }

      const today = this.startOfToday();

      const soatRaw =
        updateVehiculoDto.soatVencimiento ??
        (existente.soatVencimiento
          ? existente.soatVencimiento.toISOString().split('T')[0]
          : null);
      const tecnoRaw =
        updateVehiculoDto.tecnomecanicaVencimiento ??
        (existente.tecnomecanicaVencimiento
          ? existente.tecnomecanicaVencimiento.toISOString().split('T')[0]
          : null);
      const seguroRaw =
        updateVehiculoDto.seguroVencimiento ??
        (existente.seguroVencimiento
          ? existente.seguroVencimiento.toISOString().split('T')[0]
          : null);

      if (!soatRaw || !tecnoRaw || !seguroRaw) {
        throw new HttpException(
          {
            success: false,
            error:
              'SOAT, tecnomecánica y seguro son obligatorios para el vehículo',
          },
          HttpStatus.BAD_REQUEST,
        );
      }

      const soatDate = new Date(soatRaw);
      const tecnoDate = new Date(tecnoRaw);
      const seguroDate = new Date(seguroRaw);

      if (soatDate < today) {
        throw new HttpException(
          {
            success: false,
            error:
              'La fecha de vencimiento del SOAT no puede ser anterior a hoy',
          },
          HttpStatus.BAD_REQUEST,
        );
      }
      if (tecnoDate < today) {
        throw new HttpException(
          {
            success: false,
            error:
              'La fecha de vencimiento de la tecnomecánica no puede ser anterior a hoy',
          },
          HttpStatus.BAD_REQUEST,
        );
      }
      if (seguroDate < today) {
        throw new HttpException(
          {
            success: false,
            error:
              'La fecha de vencimiento del seguro no puede ser anterior a hoy',
          },
          HttpStatus.BAD_REQUEST,
        );
      }

      if (updateVehiculoDto.idTipoVehiculo) {
        const tipoVehiculo = await this.prisma.tiposVehiculo.findUnique({
          where: { idTipoVehiculo: updateVehiculoDto.idTipoVehiculo },
        });
        if (!tipoVehiculo) {
          throw new HttpException(
            {
              success: false,
              error: 'El tipo de vehículo especificado no existe',
            },
            HttpStatus.BAD_REQUEST,
          );
        }
      }

      if (updateVehiculoDto.idMarcaVehiculo) {
        const marcaVehiculo = await this.prisma.marcasVehiculos.findUnique({
          where: { idMarcaVehiculo: updateVehiculoDto.idMarcaVehiculo },
        });
        if (!marcaVehiculo) {
          throw new HttpException(
            {
              success: false,
              error: 'La marca de vehículo especificada no existe',
            },
            HttpStatus.BAD_REQUEST,
          );
        }
      }

      const data: Record<string, unknown> = { ...updateVehiculoDto };

      if (data.tipoPlaca && typeof data.tipoPlaca === 'string') {
        const normalized = data.tipoPlaca.toUpperCase();
        if (normalized === 'BLANCA' || normalized === 'AMARILLA') {
          data.tipoPlaca = normalized === 'BLANCA' ? 'Blanca' : 'Amarilla';
        }
      }

      if (data.placa && typeof data.placa === 'string') {
        data.placa = data.placa.toUpperCase();
      }
      if (data.capacidadCarga !== undefined) {
        data.capacidadCarga =
          typeof data.capacidadCarga === 'number' && data.capacidadCarga > 0
            ? new Prisma.Decimal(data.capacidadCarga)
            : null;
      }
      if (data.soatVencimiento && typeof data.soatVencimiento === 'string') {
        data.soatVencimiento = new Date(data.soatVencimiento);
      }
      if (
        data.tecnomecanicaVencimiento &&
        typeof data.tecnomecanicaVencimiento === 'string'
      ) {
        data.tecnomecanicaVencimiento = new Date(data.tecnomecanicaVencimiento);
      }
      if (
        data.seguroVencimiento &&
        typeof data.seguroVencimiento === 'string'
      ) {
        data.seguroVencimiento = new Date(data.seguroVencimiento);
      }

      // Validar integridad de propietario si se intenta actualizar
      if (data.idPropietario || data.propietarioExternoNombre) {
        // Si envia idPropietario, verificar que exista
        if (data.idPropietario) {
          const propietario = await this.prisma.usuarios.findUnique({
            where: { idUsuario: data.idPropietario as string },
          });
          if (!propietario) {
            throw new HttpException(
              {
                success: false,
                error: 'El propietario seleccionado no existe',
              },
              HttpStatus.BAD_REQUEST,
            );
          }
          // Limpiar datos externos si se asigna interno
          data.propietarioExternoNombre = null;
          data.propietarioExternoDocumento = null;
          data.propietarioExternoTelefono = null;
        } else if (data.propietarioExternoNombre) {
          // Si envia externo, limpiar interno
          data.idPropietario = null;

          // Validar que tenga documento al menos si es nuevo externo
          if (
            !data.propietarioExternoDocumento &&
            !existente.propietarioExternoDocumento
          ) {
            throw new HttpException(
              {
                success: false,
                error: 'Debe proporcionar el documento del propietario externo',
              },
              HttpStatus.BAD_REQUEST,
            );
          }
        }
      }

      const vehiculoActualizado = await this.prisma.vehiculos.update({
        where: { idVehiculo: id },
        data,
        include: {
          tipoVehiculo: true,
          marcaVehiculo: true,
        },
      });

      return {
        success: true,
        data: vehiculoActualizado,
        message: 'Vehículo actualizado exitosamente',
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      const prismaError = error as PrismaError;
      if (prismaError.code === 'P2002') {
        const target = prismaError.meta?.target?.[0];
        if (target === 'placa') {
          throw new HttpException(
            { success: false, error: 'La placa del vehículo ya existe' },
            HttpStatus.CONFLICT,
          );
        }
      }
      if (prismaError.code === 'P2025') {
        throw new HttpException(
          { success: false, error: 'Vehículo no encontrado' },
          HttpStatus.NOT_FOUND,
        );
      }
      const errorMessage =
        error instanceof Error ? error.message : 'Error desconocido';
      throw new HttpException(
        {
          success: false,
          error: 'Error al actualizar vehículo',
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
      const existente = await this.prisma.vehiculos.findUnique({
        where: { idVehiculo: id },
      });

      if (!existente) {
        throw new HttpException(
          { success: false, error: 'Vehículo no encontrado' },
          HttpStatus.NOT_FOUND,
        );
      }

      await this.prisma.vehiculos.delete({ where: { idVehiculo: id } });

      return {
        success: true,
        message: 'Vehículo eliminado exitosamente',
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      const prismaError = error as PrismaError;
      if (prismaError.code === 'P2025') {
        throw new HttpException(
          { success: false, error: 'Vehículo no encontrado' },
          HttpStatus.NOT_FOUND,
        );
      }
      const errorMessage =
        error instanceof Error ? error.message : 'Error desconocido';
      throw new HttpException(
        {
          success: false,
          error: 'Error al eliminar vehículo',
          message: errorMessage,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Realiza la operación de actualizar foto.
   * @param id - id parameter
   * @param file - file parameter
   * @returns El resultado de la operación.
   */
  async actualizarFoto(id: string, file?: Express.Multer.File) {
    try {
      const existente = await this.prisma.vehiculos.findUnique({
        where: { idVehiculo: id },
      });

      if (!existente) {
        throw new HttpException(
          { success: false, error: 'Vehículo no encontrado' },
          HttpStatus.NOT_FOUND,
        );
      }

      if (!file) {
        throw new HttpException(
          { success: false, error: 'No se recibió archivo de imagen' },
          HttpStatus.BAD_REQUEST,
        );
      }

      // Construir ruta relativa servida desde /uploads
      const relativePath = `/uploads/vehiculos/${file.filename}`;

      // Intentar borrar la foto anterior si existe
      if (existente.fotoUrl) {
        const prev = existente.fotoUrl.replace('/uploads/', '');
        const prevPath = join(process.cwd(), 'uploads', prev);
        try {
          if (existsSync(prevPath)) unlinkSync(prevPath);
        } catch {
          // si falla, no bloquear flujo
        }
      }

      const actualizado = await this.prisma.vehiculos.update({
        where: { idVehiculo: id },
        data: { fotoUrl: relativePath },
        include: { tipoVehiculo: true, marcaVehiculo: true },
      });

      return {
        success: true,
        data: actualizado,
        message: 'Foto del vehículo actualizada correctamente',
      };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      const errorMessage =
        error instanceof Error ? error.message : 'Error desconocido';
      throw new HttpException(
        {
          success: false,
          error: 'Error al actualizar foto del vehículo',
          message: errorMessage,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
