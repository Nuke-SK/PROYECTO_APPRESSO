import { apiClient } from './client';
import { Usuario, CreateUsuarioDTO, UpdateUsuarioDTO } from '../types/usuario.types';
import { ApiResponse } from '../types/api.types';

export const usuariosApi = {
  listar: async (page: number = 1, limit: number = 50): Promise<Usuario[]> => {
    const res = await apiClient.get<ApiResponse<any>>('/usuarios', {
      params: { page, limit },
    });
    const payload = res.data?.data;
    if (Array.isArray(payload)) return payload;
    if (payload?.data && Array.isArray(payload.data)) return payload.data;
    return [];
  },

  obtenerPorId: async (id: number): Promise<Usuario> => {
    const res = await apiClient.get<ApiResponse<Usuario>>(`/usuarios/${id}`);
    return res.data.data!;
  },

  crear: async (data: CreateUsuarioDTO): Promise<Usuario> => {
    const res = await apiClient.post<ApiResponse<Usuario>>('/usuarios', data);
    return res.data.data!;
  },

  actualizar: async (id: number, data: UpdateUsuarioDTO): Promise<Usuario> => {
    const res = await apiClient.patch<ApiResponse<Usuario>>(`/usuarios/${id}`, data);
    return res.data.data!;
  },
};
