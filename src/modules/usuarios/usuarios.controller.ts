import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Put,
  Delete,
  Query,
  Request,
  UseGuards,
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
} from '@nestjs/swagger';
import { UsuariosService } from './usuarios.service';
import { Public } from '../../common/decorators';
import {
  CreateUsuarioDto,
  UpdateUsuarioDto,
  CompletarPerfilClienteDto,
} from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

/**
 * Controlador de Usuarios
 * Maneja las operaciones CRUD de usuarios
 */
@ApiTags('Usuarios')
@ApiBearerAuth('JWT-auth')
@Controller('usuarios')
export class UsuariosController {
  constructor(private readonly usuariosService: UsuariosService) {}

  /**
   * Realiza la operación de verificar perfil cliente.
   * @param req - req parameter
   * @returns El resultado de la operación.
   */
  @UseGuards(JwtAuthGuard)
  @Get('verificar-perfil/me')
  @ApiOperation({
    summary: 'Verificar perfil de cliente del usuario autenticado',
    description:
      'Verifica si el usuario autenticado con rol Cliente tiene su información básica completa (documento, dirección, teléfono, ciudad).',
  })
  @ApiResponse({
    status: 200,
    description: 'Estado del perfil verificado',
  })
  @ApiUnauthorizedResponse({
    description: 'Token no válido o expirado',
  })
  async verificarPerfilCliente(
    @Request() req: { user: { idUsuario: string } },
  ) {
    const idUsuario = req.user.idUsuario;
    return this.usuariosService.verificarPerfilCliente(idUsuario);
  }

  /**
   * Realiza la operación de completar perfil cliente.
   * @param req - req parameter
   * @param dto - dto parameter
   * @returns El resultado de la operación.
   */
  @UseGuards(JwtAuthGuard)
  @Post('completar-perfil/me')
  @ApiOperation({
    summary: 'Completar perfil de cliente',
    description:
      'Permite que un usuario con rol Cliente complete su información básica faltante.',
  })
  @ApiResponse({
    status: 201,
    description: 'Perfil de cliente completado exitosamente',
  })
  @ApiBadRequestResponse({
    description: 'Datos inválidos o usuario sin rol de cliente',
  })
  @ApiUnauthorizedResponse({
    description: 'Token no válido o expirado',
  })
  async completarPerfilCliente(
    @Request() req: { user: { idUsuario: string } },
    @Body() dto: CompletarPerfilClienteDto,
  ) {
    const idUsuario = req.user.idUsuario;
    return this.usuariosService.completarPerfilCliente(idUsuario, dto);
  }

  /**
   * Realiza la operación de check email.
   * @param email - email parameter
   * @returns El resultado de la operación.
   */
  @Public()
  @Get('check-email/:email')
  @ApiOperation({
    summary: 'Verificar disponibilidad de correo',
    description:
      'Verifica si un correo electrónico ya está registrado en el sistema',
  })
  @ApiParam({
    name: 'email',
    description: 'Correo electrónico a verificar',
    example: 'usuario@example.com',
  })
  @ApiResponse({
    status: 200,
    description: 'Verificación completada',
    schema: {
      example: {
        exists: true,
        message: 'El correo ya está registrado',
      },
    },
  })
  async checkEmail(@Param('email') email: string) {
    return this.usuariosService.checkEmailExists(email);
  }

  /**
   * Realiza la operación de check document.
   * @param tipo - tipo parameter
   * @param numero - numero parameter
   * @returns El resultado de la operación.
   */
  @Public()
  @Get('check-document/:tipo/:numero')
  @ApiOperation({
    summary: 'Verificar documento de identidad',
    description: 'Verifica si un número de documento ya está registrado',
  })
  @ApiParam({
    name: 'tipo',
    description: 'Tipo de documento (UUID)',
    example: '550e8400-e29b-41d4-a716-446655440002',
  })
  @ApiParam({
    name: 'numero',
    description: 'Número del documento',
    example: '1234567890',
  })
  @ApiResponse({
    status: 200,
    description: 'Verificación completada',
    schema: {
      example: {
        exists: false,
        message: 'El documento está disponible',
      },
    },
  })
  async checkDocument(
    @Param('tipo') tipo: string,
    @Param('numero') numero: string,
  ) {
    return this.usuariosService.checkDocumentExists(numero);
  }

