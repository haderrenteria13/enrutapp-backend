import { Test, TestingModule } from '@nestjs/testing';
import { TiposVehiculoController } from './tipos-vehiculo.controller';
import { TiposVehiculoService } from './tipos-vehiculo.service';

describe('TiposVehiculoController', () => {
  let controller: TiposVehiculoController;

  const mockTiposVehiculoService = {
    findAll: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TiposVehiculoController],
      providers: [
        {
          provide: TiposVehiculoService,
          useValue: mockTiposVehiculoService,
        },
      ],
    }).compile();

    controller = module.get<TiposVehiculoController>(TiposVehiculoController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
