import { z } from 'zod';

export const nivelRiesgoEnum = z.enum(['BAJO', 'MEDIO', 'ALTO', 'CRITICO']);
export type NivelRiesgo = z.infer<typeof nivelRiesgoEnum>;

export const ItemTransaccionesInvolucradas = z.object({
  idTransaccion: z
    .number()
    .int()
    .positive('El ID de la transacción no es válido'),
  idUsuario: z
    .number()
    .int()
    .positive('El ID del usuario no es válido'),
  valor: z
    .number()
    .nonnegative('El valor debe ser positivo o cero')
    .optional(),
  metodoPago: z
    .string()
    .optional(),
  numeroFactura: z
    .string()
    .max(50)
    .optional(),
  estado: z
    .enum(['PENDIENTE', 'APROBADA', 'RECHAZADA'], { message: 'El estado de la transacción no es válido' }),
  fechaTransaccion: z
    .string()
    .nonempty('La fecha de transacción es obligatoria'),
});

export type ItemTransaccionesInvolucradasDTO = z.infer<typeof ItemTransaccionesInvolucradas>;

// ESQUEMA DE VALIDACIÓN PARA REGISTRAR ANOMALÍAS EN TRANSACCIONES
export const CreateAnomaliaTransaccionSchema = z.object({
  idTransaccion: z
    .number()
    .int()
    .positive('El ID de la transacción no es válido'),
  tipoAnomalia: z
    .string()
    .max(50)
    .nonempty('El tipo de anomalia es obligatorio'),
  nivelRiesgo: nivelRiesgoEnum.default('CRITICO'),
  cantidadTransacciones: z
    .number()
    .int()
    .positive('La cantidad de transacciones debe ser un número entero positivo'),
  ventanaSegundos: z
    .number()
    .int()
    .positive('La ventana de tiempo debe ser un número entero positivo'),
  transaccionesInvolucradas: z
    .array(ItemTransaccionesInvolucradas)
    .min(1, 'Debe haber al menos una transacción involucrada'),
});

export type CreateAnomaliaTransaccionDTO = z.infer<typeof CreateAnomaliaTransaccionSchema>;

export const AnomaliaTransaccionIdParamSchema = z.object({
  id: z.coerce.number().int().positive('El ID de la anomalia de transacción no es válido').describe('ID de la anomalia de transacción'),
});
export type AnomaliaTransaccionIdParamDTO = z.infer<typeof AnomaliaTransaccionIdParamSchema>;

// ESTRUCTURA FORENSE DE TRANSACCIONES INVOLUCRADAS
export interface ItemTransaccionesInvolucradasResponse {
  idTransaccion: number;
  idUsuario: number;
  valor?: number;
  metodoPago?: string;
  numeroFactura?: string;
  estado: 'PENDIENTE' | 'APROBADA' | 'RECHAZADA';
  fechaTransaccion: string;
}

export interface AnomaliaTransaccionResponseDTO {
  id: number;
  // Campos del diagrama del docente / Base de datos
  transaccion_id: number;
  tipo: string;
  nivel: string;
  cantidad_transacciones: number;
  ventana_segundos: number;
  fecha_creacion: string;
  fecha_creación: string;
  fecha_actualizacion: string;

  // Campos camelCase para compatibilidad total con el FrontEnd
  idTransaccion: number;
  tipoAnomalia: string;
  nivelRiesgo: NivelRiesgo;
  cantidadTransacciones: number;
  ventanaSegundos: number;
  transaccionesInvolucradas: ItemTransaccionesInvolucradasResponse[];
  fechaCreacion: string;
}