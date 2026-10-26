import { Router } from 'express';
import { sanitize } from '../middlewares/sanitize.middleware';
import { validate } from '../middlewares/validate.middleware';
import { verifyHMAC } from '../middlewares/hmac.middleware';
import {
  CreateFacturaSchema,
  UpdateFacturaSchema,
  FacturaIdParamSchema,
} from '../dtos/facturacion.dto';
import { z } from 'zod';
import {
  crearFactura,
  listarFacturas,
  listarFacturasPorUsuario,
  obtenerFacturaPorId,
  actualizarFactura,
} from '../controllers/facturacion.controller';

// RUTAS DE FACTURACIÓN
// EL ENDPOINT DE CREACIÓN (POST) ESTÁ PROTEGIDO CON HMAC DEL REQUEST
// EL BACKEND CALCULA TODOS LOS PRECIOS, EL CLIENTE SOLO ENVÍA { idProducto, cantidad }[]

const router = Router();

// POST /api/v1/facturas  ← PROTEGIDA CON HMAC DEL REQUEST
router.post(
  '/',
  verifyHMAC,
  sanitize,
  validate(CreateFacturaSchema, 'body'),
  crearFactura
);

// GET /api/v1/facturas
router.get('/', listarFacturas);

// GET /api/v1/facturas/usuario/:idUsuario  ← ANTES DE /:id
router.get(
  '/usuario/:idUsuario',
  validate(
    z.object({ idUsuario: z.coerce.number().int().positive('ID de usuario inválido') }),
    'params'
  ),
  listarFacturasPorUsuario
);

// GET /api/v1/facturas/:id
router.get(
  '/:id',
  validate(FacturaIdParamSchema, 'params'),
  obtenerFacturaPorId
);

// PATCH /api/v1/facturas/:id
router.patch(
  '/:id',
  sanitize,
  validate(FacturaIdParamSchema, 'params'),
  validate(UpdateFacturaSchema, 'body'),
  actualizarFactura
);

export default router;
