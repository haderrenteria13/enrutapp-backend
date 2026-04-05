import { Test, TestingModule } from '@nestjs/testing';
import { VehiculosService } from './vehiculos.service';
import { PrismaService } from '../../database/prisma.service';

describe('VehiculosService', () => {
  let service: VehiculosService;

  const mockPrismaService = {
    vehiculos: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    tiposVehiculo: {
      findUnique: jest.fn(),
    },
    marcasVehiculos: {
      findUnique: jest.fn(),
    },
    usuarios: {
      findUnique: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VehiculosService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<VehiculosService>(VehiculosService);
  });

  it('Debe estar definido', () => {
    expect(service).toBeDefined();
  });

  describe('findAll (Responsable: Andrés)', () => {
    it('debe retornar todos los vehículos exitosamente', async () => {
      const mockVehiculos = [{ idVehiculo: 'v1', placa: 'XYZ-123' }];
      mockPrismaService.vehiculos.findMany.mockResolvedValue(mockVehiculos);

      const result = await service.findAll();

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockVehiculos);
    });
  });

  describe('findOne (Responsable: Andrés)', () => {
    it('debe encontrar un vehículo por su ID', async () => {
      const mockVehiculo = { idVehiculo: 'v1', placa: 'XYZ-123' };
      mockPrismaService.vehiculos.findUnique.mockResolvedValue(mockVehiculo);

      const result = await service.findOne('v1');

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockVehiculo);
    });
  });

  describe('create (Responsable: Andrés)', () => {
    it('debe crear un vehículo si los datos son correctos', async () => {
      const dto = { 
        placa: 'XYZ-123', 
        idTipoVehiculo: 't1', 
        idMarcaVehiculo: 'm1',
        soatVencimiento: '2030-01-01',
        tecnomecanicaVencimiento: '2030-01-01',
        seguroVencimiento: '2030-01-01',
        idPropietario: 'u1'
      };
      mockPrismaService.tiposVehiculo.findUnique.mockResolvedValue({ idTipoVehiculo: 't1' });
      mockPrismaService.marcasVehiculos.findUnique.mockResolvedValue({ idMarcaVehiculo: 'm1' });
      mockPrismaService.usuarios.findUnique.mockResolvedValue({ idUsuario: 'u1' });
      mockPrismaService.vehiculos.findUnique.mockResolvedValue(null);
      mockPrismaService.vehiculos.create.mockResolvedValue({ idVehiculo: 'v1', ...dto });

      const result = await service.create(dto as any);

      expect(result.success).toBe(true);
      expect(mockPrismaService.vehiculos.create).toHaveBeenCalled();
    });
  });
});
