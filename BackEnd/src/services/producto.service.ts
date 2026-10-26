import { ProductoRepository, Producto } from '@appresso/database';
import { 
  CreateProductoDTO, 
  UpdateProductoDTO, 
  ProductoResponseDTO 
} from '../dtos/producto.dto';
import { ConflictError, NotFoundError } from '../errors/app-error';

export class ProductoService {
  private productoRepo: ProductoRepository;

  constructor() {
    this.productoRepo = new ProductoRepository();
  }

  // =========================================================
  // DATA MAPPER (FUNCIÓN PURA DE TRANSFORMACIÓN)
  // Desacopla la entidad SQL del contrato expuesto al cliente
  // =========================================================
  private toResponseDTO(entity: Producto): ProductoResponseDTO {
    return {
      id: entity.idProducto,
      idSubcategoria: entity.idSubcategoria,
      nombre: entity.nombreProducto,
      descripcion: entity.descripcionProducto,
      precio: Number(entity.precioProducto),
      stock: entity.stockProducto,
      activo: entity.activo,
      fechaCreacion: entity.fechaCreacion.toISOString(),
      fechaModificacion: entity.fechaModificacion.toISOString(),
    };
  }

  // =========================================================
  // MÉTODOS CON LÓGICA DE NEGOCIO
  // =========================================================

  // 1. CREAR NUEVO PRODUCTO
  async crear(data: CreateProductoDTO): Promise<ProductoResponseDTO> {
    // Regla de Negocio: El nombre no puede estar repetido
    const productoExistente = await this.productoRepo.findByNombre(data.nombre);
    if (productoExistente) {
      throw new ConflictError(`El producto ${data.nombre} ya se encuentra registrado.`);
    }

    const nuevoProducto = await this.productoRepo.create({
      idSubcategoria: data.idSubcategoria,
      nombreProducto: data.nombre,
      descripcionProducto: data.descripcion,
      precioProducto: data.precio.toString(),
      stockProducto: data.stock,
      activo: data.activo,
    });

    return this.toResponseDTO(nuevoProducto);
  }

  // 3. OBTENER PRODUCTO POR ID
  async obtenerPorId(id: number): Promise<ProductoResponseDTO> {
    const producto = await this.productoRepo.findById(id);
    if (!producto) {
      throw new NotFoundError(`Producto con ID ${id} no encontrado.`);
    }

    return this.toResponseDTO(producto);
  }

  // 3. LISTAR PRODUCTOS CON PAGINACIÓN
  async listarPaginado(page: number = 1, limit: number = 20): Promise<{
    data: ProductoResponseDTO[];
    page: number;
    limit: number;
  }> {
    const offset = (page - 1) * limit;
    const productos = await this.productoRepo.findPaginated(limit, offset);

    return {
      data: productos.map((product) => this.toResponseDTO(product)),
      page,
      limit,
    };
  }

  // 4. ACTUALIZAR PRODUCTO PARCIAL
  async actualizar(id: number, data: UpdateProductoDTO): Promise<ProductoResponseDTO> {
    // Si intenta cambiar el nombre, validar que otro producto no lo tenga
    if (data.nombre) {
      const productoConMismoNombre = await this.productoRepo.findByNombre(data.nombre);
      if (productoConMismoNombre && productoConMismoNombre.idProducto !== id) {
        throw new ConflictError(`El producto ${data.nombre} ya está en uso por otro producto.`);
      }
    }

    const productoActualizado = await this.productoRepo.update(id, {
      ...(data.nombre && { nombreProducto: data.nombre }),
      ...(data.descripcion !== undefined && { descripcionProducto: data.descripcion }),
      ...(data.precio !== undefined && { precioProducto: data.precio.toString() }),
      ...(data.stock !== undefined && { stockProducto: data.stock }),
      ...(data.activo !== undefined && { activo: data.activo }),
    });

    if (!productoActualizado) {
      throw new NotFoundError(`Producto con ID ${id} no encontrado para actualizar.`);
    }

    return this.toResponseDTO(productoActualizado);
  }
}
