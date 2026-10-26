export interface Usuario {
  id: number;
  nombre: string;
  email: string;
  activo: boolean;
  fechaCreacion?: string;
}

export interface CreateUsuarioDTO {
  nombre: string;
  email: string;
  activo?: boolean;
}

export type UpdateUsuarioDTO = Partial<CreateUsuarioDTO>;
