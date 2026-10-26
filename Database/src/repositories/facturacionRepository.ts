import { asc, eq } from "drizzle-orm";
import { db } from "../connection";
import { facturacion } from "../schemas/facturacion";

// EXPORTACION DE TIPOS PARA FACTURACION
export type Factura = typeof facturacion.$inferSelect;
export type NewFactura = typeof facturacion.$inferInsert;

// DECLARACIÓN DE LA CLASE REPOSITORY PARA FACTURACION
export class FacturacionRepository {

  // BUSQUEDA DE FACTURA MEDIANTE ID CON B-TREE INDEX HASTA QUE OBTENGA LOS DATOS DE BASE DE DATOS
  async findById(id: number): Promise<Factura | null> {
    const [factura] = await db
      .select()
      .from(facturacion)
      .where(eq(facturacion.idFactura, id))
      .limit(1);

    return factura ?? null;
  }

  // BUSQUEDA DE FACTURA MEDIANTE NUMERO DE FACTURA CON B-TREE INDEX DEJANDO UNA PROMESA HASTA QUE OBTENGA LOS DATOS DE BASE DE DATOS
  async findByNumeroFactura(numeroFactura: string): Promise<Factura | null> {
    const [factura] = await db
      .select()
      .from(facturacion)
      .where(eq(facturacion.numeroFactura, numeroFactura))
      .limit(1);

    return factura ?? null;
  }

  // BUSQUEDA DE FACTURAS POR USUARIO CON B-TREE INDEX DEJANDO UNA PROMESA HASTA QUE OBTENGA LOS DATOS DE BASE DE DATOS
  async findByUsuario(idUsuario: number): Promise<Factura[]> {
    return await db
      .select()
      .from(facturacion)
      .where(eq(facturacion.idUsuario, idUsuario));
  }

  // BUSQUEDA DE FACTURA MEDIANTE ID DE TRANSACCION CON B-TREE INDEX DEJANDO UNA PROMESA HASTA QUE OBTENGA LOS DATOS DE BASE DE DATOS
  async findByTransaccion(idTransaccion: number): Promise<Factura | null> {
    const [factura] = await db
      .select()
      .from(facturacion)
      .where(eq(facturacion.idTransaccion, idTransaccion))
      .limit(1);

    return factura ?? null;
  }

  async create(facturaData: NewFactura): Promise<Factura> {
    const [newFactura] = await db
      .insert(facturacion)
      .values(facturaData)
      .returning();

    return newFactura;
  }

  // ACTUALIZA LOS DATOS DE LA FACTURA, TOMANDO SU ID COMO REFERENCIA Y FILTRO, TOMA DATOS DE FORMA PARTIAL
  // PARA DEFINIR QUE CAMPOS SE ACTUALIZAN, Y DEVUELVE LA FACTURA ACTUALIZADA O NULL SI NO SE ENCUENTRA
  async update(id: number, data: Partial<NewFactura>): Promise<Factura | null> {
    const [updatedFactura] = await db
      .update(facturacion)
      .set({
        ...data,
      })
      .where(eq(facturacion.idFactura, id))
      .returning();

    return updatedFactura ?? null;
  }

  // LISTA FACTURAS CON PAGINACIÓN, TOMANDO REGISTROS DE 20 EN 20 Y DEFINIENDO SIEMPRE DESDE DONDE ARRANCAR HASTA CUANTOS TOMAR
  // LA FORMULA LOGICA SE HARA EN BACKEND PARA INDICARLE COMO ES EL TEMA DE PAGINAS POR REGISTROS
  async findPaginated(limit: number = 20, offset: number = 0): Promise<Factura[]> {
    return await db
      .select()
      .from(facturacion)
      .orderBy(asc(facturacion.idFactura))
      .limit(limit)
      .offset(offset);
  }
}
