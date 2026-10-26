import React from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { MainLayout } from '../components/layout/MainLayout';
import { CatalogPage } from '../pages/catalog/CatalogPage';
import { CheckoutPage } from '../pages/catalog/CheckoutPage';
import { AdminDashboardPage } from '../pages/admin/AdminDashboardPage';
import { ProductsManagePage } from '../pages/admin/ProductsManagePage';
import { CategoriesManagePage } from '../pages/admin/CategoriesManagePage';
import { FacturasHistoryPage } from '../pages/history/FacturasHistoryPage';
import { TransaccionesHistoryPage } from '../pages/history/TransaccionesHistoryPage';
import { AnomaliasPage } from '../pages/security/AnomaliasPage';
import { NotFoundPage } from '../pages/NotFoundPage';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <MainLayout />,
    children: [
      {
        index: true,
        element: <CatalogPage />,
      },
      {
        path: 'checkout',
        element: <CheckoutPage />,
      },
      {
        path: 'admin',
        children: [
          {
            index: true,
            element: <AdminDashboardPage />,
          },
          {
            path: 'productos',
            element: <ProductsManagePage />,
          },
          {
            path: 'categorias',
            element: <CategoriesManagePage />,
          },
        ],
      },
      {
        path: 'facturas',
        element: <FacturasHistoryPage />,
      },
      {
        path: 'transacciones',
        element: <TransaccionesHistoryPage />,
      },
      {
        path: 'seguridad',
        element: <AnomaliasPage />,
      },
      {
        path: '404',
        element: <NotFoundPage />,
      },
      {
        path: '*',
        element: <NotFoundPage />,
      },
    ],
  },
]);
