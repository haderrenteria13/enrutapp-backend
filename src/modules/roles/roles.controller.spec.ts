import { Test, TestingModule } from '@nestjs/testing';
import { RolesController } from './roles.controller';
import { RolesService } from './roles.service';
import { CreateRolDto, UpdateRolDto } from './dto';

describe('RolesController', () => {
  let controller: RolesController;

  const mockRolesService = {
    findAll: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  const mockRol = {
    idRol: '123e4567-e89b-12d3-a456-426614174000',
    nombreRol: 'Test Role',
    descripcion: 'Test Description',
    estado: true,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RolesController],
      providers: [
        {
          provide: RolesService,
          useValue: mockRolesService,
        },
      ],
    }).compile();

    controller = module.get<RolesController>(RolesController);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    it('debe retornar todos los roles', async () => {
      const expectedResult = {
        success: true,
        data: [mockRol],
        message: 'Roles obtenidos exitosamente',
      };

      mockRolesService.findAll.mockResolvedValue(expectedResult);

      const result = await controller.findAll();

      expect(result).toEqual(expectedResult);
      expect(mockRolesService.findAll).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('debe retornar un rol por ID', async () => {
      const expectedResult = {
        success: true,
        data: mockRol,
        message: 'Rol encontrado',
      };

      mockRolesService.findOne.mockResolvedValue(expectedResult);

      const result = await controller.findOne(mockRol.idRol);

      expect(result).toEqual(expectedResult);
      expect(mockRolesService.findOne).toHaveBeenCalledWith(mockRol.idRol);
    });
  });

  describe('create', () => {
    it('debe crear un nuevo rol', async () => {
      const createRolDto: CreateRolDto = {
        nombreRol: 'New Role',
        descripcion: 'New Description',
      };

      const expectedResult = {
        success: true,
        data: { ...mockRol, nombreRol: createRolDto.nombreRol },
        message: 'Rol creado exitosamente',
      };

      mockRolesService.create.mockResolvedValue(expectedResult);

      const result = await controller.create(createRolDto);

      expect(result).toEqual(expectedResult);
      expect(mockRolesService.create).toHaveBeenCalledWith(createRolDto);
    });
  });

  describe('update', () => {
    it('debe actualizar un rol existente', async () => {
      const updateRolDto: UpdateRolDto = {
        descripcion: 'Updated Description',
      };

      const expectedResult = {
        success: true,
        data: { ...mockRol, ...updateRolDto },
        message: 'Rol actualizado exitosamente',
      };

      mockRolesService.update.mockResolvedValue(expectedResult);

      const result = await controller.update(mockRol.idRol, updateRolDto);

      expect(result).toEqual(expectedResult);
      expect(mockRolesService.update).toHaveBeenCalledWith(
        mockRol.idRol,
        updateRolDto,
      );
    });
  });

  describe('remove', () => {
    it('debe eliminar un rol', async () => {
      const expectedResult = {
        success: true,
        message: 'Rol eliminado exitosamente',
      };

      mockRolesService.remove.mockResolvedValue(expectedResult);

      const result = await controller.remove(mockRol.idRol);

      expect(result).toEqual(expectedResult);
      expect(mockRolesService.remove).toHaveBeenCalledWith(
        mockRol.idRol,
        false,
      );
    });
  });
});
