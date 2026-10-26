import { asc, eq } from "drizzle-orm";
import { db } from "../connection";
import { productos } from "../schemas/productos";

// EXPORTACION DE TIPOS PARA PRODUCTOS
export type Producto = typeof productos.$inferSelect;
export type NewProducto = typeof productos.$inferInsert;

// DECLARACIÓN DE LA CLASE REPOSITORY PARA PRODUCTOS
export class ProductoRepository {

  // BUSQUEDA DE PRODUCTO MEDIANTE ID CON B-TREE INDEX HASTA QUE OBTENGA LOS DATOS DE BASE DE DATOS
  async findById(id: number): Promise<Producto | null> {
    const [producto] = await db
      .select()
      .from(productos)
      .where(eq(productos.idProducto, id))
      .limit(1);

    return producto ?? null;
  }

  // BUSQUEDA DE PRODUCTO MEDIANTE NOMBRE CON B-TREE INDEX HASTA QUE OBTENGA LOS DATOS DE BASE DE DATOS
  async findByNombre(nombre: string): Promise<Producto | null> {
    const [producto] = await db
      .select()
      .from(productos)
      .where(eq(productos.nombreProducto, nombre))
      .limit(1);

    return producto ?? null;
  }

  // BUSQUEDA DE PRODUCTOS POR SUBCATEGORIA CON B-TREE INDEX DEJANDO UNA PROMESA HASTA QUE OBTENGA LOS DATOS DE BASE DE DATOS
  async findBySubcategoria(idSubcategoria: number): Promise<Producto[]> {
    return await db
      .select()
      .from(productos)
      .where(eq(productos.idSubcategoria, idSubcategoria));
  }

  async create(productoData: NewProducto): Promise<Producto> {
    const [newProducto] = await db
      .insert(productos)
      .values(productoData)
      .returning();

    return newProducto;
  }

  // ACTUALIZA LOS DATOS DEL PRODUCTO, TOMANDO SU ID COMO REFERENCIA Y FILTRO, TOMA DATOS DE FORMA PARTIAL
  // PARA DEFINIR QUE CAMPOS SE ACTUALIZAN, Y DEVUELVE EL PRODUCTO ACTUALIZADO O NULL SI NO SE ENCUENTRA
  async update(id: number, data: Partial<NewProducto>): Promise<Producto | null> {
    const [updatedProducto] = await db
      .update(productos)
      .set({
        ...data,
        fechaModificacion: new Date(),
      })
      .where(eq(productos.idProducto, id))
      .returning();

    return updatedProducto ?? null;
  }

  // LISTA PRODUCTOS CON PAGINACIÓN, TOMANDO REGISTROS DE 20 EN 20 Y DEFINIENDO SIEMPRE DESDE DONDE ARRANCAR HASTA CUANTOS TOMAR
  // LA FORMULA LOGICA SE HARA EN BACKEND PARA INDICARLE COMO ES EL TEMA DE PAGINAS POR REGISTROS
  async findPaginated(limit: number = 20, offset: number = 0): Promise<Producto[]> {
    return await db
      .select()
      .from(productos)
      .orderBy(asc(productos.idProducto))
      .limit(limit)
      .offset(offset);
  }
}
