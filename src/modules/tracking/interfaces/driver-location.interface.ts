/**
 * Interface para la ubicación del conductor
 */
export interface DriverLocation {
  driverId: string; // UUID del usuario
  latitude: number;
  longitude: number;
  heading?: number;
  speed?: number;
  timestamp: Date;
  socketId: string;
  isOnline: boolean;
}

/**
 * Interface para el estado de conexión del conductor
 */
export interface DriverConnection {
  driverId: string; // UUID del usuario
  socketId: string;
  connectedAt: Date;
  lastUpdate: Date;
}
