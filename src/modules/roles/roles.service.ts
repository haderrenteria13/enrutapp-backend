import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { v4 as uuidv4 } from 'uuid';
import { CreateRolDto, UpdateRolDto } from './dto';

// Interfaz para errores de Prisma
interface PrismaError extends Error {
  code?: string;
  meta?: {
    target?: string[];
  };
}

/**
 * Servicio de Roles
 * Contiene toda la lógica de negocio relacionada con roles
 */
@Injectable()
export class RolesService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Obtiene una lista de todos los registros.
   * @returns El resultado de la operación.
   */
  async findAll() {
    try {
      const roles = await this.prisma.roles.findMany({
        include: {
          usuarios: true,
        },
      });

      return {
        success: true,
        data: roles,
        message: 'Roles obtenidos exitosamente',
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Error desconocido';
      throw new HttpException(
        {
          success: false,
          error: 'Error al obtener roles',
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
      const rol = await this.prisma.roles.findUnique({
        where: { idRol: id },
        include: {
          usuarios: true,
        },
      });

      if (!rol) {
        throw new HttpException(
          {
            success: false,
            error: 'Rol no encontrado',
          },
          HttpStatus.NOT_FOUND,
        );
      }

      return {
        success: true,
        data: rol,
        message: 'Rol encontrado',
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
          error: 'Error al buscar rol',
          message: errorMessage,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Crea un nuevo registro en el sistema.
   * @param createRolDto - createRolDto parameter
   * @returns El resultado de la operación.
   */
  async create(createRolDto: CreateRolDto) {
    try {
      const data = {
        idRol: createRolDto.idRol || uuidv4(),
        nombreRol: createRolDto.nombreRol,
        descripcion: createRolDto.descripcion || null,
        estado:
          typeof createRolDto.estado === 'boolean' ? createRolDto.estado : true,
      };

      const nuevoRol = await this.prisma.$transaction(async (tx) => {
        const rol = await tx.roles.create({ data });

        if (createRolDto.permissions && createRolDto.permissions.length > 0) {
          const rolesPermisosData = createRolDto.permissions.map(
            (idPermiso) => ({
              idRol: rol.idRol,
              idPermiso,
            }),
          );
          await tx.rolesPermisos.createMany({
            data: rolesPermisosData,
          });
        }
        return rol;
      });

      return {
        success: true,
        data: nuevoRol,
        message: 'Rol creado exitosamente',
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      // Error de duplicado
      const prismaError = error as PrismaError;
      if (prismaError.code === 'P2002') {
        throw new HttpException(
          { success: false, error: 'El nombre del rol ya existe' },
          HttpStatus.CONFLICT,
        );
      }
      const errorMessage =
        error instanceof Error ? error.message : 'Error desconocido';
      throw new HttpException(
        {
          success: false,
          error: 'Error al crear rol',
          message: errorMessage,
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  /**
   * Actualiza un registro existente.
   * @param id - id parameter
   * @param updateRolDto - updateRolDto parameter
   * @returns El resultado de la operación.
   */
  async update(id: string, updateRolDto: UpdateRolDto) {
    try {
      const existente = await this.prisma.roles.findUnique({
        where: { idRol: id },
      });

      if (!existente) {
        throw new HttpException(
          { success: false, error: 'Rol no encontrado' },
          HttpStatus.NOT_FOUND,
        );
      }

      // Proteger rol Administrador
      if (existente.nombreRol?.toLowerCase() === 'administrador') {
        throw new HttpException(
          {
            success: false,
            error: 'No se puede editar el rol Administrador',
            message:
              'El rol Administrador está protegido y no puede ser modificado',
          },
          HttpStatus.FORBIDDEN,
        );
      }

      let permissions: string[] | undefined;

      // Permitir alias 'activo' desde frontend
      if ('activo' in updateRolDto && updateRolDto.activo !== undefined) {
        updateRolDto.estado = !!updateRolDto.activo;
        delete updateRolDto.activo;
      }

      // Extract permissions if present
      if ('permissions' in updateRolDto) {
        permissions = updateRolDto['permissions'];
        delete updateRolDto['permissions'];
      }

      // Transaction to update role and permissions if provided
      const result = await this.prisma.$transaction(async (tx) => {
        // 1. Update Role Details
        const rolActualizado = await tx.roles.update({
          where: { idRol: id },
          data: updateRolDto,
        });

        // 2. Update Permissions if provided
        if (permissions !== undefined) {
          // Delete old
          await tx.rolesPermisos.deleteMany({
            where: { idRol: id },
          });

          // Insert new
          if (Array.isArray(permissions) && permissions.length > 0) {
            const newPermissions = permissions.map((idPermiso) => ({
              idRol: id,
              idPermiso,
            }));
            await tx.rolesPermisos.createMany({
              data: newPermissions,
            });
          }
        }

        return rolActualizado;
      });

      return {
        success: true,
        data: result,
        message: 'Rol actualizado exitosamente',
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      const prismaError = error as PrismaError;
      if (prismaError.code === 'P2002') {
        throw new HttpException(
          { success: false, error: 'Nombre de rol duplicado' },
          HttpStatus.CONFLICT,
        );
      }
      if (prismaError.code === 'P2025') {
        throw new HttpException(
          { success: false, error: 'Rol no encontrado' },
          HttpStatus.NOT_FOUND,
        );
      }
      const errorMessage =
        error instanceof Error ? error.message : 'Error desconocido';
      throw new HttpException(
        {
          success: false,
          error: 'Error al actualizar rol',
          message: errorMessage,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Elimina un registro del sistema.
   * @param id - id parameter
   * @param cascade - cascade parameter
   * @returns El resultado de la operación.
   */
  async remove(id: string, cascade: boolean = false) {
    try {
      const existente = await this.prisma.roles.findUnique({
        where: { idRol: id },
        include: { usuarios: true },
      });

      if (!existente) {
        throw new HttpException(
          { success: false, error: 'Rol no encontrado' },
          HttpStatus.NOT_FOUND,
        );
      }

      if (
        existente.nombreRol === 'Administrador' ||
        existente.nombreRol === 'Admin'
      ) {
        throw new HttpException(
          {
            success: false,
            error: 'No se puede eliminar el rol Administrador',
          },
          HttpStatus.FORBIDDEN,
        );
      }

      if (!cascade && existente.usuarios && existente.usuarios.length > 0) {
        throw new HttpException(
          {
            success: false,
            error: 'No se puede eliminar un rol con usuarios asociados',
            data: {
              usuarios: existente.usuarios.map((u) => u.nombre),
            },
          },
          HttpStatus.CONFLICT,
        );
      }

      await this.prisma.$transaction(async (tx) => {
        // Si es cascada, manejar dependencias antes de eliminar
        if (cascade && existente.usuarios && existente.usuarios.length > 0) {
          const idsUsuarios = existente.usuarios.map((u) => u.idUsuario);

          // 1. Desvincular vehículos donde los usuarios son propietarios
          await tx.vehiculos.updateMany({
            where: { idPropietario: { in: idsUsuarios } },
            data: { idPropietario: null },
          });

          // 2. Encontrar conductores asociados a estos usuarios
          const conductores = await tx.conductores.findMany({
            where: { idUsuario: { in: idsUsuarios } },
            select: { idConductor: true },
          });

          if (conductores.length > 0) {
            const idsConductores = conductores.map((c) => c.idConductor);

            // 3. Desvincular vehículos asignados a estos conductores
            await tx.vehiculos.updateMany({
              where: { idConductorAsignado: { in: idsConductores } },
              data: { idConductorAsignado: null },
            });
          }

          // 4. Eliminar usuarios (cascada eliminará conductores y turnos)
          await tx.usuarios.deleteMany({
            where: { idRol: id },
          });
        }

        // 5. Eliminar el rol
        await tx.roles.delete({ where: { idRol: id } });
      });

      return {
        success: true,
        message: 'Rol eliminado exitosamente',
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      const prismaError = error as PrismaError;
      if (prismaError.code === 'P2025') {
        throw new HttpException(
          { success: false, error: 'Rol no encontrado' },
          HttpStatus.NOT_FOUND,
        );
      }
      const errorMessage =
        error instanceof Error ? error.message : 'Error desconocido';
      throw new HttpException(
        {
          success: false,
          error: 'Error al eliminar rol',
          message: errorMessage,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Realiza la operación de get all permissions.
   * @returns El resultado de la operación.
   */
  async getAllPermissions() {
    try {
      // Verificar si existen permisos
      // Asegurar que existan todos los permisos del sistema
      await this.seedPermissions();

      const permisos = await this.prisma.permisos.findMany({
        orderBy: { modulo: 'asc' },
      });

      // Agrupar por módulo
      const grouped = permisos.reduce(
        (acc, curr) => {
          const mod = curr.modulo || 'Otros';
          if (!acc[mod]) {
            acc[mod] = [];
          }
          acc[mod].push(curr);
          return acc;
        },
        {} as Record<string, typeof permisos>,
      );

      return {
        success: true,
        data: grouped,
        message: 'Permisos obtenidos exitosamente',
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Error desconocido';
      throw new HttpException(
        {
          success: false,
          error: 'Error al obtener permisos',
          message: errorMessage,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Realiza la operación de get role permissions.
   * @param idRol - idRol parameter
   * @returns El resultado de la operación.
   */
  async getRolePermissions(idRol: string) {
    try {
      const permisos = await this.prisma.rolesPermisos.findMany({
        where: { idRol },
        include: { permiso: true },
      });

      return {
        success: true,
        data: permisos.map((rp) => rp.permiso),
        message: 'Permisos del rol obtenidos',
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Error desconocido';
      throw new HttpException(
        {
          success: false,
          error: 'Error al obtener permisos del rol',
          message: errorMessage,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Realiza la operación de update role permissions.
   * @param idRol - idRol parameter
   * @param permissionIds - permissionIds parameter
   * @returns El resultado de la operación.
   */
  async updateRolePermissions(idRol: string, permissionIds: string[]) {
    try {
      // Verificar que el rol existe
      const rol = await this.prisma.roles.findUnique({
        where: { idRol },
      });

      if (!rol) {
        throw new HttpException(
          { success: false, error: 'Rol no encontrado' },
          HttpStatus.NOT_FOUND,
        );
      }

      // No permitir modificar Admin
      if (rol.nombreRol === 'Administrador' || rol.nombreRol === 'Admin') {
        throw new HttpException(
          {
            success: false,
            error: 'No se pueden modificar permisos del Administrador',
          },
          HttpStatus.FORBIDDEN,
        );
      }

      // Transacción para reemplazar permisos
      await this.prisma.$transaction(async (tx) => {
        // 1. Eliminar permisos actuales
        await tx.rolesPermisos.deleteMany({
          where: { idRol },
        });

        // 2. Insertar nuevos permisos
        if (permissionIds.length > 0) {
          const newPermissions = permissionIds.map((idPermiso) => ({
            idRol,
            idPermiso,
          }));
          await tx.rolesPermisos.createMany({
            data: newPermissions,
          });
        }
      });

      return {
        success: true,
        message: 'Permisos actualizados exitosamente',
      };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      const errorMessage =
        error instanceof Error ? error.message : 'Error desconocido';
      throw new HttpException(
        {
          success: false,
          error: 'Error al actualizar permisos',
          message: errorMessage,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Realiza la operación de seed permissions.
   * @returns El resultado de la operación.
   */
  private async seedPermissions() {
    const modules = [
      'Dashboard',
      'Conductores',
      'Vehiculos',
      'Usuarios',
      'Roles',
      'Rutas',
      'Ubicaciones',
      'Turnos',
      'Turnos',
      'Finanzas',
      'Tracking',
      'Encomiendas',
      'Clientes',
      'Contratos',
    ];

    const permissionsData = modules.map((mod) => ({
      idPermiso: uuidv4(),
      modulo: mod,
      nombre: `Acceso a ${mod}`,
      descripcion: `Permite acceder al módulo de ${mod}`,
      codigo: `VER_${mod.toUpperCase()}`,
    }));

    for (const data of permissionsData) {
      const exists = await this.prisma.permisos.findUnique({
        where: { codigo: data.codigo },
      });

      if (!exists) {
        await this.prisma.permisos.create({
          data,
        });
      }
    }
  }
}
