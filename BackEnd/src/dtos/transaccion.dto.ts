import { z } from 'zod';

// ENUMS DE TRANSACCIÓN
export const EstadoTransaccionEnum = z.enum(['PENDIENTE', 'APROBADA', 'RECHAZADA']);
export type EstadoTransaccion = z.infer<typeof EstadoTransaccionEnum>;

export const MetodoPagoEnum = z.enum(['EFECTIVO', 'TARJETA_DEBITO', 'TARJETA_CREDITO', 'TRANSFERENCIA']);
export type MetodoPago = z.infer<typeof MetodoPagoEnum>;

// Helper para permitir números o cadenas numéricas (ej: 15000, "15000", "15000.50", "15.000", "$50.000 COP")
const numericField = z.union([
  z.number().positive('El monto debe ser positivo').finite('El monto debe ser un número válido'),
  z.string().transform((val, ctx) => {
    const cleanStr = val.replace(/[\$\sCOPcop]/g, '').trim();
    if (!cleanStr) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'El valor numérico no puede estar vacío',
      });
      return z.NEVER;
    }

    let parsed: number;
    // Formato con puntos de miles colombianos (ej: "15.000" o "15.000,50")
    if (/^\d{1,3}(\.\d{3})+(,\d+)?$/.test(cleanStr)) {
      parsed = Number(cleanStr.replace(/\./g, '').replace(',', '.'));
    } else if (/^\d{1,3}(,\d{3})+(\.\d+)?$/.test(cleanStr)) {
      // Formato con coma de miles (ej: "15,000" o "15,000.50")
      parsed = Number(cleanStr.replace(/,/g, ''));
    } else {
      // Directo o con coma decimal (ej: "15000,50" -> 15000.50)
      parsed = Number(cleanStr.replace(',', '.'));
    }

    if (isNaN(parsed) || !isFinite(parsed) || parsed <= 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'El valor numérico debe ser un número positivo válido',
      });
      return z.NEVER;
    }
    return parsed;
  }),
]);

const userIdField = z.union([
  z.number().int('El ID del usuario debe ser un número entero').positive('El ID del usuario debe ser un entero positivo'),
  z.string().trim().min(1, 'El identificador de usuario no puede estar vacío').refine(
    (str) => {
      const parsed = parseInt(str, 10);
      if (!isNaN(parsed) && String(parsed) === str.trim()) {
        return parsed > 0;
      }
      return str.trim().length >= 2;
    },
    { message: 'El ID numérico del usuario debe ser mayor a cero' }
  ),
]);

// ESQUEMA INDIVIDUAL DE TRANSACCIÓN:
// Acepta EXACTAMENTE los nombres del docente (idTxn, user, date, value, paymentMethod, hash)
// y mantiene compatibilidad total con campos nativos (idUsuario, valor, metodoPago, fechaTransaccion, etc.)
export const SingleTransaccionSchema = z
  .object({
    // Formato exacto del docente / Evaluador externo
    idTxn: z.union([z.number().int().positive('ID de transacción debe ser positivo'), z.string().trim().min(1)]).optional(),
    user: userIdField.optional(),
    date: z.union([z.string().trim().min(1), z.number().int().positive()]).optional(),
    value: numericField.optional(),
    paymentMethod: z.string().trim().min(1).optional(),
    hash: z.string().trim().optional(),

    // Campos nativos y alias
    idUsuario: userIdField.optional(),
    usuario: userIdField.optional(),
    userId: userIdField.optional(),
    id_usuario: userIdField.optional(),
    
    valor: numericField.optional(),
    monto: numericField.optional(),
    amount: numericField.optional(),

    metodoPago: z.string().trim().min(1).optional(),
    metodo_pago: z.string().trim().min(1).optional(),
    payment_method: z.string().trim().min(1).optional(),

    fechaTransaccion: z.union([z.string().trim().min(1), z.number().int().positive()]).optional(),
    fecha: z.union([z.string().trim().min(1), z.number().int().positive()]).optional(),
    timestamp: z.union([z.string().trim().min(1), z.number().int().positive()]).optional(),

    signature: z.string().trim().optional(),
    estado: EstadoTransaccionEnum.optional(),
  })
  .passthrough()
  .refine(
    (data) =>
      data.idUsuario !== undefined ||
      data.user !== undefined ||
      data.usuario !== undefined ||
      data.userId !== undefined ||
      data.id_usuario !== undefined,
    { message: 'Debe proporcionar el identificador de usuario (user, idUsuario o userId)' }
  )
  .refine(
    (data) =>
      data.valor !== undefined ||
      data.value !== undefined ||
      data.monto !== undefined ||
      data.amount !== undefined,
    { message: 'Debe proporcionar el valor monetario (value, valor o monto)' }
  );

export type SingleTransaccionDTO = z.infer<typeof SingleTransaccionSchema>;

// ESQUEMA GLOBAL: Tolera tanto un objeto único { ... } como un arreglo de transacciones [ { ... }, { ... } ]
export const CreateTransaccionSchema = z.union([
  SingleTransaccionSchema,
  z.array(SingleTransaccionSchema).min(1, 'La lista de transacciones no puede estar vacía'),
]);

export type CreateTransaccionDTO = z.infer<typeof CreateTransaccionSchema>;

// TIPO DE DATOS PARA ACTUALIZAR UNA TRANSACCIÓN
export const UpdateTransaccionSchema = z.object({
  estado: EstadoTransaccionEnum.optional(),
});
export type UpdateTransaccionDTO = z.infer<typeof UpdateTransaccionSchema>;

// ESQUEMA CON FILTRO PARA VALIDAR EL ID DE LA TRANSACCIÓN
export const TransaccionIdParamSchema = z.object({
  id: z.coerce.number().int().positive('El ID de la transacción no es válido').describe('ID de la transacción'),
});
export type TransaccionIdParamDTO = z.infer<typeof TransaccionIdParamSchema>;

export interface TransaccionResponseDTO {
  id: number;
  idTxn?: number | string;
  idUsuario: number;
  user?: string | number;
  valor: number;
  value?: number;
  fechaTransaccion: string;
  date?: string;
  estado: EstadoTransaccion;
  status?: string;
  metodoPago: MetodoPago;
  paymentMethod?: string;
  hash: string;
  fechaCreacion: string;
  ultActualizacion: string;
}