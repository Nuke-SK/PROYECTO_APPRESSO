import { Request, Response, NextFunction } from 'express';
import { TransaccionService } from '../services/transaccion.service';

// CONTROLADOR DE TRANSACCIONES
// RESPONSABILIDAD ÚNICA: ORQUESTAR REQUEST → SERVICIO → RESPONSE
// NUNCA CONTIENE LÓGICA DE NEGOCIO (HASH, VENTANA DESLIZANTE), ESO ES TAREA DEL SERVICIO
// TODOS LOS ERRORES SE DELEGAN A next(error) PARA QUE EL errorHandler CENTRALIZADO LOS MANEJE

const transaccionService = new TransaccionService();

// POST /api/v1/transacciones
export async function crearTransaccion(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    // Si viene un lote/array de transacciones (ej: simulación o evaluador externo)
    if (Array.isArray(req.body)) {
      const promesas = req.body.map((item) => {
        const payload = {
          ...item,
          hash: item.hash || (req.headers['x-signature'] as string | undefined),
        };
        return transaccionService.crear(payload);
      });
      const transaccionesCreadas = await Promise.all(promesas);
      res.status(201).json({
        status: 'success',
        statusCode: 201,
        message: `${transaccionesCreadas.length} transacciones procesadas exitosamente`,
        data: transaccionesCreadas,
      });
      return;
    }

    // Transacción individual { ... }
    const payload = {
      ...req.body,
      hash: req.body.hash || (req.headers['x-signature'] as string | undefined),
    };
    const transaccionCreada = await transaccionService.crear(payload);
    res.status(201).json({
      status: 'success',
      statusCode: 201,
      message: 'Transacción procesada exitosamente',
      data: transaccionCreada,
    });
  } catch (error) {
    next(error);
  }
}

// GET /api/v1/transacciones
export async function listarTransacciones(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;
    const resultado = await transaccionService.listarPaginado(page, limit);
    res.status(200).json({
      status: 'success',
      statusCode: 200,
      message: 'Transacciones listadas exitosamente',
      data: resultado,
    });
  } catch (error) {
    next(error);
  }
}

// GET /api/v1/transacciones/usuario/:idUsuario
export async function listarTransaccionesPorUsuario(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const idUsuario = Number(req.params.idUsuario);
    const transacciones = await transaccionService.listarPorUsuario(idUsuario);
    res.status(200).json({
      status: 'success',
      statusCode: 200,
      message: 'Historial de transacciones del usuario obtenido exitosamente',
      data: transacciones,
    });
  } catch (error) {
    next(error);
  }
}

// GET /api/v1/transacciones/:id
export async function obtenerTransaccionPorId(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = Number(req.params.id);
    const transaccion = await transaccionService.obtenerPorId(id);
    res.status(200).json({
      status: 'success',
      statusCode: 200,
      message: 'Transacción obtenida exitosamente',
      data: transaccion,
    });
  } catch (error) {
    next(error);
  }
}

// PATCH /api/v1/transacciones/:id
export async function actualizarTransaccion(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = Number(req.params.id);
    const transaccionActualizada = await transaccionService.actualizar(id, req.body);
    res.status(200).json({
      status: 'success',
      statusCode: 200,
      message: 'Estado de transacción actualizado exitosamente',
      data: transaccionActualizada,
    });
  } catch (error) {
    next(error);
  }
}
