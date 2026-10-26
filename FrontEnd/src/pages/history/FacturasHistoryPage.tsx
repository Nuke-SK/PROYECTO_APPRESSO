import React, { useEffect, useState } from 'react';
import { facturasApi } from '../../api';
import { Factura } from '../../types/factura.types';
import { StatusBadge } from '../../components/common/StatusBadge';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { EmptyState } from '../../components/common/EmptyState';
import { useToast } from '../../context/ToastContext';
import {
  FileText,
  Search,
  Eye,
  RefreshCw,
  CreditCard,
  X,
  Link as LinkIcon,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import '../../styles/facturas.css';

export const FacturasHistoryPage: React.FC = () => {
  const [facturas, setFacturas] = useState<Factura[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedFactura, setSelectedFactura] = useState<Factura | null>(null);
  const [updatingEstado, setUpdatingEstado] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    cargarFacturas();
  }, []);

  const cargarFacturas = async () => {
    try {
      setLoading(true);
      const res = await facturasApi.listar(1, 100);
      setFacturas(res.data || []);
    } catch (error: any) {
      showToast({
        type: 'error',
        title: 'Error al cargar facturas',
        description: error.message || 'No fue posible consultar el historial de facturación',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateEstado = async (facturaId: number, nuevoEstado: 'PENDIENTE' | 'PAGADA' | 'ANULADA') => {
    try {
      setUpdatingEstado(true);
      const updated = await facturasApi.actualizar(facturaId, { estado: nuevoEstado });
      showToast({
        type: 'success',
        title: 'Estado actualizado',
        description: `Factura ${updated.numeroFactura} marcada como ${nuevoEstado}.`,
      });
      if (selectedFactura && selectedFactura.id === facturaId) {
        setSelectedFactura(updated);
      }
      await cargarFacturas();
    } catch (error: any) {
      showToast({
        type: 'error',
        title: 'Error al actualizar estado',
        description: error.message,
      });
    } finally {
      setUpdatingEstado(false);
    }
  };

  const facturasFiltradas = facturas.filter(
    (f) =>
      f.numeroFactura.toLowerCase().includes(search.toLowerCase()) ||
      String(f.idTransaccion).includes(search) ||
      String(f.idUsuario).includes(search)
  );

  return (
    <div className="facturas-page">
      {/* Header */}
      <div className="facturas-header">
        <div className="facturas-header__info">
          <div className="facturas-breadcrumb">
            <Link to="/admin" className="facturas-breadcrumb__link">
              Historial
            </Link>
            <span className="facturas-breadcrumb__separator">/</span>
            <span className="facturas-breadcrumb__current">Facturación</span>
          </div>
          <h1 className="facturas-header__title">
            <FileText className="facturas-header__icon" />
            Historial de Facturación Segura
          </h1>
          <p className="facturas-header__desc">
            Comprobantes fiscales emitidos con cálculo blindado de precios, IVA 19% y enlace a transacción.
          </p>
        </div>

        <div className="facturas-header__actions">
          <Link to="/transacciones" className="facturas-header__nav-btn">
            <CreditCard className="facturas-header__nav-btn-icon" />
            <span>Ver Transacciones HMAC</span>
          </Link>
          <button
            onClick={cargarFacturas}
            className="facturas-header__reload-btn"
            title="Recargar facturas"
          >
            <RefreshCw className="facturas-header__reload-icon" />
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="facturas-search-bar">
        <div className="facturas-search-bar__input-wrapper">
          <Search className="facturas-search-bar__icon" />
          <input
            type="text"
            placeholder="Buscar por número de factura (FAC-...), ID transacción o usuario..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="facturas-search-bar__input"
          />
        </div>
        <div className="facturas-search-bar__count">
          Total: <strong className="facturas-search-bar__count-strong">{facturasFiltradas.length}</strong> facturas
        </div>
      </div>

      {/* Invoices Table */}
      {loading ? (
        <LoadingSpinner label="Cargando facturas registradas..." size="lg" />
      ) : facturasFiltradas.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No se encontraron facturas"
          description="Aún no se han emitido facturas o no coinciden con la búsqueda actual."
        />
      ) : (
        <div className="facturas-table-wrapper">
          <table className="facturas-table">
            <thead className="facturas-table__head">
              <tr>
                <th className="facturas-table__th">N° Factura</th>
                <th className="facturas-table__th">Cliente / Usuario</th>
                <th className="facturas-table__th">Transacción</th>
                <th className="facturas-table__th">Fecha Emisión</th>
                <th className="facturas-table__th">Subtotal</th>
                <th className="facturas-table__th">IVA 19%</th>
                <th className="facturas-table__th">Total</th>
                <th className="facturas-table__th">Estado</th>
                <th className="facturas-table__th facturas-table__th--right">Detalle</th>
              </tr>
            </thead>
            <tbody className="facturas-table__body">
              {facturasFiltradas.map((fac) => (
                <tr key={fac.id} className="facturas-table__row">
                  <td className="facturas-table__td facturas-table__td--invoice">
                    {fac.numeroFactura}
                  </td>
                  <td className="facturas-table__td facturas-table__td--user">
                    <span className="facturas-table__user-label">Usuario #{fac.idUsuario}</span>
                  </td>
                  <td className="facturas-table__td">
                    <Link
                      to="/transacciones"
                      className="facturas-table__tx-link"
                    >
                      <LinkIcon className="facturas-table__tx-link-icon" />
                      #{fac.idTransaccion}
                    </Link>
                  </td>
                  <td className="facturas-table__td facturas-table__td--muted">
                    {new Date(fac.fechaEmision).toLocaleDateString('es-CO', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </td>
                  <td className="facturas-table__td facturas-table__td--muted">
                    ${Number(fac.subtotal).toLocaleString('es-CO')}
                  </td>
                  <td className="facturas-table__td facturas-table__td--muted">
                    ${Number(fac.impuesto).toLocaleString('es-CO')}
                  </td>
                  <td className="facturas-table__td facturas-table__td--total">
                    ${Number(fac.total).toLocaleString('es-CO')}
                  </td>
                  <td className="facturas-table__td">
                    <StatusBadge status={fac.estado} />
                  </td>
                  <td className="facturas-table__td facturas-table__td--right">
                    <button
                      onClick={() => setSelectedFactura(fac)}
                      className="facturas-table__action-btn"
                      title="Ver desglose y artículos"
                    >
                      <Eye className="facturas-table__action-icon" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Invoice Detail Modal */}
      {selectedFactura && (
        <div className="facturas-modal-backdrop">
          <div className="facturas-modal">
            <div className="facturas-modal__header">
              <div>
                <span className="facturas-modal__number">
                  {selectedFactura.numeroFactura}
                </span>
                <h3 className="facturas-modal__title">Detalle de Comprobante Fiscal</h3>
              </div>
              <button
                onClick={() => setSelectedFactura(null)}
                className="facturas-modal__close-btn"
              >
                <X className="facturas-modal__close-icon" />
              </button>
            </div>

            {/* General Meta */}
            <div className="facturas-modal__meta-grid">
              <div className="facturas-modal__meta-item">
                <span className="facturas-modal__meta-label">ID Factura</span>
                <span className="facturas-modal__meta-value">#{selectedFactura.id}</span>
              </div>
              <div className="facturas-modal__meta-item">
                <span className="facturas-modal__meta-label">Transacción</span>
                <span className="facturas-modal__meta-value facturas-modal__meta-value--link">
                  #{selectedFactura.idTransaccion}
                </span>
              </div>
              <div className="facturas-modal__meta-item">
                <span className="facturas-modal__meta-label">Estado Actual</span>
                <StatusBadge status={selectedFactura.estado} />
              </div>
              <div className="facturas-modal__meta-item facturas-modal__meta-item--full">
                <span className="facturas-modal__meta-label">Fecha de Emisión</span>
                <span className="facturas-modal__meta-value facturas-modal__meta-value--text">
                  {new Date(selectedFactura.fechaEmision).toLocaleString('es-CO')}
                </span>
              </div>
            </div>

            {/* Items Table */}
            <div>
              <h4 className="facturas-modal__section-title">
                Artículos Facturados
              </h4>
              <div className="facturas-modal__items-table-wrapper">
                <table className="facturas-modal__items-table">
                  <thead className="facturas-modal__items-thead">
                    <tr>
                      <th className="facturas-modal__items-th">Producto</th>
                      <th className="facturas-modal__items-th facturas-modal__items-th--center">Cant.</th>
                      <th className="facturas-modal__items-th facturas-modal__items-th--right">Precio Unit.</th>
                      <th className="facturas-modal__items-th facturas-modal__items-th--right">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody className="facturas-modal__items-tbody">
                    {selectedFactura.detalles?.map((item, idx) => (
                      <tr key={idx}>
                        <td className="facturas-modal__items-td facturas-modal__items-td--name">
                          {item.nombreProducto}
                        </td>
                        <td className="facturas-modal__items-td facturas-modal__items-td--center">
                          {item.cantidad}
                        </td>
                        <td className="facturas-modal__items-td facturas-modal__items-td--right">
                          ${Number(item.precioUnitario).toLocaleString('es-CO')}
                        </td>
                        <td className="facturas-modal__items-td facturas-modal__items-td--right facturas-modal__items-td--bold">
                          ${Number(item.subtotal).toLocaleString('es-CO')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Totals */}
            <div className="facturas-modal__totals">
              <div className="facturas-modal__totals-row">
                <span>Subtotal Neto:</span>
                <span className="facturas-modal__totals-val">
                  ${Number(selectedFactura.subtotal).toLocaleString('es-CO')}
                </span>
              </div>
              <div className="facturas-modal__totals-row">
                <span>IVA (19%):</span>
                <span className="facturas-modal__totals-val">
                  ${Number(selectedFactura.impuesto).toLocaleString('es-CO')}
                </span>
              </div>
              <div className="facturas-modal__totals-final">
                <span>Total Facturado:</span>
                <span className="facturas-modal__totals-final-amount">
                  ${Number(selectedFactura.total).toLocaleString('es-CO')}
                </span>
              </div>
            </div>

            {/* Actions: Change Estado */}
            <div className="facturas-modal__footer">
              <div className="facturas-modal__status-group">
                <span className="facturas-modal__status-label">Cambiar estado:</span>
                <button
                  disabled={updatingEstado || selectedFactura.estado === 'PAGADA'}
                  onClick={() => handleUpdateEstado(selectedFactura.id, 'PAGADA')}
                  className="facturas-modal__btn-status facturas-modal__btn-status--pagada"
                >
                  Marcar Pagada
                </button>
                <button
                  disabled={updatingEstado || selectedFactura.estado === 'ANULADA'}
                  onClick={() => handleUpdateEstado(selectedFactura.id, 'ANULADA')}
                  className="facturas-modal__btn-status facturas-modal__btn-status--anulada"
                >
                  Anular
                </button>
              </div>

              <button
                onClick={() => setSelectedFactura(null)}
                className="facturas-modal__btn-close"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
