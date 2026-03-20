/**
 * Configuración de base de datos
 * Centraliza la configuración de Prisma y base de datos
 */
export const DatabaseConfig = {
  url: process.env.DATABASE_URL,

  // Opciones de conexión
  connection: {
    connectionLimit: parseInt(process.env.DB_CONNECTION_LIMIT || '10', 10),
  },
};
