import { Test, TestingModule } from '@nestjs/testing';
import { PasajesService } from './pasajes.service';
import { PrismaService } from '../../database/prisma.service';

describe('PasajesService', () => {
  let service: PasajesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PasajesService,
        {
          provide: PrismaService,
          useValue: {},
        },
      ],
    }).compile();

    service = module.get<PasajesService>(PasajesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
