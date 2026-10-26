// INDEXADO DE ELEMENTOS DEFINIDOS EN LA CARPETA "DATABASE" PARA SU USO EN OTRAS PARTES DEL PROYECTO

export * from './schemas';

// CLASES REPOSITORY (EXPORTACIÓN EXPLÍCITA PARA EVITAR COLISIÓN DE TIPOS CON SCHEMAS)
export {
  UsuarioRepository,
  ProductoRepository,
  TransaccionRepository,
  FacturacionRepository,
  CategoriaPadreRepository,
  SubcategoriaRepository,
  AnomaliaTransaccionRepository,
} from './repositories';

// TIPOS DE ENTIDAD (INFERIDOS DESDE DRIZZLE) — USADOS POR LOS SERVICIOS DEL BACKEND
export type { Usuario } from './repositories/userRepository';
export type { Producto } from './repositories/productosRepository';
export type { Transaccion } from './repositories/transaccionesRepository';
export type { Factura } from './repositories/facturacionRepository';
export type { CategoriaPadre } from './repositories/categoriasPadreRepository';
export type { Subcategoria } from './repositories/subcategoriasRepository';
export type { AnomaliaTransaccion } from './repositories/anomaliasTransaccionesRepository';

export * from './connection';