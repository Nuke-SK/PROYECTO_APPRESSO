import { UsuarioRepository, Usuario } from '@appresso/database';
import { 
  CreateUsuarioDTO, 
  UpdateUsuarioDTO, 
  UsuarioResponseDTO 
} from '../dtos/usuario.dto';
import { ConflictError, NotFoundError } from '../errors/app-error';

export class UsuarioService {
  private usuarioRepo: UsuarioRepository;

  constructor() {
    this.usuarioRepo = new UsuarioRepository();
  }

  // =========================================================
  // DATA MAPPER (FUNCIÓN PURA DE TRANSFORMACIÓN)
  // Desacopla la entidad SQL del contrato expuesto al cliente
  // =========================================================
  private toResponseDTO(entity: Usuario): UsuarioResponseDTO {
    return {
      id: entity.idUsuario,
      nombre: entity.nombreUsuario,
      email: entity.emailUsuario,
      activo: entity.activo,
      fechaCreacion: entity.fechaCreacion.toISOString(),
    };
  }

  // =========================================================
  // MÉTODOS CON LÓGICA DE NEGOCIO
  // =========================================================

  // 1. Crear nuevo usuario
  async crear(data: CreateUsuarioDTO): Promise<UsuarioResponseDTO> {
    // Regla de Negocio: El email no puede estar repetido
    const usuarioExistente = await this.usuarioRepo.findByEmail(data.email);
    if (usuarioExistente) {
      throw new ConflictError(`El correo ${data.email} ya se encuentra registrado.`);
    }

    const nuevoUsuario = await this.usuarioRepo.create({
      nombreUsuario: data.nombre,
      emailUsuario: data.email,
      activo: data.activo,
    });

    return this.toResponseDTO(nuevoUsuario);
  }

  // 2. Obtener usuario por ID
  async obtenerPorId(id: number): Promise<UsuarioResponseDTO> {
    const usuario = await this.usuarioRepo.findById(id);
    if (!usuario) {
      throw new NotFoundError(`Usuario con ID ${id} no encontrado.`);
    }

    return this.toResponseDTO(usuario);
  }

  // 3. Listar usuarios con paginación
  async listarPaginado(page: number = 1, limit: number = 20): Promise<{
    data: UsuarioResponseDTO[];
    page: number;
    limit: number;
  }> {
    const offset = (page - 1) * limit;
    const usuarios = await this.usuarioRepo.findPaginated(limit, offset);

    return {
      data: usuarios.map((user) => this.toResponseDTO(user)),
      page,
      limit,
    };
  }

  // 4. Actualizar usuario parcial
  async actualizar(id: number, data: UpdateUsuarioDTO): Promise<UsuarioResponseDTO> {
    // Si intenta cambiar el email, validar que otro usuario no lo tenga
    if (data.email) {
      const usuarioConMismoEmail = await this.usuarioRepo.findByEmail(data.email);
      if (usuarioConMismoEmail && usuarioConMismoEmail.idUsuario !== id) {
        throw new ConflictError(`El correo ${data.email} ya está en uso por otro usuario.`);
      }
    }

    const usuarioActualizado = await this.usuarioRepo.update(id, {
      ...(data.nombre && { nombreUsuario: data.nombre }),
      ...(data.email && { emailUsuario: data.email }),
      ...(data.activo !== undefined && { activo: data.activo }),
    });

    if (!usuarioActualizado) {
      throw new NotFoundError(`Usuario con ID ${id} no encontrado para actualizar.`);
    }

    return this.toResponseDTO(usuarioActualizado);
  }
}
