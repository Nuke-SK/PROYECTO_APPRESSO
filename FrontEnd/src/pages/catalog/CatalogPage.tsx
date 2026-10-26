import React, { useEffect, useState } from 'react';
import { productosApi, categoriasApi } from '../../api';
import { Producto } from '../../types/producto.types';
import { CategoriaPadre, Subcategoria } from '../../types/categoria.types';
import { useCart } from '../../context/CartContext';
import { useToast } from '../../context/ToastContext';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { EmptyState } from '../../components/common/EmptyState';
import { Search, ShoppingBag, Coffee, Sparkles, Filter, Check } from 'lucide-react';
import { Link } from 'react-router-dom';
import '../../styles/catalog.css';

export const CatalogPage: React.FC = () => {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [categorias, setCategorias] = useState<CategoriaPadre[]>([]);
  const [subcategorias, setSubcategorias] = useState<Subcategoria[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategoria, setSelectedCategoria] = useState<number | null>(null);
  const [selectedSubcategoria, setSelectedSubcategoria] = useState<number | null>(null);

  const { addToCart, cart } = useCart();
  const { showToast } = useToast();

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      const [prodsRes, catsRes, subcatsRes] = await Promise.all([
        productosApi.listar(1, 100),
        categoriasApi.listarPadres(1, 100),
        categoriasApi.listarSubcategorias(1, 100),
      ]);
      setProductos(prodsRes.data || []);
      setCategorias(catsRes || []);
      setSubcategorias(subcatsRes || []);
    } catch (error: any) {
      showToast({
        type: 'error',
        title: 'Error al cargar catálogo',
        description: error.message || 'No fue posible conectar con el servidor',
      });
    } finally {
      setLoading(false);
    }
  };

  // Filtrado de subcategorías según la categoría padre seleccionada
  const subcategoriasFiltradas = selectedCategoria
    ? subcategorias.filter((s) => s.idCategoriaPadre === selectedCategoria)
    : subcategorias;

  // Filtrado de productos por texto y categoría/subcategoría
  const productosFiltrados = productos.filter((prod) => {
    const coincideTexto =
      prod.nombre.toLowerCase().includes(search.toLowerCase()) ||
      (prod.descripcion?.toLowerCase() || '').includes(search.toLowerCase());

    if (!coincideTexto) return false;

    if (selectedSubcategoria) {
      return prod.idSubcategoria === selectedSubcategoria;
    }

    if (selectedCategoria) {
      const idsSubcatPadre = subcategorias
        .filter((s) => s.idCategoriaPadre === selectedCategoria)
        .map((s) => s.id);
      return idsSubcatPadre.includes(prod.idSubcategoria);
    }

    return true;
  });

  const handleAddToCart = (prod: Producto) => {
    if (prod.stock <= 0) {
      showToast({
        type: 'warning',
        title: 'Sin stock disponible',
        description: `El producto ${prod.nombre} está actualmente agotado.`,
      });
      return;
    }
    addToCart(prod, 1);
    showToast({
      type: 'success',
      title: 'Añadido al carrito',
      description: `${prod.nombre} se agregó correctamente a tu pedido.`,
    });
  };

  const getSubcategoriaNombre = (idSubcategoria: number) => {
    const sub = subcategorias.find((s) => s.id === idSubcategoria);
    return sub ? sub.nombre : 'General';
  };

  return (
    <div className="catalog-page">
      {/* Hero Banner */}
      <div className="catalog-hero">
        <div className="catalog-hero__content">
          <div className="catalog-hero__badge">
            <Sparkles className="catalog-hero__badge-icon" />
            <span>Café de Especialidad & Origen Protegido</span>
          </div>
          <h1 className="catalog-hero__title">
            El arte del café con <span className="catalog-hero__title-accent">seguridad criptográfica</span>
          </h1>
          <p className="catalog-hero__desc">
            Explora granos seleccionados, accesorios baristas y métodos de extracción con facturación protegida contra manipulación de precios (Anti-Price Tampering) y firmas HMAC-SHA256.
          </p>
        </div>
        <div className="catalog-hero__glow" />
      </div>

      {/* Filter and Search Bar */}
      <div className="catalog-toolbar">
        <div className="catalog-search">
          <Search className="catalog-search__icon" />
          <input
            type="text"
            placeholder="Buscar por grano, método, tostión..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="catalog-search__input"
          />
        </div>

        {/* Categorías Filter Chips */}
        <div className="catalog-filter-group">
          <button
            onClick={() => {
              setSelectedCategoria(null);
              setSelectedSubcategoria(null);
            }}
            className={`catalog-filter-chip ${
              selectedCategoria === null ? 'catalog-filter-chip--active' : ''
            }`}
          >
            Todas
          </button>
          {categorias.map((cat) => (
            <button
              key={cat.id}
              onClick={() => {
                setSelectedCategoria(cat.id);
                setSelectedSubcategoria(null);
              }}
              className={`catalog-filter-chip ${
                selectedCategoria === cat.id ? 'catalog-filter-chip--active' : ''
              }`}
            >
              {cat.nombre}
            </button>
          ))}
        </div>
      </div>

      {/* Subcategorías Sub-filter */}
      {selectedCategoria && subcategoriasFiltradas.length > 0 && (
        <div className="catalog-subfilter">
          <Filter className="catalog-subfilter__icon" />
          <span className="catalog-subfilter__label">Subcategoría:</span>
          <button
            onClick={() => setSelectedSubcategoria(null)}
            className={`catalog-subfilter__chip ${
              selectedSubcategoria === null ? 'catalog-subfilter__chip--active' : ''
            }`}
          >
            Ver todas del grupo
          </button>
          {subcategoriasFiltradas.map((sub) => (
            <button
              key={sub.id}
              onClick={() => setSelectedSubcategoria(sub.id)}
              className={`catalog-subfilter__chip ${
                selectedSubcategoria === sub.id ? 'catalog-subfilter__chip--active' : ''
              }`}
            >
              {sub.nombre}
            </button>
          ))}
        </div>
      )}

      {/* Products Grid */}
      {loading ? (
        <LoadingSpinner label="Cargando catálogo de productos..." size="lg" />
      ) : productosFiltrados.length === 0 ? (
        <EmptyState
          icon={Coffee}
          title="No se encontraron productos"
          description="Intenta cambiar los filtros de categoría o el término de búsqueda para ver más resultados."
          action={
            <button
              onClick={() => {
                setSearch('');
                setSelectedCategoria(null);
                setSelectedSubcategoria(null);
              }}
              className="catalog-empty-reset-btn"
            >
              Restablecer filtros
            </button>
          }
        />
      ) : (
        <div className="catalog-grid">
          {productosFiltrados.map((prod) => {
            const inCart = cart.find((i) => i.producto.id === prod.id);
            const isOutOfStock = prod.stock <= 0;

            const stockModifier = isOutOfStock
              ? 'product-card__stock--out'
              : prod.stock < 5
              ? 'product-card__stock--low'
              : 'product-card__stock--in';

            const btnModifier = isOutOfStock
              ? 'product-card__btn--disabled'
              : inCart
              ? 'product-card__btn--in-cart'
              : 'product-card__btn--add';

            return (
              <div key={prod.id} className="product-card">
                <div className="product-card__body">
                  {/* Top Badge: Subcategory & Stock */}
                  <div className="product-card__header">
                    <span className="product-card__category">
                      {getSubcategoriaNombre(prod.idSubcategoria)}
                    </span>
                    <span className={`product-card__stock ${stockModifier}`}>
                      {isOutOfStock ? 'Agotado' : `${prod.stock} disp.`}
                    </span>
                  </div>

                  {/* Icon illustration placeholder */}
                  <div className="product-card__media">
                    <Coffee className="product-card__media-icon" />
                  </div>

                  {/* Name and Description */}
                  <h3 className="product-card__title">
                    {prod.nombre}
                  </h3>
                  <p className="product-card__desc">
                    {prod.descripcion || 'Café seleccionado con proceso artesanal de alta calidad y tueste medio.'}
                  </p>
                </div>

                {/* Footer: Price and Add Button */}
                <div className="product-card__footer">
                  <div className="product-card__price-wrapper">
                    <span className="product-card__price-label">Precio</span>
                    <span className="product-card__price-val">
                      ${Number(prod.precio).toLocaleString('es-CO')}
                    </span>
                  </div>

                  <button
                    disabled={isOutOfStock}
                    onClick={() => handleAddToCart(prod)}
                    className={`product-card__btn ${btnModifier}`}
                  >
                    {inCart ? (
                      <>
                        <Check className="product-card__btn-icon" />
                        <span>En carrito ({inCart.cantidad})</span>
                      </>
                    ) : (
                      <>
                        <ShoppingBag className="product-card__btn-icon" />
                        <span>Añadir</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Floating Checkout Sticky CTA when Cart has items */}
      {cart.length > 0 && (
        <div className="catalog-floating-cta">
          <div className="catalog-floating-cta__card">
            <div className="catalog-floating-cta__info">
              <p className="catalog-floating-cta__label">Total en Carrito</p>
              <p className="catalog-floating-cta__total">
                ${cart
                  .reduce((acc, i) => acc + Number(i.producto.precio) * i.cantidad, 0)
                  .toLocaleString('es-CO')}{' '}
                <span className="catalog-floating-cta__count">
                  ({cart.reduce((acc, i) => acc + i.cantidad, 0)} items)
                </span>
              </p>
            </div>
            <Link
              to="/checkout"
              className="catalog-floating-cta__btn"
            >
              Ir a Pagar Seguro
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};
