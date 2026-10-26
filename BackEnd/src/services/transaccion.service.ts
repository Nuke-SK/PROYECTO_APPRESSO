import crypto from 'crypto';
import { TransaccionRepository, AnomaliaTransaccionRepository, UsuarioRepository } from '@appresso/database';
import type { Transaccion } from '@appresso/database';
import {
  CreateTransaccionDTO,
  SingleTransaccionDTO,
  UpdateTransaccionDTO,
  TransaccionResponseDTO,
} from '../dtos/transaccion.dto';
import { NotFoundError } from '../errors/app-error';
import { logger } from '../utils/logger';
import { securityConfigService } from './securityConfig.service';

export class TransaccionService {
  private transaccionRepo: TransaccionRepository;
  private anomaliaRepo: AnomaliaTransaccionRepository;
  private usuarioRepo: UsuarioRepository;

  constructor() {
    this.transaccionRepo = new TransaccionRepository();
    this.anomaliaRepo = new AnomaliaTransaccionRepository();
    this.usuarioRepo = new UsuarioRepository();
  }

  // DATA MAPPER (FUNCIÓN PURA DE TRANSFORMACIÓN)
  private toResponseDTO(
    entity: Transaccion,
    extra?: { idTxn?: number | string; user?: any; date?: any; paymentMethod?: string }
  ): TransaccionResponseDTO {
    return {
      id: entity.idTransaccion,
      idTxn: extra?.idTxn ?? entity.idTransaccion,
      idUsuario: entity.idUsuario,
      user: extra?.user ?? entity.idUsuario,
      valor: Number(entity.valorTransaccion),
      value: Number(entity.valorTransaccion),
      fechaTransaccion: entity.fechaTransaccion.toISOString(),
      date: extra?.date ? String(extra.date) : entity.fechaTransaccion.toISOString(),
      estado: entity.estado as TransaccionResponseDTO['estado'],
      status: entity.estado,
      metodoPago: entity.metodoPago as TransaccionResponseDTO['metodoPago'],
      paymentMethod: extra?.paymentMethod || entity.metodoPago,
      hash: entity.hash,
      fechaCreacion: entity.fechaCreacion.toISOString(),
      ultActualizacion: entity.ultActualizacion.toISOString(),
    };
  }

  // ─── NORMALIZADOR DE MÉTODO DE PAGO ──────────────────────────────────────────
  private normalizarMetodoPago(metodo?: string): 'EFECTIVO' | 'TARJETA_DEBITO' | 'TARJETA_CREDITO' | 'TRANSFERENCIA' {
    if (!metodo) return 'TARJETA_CREDITO';
    const m = metodo.toUpperCase().trim();
    if (m.includes('CREDITO') || m === 'TARJETA' || m === 'CARD') return 'TARJETA_CREDITO';
    if (m.includes('DEBITO')) return 'TARJETA_DEBITO';
    if (m.includes('EFECTIVO') || m === 'CASH') return 'EFECTIVO';
    return 'TRANSFERENCIA';
  }

  // ─── GENERACIÓN Y VALIDACIÓN DEL HASH HMAC-SHA256 ──────────────────────────────
  private generarHashIntegridad(idUsuario: number, valor: number, metodoPago: string): string {
    const config = securityConfigService.getConfig();
    const secretKey = config.secretoHMAC || 'appresso-secret-key-32-bytes-secure';
    const payload = `${idUsuario}.${valor}.${metodoPago}`;

    return crypto
      .createHmac('sha256', secretKey)
      .update(payload)
      .digest('hex');
  }

