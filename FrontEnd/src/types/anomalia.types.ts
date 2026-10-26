export type NivelRiesgo = 'BAJO' | 'MEDIO' | 'ALTO' | 'CRITICO';

export interface TransaccionInvolucrada {
  idTransaccion: number;
  idUsuario: number;
  valor?: number;
  metodoPago?: string;
  numeroFactura?: string;
  estado: 'PENDIENTE' | 'APROBADA' | 'RECHAZADA';
  fechaTransaccion: string;
}

export interface AnomaliaTransaccion {
  id: number;
  idTransaccion: number;
  tipoAnomalia: string;
  nivelRiesgo: NivelRiesgo;
  cantidadTransacciones: number;
  ventanaSegundos: number;
  transaccionesInvolucradas: TransaccionInvolucrada[];
  fechaCreacion: string;
}
