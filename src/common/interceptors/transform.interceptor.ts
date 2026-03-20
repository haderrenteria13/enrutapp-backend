import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

/**
 * Interfaz para respuesta estandarizada
 */
export interface Response<T> {
  success: boolean;
  data?: T;
  message?: string;
}

/**
 * Interceptor para transformar respuestas a un formato estándar
 */
@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<
  T,
  Response<T>
> {
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<Response<T>> {
    return next.handle().pipe(
      map((data: T): Response<T> => {
        // Si ya tiene el formato correcto, devolverlo tal cual
        if (data && typeof data === 'object' && 'success' in data) {
          return data as Response<T>;
        }

        // Transformar a formato estándar
        return {
          success: true,
          data,
        };
      }),
    );
  }
}
