import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { hash } from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { CreateUsuarioDto } from './dto/create-usuario.dto';
import { UpdateUsuarioDto } from './dto/update-usuario.dto';
import { CompletarPerfilClienteDto } from './dto';
import * as nodemailer from 'nodemailer';
import { Prisma, TipoDocumento } from '@prisma/client';

/**
 * Servicio de Usuarios
 * Contiene toda la lógica de negocio relacionada con usuarios
 */
@Injectable()
export class UsuariosService {
  private transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.example.com',
    port: Number(process.env.SMTP_PORT) || 587,
    secure: false,
    auth: {
      user: process.env.SMTP_USER || 'user@example.com',
      pass: process.env.SMTP_PASS || 'password',
    },
  });

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Realiza la operación de es perfil cliente completo.
   * @param usuario - usuario parameter
   * @returns El resultado de la operación.
   */
  private esPerfilClienteCompleto(usuario: {
    tipoDoc?: string | null;
    numDocumento?: string | null;
    telefono?: string | null;
    direccion?: string | null;
    idCiudad?: number | null;
  }): boolean {
    const tipoDocOk = !!usuario.tipoDoc;
    const numDocOk =
      !!usuario.numDocumento && String(usuario.numDocumento).trim() !== '';
    const telefonoOk =
      !!usuario.telefono && String(usuario.telefono).trim() !== '';
    const direccionOk =
      !!usuario.direccion && String(usuario.direccion).trim() !== '';
    const ciudadOk = !!usuario.idCiudad;
    return tipoDocOk && numDocOk && telefonoOk && direccionOk && ciudadOk;
  }

  /**
   * Realiza la operación de verificar perfil cliente.
   * @param idUsuario - idUsuario parameter
   * @returns El resultado de la operación.
   */
  async verificarPerfilCliente(idUsuario: string) {
    try {
      const usuario = await this.prisma.usuarios.findUnique({
        where: { idUsuario },
        include: { rol: true },
      });

      if (!usuario) {
        throw new HttpException(
          { success: false, error: 'Usuario no encontrado' },
          HttpStatus.NOT_FOUND,
        );
      }

      const esCliente = usuario.rol?.nombreRol?.toLowerCase() === 'cliente';

      if (!esCliente) {
        return {
          success: true,
          data: { esCliente: false, completado: true },
          message: 'El usuario no es Cliente',
        };
      }

      const completado =
        usuario.perfilCompleto === true &&
        this.esPerfilClienteCompleto(usuario);

      return {
        success: true,
        data: { esCliente: true, completado },
        message: completado
          ? 'El cliente ya tiene su perfil completo'
          : 'El cliente debe completar su perfil',
      };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      const errorMessage =
        error instanceof Error ? error.message : 'Error desconocido';
      throw new HttpException(
        {
          success: false,
          error: 'Error al verificar perfil de cliente',
          message: errorMessage,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Realiza la operación de completar perfil cliente.
   * @param idUsuario - idUsuario parameter
   * @param dto - dto parameter
   * @returns El resultado de la operación.
   */
  async completarPerfilCliente(
    idUsuario: string,
    dto: CompletarPerfilClienteDto,
  ) {
    try {
      const usuario = await this.prisma.usuarios.findUnique({
        where: { idUsuario },
        include: { rol: true },
      });

      if (!usuario) {
        throw new HttpException(
          { success: false, error: 'Usuario no encontrado' },
          HttpStatus.NOT_FOUND,
        );
      }

      const esCliente = usuario.rol?.nombreRol?.toLowerCase() === 'cliente';

      if (!esCliente) {
        throw new HttpException(
          {
            success: false,
            error:
              'El usuario debe tener rol Cliente para completar este perfil',
          },
          HttpStatus.BAD_REQUEST,
        );
      }

      // Validar ciudad
      const ciudad = await this.prisma.ciudades.findUnique({
        where: { idCiudad: dto.idCiudad },
        select: { idCiudad: true },
      });
      if (!ciudad) {
        throw new HttpException(
          { success: false, error: 'Ciudad no encontrada' },
          HttpStatus.BAD_REQUEST,
        );
      }

      // Validar tipo de documento
      const tiposValidos = ['TI', 'CC', 'CE', 'Pasaporte'];
      if (!tiposValidos.includes(String(dto.tipoDoc))) {
        throw new HttpException(
          { success: false, error: 'Tipo de documento no válido' },
          HttpStatus.BAD_REQUEST,
        );
      }

      // Validar unicidad del documento
      const numDocumentoNormalizado = String(dto.numDocumento).trim();
      const existente = await this.prisma.usuarios.findFirst({
        where: {
          numDocumento: numDocumentoNormalizado,
          NOT: { idUsuario },
        },
        select: { idUsuario: true },
      });

      if (existente) {
        throw new HttpException(
          { success: false, error: 'El documento ya está registrado' },
          HttpStatus.CONFLICT,
        );
      }

      const actualizado = await this.prisma.usuarios.update({
        where: { idUsuario },
        data: {
          tipoDoc: dto.tipoDoc as TipoDocumento,
          numDocumento: numDocumentoNormalizado,
          telefono: String(dto.telefono).trim(),
          direccion: String(dto.direccion).trim(),
          idCiudad: dto.idCiudad,
          perfilCompleto: true,
        },
        include: {
          rol: true,
          ciudad: true,
        },
      });

      return {
        success: true,
        data: actualizado,
        message: 'Perfil de cliente completado exitosamente',
      };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      const errorMessage =
        error instanceof Error ? error.message : 'Error desconocido';
      throw new HttpException(
        {
          success: false,
          error: 'Error al completar perfil de cliente',
          message: errorMessage,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Realiza la operación de send welcome email.
   * @param email - email parameter
   * @param nombre - nombre parameter
   * @param password - password parameter
   * @returns El resultado de la operación.
   */
  private async sendWelcomeEmail(
    email: string,
    nombre: string,
    password?: string, // Opcional: si se proporciona, se incluyen las credenciales
  ): Promise<void> {
    try {
      const conCredenciales = !!password;

      await this.transporter.sendMail({
        from: process.env.SMTP_FROM || 'no-reply@enrutapp.com',
        to: email,
        subject: conCredenciales
          ? '¡Bienvenido a EnrutApp! - Credenciales de acceso'
          : '¡Bienvenido a EnrutApp!',
        html: conCredenciales
          ? `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #2563eb;">¡Bienvenido a EnrutApp!</h2>
            <p>Hola <strong>${nombre}</strong>,</p>
            <p>Tu cuenta ha sido creada exitosamente. A continuación encontrarás tus credenciales de acceso:</p>
            
            <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 5px 0;"><strong>Correo:</strong> ${email}</p>
              <p style="margin: 5px 0;"><strong>Contraseña:</strong> ${password}</p>
            </div>
            
            <p style="color: #ef4444;"><strong>⚠️ Importante:</strong> Por tu seguridad, te recomendamos cambiar tu contraseña después del primer inicio de sesión.</p>
            
            <p>Puedes acceder al sistema en: <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}" style="color: #2563eb;">EnrutApp</a></p>
            
            <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
            <p style="color: #6b7280; font-size: 12px;">Este correo fue enviado automáticamente. Por favor no respondas a este mensaje.</p>
          </div>
        `
          : `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #2563eb;">¡Bienvenido a EnrutApp!</h2>
            <p>Hola <strong>${nombre}</strong>,</p>
            <p>Tu cuenta ha sido creada exitosamente en EnrutApp.</p>
            
            <p>Ahora puedes acceder al sistema con las credenciales que configuraste durante el registro.</p>
            
            <p>Puedes acceder al sistema en: <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}" style="color: #2563eb;">EnrutApp</a></p>
            
            <p>Si tienes alguna pregunta o necesitas ayuda, no dudes en contactarnos.</p>
            
            <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
            <p style="color: #6b7280; font-size: 12px;">Este correo fue enviado automáticamente. Por favor no respondas a este mensaje.</p>
          </div>
        `,
        text: conCredenciales
          ? `
¡Bienvenido a EnrutApp!

Hola ${nombre},

Tu cuenta ha sido creada exitosamente. A continuación encontrarás tus credenciales de acceso:

Correo: ${email}
Contraseña: ${password}

⚠️ Importante: Por tu seguridad, te recomendamos cambiar tu contraseña después del primer inicio de sesión.

Puedes acceder al sistema en: ${process.env.FRONTEND_URL || 'http://localhost:5173'}
        `
          : `
¡Bienvenido a EnrutApp!

Hola ${nombre},

Tu cuenta ha sido creada exitosamente en EnrutApp.

Ahora puedes acceder al sistema con las credenciales que configuraste durante el registro.

Puedes acceder al sistema en: ${process.env.FRONTEND_URL || 'http://localhost:5173'}
        `,
      });
    } catch (error) {
      console.error('Error al enviar correo de bienvenida:', error);
      // No lanzamos error para no bloquear la creación del usuario
    }
  }

  /**
   * Realiza la operación de check email exists.
   * @param email - email parameter
   * @returns El resultado de la operación.
   */
  async checkEmailExists(email: string) {
    const user = await this.prisma.usuarios.findUnique({
      where: { correo: email },
      select: { idUsuario: true },
    });
    return { exists: !!user };
  }

  /**
   * Realiza la operación de check document exists.
   * @param numero - numero parameter
   * @returns El resultado de la operación.
   */
  async checkDocumentExists(numero: string) {
    const user = await this.prisma.usuarios.findFirst({
      where: { numDocumento: numero },
      select: { idUsuario: true },
    });
    return { exists: !!user };
  }

  /**
   * Obtiene una lista de todos los registros.
   * @param filter - filter parameter
   * @returns El resultado de la operación.
   */
  async findAll(filter?: { rol?: string }) {
    try {
      const whereClause = filter?.rol
        ? {
            rol: {
              is: {
                nombreRol: {
                  equals: String(filter.rol).trim(),
                  mode: 'insensitive' as const,
                },
              },
            },
          }
        : undefined;

      const usuarios = await this.prisma.usuarios.findMany({
        where: whereClause,
        include: {
          rol: true,
          ciudad: true,
        },
      });

      return {
        success: true,
        data: usuarios,
        message: 'Usuarios obtenidos exitosamente',
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Error desconocido';
      throw new HttpException(
        {
          success: false,
          error: 'Error al obtener usuarios',
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
      const usuario = await this.prisma.usuarios.findUnique({
        where: { idUsuario: id },
        include: {
          rol: true,
          ciudad: true,
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

      return {
        success: true,
        data: usuario,
        message: 'Usuario encontrado',
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
          error: 'Error al buscar usuario',
          message: errorMessage,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Realiza la operación de find with permissions.
   * @param id - id parameter
   * @returns El resultado de la operación.
   */
  async findWithPermissions(id: string) {
    try {
      const usuario = await this.prisma.usuarios.findUnique({
        where: { idUsuario: id },
        include: {
          rol: {
            include: {
              rolesPermisos: {
                include: {
                  permiso: true,
                },
              },
            },
          },
          ciudad: true,
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

      return {
        success: true,
        data: usuario,
        message: 'Usuario encontrado',
      };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      const errorMessage =
        error instanceof Error ? error.message : 'Error desconocido';
      throw new HttpException(
        {
          success: false,
          error: 'Error al buscar usuario',
          message: errorMessage,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Crea un nuevo registro en el sistema.
   * @param createUsuarioDto - createUsuarioDto parameter
   * @returns El resultado de la operación.
   */
  async create(createUsuarioDto: CreateUsuarioDto) {
    try {
      // Validar que el rol existe
      if (!createUsuarioDto.idRol) {
        throw new HttpException(
          { success: false, error: 'El rol es requerido' },
          HttpStatus.BAD_REQUEST,
        );
      }

      const rol = await this.prisma.roles.findUnique({
        where: { idRol: createUsuarioDto.idRol },
      });

      if (!rol) {
        throw new HttpException(
          { success: false, error: 'El rol especificado no existe' },
          HttpStatus.BAD_REQUEST,
        );
      }

      // Normalizar datos
      const correoNormalizado = String(createUsuarioDto.correo)
        .trim()
        .toLowerCase();
      const numDocumentoNormalizado = String(
        createUsuarioDto.numDocumento,
      ).trim();

      // Guardar contraseña en texto plano temporalmente para enviar por correo
      const plainPassword = createUsuarioDto.contrasena;

      // Hashear contraseña
      const hashedPassword = await hash(createUsuarioDto.contrasena, 10);

      const nuevoUsuario = await this.prisma.usuarios.create({
        data: {
          idUsuario: uuidv4(),
          idRol: createUsuarioDto.idRol,
          foto: null,
          tipoDoc: (createUsuarioDto.tipoDoc as TipoDocumento) || null,
          numDocumento: numDocumentoNormalizado,
          nombre: createUsuarioDto.nombre,
          telefono: createUsuarioDto.telefono || '',
          correo: correoNormalizado,
          contrasena: hashedPassword,
          direccion: createUsuarioDto.direccion || '',
          idCiudad: createUsuarioDto.idCiudad || 1,
          estado:
            typeof createUsuarioDto.estado === 'boolean'
              ? createUsuarioDto.estado
              : true,
        },
        include: {
          rol: true,
          ciudad: true,
        },
      });

      // Enviar correo con las credenciales de forma asíncrona
      this.sendWelcomeEmail(
        correoNormalizado,
        createUsuarioDto.nombre,
        plainPassword,
      ).catch((error) => {
        console.error('Error al enviar correo de bienvenida:', error);
      });

      return {
        success: true,
        data: nuevoUsuario,
        message:
          'Usuario creado exitosamente. Se ha enviado un correo con las credenciales.',
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
          error: 'Error al crear usuario',
          message: errorMessage,
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  /**
   * Actualiza un registro existente.
   * @param id - id parameter
   * @param updateUsuarioDto - updateUsuarioDto parameter
   * @returns El resultado de la operación.
   */
  async update(id: string, updateUsuarioDto: UpdateUsuarioDto) {
    try {
      const usuarioExistente = await this.prisma.usuarios.findUnique({
        where: { idUsuario: id },
        include: { rol: true },
      });

      if (!usuarioExistente) {
        throw new HttpException(
          { success: false, error: 'Usuario no encontrado' },
          HttpStatus.NOT_FOUND,
        );
      }

      // Proteger cambios en administradores
      const isAdmin =
        usuarioExistente.rol?.nombreRol?.toLowerCase() === 'administrador';

      if (isAdmin) {
        if (
          updateUsuarioDto.idRol &&
          updateUsuarioDto.idRol !== usuarioExistente.idRol
        ) {
          throw new HttpException(
            {
              success: false,
              error: 'No se puede cambiar el rol de un administrador',
            },
            HttpStatus.FORBIDDEN,
          );
        }
      }

      // Preparar datos para actualización
      const dataToUpdate: Prisma.UsuariosUpdateInput = {
        ...updateUsuarioDto,
        tipoDoc: updateUsuarioDto.tipoDoc as TipoDocumento | undefined,
      };

      // Hashear contraseña si se está actualizando
      if (typeof updateUsuarioDto.contrasena === 'string') {
        dataToUpdate.contrasena = await hash(updateUsuarioDto.contrasena, 10);
      }

      const usuarioActualizado = await this.prisma.usuarios.update({
        where: { idUsuario: id },

        data: dataToUpdate,
        include: {
          rol: true,
          ciudad: true,
        },
      });

      return {
        success: true,
        data: usuarioActualizado,
        message: 'Usuario actualizado exitosamente',
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
          error: 'Error al actualizar usuario',
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
      const usuario = await this.prisma.usuarios.findUnique({
        where: { idUsuario: id },
        include: { rol: true },
      });

      if (!usuario) {
        throw new HttpException(
          { success: false, error: 'Usuario no encontrado' },
          HttpStatus.NOT_FOUND,
        );
      }

      // No permitir eliminar administradores
      if (usuario.rol.nombreRol.toLowerCase() === 'administrador') {
        throw new HttpException(
          {
            success: false,
            error: 'No se puede eliminar un administrador',
          },
          HttpStatus.FORBIDDEN,
        );
      }

      await this.prisma.usuarios.delete({
        where: { idUsuario: id },
      });

      return {
        success: true,
        message: 'Usuario eliminado exitosamente',
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
          error: 'Error al eliminar usuario',
          message: errorMessage,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
