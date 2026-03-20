import {
  ForgotPasswordDto,
  ResetPasswordDto,
} from './dto/forgot-reset-password.dto';
import * as nodemailer from 'nodemailer';
import {
  Injectable,
  UnauthorizedException,
  ForbiddenException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../database/prisma.service';
import {
  LoginDto,
  RegisterDto,
  ChangePasswordDto,
  AuthResponse,
  JwtPayload,
  GoogleLoginDto,
} from './dto';
import * as bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { OAuth2Client } from 'google-auth-library';
import { TipoDocumento } from '@prisma/client';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  /**
   * Realiza la operación de get google client.
   * @returns El resultado de la operación.
   */
  private getGoogleClient() {
    const googleClientId = process.env.GOOGLE_CLIENT_ID;
    if (!googleClientId) {
      throw new ForbiddenException('GOOGLE_CLIENT_ID no configurado');
    }
    return {
      clientId: googleClientId,
      client: new OAuth2Client(googleClientId),
    };
  }

  /**
   * Realiza la operación de map auth user.
   * @param usuario - usuario parameter
   * @returns El resultado de la operación.
   */
  private mapAuthUser(usuario: {
    idUsuario: string;
    nombre: string;
    correo: string;
    perfilCompleto?: boolean;
    authProvider: string;
    tipoDoc?: TipoDocumento | null;
    idCiudad?: number | null;
    numDocumento?: string | null;
    telefono?: string | null;
    direccion?: string | null;
    rol: {
      idRol: string;
      nombreRol: string;
      rolesPermisos?: any[];
    };
    ciudad?: {
      idCiudad: number;
      nombreCiudad: string;
    } | null;
  }) {
    const perfilCompleto =
      usuario?.perfilCompleto === true &&
      !!usuario?.tipoDoc &&
      !!usuario?.idCiudad &&
      !!usuario?.numDocumento &&
      String(usuario?.numDocumento).trim() !== '' &&
      !!usuario?.telefono &&
      String(usuario?.telefono).trim() !== '' &&
      !!usuario?.direccion &&
      String(usuario?.direccion).trim() !== '';

    return {
      idUsuario: usuario.idUsuario,
      nombre: usuario.nombre,
      correo: usuario.correo,
      perfilCompleto,
      authProvider: usuario.authProvider,
      rol: {
        idRol: usuario.rol.idRol,
        nombreRol: usuario.rol.nombreRol,
        rolesPermisos: usuario.rol.rolesPermisos,
      },
      ...(usuario.tipoDoc
        ? {
            tipoDoc: usuario.tipoDoc,
          }
        : {}),
      ...(usuario.ciudad
        ? {
            ciudad: {
              idCiudad: usuario.ciudad.idCiudad,
              nombreCiudad: usuario.ciudad.nombreCiudad,
            },
          }
        : {}),
    };
  }

  /**
   * Realiza la operación de get usuario by id.
   * @param idUsuario - idUsuario parameter
   * @returns El resultado de la operación.
   */
  async getUsuarioById(idUsuario: string) {
    return this.prisma.usuarios.findUnique({
      where: { idUsuario },
      include: { rol: true, ciudad: true },
    });
  }

  /**
   * Realiza la operación de cambiar estado usuario.
   * @param idUsuario - idUsuario parameter
   * @param estado - estado parameter
   * @returns El resultado de la operación.
   */
  async cambiarEstadoUsuario(idUsuario: string, estado: boolean) {
    // Verificar si el usuario existe y obtener su rol
    const usuario = await this.prisma.usuarios.findUnique({
      where: { idUsuario },
      include: { rol: true },
    });

    if (!usuario) {
      throw new Error('Usuario no encontrado');
    }

    // Verificar si es administrador
    if (usuario.rol.nombreRol.toLowerCase() === 'administrador') {
      throw new Error('No se puede cambiar el estado de un administrador');
    }

    await this.prisma.usuarios.update({
      where: { idUsuario },
      data: { estado },
    });
  }
  /**
   * Realiza la operación de delete photo.
   * @param userId - userId parameter
   * @returns El resultado de la operación.
   */
  async deletePhoto(userId: string) {
    await this.prisma.usuarios.update({
      where: { idUsuario: userId },
      data: { foto: null },
    });
  }

  /**
   * Autentica a un usuario y retorna un token.
   * @param loginDto - loginDto parameter
   * @returns El resultado de la operación.
   */
  async login(loginDto: LoginDto): Promise<AuthResponse> {
    const { correo, contrasena, remember } = loginDto;

    try {
      // Buscar usuario por correo con relaciones
      const usuario = await this.prisma.usuarios.findUnique({
        where: { correo },
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
        throw new UnauthorizedException('Credenciales inválidas');
      }

      // Verificar que el usuario esté activo
      if (!usuario.estado) {
        throw new UnauthorizedException('Usuario inactivo');
      }

      // Verificar contraseña
      const isPasswordValid = await bcrypt.compare(
        contrasena,
        usuario.contrasena,
      );
      if (!isPasswordValid) {
        throw new UnauthorizedException('Credenciales inválidas');
      }

      // Generar token JWT con duración basada en "remember"
      const payload: JwtPayload = {
        sub: usuario.idUsuario,
        correo: usuario.correo,
        nombre: usuario.nombre,
        rol: usuario.rol.nombreRol,
      };

      // Si remember es true, token dura 30 días, sino 24 horas
      const expiresIn = remember ? '30d' : '24h';
      const access_token = await this.jwtService.signAsync(payload, {
        expiresIn,
      });

      return {
        success: true,
        data: {
          user: this.mapAuthUser(usuario),
          access_token,
          expires_in: expiresIn,
        },
        message: 'Login exitoso',
      };
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      const errorMessage =
        error instanceof Error ? error.message : 'Error desconocido';
      throw new UnauthorizedException(
        'Error en autenticación: ' + errorMessage,
      );
    }
  }

  /**
   * Realiza la operación de login with google.
   * @param googleLoginDto - googleLoginDto parameter
   * @returns El resultado de la operación.
   */
  async loginWithGoogle(googleLoginDto: GoogleLoginDto): Promise<AuthResponse> {
    const { idToken, remember } = googleLoginDto;

    const { client, clientId } = this.getGoogleClient();

    const ticket = await client.verifyIdToken({
      idToken,
      audience: clientId,
    });

    const payload = ticket.getPayload();
    const correo = payload?.email;
    const nombreGoogle = payload?.name || payload?.given_name || 'Usuario';

    if (!correo) {
      throw new UnauthorizedException('Token de Google inválido');
    }

    if (payload?.email_verified === false) {
      throw new UnauthorizedException('El correo de Google no está verificado');
    }

    let usuario = await this.prisma.usuarios.findUnique({
      where: { correo },
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
      const rolCliente = await this.prisma.roles.findFirst({
        where: {
          nombreRol: { equals: 'Cliente', mode: 'insensitive' },
        },
      });

      if (!rolCliente) {
        throw new NotFoundException('Rol Cliente no encontrado');
      }

      const contrasenaRandom = uuidv4();
      const hashedPassword = await bcrypt.hash(contrasenaRandom, 12);

      usuario = await this.prisma.usuarios.create({
        data: {
          idUsuario: uuidv4(),
          correo,
          nombre: nombreGoogle,
          idRol: rolCliente.idRol,
          // Perfil incompleto: el cliente deberá completar estos datos
          tipoDoc: null,
          numDocumento: null,
          telefono: null,
          direccion: null,
          idCiudad: null,
          contrasena: hashedPassword,
          estado: true,
          perfilCompleto: false,
          authProvider: 'google',
        },
        include: {
          rol: {
            include: {
              rolesPermisos: {
                include: { permiso: true },
              },
            },
          },
          ciudad: true,
        },
      });
    }

    if (!usuario.estado) {
      throw new UnauthorizedException('Usuario inactivo');
    }

    const jwtPayload: JwtPayload = {
      sub: usuario.idUsuario,
      correo: usuario.correo,
      nombre: usuario.nombre,
      rol: usuario.rol.nombreRol,
    };

    const expiresIn = remember ? '30d' : '24h';
    const access_token = await this.jwtService.signAsync(jwtPayload, {
      expiresIn,
    });

    return {
      success: true,
      data: {
        user: this.mapAuthUser(usuario),
        access_token,
        expires_in: expiresIn,
      },
      message: 'Login con Google exitoso',
    };
  }

  /**
   * Registra a un usuario nuevo en el sistema.
   * @param registerDto - registerDto parameter
   * @returns El resultado de la operación.
   */
  async register(registerDto: RegisterDto): Promise<AuthResponse> {
    const {
      correo,
      contrasena,
      nombre,
      numDocumento,
      telefono,
      direccion,
      idCiudad,
      idRol,
      tipoDoc,
    } = registerDto;

    try {
      // Verificar si el usuario ya existe por correo
      const existingUserByEmail = await this.prisma.usuarios.findUnique({
        where: { correo },
      });

      if (existingUserByEmail) {
        throw new ConflictException(
          'Ya existe un usuario con este correo electrónico',
        );
      }

      // Verificar si el usuario ya existe por número de documento
      const existingUserByDocument = await this.prisma.usuarios.findUnique({
        where: { numDocumento },
      });

      if (existingUserByDocument) {
        throw new ConflictException(
          'Ya existe un usuario con este número de documento',
        );
      }

      // Verificar que el rol existe
      const rol = await this.prisma.roles.findUnique({
        where: { idRol },
      });

      if (!rol) {
        throw new NotFoundException('Rol no encontrado');
      }

      // Verificar que el tipo de documento existe
      const tiposValidos = ['TI', 'CC', 'CE', 'Pasaporte'];
      if (!tiposValidos.includes(String(tipoDoc))) {
        throw new NotFoundException('Tipo de documento no válido');
      }

      // Encriptar contraseña
      const hashedPassword = await bcrypt.hash(contrasena, 12);

      // Verificar que la ciudad existe
      const ciudad = await this.prisma.ciudades.findUnique({
        where: { idCiudad },
      });
      if (!ciudad) {
        throw new NotFoundException('Ciudad no encontrada');
      }

      // Crear usuario
      const nuevoUsuario = await this.prisma.usuarios.create({
        data: {
          idUsuario: uuidv4(),
          correo,
          contrasena: hashedPassword,
          nombre,
          numDocumento,
          telefono,
          direccion,
          idCiudad,
          idRol,
          tipoDoc: tipoDoc as TipoDocumento,
          estado: true,
          perfilCompleto: true,
          authProvider: 'local',
        },
        include: {
          rol: true,
          ciudad: true,
        },
      });

      // Generar token JWT
      const payload: JwtPayload = {
        sub: nuevoUsuario.idUsuario,
        correo: nuevoUsuario.correo,
        nombre: nuevoUsuario.nombre,
        rol: nuevoUsuario.rol.nombreRol,
      };

      const access_token = await this.jwtService.signAsync(payload);

      // Enviar correo de bienvenida sin credenciales (el usuario ya las conoce)
      this.sendWelcomeEmailWithoutCredentials(
        nuevoUsuario.correo,
        nuevoUsuario.nombre,
      ).catch((error) => {
        console.error('Error al enviar correo de bienvenida:', error);
      });

      return {
        success: true,
        data: {
          user: this.mapAuthUser(nuevoUsuario),
          access_token,
          expires_in: '24h',
        },
        message: 'Usuario registrado exitosamente',
      };
    } catch (error) {
      if (
        error instanceof ConflictException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }
      const errorMessage =
        error instanceof Error ? error.message : 'Error desconocido';
      throw new ConflictException(
        'Error al registrar usuario: ' + errorMessage,
      );
    }
  }

  /**
   * Realiza la operación de change password.
   * @param userId - userId parameter
   * @param changePasswordDto - changePasswordDto parameter
   * @returns El resultado de la operación.
   */
  async changePassword(
    userId: string,
    changePasswordDto: ChangePasswordDto,
  ): Promise<{ success: boolean; message: string }> {
    const { contrasenaActual, nuevaContrasena } = changePasswordDto;

    try {
      // Buscar usuario
      const usuario = await this.prisma.usuarios.findUnique({
        where: { idUsuario: userId },
      });

      if (!usuario) {
        throw new NotFoundException('Usuario no encontrado');
      }

      // Verificar contraseña actual
      const isCurrentPasswordValid = await bcrypt.compare(
        contrasenaActual,
        usuario.contrasena,
      );
      if (!isCurrentPasswordValid) {
        // Cambiar a ForbiddenException para evitar logout en frontend
        throw new ForbiddenException('Contraseña actual incorrecta');
      }

      // Encriptar nueva contraseña
      const hashedNewPassword = await bcrypt.hash(nuevaContrasena, 12);

      // Actualizar contraseña
      await this.prisma.usuarios.update({
        where: { idUsuario: userId },
        data: { contrasena: hashedNewPassword },
      });

      return {
        success: true,
        message: 'Contraseña actualizada exitosamente',
      };
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof UnauthorizedException
      ) {
        throw error;
      }
      const errorMessage =
        error instanceof Error ? error.message : 'Error desconocido';
      throw new ConflictException(
        'Error al cambiar contraseña: ' + errorMessage,
      );
    }
  }

  /**
   * Realiza la operación de validate user.
   * @param payload - payload parameter
   * @returns El resultado de la operación.
   */
  async validateUser(payload: JwtPayload): Promise<unknown> {
    const usuario = await this.prisma.usuarios.findUnique({
      where: { idUsuario: payload.sub },
      include: {
        rol: true,
        ciudad: true,
      },
    });

    if (!usuario || !usuario.estado) {
      return null;
    }

    // Devolver usuario sin contraseña
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { contrasena: _contrasena, ...result } = usuario;
    return result;
  }
  // Configuración de transporte para nodemailer (ajusta según tu proveedor)
  private transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.example.com',
    port: Number(process.env.SMTP_PORT) || 587,
    secure: false,
    auth: {
      user: process.env.SMTP_USER || 'user@example.com',
      pass: process.env.SMTP_PASS || 'password',
    },
  });

  /**
   * Realiza la operación de send welcome email without credentials.
   * @param email - email parameter
   * @param nombre - nombre parameter
   * @returns El resultado de la operación.
   */
  private async sendWelcomeEmailWithoutCredentials(
    email: string,
    nombre: string,
  ): Promise<void> {
    try {
      await this.transporter.sendMail({
        from: process.env.SMTP_FROM || 'no-reply@enrutapp.com',
        to: email,
        subject: '¡Bienvenido a EnrutApp!',
        html: `
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
        text: `
¡Bienvenido a EnrutApp!

Hola ${nombre},

Tu cuenta ha sido creada exitosamente en EnrutApp.

Ahora puedes acceder al sistema con las credenciales que configuraste durante el registro.

Puedes acceder al sistema en: ${process.env.FRONTEND_URL || 'http://localhost:5173'}
        `,
      });
    } catch (error) {
      console.error('Error al enviar correo de bienvenida:', error);
    }
  }

  /**
   * Realiza la operación de forgot password.
   * @param dto - dto parameter
   * @returns El resultado de la operación.
   */
  async forgotPassword(
    dto: ForgotPasswordDto,
  ): Promise<{ success: boolean; message: string }> {
    const { correo } = dto;
    const usuario = await this.prisma.usuarios.findUnique({
      where: { correo },
    });
    if (!usuario) {
      throw new NotFoundException('No existe un usuario con ese correo');
    }
    // Generar código y expiración
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expires = new Date(Date.now() + 15 * 60 * 1000);
    await this.prisma.usuarios.update({
      where: { correo },
      data: { resetPasswordCode: code, resetPasswordExpires: expires },
    });
    // Enviar correo
    await this.transporter.sendMail({
      from: process.env.SMTP_FROM || 'no-reply@enrutapp.com',
      to: correo,
      subject: 'Código de recuperación de contraseña',
      text: `Tu código de recuperación es: ${code}. Expira en 15 minutos.`,
    });
    return { success: true, message: 'Código enviado al correo' };
  }

  /**
   * Realiza la operación de reset password.
   * @param dto - dto parameter
   * @returns El resultado de la operación.
   */
  async resetPassword(
    dto: ResetPasswordDto,
  ): Promise<{ success: boolean; message: string }> {
    const { code, newPassword } = dto;
    const usuario = await this.prisma.usuarios.findFirst({
      where: {
        resetPasswordCode: code,
        resetPasswordExpires: { gt: new Date() },
      },
    });
    if (!usuario) {
      throw new NotFoundException('Código inválido o expirado');
    }
    // Validar que la nueva contraseña no sea igual a la anterior
    const isSamePassword = await bcrypt.compare(
      newPassword,
      usuario.contrasena,
    );
    if (isSamePassword) {
      throw new ConflictException(
        'La nueva contraseña no puede ser igual a la anterior',
      );
    }
    // Validar requisitos mínimos (puedes ajustar la expresión según tus reglas)
    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]{6,}$/;
    if (!passwordRegex.test(newPassword)) {
      throw new ConflictException(
        'La contraseña debe tener al menos 6 caracteres, incluir letras y números',
      );
    }
    const hashed = await bcrypt.hash(newPassword, 12);
    await this.prisma.usuarios.update({
      where: { idUsuario: usuario.idUsuario },
      data: {
        contrasena: hashed,
        resetPasswordCode: null,
        resetPasswordExpires: null,
      },
    });
    return { success: true, message: 'Contraseña restablecida correctamente' };
  }

  /**
   * Realiza la operación de update photo.
   * @param userId - userId parameter
   * @param fotoUrl - fotoUrl parameter
   * @returns El resultado de la operación.
   */
  async updatePhoto(userId: string, fotoUrl: string) {
    await this.prisma.usuarios.update({
      where: { idUsuario: userId },
      data: { foto: fotoUrl },
    });
  }

  /**
   * Realiza la operación de update user.
   * @param userId - userId parameter
   * @param {
   *       telefono,
   *       direccion,
   *       idCiudad,
   *     } - {
   *       telefono,
   *       direccion,
   *       idCiudad,
   *     } parameter
   * @returns El resultado de la operación.
   */
  async updateUser(
    userId: string,
    {
      telefono,
      direccion,
      idCiudad,
    }: { telefono: string; direccion: string; idCiudad: string },
  ) {
    // Verificar que la ciudad existe
    const ciudadObj = await this.prisma.ciudades.findUnique({
      where: { idCiudad: Number(idCiudad) },
    });
    if (!ciudadObj) throw new Error('Ciudad no encontrada');
    await this.prisma.usuarios.update({
      where: { idUsuario: userId },
      data: {
        telefono,
        direccion,
        idCiudad: ciudadObj.idCiudad,
      },
    });
  }
}
