import { Test, TestingModule } from '@nestjs/testing';
import { ContratosService } from './contratos.service';
import { PrismaService } from '../../database/prisma.service';

describe('ContratosService', () => {
  let service: ContratosService;

  const mockPrismaService = {
    contratos: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    turnos: {
      findUnique: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ContratosService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<ContratosService>(ContratosService);
  });

  it('Debe estar definido', () => {
    expect(service).toBeDefined();
  });

  describe('findAll (Responsable: Andrés)', () => {
    it('debe listar todos los contratos exitosamente', async () => {
      const mockContratos = [{ idContrato: 'test1', estado: true }];
      mockPrismaService.contratos.findMany.mockResolvedValue(mockContratos);

      const result = await service.findAll();
      expect(result.data).toEqual(mockContratos);
    });
  });

  describe('create (Responsable: Andrés)', () => {
    it('debe registrar un contrato adecuadamente', async () => {
      const dto = {
        idTurno: 't1',
        titularNombre: 'Juan Perez',
        titularDocumento: '10000',
        placa: 'XYZ123',
        origen: 'BOG',
        destino: 'MED',
        fechaOrigen: '2026-05-01',
        fechaDestino: '2026-05-01',
      };
      
      mockPrismaService.turnos.findUnique.mockResolvedValue({ idTurno: 't1' });
      mockPrismaService.contratos.create.mockResolvedValue({ idContrato: 'test1', ...dto });

      const mockFile = {
        fieldname: 'pdfDocument',
        originalname: 'test.pdf',
        encoding: '7bit',
        mimetype: 'application/pdf',
        destination: '/uploads',
        filename: 'test-123.pdf',
        path: '/uploads/test-123.pdf',
        size: 1024,
      } as Express.Multer.File;

      const result = await service.create(dto as any, mockFile);
      expect(result.success).toBe(true);
      expect(mockPrismaService.contratos.create).toHaveBeenCalled();
    });
  });
});
