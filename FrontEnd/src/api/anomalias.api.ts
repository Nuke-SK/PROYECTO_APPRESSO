import { apiClient } from './client';
import { AnomaliaTransaccion } from '../types/anomalia.types';
import { ApiResponse } from '../types/api.types';

export const anomaliasApi = {
  listar: async (page: number = 1, limit: number = 20): Promise<{ data: AnomaliaTransaccion[]; page: number; limit: number; total?: number }> => {
    const res = await apiClient.get<ApiResponse<any>>('/anomalias', {
      params: { page, limit },
    });
    const payload = res.data?.data;
    if (Array.isArray(payload)) {
      return { data: payload, page, limit, total: payload.length };
    }
    if (payload?.data && Array.isArray(payload.data)) {
      return {
        data: payload.data,
        page: payload.page || page,
        limit: payload.limit || limit,
        total: payload.total || payload.data.length,
      };
    }
    return { data: [], page, limit, total: 0 };
  },

  listarPorTransaccion: async (idTransaccion: number): Promise<AnomaliaTransaccion[]> => {
    const res = await apiClient.get<ApiResponse<AnomaliaTransaccion[]>>(
      `/anomalias/transaccion/${idTransaccion}`
    );
    return res.data?.data ?? [];
  },

  obtenerPorId: async (id: number): Promise<AnomaliaTransaccion> => {
    const res = await apiClient.get<ApiResponse<AnomaliaTransaccion>>(`/anomalias/${id}`);
    return res.data.data!;
  },
};
