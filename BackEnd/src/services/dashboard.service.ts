import { db, transacciones, anomaliasTransacciones, usuarios, facturacion } from '@appresso/database';
import { sql, gte, eq, count, sum, desc } from 'drizzle-orm';
import { logger } from '../utils/logger';

// DTO E INTERFACES PARA EL DASHBOARD DE ESTADÍSTICAS
export interface DashboardStatsResponseDTO {
  periodo: 'hoy' | 'semana' | 'mes';
  resumen: {
    totalTransacciones: number;
    totalAnomalias: number;
    porcentajeAnomalias: number;
    usuariosAfectados: number;
    valorTotalSospechoso: number;
    promedioTransaccionesPorUsuario: number;
    casosMasRecurrentes: { tipo: string; cantidad: number; porcentaje: number }[];
    burstsMultiplesTransacciones: number;
  };
  comparativoPeriodos: {
    hoy: { transacciones: number; anomalias: number };
    semana: { transacciones: number; anomalias: number };
    mes: { transacciones: number; anomalias: number };
  };
  usuariosRecurrentes: {
    idUsuario: number;
    nombreUsuario: string;
    emailUsuario: string;
    totalTransacciones: number;
    totalAnomalias: number;
  }[];
  distribucionPorHora: { hora: number; etiqueta: string; transacciones: number; anomalias: number }[];
  anomaliasPorNivel: { nivel: string; cantidad: number; porcentaje: number }[];
  metodosPago: { metodo: string; totalTransacciones: number; transaccionesAnomalas: number }[];
}

export class DashboardService {

  // ─── CÁLCULO DE FECHA DE INICIO SEGÚN EL PERÍODO ──────────────────────────────
  private obtenerFechaInicio(periodo: 'hoy' | 'semana' | 'mes'): Date {
    const ahora = new Date();
    if (periodo === 'hoy') {
      const hoy = new Date(ahora);
      hoy.setHours(0, 0, 0, 0);
      return hoy;
    }
    if (periodo === 'semana') {
      const hace7Dias = new Date(ahora);
      hace7Dias.setDate(ahora.getDate() - 7);
      hace7Dias.setHours(0, 0, 0, 0);
      return hace7Dias;
    }
    // Mes
    const inicioMes = new Date(ahora.getFullYear(), ahora.getMonth(), 1);
    return inicioMes;
  }

