import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Put,
  Delete,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBadRequestResponse,
  ApiNotFoundResponse,
  ApiUnauthorizedResponse,
  ApiForbiddenResponse,
  ApiBody,
} from '@nestjs/swagger';
import { RolesService } from './roles.service';
import { Public } from '../../common/decorators';
import { CreateRolDto, UpdateRolDto, UpdateRolePermissionsDto } from './dto';

/**
 * Controlador de Roles
 * Maneja las operaciones CRUD de roles del sistema
 */
@ApiTags('Roles')
@ApiBearerAuth('JWT-auth')
@Controller('roles')
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  /**
   * Obtiene una lista de todos los registros.
   * @returns El resultado de la operación.
   */
  @Public()
  @Get()
  @ApiOperation({
    summary: 'Listar todos los roles',
    description: 'Obtiene la lista completa de roles disponibles en el sistema',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de roles obtenida exitosamente',
    schema: {
      example: {
        success: true,
        data: [
          {
            idRol: '550e8400-e29b-41d4-a716-446655440001',
            nombreRol: 'Admin',
            descripcion: 'Administrador del sistema',
            estado: true,
          },
          {
            idRol: '550e8400-e29b-41d4-a716-446655440002',
            nombreRol: 'Conductor',
            descripcion: 'Rol para conductores',
            estado: true,
          },
        ],
      },
    },
  })
  async findAll() {
    return this.rolesService.findAll();
  }

  /**
   * Realiza la operación de get all permissions.
   * @returns El resultado de la operación.
   */
  @Public()
  @Get('permissions-list')
  @ApiOperation({
    summary: 'Listar todos los permisos disponibles',
    description: 'Devuelve todos los permisos agrupados por módulo',
  })
  async getAllPermissions() {
    return this.rolesService.getAllPermissions();
  }

  /**
   * Obtiene un registro por su identificador único.
   * @param id - id parameter
   * @returns El resultado de la operación.
   */
  @Get(':id')
  @ApiOperation({
    summary: 'Obtener rol por ID',
    description: 'Obtiene la información detallada de un rol específico',
  })
  @ApiParam({
    name: 'id',
    description: 'ID del rol (UUID)',
    example: '550e8400-e29b-41d4-a716-446655440001',
  })
  @ApiResponse({
    status: 200,
    description: 'Rol encontrado',
    schema: {
      example: {
        success: true,
        data: {
          idRol: '550e8400-e29b-41d4-a716-446655440001',
          nombreRol: 'Admin',
          descripcion: 'Administrador del sistema',
          estado: true,
        },
      },
    },
  })
  @ApiNotFoundResponse({
    description: 'Rol no encontrado',
  })
  @ApiUnauthorizedResponse({
    description: 'Token no válido o expirado',
  })
  async findOne(@Param('id') id: string) {
    return this.rolesService.findOne(id);
  }

  /**
   * Crea un nuevo registro en el sistema.
   * @param createRolDto - createRolDto parameter
   * @returns El resultado de la operación.
   */
  @Public()
  @Post()
  @ApiOperation({
    summary: 'Crear nuevo rol',
    description: 'Registra un nuevo rol en el sistema con sus permisos',
  })
  @ApiResponse({
    status: 201,
    description: 'Rol creado exitosamente',
    schema: {
      example: {
        success: true,
        data: {
          idRol: '550e8400-e29b-41d4-a716-446655440003',
          nombreRol: 'Conductor',
          descripcion: 'Rol para conductores de vehículos',
          estado: true,
        },
        message: 'Rol creado exitosamente',
      },
    },
  })
  @ApiBadRequestResponse({
    description: 'Datos inválidos o rol ya existe',
  })
  async create(@Body() createRolDto: CreateRolDto) {
    return this.rolesService.create(createRolDto);
  }

  /**
   * Actualiza un registro existente.
   * @param id - id parameter
   * @param updateRolDto - updateRolDto parameter
   * @returns El resultado de la operación.
   */
  @Put(':id')
  @ApiOperation({
    summary: 'Actualizar rol',
    description:
      'Actualiza la información de un rol existente. No permite modificar el rol Admin.',
  })
  @ApiParam({
    name: 'id',
    description: 'ID del rol a actualizar (UUID)',
    example: '550e8400-e29b-41d4-a716-446655440002',
  })
  @ApiResponse({
    status: 200,
    description: 'Rol actualizado exitosamente',
    schema: {
      example: {
        success: true,
        message: 'Rol actualizado correctamente',
      },
    },
  })
  @ApiNotFoundResponse({
    description: 'Rol no encontrado',
  })
  @ApiForbiddenResponse({
    description: 'No se puede modificar el rol Admin',
  })
  @ApiUnauthorizedResponse({
    description: 'Token no válido o expirado',
  })
  @ApiBadRequestResponse({
    description: 'Datos inválidos',
  })
  async update(@Param('id') id: string, @Body() updateRolDto: UpdateRolDto) {
    return this.rolesService.update(id, updateRolDto);
  }

  /**
   * Elimina un registro del sistema.
   * @param id - id parameter
   * @param cascade - cascade parameter
   * @returns El resultado de la operación.
   */
  @Delete(':id')
  @ApiOperation({
    summary: 'Eliminar rol',
    description:
      'Elimina un rol del sistema. No permite eliminar el rol Admin.',
  })
  @ApiParam({
    name: 'id',
    description: 'ID del rol a eliminar (UUID)',
    example: '550e8400-e29b-41d4-a716-446655440002',
  })
  @ApiResponse({
    status: 200,
    description: 'Rol eliminado exitosamente',
    schema: {
      example: {
        success: true,
        message: 'Rol eliminado correctamente',
      },
    },
  })
  @ApiNotFoundResponse({
    description: 'Rol no encontrado',
  })
  @ApiForbiddenResponse({
    description: 'No se puede eliminar el rol Admin',
  })
  @ApiUnauthorizedResponse({
    description: 'Token no válido o expirado',
  })
  async remove(@Param('id') id: string, @Query('cascade') cascade?: string) {
    return this.rolesService.remove(id, cascade === 'true');
  }
  /**
   * Realiza la operación de get role permissions.
   * @param id - id parameter
   * @returns El resultado de la operación.
   */
  @Get(':id/permissions')
  @ApiOperation({
    summary: 'Obtener permisos de un rol',
    description: 'Devuelve la lista de permisos asignados a un rol específico',
  })
  async getRolePermissions(@Param('id') id: string) {
    return this.rolesService.getRolePermissions(id);
  }

  /**
   * Realiza la operación de update role permissions.
   * @param id - id parameter
   * @param updateDto - updateDto parameter
   * @returns El resultado de la operación.
   */
  @Put(':id/permissions')
  @ApiOperation({
    summary: 'Actualizar permisos de un rol',
    description: 'Reemplaza los permisos asignados a un rol',
  })
  @ApiBody({ type: UpdateRolePermissionsDto })
  async updateRolePermissions(
    @Param('id') id: string,
    @Body() updateDto: UpdateRolePermissionsDto,
  ) {
    return this.rolesService.updateRolePermissions(id, updateDto.permissions);
  }
}
