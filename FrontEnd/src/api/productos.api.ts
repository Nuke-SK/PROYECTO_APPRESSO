import { apiClient } from './client';
import { Producto, CreateProductoDTO, UpdateProductoDTO } from '../types/producto.types';
import { ApiResponse } from '../types/api.types';

export const productosApi = {
  listar: async (
    page: number = 1,
    limit: number = 50
  ): Promise<{ data: Producto[]; total: number; page: number; limit: number }> => {
    const res = await apiClient.get<any>('/productos', {
      params: { page, limit },
    });
    const body = res.data;
    const items = Array.isArray(body?.data)
      ? body.data
      : Array.isArray(body)
      ? body
      : [];
    return {
      data: items,
      total: body?.total ?? items.length,
      page: body?.page ?? page,
      limit: body?.limit ?? limit,
    };
  },

  obtenerPorId: async (id: number): Promise<ApiResponse<Producto>> => {
    const res = await apiClient.get<ApiResponse<Producto>>(`/productos/${id}`);
    return res.data;
  },

  crear: async (producto: CreateProductoDTO): Promise<ApiResponse<Producto>> => {
    const res = await apiClient.post<ApiResponse<Producto>>('/productos', producto);
    return res.data;
  },

  actualizar: async (id: number, producto: UpdateProductoDTO): Promise<ApiResponse<Producto>> => {
    const res = await apiClient.patch<ApiResponse<Producto>>(`/productos/${id}`, producto);
    return res.data;
  },
};
