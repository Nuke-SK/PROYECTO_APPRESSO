import { apiClient } from './client';
import { ApiResponse } from '../types/api.types';

// ─── DTO ──────────────────────────────────────────────────────────────────────

export interface SecurityConfigDTO {
  permitirHashExterno: boolean;
  modoEstrictoHMAC: boolean;
  ventanaSegundos: number;
  maxTransaccionesVentana: number;
  umbralManana: number;
  umbralTarde: number;
  umbralNoche: number;
  secretoMasked: string;
}

// ─── API ──────────────────────────────────────────────────────────────────────

export const seguridadConfigApi = {
  obtener: async (): Promise<SecurityConfigDTO> => {
    const res = await apiClient.get<ApiResponse<SecurityConfigDTO>>('/config/seguridad');
    return res.data.data!;
  },

  actualizar: async (
    partial: Partial<SecurityConfigDTO & { secretoHMAC?: string }>,
  ): Promise<SecurityConfigDTO> => {
    const res = await apiClient.patch<ApiResponse<SecurityConfigDTO>>('/config/seguridad', partial);
    return res.data.data!;
  },

  simularRafaga: async (idUsuario: number = 1, cantidad: number = 5): Promise<void> => {
    for (let i = 1; i <= cantidad; i++) {
      await apiClient.post('/transacciones', {
        idUsuario,
        valor: 12000 * i,
        metodoPago: 'TARJETA_CREDITO',
      });
      // Pequeño retardo entre peticiones para simular ráfaga
      await new Promise((r) => setTimeout(r, 120));
    }
  },
};
