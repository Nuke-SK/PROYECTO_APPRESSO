import { Request, Response, NextFunction } from 'express';
import { AnomaliaTransaccionService } from '../services/anomaliaTransaccion.service';

// CONTROLADOR DE ANOMALÍAS DE TRANSACCIONES — SOLO LECTURA
// ESTE MÓDULO EXPONE ENDPOINTS PARA QUE EL PANEL ADMIN CONSULTE LOS FRAUDES DETECTADOS
// LAS ANOMALÍAS LAS CREA AUTOMÁTICAMENTE EL TransaccionService (Sliding Window)

const anomaliaService = new AnomaliaTransaccionService();

// GET /api/v1/anomalias
export async function listarAnomalias(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;
    const resultado = await anomaliaService.listarPaginado(page, limit);
    res.status(200).json({
      status: 'success',
      statusCode: 200,
      message: 'Anomalías listadas exitosamente',
      data: resultado,
    });
  } catch (error) {
    next(error);
  }
}

// GET /api/v1/anomalias/transaccion/:idTransaccion
export async function listarAnomaliasPorTransaccion(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const idTransaccion = Number(req.params.idTransaccion);
    const anomalias = await anomaliaService.listarPorTransaccion(idTransaccion);
    res.status(200).json({
      status: 'success',
      statusCode: 200,
      message: 'Anomalías de la transacción obtenidas exitosamente',
      data: anomalias,
    });
  } catch (error) {
    next(error);
  }
}

// GET /api/v1/anomalias/:id
export async function obtenerAnomaliaPorId(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = Number(req.params.id);
    const anomalia = await anomaliaService.obtenerPorId(id);
    res.status(200).json({
      status: 'success',
      statusCode: 200,
      message: 'Anomalía obtenida exitosamente',
      data: anomalia,
    });
  } catch (error) {
    next(error);
  }
}
