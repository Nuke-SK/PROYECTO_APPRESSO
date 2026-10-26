import { asc, eq } from "drizzle-orm";
import { db } from "../connection";
import { anomaliasTransacciones } from "../schemas/anomaliasTransacciones";

// EXPORTACION DE TIPOS PARA ANOMALIAS DE TRANSACCIONES
export type AnomaliaTransaccion = typeof anomaliasTransacciones.$inferSelect;
export type NewAnomaliaTransaccion = typeof anomaliasTransacciones.$inferInsert;

// DECLARACIÓN DE LA CLASE REPOSITORY PARA ANOMALIAS DE TRANSACCIONES
export class AnomaliaTransaccionRepository {

  // BUSQUEDA DE ANOMALIA MEDIANTE ID CON B-TREE INDEX HASTA QUE OBTENGA LOS DATOS DE BASE DE DATOS
  async findById(id: number): Promise<AnomaliaTransaccion | null> {
    const [anomalia] = await db
      .select()
      .from(anomaliasTransacciones)
      .where(eq(anomaliasTransacciones.idAnomalia, id))
      .limit(1);

    return anomalia ?? null;
  }

  // BUSQUEDA DE ANOMALIAS POR TRANSACCION CON B-TREE INDEX DEJANDO UNA PROMESA HASTA QUE OBTENGA LOS DATOS DE BASE DE DATOS
  async findByTransaccion(idTransaccion: number): Promise<AnomaliaTransaccion[]> {
    return await db
      .select()
      .from(anomaliasTransacciones)
      .where(eq(anomaliasTransacciones.idTransaccion, idTransaccion));
  }

  // BUSQUEDA DE ANOMALIAS POR TIPO CON B-TREE INDEX DEJANDO UNA PROMESA HASTA QUE OBTENGA LOS DATOS DE BASE DE DATOS
  async findByTipo(tipoAnomalia: string): Promise<AnomaliaTransaccion[]> {
    return await db
      .select()
      .from(anomaliasTransacciones)
      .where(eq(anomaliasTransacciones.tipoAnomalia, tipoAnomalia));
  }

  async create(anomaliaData: NewAnomaliaTransaccion): Promise<AnomaliaTransaccion> {
    const [newAnomalia] = await db
      .insert(anomaliasTransacciones)
      .values(anomaliaData)
      .returning();

    return newAnomalia;
  }

  // LISTA ANOMALIAS CON PAGINACIÓN, TOMANDO REGISTROS DE 20 EN 20 Y DEFINIENDO SIEMPRE DESDE DONDE ARRANCAR HASTA CUANTOS TOMAR
  // LA FORMULA LOGICA SE HARA EN BACKEND PARA INDICARLE COMO ES EL TEMA DE PAGINAS POR REGISTROS
  async findPaginated(limit: number = 20, offset: number = 0): Promise<AnomaliaTransaccion[]> {
    return await db
      .select()
      .from(anomaliasTransacciones)
      .orderBy(asc(anomaliasTransacciones.idAnomalia))
      .limit(limit)
      .offset(offset);
  }
}