  /**
   * Obtiene una lista de todos los registros.
   * @param rol - rol parameter
   * @returns El resultado de la operación.
   */
  @Get()
  @ApiOperation({
    summary: 'Listar todos los usuarios',
    description:
      'Obtiene la lista completa de usuarios registrados en el sistema',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de usuarios obtenida exitosamente',
    schema: {
      example: {
        success: true,
        data: [
          {
            idUsuario: '550e8400-e29b-41d4-a716-446655440000',
            nombre: 'Juan Pérez',
            correo: 'juan@example.com',
            telefono: '+57 3001234567',
            estado: true,
          },
        ],
      },
    },
  })
  @ApiUnauthorizedResponse({
    description: 'Token no válido o expirado',
  })
  @Public()
  async findAll(@Query('rol') rol?: string) {
    return this.usuariosService.findAll({ rol });
  }

  /**
   * Obtiene un registro por su identificador único.
   * @param id - id parameter
   * @returns El resultado de la operación.
   */
  @Get(':id')
  @ApiOperation({
    summary: 'Obtener usuario por ID',
    description: 'Obtiene la información detallada de un usuario específico',
  })
  @ApiParam({
    name: 'id',
    description: 'ID del usuario (UUID)',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({
    status: 200,
    description: 'Usuario encontrado',
    schema: {
      example: {
        success: true,
        data: {
          idUsuario: '550e8400-e29b-41d4-a716-446655440000',
          nombre: 'Juan Pérez',
          correo: 'juan@example.com',
          rol: {
            nombreRol: 'Admin',
          },
        },
      },
    },
  })
  @ApiNotFoundResponse({
    description: 'Usuario no encontrado',
  })
  @ApiUnauthorizedResponse({
    description: 'Token no válido o expirado',
  })
  @Public()
  async findOne(@Param('id') id: string) {
    return this.usuariosService.findOne(id);
  }

  /**
   * Crea un nuevo registro en el sistema.
   * @param createUsuarioDto - createUsuarioDto parameter
   * @returns El resultado de la operación.
   */
  @Public()
  @Post()
  @ApiOperation({
    summary: 'Crear nuevo usuario',
    description: 'Registra un nuevo usuario en el sistema',
  })
  @ApiResponse({
    status: 201,
    description: 'Usuario creado exitosamente',
    schema: {
      example: {
        success: true,
        data: {
          idUsuario: '550e8400-e29b-41d4-a716-446655440000',
          nombre: 'Juan Pérez',
          correo: 'juan@example.com',
        },
        message: 'Usuario creado exitosamente',
      },
    },
  })
  @ApiBadRequestResponse({
    description: 'Datos inválidos o correo ya registrado',
  })
  async create(@Body() createUsuarioDto: CreateUsuarioDto) {
    return this.usuariosService.create(createUsuarioDto);
  }

  /**
   * Actualiza un registro existente.
   * @param id - id parameter
   * @param updateUsuarioDto - updateUsuarioDto parameter
   * @returns El resultado de la operación.
   */
  @Put(':id')
  @ApiOperation({
    summary: 'Actualizar usuario',
    description: 'Actualiza la información de un usuario existente',
  })
  @ApiParam({
    name: 'id',
    description: 'ID del usuario a actualizar (UUID)',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({
    status: 200,
    description: 'Usuario actualizado exitosamente',
    schema: {
      example: {
        success: true,
        message: 'Usuario actualizado correctamente',
      },
    },
  })
  @ApiNotFoundResponse({
    description: 'Usuario no encontrado',
  })
  @ApiUnauthorizedResponse({
    description: 'Token no válido o expirado',
  })
  @ApiBadRequestResponse({
    description: 'Datos inválidos',
  })
  @Public()
  async update(
    @Param('id') id: string,
    @Body() updateUsuarioDto: UpdateUsuarioDto,
  ) {
    return this.usuariosService.update(id, updateUsuarioDto);
  }

  /**
   * Elimina un registro del sistema.
   * @param id - id parameter
   * @returns El resultado de la operación.
   */
  @Delete(':id')
  @ApiOperation({
    summary: 'Eliminar usuario',
    description: 'Elimina un usuario del sistema (soft delete)',
  })
  @ApiParam({
    name: 'id',
    description: 'ID del usuario a eliminar (UUID)',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({
    status: 200,
    description: 'Usuario eliminado exitosamente',
    schema: {
      example: {
        success: true,
        message: 'Usuario eliminado correctamente',
      },
    },
  })
  @ApiNotFoundResponse({
    description: 'Usuario no encontrado',
  })
  @ApiUnauthorizedResponse({
    description: 'Token no válido o expirado',
  })
  async remove(@Param('id') id: string) {
    return this.usuariosService.remove(id);
  }
}
