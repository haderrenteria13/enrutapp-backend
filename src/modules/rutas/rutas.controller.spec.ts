import { Test, TestingModule } from '@nestjs/testing';
import { RutasController } from './rutas.controller';
import { RutasService } from './rutas.service';
import { PrismaService } from '../../database/prisma.service';

describe('RutasController', () => {
  let controller: RutasController;
  let service: RutasService;

  // Mock de PrismaService
  const mockPrismaService = {
    ruta: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    ubicacion: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
    origen: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
    destino: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RutasController],
      providers: [
        RutasService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    controller = module.get<RutasController>(RutasController);
    service = module.get<RutasService>(RutasService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should have RutasService injected', () => {
    expect(service).toBeDefined();
  });
});