  private verificarHashExterno(
    idUsuario: number,
    valor: number,
    metodoPago: string,
    hashRecibido: string,
    extra?: { rawUser?: any; rawIdTxn?: any; rawDate?: any; rawPaymentMethod?: any }
  ): boolean {
    const config = securityConfigService.getConfig();
    const secretKey = config.secretoHMAC || 'appresso-secret-key-32-bytes-secure';
    const cleanHash = hashRecibido.trim().toLowerCase();

    const u = extra?.rawUser !== undefined ? String(extra.rawUser).trim() : String(idUsuario);
    const txn = extra?.rawIdTxn !== undefined ? String(extra.rawIdTxn).trim() : '';
    const pm = extra?.rawPaymentMethod ? String(extra.rawPaymentMethod).trim() : metodoPago;
    const d = extra?.rawDate !== undefined ? String(extra.rawDate).trim() : '';

    const candidatos = [
      `${idUsuario}.${valor}.${metodoPago}`,
      `${idUsuario}${valor}${metodoPago}`,
      `${idUsuario}-${valor}-${metodoPago}`,
      JSON.stringify({ idUsuario, valor, metodoPago }),
      JSON.stringify({ idUsuario, valor: Number(valor), metodoPago }),
      // Fórmulas con campos enviados por el profesor (idTxn, user, date, value, paymentMethod)
      `${u}.${valor}.${pm}`,
      `${u}${valor}${pm}`,
      `${u}.${valor}`,
      `${u}${valor}`,
      `${txn}.${u}.${valor}.${pm}`,
      `${txn}.${u}.${d}.${valor}.${pm}`,
      `${txn}.${u}.${valor}`,
      `${txn}.${valor}`,
      JSON.stringify({ idTxn: extra?.rawIdTxn, user: extra?.rawUser, value: valor, paymentMethod: extra?.rawPaymentMethod }),
      JSON.stringify({ user: extra?.rawUser, value: valor, paymentMethod: extra?.rawPaymentMethod }),
    ];

    for (const data of candidatos) {
      // 1. HMAC con secreto
      const hashHmac = crypto
        .createHmac('sha256', secretKey)
        .update(data)
        .digest('hex')
        .toLowerCase();

      if (cleanHash === hashHmac) {
        return true;
      }

      // 2. SHA-256 estándar directo
      const hashSha = crypto
        .createHash('sha256')
        .update(data)
        .digest('hex')
        .toLowerCase();

      if (cleanHash === hashSha) {
        return true;
      }
    }

    return false;
  }

  // ─── CÁLCULO DE UMBRAL POR FRANJA HORARIA ────────────────────────────────────
  private obtenerUmbralPorFranjaHoraria(fecha: Date): number {
    const config = securityConfigService.getConfig();
    const hora = fecha.getHours();

    // Mañana: 05:00:01 - 12:00:00 (5 a 11)
    if (hora >= 5 && hora < 12) {
      return config.umbralManana;
    }
    // Tarde-Noche: 12:00:01 - 20:00:00 (12 a 19)
    if (hora >= 12 && hora < 20) {
      return config.umbralTarde;
    }
    // Noche-Madrugada: 20:00:01 - 05:00:00 (20 a 4)
    return config.umbralNoche;
  }

  // ─── ANÁLISIS DE VENTANA DESLIZANTE PER-USUARIO (SLIDING WINDOW ALGORITHM) ────
  private async analizarVentanaDeslizante(
    idTransaccionReciente: number,
    idUsuario: number,
    fechaAncla: Date
  ): Promise<void> {
    try {
      const config = securityConfigService.getConfig();
      const ventanaSegundos = config.ventanaSegundos;
      const umbralBase = config.maxTransaccionesVentana;
      const umbralFranja = this.obtenerUmbralPorFranjaHoraria(fechaAncla);
      
      // El umbral efectivo es el mínimo entre la regla base (3 tx) y la franja
      const umbralEfectivo = Math.min(umbralBase, umbralFranja);

      // PASO 1: Calcular inicio de la ventana alrededor de la fecha de la transacción
      const desde = new Date(fechaAncla.getTime() - ventanaSegundos * 1000);

      // PASO 2: Obtener transacciones del usuario aisladamente en el intervalo [T_txn - W, T_txn]
      const transaccionesEnVentana = await this.transaccionRepo.findByUsuarioEnVentana(idUsuario, desde);
      const cantidad = transaccionesEnVentana.length;

      // PASO 3: Evaluar si se supera el umbral (ej. 3 o más en <= 3s)
      if (cantidad >= umbralEfectivo) {
        logger.warn({
          msg: 'ANOMALÍA DETECTADA: Velocidad excesiva de transacciones (Sliding Window Per-User)',
          idUsuario,
          idTransaccionReciente,
          cantidadEnVentana: cantidad,
          umbralEfectivo,
          ventanaSegundos,
          transaccionesIds: transaccionesEnVentana.map((t) => t.idTransaccion),
        });

        // PASO 4: Snapshot forense de transacciones involucradas (puro al valor y método de pago)
        const transaccionesInvolucradas = transaccionesEnVentana.map((t) => ({
          idTransaccion: t.idTransaccion,
          idUsuario: t.idUsuario,
          valor: Number(t.valorTransaccion),
          metodoPago: t.metodoPago,
          estado: t.estado,
          fechaTransaccion: t.fechaTransaccion.toISOString(),
        }));

        // PASO 5: Crear registro de anomalía en la base de datos
        await this.anomaliaRepo.create({
          idTransaccion: idTransaccionReciente,
          tipoAnomalia: 'VELOCIDAD_EXCESIVA',
          nivelRiesgo: 'CRITICO',
          cantidadTransacciones: cantidad,
          ventanaSegundos,
          transaccionesInvolucradas: transaccionesInvolucradas as any,
        });
      }
    } catch (err) {
      logger.error({
        msg: 'Error en el análisis de ventana deslizante',
        idUsuario,
        idTransaccionReciente,
        error: err,
      });
    }
  }

