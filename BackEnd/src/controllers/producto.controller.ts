import { Request, Response, NextFunction } from 'express';
import { ProductoService } from '../services/producto.service';
import { CreateProductoDTO, UpdateProductoDTO, ProductoIdParamDTO } from '../dtos/producto.dto';

export class ProductoController {
  private productoService: ProductoService;

  constructor() {
    this.productoService = new ProductoService();
  }

  // POST /api/v1/productos
  crear = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data = req.body as CreateProductoDTO;
      const nuevoProducto = await this.productoService.crear(data);
      res.status(201).json({
        status: 'success',
        statusCode: 201,
        message: 'Producto creado exitosamente',
        data: nuevoProducto,
      });
    } catch (error) {
      next(error);
    }
  };

  // GET /api/v1/productos/:id
  obtenerPorId = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params as unknown as ProductoIdParamDTO;
      const producto = await this.productoService.obtenerPorId(id);
      res.status(200).json({
        status: 'success',
        statusCode: 200,
        data: producto,
      });
    } catch (error) {
      next(error);
    }
  };

  // GET /api/v1/productos?page=1&limit=20
  listar = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const page = req.query.page ? Number(req.query.page) : 1;
      const limit = req.query.limit ? Number(req.query.limit) : 20;

      const resultado = await this.productoService.listarPaginado(page, limit);
      res.status(200).json({
        status: 'success',
        statusCode: 200,
        ...resultado,
      });
    } catch (error) {
      next(error);
    }
  };

  // PATCH /api/v1/productos/:id
  actualizar = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params as unknown as ProductoIdParamDTO;
      const data = req.body as UpdateProductoDTO;

      const productoActualizado = await this.productoService.actualizar(id, data);
      res.status(200).json({
        status: 'success',
        statusCode: 200,
        message: 'Producto actualizado exitosamente',
        data: productoActualizado,
      });
    } catch (error) {
      next(error);
    }
  };
}
