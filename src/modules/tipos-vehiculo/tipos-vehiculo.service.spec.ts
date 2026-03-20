import { Test, TestingModule } from '@nestjs/testing';
import { TiposVehiculoService } from './tipos-vehiculo.service';
import { PrismaService } from '../../database/prisma.service';

describe('TiposVehiculoService', () => {
  let service: TiposVehiculoService;

  const mockPrismaService = {
    tiposVehiculo: {
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
        TiposVehiculoService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<TiposVehiculoService>(TiposVehiculoService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
