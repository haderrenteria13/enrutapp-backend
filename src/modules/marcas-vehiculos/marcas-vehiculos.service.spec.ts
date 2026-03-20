import { Test, TestingModule } from '@nestjs/testing';
import { MarcasVehiculosService } from './marcas-vehiculos.service';
import { PrismaService } from '../../database/prisma.service';

describe('MarcasVehiculosService', () => {
  let service: MarcasVehiculosService;

  const mockPrismaService = {
    marcasVehiculos: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MarcasVehiculosService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<MarcasVehiculosService>(MarcasVehiculosService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
