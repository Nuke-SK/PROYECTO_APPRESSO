import { describe, it, expect } from 'vitest';
import {
  CreateUsuarioSchema,
  UpdateUsuarioSchema,
  UsuarioIdParamSchema,
  CreateProductoSchema,
  UpdateProductoSchema,
  CreateCategoriaPadreSchema,
  UpdateCategoriaPadreSchema,
  CreateSubcategoriaSchema,
  CreateFacturaSchema,
  UpdateFacturaSchema,
  UpdateSecurityConfigSchema,
  CreateTransaccionSchema,
} from '../src/dtos';
import { deepTrim } from '../src/utils/recursion.util';

describe('Usuario', () => {
  it('normaliza nombre y email (formato fijo)', () => {
    const r = CreateUsuarioSchema.parse({ nombre: '  Juan    Perez ', email: '  JUAN@Mail.COM ' });
    expect(r).toEqual({ nombre: 'Juan Perez', email: 'juan@mail.com', activo: true });
  });
  it('rechaza email inválido, campos extra y tipos erróneos', () => {
    expect(CreateUsuarioSchema.safeParse({ nombre: 'Ana', email: 'nope' }).success).toBe(false);
    expect(CreateUsuarioSchema.safeParse({ nombre: 'Ana', email: 'a@b.co', rol: 'admin' }).success).toBe(false);
    expect(CreateUsuarioSchema.safeParse({ nombre: 123, email: 'a@b.co' }).success).toBe(false);
    expect(CreateUsuarioSchema.safeParse({ nombre: 'A\u0000na', email: 'a@b.co' }).success).toBe(false);
  });
  it('PATCH no inyecta activo=true por defecto y exige algún campo', () => {
    expect(UpdateUsuarioSchema.parse({ nombre: 'Luis' })).toEqual({ nombre: 'Luis' });
    expect(UpdateUsuarioSchema.safeParse({}).success).toBe(false);
  });
  it('ID de ruta solo acepta dígitos', () => {
    expect(UsuarioIdParamSchema.parse({ id: '12' })).toEqual({ id: 12 });
    for (const id of ['abc', '1e3', '-1', '0', '1.5', '', ' ', '12abc'])
      expect(UsuarioIdParamSchema.safeParse({ id }).success).toBe(false);
  });
});

describe('Producto', () => {
  const base = { idSubcategoria: 1, nombre: 'Café', precio: 5000, stock: 10 };
  it('acepta números y cadenas numéricas de formularios HTML', () => {
    const r = CreateProductoSchema.parse({ ...base, idSubcategoria: '2', precio: '5000.50', stock: '3', activo: 'false' });
    expect(r).toMatchObject({ idSubcategoria: 2, precio: 5000.5, stock: 3, activo: false });
  });
  it('rechaza valores malformados', () => {
    for (const bad of [
      { precio: '12abc' }, { precio: '' }, { precio: -1 }, { precio: 0 }, { precio: 1.234 },
      { precio: 'Infinity' }, { precio: NaN }, { precio: '1e3' },
      { stock: -1 }, { stock: 1.5 }, { stock: null }, { idSubcategoria: 0 },
      { nombre: 'a' }, { nombre: 'x'.repeat(121) }, { activo: 'yes' },
    ])
      expect(CreateProductoSchema.safeParse({ ...base, ...bad }).success).toBe(false);
  });
  it('rechaza campos desconocidos (mass assignment)', () => {
    expect(CreateProductoSchema.safeParse({ ...base, id: 99 }).success).toBe(false);
  });
  it('PATCH parcial sin defaults', () => {
    expect(UpdateProductoSchema.parse({ stock: '4' })).toEqual({ stock: 4 });
    expect(UpdateProductoSchema.safeParse({}).success).toBe(false);
  });
});

describe('Categorías', () => {
  it('normaliza texto y descripción', () => {
    expect(CreateCategoriaPadreSchema.parse({ nombre: ' Bebidas  frías ', descripcion: ' x ' })).toEqual({
      nombre: 'Bebidas frías', descripcion: 'x', activo: true,
    });
  });
  it('PATCH no pisa activo', () => {
    expect(UpdateCategoriaPadreSchema.parse({ nombre: 'Nuevo' })).toEqual({ nombre: 'Nuevo' });
  });
  it('subcategoría exige idCategoriaPadre válido', () => {
    expect(CreateSubcategoriaSchema.safeParse({ idCategoriaPadre: 'x', nombre: 'Frías' }).success).toBe(false);
    expect(CreateSubcategoriaSchema.parse({ idCategoriaPadre: '3', nombre: 'Frías' }).idCategoriaPadre).toBe(3);
  });
});

