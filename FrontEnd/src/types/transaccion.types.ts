export type EstadoTransaccion = 'PENDIENTE' | 'APROBADA' | 'RECHAZADA';

export type MetodoPago = 'EFECTIVO' | 'TARJETA_DEBITO' | 'TARJETA_CREDITO' | 'TRANSFERENCIA';

export interface Transaccion {
  id: number;
  idUsuario: number;
  valor: number;
  fechaTransaccion: string;
  estado: EstadoTransaccion;
  metodoPago: MetodoPago;
  hash: string;
  fechaCreacion?: string;
  ultActualizacion?: string;
}

export interface CreateTransaccionDTO {
  idUsuario: number;
  valor: number;
  metodoPago?: MetodoPago;
}

export interface UpdateTransaccionDTO {
  estado?: EstadoTransaccion;
}
