import React from 'react';
import { RouterProvider } from 'react-router-dom';
import { router } from './router';
import { CartProvider } from './context/CartContext';
import { ToastProvider } from './context/ToastContext';

export const App: React.FC = () => {
  return (
    <ToastProvider>
      <CartProvider>
        <RouterProvider router={router} />
      </CartProvider>
    </ToastProvider>
  );
};

export default App;
