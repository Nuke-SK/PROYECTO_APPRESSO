import { Router } from 'express';
import { ProductoController } from '../controllers/producto.controller';
import { sanitize, validate } from '../middlewares';
import { 
  CreateProductoSchema, 
  UpdateProductoSchema, 
  ProductoIdParamSchema 
} from '../dtos/producto.dto';

const router = Router();
const controller = new ProductoController();

// POST /api/v1/productos - Crear nuevo producto
router.post(
  '/',
  sanitize,
  validate(CreateProductoSchema, 'body'),
  controller.crear
);

// GET /api/v1/productos - Listar productos paginados
router.get(
  '/',
  controller.listar
);

// GET /api/v1/productos/:id - Obtener producto por ID
router.get(
  '/:id',
  validate(ProductoIdParamSchema, 'params'),
  controller.obtenerPorId
);

// PATCH /api/v1/productos/:id - Actualización parcial de producto
router.patch(
  '/:id',
  sanitize,
  validate(ProductoIdParamSchema, 'params'),
  validate(UpdateProductoSchema, 'body'),
  controller.actualizar
);

export default router;
