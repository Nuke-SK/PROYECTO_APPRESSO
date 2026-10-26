import { Router } from 'express';
import { sanitize } from '../middlewares/sanitize.middleware';
import { validate } from '../middlewares/validate.middleware';
import {
  CreateSubcategoriaSchema,
  UpdateSubcategoriaSchema,
  SubcategoriaIdParamSchema,
} from '../dtos/subcategoria.dto';
import {
  crearSubcategoria,
  listarSubcategorias,
  listarSubcategoriasPorPadre,
  obtenerSubcategoriaPorId,
  actualizarSubcategoria,
} from '../controllers/subcategoria.controller';
import { z } from 'zod';

// RUTAS DE SUBCATEGORÍAS
// CADA RUTA PASA POR EL PIPELINE: sanitize → validate(DTO) → controller
// sanitize: limpia espacios en blanco con deepTrim (recursividad)
// validate: valida el body/params contra el schema Zod del DTO

const router = Router();

// POST /api/v1/subcategorias
router.post(
  '/',
  sanitize,
  validate(CreateSubcategoriaSchema, 'body'),
  crearSubcategoria
);

// GET /api/v1/subcategorias
router.get('/', listarSubcategorias);

// GET /api/v1/subcategorias/por-categoria/:idCategoriaPadre
// ESTA RUTA VA ANTES DE /:id PARA EVITAR CONFLICTOS DE MATCHING
router.get(
  '/por-categoria/:idCategoriaPadre',
  validate(
    z.object({ idCategoriaPadre: z.coerce.number().int().positive('ID de categoría padre inválido') }),
    'params'
  ),
  listarSubcategoriasPorPadre
);

// GET /api/v1/subcategorias/:id
router.get(
  '/:id',
  validate(SubcategoriaIdParamSchema, 'params'),
  obtenerSubcategoriaPorId
);

// PATCH /api/v1/subcategorias/:id
router.patch(
  '/:id',
  sanitize,
  validate(SubcategoriaIdParamSchema, 'params'),
  validate(UpdateSubcategoriaSchema, 'body'),
  actualizarSubcategoria
);

export default router;
