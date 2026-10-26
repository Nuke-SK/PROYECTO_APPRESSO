import { Request, Response, NextFunction } from 'express';
import { CategoriaPadreService } from '../services/categoriaPadre.service';

// CONTROLADOR DE CATEGORÍAS PADRE
// RESPONSABILIDAD ÚNICA: ORQUESTAR REQUEST → SERVICIO → RESPONSE
// NUNCA CONTIENE LÓGICA DE NEGOCIO, ESO ES TAREA DEL SERVICIO
// TODOS LOS ERRORES SE DELEGAN A next(error) PARA QUE EL errorHandler CENTRALIZADO LOS MANEJE

const categoriaPadreService = new CategoriaPadreService();

// POST /api/v1/categorias-padre
export async function crearCategoriaPadre(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const categoriaCreada = await categoriaPadreService.crear(req.body);
    res.status(201).json({
      status: 'success',
      statusCode: 201,
      message: 'Categoría padre creada exitosamente',
      data: categoriaCreada,
    });
  } catch (error) {
    next(error);
  }
}

// GET /api/v1/categorias-padre
export async function listarCategoriasPadre(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;
    const resultado = await categoriaPadreService.listarPaginado(page, limit);
    res.status(200).json({
      status: 'success',
      statusCode: 200,
      message: 'Categorías padre listadas exitosamente',
      data: resultado,
    });
  } catch (error) {
    next(error);
  }
}

// GET /api/v1/categorias-padre/:id
export async function obtenerCategoriaPadrePorId(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = Number(req.params.id);
    const categoria = await categoriaPadreService.obtenerPorId(id);
    res.status(200).json({
      status: 'success',
      statusCode: 200,
      message: 'Categoría padre obtenida exitosamente',
      data: categoria,
    });
  } catch (error) {
    next(error);
  }
}

// PATCH /api/v1/categorias-padre/:id
export async function actualizarCategoriaPadre(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = Number(req.params.id);
    const categoriaActualizada = await categoriaPadreService.actualizar(id, req.body);
    res.status(200).json({
      status: 'success',
      statusCode: 200,
      message: 'Categoría padre actualizada exitosamente',
      data: categoriaActualizada,
    });
  } catch (error) {
    next(error);
  }
}
