import { SetMetadata } from '@nestjs/common';

/**
 * Decorador para marcar rutas como públicas (sin autenticación)
 * @example
 * @Public()
 * @Get('login')
 * async login() { ... }
 */
export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
