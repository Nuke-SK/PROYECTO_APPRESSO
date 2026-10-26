import { asc, eq } from "drizzle-orm";
import { db } from "../connection";
import { subcategorias } from "../schemas/subcategorias";

// EXPORTACION DE TIPOS PARA SUBCATEGORIAS
export type Subcategoria = typeof subcategorias.$inferSelect;
export type NewSubcategoria = typeof subcategorias.$inferInsert;

// DECLARACIÓN DE LA CLASE REPOSITORY PARA SUBCATEGORIAS
export class SubcategoriaRepository {

  // BUSQUEDA DE SUBCATEGORIA MEDIANTE ID CON B-TREE INDEX HASTA QUE OBTENGA LOS DATOS DE BASE DE DATOS
  async findById(id: number): Promise<Subcategoria | null> {
    const [subcategoria] = await db
      .select()
      .from(subcategorias)
      .where(eq(subcategorias.idSubcategoria, id))
      .limit(1);

    return subcategoria ?? null;
  }

  // BUSQUEDA DE SUBCATEGORIAS POR CATEGORIA PADRE CON B-TREE INDEX DEJANDO UNA PROMESA HASTA QUE OBTENGA LOS DATOS DE BASE DE DATOS
  async findByCategoriaPadre(idCategoriaPadre: number): Promise<Subcategoria[]> {
    return await db
      .select()
      .from(subcategorias)
      .where(eq(subcategorias.idCategoriaPadre, idCategoriaPadre));
  }

  async create(subcategoriaData: NewSubcategoria): Promise<Subcategoria> {
    const [newSubcategoria] = await db
      .insert(subcategorias)
      .values(subcategoriaData)
      .returning();

    return newSubcategoria;
  }

  // ACTUALIZA LOS DATOS DE LA SUBCATEGORIA, TOMANDO SU ID COMO REFERENCIA Y FILTRO, TOMA DATOS DE FORMA PARTIAL
  // PARA DEFINIR QUE CAMPOS SE ACTUALIZAN, Y DEVUELVE LA SUBCATEGORIA ACTUALIZADA O NULL SI NO SE ENCUENTRA
  async update(id: number, data: Partial<NewSubcategoria>): Promise<Subcategoria | null> {
    const [updatedSubcategoria] = await db
      .update(subcategorias)
      .set({
        ...data,
        fechaModificacion: new Date(),
      })
      .where(eq(subcategorias.idSubcategoria, id))
      .returning();

    return updatedSubcategoria ?? null;
  }

  // LISTA SUBCATEGORIAS CON PAGINACIÓN, TOMANDO REGISTROS DE 20 EN 20 Y DEFINIENDO SIEMPRE DESDE DONDE ARRANCAR HASTA CUANTOS TOMAR
  // LA FORMULA LOGICA SE HARA EN BACKEND PARA INDICARLE COMO ES EL TEMA DE PAGINAS POR REGISTROS
  async findPaginated(limit: number = 20, offset: number = 0): Promise<Subcategoria[]> {
    return await db
      .select()
      .from(subcategorias)
      .orderBy(asc(subcategorias.idSubcategoria))
      .limit(limit)
      .offset(offset);
  }
}
