import { z } from 'zod';
import { textoField, descripcionField, booleanField, idParamField, enteroPositivoField } from './common.dto';

// ESQUEMA DE VALIDACIÓN PARA CREAR UNA NUEVA SUBCATEGORÍA (STRICT)
export const CreateSubcategoriaSchema = z
  .object({
    idCategoriaPadre: enteroPositivoField('El ID de la categoría padre no es válido'),
    nombre: textoField('El nombre', 2, 100),
    descripcion: descripcionField(500),
    activo: booleanField.optional().default(true),
  })
  .strict();

// TIPO DE DATOS PARA CREAR UNA NUEVA SUBCATEGORÍA
export type CreateSubcategoriaDTO = z.infer<typeof CreateSubcategoriaSchema>;

// ACTUALIZACIÓN: SIN VALORES POR DEFECTO PARA NO SOBRESCRIBIR 'activo'
export const UpdateSubcategoriaSchema = z
  .object({
    idCategoriaPadre: enteroPositivoField('El ID de la categoría padre no es válido').optional(),
    nombre: textoField('El nombre', 2, 100).optional(),
    descripcion: descripcionField(500),
    activo: booleanField.optional(),
  })
  .strict()
  .refine((d) => Object.keys(d).length > 0, { message: 'Debe enviar al menos un campo para actualizar' });
export type UpdateSubcategoriaDTO = z.infer<typeof UpdateSubcategoriaSchema>;

// ESQUEMA PARA VALIDAR EL ID DE LA SUBCATEGORÍA EN LA RUTA
export const SubcategoriaIdParamSchema = z.object({
  id: idParamField('El ID de la subcategoría no es válido'),
});
export type SubcategoriaIdParamDTO = z.infer<typeof SubcategoriaIdParamSchema>;

export interface SubcategoriaResponseDTO {
  id: number;
  idCategoriaPadre: number;
  nombre: string;
  descripcion: string | null;
  activo: boolean;
  fechaCreacion: string;
  fechaModificacion: string;
}