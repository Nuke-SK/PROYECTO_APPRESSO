import { SubcategoriaRepository, CategoriaPadreRepository } from '@appresso/database';
import type { Subcategoria } from '@appresso/database';
import {
  CreateSubcategoriaDTO,
  UpdateSubcategoriaDTO,
  SubcategoriaResponseDTO,
} from '../dtos/subcategoria.dto';
import { ConflictError, NotFoundError } from '../errors/app-error';

// SERVICIO DE SUBCATEGORÍAS
// CONTIENE TODA LA LÓGICA DE NEGOCIO PARA LA GESTIÓN DE SUBCATEGORÍAS
// VALIDA QUE LA CATEGORÍA PADRE EXISTA ANTES DE CREAR UNA SUBCATEGORÍA
// EL CONTROLADOR SOLO LLAMA A ESTE SERVICIO, NUNCA TOCA LA BD DIRECTAMENTE

export class SubcategoriaService {
  private subcategoriaRepo: SubcategoriaRepository;
  private categoriaPadreRepo: CategoriaPadreRepository;

  constructor() {
    this.subcategoriaRepo = new SubcategoriaRepository();
    // SE NECESITA EL REPO DE CATEGORÍAS PADRE PARA VALIDAR LA EXISTENCIA DEL PADRE
    this.categoriaPadreRepo = new CategoriaPadreRepository();
  }

  // DATA MAPPER (FUNCIÓN PURA DE TRANSFORMACIÓN)
  // CONVIERTE LA ENTIDAD CRUDA DE DRIZZLE AL CONTRATO PÚBLICO SubcategoriaResponseDTO
  private toResponseDTO(entity: Subcategoria): SubcategoriaResponseDTO {
    return {
      id: entity.idSubcategoria,
      idCategoriaPadre: entity.idCategoriaPadre,
      nombre: entity.nombreSubcategoria,
      descripcion: entity.descripcionSubcategoria ?? null,
      activo: entity.activo,
      fechaCreacion: entity.fechaCreacion.toISOString(),
      fechaModificacion: entity.fechaModificacion.toISOString(),
    };
  }

  // MÉTODOS CON LÓGICA DE NEGOCIO

  // 1. CREAR NUEVA SUBCATEGORÍA
  // REGLA 1: LA CATEGORÍA PADRE DEBE EXISTIR Y ESTAR ACTIVA
  // REGLA 2: EL NOMBRE DE SUBCATEGORÍA DEBE SER ÚNICO DENTRO DE LA MISMA CATEGORÍA PADRE
  async crear(data: CreateSubcategoriaDTO): Promise<SubcategoriaResponseDTO> {
    // VALIDAR QUE LA CATEGORÍA PADRE EXISTE
    const categoriaPadre = await this.categoriaPadreRepo.findById(data.idCategoriaPadre);
    if (!categoriaPadre) {
      throw new NotFoundError(`Categoría padre con ID ${data.idCategoriaPadre} no encontrada.`);
    }

    // VALIDAR QUE EL NOMBRE NO ESTÉ DUPLICADO DENTRO DEL MISMO PADRE
    const subcategoriasDelPadre = await this.subcategoriaRepo.findByCategoriaPadre(data.idCategoriaPadre);
    const nombreDuplicado = subcategoriasDelPadre.some(
      (sub) => sub.nombreSubcategoria.toLowerCase() === data.nombre.toLowerCase()
    );
    if (nombreDuplicado) {
      throw new ConflictError(
        `La subcategoría "${data.nombre}" ya existe en la categoría "${categoriaPadre.nombreCategoria}".`
      );
    }

    const nuevaSubcategoria = await this.subcategoriaRepo.create({
      idCategoriaPadre: data.idCategoriaPadre,
      nombreSubcategoria: data.nombre,
      descripcionSubcategoria: data.descripcion ?? null,
      activo: data.activo ?? true,
    });

    return this.toResponseDTO(nuevaSubcategoria);
  }

  // 2. OBTENER SUBCATEGORÍA POR ID
  async obtenerPorId(id: number): Promise<SubcategoriaResponseDTO> {
    const subcategoria = await this.subcategoriaRepo.findById(id);
    if (!subcategoria) {
      throw new NotFoundError(`Subcategoría con ID ${id} no encontrada.`);
    }

    return this.toResponseDTO(subcategoria);
  }

  // 3. LISTAR SUBCATEGORÍAS CON PAGINACIÓN
  async listarPaginado(page: number = 1, limit: number = 20): Promise<{
    data: SubcategoriaResponseDTO[];
    page: number;
    limit: number;
  }> {
    const offset = (page - 1) * limit;
    const subcategorias = await this.subcategoriaRepo.findPaginated(limit, offset);

    return {
      data: subcategorias.map((sub) => this.toResponseDTO(sub)),
      page,
      limit,
    };
  }

  // 4. LISTAR SUBCATEGORÍAS POR CATEGORÍA PADRE (SIN PAGINACIÓN, SON LISTAS CORTAS)
  async listarPorCategoriaPadre(idCategoriaPadre: number): Promise<SubcategoriaResponseDTO[]> {
    // VALIDAR QUE LA CATEGORÍA PADRE EXISTE
    const categoriaPadre = await this.categoriaPadreRepo.findById(idCategoriaPadre);
    if (!categoriaPadre) {
      throw new NotFoundError(`Categoría padre con ID ${idCategoriaPadre} no encontrada.`);
    }

    const subcategorias = await this.subcategoriaRepo.findByCategoriaPadre(idCategoriaPadre);
    return subcategorias.map((sub) => this.toResponseDTO(sub));
  }

  // 5. ACTUALIZAR SUBCATEGORÍA PARCIALMENTE
  async actualizar(id: number, data: UpdateSubcategoriaDTO): Promise<SubcategoriaResponseDTO> {
    const subcategoriaActualizada = await this.subcategoriaRepo.update(id, {
      ...(data.nombre && { nombreSubcategoria: data.nombre }),
      ...(data.descripcion !== undefined && { descripcionSubcategoria: data.descripcion ?? null }),
      ...(data.activo !== undefined && { activo: data.activo }),
      ...(data.idCategoriaPadre !== undefined && { idCategoriaPadre: data.idCategoriaPadre }),
    });

    if (!subcategoriaActualizada) {
      throw new NotFoundError(`Subcategoría con ID ${id} no encontrada para actualizar.`);
    }

    return this.toResponseDTO(subcategoriaActualizada);
  }
}