  // ─── OBTENER ESTADÍSTICAS COMPLETAS DEL DASHBOARD ─────────────────────────────
  async obtenerEstadisticas(periodo: 'hoy' | 'semana' | 'mes' = 'hoy'): Promise<DashboardStatsResponseDTO> {
    const fechaInicio = this.obtenerFechaInicio(periodo);

    // 1. CONSULTAR TRANSACCIONES Y ANOMALÍAS EN EL PERÍODO SELECCIONADO
    const todasTransacciones = await db
      .select()
      .from(transacciones)
      .where(gte(transacciones.fechaTransaccion, fechaInicio));

    const todasAnomalias = await db
      .select()
      .from(anomaliasTransacciones)
      .where(gte(anomaliasTransacciones.fechaCreacion, fechaInicio));

    const todosUsuarios = await db.select().from(usuarios);

    // 2. CÁLCULO DE COMPARATIVO DÍA / SEMANA / MES
    const inicioHoy = this.obtenerFechaInicio('hoy');
    const inicioSemana = this.obtenerFechaInicio('semana');
    const inicioMes = this.obtenerFechaInicio('mes');

    const txsHoy = await db.select({ count: count() }).from(transacciones).where(gte(transacciones.fechaTransaccion, inicioHoy));
    const txsSemana = await db.select({ count: count() }).from(transacciones).where(gte(transacciones.fechaTransaccion, inicioSemana));
    const txsMes = await db.select({ count: count() }).from(transacciones).where(gte(transacciones.fechaTransaccion, inicioMes));

    const anomHoy = await db.select({ count: count() }).from(anomaliasTransacciones).where(gte(anomaliasTransacciones.fechaCreacion, inicioHoy));
    const anomSemana = await db.select({ count: count() }).from(anomaliasTransacciones).where(gte(anomaliasTransacciones.fechaCreacion, inicioSemana));
    const anomMes = await db.select({ count: count() }).from(anomaliasTransacciones).where(gte(anomaliasTransacciones.fechaCreacion, inicioMes));

    // 3. MÉTRICAS CLAVE
    const totalTx = todasTransacciones.length;
    const totalAnom = todasAnomalias.length;
    const pctAnom = totalTx > 0 ? Number(((totalAnom / totalTx) * 100).toFixed(1)) : 0;

    // Usuarios involucrados en anomalías
    const userIdsInvolucrados = new Set<number>();
    let valorSospechosoAcc = 0;

    todasAnomalias.forEach((a) => {
      if (Array.isArray(a.transaccionesInvolucradas)) {
        a.transaccionesInvolucradas.forEach((txInvolucrada: any) => {
          if (txInvolucrada.idUsuario) {
            userIdsInvolucrados.add(Number(txInvolucrada.idUsuario));
          }
          if (txInvolucrada.valor) {
            valorSospechosoAcc += Number(txInvolucrada.valor);
          }
        });
      }
    });

    const usuariosAfectados = userIdsInvolucrados.size;

    // Promedio de transacciones por usuario
    const totalUsuariosActivos = Math.max(todosUsuarios.length, 1);
    const promTxPorUsuario = Number((totalTx / totalUsuariosActivos).toFixed(2));

    // Casos más recurrentes por tipo de anomalía
    const conteoTipos: Record<string, number> = {};
    todasAnomalias.forEach((a) => {
      conteoTipos[a.tipoAnomalia] = (conteoTipos[a.tipoAnomalia] || 0) + 1;
    });

    const casosMasRecurrentes = Object.entries(conteoTipos)
      .map(([tipo, cantidad]) => ({
        tipo,
        cantidad,
        porcentaje: totalAnom > 0 ? Number(((cantidad / totalAnom) * 100).toFixed(1)) : 0,
      }))
      .sort((a, b) => b.cantidad - a.cantidad);

    // Múltiples transacciones en ráfaga (>= 3 compras)
    const burstsMultiples = todasAnomalias.filter((a) => a.cantidadTransacciones >= 3).length;

    // 4. USUARIOS RECURRENTES (RANKING DE ACTIVIDAD Y FRAUDE)
    const mapaUsuariosTx: Record<number, { tx: number; anom: number }> = {};
    todasTransacciones.forEach((t) => {
      if (!mapaUsuariosTx[t.idUsuario]) {
        mapaUsuariosTx[t.idUsuario] = { tx: 0, anom: 0 };
      }
      mapaUsuariosTx[t.idUsuario].tx++;
    });

    todasAnomalias.forEach((a) => {
      const tId = a.idTransaccion;
      const txEncontrada = todasTransacciones.find((t) => t.idTransaccion === tId);
      const uId = txEncontrada ? txEncontrada.idUsuario : 1;
      if (!mapaUsuariosTx[uId]) {
        mapaUsuariosTx[uId] = { tx: 0, anom: 0 };
      }
      mapaUsuariosTx[uId].anom++;
    });

    const usuariosRecurrentes = Object.entries(mapaUsuariosTx)
      .map(([uIdStr, datos]) => {
        const uId = Number(uIdStr);
        const userObj = todosUsuarios.find((u) => u.idUsuario === uId);
        return {
          idUsuario: uId,
          nombreUsuario: userObj ? userObj.nombreUsuario : `Usuario #${uId}`,
          emailUsuario: userObj ? userObj.emailUsuario : `usuario${uId}@appresso.edu.co`,
          totalTransacciones: datos.tx,
          totalAnomalias: datos.anom,
        };
      })
      .sort((a, b) => b.totalTransacciones - a.totalTransacciones)
      .slice(0, 5);

    // 5. DISTRIBUCIÓN POR HORA (HEATMAP 24H)
    const mapaHoras: { transacciones: number; anomalias: number }[] = Array.from({ length: 24 }, () => ({
      transacciones: 0,
      anomalias: 0,
    }));

    todasTransacciones.forEach((t) => {
      const h = new Date(t.fechaTransaccion).getHours();
      if (h >= 0 && h < 24) {
        mapaHoras[h].transacciones++;
      }
    });

    todasAnomalias.forEach((a) => {
      const h = new Date(a.fechaCreacion).getHours();
      if (h >= 0 && h < 24) {
        mapaHoras[h].anomalias++;
      }
    });

    const distribucionPorHora = mapaHoras.map((datos, hora) => ({
      hora,
      etiqueta: `${String(hora).padStart(2, '0')}:00`,
      transacciones: datos.transacciones,
      anomalias: datos.anomalias,
    }));

    // 6. ANOMALÍAS POR NIVEL DE RIESGO
    const conteoNivel: Record<string, number> = {};
    todasAnomalias.forEach((a) => {
      conteoNivel[a.nivelRiesgo] = (conteoNivel[a.nivelRiesgo] || 0) + 1;
    });

    const anomaliasPorNivel = ['CRITICO', 'ALTO', 'MEDIO', 'BAJO'].map((nivel) => {
      const cant = conteoNivel[nivel] || 0;
      return {
        nivel,
        cantidad: cant,
        porcentaje: totalAnom > 0 ? Number(((cant / totalAnom) * 100).toFixed(1)) : 0,
      };
    });

    // 7. DESGLOSE POR MÉTODOS DE PAGO
    const mapaMetodos: Record<string, { total: number; anom: number }> = {};
    todasTransacciones.forEach((t) => {
      const m = t.metodoPago || 'TARJETA_CREDITO';
      if (!mapaMetodos[m]) mapaMetodos[m] = { total: 0, anom: 0 };
      mapaMetodos[m].total++;
    });

    todasAnomalias.forEach((a) => {
      const txObj = todasTransacciones.find((t) => t.idTransaccion === a.idTransaccion);
      const m = txObj ? txObj.metodoPago : 'TARJETA_CREDITO';
      if (!mapaMetodos[m]) mapaMetodos[m] = { total: 0, anom: 0 };
      mapaMetodos[m].anom++;
    });

    const metodosPago = Object.entries(mapaMetodos).map(([metodo, datos]) => ({
      metodo,
      totalTransacciones: datos.total,
      transaccionesAnomalas: datos.anom,
    }));

    return {
      periodo,
      resumen: {
        totalTransacciones: totalTx,
        totalAnomalias: totalAnom,
        porcentajeAnomalias: pctAnom,
        usuariosAfectados,
        valorTotalSospechoso: valorSospechosoAcc,
        promedioTransaccionesPorUsuario: promTxPorUsuario,
        casosMasRecurrentes,
        burstsMultiplesTransacciones: burstsMultiples,
      },
      comparativoPeriodos: {
        hoy: { transacciones: Number(txsHoy[0]?.count || 0), anomalias: Number(anomHoy[0]?.count || 0) },
        semana: { transacciones: Number(txsSemana[0]?.count || 0), anomalias: Number(anomSemana[0]?.count || 0) },
        mes: { transacciones: Number(txsMes[0]?.count || 0), anomalias: Number(anomMes[0]?.count || 0) },
      },
      usuariosRecurrentes,
      distribucionPorHora,
      anomaliasPorNivel,
      metodosPago,
    };
  }
}
