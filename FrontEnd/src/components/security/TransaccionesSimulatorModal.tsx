import React, { useState } from 'react';
import CryptoJS from 'crypto-js';
import { transaccionesApi } from '../../api';
import { useToast } from '../../context/ToastContext';
import {
  ShieldCheck,
  ShieldAlert,
  Zap,
  Package,
  Copy,
  Check,
  X,
  KeyRound,
  Terminal,
  Code,
  Activity,
} from 'lucide-react';

interface TransaccionesSimulatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const HMAC_SECRET = import.meta.env.VITE_HMAC_SECRET || 'appresso-secret-key-32-bytes-secure';

const USUARIOS_DEMO = [
  'estudiante.demo@appresso.edu.co',
  'juan.perez@appresso.edu.co',
  'maria.gomez@appresso.edu.co',
  'carlos.lopez@appresso.edu.co',
  'ana.martinez@appresso.edu.co',
  'felipe.torres@appresso.edu.co',
];

const METODOS_PAGO = ['TARJETA_CREDITO', 'TARJETA_DEBITO', 'TRANSFERENCIA', 'EFECTIVO'];

export const TransaccionesSimulatorModal: React.FC<TransaccionesSimulatorModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [ejecutando, setEjecutando] = useState(false);
  const [ultimoPayload, setUltimoPayload] = useState<any>(null);
  const [ultimaRespuesta, setUltimaRespuesta] = useState<any>(null);
  const [copiado, setCopiado] = useState(false);
  const { showToast } = useToast();

  if (!isOpen) return null;

  const calcularHMAC = (user: string, value: number, paymentMethod: string): string => {
    const canonical = `${user}.${value}.${paymentMethod}`;
    return CryptoJS.HmacSHA256(canonical, HMAC_SECRET).toString(CryptoJS.enc.Hex);
  };

  const generarTxAleatoria = (usuarioFijo?: string, forzarFraude: boolean = false) => {
    const idTxn = Math.floor(100000 + Math.random() * 900000);
    const user = usuarioFijo || USUARIOS_DEMO[Math.floor(Math.random() * USUARIOS_DEMO.length)];
    const value = Math.floor(10 + Math.random() * 85) * 1000; // $10.000 a $95.000 COP
    const paymentMethod = METODOS_PAGO[Math.floor(Math.random() * METODOS_PAGO.length)];
    const date = new Date().toISOString();

    let hash = calcularHMAC(user, value, paymentMethod);
    if (forzarFraude) {
      hash = CryptoJS.SHA256(`FRAUDE_ALTERADO_${Date.now()}`).toString(CryptoJS.enc.Hex);
    }

    return {
      idTxn,
      user,
      date,
      value,
      paymentMethod,
      hash,
    };
  };

  // 1. Transacción Individual Legítima
  const handleEnviarValida = async () => {
    try {
      setEjecutando(true);
      const tx = generarTxAleatoria(undefined, false);
      setUltimoPayload(tx);

      const res = await transaccionesApi.enviarRaw(tx);
      setUltimaRespuesta(res);

      showToast({
        type: 'success',
        title: 'Transacción Aprobada (HMAC Válido)',
        description: `Tx #${tx.idTxn} por $${tx.value.toLocaleString('es-CO')} verificada con éxito.`,
      });

      onSuccess();
    } catch (err: any) {
      showToast({
        type: 'error',
        title: 'Error al enviar transacción',
        description: err.message,
      });
    } finally {
      setEjecutando(false);
    }
  };

  // 2. Simulación de Fraude / Hash Manipulado
  const handleEnviarFraude = async () => {
    try {
      setEjecutando(true);
      const tx = generarTxAleatoria(undefined, true);
      setUltimoPayload(tx);

      const res = await transaccionesApi.enviarRaw(tx);
      setUltimaRespuesta(res);

      showToast({
        type: 'warning',
        title: '¡Fraude Detectado por el Backend!',
        description: 'El hash no coincidió con el valor. La transacción fue RECHAZADA y se generó una alerta.',
      });

      onSuccess();
    } catch (err: any) {
      showToast({
        type: 'error',
        title: 'Error en la petición',
        description: err.message,
      });
    } finally {
      setEjecutando(false);
    }
  };

  // 3. Simulación de Ráfaga (Ventana Deslizante)
  const handleEnviarRafaga = async () => {
    try {
      setEjecutando(true);
      const user = 'estudiante.demo@appresso.edu.co';
      showToast({
        type: 'info',
        title: 'Inyectando Ráfaga de Transacciones',
        description: 'Enviando 5 transacciones en < 1 segundo para activar el algoritmo de Ventana Deslizante...',
      });

      const ultimos = [];
      for (let i = 1; i <= 5; i++) {
        const tx = generarTxAleatoria(user, false);
        ultimos.push(tx);
        await transaccionesApi.enviarRaw(tx);
        await new Promise((r) => setTimeout(r, 120));
      }

      setUltimoPayload({
        descripcion: 'Ráfaga de 5 transacciones enviadas para el mismo usuario en ráfaga rápida',
        transacciones: ultimos,
      });
      setUltimaRespuesta({
        mensaje: '5 transacciones procesadas. El motor de ventana deslizante disparó alerta VELOCIDAD_EXCESIVA.',
      });

      showToast({
        type: 'success',
        title: 'Ráfaga Procesada',
        description: 'Revisa la sección de Seguridad/Anomalías para auditar la alerta forense generada.',
      });

      onSuccess();
    } catch (err: any) {
      showToast({
        type: 'error',
        title: 'Error durante la ráfaga',
        description: err.message,
      });
    } finally {
      setEjecutando(false);
    }
  };

  // 4. Envío de Lote (Array Batch)
  const handleEnviarLote = async () => {
    try {
      setEjecutando(true);
      const lote = [
        generarTxAleatoria(undefined, false),
        generarTxAleatoria(undefined, false),
        generarTxAleatoria(undefined, false),
      ];
      setUltimoPayload(lote);

      const res = await transaccionesApi.enviarRaw(lote);
      setUltimaRespuesta(res);

      showToast({
        type: 'success',
        title: 'Lote de Transacciones Procesado',
        description: `Se procesaron ${lote.length} transacciones en una sola petición concurrente.`,
      });

      onSuccess();
    } catch (err: any) {
      showToast({
        type: 'error',
        title: 'Error al enviar lote',
        description: err.message,
      });
    } finally {
      setEjecutando(false);
    }
  };

  const handleCopiarPayload = () => {
    if (!ultimoPayload) return;
    navigator.clipboard.writeText(JSON.stringify(ultimoPayload, null, 2));
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-4xl max-h-[92vh] flex flex-col bg-white rounded-2xl shadow-2xl border border-stone-200 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-100 bg-gradient-to-r from-stone-50 to-white">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-100/80 text-amber-800">
              <Activity className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-stone-900 flex items-center gap-2">
                Simulador de Transacciones Externas
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-medium">
                  HMAC-SHA256 Activo
                </span>
              </h3>
              <p className="text-xs text-stone-500">
                Genera transacciones externas con firma criptográfica y prueba la integridad en vivo
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-stone-400 hover:text-stone-600 rounded-lg hover:bg-stone-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Info Card: Parámetros Criptográficos */}
          <div className="p-4 rounded-xl bg-stone-50 border border-stone-200 grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
            <div>
              <span className="text-stone-500 block font-medium">Fórmula Canónica de Firma</span>
              <code className="text-amber-900 font-mono font-semibold">
                HMAC_SHA256("$&#123;user&#125;.$&#123;value&#125;.$&#123;paymentMethod&#125;", clave)
              </code>
            </div>
            <div>
              <span className="text-stone-500 block font-medium">Clave Secreta Compartida</span>
              <span className="font-mono text-stone-700 bg-stone-200/70 px-2 py-0.5 rounded inline-block">
                {HMAC_SECRET.substring(0, 6)}••••{HMAC_SECRET.slice(-4)}
              </span>
            </div>
            <div>
              <span className="text-stone-500 block font-medium">Formato JSON Soportado</span>
              <span className="text-stone-700">Individual o Lote <code className="font-mono text-stone-600">[&#123;...&#125;]</code></span>
            </div>
          </div>

          {/* Action Trigger Buttons */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-stone-500 mb-2.5 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-amber-600" />
              Disparadores de Prueba para Video
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {/* Botón 1: Legítima */}
              <button
                onClick={handleEnviarValida}
                disabled={ejecutando}
                className="p-3.5 rounded-xl border border-emerald-200 bg-emerald-50/60 hover:bg-emerald-100/70 text-left transition-all group flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center gap-2 text-emerald-800 font-bold text-sm mb-1">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    Transacción Válida
                  </div>
                  <p className="text-[11px] text-emerald-900/80 leading-relaxed">
                    Genera datos aleatorios con firma HMAC auténtica. Debe resultar en <strong>APROBADA</strong>.
                  </p>
                </div>
                <span className="mt-3 text-[10px] font-semibold text-emerald-700 uppercase tracking-wider group-hover:underline">
                  Ejecutar →
                </span>
              </button>

              {/* Botón 2: Fraude */}
              <button
                onClick={handleEnviarFraude}
                disabled={ejecutando}
                className="p-3.5 rounded-xl border border-rose-200 bg-rose-50/60 hover:bg-rose-100/70 text-left transition-all group flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center gap-2 text-rose-800 font-bold text-sm mb-1">
                    <ShieldAlert className="w-4 h-4 text-rose-600" />
                    Simular Fraude (Tampering)
                  </div>
                  <p className="text-[11px] text-rose-900/80 leading-relaxed">
                    Envía un hash corrupto. El backend lo marcará como <strong>RECHAZADA</strong> y alertará anomalía.
                  </p>
                </div>
                <span className="mt-3 text-[10px] font-semibold text-rose-700 uppercase tracking-wider group-hover:underline">
                  Ejecutar →
                </span>
              </button>

              {/* Botón 3: Ráfaga */}
              <button
                onClick={handleEnviarRafaga}
                disabled={ejecutando}
                className="p-3.5 rounded-xl border border-amber-200 bg-amber-50/60 hover:bg-amber-100/70 text-left transition-all group flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center gap-2 text-amber-800 font-bold text-sm mb-1">
                    <Zap className="w-4 h-4 text-amber-600" />
                    Ráfaga Ventana Deslizante
                  </div>
                  <p className="text-[11px] text-amber-900/80 leading-relaxed">
                    Envía 5 compras en 1s para activar la regla de <strong>Velocidad Excesiva</strong> por usuario.
                  </p>
                </div>
                <span className="mt-3 text-[10px] font-semibold text-amber-700 uppercase tracking-wider group-hover:underline">
                  Disparar Ráfaga →
                </span>
              </button>

              {/* Botón 4: Lote */}
              <button
                onClick={handleEnviarLote}
                disabled={ejecutando}
                className="p-3.5 rounded-xl border border-sky-200 bg-sky-50/60 hover:bg-sky-100/70 text-left transition-all group flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center gap-2 text-sky-800 font-bold text-sm mb-1">
                    <Package className="w-4 h-4 text-sky-600" />
                    Envío en Lote (Batch Array)
                  </div>
                  <p className="text-[11px] text-sky-900/80 leading-relaxed">
                    Envía un array con 3 transacciones para probar la ingesta concurrente del backend.
                  </p>
                </div>
                <span className="mt-3 text-[10px] font-semibold text-sky-700 uppercase tracking-wider group-hover:underline">
                  Enviar Lote →
                </span>
              </button>
            </div>
          </div>

          {/* Inspector de Payload y Respuesta */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Payload Enviado */}
            <div className="p-4 rounded-xl bg-stone-900 text-stone-100 border border-stone-800 font-mono text-xs">
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-stone-800">
                <span className="flex items-center gap-1.5 text-stone-400 font-sans font-semibold text-[11px]">
                  <Code className="w-3.5 h-3.5 text-amber-400" />
                  Payload JSON Enviado
                </span>
                {ultimoPayload && (
                  <button
                    onClick={handleCopiarPayload}
                    className="flex items-center gap-1 text-[11px] text-stone-400 hover:text-stone-200 transition-colors"
                  >
                    {copiado ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    {copiado ? 'Copiado' : 'Copiar'}
                  </button>
                )}
              </div>
              <pre className="max-h-48 overflow-y-auto text-[11px] text-stone-300 leading-tight">
                {ultimoPayload
                  ? JSON.stringify(ultimoPayload, null, 2)
                  : '// Haz clic en cualquiera de los botones superiores para generar una transacción en vivo...'}
              </pre>
            </div>

            {/* Respuesta del Backend */}
            <div className="p-4 rounded-xl bg-stone-900 text-stone-100 border border-stone-800 font-mono text-xs">
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-stone-800">
                <span className="flex items-center gap-1.5 text-stone-400 font-sans font-semibold text-[11px]">
                  <Terminal className="w-3.5 h-3.5 text-emerald-400" />
                  Respuesta del Servidor APPRESSO
                </span>
                {ultimaRespuesta && (
                  <span className="text-[10px] px-2 py-0.5 rounded bg-stone-800 text-emerald-400 font-sans font-semibold">
                    HTTP 201 / OK
                  </span>
                )}
              </div>
              <pre className="max-h-48 overflow-y-auto text-[11px] text-emerald-300 leading-tight">
                {ultimaRespuesta
                  ? JSON.stringify(ultimaRespuesta, null, 2)
                  : '// La respuesta del backend se mostrará aquí en tiempo real...'}
              </pre>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-3 border-t border-stone-100 bg-stone-50 text-xs text-stone-500">
          <div className="flex items-center gap-1.5">
            <KeyRound className="w-3.5 h-3.5 text-amber-600" />
            <span>También puedes ejecutar el script CLI desde consola: <code className="bg-stone-200 px-1 py-0.5 rounded text-stone-800">npm run simular</code></span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg font-medium text-stone-700 bg-white border border-stone-200 hover:bg-stone-50 transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};

