import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { securityConfigService } from '../services/securityConfig.service';
/// <reference path="../types/express.d.ts" />

// MARGEN DE TOLERANCIA PARA LA VENTANA DE TIEMPO (5 MINUTOS EN MILISEGUNDOS)
const TOLERANCIA_TIMESTAMP_MS = 5 * 60 * 1000;

// MIDDLEWARE DE VERIFICACIÓN CRIPTOGRÁFICA HMAC-SHA256
export function verifyHMAC(req: Request, res: Response, next: NextFunction): void {
  const config = securityConfigService.getConfig();
  const signature = req.headers['x-signature'] as string | undefined;
  const timestampHeader = req.headers['x-timestamp'] as string | undefined;

  // Si no se exige modo estricto y no vienen las cabeceras x-signature / x-timestamp,
  // permitimos que continúe hacia el controlador (donde se evalúa el hash del body o JSON plano)
  if (!config.modoEstrictoHMAC && (!signature || !timestampHeader)) {
    return next();
  }

  // 1. Validar presencia de encabezados requeridos si modo estricto está activo o si vino una firma parcial
  if (!signature || !timestampHeader) {
    res.status(401).json({
      status: 'error',
      statusCode: 401,
      message: 'Firma digital requerida: Faltan las cabeceras x-signature o x-timestamp',
    });
    return;
  }

  // 2. BLINDAJE CONTRA ATAQUES DE REPETICION 
  const timestamp = Number(timestampHeader);
  const ahora = Date.now();

  if (isNaN(timestamp) || Math.abs(ahora - timestamp) > TOLERANCIA_TIMESTAMP_MS) {
    res.status(401).json({
      status: 'error',
      statusCode: 401,
      message: 'Firma digital expirada: La marca de tiempo está fuera de la ventana de tolerancia permitida (5 min)',
    });
    return;
  }

  // 3. CONSTRUCCIÓN DE LA CADENA CANÓNICA PARA VERIFICACIÓN
  const rawPayload = req.rawBody 
    ? req.rawBody.toString('utf8') 
    : JSON.stringify(req.body || {});

  // LA CADENA CANÓNICA INCLUYE EL TIMESTAMP Y EL CUERPO DE LA PETICIÓN
  const dataToVerify = `${timestamp}.${rawPayload}`;
  const secretKey = config.secretoHMAC;

  // 4. CALCULO DE LA FIRMA ESPERADA USANDO HMAC-SHA256
  const expectedSignature = crypto
    .createHmac('sha256', secretKey)
    .update(dataToVerify)
    .digest('hex');

  // 5. COMPARACIÓN SEGURA DE LA FIRMA PROPORCIONADA CON LA FIRMA ESPERADA
  try {
    const signatureBuffer = Buffer.from(signature, 'hex');
    const expectedBuffer = Buffer.from(expectedSignature, 'hex');

    if (
      signatureBuffer.length !== expectedBuffer.length ||
      !crypto.timingSafeEqual(signatureBuffer, expectedBuffer)
    ) {
      res.status(401).json({
        status: 'error',
        statusCode: 401,
        message: 'Firma digital inválida: El contenido de la petición fue manipulado o la clave es incorrecta',
      });
      return;
    }
  } catch (_error) {
    res.status(401).json({
      status: 'error',
      statusCode: 401,
      message: 'Error procesando la firma digital',
    });
    return;
  }

  // 6. SI TODO ES VÁLIDO, SE PERMITE EL PASO
  next();
}
