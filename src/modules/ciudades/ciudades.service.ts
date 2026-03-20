import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateCiudadDto } from './dto/create-ciudad.dto';

/**
 * Servicio de Ciudades
 * Contiene toda la lógica de negocio relacionada con ciudades
 */
@Injectable()
export class CiudadesService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Crea un nuevo registro en el sistema.
   * @param createCiudadDto - createCiudadDto parameter
   * @returns El resultado de la operación.
   */
  async create(createCiudadDto: CreateCiudadDto) {
    try {
      const ciudad = await this.prisma.ciudades.create({
        data: {
          nombreCiudad: createCiudadDto.nombreCiudad,
        },
      });

      return {
        success: true,
        data: ciudad,
        message: 'Ciudad creada exitosamente',
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          error: 'Error al crear ciudad',
          message: error instanceof Error ? error.message : 'Error desconocido',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Obtiene una lista de todos los registros.
   * @returns El resultado de la operación.
   */
  async findAll() {
    try {
      const ciudades = await this.prisma.ciudades.findMany({
        orderBy: { nombreCiudad: 'asc' },
        select: {
          idCiudad: true,
          nombreCiudad: true,
        },
      });

      return {
        success: true,
        data: ciudades,
        message: 'Ciudades obtenidas exitosamente',
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Error desconocido';
      throw new HttpException(
        {
          success: false,
          error: 'Error al obtener ciudades',
          message: errorMessage,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
