import { describe, it, expect, vi } from 'vitest';
import { validate } from '../src/middlewares/validate.middleware';
import { sanitize } from '../src/middlewares/sanitize.middleware';
import { CreateProductoSchema } from '../src/dtos';

const mockRes = () => {
  const res: any = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res;
};

describe('pipeline sanitize → validate', () => {
  it('reemplaza body con datos parseados en formato fijo y llama next', () => {
    const req: any = { body: { idSubcategoria: ' 1 ', nombre: '  Latte ', precio: '8000', stock: '2' }, query: {}, params: {} };
    const next = vi.fn();
    sanitize(req, mockRes(), next);
    validate(CreateProductoSchema, 'body')(req, mockRes(), next);
    expect(next).toHaveBeenCalledTimes(2);
    expect(req.body).toEqual({ idSubcategoria: 1, nombre: 'Latte', precio: 8000, stock: 2, activo: true });
  });
  it('responde 400 con detalle y no llama next', () => {
    const req: any = { body: { nombre: 'x', precio: 'abc' } };
    const res = mockRes();
    const next = vi.fn();
    validate(CreateProductoSchema, 'body')(req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json.mock.calls[0][0].errors.length).toBeGreaterThan(0);
    expect(next).not.toHaveBeenCalled();
  });
});

