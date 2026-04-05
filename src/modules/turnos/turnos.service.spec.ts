import { Test, TestingModule } from '@nestjs/testing';
import { TurnosService } from './turnos.service';
import { PrismaService } from '../../database/prisma.service';
import { HttpException, HttpStatus } from '@nestjs/common';

const mockPrismaService = {
  turnos: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  conductores: {
    findUnique: jest.fn(),
  },
  vehiculos: {
    findUnique: jest.fn(),
  },
  ruta: {
    findUnique: jest.fn(),
  },
};

describe('TurnosService (Responsable: Hader)', () => {
  let service: TurnosService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TurnosService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<TurnosService>(TurnosService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('Debe estar definido', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('Debe retornar un arreglo de turnos exitosamente', async () => {
      const mockTurnos = [
        { idTurno: '1', estado: 'Programado' },
        { idTurno: '2', estado: 'En Ruta' },
      ];
      
      mockPrismaService.turnos.findMany.mockResolvedValue(mockTurnos);

      const result = await service.findAll();

      expect(prisma.turnos.findMany).toHaveBeenCalled();
      expect(result).toEqual({
        success: true,
        data: mockTurnos,
        message: 'Turnos obtenidos exitosamente',
      });
    });

    it('Debe lanzar una excepcion si falla la base de datos', async () => {
      mockPrismaService.turnos.findMany.mockRejectedValue(new Error('DB Error'));

      await expect(service.findAll()).rejects.toThrow(HttpException);
    });
  });

  describe('findOne', () => {
    it('Debe retornar un turno si existe', async () => {
      const mockTurno = { idTurno: '1', estado: 'Programado' };
      mockPrismaService.turnos.findUnique.mockResolvedValue(mockTurno);

      const result = await service.findOne('1');

      expect(prisma.turnos.findUnique).toHaveBeenCalledWith(expect.objectContaining({
        where: { idTurno: '1' }
      }));
      expect(result.data).toEqual(mockTurno);
    });

    it('Debe lanzar excepcion 404 si el turno no existe', async () => {
      mockPrismaService.turnos.findUnique.mockResolvedValue(null);

      try {
        await service.findOne('999');
      } catch (e) {
        expect(e).toBeInstanceOf(HttpException);
        expect(e.getStatus()).toBe(HttpStatus.NOT_FOUND);
      }
    });
  });

  describe('create', () => {
    it('Debe crear un turno correctamente con conductor, vehiculo y ruta validos', async () => {
      const createDto = { 
        idConductor: 'c1', 
        idVehiculo: 'v1', 
        idRuta: 'r1', 
        fecha: '2026-04-05', 
        hora: '14:00' 
      };

      mockPrismaService.conductores.findUnique.mockResolvedValue({ idConductor: 'c1', estado: true });
      mockPrismaService.vehiculos.findUnique.mockResolvedValue({ idVehiculo: 'v1', estado: true, capacidadPasajeros: 15 });
      mockPrismaService.ruta.findUnique.mockResolvedValue({ idRuta: 'r1' });
      mockPrismaService.turnos.create.mockResolvedValue({ idTurno: 't1', ...createDto });

      const result = await service.create(createDto as any);

      expect(result.success).toBe(true);
      expect(prisma.turnos.create).toHaveBeenCalled();
    });

    it('Debe lanzar excepcion si el conductor no existe o esta inactivo', async () => {
      const createDto = { idConductor: 'c1', idVehiculo: 'v1', idRuta: 'r1', fecha: '2026-04-05', hora: '14:00' };
      // Conductor inactivo
      mockPrismaService.conductores.findUnique.mockResolvedValue({ idConductor: 'c1', estado: false });

      await expect(service.create(createDto as any)).rejects.toThrow(HttpException);
    });
  });
});
