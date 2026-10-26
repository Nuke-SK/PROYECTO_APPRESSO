/**
 * CLASES DE ERRORES PERSONALIZADAS PARA EL BACKEND
 * Permiten lanzar errores semánticos con códigos HTTP específicos
 */

export class AppError extends Error {
  constructor(
    public override message: string,
    public statusCode: number = 400,
    public errors?: Array<{ campo: string; mensaje: string }>
  ) {
    super(message);
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class ValidationError extends AppError {
  constructor(message: string = 'Error de validación en los datos', errors?: Array<{ campo: string; mensaje: string }>) {
    super(message, 400, errors);
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = 'Recurso no encontrado') {
    super(message, 404);
  }
}

export class ConflictError extends AppError {
  constructor(message: string = 'Conflicto con recurso existente') {
    super(message, 409);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = 'No autorizado') {
    super(message, 401);
  }
}
