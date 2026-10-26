import { z } from 'zod';
import { textoField, descripcionField, booleanField, idParamField } from './common.dto';

// ESQUEMA DE VALIDACIÓN PARA CREAR UNA NUEVA CATEGORÍA PADRE (STRICT)
export const CreateCategoriaPadreSchema = z
  .object({
    nombre: textoField('El nombre', 2, 100),
    descripcion: descripcionField(500),
    activo: booleanField.optional().default(true),
  })
  .strict();

// TIPO DE DATOS PARA CREAR UNA NUEVA CATEGORÍA PADRE
export type CreateCategoriaPadreDTO = z.infer<typeof CreateCategoriaPadreSchema>;

// ACTUALIZACIÓN: SIN VALORES POR DEFECTO PARA NO SOBRESCRIBIR 'activo'
export const UpdateCategoriaPadreSchema = z
  .object({
    nombre: textoField('El nombre', 2, 100).optional(),
    descripcion: descripcionField(500),
    activo: booleanField.optional(),
  })
  .strict()
  .refine((d) => Object.keys(d).length > 0, { message: 'Debe enviar al menos un campo para actualizar' });
export type UpdateCategoriaPadreDTO = z.infer<typeof UpdateCategoriaPadreSchema>;

// ESQUEMA PARA VALIDAR EL ID DE LA CATEGORÍA PADRE EN LA RUTA
export const CategoriaPadreIdParamSchema = z.object({
  id: idParamField('El ID de la categoría padre no es válido'),
});
export type CategoriaPadreIdParamDTO = z.infer<typeof CategoriaPadreIdParamSchema>;

export interface CategoriaPadreResponseDTO {
  id: number;
  nombre: string;
  descripcion: string | null;
  activo: boolean;
  fechaCreacion: string;
  fechaModificacion: string;
}