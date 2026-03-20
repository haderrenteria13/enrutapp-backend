import { Test, TestingModule } from '@nestjs/testing';
import { EncomiendasService } from './encomiendas.service';
import { PrismaService } from '../../database/prisma.service';

describe('EncomiendasService', () => {
  let service: EncomiendasService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EncomiendasService,
        {
          provide: PrismaService,
          useValue: {},
        },
      ],
    }).compile();

    service = module.get<EncomiendasService>(EncomiendasService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
