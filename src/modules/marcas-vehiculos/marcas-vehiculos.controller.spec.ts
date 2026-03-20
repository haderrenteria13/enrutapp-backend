import { Test, TestingModule } from '@nestjs/testing';
import { MarcasVehiculosController } from './marcas-vehiculos.controller';
import { MarcasVehiculosService } from './marcas-vehiculos.service';

describe('MarcasVehiculosController', () => {
  let controller: MarcasVehiculosController;

  const mockMarcasVehiculosService = {
    findAll: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MarcasVehiculosController],
      providers: [
        {
          provide: MarcasVehiculosService,
          useValue: mockMarcasVehiculosService,
        },
      ],
    }).compile();

    controller = module.get<MarcasVehiculosController>(
      MarcasVehiculosController,
    );
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
