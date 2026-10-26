// UTILIDAD RECURSIVA PARA SANITIZACIÓN DE DATOS (deepTrim)
// EN ESTA FUNCION SE BUSCA VALIDAR Y LIMPIAR RECURSIVAMENTE LOS DATOS DE OBJETOS Y PETICIONES QUE LLEGUEN
// DE ENTRADA, ELIMINANDO ESPACIOS EN BLANCO

export function deepTrim<T>(value: T, visited = new WeakSet<object>()): T {
  // CASO BASE 1: VALORES PRIMITIVOS (string, number, boolean, null, undefined)
  if (value === null || typeof value !== 'object') {
    if (typeof value === 'string') {
      return value.trim() as unknown as T;
    }
    return value;
  }

  // CASO BASE 2: INSTANCIAS ESPECIALES (Date, RegExp, Buffer)
  // ESTAS INSTANCIAS SON OBJETOS REALES EN MEMORIA, PERO NO DEBEN SER MODIFICADOS, 
  // POR LO QUE SE RETORNAN TAL CUAL
  
  if (value instanceof Date || value instanceof RegExp || Buffer.isBuffer(value)) {
    return value;
  }
  
  // CASO BASE 3: PROTECCIÓN CONTRA REFERENCIAS CIRCULARES
  // SE UTILIZA UN WeakSet PARA RASTREAR OBJETOS YA VISITADOS Y EVITAR BUCLES INFINITOS
  if (visited.has(value as object)) {
    return value;
  }
  visited.add(value as object);

  // PASO RECURSIVO 1: ARRAYS
  // SE LLAMA A SÍ MISMA PARA CADA ELEMENTO DEL ARRAY, MANTENIENDO LA ESTRUCTURA ORIGINAL
  
  if (Array.isArray(value)) {
    return value.map((item) => deepTrim(item, visited)) as unknown as T;
  }
  
  // PASO RECURSIVO 2: OBJETOS
  // SE LLAMA A SÍ MISMA PARA CADA PROPIEDAD DEL OBJETO, MANTENIENDO LA ESTRUCTURA ORIGINAL
  
  const sanitizedObject: Record<string, unknown> = {};
  for (const [key, propValue] of Object.entries(value)) {
    sanitizedObject[key] = deepTrim(propValue, visited);
  }

  return sanitizedObject as T;
}
