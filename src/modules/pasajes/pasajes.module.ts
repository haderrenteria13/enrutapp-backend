import { Module } from '@nestjs/common';
import { PasajesController } from './pasajes.controller';

import { PasajesService } from './pasajes.service';

@Module({
  controllers: [PasajesController],
  providers: [PasajesService],
})
export class PasajesModule {}
