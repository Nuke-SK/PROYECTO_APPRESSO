// IMPORTS NECESARIOS PARA DEFINIR LOS SCHEMAS/MODELOS DE ANOMALIAS DE TRANSACCIONES
import { pgTable, bigint, varchar, jsonb, integer, timestamp, index } from 'drizzle-orm/pg-core';
import { transacciones } from './transacciones';

export const anomaliasTransacciones = pgTable(
  'anomalias_transacciones',
  {
    idAnomalia: bigint('id_anomalia', { mode: 'number' })
      .primaryKey()
      .generatedAlwaysAsIdentity(),
    idTransaccion: bigint('id_transaccion', { mode: 'number' })
      .references(() => transacciones.idTransaccion, { onDelete: 'cascade' })
      .notNull(),
    tipoAnomalia: varchar('tipo_anomalia', { length: 50 }).notNull(),
    nivelRiesgo: varchar('nivel_riesgo', { length: 20 }).default('CRITICO').notNull(),
    cantidadTransacciones: integer('cantidad_transacciones').notNull(),
    ventanaSegundos: integer('ventana_segundos').notNull(),
    transaccionesInvolucradas: jsonb('transacciones_involucradas').notNull(),
    fechaCreacion: timestamp('fecha_creacion', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('idx_anomalias_transaccion').on(table.idTransaccion),
    index('idx_anomalias_tipo').on(table.tipoAnomalia),
    index('idx_anomalias_fecha').on(table.fechaCreacion),
  ]
);

export type AnomaliaTransaccion = typeof anomaliasTransacciones.$inferSelect;
export type NuevaAnomaliaTransaccion = typeof anomaliasTransacciones.$inferInsert;