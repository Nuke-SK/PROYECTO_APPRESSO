import { z } from 'zod';
import { booleanField, enteroPositivoField } from './common.dto';

// ESQUEMA DE LA CONFIGURACIÓN DE SEGURIDAD (PATCH /config/seguridad). STRICT.
export const UpdateSecurityConfigSchema = z
  .object({
    permitirHashExterno: booleanField.optional(),
    modoEstrictoHMAC: booleanField.optional(),
    ventanaSegundos: enteroPositivoField('La ventana debe ser un entero positivo').pipe(z.number().max(3600, 'La ventana máxima es 3600 segundos')).optional(),
    maxTransaccionesVentana: enteroPositivoField('El máximo de transacciones debe ser un entero positivo').pipe(z.number().max(10000)).optional(),
    umbralManana: enteroPositivoField('El umbral de la mañana debe ser un entero positivo').pipe(z.number().max(10000)).optional(),
    umbralTarde: enteroPositivoField('El umbral de la tarde debe ser un entero positivo').pipe(z.number().max(10000)).optional(),
    umbralNoche: enteroPositivoField('El umbral de la noche debe ser un entero positivo').pipe(z.number().max(10000)).optional(),
    secretoHMAC: z
      .string()
      .transform((v) => v.trim())
      .pipe(z.string().min(8, 'El secreto HMAC debe tener al menos 8 caracteres').max(256, 'El secreto HMAC es demasiado largo'))
      .optional(),
  })
  .strict()
  .refine((d) => Object.keys(d).length > 0, { message: 'Debe enviar al menos un campo para actualizar' });

export type UpdateSecurityConfigDTO = z.infer<typeof UpdateSecurityConfigSchema>;

