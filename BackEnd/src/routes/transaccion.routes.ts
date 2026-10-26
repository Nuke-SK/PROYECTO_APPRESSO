import { Router } from 'express';
import { sanitize } from '../middlewares/sanitize.middleware';
import { validate } from '../middlewares/validate.middleware';
import { verifyHMAC } from '../middlewares/hmac.middleware';
import {
  CreateTransaccionSchema,
  UpdateTransaccionSchema,
  TransaccionIdParamSchema,
} from '../dtos/transaccion.dto';
import { z } from 'zod';
import {
  crearTransaccion,
  listarTransacciones,
  listarTransaccionesPorUsuario,
  obtenerTransaccionPorId,
  actualizarTransaccion,
} from '../controllers/transaccion.controller';

// RUTAS DE TRANSACCIONES
// NOTA ESPECIAL: LA RUTA DE CREACIÓN (POST) REQUIERE VERIFICACIÓN HMAC DEL REQUEST
// ESTO SIGNIFICA QUE EL CLIENTE DEBE ENVIAR:
//   - Header x-signature: HMAC-SHA256(timestamp + "." + body, HMAC_SECRET)
//   - Header x-timestamp: Date.now() en milisegundos
// ESTO PREVIENE ATAQUES DE REPETICIÓN Y MANIPULACIÓN DEL CUERPO DEL REQUEST

const router = Router();

// POST /api/v1/transacciones  ← PROTEGIDA CON HMAC DEL REQUEST
// PIPELINE: verifyHMAC → sanitize → validate → controller
router.post(
  '/',
  verifyHMAC,
  sanitize,
  validate(CreateTransaccionSchema, 'body'),
  crearTransaccion
);

// GET /api/v1/transacciones
router.get('/', listarTransacciones);

// GET /api/v1/transacciones/usuario/:idUsuario  ← ANTES DE /:id
router.get(
  '/usuario/:idUsuario',
  validate(
    z.object({ idUsuario: z.coerce.number().int().positive('ID de usuario inválido') }),
    'params'
  ),
  listarTransaccionesPorUsuario
);

// GET /api/v1/transacciones/:id
router.get(
  '/:id',
  validate(TransaccionIdParamSchema, 'params'),
  obtenerTransaccionPorId
);

// PATCH /api/v1/transacciones/:id
router.patch(
  '/:id',
  sanitize,
  validate(TransaccionIdParamSchema, 'params'),
  validate(UpdateTransaccionSchema, 'body'),
  actualizarTransaccion
);

export default router;
