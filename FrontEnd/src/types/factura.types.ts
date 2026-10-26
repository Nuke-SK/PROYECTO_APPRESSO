export type EstadoFactura = 'PENDIENTE' | 'PAGADA' | 'ANULADA';

export interface DetalleFactura {
  idProducto: number;
  nombreProducto: string;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
}

export interface Factura {
  id: number;
  idTransaccion: number;
  idUsuario: number;
  numeroFactura: string;
  subtotal: number;
  impuesto: number;
  total: number;
  detalles: DetalleFactura[];
  estado: EstadoFactura;
  fechaEmision: string;
}

export interface ItemCompraDTO {
  idProducto: number;
  cantidad: number;
}

export interface CreateFacturaDTO {
  idUsuario: number;
  detalles: ItemCompraDTO[];
}

export interface UpdateFacturaDTO {
  estado?: EstadoFactura;
}
