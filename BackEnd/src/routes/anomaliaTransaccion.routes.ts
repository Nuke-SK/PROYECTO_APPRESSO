import { Router } from 'express';
import { validate } from '../middlewares/validate.middleware';
import { AnomaliaTransaccionIdParamSchema } from '../dtos/anomaliaTransacciones.dto';
import { z } from 'zod';
import {
  listarAnomalias,
  listarAnomaliasPorTransaccion,
  obtenerAnomaliaPorId,
} from '../controllers/anomaliaTransaccion.controller';

// RUTAS DE ANOMALÍAS DE TRANSACCIONES — SOLO LECTURA
// NO HAY POST AQUÍ: las anomalías las crea automáticamente el TransaccionService
// con la Ventana Deslizante. Este módulo solo expone consultas para el panel admin.

const router = Router();

// GET /api/v1/anomalias
router.get('/', listarAnomalias);

// GET /api/v1/anomalias/transaccion/:idTransaccion  ← ANTES DE /:id
router.get(
  '/transaccion/:idTransaccion',
  validate(
    z.object({ idTransaccion: z.coerce.number().int().positive('ID de transacción inválido') }),
    'params'
  ),
  listarAnomaliasPorTransaccion
);

// GET /api/v1/anomalias/:id
router.get(
  '/:id',
  validate(AnomaliaTransaccionIdParamSchema, 'params'),
  obtenerAnomaliaPorId
);

export default router;
