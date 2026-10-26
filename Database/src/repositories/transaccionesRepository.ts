import { asc, eq, gt, and } from 'drizzle-orm';
import { db } from '../connection';
import { transacciones } from '../schemas/transacciones';

// EXPORTACION DE TIPOS PARA TRANSACCIONES
export type Transaccion = typeof transacciones.$inferSelect;
export type NewTransaccion = typeof transacciones.$inferInsert;

// DECLARACIÓN DE LA CLASE REPOSITORY PARA TRANSACCIONES
export class TransaccionRepository {

  // BUSQUEDA DE TRANSACCION MEDIANTE ID CON B-TREE INDEX HASTA QUE OBTENGA LOS DATOS DE BASE DE DATOS
  async findById(id: number): Promise<Transaccion | null> {
    const [transaccion] = await db
      .select()
      .from(transacciones)
      .where(eq(transacciones.idTransaccion, id))
      .limit(1);

    return transaccion ?? null;
  }

  // BUSQUEDA DE TRANSACCION MEDIANTE HASH CON B-TREE INDEX DEJANDO UNA PROMESA HASTA QUE OBTENGA LOS DATOS DE BASE DE DATOS
  async findByHash(hash: string): Promise<Transaccion | null> {
    const [transaccion] = await db
      .select()
      .from(transacciones)
      .where(eq(transacciones.hash, hash))
      .limit(1);

    return transaccion ?? null;
  }

  // BUSQUEDA DE TRANSACCIONES POR USUARIO CON B-TREE INDEX DEJANDO UNA PROMESA HASTA QUE OBTENGA LOS DATOS DE BASE DE DATOS
  async findByUsuario(idUsuario: number): Promise<Transaccion[]> {
    return await db
      .select()
      .from(transacciones)
      .where(eq(transacciones.idUsuario, idUsuario));
  }

  // ─── MÉTODO PARA LA VENTANA DESLIZANTE (SLIDING WINDOW) ───────────────────────
  // BUSCA TODAS LAS TRANSACCIONES DE UN USUARIO QUE OCURRIERON DESPUÉS DE "desde"
  // ESTO PERMITE AL SERVICIO CONTAR CUÁNTAS TRANSACCIONES HAY EN LA VENTANA DE TIEMPO
  // Y DETECTAR COMPORTAMIENTOS ANÓMALOS (FRAUDE, ABUSO, ETC.)
  //
  // FLUJO:
  //   1. El servicio calcula `desde = new Date(Date.now() - ventanaMs)`
  //   2. Llama a este método con idUsuario y esa fecha
  //   3. Este método filtra: WHERE id_usuario = ? AND fecha_transaccion > ?
  //   4. El servicio cuenta el resultado y decide si es anomalía
  //
  // EL ÍNDICE idx_transacciones_usuario_fecha EN (id_usuario, fecha_transaccion)
  // HACE QUE ESTE QUERY SEA MUY EFICIENTE (NO HACE FULL TABLE SCAN)
  // ──────────────────────────────────────────────────────────────────────────────
  async findByUsuarioEnVentana(idUsuario: number, desde: Date): Promise<Transaccion[]> {
    return await db
      .select()
      .from(transacciones)
      .where(
        and(
          eq(transacciones.idUsuario, idUsuario),
          gt(transacciones.fechaTransaccion, desde)
        )
      );
  }

  async create(transaccionData: NewTransaccion): Promise<Transaccion> {
    const [newTransaccion] = await db
      .insert(transacciones)
      .values(transaccionData)
      .returning();

    return newTransaccion;
  }

  // ACTUALIZA LOS DATOS DE LA TRANSACCION, TOMANDO SU ID COMO REFERENCIA Y FILTRO, TOMA DATOS DE FORMA PARTIAL
  // PARA DEFINIR QUE CAMPOS SE ACTUALIZAN, Y DEVUELVE LA TRANSACCION ACTUALIZADA O NULL SI NO SE ENCUENTRA
  async update(id: number, data: Partial<NewTransaccion>): Promise<Transaccion | null> {
    const [updatedTransaccion] = await db
      .update(transacciones)
      .set({
        ...data,
        ultActualizacion: new Date(),
      })
      .where(eq(transacciones.idTransaccion, id))
      .returning();

    return updatedTransaccion ?? null;
  }

  // LISTA TRANSACCIONES CON PAGINACIÓN, TOMANDO REGISTROS DE 20 EN 20 Y DEFINIENDO SIEMPRE DESDE DONDE ARRANCAR HASTA CUANTOS TOMAR
  // LA FORMULA LOGICA SE HARA EN BACKEND PARA INDICARLE COMO ES EL TEMA DE PAGINAS POR REGISTROS
  async findPaginated(limit: number = 20, offset: number = 0): Promise<Transaccion[]> {
    return await db
      .select()
      .from(transacciones)
      .orderBy(asc(transacciones.idTransaccion))
      .limit(limit)
      .offset(offset);
  }
}