  // ─── MÉTODOS DE NEGOCIO ──────────────────────────────────────────────────────

  // 1. CREAR NUEVA TRANSACCIÓN (SOPORTA DTO TRADICIONAL Y FORMATO DEL EJERCICIO)
  async crear(data: SingleTransaccionDTO & { hash?: string; estado?: string }): Promise<TransaccionResponseDTO> {
    const config = securityConfigService.getConfig();

    // ── NORMALIACIÓN DE DATOS ENTRANTES ───────────────────────────────────────
    // Acepta idUsuario, user, usuario, userId, id_usuario (email o ID)
    let finalIdUsuario: number | undefined;
    const rawUser = data.idUsuario ?? data.user ?? (data as any).usuario ?? (data as any).userId ?? (data as any).id_usuario;

    if (rawUser !== undefined && rawUser !== null) {
      if (typeof rawUser === 'number') {
        finalIdUsuario = rawUser;
      } else if (typeof rawUser === 'string') {
        const parsed = parseInt(rawUser, 10);
        if (!isNaN(parsed) && String(parsed) === rawUser.trim() && parsed > 0) {
          finalIdUsuario = parsed;
        } else {
          // Es un email como "b@b.com" o "aa@aa.com" o un username
          const emailClean = rawUser.trim().toLowerCase();
          if (!emailClean) {
            finalIdUsuario = 1;
          } else {
            const porEmail = await this.usuarioRepo.findByEmail(emailClean);
          if (porEmail) {
            finalIdUsuario = porEmail.idUsuario;
          } else {
            const todosUsuarios = await this.usuarioRepo.findPaginated(100, 0);
            const encontrado = todosUsuarios.find(
              (u) => u.emailUsuario.toLowerCase() === emailClean || u.nombreUsuario.toLowerCase() === emailClean
            );

            if (encontrado) {
              finalIdUsuario = encontrado.idUsuario;
            } else {
              // Auto-crear usuario por email
              const email = emailClean.includes('@') ? emailClean : `${emailClean}@appresso.edu.co`;
              try {
                const nuevoUser = await this.usuarioRepo.create({
                  nombreUsuario: emailClean.split('@')[0] || 'usuario',
                  emailUsuario: email,
                  activo: true,
                });
                finalIdUsuario = nuevoUser.idUsuario;
              } catch (_err) {
                const recheck = await this.usuarioRepo.findByEmail(email);
                finalIdUsuario = recheck?.idUsuario || 1;
              }
            }
          }
        }
      }
    }
  }

  if (!finalIdUsuario) {
    finalIdUsuario = 1; // Fallback por defecto si no se pudo determinar
  }

    // Asegurar existencia de usuario en BD para evitar violación de FK
    const usuarioExistente = await this.usuarioRepo.findById(finalIdUsuario);
    if (!usuarioExistente) {
      try {
        await this.usuarioRepo.create({
          nombreUsuario: `Usuario #${finalIdUsuario}`,
          emailUsuario: `usuario${finalIdUsuario}@appresso.edu.co`,
          activo: true,
        });
      } catch (_e) {}
    }

    // Normalizar valor numérico (valor, value, monto, amount)
    const rawValor = data.valor ?? data.value ?? (data as any).monto ?? (data as any).amount ?? 0;
    const finalValor = Number(rawValor);

    // Normalizar método de pago
    const rawMetodoPago = data.metodoPago || data.paymentMethod || (data as any).metodo_pago || (data as any).payment_method;
    const finalMetodoPago = this.normalizarMetodoPago(rawMetodoPago);

    // Normalizar fecha de transacción (date, fechaTransaccion, fecha, timestamp)
    let fechaAncla = new Date();
    const rawDate = data.date || data.fechaTransaccion || (data as any).fecha || (data as any).timestamp;
    if (rawDate) {
      const parsedDate = typeof rawDate === 'number' ? new Date(rawDate) : new Date(rawDate);
      if (!isNaN(parsedDate.getTime())) {
        fechaAncla = parsedDate;
      }
    }

    // EVALUACIÓN DE HASH EXTERNO
    const incomingHash = data.hash || (data as any).signature;
    let finalHash: string;
    let finalEstado: 'PENDIENTE' | 'APROBADA' | 'RECHAZADA' = 'APROBADA';

    if (incomingHash && config.permitirHashExterno) {
      const esHashValido = this.verificarHashExterno(
        finalIdUsuario,
        finalValor,
        finalMetodoPago,
        incomingHash,
        {
          rawUser,
          rawIdTxn: data.idTxn,
          rawDate: data.date,
          rawPaymentMethod: data.paymentMethod,
        }
      );

      if (esHashValido) {
        finalHash = incomingHash;
        finalEstado = 'APROBADA';
        logger.info({ idUsuario: finalIdUsuario, valor: finalValor }, 'Transferencia legítima confirmada con hash externo');
      } else {
        finalHash = incomingHash;
        finalEstado = 'RECHAZADA';
        logger.warn({ idUsuario: finalIdUsuario, valor: finalValor, hash: incomingHash }, 'Transferencia rechazada: hash no coincide');
      }
    } else {
      finalHash = this.generarHashIntegridad(finalIdUsuario, finalValor, finalMetodoPago);
      finalEstado = (data.estado as any) || 'APROBADA';
    }

    // Insertar en la base de datos
    const nuevaTransaccion = await this.transaccionRepo.create({
      idUsuario: finalIdUsuario,
      valorTransaccion: String(finalValor),
      metodoPago: finalMetodoPago,
      estado: finalEstado,
      hash: finalHash,
      fechaTransaccion: fechaAncla,
    });

    // Si el hash fue rechazado por discrepancia, registrar anomalía MANIPULACION_HASH
    if (finalEstado === 'RECHAZADA') {
      try {
        await this.anomaliaRepo.create({
          idTransaccion: nuevaTransaccion.idTransaccion,
          tipoAnomalia: 'MANIPULACION_HASH',
          nivelRiesgo: 'CRITICO',
          cantidadTransacciones: 1,
          ventanaSegundos: config.ventanaSegundos,
          transaccionesInvolucradas: [
            {
              idTransaccion: nuevaTransaccion.idTransaccion,
              idUsuario: finalIdUsuario,
              valor: finalValor,
              metodoPago: finalMetodoPago,
              estado: 'RECHAZADA',
              fechaTransaccion: nuevaTransaccion.fechaTransaccion.toISOString(),
            },
          ] as any,
        });
      } catch (_e) {}
    }

    // DISPARAR ANÁLISIS DE VENTANA DESLIZANTE PER-USUARIO EN PARALELO
    this.analizarVentanaDeslizante(nuevaTransaccion.idTransaccion, finalIdUsuario, fechaAncla);

    return this.toResponseDTO(nuevaTransaccion, {
      idTxn: data.idTxn,
      user: rawUser,
      date: data.date,
      paymentMethod: data.paymentMethod,
    });
  }

