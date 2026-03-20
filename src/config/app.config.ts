/**
 * Configuración de la aplicación
 * Centraliza todas las variables de entorno y configuraciones
 */
export const AppConfig = {
  port: parseInt(process.env.PORT || '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  apiPrefix: 'api',

  cors: {
    origin: process.env.CORS_ORIGIN || true,
    credentials: true,
  },

  isDevelopment: () => AppConfig.nodeEnv === 'development',
  isProduction: () => AppConfig.nodeEnv === 'production',
};
