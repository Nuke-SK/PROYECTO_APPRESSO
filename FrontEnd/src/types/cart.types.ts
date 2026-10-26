import { Producto } from './producto.types';

export interface CartItem {
  producto: Producto;
  cantidad: number;
}

export interface CartState {
  items: CartItem[];
  totalArticulos: number;
  subtotalEstimado: number;
  impuestoEstimado: number;
  totalEstimado: number;
}
