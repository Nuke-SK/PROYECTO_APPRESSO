import { Router } from 'express';
import { UsuarioController } from '../controllers/usuario.controller';
import { sanitize, validate } from '../middlewares';
import { 
  CreateUsuarioSchema, 
  UpdateUsuarioSchema, 
  UsuarioIdParamSchema 
} from '../dtos/usuario.dto';

const router = Router();
const controller = new UsuarioController();

// POST /api/v1/usuarios - Crear nuevo usuario
router.post(
  '/',
  sanitize,
  validate(CreateUsuarioSchema, 'body'),
  controller.crear
);

// GET /api/v1/usuarios - Listar usuarios paginados
router.get(
  '/',
  controller.listar
);

// GET /api/v1/usuarios/:id - Obtener un usuario por ID
router.get(
  '/:id',
  validate(UsuarioIdParamSchema, 'params'),
  controller.obtenerPorId
);

// PATCH /api/v1/usuarios/:id - Actualización parcial de usuario
router.patch(
  '/:id',
  sanitize,
  validate(UsuarioIdParamSchema, 'params'),
  validate(UpdateUsuarioSchema, 'body'),
  controller.actualizar
);

export default router;
