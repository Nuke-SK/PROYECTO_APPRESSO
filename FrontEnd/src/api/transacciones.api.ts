import { apiClient } from './client';
import { getHMACHeaders } from './hmac';
import {
  Transaccion,
  CreateTransaccionDTO,
  UpdateTransaccionDTO,
} from '../types/transaccion.types';
import { ApiResponse } from '../types/api.types';

export const transaccionesApi = {
  listar: async (page: number = 1, limit: number = 20): Promise<{ data: Transaccion[]; total?: number; page: number; limit: number }> => {
    const res = await apiClient.get<ApiResponse<any>>('/transacciones', {
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

  listarPorUsuario: async (idUsuario: number): Promise<Transaccion[]> => {
    const res = await apiClient.get<ApiResponse<Transaccion[]>>(
      `/transacciones/usuario/${idUsuario}`
    );
    return res.data?.data ?? [];
  },

  obtenerPorId: async (id: number): Promise<Transaccion> => {
    const res = await apiClient.get<ApiResponse<Transaccion>>(`/transacciones/${id}`);
    return res.data.data!;
  },

  crear: async (data: CreateTransaccionDTO): Promise<Transaccion> => {
    // Generación obligatoria de firmas criptográficas HMAC para prevenir replay y manipulación
    const hmacHeaders = getHMACHeaders(data);
    const res = await apiClient.post<ApiResponse<Transaccion>>('/transacciones', data, {
      headers: {
        ...hmacHeaders,
      },
    });
    return res.data.data!;
  },

  enviarRaw: async (payload: any): Promise<any> => {
    const hmacHeaders = getHMACHeaders(payload);
    const res = await apiClient.post<ApiResponse<any>>('/transacciones', payload, {
      headers: {
        ...hmacHeaders,
      },
    });
    return res.data;
  },

  actualizar: async (id: number, data: UpdateTransaccionDTO): Promise<Transaccion> => {
    const res = await apiClient.patch<ApiResponse<Transaccion>>(`/transacciones/${id}`, data);
    return res.data.data!;
  },
};
