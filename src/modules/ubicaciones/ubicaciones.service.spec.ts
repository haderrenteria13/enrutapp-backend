import { Test, TestingModule } from '@nestjs/testing';
import { UbicacionesService } from './ubicaciones.service';
import { PrismaService } from '../../database/prisma.service';

describe('UbicacionesService', () => {
  let service: UbicacionesService;

  const mockPrisma = {
    ubicaciones: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UbicacionesService,
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
      ],
    }).compile();

    service = module.get<UbicacionesService>(UbicacionesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
