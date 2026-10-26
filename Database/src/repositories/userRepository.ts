import { asc, eq } from "drizzle-orm";
import { db } from "../connection";
import { usuarios } from "../schemas/usuarios";

// EXPORTACION DE TIPOS PARA USUARIOS 
export type Usuario = typeof usuarios.$inferSelect;
export type NewUsuario = typeof usuarios.$inferInsert;

// DECLARACIÓN DE LA CLASE REPOSITORY PARA USUARIOS
export class UsuarioRepository {
    
// BUSQUEDA DE USUARIO MEDIANTE ID CON B-TREE INDEX HASTA QUE OBTENGA LOS DATOS DE BASE DE DATOS
  async findById(id: number): Promise<Usuario | null> {
    const [user] = await db
      .select()
      .from(usuarios)
      .where(eq(usuarios.idUsuario, id))
      .limit(1);

    return user ?? null;
  }

  // BUSQUEDA DE USUARIO MEDIANTE EMAIL CON B-TREE INDEX DEJANDO UNA PROMESA HASTA QUE OBTENGA LOS DATOS DE BASE DE DATOS
  async findByEmail(email: string): Promise<Usuario | null> {
    const [user] = await db
      .select()
      .from(usuarios)
      .where(eq(usuarios.emailUsuario, email))
      .limit(1);

    return user ?? null;
  }

  async create(userData: NewUsuario): Promise<Usuario> {
    const [newUser] = await db
      .insert(usuarios)
      .values(userData)
      .returning();

    return newUser;
  }

  // ACTUALIZA LOS DATOS DEL USUARIO, TOMANDO SU ID COMO REFERENCIA Y FILTRO, TOMA DATOS DE FORMA PARTIAL 
  // PARA DEFINIR QUE CAMPOS SE ACTUALIZAN, Y DEVUELVE EL USUARIO ACTUALIZADO O NULL SI NO SE ENCUENTRA
  async update(id: number, data: Partial<NewUsuario>): Promise<Usuario | null> {
    const [updatedUser] = await db
      .update(usuarios)
      .set({
        ...data,
        ultActualizacion: new Date(), 
      })
      .where(eq(usuarios.idUsuario, id))
      .returning();

    return updatedUser ?? null;
  }

  // LISTA USUARIOS CON PAGINACIÓN, TOMANDO REGISTROS DE 20 EN 20 Y DEFINIENDO SIEMPRE DESDE DONDE ARRANCAR HASTA CUANTOS TOMAR
  // LA FORMULA LOGICA SE HARA EN BACKEND PARA INDICARLE COMO ES EL TEMA DE PAGINAS POR REGISTROS
  async findPaginated(limit: number = 20, offset: number = 0): Promise<Usuario[]> {
    return await db
      .select()
      .from(usuarios)
      .orderBy(asc(usuarios.idUsuario))
      .limit(limit)
      .offset(offset);
  }
}