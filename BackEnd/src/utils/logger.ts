import pino from 'pino';
import pretty from 'pino-pretty';
import fs from 'fs';
import path from 'path';

// RUTA DEL ARCHIVO app.log EN LA RAÍZ DEL PROYECTO
const logFilePath = path.resolve(process.cwd(), 'app.log');

// STREAM PARA CONSOLA CON FORMATO LEGIBLE Y COLORES
const prettyStream = pretty({
  colorize: true,
  translateTime: 'SYS:yyyy-mm-dd HH:MM:ss',
  ignore: 'pid,hostname',
});

// STREAM PARA EL ARCHIVO PERSISTENTE app.log
const fileStream = fs.createWriteStream(logFilePath, { flags: 'a' });

export const logger = pino(
  {
    level: process.env.LOG_LEVEL || 'debug',
    base: {
      service: 'APPRESSO-API',
    },
    timestamp: pino.stdTimeFunctions.isoTime,
  },
  pino.multistream([
    { stream: prettyStream },
    { stream: fileStream },
  ])
);

// OBTENER LOGGER HIJO CON CONTEXTO ESPECÍFICO
export const getContextLogger = (context: string) => logger.child({ context });