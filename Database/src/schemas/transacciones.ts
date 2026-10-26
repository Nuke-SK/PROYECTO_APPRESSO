// IMPORTS NECESARIOS PARA DEFINIR LOS SCHEMAS/MODELOS DE TRANSACCIONES Y HERENCIAS DE USUARIOS
import { pgTable, bigint, varchar, numeric, timestamp, index } from 'drizzle-orm/pg-core';
import { usuarios } from './usuarios';

export const transacciones = pgTable(
  'transacciones',
  {
    idTransaccion: bigint('id_transaccion', { mode: 'number' }).primaryKey().generatedAlwaysAsIdentity(), 
    idUsuario: bigint('id_usuario', { mode: 'number' })
      .references(() => usuarios.idUsuario, { onDelete: 'restrict' })
      .notNull(),
    valorTransaccion: numeric('valor_transaccion', { precision: 12, scale: 2 }).notNull(),
    fechaTransaccion: timestamp('fecha_transaccion', { withTimezone: true }).defaultNow().notNull(),
    estado: varchar('estado', { length: 20 }).notNull().default('PENDIENTE'),
    hash: varchar('hash', { length: 255 }).notNull(),
    metodoPago: varchar('metodo_pago', { length: 20 }).notNull(),
    fechaCreacion: timestamp('fecha_creacion', { withTimezone: true }).defaultNow().notNull(),
    ultActualizacion: timestamp('ult_actualizacion', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('idx_transacciones_usuario_fecha').on(table.idUsuario, table.fechaTransaccion),
    index('idx_transacciones_hash').on(table.hash),
  ]
);

export type Transaccion = typeof transacciones.$inferSelect;
export type NuevaTransaccion = typeof transacciones.$inferInsert;