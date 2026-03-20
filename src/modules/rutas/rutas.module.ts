import { Module } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { RutasService } from './rutas.service';
import { RutasController } from './rutas.controller';

@Module({
  controllers: [RutasController],
  providers: [RutasService, PrismaService],
})
export class RutasModule {}
