import React, { useEffect, useState } from 'react';
import { anomaliasApi, seguridadConfigApi, SecurityConfigDTO } from '../../api';
import { AnomaliaTransaccion } from '../../types/anomalia.types';
import { StatusBadge } from '../../components/common/StatusBadge';
import { StatCard } from '../../components/common/StatCard';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { EmptyState } from '../../components/common/EmptyState';
import { useToast } from '../../context/ToastContext';
import {
  ShieldAlert,
  Search,
  Eye,
  RefreshCw,
  AlertTriangle,
  Clock,
  Activity,
  CheckCircle2,
  X,
  Sliders,
  Zap,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { TransaccionesSimulatorModal } from '../../components/security/TransaccionesSimulatorModal';
import '../../styles/security.css';

export const AnomaliasPage: React.FC = () => {
  const [anomalias, setAnomalias] = useState<AnomaliaTransaccion[]>([]);
  const [config, setConfig] = useState<SecurityConfigDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [simulando, setSimulando] = useState(false);
  const [botModalOpen, setBotModalOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedAnomalia, setSelectedAnomalia] = useState<AnomaliaTransaccion | null>(null);
  // ─── Estado local para los campos numéricos editables ──────────────────────
  const [ventana, setVentana]       = useState<number>(3);
  const [maxTx, setMaxTx]           = useState<number>(3);
  const [umbralManana, setUmbralManana] = useState<number>(10);
  const [umbralTarde, setUmbralTarde]   = useState<number>(6);
  const [umbralNoche, setUmbralNoche]   = useState<number>(3);
  const [guardando, setGuardando]   = useState(false);

  const { showToast } = useToast();

  useEffect(() => {
    cargarAnomalias();
    cargarConfig();
  }, []);

  const cargarConfig = async () => {
    try {
      const data = await seguridadConfigApi.obtener();
      setConfig(data);
      // ─── Sincronizar estado local de edición con los valores del servidor ───
      setVentana(data.ventanaSegundos);
      setMaxTx(data.maxTransaccionesVentana);
      setUmbralManana(data.umbralManana ?? 10);
      setUmbralTarde(data.umbralTarde ?? 6);
      setUmbralNoche(data.umbralNoche ?? 3);
    } catch (_err) {
      // Ignorar si el endpoint no responde temporalmente
    }
  };

  const cargarAnomalias = async () => {
    try {
      setLoading(true);
      const res = await anomaliasApi.listar(1, 100);
      setAnomalias(res.data || []);
    } catch (error: any) {
      showToast({
        type: 'error',
        title: 'Error al consultar anomalías',
        description: error.message || 'No fue posible acceder al monitor de seguridad',
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleConfig = async (key: 'permitirHashExterno' | 'modoEstrictoHMAC') => {
    if (!config) return;
    try {
      const nuevoValor = !config[key];
      const updated = await seguridadConfigApi.actualizar({ [key]: nuevoValor });
      setConfig(updated);
      showToast({
        type: 'success',
        title: 'Configuración de seguridad actualizada',
        description: `${key === 'permitirHashExterno' ? 'Validación de hash externo' : 'Modo estricto HMAC'} ${nuevoValor ? 'HABILITADO' : 'DESHABILITADO'}`,
      });
    } catch (error: any) {
      showToast({
        type: 'error',
        title: 'Error al cambiar configuración',
        description: error.message,
      });
    }
  };

  // ─── Guarda los parámetros numéricos de la ventana deslizante ───────────────
  const guardarNumericos = async () => {
    try {
      setGuardando(true);
      const updated = await seguridadConfigApi.actualizar({
        ventanaSegundos: ventana,
        maxTransaccionesVentana: maxTx,
        umbralManana,
        umbralTarde,
        umbralNoche,
      });
      setConfig(updated);
      showToast({
        type: 'success',
        title: 'Parámetros de ventana actualizados',
        description: `Ventana: ${ventana}s · Máx tx: ${maxTx} · Mañana: ${umbralManana} · Tarde: ${umbralTarde} · Noche: ${umbralNoche}`,
      });
    } catch (error: any) {
      showToast({
        type: 'error',
        title: 'Error al guardar parámetros',
        description: error.message,
      });
    } finally {
      setGuardando(false);
    }
  };

  const ejecutarPruebaVentana = async () => {
    try {
      setSimulando(true);
      showToast({
        type: 'info',
        title: 'Disparando ráfaga de prueba',
        description: 'Enviando 5 compras rápidas para activar el umbral de la ventana deslizante...',
      });
      await seguridadConfigApi.simularRafaga(1, 5);
      await new Promise((r) => setTimeout(r, 1200));
      await cargarAnomalias();
      showToast({
        type: 'success',
        title: '¡Anomalía detectada con éxito!',
        description: 'El algoritmo de Ventana Deslizante identificó la ráfaga y generó el registro forense en tiempo real.',
      });
    } catch (error: any) {
      showToast({
        type: 'error',
        title: 'Error en la simulación',
        description: error.message,
      });
    } finally {
      setSimulando(false);
    }
  };

  const anomaliasFiltradas = anomalias.filter(
    (a) =>
      a.tipoAnomalia.toLowerCase().includes(search.toLowerCase()) ||
      String(a.idTransaccion).includes(search) ||
      a.nivelRiesgo.toLowerCase().includes(search.toLowerCase())
  );

  const totalCriticas = anomalias.filter((a) => a.nivelRiesgo === 'CRITICO').length;
  const totalAltas = anomalias.filter((a) => a.nivelRiesgo === 'ALTO').length;

  return (
    <div className="security-page">
      {/* Header */}
      <div className="security-header">
        <div className="security-header__info">
          <div className="security-breadcrumb">
            <Link to="/admin" className="security-breadcrumb__link">
              Seguridad
            </Link>
            <span className="security-breadcrumb__sep">/</span>
            <span className="security-breadcrumb__current">Detección de Anomalías</span>
          </div>
          <h1 className="security-header__title">
            <ShieldAlert className="security-header__icon" />
            Centro de Detección de Fraude & Anomalías
          </h1>
          <p className="security-header__desc">
            Monitoreo en tiempo real con algoritmo de Ventana Deslizante (Sliding Window) para ráfagas de transacciones.
          </p>
        </div>

        <div className="security-header__actions">
          <button
            onClick={() => {
              cargarAnomalias();
              cargarConfig();
            }}
            className="security-header__reload-btn"
            title="Recargar alertas de anomalías"
          >
            <RefreshCw className="security-header__reload-icon" />
          </button>
        </div>
      </div>

      {/* Control Panel: Motor de Seguridad & Auditoría */}
      <div className="security-config-panel">
        <div className="security-config-panel__header">
          <div className="security-config-panel__info">
            <h3 className="security-config-panel__title">
              <Sliders className="w-5 h-5" style={{ color: 'var(--brand-primary)' }} />
              Módulo de Control: Validación de Hash Externo &amp; Pruebas
            </h3>
            <p className="security-config-panel__desc">
              Controla la admisión de hashes provenientes de scripts externos (evaluación del profesor) y permite simular en vivo la detección por Ventana Deslizante.
            </p>
          </div>
          <div className="security-config-panel__actions flex items-center gap-2">
            <button
              onClick={() => setBotModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-semibold text-xs transition-colors shadow-sm shadow-amber-500/20"
              title="Abrir simulador interactivo de transacciones externas"
            >
              <Activity className="w-4 h-4" />
              <span>Simulador de Transacciones</span>
            </button>
            <button
              onClick={ejecutarPruebaVentana}
              disabled={simulando}
              className="security-config-panel__btn-simular"
              title="Disparar ráfaga de 5 transacciones para probar la ventana deslizante"
            >
              {simulando ? (
                <><RefreshCw className="w-4 h-4 animate-spin" /> Inyectando Ráfaga...</>
              ) : (
                <><Zap className="w-4 h-4" /> ⚡ Probar Ventana Deslizante</>
              )}
            </button>
          </div>
        </div>

        {/* ─── Toggles on/off ──────────────────────────────────────────────── */}
        <div className="security-config-panel__switches">
          <div className="security-toggle-card">
            <div className="security-toggle-card__text">
              <span className="security-toggle-card__label">Permitir &amp; Validar Hash Externo</span>
              <span className="security-toggle-card__sub">
                Acepta transacciones con hash enviado por scripts externos y valida su legitimidad con la clave del .env.
              </span>
            </div>
            <button
              onClick={() => toggleConfig('permitirHashExterno')}
              className={`security-switch${config?.permitirHashExterno ? ' security-switch--active' : ''}`}
              title="Alternar admisión de hash externo"
            >
              <span className="security-switch__thumb" />
            </button>
          </div>

          <div className="security-toggle-card">
            <div className="security-toggle-card__text">
              <span className="security-toggle-card__label">Modo Estricto HMAC (Headers HTTP)</span>
              <span className="security-toggle-card__sub">
                Si está apagado, permite que el profesor envíe tanto JSON plano como peticiones con hash.
              </span>
            </div>
            <button
              onClick={() => toggleConfig('modoEstrictoHMAC')}
              className={`security-switch${config?.modoEstrictoHMAC ? ' security-switch--active' : ''}`}
              title="Alternar modo estricto HMAC"
            >
              <span className="security-switch__thumb" />
            </button>
          </div>
        </div>

        {/* ─── Parámetros numéricos de la Ventana Deslizante ──────────────── */}
        <div style={{ marginTop: '1.25rem', paddingTop: '1.25rem', borderTop: '1px solid var(--border)' }}>
          <p className="security-config-panel__desc" style={{ marginBottom: '0.75rem', fontWeight: 600, color: 'var(--text-primary)' }}>
            Parámetros de la Ventana Deslizante
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
            <div className="security-toggle-card" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '0.4rem' }}>
              <span className="security-toggle-card__label">Ventana temporal (segundos)</span>
              <span className="security-toggle-card__sub">Duración de la ventana deslizante por usuario.</span>
              <input
                type="number" min={1} max={300} value={ventana}
                onChange={(e) => setVentana(Number(e.target.value))}
                className="security-search-bar__input"
                style={{ marginTop: '0.25rem', width: '100%', fontWeight: 700, fontFamily: 'monospace' }}
              />
            </div>
            <div className="security-toggle-card" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '0.4rem' }}>
              <span className="security-toggle-card__label">Umbral máx. transacciones</span>
              <span className="security-toggle-card__sub">Cuántas tx dentro de la ventana disparan la alerta.</span>
              <input
                type="number" min={1} max={100} value={maxTx}
                onChange={(e) => setMaxTx(Number(e.target.value))}
                className="security-search-bar__input"
                style={{ marginTop: '0.25rem', width: '100%', fontWeight: 700, fontFamily: 'monospace' }}
              />
            </div>
          </div>

          <p className="security-config-panel__desc" style={{ marginBottom: '0.5rem', fontWeight: 600, color: 'var(--text-primary)' }}>
            Umbrales por Franja Horaria
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
            <div className="security-toggle-card" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '0.4rem' }}>
              <span className="security-toggle-card__label">🌅 Mañana (05:00–12:00)</span>
              <input
                type="number" min={1} max={100} value={umbralManana}
                onChange={(e) => setUmbralManana(Number(e.target.value))}
                className="security-search-bar__input"
                style={{ marginTop: '0.25rem', width: '100%', fontWeight: 700, fontFamily: 'monospace' }}
              />
            </div>
            <div className="security-toggle-card" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '0.4rem' }}>
              <span className="security-toggle-card__label">☀️ Tarde (12:00–20:00)</span>
              <input
                type="number" min={1} max={100} value={umbralTarde}
                onChange={(e) => setUmbralTarde(Number(e.target.value))}
                className="security-search-bar__input"
                style={{ marginTop: '0.25rem', width: '100%', fontWeight: 700, fontFamily: 'monospace' }}
              />
            </div>
            <div className="security-toggle-card" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '0.4rem' }}>
              <span className="security-toggle-card__label">🌙 Noche (20:00–05:00)</span>
              <input
                type="number" min={1} max={100} value={umbralNoche}
                onChange={(e) => setUmbralNoche(Number(e.target.value))}
                className="security-search-bar__input"
                style={{ marginTop: '0.25rem', width: '100%', fontWeight: 700, fontFamily: 'monospace' }}
              />
            </div>
          </div>

          <button
            onClick={guardarNumericos}
            disabled={guardando}
            className="security-config-panel__btn-simular"
            style={{ width: '100%', justifyContent: 'center' }}
          >
            {guardando ? (
              <><RefreshCw className="w-4 h-4 animate-spin" /> Guardando...</>
            ) : (
              <><CheckCircle2 className="w-4 h-4" /> Guardar Parámetros de Ventana</>
            )}
          </button>
        </div>
      </div>


      {/* Metrics Row */}
      <div className="security-metrics-grid">
        <StatCard
          title="Total Anomalías"
          value={anomalias.length}
          subtitle="Registradas por el motor de fraude"
          icon={Activity}
          color="purple"
        />
        <StatCard
          title="Nivel Crítico"
          value={totalCriticas}
          subtitle="Ráfagas sospechosas de alta severidad"
          icon={ShieldAlert}
          color="rose"
        />
        <StatCard
          title="Nivel Alto / Medio"
          value={totalAltas}
          subtitle="Alertas preventivas de seguridad"
          icon={AlertTriangle}
          color="amber"
        />
      </div>

      {/* How Sliding Window Works Notice */}
      <div className="security-window-card">
        <div className="security-window-card__icon-wrap">
          <Clock className="security-window-card__icon" />
        </div>
        <div className="security-window-card__content">
          <h4 className="security-window-card__title">¿Cómo funciona la Ventana Deslizante en APPRESSO?</h4>
          <p className="security-window-card__desc">
            Cada vez que un usuario realiza una transacción, el servicio de seguridad evalúa una ventana temporal configurable ({config?.ventanaSegundos || 30} segundos). Si se excede el umbral ({config?.maxTransaccionesVentana || 3} transacciones), se genera automáticamente un reporte forense inmutable con la secuencia de compras involucradas.
          </p>
        </div>
      </div>

      {/* Search and Table */}
      <div className="security-search-bar">
        <div className="security-search-bar__input-wrapper">
          <Search className="security-search-bar__icon" />
          <input
            type="text"
            placeholder="Buscar por tipo de anomalía, ID de transacción o nivel de riesgo..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="security-search-bar__input"
          />
        </div>
        <div className="security-search-bar__count">
          Total alertas: <strong className="security-search-bar__count-strong">{anomaliasFiltradas.length}</strong>
        </div>
      </div>

      {/* Table Container */}
      <div className="security-table-wrapper">
        {loading ? (
          <div className="security-loading">
            <LoadingSpinner size="lg" label="Analizando historial forense..." />
          </div>
        ) : anomaliasFiltradas.length === 0 ? (
          <EmptyState
            title="Sin anomalías registradas"
            description={
              search
                ? 'No se encontraron alertas que coincidan con los criterios de búsqueda.'
                : 'El sistema no ha detectado transacciones fraudulentas o ráfagas anómalas en este periodo.'
            }
            icon={ShieldAlert}
          />
        ) : (
          <div className="security-table-scroll">
            <table className="security-table">
              <thead className="security-thead">
                <tr>
                  <th className="security-th">ID Alerta</th>
                  <th className="security-th">TX Origen</th>
                  <th className="security-th">Tipo Anomalía</th>
                  <th className="security-th">Nivel de Riesgo</th>
                  <th className="security-th">Ráfaga Detectada</th>
                  <th className="security-th">Ventana</th>
                  <th className="security-th">Fecha Detección</th>
                  <th className="security-th security-th--right">Acciones</th>
                </tr>
              </thead>
              <tbody className="security-tbody">
                {anomaliasFiltradas.map((anomalia) => (
                  <tr key={anomalia.id} className="security-tr">
                    <td className="security-td security-td--id">
                      #{anomalia.id}
                    </td>
                    <td className="security-td">
                      <span className="security-tx-link">
                        TX #{anomalia.idTransaccion}
                      </span>
                    </td>
                    <td className="security-td">
                      <span className="security-type-badge">
                        {anomalia.tipoAnomalia}
                      </span>
                    </td>
                    <td className="security-td">
                      <StatusBadge status={anomalia.nivelRiesgo} />
                    </td>
                    <td className="security-td">
                      <div className="security-burst">
                        <strong className="security-burst__number">{anomalia.cantidadTransacciones}</strong>
                        <span className="security-burst__label">compras</span>
                      </div>
                    </td>
                    <td className="security-td">
                      <span className="security-window-badge">
                        {anomalia.ventanaSegundos}s
                      </span>
                    </td>
                    <td className="security-td security-td--date">
                      {new Date(anomalia.fechaCreacion).toLocaleString('es-CO')}
                    </td>
                    <td className="security-td security-td--actions">
                      <button
                        onClick={() => setSelectedAnomalia(anomalia)}
                        className="security-action-btn"
                        title="Ver detalle forense"
                      >
                        <Eye className="security-action-icon" />
                        Auditar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Forensic Modal */}
      {selectedAnomalia && (
        <div className="security-modal-backdrop">
          <div className="security-modal">
            <div className="security-modal__header">
              <div className="security-modal__title-group">
                <div className="security-modal__icon-wrap">
                  <ShieldAlert className="security-modal__header-icon" />
                </div>
                <div>
                  <h3 className="security-modal__title">Auditoría Forense de Anomalía #{selectedAnomalia.id}</h3>
                  <p className="security-modal__subtitle">
                    Evidencia capturada en tiempo real por el algoritmo de Ventana Deslizante
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedAnomalia(null)}
                className="security-modal__close-btn"
              >
                <X className="security-modal__close-icon" />
              </button>
            </div>

            <div className="security-modal__body">
              {/* Alert Metrics Chip Row */}
              <div className="security-modal__chips-grid">
                <div className="security-modal__chip">
                  <span className="security-modal__chip-label">Tipo de Anomalía</span>
                  <span className="security-modal__chip-value security-modal__chip-value--rose">
                    {selectedAnomalia.tipoAnomalia}
                  </span>
                </div>
                <div className="security-modal__chip">
                  <span className="security-modal__chip-label">Nivel de Riesgo</span>
                  <div>
                    <StatusBadge status={selectedAnomalia.nivelRiesgo} />
                  </div>
                </div>
                <div className="security-modal__chip">
                  <span className="security-modal__chip-label">TX en Ventana</span>
                  <span className="security-modal__chip-value security-modal__chip-value--sky">
                    {selectedAnomalia.cantidadTransacciones} operaciones
                  </span>
                </div>
                <div className="security-modal__chip">
                  <span className="security-modal__chip-label">Lapso Evaluado</span>
                  <span className="security-modal__chip-value">
                    {selectedAnomalia.ventanaSegundos} segundos
                  </span>
                </div>
              </div>

              {/* Transactions Evidence Table */}
              <div className="security-modal__section">
                <h4 className="security-modal__section-title">
                  Secuencia de Transacciones Involucradas en la Ráfaga:
                </h4>
                <div className="security-modal__table-wrapper">
                  <table className="security-modal__table">
                    <thead className="security-modal__table-head">
                      <tr>
                        <th className="security-modal__table-th">ID Transacción</th>
                        <th className="security-modal__table-th">Método de Pago</th>
                        <th className="security-modal__table-th">ID Usuario</th>
                        <th className="security-modal__table-th">Valor</th>
                        <th className="security-modal__table-th">Estado</th>
                        <th className="security-modal__table-th">Marca de Tiempo</th>
                      </tr>
                    </thead>
                    <tbody className="security-modal__table-body">
                      {Array.isArray(selectedAnomalia.transaccionesInvolucradas) &&
                      selectedAnomalia.transaccionesInvolucradas.length > 0 ? (
                        selectedAnomalia.transaccionesInvolucradas.map((tx: any, idx: number) => (
                          <tr key={idx} className="security-modal__table-row">
                            <td className="security-modal__table-td security-modal__table-td--tx">
                              TX #{tx.idTransaccion || 'N/A'}
                            </td>
                            <td className="security-modal__table-td">
                              {tx.metodoPago || tx.numeroFactura || 'TARJETA_CREDITO'}
                            </td>
                            <td className="security-modal__table-td security-modal__table-td--user">
                              Usuario #{tx.idUsuario || selectedAnomalia.idTransaccion}
                            </td>
                            <td className="security-modal__table-td security-modal__table-td--price">
                              ${Number(tx.valor || 0).toLocaleString('es-CO')} COP
                            </td>
                            <td className="security-modal__table-td">
                              <StatusBadge status={tx.estado || 'PENDIENTE'} />
                            </td>
                            <td className="security-modal__table-td security-modal__table-td--date">
                              {tx.fechaTransaccion
                                ? new Date(tx.fechaTransaccion).toLocaleTimeString('es-CO')
                                : 'Reciente'}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={6} className="security-modal__empty-text">
                            No se desglosó el snapshot de transacciones individuales
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="security-modal__footer">
              <button
                onClick={() => setSelectedAnomalia(null)}
                className="security-modal__dismiss-btn"
              >
                Cerrar Reporte
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Transacciones Simulator Modal */}
      <TransaccionesSimulatorModal
        isOpen={botModalOpen}
        onClose={() => setBotModalOpen(false)}
        onSuccess={() => {
          cargarAnomalias();
          cargarConfig();
        }}
      />
    </div>
  );
};
