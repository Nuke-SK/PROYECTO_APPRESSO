// IMPORTS NECESARIOS PARA DEFINIR LOS SCHEMAS/MODELOS DE PRODUCTOS Y HERENCIAS DE SUBCATEGORIAS
import { pgTable, bigint, varchar, text, numeric, integer, boolean, timestamp, index } from 'drizzle-orm/pg-core';
import { subcategorias } from './subcategorias';

export const productos = pgTable(
  'productos',
  {
    idProducto: bigint('id_producto', { mode: 'number' }).primaryKey().generatedAlwaysAsIdentity(),
    idSubcategoria: bigint('id_subcategoria', { mode: 'number' })
      .references(() => subcategorias.idSubcategoria, { onDelete: 'restrict' })
      .notNull(),
    nombreProducto: varchar('nombre_producto', { length: 120 }).notNull(),
    descripcionProducto: text('descripcion_producto'),
    precioProducto: numeric('precio_producto', { precision: 12, scale: 2 }).notNull(),
    stockProducto: integer('stock_producto').default(0).notNull(),
    activo: boolean('activo').default(true).notNull(),
    fechaCreacion: timestamp('fecha_creacion', { withTimezone: true }).defaultNow().notNull(),
    fechaModificacion: timestamp('fecha_modificacion', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('idx_productos_subcategoria').on(table.idSubcategoria),
  ]
);

export type Producto = typeof productos.$inferSelect;
export type NuevoProducto = typeof productos.$inferInsert;