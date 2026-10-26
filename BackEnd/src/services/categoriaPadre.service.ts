import { CategoriaPadreRepository } from '@appresso/database';
import type { CategoriaPadre } from '@appresso/database';
import {
  CreateCategoriaPadreDTO,
  UpdateCategoriaPadreDTO,
  CategoriaPadreResponseDTO,
} from '../dtos/categoriaPadre.dto';
import { ConflictError, NotFoundError } from '../errors/app-error';

// SERVICIO DE CATEGORÍAS PADRE
// CONTIENE TODA LA LÓGICA DE NEGOCIO PARA LA GESTIÓN DE CATEGORÍAS PADRE
// EL CONTROLADOR SOLO LLAMA A ESTE SERVICIO, NUNCA TOCA LA BD DIRECTAMENTE

export class CategoriaPadreService {
  private categoriaPadreRepo: CategoriaPadreRepository;

  constructor() {
    this.categoriaPadreRepo = new CategoriaPadreRepository();
  }

  // DATA MAPPER (FUNCIÓN PURA DE TRANSFORMACIÓN)
  // CONVIERTE LA ENTIDAD CRUDA DE DRIZZLE AL CONTRATO PÚBLICO CategoriaPadreResponseDTO
  // SE LLAMA SIEMPRE ANTES DE DEVOLVER DATOS AL CONTROLADOR
  private toResponseDTO(entity: CategoriaPadre): CategoriaPadreResponseDTO {
    return {
      id: entity.idCategoriaPadre,
      nombre: entity.nombreCategoria,
      descripcion: entity.descripcionCategoria ?? null,
      activo: entity.activo,
      fechaCreacion: entity.fechaCreacion.toISOString(),
      fechaModificacion: entity.fechaModificacion.toISOString(),
    };
  }

  // MÉTODOS CON LÓGICA DE NEGOCIO

  // 1. CREAR NUEVA CATEGORÍA PADRE
  // REGLA: EL NOMBRE DE CATEGORÍA DEBE SER ÚNICO EN LA TABLA
  async crear(data: CreateCategoriaPadreDTO): Promise<CategoriaPadreResponseDTO> {
    const categoriaExistente = await this.categoriaPadreRepo.findByNombre(data.nombre);
    if (categoriaExistente) {
      throw new ConflictError(`La categoría "${data.nombre}" ya se encuentra registrada.`);
    }

    const nuevaCategoria = await this.categoriaPadreRepo.create({
      nombreCategoria: data.nombre,
      descripcionCategoria: data.descripcion ?? null,
      activo: data.activo ?? true,
    });

    return this.toResponseDTO(nuevaCategoria);
  }

  // 2. OBTENER CATEGORÍA POR ID
  async obtenerPorId(id: number): Promise<CategoriaPadreResponseDTO> {
    const categoria = await this.categoriaPadreRepo.findById(id);
    if (!categoria) {
      throw new NotFoundError(`Categoría con ID ${id} no encontrada.`);
    }

    return this.toResponseDTO(categoria);
  }

  // 3. LISTAR CATEGORÍAS CON PAGINACIÓN
  // offset = (page - 1) * limit  →  la fórmula vive aquí en el servicio, no en el repositorio
  async listarPaginado(page: number = 1, limit: number = 20): Promise<{
    data: CategoriaPadreResponseDTO[];
    page: number;
    limit: number;
  }> {
    const offset = (page - 1) * limit;
    const categorias = await this.categoriaPadreRepo.findPaginated(limit, offset);

    return {
      data: categorias.map((cat) => this.toResponseDTO(cat)),
      page,
      limit,
    };
  }

  // 4. ACTUALIZAR CATEGORÍA PARCIALMENTE
  // SI SE CAMBIA EL NOMBRE, VALIDA QUE NO ESTÉ EN USO POR OTRA CATEGORÍA
  async actualizar(id: number, data: UpdateCategoriaPadreDTO): Promise<CategoriaPadreResponseDTO> {
    if (data.nombre) {
      const categoriaConMismoNombre = await this.categoriaPadreRepo.findByNombre(data.nombre);
      if (categoriaConMismoNombre && categoriaConMismoNombre.idCategoriaPadre !== id) {
        throw new ConflictError(`El nombre "${data.nombre}" ya está en uso por otra categoría.`);
      }
    }

    const categoriaActualizada = await this.categoriaPadreRepo.update(id, {
      ...(data.nombre && { nombreCategoria: data.nombre }),
      ...(data.descripcion !== undefined && { descripcionCategoria: data.descripcion ?? null }),
      ...(data.activo !== undefined && { activo: data.activo }),
    });

    if (!categoriaActualizada) {
      throw new NotFoundError(`Categoría con ID ${id} no encontrada para actualizar.`);
    }

    return this.toResponseDTO(categoriaActualizada);
  }
}
