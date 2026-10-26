import { Request, Response, NextFunction } from 'express';
import { DashboardService } from '../services/dashboard.service';

// CONTROLADOR DE DASHBOARD Y ESTADÍSTICAS AGREGADAS
// RESPONSABILIDAD ÚNICA: ORQUESTAR REQUEST DE ANALÍTICAS → DASHBOARD SERVICE → RESPONSE
// TODOS LOS ERRORES SE DELEGAN A next(error) PARA EL MANEJO CENTRALIZADO

const dashboardService = new DashboardService();

// GET /api/v1/dashboard/stats?periodo=hoy|semana|mes
export async function obtenerEstadisticasDashboard(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const rawPeriodo = (req.query.periodo as string) || 'hoy';
    const periodoValido: 'hoy' | 'semana' | 'mes' = ['hoy', 'semana', 'mes'].includes(rawPeriodo)
      ? (rawPeriodo as any)
      : 'hoy';

    const estadisticas = await dashboardService.obtenerEstadisticas(periodoValido);

    res.status(200).json({
      status: 'success',
      statusCode: 200,
      message: 'Estadísticas agregadas del dashboard generadas exitosamente',
      data: estadisticas,
    });
  } catch (error) {
    next(error);
  }
}
