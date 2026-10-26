import { Request, Response, NextFunction } from 'express';
import { AppError } from '../errors/app-error';
import { logger } from '../utils/logger';

/**
 * MIDDLEWARE CENTRALIZADO DE MANEJO DE ERRORES HTTP
 * 
 * Estandariza la respuesta de cualquier error en el backend (400, 401, 404, 409, 500)
 * para que siempre respete el contrato de API unificado:
 * { status: 'error', statusCode: number, message: string, errors?: [...] }
 */
export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  // Si es un error de sintaxis en el body JSON enviado por el cliente (body-parser)
  if (err instanceof SyntaxError && 'status' in err && (err as any).status === 400) {
    logger.warn({ err }, 'Error de sintaxis en el payload JSON recibido');
    res.status(400).json({
      status: 'error',
      statusCode: 400,
      message: 'El cuerpo de la petición contiene un JSON con formato o sintaxis inválida',
    });
    return;
  }

  // Si es un error operacional controlado (AppError, ValidationError, NotFoundError, ConflictError)
  if (err instanceof AppError) {
    logger.warn({ err, statusCode: err.statusCode }, err.message);
    res.status(err.statusCode).json({
      status: 'error',
      statusCode: err.statusCode,
      message: err.message,
      ...(err.errors && err.errors.length > 0 && { errors: err.errors }),
    });
    return;
  }

  // Error inesperado o de base de datos no controlado (500)
  logger.error({ err }, 'Error interno no controlado en el servidor');
  res.status(500).json({
    status: 'error',
    statusCode: 500,
    message: 'Ocurrió un error interno en el servidor',
  });
}
