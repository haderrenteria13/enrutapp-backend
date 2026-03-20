import { Module } from '@nestjs/common';
import { CiudadesController } from './ciudades.controller';
import { CiudadesService } from './ciudades.service';

/**
 * Módulo de Ciudades
 * Gestiona la información de ciudades disponibles en el sistema
 */
@Module({
  controllers: [CiudadesController],
  providers: [CiudadesService],
  exports: [CiudadesService],
})
export class CiudadesModule {}
