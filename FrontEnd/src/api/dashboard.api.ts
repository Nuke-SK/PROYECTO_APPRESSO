import { apiClient } from './client';
import { ApiResponse } from '../types/api.types';

export interface DashboardStatsData {
  periodo: 'hoy' | 'semana' | 'mes';
  resumen: {
    totalTransacciones: number;
    totalAnomalias: number;
    porcentajeAnomalias: number;
    usuariosAfectados: number;
    valorTotalSospechoso: number;
    promedioTransaccionesPorUsuario: number;
    casosMasRecurrentes: { tipo: string; cantidad: number; porcentaje: number }[];
    burstsMultiplesTransacciones: number;
  };
  comparativoPeriodos: {
    hoy: { transacciones: number; anomalias: number };
    semana: { transacciones: number; anomalias: number };
    mes: { transacciones: number; anomalias: number };
  };
  usuariosRecurrentes: {
    idUsuario: number;
    nombreUsuario: string;
    emailUsuario: string;
    totalTransacciones: number;
    totalAnomalias: number;
  }[];
  distribucionPorHora: { hora: number; etiqueta: string; transacciones: number; anomalias: number }[];
  anomaliasPorNivel: { nivel: string; cantidad: number; porcentaje: number }[];
  metodosPago: { metodo: string; totalTransacciones: number; transaccionesAnomalas: number }[];
}

export const dashboardApi = {
  obtenerEstadisticas: async (periodo: 'hoy' | 'semana' | 'mes' = 'hoy'): Promise<DashboardStatsData> => {
    const response = await apiClient.get<ApiResponse<DashboardStatsData>>(`/dashboard/stats?periodo=${periodo}`);
    return response.data.data!;
  },
};
