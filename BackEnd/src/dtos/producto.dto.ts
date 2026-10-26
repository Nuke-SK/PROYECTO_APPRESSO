import { z } from 'zod';
import {
  textoField,
  descripcionField,
  booleanField,
  idParamField,
  enteroPositivoField,
  enteroNoNegativoField,
  precioField,
} from './common.dto';

// ESQUEMA DE VALIDACIÓN PARA CREAR UN NUEVO PRODUCTO (STRICT)
export const CreateProductoSchema = z
  .object({
    idSubcategoria: enteroPositivoField('El ID de la subcategoría no es válido'),
    nombre: textoField('El nombre', 2, 120),
    descripcion: descripcionField(500),
    precio: precioField('El precio no es válido'),
    stock: enteroNoNegativoField('El stock debe ser un entero no negativo'),
    activo: booleanField.optional().default(true),
  })
  .strict();

// TIPO DE DATOS PARA CREAR UN NUEVO PRODUCTO, BASADO EN EL ESQUEMA DE VALIDACIÓN
export type CreateProductoDTO = z.infer<typeof CreateProductoSchema>;

// ACTUALIZACIÓN: SIN VALORES POR DEFECTO PARA NO SOBRESCRIBIR DATOS EXISTENTES
export const UpdateProductoSchema = z
  .object({
    idSubcategoria: enteroPositivoField('El ID de la subcategoría no es válido').optional(),
    nombre: textoField('El nombre', 2, 120).optional(),
    descripcion: descripcionField(500),
    precio: precioField('El precio no es válido').optional(),
    stock: enteroNoNegativoField('El stock debe ser un entero no negativo').optional(),
    activo: booleanField.optional(),
  })
  .strict()
  .refine((d) => Object.keys(d).length > 0, { message: 'Debe enviar al menos un campo para actualizar' });
export type UpdateProductoDTO = z.infer<typeof UpdateProductoSchema>;

// ESQUEMA PARA VALIDAR EL ID DEL PRODUCTO EN LA RUTA
export const ProductoIdParamSchema = z.object({
  id: idParamField('El ID del producto no es válido'),
});
export type ProductoIdParamDTO = z.infer<typeof ProductoIdParamSchema>;


export interface ProductoResponseDTO {
  id: number;
  idSubcategoria: number;
  nombre: string;
  descripcion: string | null;
  precio: number;
  stock: number;
  activo: boolean;
  fechaCreacion: string; 
  fechaModificacion: string;
}