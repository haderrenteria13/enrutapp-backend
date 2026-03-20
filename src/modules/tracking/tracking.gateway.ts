import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { TrackingService } from './tracking.service';
import { UpdateLocationDto } from './dto';

/**
 * Gateway de WebSocket para tracking de conductores en tiempo real
 * Maneja la comunicación bidireccional entre conductores y clientes web/mobile
 */
@WebSocketGateway({
  namespace: '/tracking',
  cors: {
    origin: '*', // En producción, especificar los orígenes permitidos
    methods: ['GET', 'POST'],
    credentials: true,
  },
  transports: ['websocket', 'polling'],
})
export class TrackingGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(TrackingGateway.name);

  constructor(private readonly trackingService: TrackingService) {}

  /**
   * Inicialización del Gateway
   */
  afterInit() {
    this.logger.log('🚀 Tracking Gateway inicializado');
  }

  /**
   * Maneja nuevas conexiones
   */
  handleConnection(client: Socket) {
    this.logger.log(`📱 Cliente conectado: ${client.id}`);

    // Enviar estadísticas al conectar
    client.emit('stats', this.trackingService.getStats());
  }

  /**
   * Maneja desconexiones
   */
  handleDisconnect(client: Socket) {
    this.logger.log(`📱 Cliente desconectado: ${client.id}`);

    // Si es un conductor, actualizar su estado
    const driverId = this.trackingService.removeConnection(client.id);

    if (driverId) {
      // Notificar a los clientes web que el conductor está offline
      this.server.emit('driverOffline', { driverId });
    }
  }

  /**
   * Registro de conductor al conectarse
   */
  @SubscribeMessage('registerDriver')
  handleRegisterDriver(
    @MessageBody() data: { driverId: string },
    @ConnectedSocket() client: Socket,
  ) {
    this.logger.log(`📥 Datos de registro recibidos: ${JSON.stringify(data)}`);

    const driverId = data?.driverId;

    if (!driverId || typeof driverId !== 'string') {
      this.logger.warn(
        `⚠️ Intento de registro con driverId inválido: ${driverId}`,
      );
      return {
        success: false,
        message: 'driverId es requerido y debe ser un string (UUID)',
      };
    }

    this.trackingService.registerConnection(driverId, client.id);

    // Unir al conductor a su room específico
    void client.join(`driver-${driverId}`);

    // Notificar a los clientes web que hay un nuevo conductor online
    this.server.emit('driverOnline', { driverId });

    this.logger.log(`✅ Conductor ${driverId} registrado`);

    return { success: true, message: 'Conductor registrado correctamente' };
  }

  /**
   * Actualización de ubicación del conductor
   * Este es el método principal que recibe las coordenadas GPS
   */
  @SubscribeMessage('updateLocation')
  handleUpdateLocation(
    @MessageBody() data: UpdateLocationDto,
    @ConnectedSocket() client: Socket,
  ) {
    const { driverId, latitude, longitude, heading, speed } = data;

    // Simular guardado en base de datos
    this.logger.debug(
      `📍 [TRACKING] Ubicación recibida: driver=${driverId}, lat=${latitude}, lng=${longitude}`,
    );

    // Actualizar ubicación en memoria
    const location = this.trackingService.updateLocation(
      driverId,
      latitude,
      longitude,
      client.id,
      heading,
      speed,
    );

    // Broadcast a todos los clientes web que están viendo el mapa
    this.server.emit('locationUpdate', {
      driverId,
      latitude,
      longitude,
      heading,
      speed,
      timestamp: location.timestamp,
      isOnline: true,
    });

    // También emitir al room específico del conductor (para clientes que solo siguen a este conductor)
    this.server.to(`driver-${driverId}`).emit('driverLocationUpdate', {
      driverId,
      latitude,
      longitude,
      heading,
      speed,
      timestamp: location.timestamp,
    });

    return { success: true, receivedAt: new Date().toISOString() };
  }

  /**
   * Suscribirse a las actualizaciones de un conductor específico
   */
  @SubscribeMessage('subscribeToDriver')
  handleSubscribeToDriver(
    @MessageBody() data: { driverId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const { driverId } = data;

    // Unir al cliente al room del conductor
    void client.join(`driver-${driverId}`);

    // Enviar la última ubicación conocida si existe
    const lastLocation = this.trackingService.getDriverLocation(driverId);

    if (lastLocation) {
      client.emit('driverLocationUpdate', lastLocation);
    }

    this.logger.log(
      `👁️ Cliente ${client.id} suscrito al conductor ${driverId}`,
    );

    return {
      success: true,
      lastLocation,
      isOnline: this.trackingService.isDriverOnline(driverId),
    };
  }

  /**
   * Desuscribirse de un conductor
   */
  @SubscribeMessage('unsubscribeFromDriver')
  handleUnsubscribeFromDriver(
    @MessageBody() data: { driverId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const { driverId } = data;
    void client.leave(`driver-${driverId}`);

    this.logger.log(
      `👁️ Cliente ${client.id} desuscrito del conductor ${driverId}`,
    );

    return { success: true };
  }

  /**
   * Obtener todos los conductores online
   */
  @SubscribeMessage('getOnlineDrivers')
  handleGetOnlineDrivers() {
    const drivers = this.trackingService.getAllOnlineDrivers();

    return { success: true, drivers };
  }

  /**
   * Obtener ubicación de un conductor específico
   */
  @SubscribeMessage('getDriverLocation')
  handleGetDriverLocation(@MessageBody() data: { driverId: string }) {
    const { driverId } = data;
    const location = this.trackingService.getDriverLocation(driverId);

    return {
      success: true,
      location,
      isOnline: this.trackingService.isDriverOnline(driverId),
    };
  }

  /**
   * Obtener estadísticas del tracking
   */
  @SubscribeMessage('getStats')
  handleGetStats() {
    return this.trackingService.getStats();
  }
}
