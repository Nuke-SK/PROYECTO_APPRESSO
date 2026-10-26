import { Router } from 'express';
import { SecurityConfigController } from '../controllers/securityConfig.controller';
import { sanitize, validate } from '../middlewares';
import { UpdateSecurityConfigSchema } from '../dtos/securityConfig.dto';

const router = Router();
const controller = new SecurityConfigController();

router.get('/', controller.obtener);
// PATCH: sanitize → validate(DTO estricto) → controller
router.patch('/', sanitize, validate(UpdateSecurityConfigSchema, 'body'), controller.actualizar);

export default router;
