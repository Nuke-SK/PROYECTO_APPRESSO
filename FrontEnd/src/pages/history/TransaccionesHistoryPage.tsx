import React, { useEffect, useState } from 'react';
import { transaccionesApi, usuariosApi } from '../../api';
import { Transaccion, CreateTransaccionDTO, MetodoPago } from '../../types/transaccion.types';
import { Usuario } from '../../types/usuario.types';
import { StatusBadge } from '../../components/common/StatusBadge';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { EmptyState } from '../../components/common/EmptyState';
import { useToast } from '../../context/ToastContext';
import {
  CreditCard,
  Search,
  KeyRound,
  ShieldCheck,
  RefreshCw,
  Plus,
  X,
  Copy,
  Check,
  Activity,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { TransaccionesSimulatorModal } from '../../components/security/TransaccionesSimulatorModal';
import '../../styles/transacciones.css';

export const TransaccionesHistoryPage: React.FC = () => {
  const [transacciones, setTransacciones] = useState<Transaccion[]>([]);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedTx, setSelectedTx] = useState<Transaccion | null>(null);
  const [copiedHash, setCopiedHash] = useState(false);
  const [botModalOpen, setBotModalOpen] = useState(false);

  // New Transaction Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [creatingTx, setCreatingTx] = useState(false);
  const [newTx, setNewTx] = useState<CreateTransaccionDTO>({
    idUsuario: 1,
    valor: 50000,
    metodoPago: 'TARJETA_CREDITO',
  });

  const { showToast } = useToast();

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      const [txRes, usersRes] = await Promise.all([
        transaccionesApi.listar(1, 100),
        usuariosApi.listar(1, 100),
      ]);
      setTransacciones(txRes.data || []);
      setUsuarios(usersRes || []);
      if (usersRes && usersRes.length > 0 && !newTx.idUsuario) {
        setNewTx((prev) => ({ ...prev, idUsuario: usersRes[0].id }));
      }
    } catch (error: any) {
      showToast({
        type: 'error',
        title: 'Error al cargar transacciones',
        description: error.message || 'No fue posible consultar el servidor',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTx = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setCreatingTx(true);
      const created = await transaccionesApi.crear({
        idUsuario: Number(newTx.idUsuario),
        valor: Number(newTx.valor),
        metodoPago: newTx.metodoPago,
      });

      showToast({
        type: 'success',
        title: 'Transacción firmada y creada',
        description: `Transacción #${created.id} procesada con HMAC ${created.hash.substring(0, 12)}...`,
      });
      setModalOpen(false);
      await cargarDatos();
    } catch (error: any) {
      showToast({
        type: 'error',
        title: 'Error al registrar transacción',
        description: error.message || 'La firma HMAC o validación falló.',
      });
    } finally {
      setCreatingTx(false);
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedHash(true);
    setTimeout(() => setCopiedHash(false), 2000);
    showToast({
      type: 'info',
      title: 'Hash copiado',
      description: 'El hash HMAC-SHA256 ha sido copiado al portapapeles.',
    });
  };

  const transaccionesFiltradas = transacciones.filter(
    (t) =>
      String(t.id).includes(search) ||
      String(t.idUsuario).includes(search) ||
      t.metodoPago.toLowerCase().includes(search.toLowerCase()) ||
      t.hash.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="tx-page">
      {/* Header */}
      <div className="tx-header">
        <div className="tx-header__info">
          <div className="tx-breadcrumb">
            <Link to="/admin" className="tx-breadcrumb__link">
              Historial
            </Link>
            <span className="tx-breadcrumb__sep">/</span>
            <span className="tx-breadcrumb__current">Transacciones HMAC</span>
          </div>
          <h1 className="tx-header__title">
            <CreditCard className="tx-header__icon" />
            Registro de Transacciones Seguras
          </h1>
          <p className="tx-header__desc">
            Auditoría criptográfica con firmas HMAC-SHA256 e integración con la ventana deslizante de anomalías.
          </p>
        </div>

        <div className="tx-header__actions">
          <button
            onClick={cargarDatos}
            className="tx-header__reload-btn"
            title="Recargar transacciones"
          >
            <RefreshCw className="tx-header__reload-icon" />
          </button>
          <button
            onClick={() => setBotModalOpen(true)}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-semibold text-xs transition-all shadow-sm shadow-amber-500/20"
            title="Abrir simulador interactivo de transacciones externas"
          >
            <Activity className="w-4 h-4" />
            <span>Simulador de Transacciones</span>
          </button>
          <button
            onClick={() => setModalOpen(true)}
            className="tx-header__btn-primary"
          >
            <Plus className="tx-header__btn-icon" />
            <span>Nueva Transacción</span>
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="tx-search-bar">
        <div className="tx-search-bar__input-wrapper">
          <Search className="tx-search-bar__icon" />
          <input
            type="text"
            placeholder="Buscar por ID, usuario, método de pago o fragmento de hash..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="tx-search-bar__input"
          />
        </div>
        <div className="tx-search-bar__count">
          Total: <strong className="tx-search-bar__count-strong">{transaccionesFiltradas.length}</strong> registradas
        </div>
      </div>

      {/* Transactions Table */}
      {loading ? (
        <LoadingSpinner label="Consultando libro de transacciones..." size="lg" />
      ) : transaccionesFiltradas.length === 0 ? (
        <EmptyState
          icon={CreditCard}
          title="No se encontraron transacciones"
          description="Aún no hay transacciones en el sistema o no coinciden con los criterios de búsqueda."
        />
      ) : (
        <div className="tx-table-wrapper">
          <table className="tx-table">
            <thead className="tx-table__head">
              <tr>
                <th className="tx-table__th">ID</th>
                <th className="tx-table__th">Usuario</th>
                <th className="tx-table__th">Monto</th>
                <th className="tx-table__th">Método de Pago</th>
                <th className="tx-table__th">Fecha & Hora</th>
                <th className="tx-table__th">Hash HMAC-SHA256</th>
                <th className="tx-table__th">Estado</th>
                <th className="tx-table__th tx-table__th--right">Detalle</th>
              </tr>
            </thead>
            <tbody className="tx-table__body">
              {transaccionesFiltradas.map((tx) => (
                <tr key={tx.id} className="tx-table__row">
                  <td className="tx-table__td tx-table__td--id">#{tx.id}</td>
                  <td className="tx-table__td tx-table__td--user">Usuario #{tx.idUsuario}</td>
                  <td className="tx-table__td tx-table__td--amount">
                    ${Number(tx.valor).toLocaleString('es-CO')}
                  </td>
                  <td className="tx-table__td">
                    <span className="tx-table__payment-badge">
                      {tx.metodoPago}
                    </span>
                  </td>
                  <td className="tx-table__td tx-table__td--date">
                    {new Date(tx.fechaTransaccion).toLocaleString('es-CO')}
                  </td>
                  <td className="tx-table__td tx-table__td--hash">
                    <button
                      onClick={() => handleCopy(tx.hash)}
                      className="tx-table__hash-btn"
                      title="Copiar hash completo"
                    >
                      <KeyRound className="tx-table__hash-icon" />
                      <span className="tx-table__hash-text">{tx.hash ? `${tx.hash.substring(0, 10)}...` : 'N/A'}</span>
                    </button>
                  </td>
                  <td className="tx-table__td">
                    <StatusBadge status={tx.estado} />
                  </td>
                  <td className="tx-table__td tx-table__td--right">
                    <button
                      onClick={() => setSelectedTx(tx)}
                      className="tx-table__action-btn"
                      title="Inspeccionar transacción"
                    >
                      <ShieldCheck className="tx-table__action-icon" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal: New Transaction Simulation */}
      {modalOpen && (
        <div className="tx-modal-backdrop">
          <div className="tx-modal">
            <div className="tx-modal__header">
              <h3 className="tx-modal__title">
                <CreditCard className="tx-modal__title-icon" />
                Registrar Transacción con Firma HMAC
              </h3>
              <button onClick={() => setModalOpen(false)} className="tx-modal__close-btn">
                <X className="tx-modal__close-icon" />
              </button>
            </div>

            <form onSubmit={handleCreateTx} className="tx-modal__form">
              <div className="tx-form-group">
                <label className="tx-form-group__label">Usuario / Cliente *</label>
                <select
                  required
                  value={newTx.idUsuario}
                  onChange={(e) => setNewTx({ ...newTx, idUsuario: Number(e.target.value) })}
                  className="tx-form-group__select"
                >
                  {usuarios.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.nombre} (ID #{u.id})
                    </option>
                  ))}
                </select>
              </div>

              <div className="tx-form-group">
                <label className="tx-form-group__label">Monto de la Transacción ($ COP) *</label>
                <input
                  type="number"
                  required
                  min={1}
                  step="any"
                  value={newTx.valor}
                  onChange={(e) => setNewTx({ ...newTx, valor: Number(e.target.value) })}
                  className="tx-form-group__input"
                />
              </div>

              <div className="tx-form-group">
                <label className="tx-form-group__label">Método de Pago *</label>
                <select
                  required
                  value={newTx.metodoPago}
                  onChange={(e) => setNewTx({ ...newTx, metodoPago: e.target.value as MetodoPago })}
                  className="tx-form-group__select"
                >
                  <option value="EFECTIVO">EFECTIVO</option>
                  <option value="TARJETA_DEBITO">TARJETA_DEBITO</option>
                  <option value="TARJETA_CREDITO">TARJETA_CREDITO</option>
                  <option value="TRANSFERENCIA">TRANSFERENCIA</option>
                </select>
              </div>

              <div className="tx-modal__notice">
                <ShieldCheck className="tx-modal__notice-icon" />
                <span className="tx-modal__notice-text">
                  La petición calculará y enviará las cabeceras x-signature y x-timestamp en tiempo real.
                </span>
              </div>

              <div className="tx-modal__footer">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="tx-modal__btn-cancel"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={creatingTx}
                  className="tx-modal__btn-submit"
                >
                  {creatingTx ? 'Firmando y Enviando...' : 'Crear Transacción'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Transaction Cryptographic Inspector */}
      {selectedTx && (
        <div className="tx-modal-backdrop">
          <div className="tx-inspector-modal">
            <div className="tx-inspector-modal__header">
              <div className="tx-inspector-modal__header-left">
                <div className="tx-inspector-modal__icon-wrap">
                  <KeyRound className="tx-inspector-modal__icon" />
                </div>
                <div>
                  <h3 className="tx-inspector-modal__title">Inspección Criptográfica HMAC</h3>
                  <p className="tx-inspector-modal__subtitle">Transacción #{selectedTx.id}</p>
                </div>
              </div>
              <button onClick={() => setSelectedTx(null)} className="tx-modal__close-btn">
                <X className="tx-modal__close-icon" />
              </button>
            </div>

            <div className="tx-inspector-modal__content">
              <div className="tx-inspector-modal__meta-grid">
                <div className="tx-inspector-modal__meta-item">
                  <span className="tx-inspector-modal__meta-label">Cliente / Usuario:</span>
                  <span className="tx-inspector-modal__meta-value">ID #{selectedTx.idUsuario}</span>
                </div>
                <div className="tx-inspector-modal__meta-item">
                  <span className="tx-inspector-modal__meta-label">Monto Transado:</span>
                  <span className="tx-inspector-modal__meta-value tx-inspector-modal__meta-value--amount">
                    ${Number(selectedTx.valor).toLocaleString('es-CO')}
                  </span>
                </div>
                <div className="tx-inspector-modal__meta-item">
                  <span className="tx-inspector-modal__meta-label">Método de Pago:</span>
                  <span className="tx-inspector-modal__meta-value tx-inspector-modal__meta-value--mono">
                    {selectedTx.metodoPago}
                  </span>
                </div>
                <div className="tx-inspector-modal__meta-item">
                  <span className="tx-inspector-modal__meta-label">Estado:</span>
                  <StatusBadge status={selectedTx.estado} />
                </div>
              </div>

              <div className="tx-inspector-modal__hash-section">
                <div className="tx-inspector-modal__hash-header">
                  <span className="tx-inspector-modal__hash-label">Hash HMAC-SHA256 Registrado:</span>
                  <button
                    onClick={() => handleCopy(selectedTx.hash)}
                    className="tx-inspector-modal__copy-btn"
                  >
                    {copiedHash ? (
                      <Check className="tx-inspector-modal__copy-icon tx-inspector-modal__copy-icon--check" />
                    ) : (
                      <Copy className="tx-inspector-modal__copy-icon" />
                    )}
                    <span>{copiedHash ? 'Copiado' : 'Copiar'}</span>
                  </button>
                </div>
                <div className="tx-inspector-modal__hash-box">
                  {selectedTx.hash}
                </div>
              </div>

              <div className="tx-inspector-modal__integrity-card">
                <div className="tx-inspector-modal__integrity-title">
                  <ShieldCheck className="tx-inspector-modal__integrity-icon" />
                  <span>Integridad Verificada</span>
                </div>
                <p className="tx-inspector-modal__integrity-desc">
                  Este hash fue generado usando el algoritmo HMAC-SHA256 vinculando la marca de tiempo, usuario y monto con la clave secreta de APPRESSO.
                </p>
              </div>
            </div>

            <div className="tx-inspector-modal__footer">
              <button
                onClick={() => setSelectedTx(null)}
                className="tx-inspector-modal__btn-close"
              >
                Cerrar Inspector
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Transacciones Simulator Modal */}
      <TransaccionesSimulatorModal
        isOpen={botModalOpen}
        onClose={() => setBotModalOpen(false)}
        onSuccess={cargarDatos}
      />
    </div>
  );
};
