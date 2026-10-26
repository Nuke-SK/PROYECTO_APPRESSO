import { Request, Response, NextFunction } from 'express';
import { ZodTypeAny, ZodError } from 'zod';

export type ValidationTarget = 'body' | 'query' | 'params';

/**
 * FÁBRICA DE MIDDLEWARES DE VALIDACIÓN CON ZOD
 * 
 * @param schema - Esquema Zod (DTO) contra el cual se validarán los datos
 * @param target - Qué parte de la petición validar: 'body' (default), 'query' o 'params'
 * 
 * Si la validación pasa: reemplaza req[target] con los datos ya parseados y tipados, y llama a next().
 * Si la validación falla: detiene la petición inmediatamente con HTTP 400 y los detalles del error.
 */
export function validate(schema: ZodTypeAny, target: ValidationTarget = 'body') {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req[target]);

    if (!result.success) {
      const zodError = result.error as ZodError;
      
      // Formateo legible de los errores de Zod para el cliente
      const formattedErrors = zodError.issues.map((issue) => ({
        campo: issue.path.join('.') || target,
        mensaje: issue.message,
      }));

      // Mensaje principal directo y amigable con el primer error de validación
      const primerError = formattedErrors[0]?.mensaje || 'Error de validación en los datos';

      res.status(400).json({
        status: 'error',
        statusCode: 400,
        message: primerError,
        errors: formattedErrors,
      });
      return;
    }    

    // Reemplaza los datos con la versión parseada/coercionada por Zod
    req[target] = result.data;
    next();
  };
}
