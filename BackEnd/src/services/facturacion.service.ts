import { FacturacionRepository, TransaccionRepository, ProductoRepository } from '@appresso/database';
import type { Factura } from '@appresso/database';
import crypto from 'crypto';
import {
  CreateFacturaDTO,
  UpdateFacturaDTO,
  FacturaResponseDTO,
  DetalleFacturaResponse,
} from '../dtos/facturacion.dto';
import { NotFoundError, ConflictError } from '../errors/app-error';
import { logger } from '../utils/logger';

// SERVICIO DE FACTURACIÓN — CHECKOUT SEGURO
// ESTE SERVICIO IMPLEMENTA LA PROTECCIÓN ANTI-PRICE TAMPERING:
//   EL CLIENTE SOLO ENVÍA { idProducto, cantidad }[]
//   EL BACKEND BUSCA EL PRECIO OFICIAL EN BASE DE DATOS Y LO CALCULA
//   ESTO IMPIDE QUE UN ATACANTE ENVÍE PRECIOS FALSOS EN EL REQUEST
//
// FLUJO COMPLETO DE CREACIÓN DE FACTURA:
//   1. Para cada item: buscar producto, validar activo y stock suficiente
//   2. Calcular subtotal acumulado con precio oficial de BD
//   3. Calcular impuesto (19% IVA Colombia) y total
//   4. Generar número de factura único: FAC-{timestamp}
//   5. Generar hash HMAC-SHA256 de integridad de la transacción
//   6. Crear la TRANSACCIÓN primero (necesitamos su ID para la factura)
//   7. Crear la FACTURA con idTransaccion, detalles como snapshot JSONB

// TASA DE IVA COLOMBIA (19%)
const IVA_COLOMBIA = 0.19;

export class FacturacionService {
  private facturaRepo: FacturacionRepository;
  private transaccionRepo: TransaccionRepository;
  private productoRepo: ProductoRepository;

  constructor() {
    this.facturaRepo = new FacturacionRepository();
    this.transaccionRepo = new TransaccionRepository();
    this.productoRepo = new ProductoRepository();
  }

  // DATA MAPPER (FUNCIÓN PURA DE TRANSFORMACIÓN)
  private toResponseDTO(entity: Factura): FacturaResponseDTO {
    return {
      id: entity.idFactura,
      idTransaccion: entity.idTransaccion,
      idUsuario: entity.idUsuario,
      numeroFactura: entity.numeroFactura,
      subtotal: Number(entity.subtotal),
      impuesto: Number(entity.impuesto),
      total: Number(entity.total),
      // detalles viene como JSONB de Drizzle (ya es objeto JS, no string)
      detalles: entity.detalles as DetalleFacturaResponse[],
      estado: entity.estado as FacturaResponseDTO['estado'],
      fechaEmision: entity.fechaEmision.toISOString(),
    };
  }

  // ─── GENERACIÓN DEL HASH HMAC-SHA256 PARA LA TRANSACCIÓN ASOCIADA ────────────
  // Misma lógica que en TransaccionService: sella el contenido con timestamp único
  // ──────────────────────────────────────────────────────────────────────────────
  private generarHashIntegridad(idUsuario: number, total: number, numeroFactura: string): string {
    const secretKey = process.env.HMAC_SECRET || 'appresso-secret-key-32-bytes-secure';
    const timestamp = Date.now();
    const payload = JSON.stringify({ idUsuario, total, numeroFactura, timestamp });

    return crypto
      .createHmac('sha256', secretKey)
      .update(payload)
      .digest('hex');
  }

  // MÉTODOS CON LÓGICA DE NEGOCIO

