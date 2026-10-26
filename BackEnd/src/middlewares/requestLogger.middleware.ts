import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

export function requestLogger(req: Request, res: Response, next: NextFunction): void {
  // Ignorar archivos estáticos del frontend para no saturar los logs
  if (
    req.path.startsWith('/assets') ||
    req.path.endsWith('.js') ||
    req.path.endsWith('.css') ||
    req.path.endsWith('.svg') ||
    req.path.endsWith('.ico')
  ) {
    return next();
  }

  const start = Date.now();
  const { method, originalUrl } = req;
  const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';

  res.on('finish', () => {
    const duration = Date.now() - start;
    const { statusCode } = res;

    const logData = {
      method,
      url: originalUrl,
      statusCode,
      durationMs: duration,
      ip: clientIp,
    };

    if (statusCode >= 500) {
      logger.error(logData, `[HTTP] ${method} ${originalUrl} ${statusCode} (${duration}ms)`);
    } else if (statusCode >= 400) {
      logger.warn(logData, `[HTTP] ${method} ${originalUrl} ${statusCode} (${duration}ms)`);
    } else {
      logger.info(logData, `[HTTP] ${method} ${originalUrl} ${statusCode} (${duration}ms)`);
    }
  });

  next();
}
