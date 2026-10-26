export interface Producto {
  id: number;
  idSubcategoria: number;
  nombre: string;
  descripcion: string | null;
  precio: number;
  stock: number;
  activo: boolean;
  fechaCreacion?: string;
  fechaModificacion?: string;
}

export interface CreateProductoDTO {
  idSubcategoria: number;
  nombre: string;
  descripcion?: string;
  precio: number;
  stock: number;
  activo?: boolean;
}

export type UpdateProductoDTO = Partial<CreateProductoDTO>;

export interface ProductoFilterParams {
  page?: number;
  limit?: number;
  subcategoriaId?: number;
  buscar?: string;
}
