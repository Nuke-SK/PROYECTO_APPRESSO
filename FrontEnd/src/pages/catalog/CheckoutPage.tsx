import React, { useEffect, useState } from 'react';
import { useCart } from '../../context/CartContext';
import { useToast } from '../../context/ToastContext';
import { facturasApi, usuariosApi, getHMACHeaders } from '../../api';
import { Usuario } from '../../types/usuario.types';
import { Factura } from '../../types/factura.types';
import {
  ShieldCheck,
  KeyRound,
  Trash2,
  Plus,
  Minus,
  ArrowLeft,
  CheckCircle2,
  Lock,
  UserPlus,
  CreditCard,
  Receipt,
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import '../../styles/checkout.css';

export const CheckoutPage: React.FC = () => {
  const { cart, updateQuantity, removeFromCart, clearCart, subtotal, impuesto, total } = useCart();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [facturaGenerada, setFacturaGenerada] = useState<Factura | null>(null);

  // Quick user creation modal/state
  const [showNewUserModal, setShowNewUserModal] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [creatingUser, setCreatingUser] = useState(false);

  useEffect(() => {
    cargarUsuarios();
  }, []);

  const cargarUsuarios = async () => {
    try {
      const res = await usuariosApi.listar(1, 100);
      setUsuarios(res || []);
      if (res && res.length > 0) {
        setSelectedUserId(res[0].id);
      }
    } catch (error: any) {
      showToast({
        type: 'error',
        title: 'Error al cargar usuarios',
        description: error.message || 'No fue posible cargar la lista de clientes',
      });
    }
  };

  const handleCrearUsuario = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserName.trim() || !newUserEmail.trim()) return;

    try {
      setCreatingUser(true);
      const res = await usuariosApi.crear({
        nombre: newUserName.trim(),
        email: newUserEmail.trim(),
        activo: true,
      });
      showToast({
        type: 'success',
        title: 'Cliente registrado',
        description: `Usuario ${res.nombre} creado con éxito.`,
      });
      setShowNewUserModal(false);
      setNewUserName('');
      setNewUserEmail('');
      await cargarUsuarios();
      setSelectedUserId(res.id);
    } catch (error: any) {
      showToast({
        type: 'error',
        title: 'Error al registrar cliente',
        description: error.message || 'Verifica los campos ingresados',
      });
    } finally {
      setCreatingUser(false);
    }
  };

  // Preview of the HMAC payload and cryptographic signature
  const hmacPayload = {
    idUsuario: selectedUserId || 1,
    detalles: cart.map((i) => ({
      idProducto: i.producto.id,
      cantidad: i.cantidad,
    })),
  };
  const hmacPreview = getHMACHeaders(hmacPayload);

  const handleProcesarCompra = async () => {
    if (!selectedUserId) {
      showToast({
        type: 'warning',
        title: 'Usuario requerido',
        description: 'Por favor selecciona o crea un usuario para asociar la factura.',
      });
      return;
    }

    if (cart.length === 0) {
      showToast({
        type: 'warning',
        title: 'Carrito vacío',
        description: 'Agrega al menos un producto para proceder con la compra.',
      });
      return;
    }

    try {
      setIsSubmitting(true);
      const factura = await facturasApi.crear({
        idUsuario: selectedUserId,
        detalles: cart.map((i) => ({
          idProducto: i.producto.id,
          cantidad: i.cantidad,
        })),
      });

      setFacturaGenerada(factura);
      clearCart();
      showToast({
        type: 'success',
        title: '¡Factura generada exitosamente!',
        description: `Factura ${factura.numeroFactura} emitida con seguridad HMAC y 19% IVA.`,
      });
    } catch (error: any) {
      showToast({
        type: 'error',
        title: 'Error al emitir factura',
        description: error.message || 'La validación criptográfica o de stock ha fallado.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (cart.length === 0 && !facturaGenerada) {
    return (
      <div className="checkout-empty">
        <div className="checkout-empty__icon-wrapper">
          <Receipt className="checkout-empty__icon" />
        </div>
        <h2 className="checkout-empty__title">Tu carrito está vacío</h2>
        <p className="checkout-empty__desc">
          Aún no has agregado ningún café o producto especial. Explora nuestro catálogo y selecciona tus favoritos.
        </p>
        <Link
          to="/"
          className="checkout-empty__btn"
        >
          <ArrowLeft className="checkout-empty__btn-icon" />
          Volver al Catálogo
        </Link>
      </div>
    );
  }

  return (
    <div className="checkout-page">
      {/* Header */}
      <div className="checkout-header">
        <div>
          <Link
            to="/"
            className="checkout-header__back-link"
          >
            <ArrowLeft className="checkout-header__back-icon" />
            Volver al catálogo
          </Link>
          <h1 className="checkout-header__title">
            Checkout Seguro Anti-Price Tampering
          </h1>
          <p className="checkout-header__subtitle">
            Procesamiento con validación de precios en servidor, cálculo de IVA 19% y firma HMAC-SHA256.
          </p>
        </div>
      </div>

      <div className="checkout-grid">
        {/* Left Column: Cart items & User selection */}
        <div className="checkout-main">
          {/* User Selection Card */}
          <div className="checkout-card">
            <div className="checkout-card__header">
              <h3 className="checkout-card__title">
                <CreditCard className="checkout-card__title-icon" />
                1. Cliente / Facturar a
              </h3>
              <button
                type="button"
                onClick={() => setShowNewUserModal(true)}
                className="checkout-card__add-user-btn"
              >
                <UserPlus className="checkout-card__add-user-icon" />
                Nuevo Cliente
              </button>
            </div>

            {usuarios.length === 0 ? (
              <p className="checkout-card__empty-users">No hay usuarios registrados. Crea uno para continuar.</p>
            ) : (
              <div className="checkout-card__form-group">
                <label className="checkout-card__label">
                  Selecciona el cliente registrado:
                </label>
                <select
                  value={selectedUserId ?? ''}
                  onChange={(e) => setSelectedUserId(Number(e.target.value))}
                  className="checkout-select"
                >
                  {usuarios.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.nombre} ({u.email}) - ID #{u.id}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Cart Items List */}
          <div className="checkout-card">
            <div className="checkout-cart-header">
              <span>2. Artículos en el Pedido ({cart.length})</span>
              <button
                onClick={clearCart}
                className="checkout-cart-clear-btn"
              >
                Vaciar carrito
              </button>
            </div>

            <div className="checkout-cart-list">
              {cart.map((item) => (
                <div key={item.producto.id} className="checkout-cart-item">
                  <div className="checkout-cart-item__info">
                    <h4 className="checkout-cart-item__name">{item.producto.nombre}</h4>
                    <p className="checkout-cart-item__price">
                      ${Number(item.producto.precio).toLocaleString('es-CO')} c/u
                    </p>
                  </div>

                  {/* Quantity selector */}
                  <div className="checkout-qty-control">
                    <button
                      onClick={() => updateQuantity(item.producto.id, item.cantidad - 1)}
                      className="checkout-qty-btn"
                    >
                      <Minus className="checkout-qty-icon" />
                    </button>
                    <span className="checkout-qty-val">
                      {item.cantidad}
                    </span>
                    <button
                      onClick={() => updateQuantity(item.producto.id, item.cantidad + 1)}
                      disabled={item.cantidad >= item.producto.stock}
                      className="checkout-qty-btn"
                    >
                      <Plus className="checkout-qty-icon" />
                    </button>
                  </div>

                  {/* Item Total */}
                  <div className="checkout-cart-item__total-wrapper">
                    <span className="checkout-cart-item__total">
                      ${(Number(item.producto.precio) * item.cantidad).toLocaleString('es-CO')}
                    </span>
                    <button
                      onClick={() => removeFromCart(item.producto.id)}
                      className="checkout-cart-item__delete-btn"
                      title="Eliminar artículo"
                    >
                      <Trash2 className="checkout-cart-item__delete-icon" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Order Summary & Cryptographic Breakdown */}
        <div className="checkout-sidebar">
          <div className="checkout-summary-card">
            <h3 className="checkout-summary-card__title">Resumen del Pedido</h3>

            <div className="checkout-summary-lines">
              <div className="checkout-summary-row">
                <span className="checkout-summary-label">Subtotal (Base imponible)</span>
                <span className="checkout-summary-value">${subtotal.toLocaleString('es-CO')}</span>
              </div>
              <div className="checkout-summary-row">
                <span className="checkout-summary-label">
                  IVA (19% Legal)
                  <span className="checkout-summary-badge">
                    Calculado en Backend
                  </span>
                </span>
                <span className="checkout-summary-value">${impuesto.toLocaleString('es-CO')}</span>
              </div>
              <div className="checkout-summary-total-row">
                <span className="checkout-summary-total-label">Total a Pagar</span>
                <span className="checkout-summary-total-val">
                  ${total.toLocaleString('es-CO')}
                </span>
              </div>
            </div>

            {/* Cryptographic Security Details */}
            <div className="checkout-hmac-panel">
              <div className="checkout-hmac-panel__header">
                <ShieldCheck className="checkout-hmac-panel__header-icon" />
                <span>Blindaje de Seguridad Criptográfico</span>
              </div>
              <p className="checkout-hmac-panel__desc">
                El cliente solo transmite los identificadores y cantidades. El backend calcula y fija los precios consultando la base de datos para impedir fraude por manipulación en el navegador.
              </p>

              <div className="checkout-hmac-panel__details">
                <div className="checkout-hmac-panel__row">
                  <span>x-timestamp:</span>
                  <span className="checkout-hmac-panel__timestamp">{hmacPreview['x-timestamp']}</span>
                </div>
                <div>
                  <span className="checkout-hmac-panel__signature-label">x-signature (HMAC-SHA256):</span>
                  <span className="checkout-hmac-panel__signature-box">
                    {hmacPreview['x-signature']}
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={handleProcesarCompra}
              disabled={isSubmitting || cart.length === 0}
              className="checkout-submit-btn"
            >
              {isSubmitting ? (
                <>
                  <div className="checkout-submit-spinner" />
                  <span>Validando y Emitiendo Factura...</span>
                </>
              ) : (
                <>
                  <Lock className="checkout-submit-icon" />
                  <span>Confirmar & Emitir Factura Segura</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Modal: New User Creation */}
      {showNewUserModal && (
        <div className="checkout-modal-backdrop">
          <div className="checkout-modal">
            <h3 className="checkout-modal__title">Registrar Nuevo Cliente</h3>
            <form onSubmit={handleCrearUsuario} className="checkout-modal__form">
              <div className="checkout-modal__field">
                <label className="checkout-modal__label">Nombre Completo</label>
                <input
                  type="text"
                  required
                  value={newUserName}
                  onChange={(e) => setNewUserName(e.target.value)}
                  placeholder="Ej: Sofia Gómez"
                  className="checkout-modal__input"
                />
              </div>
              <div className="checkout-modal__field">
                <label className="checkout-modal__label">Correo Electrónico</label>
                <input
                  type="email"
                  required
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                  placeholder="sofia@ejemplo.com"
                  className="checkout-modal__input"
                />
              </div>
              <div className="checkout-modal__actions">
                <button
                  type="button"
                  onClick={() => setShowNewUserModal(false)}
                  className="checkout-modal__cancel-btn"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={creatingUser}
                  className="checkout-modal__submit-btn"
                >
                  {creatingUser ? 'Guardando...' : 'Crear Cliente'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Factura Emitida Exitosa (Receipt) */}
      {facturaGenerada && (
        <div className="checkout-modal-backdrop">
          <div className="checkout-receipt-modal">
            <div className="checkout-receipt-modal__header">
              <div className="checkout-receipt-modal__icon-box">
                <CheckCircle2 className="checkout-receipt-modal__check-icon" />
              </div>
              <div>
                <h3 className="checkout-receipt-modal__title">Factura Emitida con Éxito</h3>
                <p className="checkout-receipt-modal__subtitle">Comprobante de compra protegido y registrado</p>
              </div>
            </div>

            <div className="checkout-receipt-box">
              <div className="checkout-receipt-box__header">
                <span className="checkout-receipt-box__label">Factura N°:</span>
                <span className="checkout-receipt-box__number">{facturaGenerada.numeroFactura}</span>
              </div>
              <div className="checkout-receipt-box__row">
                <span className="checkout-receipt-box__label">ID Transacción:</span>
                <span className="checkout-receipt-box__tx-id">#{facturaGenerada.idTransaccion}</span>
              </div>
              <div className="checkout-receipt-box__row">
                <span className="checkout-receipt-box__label">Fecha de Emisión:</span>
                <span className="checkout-receipt-box__date">
                  {new Date(facturaGenerada.fechaEmision).toLocaleString('es-CO')}
                </span>
              </div>
              <div className="checkout-receipt-box__row">
                <span className="checkout-receipt-box__label">Estado:</span>
                <span className="checkout-receipt-box__status">{facturaGenerada.estado}</span>
              </div>

              {/* Items in invoice */}
              <div className="checkout-receipt-box__details">
                <span className="checkout-receipt-box__details-title">
                  Detalle de Artículos:
                </span>
                {facturaGenerada.detalles?.map((det, idx) => (
                  <div key={idx} className="checkout-receipt-box__item">
                    <span className="checkout-receipt-box__item-name">
                      {det.cantidad}x {det.nombreProducto}
                    </span>
                    <span className="checkout-receipt-box__item-price">${Number(det.subtotal).toLocaleString('es-CO')}</span>
                  </div>
                ))}
              </div>

              <div className="checkout-receipt-box__totals">
                <div className="checkout-receipt-box__totals-row">
                  <span>Subtotal:</span>
                  <span>${Number(facturaGenerada.subtotal).toLocaleString('es-CO')}</span>
                </div>
                <div className="checkout-receipt-box__totals-row">
                  <span>IVA (19%):</span>
                  <span>${Number(facturaGenerada.impuesto).toLocaleString('es-CO')}</span>
                </div>
                <div className="checkout-receipt-box__totals-total">
                  <span>Total:</span>
                  <span className="checkout-receipt-box__totals-total-val">
                    ${Number(facturaGenerada.total).toLocaleString('es-CO')}
                  </span>
                </div>
              </div>
            </div>

            <div className="checkout-receipt-modal__actions">
              <button
                onClick={() => {
                  setFacturaGenerada(null);
                  navigate('/');
                }}
                className="checkout-receipt-modal__continue-btn"
              >
                Seguir Comprando
              </button>
              <Link
                to="/facturas"
                className="checkout-receipt-modal__history-link"
              >
                Ver en Historial de Facturas
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
