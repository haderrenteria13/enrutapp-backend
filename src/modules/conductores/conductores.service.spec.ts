import { Test, TestingModule } from '@nestjs/testing';
import { ConductoresService } from './conductores.service';
import { PrismaService } from '../../database/prisma.service';

describe('ConductoresService', () => {
  let service: ConductoresService;

  const mockPrismaService = {
    conductores: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    usuarios: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ConductoresService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<ConductoresService>(ConductoresService);
  });

  it('Debe estar definido', () => {
    expect(service).toBeDefined();
  });

  describe('findAll (Responsable: Camilo)', () => {
    it('debe enviar la lista de conductores', async () => {
      const mockUsuarios = [{ 
        idUsuario: 'u1', 
        estado: true, 
        rol: { nombreRol: 'Conductor' }, 
        conductor: { idConductor: 'c1' } 
      }];
      mockPrismaService.usuarios.findMany.mockResolvedValue(mockUsuarios);
      const result = await service.findAll();
      expect(result.data).toBeInstanceOf(Array);
    });
  });

  describe('create (Responsable: Camilo)', () => {
    it('debe registrar un conductor de forma exitosa', async () => {
      const dto = {
        idUsuario: 'u1',
        numeroLicencia: 'LIC-123',
        categoriaLicencia: 'C2',
        fechaVencimientoLicencia: '2026-05-01',
      };
      
      mockPrismaService.usuarios.findUnique.mockResolvedValue({ 
        idUsuario: 'u1', 
        estado: true, 
        rol: { nombreRol: 'Conductor' } 
      });
      mockPrismaService.conductores.findUnique.mockResolvedValue(null);
      mockPrismaService.conductores.create.mockResolvedValue({ 
        idConductor: 'c1', 
        numeroLicencia: 'LIC-123',
        categoriaLicencia: 'C2',
        fechaVencimientoLicencia: new Date('2026-05-01'),
        estado: true
      });

      const result = await service.create(dto as any);
      expect(result.success).toBe(true);
      expect(mockPrismaService.conductores.create).toHaveBeenCalled();
    });
  });
});
