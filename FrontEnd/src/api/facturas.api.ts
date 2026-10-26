import { apiClient } from './client';
import { getHMACHeaders } from './hmac';
import { Factura, CreateFacturaDTO, UpdateFacturaDTO } from '../types/factura.types';
import { ApiResponse } from '../types/api.types';

export const facturasApi = {
  listar: async (page: number = 1, limit: number = 20): Promise<{ data: Factura[]; page: number; limit: number; total?: number }> => {
    const res = await apiClient.get<ApiResponse<any>>('/facturas', {
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

  listarPorUsuario: async (idUsuario: number): Promise<Factura[]> => {
    const res = await apiClient.get<ApiResponse<Factura[]>>(`/facturas/usuario/${idUsuario}`);
    return res.data?.data ?? [];
  },

  obtenerPorId: async (id: number): Promise<Factura> => {
    const res = await apiClient.get<ApiResponse<Factura>>(`/facturas/${id}`);
    return res.data.data!;
  },

  crear: async (data: CreateFacturaDTO): Promise<Factura> => {
    // Generación de firmas criptográficas HMAC para garantizar la integridad del pedido
    const hmacHeaders = getHMACHeaders(data);
    const res = await apiClient.post<ApiResponse<Factura>>('/facturas', data, {
      headers: {
        ...hmacHeaders,
      },
    });
    return res.data.data!;
  },

  actualizar: async (id: number, data: UpdateFacturaDTO): Promise<Factura> => {
    const res = await apiClient.patch<ApiResponse<Factura>>(`/facturas/${id}`, data);
    return res.data.data!;
  },
};
