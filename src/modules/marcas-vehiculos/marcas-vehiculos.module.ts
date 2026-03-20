import { Module } from '@nestjs/common';
import { MarcasVehiculosController } from './marcas-vehiculos.controller';
import { MarcasVehiculosService } from './marcas-vehiculos.service';
import { DatabaseModule } from '../../database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [MarcasVehiculosController],
  providers: [MarcasVehiculosService],
  exports: [MarcasVehiculosService],
})
export class MarcasVehiculosModule {}
