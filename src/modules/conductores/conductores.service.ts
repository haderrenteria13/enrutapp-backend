import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { v4 as uuidv4 } from 'uuid';
import {
  CreateConductorDto,
  UpdateConductorDto,
  CompletarPerfilConductorDto,
} from './dto/index';

// Interfaz para errores de Prisma
interface PrismaError extends Error {
  code?: string;
  meta?: {
    target?: string[];
  };
}

/**
 * Servicio de Conductores
 * Contiene toda la lógica de negocio relacionada con conductores
 * Los conductores son una extensión de usuarios con rol de conductor
 */
@Injectable()
export class ConductoresService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Realiza la operación de es licencia vigente.
   * @param fechaVencimiento - fechaVencimiento parameter
   * @returns El resultado de la operación.
   */
  private esLicenciaVigente(fechaVencimiento: Date): boolean {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    return fechaVencimiento >= hoy;
  }

  /**
   * Realiza la operación de es licencia proxima a vencer.
   * @param fechaVencimiento - fechaVencimiento parameter
   * @returns El resultado de la operación.
   */
  private esLicenciaProximaAVencer(fechaVencimiento: Date): boolean {
    const hoy = new Date();
    const diasRestantes = Math.ceil(
      (fechaVencimiento.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24),
    );
    return diasRestantes > 0 && diasRestantes <= 30;
  }

  /**
   * Obtiene una lista de todos los registros.
   * @returns El resultado de la operación.
   */
  async findAll() {
    try {
      // Obtener todos los usuarios con rol "Conductor"
      const usuariosConductores = await this.prisma.usuarios.findMany({
        where: {
          rol: {
            nombreRol: 'Conductor',
          },
        },
        include: {
          ciudad: true,
          rol: true,
          conductor: true,
        },
        orderBy: {
          nombre: 'asc',
        },
      });

      // Mapear los datos para que coincidan con la estructura esperada en el frontend
      const conductoresConEstado = usuariosConductores.map((usuario) => {
        const conductorData = usuario.conductor;

        return {
          idConductor: conductorData?.idConductor || null,
          idUsuario: usuario.idUsuario,
          numeroLicencia: conductorData?.numeroLicencia || null,
          fechaVencimientoLicencia:
            conductorData?.fechaVencimientoLicencia || null,
          observaciones: conductorData?.observaciones || null,
          estado: usuario.estado,
          createdAt: conductorData?.createdAt || new Date(),
          updatedAt: conductorData?.updatedAt || new Date(),
          usuario: {
            idUsuario: usuario.idUsuario,
            nombre: usuario.nombre,
            numDocumento: usuario.numDocumento,
            telefono: usuario.telefono,
            correo: usuario.correo,
            foto: usuario.foto,
            direccion: usuario.direccion,
            estado: usuario.estado,
            ciudad: usuario.ciudad,
            tipoDoc: usuario.tipoDoc,
            rol: usuario.rol,
          },
          categoriaLicencia: conductorData?.categoriaLicencia || null,
          licenciaVigente: conductorData?.fechaVencimientoLicencia
            ? this.esLicenciaVigente(conductorData.fechaVencimientoLicencia)
            : null,
          licenciaProximaAVencer: conductorData?.fechaVencimientoLicencia
            ? this.esLicenciaProximaAVencer(
                conductorData.fechaVencimientoLicencia,
              )
            : null,
        };
      });

      return {
        success: true,
        data: conductoresConEstado,
        message: 'Conductores obtenidos exitosamente',
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Error desconocido';
      throw new HttpException(
        {
          success: false,
          error: 'Error al obtener conductores',
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
      const conductor = await this.prisma.conductores.findUnique({
        where: { idConductor: id },
        include: {
          usuario: {
            select: {
              idUsuario: true,
              nombre: true,
              numDocumento: true,
              telefono: true,
              correo: true,
              foto: true,
              direccion: true,
              estado: true,
              tipoDoc: true,
              ciudad: {
                select: {
                  idCiudad: true,
                  nombreCiudad: true,
                },
              },
              vehiculosPropios: {
                select: {
                  idVehiculo: true,
                  placa: true,
                  linea: true,
                  modelo: true,
                  color: true,
                  tipoPlaca: true,
                  estado: true,
                  tipoVehiculo: {
                    select: {
                      nombreTipoVehiculo: true,
                    },
                  },
                  marcaVehiculo: {
                    select: {
                      nombreMarca: true,
                    },
                  },
                },
              },
            },
          },
          vehiculosAsignados: {
            select: {
              idVehiculo: true,
              placa: true,
              linea: true,
              modelo: true,
              color: true,
              tipoPlaca: true,
              estado: true,
              tipoVehiculo: {
                select: {
                  nombreTipoVehiculo: true,
                },
              },
              marcaVehiculo: {
                select: {
                  nombreMarca: true,
                },
              },
            },
          },
          turnos: {
            select: {
              idTurno: true,
              fecha: true,
              estado: true,
              vehiculo: {
                select: {
                  idVehiculo: true,
                  placa: true,
                  linea: true,
                  modelo: true,
                  color: true,
                  tipoPlaca: true,
                  estado: true,
                  tipoVehiculo: {
                    select: {
                      nombreTipoVehiculo: true,
                    },
                  },
                  marcaVehiculo: {
                    select: {
                      nombreMarca: true,
                    },
                  },
                },
              },
            },
            orderBy: {
              fecha: 'desc',
            },
          },
        },
      });

      if (!conductor) {
        throw new HttpException(
          {
            success: false,
            error: 'Conductor no encontrado',
          },
          HttpStatus.NOT_FOUND,
        );
      }

      const conductorConEstado = {
        ...conductor,
        licenciaVigente: this.esLicenciaVigente(
          conductor.fechaVencimientoLicencia,
        ),
        licenciaProximaAVencer: this.esLicenciaProximaAVencer(
          conductor.fechaVencimientoLicencia,
        ),
      };

      return {
        success: true,
        data: conductorConEstado,
        message: 'Conductor encontrado',
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
          error: 'Error al buscar conductor',
          message: errorMessage,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Crea un nuevo registro en el sistema.
   * @param createConductorDto - createConductorDto parameter
   * @returns El resultado de la operación.
   */
  async create(createConductorDto: CreateConductorDto) {
    try {
      // Verificar que el usuario existe
      const usuario = await this.prisma.usuarios.findUnique({
        where: { idUsuario: createConductorDto.idUsuario },
        include: {
          rol: true,
        },
      });

      if (!usuario) {
        throw new HttpException(
          { success: false, error: 'El usuario especificado no existe' },
          HttpStatus.NOT_FOUND,
        );
      }

      // Verificar que el usuario tiene rol de conductor
      if (usuario.rol.nombreRol !== 'Conductor') {
        throw new HttpException(
          {
            success: false,
            error:
              'El usuario debe tener rol de conductor para ser registrado como conductor',
          },
          HttpStatus.BAD_REQUEST,
        );
      }

      // Verificar que el usuario no está ya registrado como conductor
      const conductorExistente = await this.prisma.conductores.findUnique({
        where: { idUsuario: createConductorDto.idUsuario },
      });

      if (conductorExistente) {
        throw new HttpException(
          {
            success: false,
            error: 'Este usuario ya está registrado como conductor',
          },
          HttpStatus.CONFLICT,
        );
      }

      const data = {
        idConductor: createConductorDto.idConductor || uuidv4(),
        idUsuario: createConductorDto.idUsuario,
        numeroLicencia: createConductorDto.numeroLicencia.toUpperCase(),
        categoriaLicencia: createConductorDto.categoriaLicencia,
        fechaVencimientoLicencia: new Date(
          createConductorDto.fechaVencimientoLicencia,
        ),
        observaciones: createConductorDto.observaciones || null,
        estado: true,
      };

      const nuevoConductor = await this.prisma.conductores.create({
        data,
        include: {
          usuario: {
            select: {
              idUsuario: true,
              nombre: true,
              numDocumento: true,
              telefono: true,
              correo: true,
              foto: true,
              direccion: true,
              estado: true,
              tipoDoc: true,
              ciudad: {
                select: {
                  idCiudad: true,
                  nombreCiudad: true,
                },
              },
            },
          },
        },
      });

      const conductorConEstado = {
        ...nuevoConductor,
        licenciaVigente: this.esLicenciaVigente(
          nuevoConductor.fechaVencimientoLicencia,
        ),
        licenciaProximaAVencer: this.esLicenciaProximaAVencer(
          nuevoConductor.fechaVencimientoLicencia,
        ),
      };

      return {
        success: true,
        data: conductorConEstado,
        message: 'Conductor creado exitosamente',
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      // Error de duplicado
      const prismaError = error as PrismaError;
      if (prismaError.code === 'P2002') {
        const target = prismaError.meta?.target?.[0];
        if (target === 'numeroLicencia') {
          throw new HttpException(
            {
              success: false,
              error: 'El número de licencia ya está registrado',
            },
            HttpStatus.CONFLICT,
          );
        }
        if (target === 'idUsuario') {
          throw new HttpException(
            {
              success: false,
              error: 'Este usuario ya está registrado como conductor',
            },
            HttpStatus.CONFLICT,
          );
        }
        throw new HttpException(
          { success: false, error: 'El conductor ya existe' },
          HttpStatus.CONFLICT,
        );
      }
      const errorMessage =
        error instanceof Error ? error.message : 'Error desconocido';
      throw new HttpException(
        {
          success: false,
          error: 'Error al crear conductor',
          message: errorMessage,
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  /**
   * Actualiza un registro existente.
   * @param id - id parameter
   * @param updateConductorDto - updateConductorDto parameter
   * @returns El resultado de la operación.
   */
  async update(id: string, updateConductorDto: UpdateConductorDto) {
    try {
      const existente = await this.prisma.conductores.findUnique({
        where: { idConductor: id },
      });

      if (!existente) {
        throw new HttpException(
          { success: false, error: 'Conductor no encontrado' },
          HttpStatus.NOT_FOUND,
        );
      }

      // Preparar datos para actualización
      const data: Record<string, unknown> = {};

      if (updateConductorDto.numeroLicencia) {
        data.numeroLicencia = updateConductorDto.numeroLicencia.toUpperCase();
      }

      if (updateConductorDto.categoriaLicencia) {
        data.categoriaLicencia = updateConductorDto.categoriaLicencia;
      }

      if (updateConductorDto.fechaVencimientoLicencia) {
        data.fechaVencimientoLicencia = new Date(
          updateConductorDto.fechaVencimientoLicencia,
        );
      }

      if (updateConductorDto.observaciones !== undefined) {
        data.observaciones = updateConductorDto.observaciones || null;
      }

      const conductorActualizado = await this.prisma.conductores.update({
        where: { idConductor: id },
        data,
        include: {
          usuario: {
            select: {
              idUsuario: true,
              nombre: true,
              numDocumento: true,
              telefono: true,
              correo: true,
              foto: true,
              direccion: true,
              estado: true,
              tipoDoc: true,
              ciudad: {
                select: {
                  idCiudad: true,
                  nombreCiudad: true,
                },
              },
            },
          },
        },
      });

      const conductorConEstado = {
        ...conductorActualizado,
        licenciaVigente: this.esLicenciaVigente(
          conductorActualizado.fechaVencimientoLicencia,
        ),
        licenciaProximaAVencer: this.esLicenciaProximaAVencer(
          conductorActualizado.fechaVencimientoLicencia,
        ),
      };

      return {
        success: true,
        data: conductorConEstado,
        message: 'Conductor actualizado exitosamente',
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      const prismaError = error as PrismaError;
      if (prismaError.code === 'P2002') {
        const target = prismaError.meta?.target?.[0];
        if (target === 'numeroLicencia') {
          throw new HttpException(
            {
              success: false,
              error: 'El número de licencia ya está registrado',
            },
            HttpStatus.CONFLICT,
          );
        }
      }
      if (prismaError.code === 'P2025') {
        throw new HttpException(
          { success: false, error: 'Conductor no encontrado' },
          HttpStatus.NOT_FOUND,
        );
      }
      const errorMessage =
        error instanceof Error ? error.message : 'Error desconocido';
      throw new HttpException(
        {
          success: false,
          error: 'Error al actualizar conductor',
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
      const existente = await this.prisma.conductores.findUnique({
        where: { idConductor: id },
      });

      if (!existente) {
        throw new HttpException(
          { success: false, error: 'Conductor no encontrado' },
          HttpStatus.NOT_FOUND,
        );
      }

      await this.prisma.conductores.delete({ where: { idConductor: id } });

      return {
        success: true,
        message: 'Conductor eliminado exitosamente',
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      const prismaError = error as PrismaError;
      if (prismaError.code === 'P2025') {
        throw new HttpException(
          { success: false, error: 'Conductor no encontrado' },
          HttpStatus.NOT_FOUND,
        );
      }
      const errorMessage =
        error instanceof Error ? error.message : 'Error desconocido';
      throw new HttpException(
        {
          success: false,
          error: 'Error al eliminar conductor',
          message: errorMessage,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Realiza la operación de verificar licencia.
   * @param id - id parameter
   * @returns El resultado de la operación.
   */
  async verificarLicencia(id: string) {
    try {
      const conductor = await this.prisma.conductores.findUnique({
        where: { idConductor: id },
        select: {
          idConductor: true,
          numeroLicencia: true,
          fechaVencimientoLicencia: true,
          categoriaLicencia: true,
          usuario: {
            select: {
              nombre: true,
              numDocumento: true,
            },
          },
        },
      });

      if (!conductor) {
        throw new HttpException(
          { success: false, error: 'Conductor no encontrado' },
          HttpStatus.NOT_FOUND,
        );
      }

      const vigente = this.esLicenciaVigente(
        conductor.fechaVencimientoLicencia,
      );
      const proximaAVencer = this.esLicenciaProximaAVencer(
        conductor.fechaVencimientoLicencia,
      );

      const hoy = new Date();
      const diasRestantes = Math.ceil(
        (conductor.fechaVencimientoLicencia.getTime() - hoy.getTime()) /
          (1000 * 60 * 60 * 24),
      );

      let estado: string;
      if (!vigente) {
        estado = 'VENCIDA';
      } else if (proximaAVencer) {
        estado = 'PROXIMA_A_VENCER';
      } else {
        estado = 'VIGENTE';
      }

      return {
        success: true,
        data: {
          ...conductor,
          licenciaVigente: vigente,
          licenciaProximaAVencer: proximaAVencer,
          diasRestantes: vigente ? Math.max(0, diasRestantes) : 0,
          estado,
          puedeViajar: vigente,
        },
        message: `Licencia ${estado.toLowerCase().replace('_', ' ')}`,
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
          error: 'Error al verificar licencia',
          message: errorMessage,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Realiza la operación de verificar perfil completo.
   * @param idUsuario - idUsuario parameter
   * @returns El resultado de la operación.
   */
  async verificarPerfilCompleto(idUsuario: string) {
    try {
      // Verificar si el usuario existe
      const usuario = await this.prisma.usuarios.findUnique({
        where: { idUsuario },
        include: {
          rol: true,
        },
      });

      if (!usuario) {
        throw new HttpException(
          {
            success: false,
            error: 'Usuario no encontrado',
          },
          HttpStatus.NOT_FOUND,
        );
      }

      // Verificar si el usuario tiene rol de conductor
      if (usuario.rol.nombreRol !== 'Conductor') {
        return {
          success: true,
          data: {
            esCondutor: false,
            completado: true, // No aplica para no conductores
            conductor: null,
          },
          message: 'El usuario no tiene rol de conductor',
        };
      }

      // Buscar si existe registro de conductor
      const conductor = await this.prisma.conductores.findUnique({
        where: { idUsuario },
        include: {
          usuario: {
            select: {
              idUsuario: true,
              nombre: true,
              numDocumento: true,
              telefono: true,
              correo: true,
              foto: true,
            },
          },
        },
      });

      if (!conductor) {
        return {
          success: true,
          data: {
            esConductor: true,
            completado: false,
            conductor: null,
          },
          message: 'El conductor debe completar su perfil',
        };
      }

      return {
        success: true,
        data: {
          esConductor: true,
          completado: true,
          conductor: {
            ...conductor,
            licenciaVigente: this.esLicenciaVigente(
              conductor.fechaVencimientoLicencia,
            ),
            licenciaProximaAVencer: this.esLicenciaProximaAVencer(
              conductor.fechaVencimientoLicencia,
            ),
          },
        },
        message: 'Perfil de conductor completo',
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
          error: 'Error al verificar perfil de conductor',
          message: errorMessage,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Realiza la operación de completar perfil.
   * @param idUsuario - idUsuario parameter
   * @param dto - dto parameter
   * @returns El resultado de la operación.
   */
  async completarPerfil(idUsuario: string, dto: CompletarPerfilConductorDto) {
    try {
      // Verificar si el usuario existe y tiene rol de conductor
      const usuario = await this.prisma.usuarios.findUnique({
        where: { idUsuario },
        include: {
          rol: true,
        },
      });

      if (!usuario) {
        throw new HttpException(
          {
            success: false,
            error: 'Usuario no encontrado',
          },
          HttpStatus.NOT_FOUND,
        );
      }

      if (usuario.rol.nombreRol !== 'Conductor') {
        throw new HttpException(
          {
            success: false,
            error: 'El usuario no tiene rol de conductor',
          },
          HttpStatus.BAD_REQUEST,
        );
      }

      // Verificar si ya existe un conductor con este idUsuario
      const conductorExistente = await this.prisma.conductores.findUnique({
        where: { idUsuario },
      });

      if (conductorExistente) {
        throw new HttpException(
          {
            success: false,
            error: 'El perfil de conductor ya está completo',
          },
          HttpStatus.CONFLICT,
        );
      }

      // Validar fecha de vencimiento (debe ser futura)
      const fechaVencimiento = new Date(dto.fechaVencimientoLicencia);
      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0);

      if (fechaVencimiento < hoy) {
        throw new HttpException(
          {
            success: false,
            error: 'La fecha de vencimiento debe ser mayor a la fecha actual',
          },
          HttpStatus.BAD_REQUEST,
        );
      }

      // El número de licencia es el mismo que el número de documento
      const numeroLicencia = usuario.numDocumento;

      if (!numeroLicencia) {
        throw new HttpException(
          {
            success: false,
            error:
              'El usuario debe tener número de documento para completar el perfil de conductor',
          },
          HttpStatus.BAD_REQUEST,
        );
      }

      // Verificar si ya existe otro conductor con el mismo número de licencia
      const licenciaExistente = await this.prisma.conductores.findUnique({
        where: { numeroLicencia },
      });

      if (licenciaExistente) {
        throw new HttpException(
          {
            success: false,
            error: 'Ya existe un conductor con este número de licencia',
          },
          HttpStatus.CONFLICT,
        );
      }

      // Crear registro de conductor
      // El idConductor se genera automáticamente con @default(uuid()) en el schema
      const nuevoConductor = await this.prisma.conductores.create({
        data: {
          idUsuario,
          categoriaLicencia: dto.categoriaLicencia,
          numeroLicencia,
          fechaVencimientoLicencia: fechaVencimiento,
          observaciones: dto.observaciones || null,
        },
        include: {
          usuario: {
            select: {
              idUsuario: true,
              nombre: true,
              numDocumento: true,
              telefono: true,
              correo: true,
              foto: true,
            },
          },
        },
      });

      return {
        success: true,
        data: {
          ...nuevoConductor,
          licenciaVigente: this.esLicenciaVigente(
            nuevoConductor.fechaVencimientoLicencia,
          ),
          licenciaProximaAVencer: this.esLicenciaProximaAVencer(
            nuevoConductor.fechaVencimientoLicencia,
          ),
        },
        message: 'Perfil de conductor completado exitosamente',
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      // Manejo de errores de Prisma
      const prismaError = error as PrismaError;
      if (prismaError.code === 'P2002') {
        throw new HttpException(
          {
            success: false,
            error: 'El número de licencia ya está registrado',
          },
          HttpStatus.CONFLICT,
        );
      }

      const errorMessage =
        error instanceof Error ? error.message : 'Error desconocido';
      throw new HttpException(
        {
          success: false,
          error: 'Error al completar perfil de conductor',
          message: errorMessage,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
