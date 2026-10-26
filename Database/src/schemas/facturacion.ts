// IMPORTS NECESARIOS PARA DEFINIR LOS SCHEMAS/MODELOS DE FACTURACION Y HERENCIAS DE TRANSACCIONES Y USUARIOS

import { pgTable, bigint, varchar, jsonb, numeric, timestamp, index } from 'drizzle-orm/pg-core';
import { transacciones } from './transacciones';
import { usuarios } from './usuarios';

export const facturacion = pgTable(
  'facturacion',
  {
    idFactura: bigint('id_factura', { mode: 'number' })
      .primaryKey()
      .generatedAlwaysAsIdentity(),
    idTransaccion: bigint('id_transaccion', { mode: 'number' })
      .references(() => transacciones.idTransaccion, { onDelete: 'restrict' })
      .notNull()
      .unique(),
    idUsuario: bigint('id_usuario', { mode: 'number' })
      .references(() => usuarios.idUsuario, { onDelete: 'restrict' })
      .notNull(),
    numeroFactura: varchar('numero_factura', { length: 50 }).notNull().unique(),
    subtotal: numeric('subtotal', { precision: 12, scale: 2 }).notNull(),
    impuesto: numeric('impuesto', { precision: 12, scale: 2 }).default('0.00').notNull(),
    total: numeric('total', { precision: 12, scale: 2 }).notNull(),
    detalles: jsonb('detalles').notNull(),
    estado: varchar('estado', { length: 20 }).default('PENDIENTE').notNull(),
    fechaEmision: timestamp('fecha_emision', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('idx_facturacion_transaccion').on(table.idTransaccion),
    index('idx_facturacion_usuario').on(table.idUsuario),
    index('idx_facturacion_fecha').on(table.fechaEmision),
  ]
);

export type Factura = typeof facturacion.$inferSelect;
export type NuevaFactura = typeof facturacion.$inferInsert;