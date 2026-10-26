export interface ApiResponse<T = any> {
  status: 'success' | 'error';
  statusCode: number;
  message?: string;
  data?: T;
  total?: number;
  page?: number;
  limit?: number;
  totalPages?: number;
}

export interface PaginatedResult<T> {
  status: 'success';
  statusCode: number;
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  data: T[];
}

export interface ApiValidationError {
  campo: string;
  mensaje: string;
}

export interface ApiErrorResponse {
  status: 'error';
  statusCode: number;
  message: string;
  errors?: ApiValidationError[];
}
