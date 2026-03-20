import { Injectable, Logger } from '@nestjs/common';
import { DriverLocation, DriverConnection } from './interfaces';

/**
 * Servicio para gestionar el tracking de conductores
 * Almacena las ubicaciones en memoria (en producción usar Redis)
 */
@Injectable()
export class TrackingService {
  private readonly logger = new Logger(TrackingService.name);

  // Almacenamiento en memoria de ubicaciones de conductores
  private driverLocations: Map<string, DriverLocation> = new Map();

  // Almacenamiento de conexiones activas
  private driverConnections: Map<string, DriverConnection> = new Map();

  /**
   * Realiza la operación de register connection.
   * @param driverId - driverId parameter
   * @param socketId - socketId parameter
   * @returns El resultado de la operación.
   */
  registerConnection(driverId: string, socketId: string): void {
    const connection: DriverConnection = {
      driverId,
      socketId,
      connectedAt: new Date(),
      lastUpdate: new Date(),
    };
    this.driverConnections.set(driverId, connection);
    this.logger.log(`🚗 Conductor ${driverId} conectado (socket: ${socketId})`);
  }

  /**
   * Realiza la operación de remove connection.
   * @param socketId - socketId parameter
   * @returns El resultado de la operación.
   */
  removeConnection(socketId: string): string | null {
    for (const [driverId, connection] of this.driverConnections.entries()) {
      if (connection.socketId === socketId) {
        this.driverConnections.delete(driverId);
        // Marcar la ubicación como offline
        const location = this.driverLocations.get(driverId);
        if (location) {
          location.isOnline = false;
          this.driverLocations.set(driverId, location);
        }
        this.logger.log(`🚗 Conductor ${driverId} desconectado`);
        return driverId;
      }
    }
    return null;
  }

  /**
   * Realiza la operación de update location.
   * @param driverId - driverId parameter
   * @param latitude - latitude parameter
   * @param longitude - longitude parameter
   * @param socketId - socketId parameter
   * @param heading - heading parameter
   * @param speed - speed parameter
   * @returns El resultado de la operación.
   */
  updateLocation(
    driverId: string,
    latitude: number,
    longitude: number,
    socketId: string,
    heading?: number,
    speed?: number,
  ): DriverLocation {
    const location: DriverLocation = {
      driverId,
      latitude,
      longitude,
      heading,
      speed,
      timestamp: new Date(),
      socketId,
      isOnline: true,
    };

    this.driverLocations.set(driverId, location);

    // Actualizar timestamp de la conexión
    const connection = this.driverConnections.get(driverId);
    if (connection) {
      connection.lastUpdate = new Date();
      this.driverConnections.set(driverId, connection);
    }

    this.logger.debug(
      `📍 Conductor ${driverId}: lat=${latitude.toFixed(6)}, lng=${longitude.toFixed(6)}`,
    );

    return location;
  }

  /**
   * Realiza la operación de get driver location.
   * @param driverId - driverId parameter
   * @returns El resultado de la operación.
   */
  getDriverLocation(driverId: string): DriverLocation | null {
    return this.driverLocations.get(driverId) || null;
  }

  /**
   * Realiza la operación de get all online drivers.
   * @returns El resultado de la operación.
   */
  getAllOnlineDrivers(): DriverLocation[] {
    const onlineDrivers: DriverLocation[] = [];
    for (const location of this.driverLocations.values()) {
      if (location.isOnline) {
        onlineDrivers.push(location);
      }
    }
    return onlineDrivers;
  }

  /**
   * Realiza la operación de is driver online.
   * @param driverId - driverId parameter
   * @returns El resultado de la operación.
   */
  isDriverOnline(driverId: string): boolean {
    const location = this.driverLocations.get(driverId);
    return location?.isOnline ?? false;
  }

  /**
   * Realiza la operación de get stats.
   * @returns El resultado de la operación.
   */
  getStats() {
    return {
      totalConnections: this.driverConnections.size,
      onlineDrivers: this.getAllOnlineDrivers().length,
      totalTracked: this.driverLocations.size,
    };
  }
}
