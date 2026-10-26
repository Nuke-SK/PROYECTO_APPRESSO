import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import { ApiErrorResponse, ApiResponse } from '../types/api.types';

const getApiBaseUrl = (): string => {
  let envUrl = import.meta.env.VITE_API_BASE_URL?.trim();
  if (envUrl && envUrl.length > 0 && !envUrl.includes('localhost')) {
    envUrl = envUrl.replace(/\/+$/, '');
    if (!envUrl.endsWith('/api/v1')) {
      envUrl = `${envUrl}/api/v1`;
    }
    return envUrl;
  }

  // Detección automática en navegador para soportar NGROK, túneles, otros PCs y celulares
  if (typeof window !== 'undefined') {
    const { protocol, hostname, port } = window.location;
    // Si se accede a través de Vite dev local (puerto 5173), apuntar al backend en el puerto 3000
    if (port === '5173') {
      return `${protocol}//${hostname}:3000/api/v1`;
    }
    // Si se accede por NGROK (puerto vacío/443) o directo por el backend (puerto 3000), usar ruta relativa
    return '/api/v1';
  }

  return 'http://localhost:3000/api/v1';
};

const BASE_URL = getApiBaseUrl();

export const apiClient: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'ngrok-skip-browser-warning': 'true', // Imprescindible para evitar la página intermedia de advertencia de ngrok
  },
  timeout: 15000,
});

// Interceptor de Peticiones: inyecta siempre la cabecera ngrok
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    config.headers.set('ngrok-skip-browser-warning', 'true');
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor de Respuestas: normaliza errores con la estructura del Backend
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error: AxiosError<ApiErrorResponse>) => {
    if (error.response?.data) {
      const errData = error.response.data;

      // Si el backend envió errores de validación de Zod, formateamos un mensaje directo y claro
      let mensajeAmigable = errData.message || 'Error en los datos enviados';
      if (Array.isArray(errData.errors) && errData.errors.length > 0) {
        mensajeAmigable = errData.errors.map((e: any) => e.mensaje).join('. ');
      }

      const customError: ApiErrorResponse = {
        status: 'error',
        statusCode: error.response.status || 500,
        message: mensajeAmigable,
        errors: errData.errors,
      };
      return Promise.reject(customError);
    }

    if (error.code === 'ECONNABORTED') {
      return Promise.reject({
        status: 'error',
        statusCode: 408,
        message: 'Tiempo de espera agotado. El servidor tardó demasiado en responder.',
      } as ApiErrorResponse);
    }

    return Promise.reject({
      status: 'error',
      statusCode: 500,
      message: error.message || 'Error de conexión con el backend',
    } as ApiErrorResponse);
  }
);

/**
 * Helper genérico para peticiones que retorna directamente data tipada
 */
export async function request<T>(
  method: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE',
  url: string,
  data?: any,
  headers?: Record<string, string>
): Promise<ApiResponse<T>> {
  const response = await apiClient.request<ApiResponse<T>>({
    method,
    url,
    data,
    headers,
  });
  return response.data;
}
