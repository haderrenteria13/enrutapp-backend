/* eslint-disable @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-return */
import { Test, TestingModule } from '@nestjs/testing';
import { HttpException, HttpStatus } from '@nestjs/common';
import { RolesService } from './roles.service';
import { PrismaService } from '../../database/prisma.service';
import { CreateRolDto, UpdateRolDto } from './dto';

describe('RolesService', () => {
  let service: RolesService;

  const mockPrismaService = {
    roles: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    rolesPermisos: {
      createMany: jest.fn(),
      deleteMany: jest.fn(),
    },
    $transaction: jest.fn((callback: (prisma: any) => any) =>
      callback(mockPrismaService),
    ) as jest.Mock,
  };

  const mockRol = {
    idRol: '123e4567-e89b-12d3-a456-426614174000',
    nombreRol: 'Test Role',
    descripcion: 'Test Description',
    estado: true,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RolesService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<RolesService>(RolesService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('debe retornar todos los roles exitosamente', async () => {
      const mockRoles = [mockRol];
      mockPrismaService.roles.findMany.mockResolvedValue(mockRoles);

      const result = await service.findAll();

      expect(result).toEqual({
        success: true,
        data: mockRoles,
        message: 'Roles obtenidos exitosamente',
      });
      expect(mockPrismaService.roles.findMany).toHaveBeenCalledWith({
        include: { usuarios: true },
      });
    });

    it('debe lanzar HttpException si hay un error', async () => {
      mockPrismaService.roles.findMany.mockRejectedValue(
        new Error('Database error'),
      );

      await expect(service.findAll()).rejects.toThrow(HttpException);
    });
  });

  describe('findOne', () => {
    it('debe retornar un rol por ID exitosamente', async () => {
      mockPrismaService.roles.findUnique.mockResolvedValue(mockRol);

      const result = await service.findOne(mockRol.idRol);

      expect(result).toEqual({
        success: true,
        data: mockRol,
        message: 'Rol encontrado',
      });
      expect(mockPrismaService.roles.findUnique).toHaveBeenCalledWith({
        where: { idRol: mockRol.idRol },
        include: { usuarios: true },
      });
    });

    it('debe lanzar HttpException NOT_FOUND si el rol no existe', async () => {
      mockPrismaService.roles.findUnique.mockResolvedValue(null);

      await expect(service.findOne('nonexistent-id')).rejects.toThrow(
        new HttpException(
          { success: false, error: 'Rol no encontrado' },
          HttpStatus.NOT_FOUND,
        ),
      );
    });
  });

  describe('create', () => {
    it('debe crear un nuevo rol exitosamente', async () => {
      const createRolDto: CreateRolDto = {
        nombreRol: 'New Role',
        descripcion: 'New Description',
      };

      mockPrismaService.roles.create.mockResolvedValue({
        ...mockRol,
        nombreRol: createRolDto.nombreRol,
      });

      const result = await service.create(createRolDto);

      expect(result.success).toBe(true);
      expect(result.message).toBe('Rol creado exitosamente');
      expect(mockPrismaService.roles.create).toHaveBeenCalled();
    });

    it('debe lanzar HttpException CONFLICT si el nombre ya existe', async () => {
      const createRolDto: CreateRolDto = {
        nombreRol: 'Existing Role',
      };

      const prismaError = new Error('Unique constraint violation');

      (prismaError as any).code = 'P2002';

      mockPrismaService.roles.create.mockRejectedValue(prismaError);

      await expect(service.create(createRolDto)).rejects.toThrow(HttpException);
    });
  });

  describe('update', () => {
    it('debe actualizar un rol exitosamente', async () => {
      const updateRolDto: UpdateRolDto = {
        descripcion: 'Updated Description',
      };

      mockPrismaService.roles.findUnique.mockResolvedValue(mockRol);
      mockPrismaService.roles.update.mockResolvedValue({
        ...mockRol,
        ...updateRolDto,
      });

      const result = await service.update(mockRol.idRol, updateRolDto);

      expect(result.success).toBe(true);
      expect(result.message).toBe('Rol actualizado exitosamente');
      expect(mockPrismaService.roles.update).toHaveBeenCalled();
    });

    it('debe lanzar HttpException FORBIDDEN al intentar editar rol Administrador', async () => {
      const adminRol = { ...mockRol, nombreRol: 'Administrador' };
      mockPrismaService.roles.findUnique.mockResolvedValue(adminRol);

      await expect(
        service.update(adminRol.idRol, { descripcion: 'test' }),
      ).rejects.toThrow(
        new HttpException(
          {
            success: false,
            error: 'No se puede editar el rol Administrador',
            message:
              'El rol Administrador está protegido y no puede ser modificado',
          },
          HttpStatus.FORBIDDEN,
        ),
      );
    });

    it('debe manejar alias "activo" correctamente', async () => {
      const updateRolDto: UpdateRolDto = {
        activo: false,
      };

      mockPrismaService.roles.findUnique.mockResolvedValue(mockRol);
      mockPrismaService.roles.update.mockResolvedValue({
        ...mockRol,
        estado: false,
      });

      await service.update(mockRol.idRol, updateRolDto);

      expect(mockPrismaService.roles.update).toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('debe eliminar un rol exitosamente', async () => {
      const rolSinUsuarios = { ...mockRol, usuarios: [] };
      mockPrismaService.roles.findUnique.mockResolvedValue(rolSinUsuarios);
      mockPrismaService.roles.delete.mockResolvedValue(mockRol);

      const result = await service.remove(mockRol.idRol);

      expect(result.success).toBe(true);
      expect(result.message).toBe('Rol eliminado exitosamente');
      expect(mockPrismaService.roles.delete).toHaveBeenCalledWith({
        where: { idRol: mockRol.idRol },
      });
    });

    it('debe lanzar HttpException FORBIDDEN al intentar eliminar rol Administrador', async () => {
      const adminRol = {
        ...mockRol,
        nombreRol: 'Administrador',
        usuarios: [],
      };
      mockPrismaService.roles.findUnique.mockResolvedValue(adminRol);

      await expect(service.remove(adminRol.idRol)).rejects.toThrow(
        new HttpException(
          {
            success: false,
            error: 'No se puede eliminar el rol Administrador',
          },
          HttpStatus.FORBIDDEN,
        ),
      );
    });

    it('debe lanzar HttpException CONFLICT si el rol tiene usuarios asociados', async () => {
      const rolConUsuarios = {
        ...mockRol,
        usuarios: [{ idUsuario: '123' }],
      };
      mockPrismaService.roles.findUnique.mockResolvedValue(rolConUsuarios);

      await expect(service.remove(mockRol.idRol)).rejects.toThrow(
        new HttpException(
          {
            success: false,
            error: 'No se puede eliminar un rol con usuarios asociados',
          },
          HttpStatus.CONFLICT,
        ),
      );
    });
  });
});
