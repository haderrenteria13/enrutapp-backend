/**
 * Interfaz para respuestas exitosas de la API
 */
export interface ApiSuccessResponse<T = any> {
  success: true;
  data?: T;
  message?: string;
}

/**
 * Interfaz para respuestas de error de la API
 */
export interface ApiErrorResponse {
  success: false;
  statusCode: number;
  message: string;
  error?: string;
  timestamp?: string;
}

/**
 * Tipo unión para cualquier respuesta de la API
 */
export type ApiResponse<T = any> = ApiSuccessResponse<T> | ApiErrorResponse;