describe('Factura', () => {
  it('valida detalles', () => {
    expect(CreateFacturaSchema.parse({ idUsuario: '1', detalles: [{ idProducto: '2', cantidad: '3' }] })).toEqual({
      idUsuario: 1, detalles: [{ idProducto: 2, cantidad: 3 }],
    });
    expect(CreateFacturaSchema.safeParse({ idUsuario: 1, detalles: [] }).success).toBe(false);
    expect(CreateFacturaSchema.safeParse({ idUsuario: 1, detalles: [{ idProducto: 1, cantidad: 0 }] }).success).toBe(false);
    expect(CreateFacturaSchema.safeParse({ idUsuario: 1, detalles: [{ idProducto: 1, cantidad: 1, precio: 1 }] }).success).toBe(false);
  });
  it('estado solo permite valores del enum', () => {
    expect(UpdateFacturaSchema.safeParse({ estado: 'HACKED' }).success).toBe(false);
    expect(UpdateFacturaSchema.safeParse({}).success).toBe(false);
    expect(UpdateFacturaSchema.parse({ estado: 'PAGADA' })).toEqual({ estado: 'PAGADA' });
  });
});

describe('Config de seguridad', () => {
  it('acepta parciales válidos', () => {
    expect(UpdateSecurityConfigSchema.parse({ ventanaSegundos: '5', modoEstrictoHMAC: true })).toEqual({
      ventanaSegundos: 5, modoEstrictoHMAC: true,
    });
  });
  it('rechaza valores inválidos y campos extra', () => {
    for (const bad of [{}, { ventanaSegundos: 0 }, { ventanaSegundos: 99999 }, { umbralTarde: 'x' },
      { secretoHMAC: '123' }, { permitirHashExterno: 'si' }, { __proto__x: 1 }, { secretoMasked: 'abc' }])
      expect(UpdateSecurityConfigSchema.safeParse(bad).success).toBe(false);
  });
});

describe('Transacción (formato del evaluador / docente)', () => {
  it('acepta formato docente y alias nativos', () => {
    expect(CreateTransaccionSchema.safeParse({ idTxn: 1, user: 5, date: '2026-01-01', value: '15.000', paymentMethod: 'EFECTIVO' }).success).toBe(true);
    expect(CreateTransaccionSchema.safeParse({ idUsuario: 1, valor: 100 }).success).toBe(true);
    expect(CreateTransaccionSchema.safeParse({ user: 'estudiante@appresso.edu.co', value: '$ 50.000 COP' }).success).toBe(true);
  });
  it('parsea correctamente valores formateados con símbolos y miles', () => {
    const res = CreateTransaccionSchema.parse({ user: 'juan', value: '$ 50.000 COP' });
    expect((res as any).value).toBe(50000);
    const res2 = CreateTransaccionSchema.parse({ user: 'juan', value: '15000.50' });
    expect((res2 as any).value).toBe(15000.5);
  });
  it('rechaza sin usuario, sin valor, valor negativo o lista vacía', () => {
    expect(CreateTransaccionSchema.safeParse({ valor: 100 }).success).toBe(false);
    expect(CreateTransaccionSchema.safeParse({ idUsuario: 1 }).success).toBe(false);
    expect(CreateTransaccionSchema.safeParse({ idUsuario: 1, valor: -5 }).success).toBe(false);
    expect(CreateTransaccionSchema.safeParse({ idUsuario: 1, valor: 0 }).success).toBe(false);
    expect(CreateTransaccionSchema.safeParse([]).success).toBe(false);
    expect(CreateTransaccionSchema.safeParse({ user: '', value: 1000 }).success).toBe(false);
    expect(CreateTransaccionSchema.safeParse({ user: '0', value: 1000 }).success).toBe(false);
    expect(CreateTransaccionSchema.safeParse({ user: '-1', value: 1000 }).success).toBe(false);
  });
  it('acepta y valida lotes (arrays) concurrentes', () => {
    const loteValido = [
      { idTxn: 1, user: 'juan@test.com', value: 10000 },
      { idTxn: 2, user: 'maria@test.com', value: 20000 },
    ];
    expect(CreateTransaccionSchema.safeParse(loteValido).success).toBe(true);

    const loteInvalido = [
      { idTxn: 1, user: 'juan@test.com', value: 10000 },
      { idTxn: 2, user: 'maria@test.com', value: -500 }, // Inválido
    ];
    expect(CreateTransaccionSchema.safeParse(loteInvalido).success).toBe(false);
  });
});

describe('deepTrim', () => {
  it('limpia recursivamente sin mutar el original', () => {
    const input = { a: ' x ', b: [' y ', { c: ' z ' }], d: 5 };
    expect(deepTrim(input)).toEqual({ a: 'x', b: ['y', { c: 'z' }], d: 5 });
    expect(input.a).toBe(' x ');
  });
});

