import { Module } from '@nestjs/common';
import { TrackingGateway } from './tracking.gateway';
import { TrackingService } from './tracking.service';

/**
 * Módulo de tracking en tiempo real para conductores
 * Utiliza WebSockets (Socket.io) para comunicación bidireccional
 */
@Module({
  providers: [TrackingGateway, TrackingService],
  exports: [TrackingService],
})
export class TrackingModule {}