  // 1. CREAR NUEVA FACTURA — CHECKOUT SEGURO
  async crear(data: CreateFacturaDTO): Promise<FacturaResponseDTO> {
    // ── FASE 1: VALIDAR PRODUCTOS Y CALCULAR PRECIOS DESDE BD ──────────────────
    const detallesCalculados: DetalleFacturaResponse[] = [];
    let subtotal = 0;

    for (const item of data.detalles) {
      // BUSCAR EL PRODUCTO EN BD (PRECIO OFICIAL, NO DEL CLIENTE)
      const producto = await this.productoRepo.findById(item.idProducto);

      if (!producto) {
        throw new NotFoundError(`Producto con ID ${item.idProducto} no encontrado.`);
      }
      if (!producto.activo) {
        throw new ConflictError(`El producto "${producto.nombreProducto}" no está disponible.`);
      }
      if (producto.stockProducto < item.cantidad) {
        throw new ConflictError(
          `Stock insuficiente para "${producto.nombreProducto}". Disponible: ${producto.stockProducto}, solicitado: ${item.cantidad}.`
        );
      }

      // PRECIO OFICIAL DESDE BD (Drizzle retorna numeric como string → convertir)
      const precioUnitario = Number(producto.precioProducto);
      const subtotalItem = precioUnitario * item.cantidad;
      subtotal += subtotalItem;

      // SNAPSHOT DEL DETALLE: precio queda registrado en el momento de compra
      detallesCalculados.push({
        idProducto: producto.idProducto,
        nombreProducto: producto.nombreProducto,
        cantidad: item.cantidad,
        precioUnitario,
        subtotal: subtotalItem,
      });
    }

    // ── FASE 2: CALCULAR IMPUESTO Y TOTAL ──────────────────────────────────────
    // IVA 19% COLOMBIA — SE CALCULA EN EL BACKEND, NUNCA EN EL CLIENTE
    const impuesto = parseFloat((subtotal * IVA_COLOMBIA).toFixed(2));
    const total = parseFloat((subtotal + impuesto).toFixed(2));

    // ── FASE 3: GENERAR NÚMERO DE FACTURA ÚNICO ────────────────────────────────
    // FAC-{timestamp} asegura unicidad sin necesitar una secuencia adicional en BD
    const numeroFactura = `FAC-${Date.now()}`;

    logger.info({
      msg: 'Generando factura',
      idUsuario: data.idUsuario,
      numeroFactura,
      subtotal,
      impuesto,
      total,
      cantidadItems: detallesCalculados.length,
    });

    // ── FASE 4: GENERAR HASH DE INTEGRIDAD PARA LA TRANSACCIÓN ────────────────
    const hashIntegridad = this.generarHashIntegridad(data.idUsuario, total, numeroFactura);

    // ── FASE 5: CREAR LA TRANSACCIÓN PRIMERO (NECESITAMOS SU ID) ──────────────
    // La transacción representa el movimiento financiero.
    // metodoPago por defecto EFECTIVO (se puede extender con campo en el DTO si se requiere)
    const nuevaTransaccion = await this.transaccionRepo.create({
      idUsuario: data.idUsuario,
      valorTransaccion: String(total),
      metodoPago: 'EFECTIVO',
      estado: 'PENDIENTE',
      hash: hashIntegridad,
    });

    // ── FASE 6: CREAR LA FACTURA CON idTransaccion YA GENERADO ────────────────
    const nuevaFactura = await this.facturaRepo.create({
      idTransaccion: nuevaTransaccion.idTransaccion,
      idUsuario: data.idUsuario,
      numeroFactura,
      subtotal: String(subtotal),
      impuesto: String(impuesto),
      total: String(total),
      detalles: detallesCalculados as any, // Drizzle acepta JsonValue
      estado: 'PENDIENTE',
    });

    logger.info({
      msg: 'Factura creada exitosamente',
      idFactura: nuevaFactura.idFactura,
      idTransaccion: nuevaTransaccion.idTransaccion,
      numeroFactura,
    });

    return this.toResponseDTO(nuevaFactura);
  }

  // 2. OBTENER FACTURA POR ID
  async obtenerPorId(id: number): Promise<FacturaResponseDTO> {
    const factura = await this.facturaRepo.findById(id);
    if (!factura) {
      throw new NotFoundError(`Factura con ID ${id} no encontrada.`);
    }

    return this.toResponseDTO(factura);
  }

  // 3. OBTENER FACTURAS DE UN USUARIO
  async listarPorUsuario(idUsuario: number): Promise<FacturaResponseDTO[]> {
    const facturas = await this.facturaRepo.findByUsuario(idUsuario);
    return facturas.map((f) => this.toResponseDTO(f));
  }

  // 4. LISTAR FACTURAS CON PAGINACIÓN
  async listarPaginado(page: number = 1, limit: number = 20): Promise<{
    data: FacturaResponseDTO[];
    page: number;
    limit: number;
  }> {
    const offset = (page - 1) * limit;
    const facturas = await this.facturaRepo.findPaginated(limit, offset);

    return {
      data: facturas.map((f) => this.toResponseDTO(f)),
      page,
      limit,
    };
  }

  // 5. ACTUALIZAR ESTADO DE FACTURA (PAGADA / ANULADA)
  async actualizar(id: number, data: UpdateFacturaDTO): Promise<FacturaResponseDTO> {
    const facturaActualizada = await this.facturaRepo.update(id, {
      ...(data.estado && { estado: data.estado }),
    });

    if (!facturaActualizada) {
      throw new NotFoundError(`Factura con ID ${id} no encontrada para actualizar.`);
    }

    return this.toResponseDTO(facturaActualizada);
  }
}
