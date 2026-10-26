import { Request, Response, NextFunction } from 'express';
import { SubcategoriaService } from '../services/subcategoria.service';

// CONTROLADOR DE SUBCATEGORÍAS
// RESPONSABILIDAD ÚNICA: ORQUESTAR REQUEST → SERVICIO → RESPONSE
// NUNCA CONTIENE LÓGICA DE NEGOCIO, ESO ES TAREA DEL SERVICIO
// TODOS LOS ERRORES SE DELEGAN A next(error) PARA QUE EL errorHandler CENTRALIZADO LOS MANEJE

const subcategoriaService = new SubcategoriaService();

// POST /api/v1/subcategorias
export async function crearSubcategoria(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const subcategoriaCreada = await subcategoriaService.crear(req.body);
    res.status(201).json({
      status: 'success',
      statusCode: 201,
      message: 'Subcategoría creada exitosamente',
      data: subcategoriaCreada,
    });
  } catch (error) {
    next(error);
  }
}

// GET /api/v1/subcategorias
export async function listarSubcategorias(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;
    const resultado = await subcategoriaService.listarPaginado(page, limit);
    res.status(200).json({
      status: 'success',
      statusCode: 200,
      message: 'Subcategorías listadas exitosamente',
      data: resultado,
    });
  } catch (error) {
    next(error);
  }
}

// GET /api/v1/subcategorias/por-categoria/:idCategoriaPadre
export async function listarSubcategoriasPorPadre(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const idCategoriaPadre = Number(req.params.idCategoriaPadre);
    const subcategorias = await subcategoriaService.listarPorCategoriaPadre(idCategoriaPadre);
    res.status(200).json({
      status: 'success',
      statusCode: 200,
      message: 'Subcategorías de la categoría padre obtenidas exitosamente',
      data: subcategorias,
    });
  } catch (error) {
    next(error);
  }
}

// GET /api/v1/subcategorias/:id
export async function obtenerSubcategoriaPorId(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = Number(req.params.id);
    const subcategoria = await subcategoriaService.obtenerPorId(id);
    res.status(200).json({
      status: 'success',
      statusCode: 200,
      message: 'Subcategoría obtenida exitosamente',
      data: subcategoria,
    });
  } catch (error) {
    next(error);
  }
}

// PATCH /api/v1/subcategorias/:id
export async function actualizarSubcategoria(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = Number(req.params.id);
    const subcategoriaActualizada = await subcategoriaService.actualizar(id, req.body);
    res.status(200).json({
      status: 'success',
      statusCode: 200,
      message: 'Subcategoría actualizada exitosamente',
      data: subcategoriaActualizada,
    });
  } catch (error) {
    next(error);
  }
}
