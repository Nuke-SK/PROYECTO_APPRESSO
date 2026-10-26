import { Request, Response, NextFunction } from 'express';
import { deepTrim } from '../utils/recursion.util';

// MIDDLEWARE DE SANITIZACIÓN DE DATOS
// ESTE MIDDLEWARE SE ENCARGA DE LIMPIAR LOS DATOS DE ENTRADA (BODY, QUERY, PARAMS) ELIMINANDO ESPACIOS EN BLANCO
// Y VALIDANDO QUE LOS DATOS SEAN OBJETOS O ARRAYS, APLICANDO LA FUNCIÓN deepTrim RECURSIVAMENTE
export function sanitize(req: Request, _res: Response, next: NextFunction): void {
  if (req.body && typeof req.body === 'object') {
    req.body = deepTrim(req.body);
  }

  if (req.query && typeof req.query === 'object') {
    req.query = deepTrim(req.query as Record<string, unknown>) as typeof req.query;
  }

  if (req.params && typeof req.params === 'object') {
    req.params = deepTrim(req.params);
  }

  next();
}
