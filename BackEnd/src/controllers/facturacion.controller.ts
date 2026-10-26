import { Request, Response, NextFunction } from 'express';
import { FacturacionService } from '../services/facturacion.service';

// CONTROLADOR DE FACTURACIÓN
// RESPONSABILIDAD ÚNICA: ORQUESTAR REQUEST → SERVICIO → RESPONSE
// LA LÓGICA ANTI-PRICE TAMPERING Y CÁLCULO DE IVA VIVE EN EL SERVICIO

const facturacionService = new FacturacionService();

// POST /api/v1/facturas
export async function crearFactura(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const facturaCreada = await facturacionService.crear(req.body);
    res.status(201).json({
      status: 'success',
      statusCode: 201,
      message: 'Factura creada exitosamente',
      data: facturaCreada,
    });
  } catch (error) {
    next(error);
  }
}

// GET /api/v1/facturas
export async function listarFacturas(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;
    const resultado = await facturacionService.listarPaginado(page, limit);
    res.status(200).json({
      status: 'success',
      statusCode: 200,
      message: 'Facturas listadas exitosamente',
      data: resultado,
    });
  } catch (error) {
    next(error);
  }
}

// GET /api/v1/facturas/usuario/:idUsuario
export async function listarFacturasPorUsuario(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const idUsuario = Number(req.params.idUsuario);
    const facturas = await facturacionService.listarPorUsuario(idUsuario);
    res.status(200).json({
      status: 'success',
      statusCode: 200,
      message: 'Facturas del usuario obtenidas exitosamente',
      data: facturas,
    });
  } catch (error) {
    next(error);
  }
}

// GET /api/v1/facturas/:id
export async function obtenerFacturaPorId(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = Number(req.params.id);
    const factura = await facturacionService.obtenerPorId(id);
    res.status(200).json({
      status: 'success',
      statusCode: 200,
      message: 'Factura obtenida exitosamente',
      data: factura,
    });
  } catch (error) {
    next(error);
  }
}

// PATCH /api/v1/facturas/:id
export async function actualizarFactura(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = Number(req.params.id);
    const facturaActualizada = await facturacionService.actualizar(id, req.body);
    res.status(200).json({
      status: 'success',
      statusCode: 200,
      message: 'Estado de factura actualizado exitosamente',
      data: facturaActualizada,
    });
  } catch (error) {
    next(error);
  }
}
