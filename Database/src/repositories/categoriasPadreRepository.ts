import { asc, eq } from "drizzle-orm";
import { db } from "../connection";
import { categoriasPadre } from "../schemas/categoriasPadre";

// EXPORTACION DE TIPOS PARA CATEGORIAS PADRE
export type CategoriaPadre = typeof categoriasPadre.$inferSelect;
export type NewCategoriaPadre = typeof categoriasPadre.$inferInsert;

// DECLARACIÓN DE LA CLASE REPOSITORY PARA CATEGORIAS PADRE
export class CategoriaPadreRepository {

  // BUSQUEDA DE CATEGORIA MEDIANTE ID CON B-TREE INDEX HASTA QUE OBTENGA LOS DATOS DE BASE DE DATOS
  async findById(id: number): Promise<CategoriaPadre | null> {
    const [categoria] = await db
      .select()
      .from(categoriasPadre)
      .where(eq(categoriasPadre.idCategoriaPadre, id))
      .limit(1);

    return categoria ?? null;
  }

  // BUSQUEDA DE CATEGORIA MEDIANTE NOMBRE CON B-TREE INDEX DEJANDO UNA PROMESA HASTA QUE OBTENGA LOS DATOS DE BASE DE DATOS
  async findByNombre(nombre: string): Promise<CategoriaPadre | null> {
    const [categoria] = await db
      .select()
      .from(categoriasPadre)
      .where(eq(categoriasPadre.nombreCategoria, nombre))
      .limit(1);

    return categoria ?? null;
  }

  async create(categoriaData: NewCategoriaPadre): Promise<CategoriaPadre> {
    const [newCategoria] = await db
      .insert(categoriasPadre)
      .values(categoriaData)
      .returning();

    return newCategoria;
  }

  // ACTUALIZA LOS DATOS DE LA CATEGORIA, TOMANDO SU ID COMO REFERENCIA Y FILTRO, TOMA DATOS DE FORMA PARTIAL
  // PARA DEFINIR QUE CAMPOS SE ACTUALIZAN, Y DEVUELVE LA CATEGORIA ACTUALIZADA O NULL SI NO SE ENCUENTRA
  async update(id: number, data: Partial<NewCategoriaPadre>): Promise<CategoriaPadre | null> {
    const [updatedCategoria] = await db
      .update(categoriasPadre)
      .set({
        ...data,
        fechaModificacion: new Date(),
      })
      .where(eq(categoriasPadre.idCategoriaPadre, id))
      .returning();

    return updatedCategoria ?? null;
  }

  // LISTA CATEGORIAS CON PAGINACIÓN, TOMANDO REGISTROS DE 20 EN 20 Y DEFINIENDO SIEMPRE DESDE DONDE ARRANCAR HASTA CUANTOS TOMAR
  // LA FORMULA LOGICA SE HARA EN BACKEND PARA INDICARLE COMO ES EL TEMA DE PAGINAS POR REGISTROS
  async findPaginated(limit: number = 20, offset: number = 0): Promise<CategoriaPadre[]> {
    return await db
      .select()
      .from(categoriasPadre)
      .orderBy(asc(categoriasPadre.idCategoriaPadre))
      .limit(limit)
      .offset(offset);
  }
}
