import { z } from 'zod';
import { textoField, emailField, booleanField, idParamField } from './common.dto';

// ESQUEMA DE VALIDACIÓN PARA CREAR UN NUEVO USUARIO (STRICT: RECHAZA CAMPOS DESCONOCIDOS)
export const CreateUsuarioSchema = z
  .object({
    nombre: textoField('El nombre', 2, 100),
    email: emailField,
    activo: booleanField.optional().default(true),
  })
  .strict();

// TIPO DE DATOS PARA CREAR UN NUEVO USUARIO, BASADO EN EL ESQUEMA DE VALIDACIÓN
export type CreateUsuarioDTO = z.infer<typeof CreateUsuarioSchema>;

// ACTUALIZACIÓN: CAMPOS OPCIONALES SIN VALORES POR DEFECTO (EVITA SOBRESCRIBIR 'activo' SIN QUERER)
export const UpdateUsuarioSchema = z
  .object({
    nombre: textoField('El nombre', 2, 100).optional(),
    email: emailField.optional(),
    activo: booleanField.optional(),
  })
  .strict()
  .refine((d) => Object.keys(d).length > 0, { message: 'Debe enviar al menos un campo para actualizar' });
export type UpdateUsuarioDTO = z.infer<typeof UpdateUsuarioSchema>;

// ESQUEMA PARA VALIDAR EL ID DEL USUARIO EN LA RUTA
export const UsuarioIdParamSchema = z.object({
  id: idParamField('El ID del usuario no es válido'),
});
export type UsuarioIdParamDTO = z.infer<typeof UsuarioIdParamSchema>;

export interface UsuarioResponseDTO {
  id: number;
  nombre: string;
  email: string;
  activo: boolean;
  fechaCreacion: string; 
}