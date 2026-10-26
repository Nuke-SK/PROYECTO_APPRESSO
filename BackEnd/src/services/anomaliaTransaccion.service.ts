import { AnomaliaTransaccionRepository } from '@appresso/database';
import type { AnomaliaTransaccion } from '@appresso/database';
import {
  AnomaliaTransaccionResponseDTO,
  ItemTransaccionesInvolucradasResponse,
} from '../dtos/anomaliaTransacciones.dto';
import { NotFoundError } from '../errors/app-error';

// SERVICIO DE ANOMALÍAS DE TRANSACCIONES — SOLO LECTURA
// ESTE MÓDULO ES EXCLUSIVAMENTE PARA CONSULTAR LOS FRAUDES DETECTADOS
// LAS ANOMALÍAS LAS CREA EL TransaccionService (Sliding Window), NO ESTE SERVICIO
// AQUÍ SOLO SE EXPONEN ENDPOINTS DE CONSULTA PARA EL PANEL DE ADMINISTRACIÓN

export class AnomaliaTransaccionService {
  private anomaliaRepo: AnomaliaTransaccionRepository;

  constructor() {
    this.anomaliaRepo = new AnomaliaTransaccionRepository();
  }

  // DATA MAPPER (FUNCIÓN PURA DE TRANSFORMACIÓN)
  private toResponseDTO(entity: AnomaliaTransaccion): AnomaliaTransaccionResponseDTO {
    const fechaIso = entity.fechaCreacion.toISOString();
    return {
      id: entity.idAnomalia,
      // Campos exactos del diagrama del docente / base de datos
      transaccion_id: entity.idTransaccion,
      tipo: entity.tipoAnomalia,
      nivel: entity.nivelRiesgo,
      cantidad_transacciones: entity.cantidadTransacciones,
      ventana_segundos: entity.ventanaSegundos,
      fecha_creacion: fechaIso,
      fecha_creación: fechaIso,
      fecha_actualizacion: fechaIso,

      // Campos camelCase para mantener compatibilidad con el FrontEnd
      idTransaccion: entity.idTransaccion,
      tipoAnomalia: entity.tipoAnomalia,
      nivelRiesgo: entity.nivelRiesgo as AnomaliaTransaccionResponseDTO['nivelRiesgo'],
      cantidadTransacciones: entity.cantidadTransacciones,
      ventanaSegundos: entity.ventanaSegundos,
      transaccionesInvolucradas: entity.transaccionesInvolucradas as ItemTransaccionesInvolucradasResponse[],
      fechaCreacion: fechaIso,
    };
  }

  // 1. OBTENER ANOMALÍA POR ID
  async obtenerPorId(id: number): Promise<AnomaliaTransaccionResponseDTO> {
    const anomalia = await this.anomaliaRepo.findById(id);
    if (!anomalia) {
      throw new NotFoundError(`Anomalía con ID ${id} no encontrada.`);
    }

    return this.toResponseDTO(anomalia);
  }

  // 2. OBTENER ANOMALÍAS POR TRANSACCIÓN
  async listarPorTransaccion(idTransaccion: number): Promise<AnomaliaTransaccionResponseDTO[]> {
    const anomalias = await this.anomaliaRepo.findByTransaccion(idTransaccion);
    return anomalias.map((a) => this.toResponseDTO(a));
  }

  // 3. OBTENER ANOMALÍAS POR TIPO
  async listarPorTipo(tipoAnomalia: string): Promise<AnomaliaTransaccionResponseDTO[]> {
    const anomalias = await this.anomaliaRepo.findByTipo(tipoAnomalia);
    return anomalias.map((a) => this.toResponseDTO(a));
  }

  // 4. LISTAR ANOMALÍAS CON PAGINACIÓN (PANEL ADMIN)
  async listarPaginado(page: number = 1, limit: number = 20): Promise<{
    data: AnomaliaTransaccionResponseDTO[];
    page: number;
    limit: number;
  }> {
    const offset = (page - 1) * limit;
    const anomalias = await this.anomaliaRepo.findPaginated(limit, offset);

    return {
      data: anomalias.map((a) => this.toResponseDTO(a)),
      page,
      limit,
    };
  }
}
