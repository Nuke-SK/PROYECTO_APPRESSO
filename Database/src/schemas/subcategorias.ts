// IMPORTS NECESARIOS PARA DEFINIR LOS SCHEMAS/MODELOS DE SUBCATEGORIAS Y HERENCIAS DE CATEGORIAS
import { pgTable, bigint, varchar, text, boolean, timestamp, index } from 'drizzle-orm/pg-core';
import { categoriasPadre } from './categoriasPadre';

export const subcategorias = pgTable(
  'subcategorias',
  {
    idSubcategoria: bigint('id_subcategoria', { mode: 'number' }).primaryKey().generatedAlwaysAsIdentity(),
    idCategoriaPadre: bigint('id_categoria_padre', { mode: 'number' })
      .references(() => categoriasPadre.idCategoriaPadre, { onDelete: 'restrict' })
      .notNull(),
    nombreSubcategoria: varchar('nombre_subcategoria', { length: 100 }).notNull(),
    descripcionSubcategoria: text('descripcion_subcategoria'),
    activo: boolean('activo').default(true).notNull(),
    fechaCreacion: timestamp('fecha_creacion', { withTimezone: true }).defaultNow().notNull(),
    fechaModificacion: timestamp('fecha_modificacion', { withTimezone: true }).defaultNow().notNull()
  },
  (table) => [
    index('idx_subcategorias_padre').on(table.idCategoriaPadre),
  ]
);

export type Subcategoria = typeof subcategorias.$inferSelect;
export type NuevaSubcategoria = typeof subcategorias.$inferInsert;  