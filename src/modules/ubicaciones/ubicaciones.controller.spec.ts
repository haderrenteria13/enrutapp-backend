import { Test, TestingModule } from '@nestjs/testing';
import { UbicacionesController } from './ubicaciones.controller';
import { UbicacionesService } from './ubicaciones.service';

describe('UbicacionesController', () => {
  let controller: UbicacionesController;

  const mockUbicacionesService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UbicacionesController],
      providers: [
        {
          provide: UbicacionesService,
          useValue: mockUbicacionesService,
        },
      ],
    }).compile();

    controller = module.get<UbicacionesController>(UbicacionesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
