import { z } from 'zod';

// VALIDADORES REUTILIZABLES: GARANTIZAN UN FORMATO FIJO DE ENTRADA EN TODOS LOS DTOs.
// - Texto: se recorta (trim), se colapsan espacios internos y se rechazan caracteres de control.
// - Números: solo se aceptan number o cadenas numéricas estrictas (nunca "12abc", "", "1e3", "Infinity").
// - Booleanos: solo true/false o "true"/"false" (formularios HTML).

// eslint-disable-next-line no-control-regex
const CONTROL_CHARS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/;

// TEXTO OBLIGATORIO NORMALIZADO
export const textoField = (etiqueta: string, min = 2, max = 100) =>
  z
    .string({ error: `${etiqueta} debe ser texto` })
    .transform((v) => v.trim().replace(/\s+/g, ' '))
    .pipe(
      z
        .string()
        .min(min, `${etiqueta} debe tener al menos ${min} caracteres`)
        .max(max, `${etiqueta} no puede exceder ${max} caracteres`)
        .refine((v) => !CONTROL_CHARS.test(v), `${etiqueta} contiene caracteres no permitidos`)
    );

// TEXTO LARGO OPCIONAL (DESCRIPCIONES). Vacío => undefined
export const descripcionField = (max = 500) =>
  z
    .string({ error: 'La descripción debe ser texto' })
    .transform((v) => v.trim())
    .pipe(
      z
        .string()
        .max(max, `La descripción no puede exceder ${max} caracteres`)
        .refine((v) => !CONTROL_CHARS.test(v.replace(/[\n\r\t]/g, '')), 'La descripción contiene caracteres no permitidos')
    )
    .optional();

// EMAIL NORMALIZADO A MINÚSCULAS
export const emailField = z
  .string({ error: 'El correo debe ser texto' })
  .transform((v) => v.trim().toLowerCase())
  .pipe(z.string().max(100, 'El correo no puede exceder 100 caracteres').email('Debe ser un formato de correo electrónico válido'));

const NUMERO_ESTRICTO = /^-?\d+(\.\d+)?$/;

// Convierte "12", 12 => 12. Rechaza cualquier otra cosa.
const aNumero = (v: unknown): unknown => {
  if (typeof v === 'string') {
    const t = v.trim();
    return NUMERO_ESTRICTO.test(t) ? Number(t) : NaN;
  }
  return v;
};

export const enteroPositivoField = (mensaje: string) =>
  z.preprocess(aNumero, z.number({ error: mensaje }).int(mensaje).positive(mensaje).safe(mensaje));

export const enteroNoNegativoField = (mensaje: string) =>
  z.preprocess(aNumero, z.number({ error: mensaje }).int(mensaje).nonnegative(mensaje).safe(mensaje));

// PRECIOS: positivos, máximo 2 decimales
export const precioField = (mensaje: string) =>
  z.preprocess(
    aNumero,
    z
      .number({ error: mensaje })
      .positive(mensaje)
      .finite(mensaje)
      .refine((n) => Math.round(n * 100) / 100 === n, 'Se permiten máximo 2 decimales')
  );

export const booleanField = z.preprocess(
  (v) => (v === 'true' ? true : v === 'false' ? false : v),
  z.boolean({ error: 'El valor debe ser verdadero o falso' })
);

// ID EN PARÁMETROS DE RUTA (SOLO DÍGITOS)
export const idParamField = (mensaje: string) =>
  z.string({ error: mensaje }).regex(/^\d+$/, mensaje).transform(Number).pipe(z.number().int().positive(mensaje).safe(mensaje));

