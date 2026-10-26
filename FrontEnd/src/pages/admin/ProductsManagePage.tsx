import React, { useEffect, useState } from 'react';
import { productosApi, categoriasApi } from '../../api';
import { Producto, CreateProductoDTO, UpdateProductoDTO } from '../../types/producto.types';
import { Subcategoria } from '../../types/categoria.types';
import { useToast } from '../../context/ToastContext';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { EmptyState } from '../../components/common/EmptyState';
import {
  Plus,
  Search,
  Edit2,
  Package,
  Layers,
  ArrowUpDown,
  CheckCircle,
  XCircle,
  X,
  RefreshCw,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import '../../styles/products.css';

export const ProductsManagePage: React.FC = () => {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [subcategorias, setSubcategorias] = useState<Subcategoria[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const { showToast } = useToast();

  // Create/Edit Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Producto | null>(null);
  const [saving, setSaving] = useState(false);

  // Form State
  const [formData, setFormData] = useState<{
    idSubcategoria: number;
    nombre: string;
    descripcion: string;
    precio: number;
    stock: number;
    activo: boolean;
  }>({
    idSubcategoria: 0,
    nombre: '',
    descripcion: '',
    precio: 0,
    stock: 0,
    activo: true,
  });

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      const [prodsRes, subcatsRes] = await Promise.all([
        productosApi.listar(1, 100),
        categoriasApi.listarSubcategorias(1, 100),
      ]);
      setProductos(prodsRes.data || []);
      setSubcategorias(subcatsRes || []);
      if (subcatsRes && subcatsRes.length > 0 && formData.idSubcategoria === 0) {
        setFormData((prev) => ({ ...prev, idSubcategoria: subcatsRes[0].id }));
      }
    } catch (error: any) {
      showToast({
        type: 'error',
        title: 'Error al cargar productos',
        description: error.message || 'No fue posible consultar la base de datos',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setEditingProduct(null);
    setFormData({
      idSubcategoria: subcategorias[0]?.id || 1,
      nombre: '',
      descripcion: '',
      precio: 15000,
      stock: 10,
      activo: true,
    });
    setModalOpen(true);
  };

  const handleOpenEdit = (prod: Producto) => {
    setEditingProduct(prod);
    setFormData({
      idSubcategoria: prod.idSubcategoria,
      nombre: prod.nombre,
      descripcion: prod.descripcion || '',
      precio: Number(prod.precio),
      stock: prod.stock,
      activo: prod.activo,
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nombre.trim()) {
      showToast({ type: 'warning', title: 'Nombre requerido', description: 'Ingresa el nombre del producto' });
      return;
    }

    try {
      setSaving(true);
      if (editingProduct) {
        const updateData: UpdateProductoDTO = {
          nombre: formData.nombre.trim(),
          descripcion: formData.descripcion.trim() || undefined,
          precio: Number(formData.precio),
          stock: Number(formData.stock),
          idSubcategoria: Number(formData.idSubcategoria),
          activo: formData.activo,
        };
        await productosApi.actualizar(editingProduct.id, updateData);
        showToast({
          type: 'success',
          title: 'Producto actualizado',
          description: `Se actualizó "${formData.nombre}" exitosamente.`,
        });
      } else {
        const createData: CreateProductoDTO = {
          nombre: formData.nombre.trim(),
          descripcion: formData.descripcion.trim() || undefined,
          precio: Number(formData.precio),
          stock: Number(formData.stock),
          idSubcategoria: Number(formData.idSubcategoria),
          activo: formData.activo,
        };
        await productosApi.crear(createData);
        showToast({
          type: 'success',
          title: 'Producto creado',
          description: `Se añadió "${formData.nombre}" al inventario.`,
        });
      }
      setModalOpen(false);
      await cargarDatos();
    } catch (error: any) {
      showToast({
        type: 'error',
        title: 'Error al guardar producto',
        description: error.message || 'Verifica los datos del formulario.',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActivo = async (prod: Producto) => {
    try {
      await productosApi.actualizar(prod.id, { activo: !prod.activo });
      showToast({
        type: 'info',
        title: 'Estado actualizado',
        description: `Producto "${prod.nombre}" ahora está ${!prod.activo ? 'Activo' : 'Inactivo'}.`,
      });
      await cargarDatos();
    } catch (error: any) {
      showToast({
        type: 'error',
        title: 'Error al cambiar estado',
        description: error.message,
      });
    }
  };

  const productosFiltrados = productos.filter(
    (p) =>
      p.nombre.toLowerCase().includes(search.toLowerCase()) ||
      (p.descripcion?.toLowerCase() || '').includes(search.toLowerCase())
  );

  const getSubcategoriaNombre = (idSub: number) => {
    const s = subcategorias.find((sub) => sub.id === idSub);
    return s ? s.nombre : `Subcat #${idSub}`;
  };

  return (
    <div className="products-page">
      {/* Top Header */}
      <div className="products-page__header">
        <div>
          <div className="products-page__breadcrumbs">
            <Link to="/admin" className="products-page__breadcrumb-link">
              Panel Admin
            </Link>
            <span className="products-page__breadcrumb-sep">/</span>
            <span className="products-page__breadcrumb-current">Productos</span>
          </div>
          <h1 className="products-page__title">
            <Package className="products-page__title-icon" />
            Gestión de Inventario y Productos
          </h1>
          <p className="products-page__subtitle">
            Administra precios oficiales, existencias en almacén y vinculación con subcategorías.
          </p>
        </div>

        <div className="products-page__actions">
          <button
            onClick={cargarDatos}
            className="products-page__btn-refresh"
            title="Recargar inventario"
          >
            <RefreshCw className="products-page__btn-icon" />
          </button>
          <button
            onClick={handleOpenCreate}
            className="products-page__btn-primary"
          >
            <Plus className="products-page__btn-icon" />
            <span>Nuevo Producto</span>
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="products-page__search-bar">
        <div className="products-page__search-wrapper">
          <Search className="products-page__search-icon" />
          <input
            type="text"
            placeholder="Buscar por nombre o descripción..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="products-page__search-input"
          />
        </div>
        <div className="products-page__search-count">
          Total: <strong className="products-page__search-count-highlight">{productosFiltrados.length}</strong> productos
        </div>
      </div>

      {/* Products Table */}
      {loading ? (
        <LoadingSpinner label="Consultando inventario de productos..." size="lg" />
      ) : productosFiltrados.length === 0 ? (
        <EmptyState
          icon={Package}
          title="No se encontraron productos"
          description="Crea tu primer producto o ajusta el filtro de búsqueda."
          action={
            <button
              onClick={handleOpenCreate}
              className="products-page__empty-btn"
            >
              Crear Producto Ahora
            </button>
          }
        />
      ) : (
        <div className="products-table__wrapper">
          <table className="products-table">
            <thead className="products-table__thead">
              <tr>
                <th className="products-table__th">ID</th>
                <th className="products-table__th">Producto</th>
                <th className="products-table__th">Subcategoría</th>
                <th className="products-table__th">Precio Oficial</th>
                <th className="products-table__th">Stock</th>
                <th className="products-table__th">Estado</th>
                <th className="products-table__th products-table__th--right">Acciones</th>
              </tr>
            </thead>
            <tbody className="products-table__tbody">
              {productosFiltrados.map((prod) => (
                <tr key={prod.id} className="products-table__row">
                  <td className="products-table__cell products-table__cell--id">#{prod.id}</td>
                  <td className="products-table__cell products-table__cell--name-desc">
                    <div className="products-table__cell-name">{prod.nombre}</div>
                    <div className="products-table__cell-desc">{prod.descripcion || '—'}</div>
                  </td>
                  <td className="products-table__cell">
                    <span className="products-table__subcat-pill">
                      <Layers className="products-table__subcat-icon" />
                      {getSubcategoriaNombre(prod.idSubcategoria)}
                    </span>
                  </td>
                  <td className="products-table__cell products-table__cell--price">
                    ${Number(prod.precio).toLocaleString('es-CO')}
                  </td>
                  <td className="products-table__cell">
                    <span
                      className={`products-table__stock ${
                        prod.stock <= 0
                          ? 'products-table__stock--danger'
                          : prod.stock < 5
                          ? 'products-table__stock--warning'
                          : 'products-table__stock--ok'
                      }`}
                    >
                      {prod.stock} uds.
                    </span>
                  </td>
                  <td className="products-table__cell">
                    <button
                      onClick={() => handleToggleActivo(prod)}
                      className={`products-table__status-btn ${
                        prod.activo
                          ? 'products-table__status-btn--active'
                          : 'products-table__status-btn--inactive'
                      }`}
                    >
                      {prod.activo ? (
                        <>
                          <CheckCircle className="products-table__status-icon" />
                          <span>Activo</span>
                        </>
                      ) : (
                        <>
                          <XCircle className="products-table__status-icon" />
                          <span>Inactivo</span>
                        </>
                      )}
                    </button>
                  </td>
                  <td className="products-table__cell products-table__cell--actions">
                    <button
                      onClick={() => handleOpenEdit(prod)}
                      className="products-table__action-btn"
                      title="Editar producto"
                    >
                      <Edit2 className="products-table__action-icon" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal: Create / Edit Product */}
      {modalOpen && (
        <div className="product-modal__backdrop">
          <div className="product-modal__dialog">
            <div className="product-modal__header">
              <h3 className="product-modal__title">
                <Package className="product-modal__title-icon" />
                {editingProduct ? 'Editar Producto' : 'Crear Nuevo Producto'}
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                className="product-modal__close-btn"
              >
                <X className="product-modal__close-icon" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="product-modal__form">
              <div className="product-modal__form-group">
                <label className="product-modal__label">Nombre del Producto *</label>
                <input
                  type="text"
                  required
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  placeholder="Ej: Café Bourbon Rosado 500g"
                  className="product-modal__input"
                />
              </div>

              <div className="product-modal__form-group">
                <label className="product-modal__label">Subcategoría *</label>
                <select
                  required
                  value={formData.idSubcategoria}
                  onChange={(e) => setFormData({ ...formData, idSubcategoria: Number(e.target.value) })}
                  className="product-modal__select"
                >
                  {subcategorias.map((sub) => (
                    <option key={sub.id} value={sub.id}>
                      {sub.nombre} (ID #{sub.id})
                    </option>
                  ))}
                </select>
              </div>

              <div className="product-modal__form-row">
                <div className="product-modal__form-group">
                  <label className="product-modal__label">Precio Unitario ($ COP) *</label>
                  <input
                    type="number"
                    required
                    min={0}
                    step="any"
                    value={formData.precio}
                    onChange={(e) => setFormData({ ...formData, precio: Number(e.target.value) })}
                    className="product-modal__input product-modal__input--mono"
                  />
                </div>
                <div className="product-modal__form-group">
                  <label className="product-modal__label">Stock Disponible *</label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={formData.stock}
                    onChange={(e) => setFormData({ ...formData, stock: Number(e.target.value) })}
                    className="product-modal__input product-modal__input--mono"
                  />
                </div>
              </div>

              <div className="product-modal__form-group">
                <label className="product-modal__label">Descripción</label>
                <textarea
                  rows={3}
                  value={formData.descripcion}
                  onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                  placeholder="Notas de cata, perfil de taza, origen, etc."
                  className="product-modal__textarea"
                />
              </div>

              <div className="product-modal__checkbox-row">
                <input
                  type="checkbox"
                  id="activoCheck"
                  checked={formData.activo}
                  onChange={(e) => setFormData({ ...formData, activo: e.target.checked })}
                  className="product-modal__checkbox"
                />
                <label htmlFor="activoCheck" className="product-modal__checkbox-label">
                  Producto disponible para venta (Activo)
                </label>
              </div>

              <div className="product-modal__footer">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="product-modal__btn-cancel"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="product-modal__btn-submit"
                >
                  {saving ? 'Guardando...' : editingProduct ? 'Actualizar Producto' : 'Crear Producto'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
