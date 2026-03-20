import { Module, Global } from '@nestjs/common';
import { PrismaService } from './prisma.service';

/**
 * Módulo de Base de Datos
 * Proporciona el servicio de Prisma a toda la aplicación
 * @Global hace que este módulo sea global, no necesita ser importado en cada módulo
 */
@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class DatabaseModule {}
