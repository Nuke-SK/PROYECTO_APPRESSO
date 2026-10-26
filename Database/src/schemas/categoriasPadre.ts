// IMPORTS NECESARIOS PARA DEFINIR LOS SCHEMAS/MODELOS DE CATEGORIAS PADRE
import { pgTable, bigint, varchar, text, boolean, timestamp } from 'drizzle-orm/pg-core';

export const categoriasPadre = pgTable(
  'categorias_padre',
  {
    idCategoriaPadre: bigint('id_categoria_padre', { mode: 'number' }).primaryKey().generatedAlwaysAsIdentity(),
    nombreCategoria: varchar('nombre_categoria', { length: 100 }).notNull().unique(),
    descripcionCategoria: text('descripcion_categoria'),
    activo: boolean('activo').default(true).notNull(),
    fechaCreacion: timestamp('fecha_creacion', { withTimezone: true }).defaultNow().notNull(),
    fechaModificacion: timestamp('fecha_modificacion', { withTimezone: true }).defaultNow().notNull(),
  },
);

export type CategoriaPadre = typeof categoriasPadre.$inferSelect;
export type NuevaCategoriaPadre = typeof categoriasPadre.$inferInsert;