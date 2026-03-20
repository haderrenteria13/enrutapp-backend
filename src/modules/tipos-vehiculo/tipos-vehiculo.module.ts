import { Module } from '@nestjs/common';
import { TiposVehiculoController } from './tipos-vehiculo.controller';
import { TiposVehiculoService } from './tipos-vehiculo.service';
import { DatabaseModule } from '../../database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [TiposVehiculoController],
  providers: [TiposVehiculoService],
  exports: [TiposVehiculoService],
})
export class TiposVehiculoModule {}
