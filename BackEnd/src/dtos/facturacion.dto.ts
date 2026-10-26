import { z } from 'zod';
import { enteroPositivoField, idParamField } from './common.dto';

export const EstadoFacturaEnum = z.enum(['PENDIENTE', 'PAGADA', 'ANULADA']);
export type EstadoFactura = z.infer<typeof EstadoFacturaEnum>;

export const MetodoPagoFacturaEnum = z.enum(['EFECTIVO', 'TARJETA_DEBITO', 'TARJETA_CREDITO', 'TRANSFERENCIA']);
export type MetodoPagoFactura = z.infer<typeof MetodoPagoFacturaEnum>;

export const ItemCompraSchema = z
  .object({
    idProducto: enteroPositivoField('El ID del producto no es válido'),
    cantidad: enteroPositivoField('La cantidad debe ser un número entero positivo'),
  })
  .strict();

export type ItemCompraDTO = z.infer<typeof ItemCompraSchema>;

// ESQUEMA DE VALIDACIÓN PARA CREAR UNA NUEVA FACTURA
export const CreateFacturaSchema = z
  .object({
    idUsuario: enteroPositivoField('El ID del usuario no es válido'),
    detalles: z
      .array(ItemCompraSchema)
      .min(1, 'La factura debe contener al menos un producto')
      .max(100, 'La factura no puede tener más de 100 productos distintos'),
  })
  .strict();

export type CreateFacturaDTO = z.infer<typeof CreateFacturaSchema>;

// TIPO DE DATOS PARA ACTUALIZAR UNA FACTURA (ej. anularla o marcarla pagada)
export const UpdateFacturaSchema = z
  .object({
    estado: EstadoFacturaEnum.optional(),
  })
  .strict()
  .refine((d) => d.estado !== undefined, { message: 'Debe enviar el estado a actualizar' });
export type UpdateFacturaDTO = z.infer<typeof UpdateFacturaSchema>;

// ESQUEMA PARA VALIDAR EL ID DE LA FACTURA
export const FacturaIdParamSchema = z.object({
  id: idParamField('El ID de la factura no es válido'),
});
export type FacturaIdParamDTO = z.infer<typeof FacturaIdParamSchema>;

// ESTRUCTURA DEL JSON DE DETALLES DE LA FACTURA
export interface DetalleFacturaResponse {
  idProducto: number;
  nombreProducto: string;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
}

export interface FacturaResponseDTO {
  id: number;
  idTransaccion: number;
  idUsuario: number;
  numeroFactura: string;
  subtotal: number;
  impuesto: number;
  total: number;
  detalles: DetalleFacturaResponse[];
  estado: EstadoFactura;
  fechaEmision: string;
}