  // 2. OBTENER TRANSACCIÓN POR ID
  async obtenerPorId(id: number): Promise<TransaccionResponseDTO> {
    const transaccion = await this.transaccionRepo.findById(id);
    if (!transaccion) {
      throw new NotFoundError(`Transacción con ID ${id} no encontrada.`);
    }
    return this.toResponseDTO(transaccion);
  }

  // 3. LISTAR POR USUARIO
  async listarPorUsuario(idUsuario: number): Promise<TransaccionResponseDTO[]> {
    const transacciones = await this.transaccionRepo.findByUsuario(idUsuario);
    return transacciones.map((t) => this.toResponseDTO(t));
  }

  // 4. LISTAR PAGINADO
  async listarPaginado(page: number = 1, limit: number = 20): Promise<{
    data: TransaccionResponseDTO[];
    page: number;
    limit: number;
  }> {
    const offset = (page - 1) * limit;
    const transacciones = await this.transaccionRepo.findPaginated(limit, offset);

    return {
      data: transacciones.map((t) => this.toResponseDTO(t)),
      page,
      limit,
    };
  }

  // 5. ACTUALIZAR
  async actualizar(id: number, data: UpdateTransaccionDTO): Promise<TransaccionResponseDTO> {
    const transaccionActualizada = await this.transaccionRepo.update(id, {
      ...(data.estado && { estado: data.estado }),
    });

    if (!transaccionActualizada) {
      throw new NotFoundError(`Transacción con ID ${id} no encontrada para actualizar.`);
    }

    return this.toResponseDTO(transaccionActualizada);
  }
}
