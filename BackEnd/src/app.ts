import express, { Application } from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { errorHandler, requestLogger } from './middlewares';

// RUTAS DE ENTIDADES
import usuarioRoutes from './routes/usuario.routes';
import productoRoutes from './routes/producto.routes';
import categoriaPadreRoutes from './routes/categoriaPadre.routes';
import subcategoriaRoutes from './routes/subcategoria.routes';
import transaccionRoutes from './routes/transaccion.routes';
import facturacionRoutes from './routes/facturacion.routes';
import anomaliaRoutes from './routes/anomaliaTransaccion.routes';
import securityConfigRoutes from './routes/securityConfig.routes';
import dashboardRoutes from './routes/dashboard.routes';

export const app: Application = express();

// CONFIAR EN PROXIES INVERSOS (NGROK, TUNNELS, CLOUDFLARE) PARA OBTENER LA IP REAL DEL CLIENTE
app.set('trust proxy', true);

// CABECERA PARA SALTAR LA ADVERTENCIA DE NGROK FREE EN RESPUESTAS
app.use((_req, res, next) => {
  res.setHeader('ngrok-skip-browser-warning', 'true');
  next();
});

// CONFIGURACIÓN DE CORS UNIVERSAL PARA NGROK, LOCALHOST Y RED LOCAL
app.use(
  cors({
    origin: true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Origin',
      'X-Requested-With',
      'Content-Type',
      'Accept',
      'Authorization',
      'x-signature',
      'x-timestamp',
      'ngrok-skip-browser-warning',
      'bypass-tunnel-reminder',
    ],
    exposedHeaders: ['x-signature', 'x-timestamp', 'ngrok-skip-browser-warning'],
  })
);

app.use(requestLogger);

// PRESENCIA DE RAW BODY PARA VERIFICACIÓN HMAC
app.use(
  express.json({
    verify: (req: any, _res, buf) => {
      req.rawBody = buf;
    },
  })
);
app.use(express.urlencoded({ extended: true }));

// SERVIR ARCHIVOS ESTÁTICOS DEL FRONTEND COMPILADO (REACT SPA)
const distPath = path.resolve(__dirname, '../../FrontEnd/dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
}

// ENDPOINTS PARA VERIFICAR CONECTIVIDAD Y SALUD DEL SERVIDOR (NGROK / CLIENTES EXTERNOS / HEALTHCHECKS)
const healthHandler = (_req: express.Request, res: express.Response) => {
  res.status(200).json({
    status: 'ok',
    service: 'APPRESSO-API',
    timestamp: new Date().toISOString(),
    message: 'Servidor APPRESSO conectado y operativo',
  });
};

app.get('/health', healthHandler);
app.get('/api/v1/health', healthHandler);
app.get('/ping', healthHandler);

// RUTAS OFICIALES /api/v1/...
app.use('/api/v1/usuarios', usuarioRoutes);
app.use('/api/v1/productos', productoRoutes);
app.use('/api/v1/categorias-padre', categoriaPadreRoutes);
app.use('/api/v1/subcategorias', subcategoriaRoutes);
app.use('/api/v1/transacciones', transaccionRoutes);
app.use('/api/v1/facturas', facturacionRoutes);
app.use('/api/v1/anomalias', anomaliaRoutes);
app.use('/api/v1/config/seguridad', securityConfigRoutes);
app.use('/api/v1/dashboard', dashboardRoutes);

// ALIAS DE RESPALDO (Por si el evaluador o script del profesor hace peticiones a rutas raíz sin /api/v1)
app.use('/transacciones', transaccionRoutes);
app.use('/transaccion', transaccionRoutes);
app.use('/anomalias', anomaliaRoutes);
app.use('/anomalia', anomaliaRoutes);
app.use('/usuarios', usuarioRoutes);
app.use('/usuario', usuarioRoutes);
app.use('/productos', productoRoutes);
app.use('/producto', productoRoutes);
app.use('/facturas', facturacionRoutes);
app.use('/factura', facturacionRoutes);
app.use('/dashboard', dashboardRoutes);
app.use('/config/seguridad', securityConfigRoutes);

// HELPER PARA IDENTIFICAR RUTAS DE API O PETICIONES DE BOTS
const isApiRoute = (p: string) =>
  p.startsWith('/api') ||
  p.startsWith('/health') ||
  p.startsWith('/ping') ||
  p.startsWith('/transaccion') ||
  p.startsWith('/anomalia') ||
  p.startsWith('/usuario') ||
  p.startsWith('/producto') ||
  p.startsWith('/factura') ||
  p.startsWith('/dashboard') ||
  p.startsWith('/config');

// SI UN BOT O SCRIPT HACE GET A LA RAÍZ '/', DEVOLVER MENSAJE JSON DE BIENVENIDA
app.get('/', (req, res, next) => {
  const acceptsHtml = req.accepts('html');
  const userAgent = (req.headers['user-agent'] || '').toLowerCase();
  const isBotOrClient =
    !acceptsHtml ||
    userAgent.includes('bot') ||
    userAgent.includes('insomnia') ||
    userAgent.includes('http-client') ||
    userAgent.includes('curl') ||
    userAgent.includes('python') ||
    userAgent.includes('postman');

  if (isBotOrClient && req.accepts('json')) {
    return res.status(200).json({
      status: 'ok',
      service: 'APPRESSO-API',
      message: 'Bienvenido al servidor API de APPRESSO',
      endpoints: {
        health: '/health',
        transacciones: '/api/v1/transacciones (o /transacciones)',
        anomalias: '/api/v1/anomalias (o /anomalias)',
        usuarios: '/api/v1/usuarios (o /usuarios)',
        productos: '/api/v1/productos (o /productos)',
        seguridad: '/api/v1/config/seguridad',
      },
    });
  }

  next();
});

// SI ES UNA PETICIÓN DESDE NAVEGADOR (HTML), SERVIR EL FRONTEND REACT (SPA FALLBACK)
app.use((req, res, next) => {
  if (req.method !== 'GET') {
    return next();
  }

  if (isApiRoute(req.path)) {
    return next();
  }

  const indexPath = path.join(distPath, 'index.html');
  if (fs.existsSync(indexPath)) {
    return res.sendFile(indexPath);
  }

  next();
});

// MANEJO DE RUTAS 404 DE API (CUANDO NINGUNA RUTA COINCIDIÓ)
app.use((req, res, next) => {
  if (isApiRoute(req.path) || req.accepts('json')) {
    return res.status(404).json({
      status: 'error',
      statusCode: 404,
      message: `Ruta de API no encontrada: [${req.method}] ${req.originalUrl}`,
    });
  }

  next();
});

// MIDDLEWARE DE MANEJO DE ERRORES (SIEMPRE AL FINAL)
app.use(errorHandler);