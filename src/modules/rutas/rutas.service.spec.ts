import { Test, TestingModule } from '@nestjs/testing';
import { RutasService } from './rutas.service';
import { PrismaService } from '../../database/prisma.service';

describe('RutasService', () => {
  let service: RutasService;
  let prisma: PrismaService;

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
      providers: [
        RutasService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<RutasService>(RutasService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should have PrismaService injected', () => {
    expect(prisma).toBeDefined();
  });

  describe('findAll', () => {
    it('should return an array of rutas', async () => {
      const mockRutas = [
        {
          idRuta: '1',
          distancia: 100,
          precioBase: 50000,
          tiempoEstimado: '2:00',
          estado: 'Activa',
          origen: { ubicacion: { nombreUbicacion: 'Medellín' } },
          destino: { ubicacion: { nombreUbicacion: 'Bogotá' } },
        },
      ];

      mockPrismaService.ruta.findMany.mockResolvedValue(mockRutas);

      const result = await service.findAll();

      expect(result).toEqual(mockRutas);
      expect(mockPrismaService.ruta.findMany).toHaveBeenCalledTimes(1);
    });
  });

  describe('create', () => {
    it('should create a new ruta', async () => {
      const mockData = {
        idOrigen: 'origen-1',
        idDestino: 'destino-1',
        distancia: 100,
        precioBase: 50000,
        tiempoEstimado: '2:00',
        estado: 'Activa',
      };

      const mockRuta = {
        idRuta: '1',
        ...mockData,
        origen: { ubicacion: { nombreUbicacion: 'Medellín' } },
        destino: { ubicacion: { nombreUbicacion: 'Bogotá' } },
      };

      mockPrismaService.ruta.create.mockResolvedValue(mockRuta);

      const result = await service.create(mockData);

      expect(result).toEqual(mockRuta);
      expect(mockPrismaService.ruta.create).toHaveBeenCalledTimes(1);
    });
  });
});
