import { Test, TestingModule } from '@nestjs/testing';
import { HttpException } from '@nestjs/common';
import { UsuariosService } from './usuarios.service';
import { PrismaService } from '../../database/prisma.service';

describe('UsuariosService', () => {
  let service: UsuariosService;

  const mockPrismaService = {
    usuarios: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    roles: {
      findUnique: jest.fn(),
    },
    tiposDoc: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
    },
    ciudades: {
      findUnique: jest.fn(),
    },
  };

  const mockUsuario = {
    idUsuario: '123e4567-e89b-12d3-a456-426614174000',
    nombre: 'Test User',
    correo: 'test@example.com',
    numDocumento: '12345678',
    idRol: 'rol-id',
    estado: true,
    telefono: '1234567890',
    direccion: 'Test Address',
    contrasena: 'hashedpassword',
    tipoDoc: 'tipo-doc-id',
    idCiudad: 1,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsuariosService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<UsuariosService>(UsuariosService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('debe retornar todos los usuarios exitosamente', async () => {
      const mockUsuarios = [mockUsuario];
      mockPrismaService.usuarios.findMany.mockResolvedValue(mockUsuarios);

      const result = await service.findAll();

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockUsuarios);
      expect(result.message).toBe('Usuarios obtenidos exitosamente');
    });

    it('debe lanzar HttpException si hay un error', async () => {
      mockPrismaService.usuarios.findMany.mockRejectedValue(
        new Error('Database error'),
      );

      await expect(service.findAll()).rejects.toThrow(HttpException);
    });
  });

  describe('findOne', () => {
    it('debe retornar un usuario por ID exitosamente', async () => {
      mockPrismaService.usuarios.findUnique.mockResolvedValue(mockUsuario);

      const result = await service.findOne(mockUsuario.idUsuario);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockUsuario);
    });

    it('debe lanzar HttpException NOT_FOUND si el usuario no existe', async () => {
      mockPrismaService.usuarios.findUnique.mockResolvedValue(null);

      await expect(service.findOne('nonexistent-id')).rejects.toThrow(
        HttpException,
      );
    });
  });

  describe('checkEmailExists', () => {
    it('debe retornar exists: true si el correo existe', async () => {
      mockPrismaService.usuarios.findUnique.mockResolvedValue(mockUsuario);

      const result = await service.checkEmailExists('test@example.com');

      expect(result).toEqual({ exists: true });
    });

    it('debe retornar exists: false si el correo no existe', async () => {
      mockPrismaService.usuarios.findUnique.mockResolvedValue(null);

      const result = await service.checkEmailExists('noexiste@example.com');

      expect(result).toEqual({ exists: false });
    });
  });

  describe('checkDocumentExists', () => {
    it('debe retornar exists: true si el documento existe', async () => {
      mockPrismaService.usuarios.findFirst.mockResolvedValue(mockUsuario);

      const result = await service.checkDocumentExists('12345678');

      expect(result).toEqual({ exists: true });
    });

    it('debe retornar exists: false si el documento no existe', async () => {
      mockPrismaService.usuarios.findFirst.mockResolvedValue(null);

      const result = await service.checkDocumentExists('87654321');

      expect(result).toEqual({ exists: false });
    });
  });

  describe('remove', () => {
    it('debe lanzar HttpException FORBIDDEN al intentar eliminar administrador', async () => {
      const adminUsuario = {
        ...mockUsuario,
        rol: { nombreRol: 'Administrador' },
      };
      mockPrismaService.usuarios.findUnique.mockResolvedValue(adminUsuario);

      await expect(service.remove(adminUsuario.idUsuario)).rejects.toThrow(
        HttpException,
      );
    });

    it('debe eliminar un usuario exitosamente', async () => {
      const normalUsuario = {
        ...mockUsuario,
        rol: { nombreRol: 'Usuario' },
      };
      mockPrismaService.usuarios.findUnique.mockResolvedValue(normalUsuario);
      mockPrismaService.usuarios.delete.mockResolvedValue(normalUsuario);

      const result = await service.remove(normalUsuario.idUsuario);

      expect(result.success).toBe(true);
      expect(result.message).toBe('Usuario eliminado exitosamente');
    });
  });

  describe('verificarPerfilCliente (Responsable: Hader)', () => {
    it('debe retornar que el cliente debe completar su perfil si faltan datos', async () => {
      const mockClienteIncompleto = {
        ...mockUsuario,
        rol: { nombreRol: 'Cliente' },
        tipoDoc: null,
      };
      mockPrismaService.usuarios.findUnique.mockResolvedValue(mockClienteIncompleto);

      const result = await service.verificarPerfilCliente(mockUsuario.idUsuario);

      expect(result.success).toBe(true);
      expect(result.data.esCliente).toBe(true);
      expect(result.data.completado).toBe(false);
    });

    it('debe retornar que el cliente ya completó su perfil si tiene todos los datos', async () => {
      const mockClienteCompleto = {
        ...mockUsuario,
        rol: { nombreRol: 'Cliente' },
        tipoDoc: 'CC',
        numDocumento: '123456',
        telefono: '300000',
        direccion: 'Calle 123',
        idCiudad: 1,
        perfilCompleto: true,
      };
      mockPrismaService.usuarios.findUnique.mockResolvedValue(mockClienteCompleto);

      const result = await service.verificarPerfilCliente(mockUsuario.idUsuario);

      expect(result.success).toBe(true);
      expect(result.data.completado).toBe(true);
    });
  });

  describe('completarPerfilCliente (Responsable: Hader)', () => {
    it('debe completar el perfil del cliente exitosamente', async () => {
      const mockCliente = {
        ...mockUsuario,
        rol: { nombreRol: 'Cliente' },
      };
      const dto = {
        tipoDoc: 'CC',
        numDocumento: '987654',
        telefono: '3001234567',
        direccion: 'Carrera 45',
        idCiudad: 1,
      };
      mockPrismaService.usuarios.findUnique.mockResolvedValue(mockCliente);
      mockPrismaService.ciudades.findUnique.mockResolvedValue({ idCiudad: 1 });
      mockPrismaService.usuarios.findFirst.mockResolvedValue(null); // No duplicado
      mockPrismaService.usuarios.update.mockResolvedValue({ ...mockCliente, ...dto, perfilCompleto: true });

      const result = await service.completarPerfilCliente(mockUsuario.idUsuario, dto as any);

      expect(result.success).toBe(true);
      expect(mockPrismaService.usuarios.update).toHaveBeenCalled();
    });

    it('debe lanzar excepcion si tipoDoc es invalido', async () => {
      const mockCliente = { ...mockUsuario, rol: { nombreRol: 'Cliente' } };
      mockPrismaService.usuarios.findUnique.mockResolvedValue(mockCliente);
      mockPrismaService.ciudades.findUnique.mockResolvedValue({ idCiudad: 1 });

      const dto = { tipoDoc: 'INVALIDO', numDocumento: '123' };

      await expect(service.completarPerfilCliente('id', dto as any)).rejects.toThrow(HttpException);
    });
  });
});
