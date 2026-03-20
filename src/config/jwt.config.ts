/**
 * Configuración de JWT
 * Centraliza la configuración de autenticación JWT
 */
export const JwtConfig = {
  secret: process.env.JWT_SECRET || 'fallback-secret-key-change-in-production',
  expiresIn: process.env.JWT_EXPIRES_IN || '1d',
  refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
};
