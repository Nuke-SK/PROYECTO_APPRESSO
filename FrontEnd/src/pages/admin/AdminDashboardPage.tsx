import React, { useEffect, useState } from 'react';
import { dashboardApi, DashboardStatsData, productosApi, seguridadConfigApi, SecurityConfigDTO } from '../../api';
import { StatCard } from '../../components/common/StatCard';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { useToast } from '../../context/ToastContext';
import {
  Package,
  ShieldAlert,
  ArrowRight,
  TrendingUp,
  AlertTriangle,
  Layers,
  Activity,
  DollarSign,
  Users,
  Clock,
  Zap,
  Repeat,
  BarChart3,
  CreditCard,
  RefreshCw,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import '../../styles/admin.css';

// ─── HELPERS ──────────────────────────────────────────────────────────────────

const NIVEL_CLASS: Record<string, string> = {
  CRITICO: 'admin-risk-item__level--critico',
  ALTO:    'admin-risk-item__level--alto',
  MEDIO:   'admin-risk-item__level--medio',
  BAJO:    'admin-risk-item__level--bajo',
};

const NIVEL_BAR: Record<string, string> = {
  CRITICO: 'admin-risk-item__bar--critico',
  ALTO:    'admin-risk-item__bar--alto',
  MEDIO:   'admin-risk-item__bar--medio',
  BAJO:    'admin-risk-item__bar--bajo',
};

// ─── COMPONENT ────────────────────────────────────────────────────────────────

export const AdminDashboardPage: React.FC = () => {
  const [periodo, setPeriodo] = useState<'hoy' | 'semana' | 'mes'>('hoy');
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<DashboardStatsData | null>(null);
  const [config, setConfig] = useState<SecurityConfigDTO | null>(null);
  const [stockCriticoCount, setStockCriticoCount] = useState(0);

  const { showToast } = useToast();

  useEffect(() => {
    cargarDatos(periodo);
  }, [periodo]);

  const cargarDatos = async (p: 'hoy' | 'semana' | 'mes') => {
    try {
      setLoading(true);
      const [statsRes, prodsRes, configRes] = await Promise.all([
        dashboardApi.obtenerEstadisticas(p),
        productosApi.listar(1, 100),
        seguridadConfigApi.obtener().catch(() => null),
      ]);

      setDashboardData(statsRes);
      if (configRes) setConfig(configRes);

      const prods = prodsRes.data || [];
      const critico = prods.filter((prod) => prod.stock < 5).length;
      setStockCriticoCount(critico);
    } catch (error: any) {
      showToast({
        type: 'error',
        title: 'Error al cargar el dashboard',
        description: error.message || 'No fue posible consultar las métricas agregadas',
      });
    } finally {
      setLoading(false);
    }
  };

  const resumen    = dashboardData?.resumen;
  const comparativo = dashboardData?.comparativoPeriodos;

  // ─── RENDER ─────────────────────────────────────────────────────────────────

  return (
    <div className="admin-dashboard">

      {/* ─── Header ──────────────────────────────────────────────── */}
      <div className="admin-dashboard__header flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="admin-dashboard__title">
            <Activity className="admin-dashboard__title-icon" />
            Dashboard &amp; Monitor de Anomalías
          </h1>
          <p className="admin-dashboard__description">
            Visualización agregada · Ventana Deslizante por usuario ({config?.ventanaSegundos ?? 3}s / {config?.maxTransaccionesVentana ?? 3} tx)
          </p>
        </div>

        {/* Period Selector */}
        <div className="admin-period-selector">
          {(['hoy', 'semana', 'mes'] as const).map((p) => {
            const label     = p === 'hoy' ? 'Hoy' : p === 'semana' ? 'Esta semana' : 'Este mes';
            const anomalias = p === 'hoy' ? comparativo?.hoy.anomalias : p === 'semana' ? comparativo?.semana.anomalias : comparativo?.mes.anomalias;
            return (
              <button
                key={p}
                onClick={() => setPeriodo(p)}
                className={`admin-period-selector__btn${periodo === p ? ' admin-period-selector__btn--active' : ''}`}
              >
                {label} ({anomalias ?? 0})
              </button>
            );
          })}
          <button
            onClick={() => cargarDatos(periodo)}
            className="admin-period-selector__refresh"
            title="Recargar métricas"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {loading ? (
        <LoadingSpinner label="Calculando estadísticas en tiempo real..." size="lg" />
      ) : (
        <>
          {/* ─── KPI Grid — Fila 1 ───────────────────────────────── */}
          <div className="admin-dashboard__metrics-grid">
            <StatCard
              title="Total Transacciones"
              value={resumen?.totalTransacciones || 0}
              subtitle={`Día: ${comparativo?.hoy.transacciones} | Sem: ${comparativo?.semana.transacciones} | Mes: ${comparativo?.mes.transacciones}`}
              icon={Activity}
              color="sky"
            />
            <StatCard
              title="Total Anomalías"
              value={resumen?.totalAnomalias || 0}
              subtitle={`Día: ${comparativo?.hoy.anomalias} | Sem: ${comparativo?.semana.anomalias} | Mes: ${comparativo?.mes.anomalias}`}
              icon={ShieldAlert}
              color={(resumen?.totalAnomalias || 0) > 0 ? 'rose' : 'purple'}
            />
            <StatCard
              title="Tasa de Anomalías (%)"
              value={`${resumen?.porcentajeAnomalias || 0}%`}
              subtitle="Porcentaje de compras con alerta"
              icon={TrendingUp}
              color={(resumen?.porcentajeAnomalias || 0) > 20 ? 'rose' : 'emerald'}
            />
            <StatCard
              title="Múltiples Transacciones"
              value={resumen?.burstsMultiplesTransacciones || 0}
              subtitle="Ráfagas masivas (>= 3 compras)"
              icon={Zap}
              color="purple"
            />
          </div>

          {/* ─── KPI Grid — Fila 2 ───────────────────────────────── */}
          <div className="admin-dashboard__metrics-grid">
            <StatCard
              title="Usuarios Afectados"
              value={resumen?.usuariosAfectados || 0}
              subtitle="Clientes con banderas de riesgo"
              icon={Users}
              color="purple"
            />
            <StatCard
              title="Valor Sospechoso"
              value={`$${(resumen?.valorTotalSospechoso || 0).toLocaleString('es-CO')} COP`}
              subtitle="Monto en transacciones alertadas"
              icon={DollarSign}
              color="rose"
            />
            <StatCard
              title="Promedio Tx / Usuario"
              value={resumen?.promedioTransaccionesPorUsuario || 0}
              subtitle="Intensidad promedio por cliente"
              icon={Repeat}
              color="sky"
            />
            <StatCard
              title="Stock Crítico (< 5)"
              value={stockCriticoCount}
              subtitle="Productos a reabastecer"
              icon={AlertTriangle}
              color={stockCriticoCount > 0 ? 'rose' : 'sky'}
            />
          </div>

          {/* ─── Recurrentes + Usuarios ───────────────────────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* Casos más recurrentes */}
            <div className="admin-analytics-panel flex flex-col justify-between">
              <div>
                <h3 className="admin-analytics-panel__title">
                  <ShieldAlert className="admin-analytics-panel__title-icon--danger admin-analytics-panel__title-icon" />
                  Casos más Recurrentes
                </h3>
                <div className="space-y-3">
                  {resumen?.casosMasRecurrentes && resumen.casosMasRecurrentes.length > 0 ? (
                    resumen.casosMasRecurrentes.map((item, idx) => (
                      <div key={idx} className="admin-case-item">
                        <div className="admin-case-item__header">
                          <span className="admin-case-item__tipo">{item.tipo}</span>
                          <span className="admin-case-item__badge">{item.cantidad} casos ({item.porcentaje}%)</span>
                        </div>
                        <div className="admin-case-item__bar-track">
                          <div className="admin-case-item__bar-fill" style={{ width: `${Math.min(item.porcentaje, 100)}%` }} />
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm italic" style={{ color: 'var(--text-muted)' }}>
                      No hay anomalías registradas en este período.
                    </p>
                  )}
                </div>
              </div>
              <div className="admin-analytics-panel__footer">
                Reglas: Ventana Deslizante &amp; firma HMAC.
              </div>
            </div>

            {/* Usuarios Recurrentes */}
            <div className="admin-analytics-panel flex flex-col justify-between lg:col-span-2">
              <div>
                <h3 className="admin-analytics-panel__title">
                  <Users className="admin-analytics-panel__title-icon" />
                  Usuarios Recurrentes (Top Actividad &amp; Anomalías)
                </h3>
                <div className="overflow-x-auto">
                  <table className="admin-users-table">
                    <thead className="admin-users-table__head">
                      <tr>
                        <th className="admin-users-table__th">Usuario</th>
                        <th className="admin-users-table__th">Email</th>
                        <th className="admin-users-table__th text-center">Transacciones</th>
                        <th className="admin-users-table__th text-center">Anomalías</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dashboardData?.usuariosRecurrentes && dashboardData.usuariosRecurrentes.length > 0 ? (
                        dashboardData.usuariosRecurrentes.map((u) => (
                          <tr key={u.idUsuario} className="admin-users-table__row">
                            <td className="admin-users-table__td admin-users-table__td--name">{u.nombreUsuario}</td>
                            <td className="admin-users-table__td admin-users-table__td--email">{u.emailUsuario}</td>
                            <td className="admin-users-table__td admin-users-table__td--tx">{u.totalTransacciones}</td>
                            <td className="admin-users-table__td text-center">
                              {u.totalAnomalias > 0 ? (
                                <span className="admin-users-table__anomaly-badge">{u.totalAnomalias} ⚠</span>
                              ) : (
                                <span style={{ color: 'var(--text-light)' }}>0</span>
                              )}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={4} className="admin-users-table__td text-center" style={{ color: 'var(--text-muted)' }}>
                            Sin usuarios registrados en este lapso.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
              <div className="admin-analytics-panel__footer">
                <Clock className="w-4 h-4 shrink-0" />
                Las ventanas deslizantes se evalúan de forma independiente por cada usuario.
              </div>
            </div>
          </div>

          {/* ─── Heatmap 24h ─────────────────────────────────────── */}
          <div className="admin-analytics-panel">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 mb-2">
              <div>
                <h3 className="admin-analytics-panel__title" style={{ marginBottom: '0.25rem' }}>
                  <BarChart3 className="admin-analytics-panel__title-icon" />
                  Distribución por Hora — Heatmap 24h
                </h3>
                <p className="admin-analytics-panel__desc">
                  Intensidad de color = cantidad de anomalías detectadas por hora (00:00 a 23:00).
                </p>
              </div>
            </div>

            <div className="admin-heatmap">
              {dashboardData?.distribucionPorHora.map((h) => {
                const tieneAnom = h.anomalias > 0;
                const tieneTx   = h.transacciones > 0;
                let cellClass = 'admin-heatmap__cell';
                if (tieneAnom) {
                  cellClass += h.anomalias > 3 ? ' admin-heatmap__cell--anom-high' : ' admin-heatmap__cell--anom';
                } else if (tieneTx) {
                  cellClass += ' admin-heatmap__cell--tx';
                }
                return (
                  <div
                    key={h.hora}
                    className={cellClass}
                    title={`Hora ${h.etiqueta}: ${h.transacciones} transacciones, ${h.anomalias} anomalías`}
                  >
                    <span className="admin-heatmap__cell-label">{h.etiqueta}</span>
                    <span className="admin-heatmap__cell-value">
                      {h.anomalias > 0 ? `${h.anomalias}⚠` : h.transacciones}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ─── Nivel de Riesgo + Métodos de Pago ───────────────── */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            {/* Anomalías por Nivel */}
            <div className="admin-analytics-panel">
              <h3 className="admin-analytics-panel__title">
                <AlertTriangle className="admin-analytics-panel__title-icon--danger admin-analytics-panel__title-icon" />
                Anomalías por Nivel de Riesgo
              </h3>
              <div className="space-y-3">
                {dashboardData?.anomaliasPorNivel.map((item) => (
                  <div key={item.nivel} className="admin-risk-item">
                    <div className="admin-risk-item__header">
                      <span className={NIVEL_CLASS[item.nivel] ?? 'font-bold'}>
                        Nivel {item.nivel}
                      </span>
                      <span className="admin-risk-item__count">{item.cantidad} alertas ({item.porcentaje}%)</span>
                    </div>
                    <div className="admin-risk-item__bar-track">
                      <div
                        className={NIVEL_BAR[item.nivel] ?? 'admin-risk-item__bar--bajo'}
                        style={{ width: `${Math.min(item.porcentaje, 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Métodos de Pago */}
            <div className="admin-analytics-panel">
              <h3 className="admin-analytics-panel__title">
                <CreditCard className="admin-analytics-panel__title-icon" />
                Distribución por Métodos de Pago
              </h3>
              <div className="space-y-3">
                {dashboardData?.metodosPago && dashboardData.metodosPago.length > 0 ? (
                  dashboardData.metodosPago.map((item) => (
                    <div key={item.metodo} className="admin-payment-item">
                      <div>
                        <span className="admin-payment-item__name">{item.metodo}</span>
                        <span className="admin-payment-item__total">{item.totalTransacciones} operaciones</span>
                      </div>
                      <div>
                        <span className="admin-payment-item__anomaly">{item.transaccionesAnomalas} anomalías</span>
                        <span className="admin-payment-item__rate">
                          {item.totalTransacciones > 0
                            ? ((item.transaccionesAnomalas / item.totalTransacciones) * 100).toFixed(0)
                            : 0}% riesgo
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm italic" style={{ color: 'var(--text-muted)' }}>
                    No hay transacciones registradas.
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* ─── Módulos de Navegación Rápida ────────────────────── */}
          <div className="admin-dashboard__modules-grid">
            <div className="admin-module-card admin-module-card--products">
              <div className="admin-module-card__content">
                <div className="admin-module-card__icon-wrapper admin-module-card__icon-wrapper--products">
                  <Package className="admin-module-card__icon" />
                </div>
                <h3 className="admin-module-card__title">Gestión de Productos</h3>
                <p className="admin-module-card__description">
                  Crea productos, ajusta existencias, define precios oficiales protegidos y vincula subcategorías.
                </p>
              </div>
              <Link to="/admin/productos" className="admin-module-card__link admin-module-card__link--products">
                <span className="admin-module-card__link-text">Ir al Inventario de Productos</span>
                <ArrowRight className="admin-module-card__link-icon" />
              </Link>
            </div>

            <div className="admin-module-card admin-module-card--categories">
              <div className="admin-module-card__content">
                <div className="admin-module-card__icon-wrapper admin-module-card__icon-wrapper--categories">
                  <Layers className="admin-module-card__icon" />
                </div>
                <h3 className="admin-module-card__title">Categorías &amp; Jerarquías</h3>
                <p className="admin-module-card__description">
                  Organiza la taxonomía del catálogo en Categorías Padre y ramas de Subcategorías.
                </p>
              </div>
              <Link to="/admin/categorias" className="admin-module-card__link admin-module-card__link--categories">
                <span className="admin-module-card__link-text">Administrar Categorías</span>
                <ArrowRight className="admin-module-card__link-icon" />
              </Link>
            </div>

            <div className="admin-module-card admin-module-card--security">
              <div className="admin-module-card__content">
                <div className="admin-module-card__icon-wrapper admin-module-card__icon-wrapper--security">
                  <ShieldAlert className="admin-module-card__icon" />
                </div>
                <h3 className="admin-module-card__title">Centro de Monitoreo de Seguridad</h3>
                <p className="admin-module-card__description">
                  Inspecciona transacciones sospechosas detectadas por la Ventana Deslizante en tiempo real.
                </p>
              </div>
              <Link to="/seguridad" className="admin-module-card__link admin-module-card__link--security">
                <span className="admin-module-card__link-text">Ver Alertas de Seguridad</span>
                <ArrowRight className="admin-module-card__link-icon" />
              </Link>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
