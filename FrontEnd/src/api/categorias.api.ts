import { apiClient } from './client';
import {
  CategoriaPadre,
  CreateCategoriaPadreDTO,
  UpdateCategoriaPadreDTO,
  Subcategoria,
  CreateSubcategoriaDTO,
  UpdateSubcategoriaDTO,
} from '../types/categoria.types';
import { ApiResponse } from '../types/api.types';

export const categoriasApi = {
  // --- Categorías Padre ---
  listarPadres: async (page: number = 1, limit: number = 50): Promise<CategoriaPadre[]> => {
    const res = await apiClient.get<ApiResponse<any>>('/categorias-padre', {
      params: { page, limit },
    });
    const payload = res.data?.data;
    if (Array.isArray(payload)) return payload;
    if (payload?.data && Array.isArray(payload.data)) return payload.data;
    return [];
  },

  obtenerPadrePorId: async (id: number): Promise<CategoriaPadre> => {
    const res = await apiClient.get<ApiResponse<CategoriaPadre>>(`/categorias-padre/${id}`);
    return res.data.data!;
  },

  crearPadre: async (data: CreateCategoriaPadreDTO): Promise<CategoriaPadre> => {
    const res = await apiClient.post<ApiResponse<CategoriaPadre>>('/categorias-padre', data);
    return res.data.data!;
  },

  actualizarPadre: async (id: number, data: UpdateCategoriaPadreDTO): Promise<CategoriaPadre> => {
    const res = await apiClient.patch<ApiResponse<CategoriaPadre>>(`/categorias-padre/${id}`, data);
    return res.data.data!;
  },

  // --- Subcategorías ---
  listarSubcategorias: async (page: number = 1, limit: number = 50): Promise<Subcategoria[]> => {
    const res = await apiClient.get<ApiResponse<any>>('/subcategorias', {
      params: { page, limit },
    });
    const payload = res.data?.data;
    if (Array.isArray(payload)) return payload;
    if (payload?.data && Array.isArray(payload.data)) return payload.data;
    return [];
  },

  listarPorPadre: async (idCategoriaPadre: number): Promise<Subcategoria[]> => {
    const res = await apiClient.get<ApiResponse<Subcategoria[]>>(
      `/subcategorias/por-categoria/${idCategoriaPadre}`
    );
    return res.data.data ?? [];
  },

  obtenerSubcategoriaPorId: async (id: number): Promise<Subcategoria> => {
    const res = await apiClient.get<ApiResponse<Subcategoria>>(`/subcategorias/${id}`);
    return res.data.data!;
  },

  crearSubcategoria: async (data: CreateSubcategoriaDTO): Promise<Subcategoria> => {
    const res = await apiClient.post<ApiResponse<Subcategoria>>('/subcategorias', data);
    return res.data.data!;
  },

  actualizarSubcategoria: async (id: number, data: UpdateSubcategoriaDTO): Promise<Subcategoria> => {
    const res = await apiClient.patch<ApiResponse<Subcategoria>>(`/subcategorias/${id}`, data);
    return res.data.data!;
  },
};
