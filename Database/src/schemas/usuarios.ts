// IMPORTS NECESARIOS PARA DEFINIR LOS SCHEMAS/MODELOS DE USUARIOS
import { pgTable, bigint, varchar, boolean, timestamp } from 'drizzle-orm/pg-core';

export const usuarios = pgTable(
  'usuarios',
  {
    idUsuario: bigint('id_usuario', { mode: 'number' }).primaryKey().generatedAlwaysAsIdentity(),
    nombreUsuario: varchar('nombre_usuario', { length: 100 }).notNull(),
    emailUsuario:  varchar('email_usuario', { length: 100 }).notNull().unique(),
    activo: boolean('activo').default(true).notNull(),
    fechaCreacion: timestamp('fecha_creacion', { withTimezone: true }).defaultNow().notNull(),
    ultActualizacion: timestamp('ult_actualizacion', { withTimezone: true }).defaultNow().notNull(),
  },
);

export type Usuario = typeof usuarios.$inferSelect;
export type NuevoUsuario = typeof usuarios.$inferInsert;