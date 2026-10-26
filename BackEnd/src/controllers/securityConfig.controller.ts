import { Request, Response, NextFunction } from 'express';
import { securityConfigService } from '../services/securityConfig.service';

export class SecurityConfigController {
  obtener = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const config = securityConfigService.getPublicConfig();
      res.status(200).json({
        status: 'success',
        statusCode: 200,
        data: config,
      });
    } catch (error) {
      next(error);
    }
  };

  actualizar = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const {
        permitirHashExterno,
        modoEstrictoHMAC,
        ventanaSegundos,
        maxTransaccionesVentana,
        umbralManana,
        umbralTarde,
        umbralNoche,
        secretoHMAC,
      } = req.body;
      const updated = securityConfigService.updateConfig({
        ...(typeof permitirHashExterno === 'boolean'     && { permitirHashExterno }),
        ...(typeof modoEstrictoHMAC === 'boolean'        && { modoEstrictoHMAC }),
        ...(typeof ventanaSegundos === 'number'          && { ventanaSegundos }),
        ...(typeof maxTransaccionesVentana === 'number'  && { maxTransaccionesVentana }),
        ...(typeof umbralManana === 'number'             && { umbralManana }),
        ...(typeof umbralTarde === 'number'              && { umbralTarde }),
        ...(typeof umbralNoche === 'number'              && { umbralNoche }),
        ...(typeof secretoHMAC === 'string' && secretoHMAC.trim().length > 0 && { secretoHMAC: secretoHMAC.trim() }),
      });

      res.status(200).json({
        status: 'success',
        statusCode: 200,
        message: 'Configuración de seguridad actualizada exitosamente',
        data: securityConfigService.getPublicConfig(),
      });
    } catch (error) {
      next(error);
    }
  };
}
