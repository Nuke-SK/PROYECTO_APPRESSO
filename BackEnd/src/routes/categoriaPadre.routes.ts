import { Router } from 'express';
import { sanitize } from '../middlewares/sanitize.middleware';
import { validate } from '../middlewares/validate.middleware';
import {
  CreateCategoriaPadreSchema,
  UpdateCategoriaPadreSchema,
  CategoriaPadreIdParamSchema,
} from '../dtos/categoriaPadre.dto';
import {
  crearCategoriaPadre,
  listarCategoriasPadre,
  obtenerCategoriaPadrePorId,
  actualizarCategoriaPadre,
} from '../controllers/categoriaPadre.controller';

// RUTAS DE CATEGORÍAS PADRE
// CADA RUTA PASA POR EL PIPELINE: sanitize → validate(DTO) → controller
// sanitize: limpia espacios en blanco con deepTrim (recursividad)
// validate: valida el body/params contra el schema Zod del DTO

const router = Router();

// POST /api/v1/categorias-padre
router.post(
  '/',
  sanitize,
  validate(CreateCategoriaPadreSchema, 'body'),
  crearCategoriaPadre
);

// GET /api/v1/categorias-padre
router.get('/', listarCategoriasPadre);

// GET /api/v1/categorias-padre/:id
router.get(
  '/:id',
  validate(CategoriaPadreIdParamSchema, 'params'),
  obtenerCategoriaPadrePorId
);

// PATCH /api/v1/categorias-padre/:id
router.patch(
  '/:id',
  sanitize,
  validate(CategoriaPadreIdParamSchema, 'params'),
  validate(UpdateCategoriaPadreSchema, 'body'),
  actualizarCategoriaPadre
);

export default router;
