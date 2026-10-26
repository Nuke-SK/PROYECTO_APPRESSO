import { Request, Response, NextFunction } from 'express';
import { UsuarioService } from '../services/usuario.service';
import { CreateUsuarioDTO, UpdateUsuarioDTO, UsuarioIdParamDTO } from '../dtos/usuario.dto';

export class UsuarioController {
  private usuarioService: UsuarioService;

  constructor() {
    this.usuarioService = new UsuarioService();
  }

  // POST /api/v1/usuarios
  crear = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data = req.body as CreateUsuarioDTO;
      const nuevoUsuario = await this.usuarioService.crear(data);
      res.status(201).json({
        status: 'success',
        statusCode: 201,
        message: 'Usuario creado exitosamente',
        data: nuevoUsuario,
      });
    } catch (error) {
      next(error);
    }
  };

  // GET /api/v1/usuarios/:id
  obtenerPorId = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params as unknown as UsuarioIdParamDTO;
      const usuario = await this.usuarioService.obtenerPorId(id);
      res.status(200).json({
        status: 'success',
        statusCode: 200,
        data: usuario,
      });
    } catch (error) {
      next(error);
    }
  };

  // GET /api/v1/usuarios?page=1&limit=20
  listar = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const page = req.query.page ? Number(req.query.page) : 1;
      const limit = req.query.limit ? Number(req.query.limit) : 20;

      const resultado = await this.usuarioService.listarPaginado(page, limit);
      res.status(200).json({
        status: 'success',
        statusCode: 200,
        ...resultado,
      });
    } catch (error) {
      next(error);
    }
  };

  // PATCH /api/v1/usuarios/:id
  actualizar = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params as unknown as UsuarioIdParamDTO;
      const data = req.body as UpdateUsuarioDTO;

      const usuarioActualizado = await this.usuarioService.actualizar(id, data);
      res.status(200).json({
        status: 'success',
        statusCode: 200,
        message: 'Usuario actualizado exitosamente',
        data: usuarioActualizado,
      });
    } catch (error) {
      next(error);
    }
  };
}
