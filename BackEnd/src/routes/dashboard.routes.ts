import { Router } from 'express';
import { obtenerEstadisticasDashboard } from '../controllers/dashboard.controller';

// RUTAS DEL DASHBOARD Y ESTADÍSTICAS DE APPRESSO
const router = Router();

// GET /api/v1/dashboard/stats
router.get('/stats', obtenerEstadisticasDashboard);

export default router;
