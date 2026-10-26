export interface CategoriaPadre {
  id: number;
  nombre: string;
  descripcion: string | null;
  activo: boolean;
  fechaCreacion?: string;
  fechaModificacion?: string;
}

export interface CreateCategoriaPadreDTO {
  nombre: string;
  descripcion?: string;
  activo?: boolean;
}

export type UpdateCategoriaPadreDTO = Partial<CreateCategoriaPadreDTO>;

export interface Subcategoria {
  id: number;
  idCategoriaPadre: number;
  nombre: string;
  descripcion: string | null;
  activo: boolean;
  fechaCreacion?: string;
  fechaModificacion?: string;
}

export interface CreateSubcategoriaDTO {
  idCategoriaPadre: number;
  nombre: string;
  descripcion?: string;
  activo?: boolean;
}

export type UpdateSubcategoriaDTO = Partial<CreateSubcategoriaDTO>;
