/**
 * ============================================================================
 * ☕ APPRESSO - SIMULADOR DE TRANSACCIONES EXTERNAS
 * ============================================================================
 * Herramienta para demostración en video de Integridad Criptográfica (HMAC-SHA256)
 * y Detección de Fraude por Algoritmo de Ventana Deslizante (Sliding Window).
 *
 * Características:
 *  - Genera transacciones con la estructura exacta requerida por la evaluación:
 *      { idTxn, user, date, value, paymentMethod, hash }
 *  - Firma criptográfica idéntica: HMAC-SHA256 con secreto compartido.
 *  - Cabeceras x-signature y x-timestamp para soportar modo estricto.
 *  - Validaciones estrictas de entrada antes del envío.
 *  - Soporta envío individual, ráfagas para ventana deslizante, y lotes (arrays).
 * ============================================================================
 */

import crypto from 'crypto';
import dotenv from 'dotenv';
import readline from 'readline';

dotenv.config();

// CONFIGURACIÓN POR DEFECTO
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3000/api/v1/transacciones';
const HMAC_SECRET = process.env.HMAC_SECRET || process.env.VITE_HMAC_SECRET || 'appresso-secret-key-32-bytes-secure';

// BANCO DE DATOS DE PRUEBA REALISTAS
const USUARIOS_DEMO = [
  'estudiante.demo@appresso.edu.co',
  'juan.perez@appresso.edu.co',
  'maria.gomez@appresso.edu.co',
  'carlos.lopez@appresso.edu.co',
  'ana.martinez@appresso.edu.co',
  'felipe.torres@appresso.edu.co',
  'laura.sanchez@appresso.edu.co',
];

const METODOS_PAGO = ['TARJETA_CREDITO', 'TARJETA_DEBITO', 'TRANSFERENCIA', 'EFECTIVO'] as const;

export interface TransaccionExterna {
  idTxn: number;
  user: string;
  date: string;
  value: number;
  paymentMethod: string;
  hash: string;
}

// ─── FUNCIONES CRIPTOGRÁFICAS ───────────────────────────────────────────────

/**
 * Calcula la firma HMAC-SHA256 idéntica a la fórmula del sistema:
 * Payload canónico: `${user}.${value}.${paymentMethod}`
 */
export function calcularHashHMAC(
  user: string | number,
  value: number,
  paymentMethod: string,
  secretKey: string = HMAC_SECRET
): string {
  const payload = `${user}.${value}.${paymentMethod}`;
  return crypto.createHmac('sha256', secretKey).update(payload).digest('hex');
}

/**
 * Genera las cabeceras x-signature y x-timestamp para solicitudes HTTP protegidas
 */
export function generarHeadersHMAC(body: any, secretKey: string = HMAC_SECRET) {
  const timestamp = Date.now().toString();
  const rawPayload = typeof body === 'string' ? body : JSON.stringify(body ?? {});
  const dataToVerify = `${timestamp}.${rawPayload}`;
  const signature = crypto.createHmac('sha256', secretKey).update(dataToVerify).digest('hex');

  return {
    'Content-Type': 'application/json',
    'x-signature': signature,
    'x-timestamp': timestamp,
  };
}

// ─── GENERADOR DE DATOS ALEATORIOS ─────────────────────────────────────────

export function generarTransaccionAleatoria(
  usuarioFijo?: string,
  forzarFraudeHash: boolean = false
): TransaccionExterna {
  const idTxn = Math.floor(100000 + Math.random() * 900000);
  const user = usuarioFijo || USUARIOS_DEMO[Math.floor(Math.random() * USUARIOS_DEMO.length)];
  // Valores típicos entre $8.000 y $95.000 COP en pasos de $1.000
  const value = Math.floor(8 + Math.random() * 88) * 1000;
  const paymentMethod = METODOS_PAGO[Math.floor(Math.random() * METODOS_PAGO.length)];
  const date = new Date().toISOString();

  let hash = calcularHashHMAC(user, value, paymentMethod, HMAC_SECRET);

  if (forzarFraudeHash) {
    // Altera intencionalmente el hash para simular manipulación de datos en tránsito
    hash = crypto.createHash('sha256').update(`FAKE_TAMPERED_${Date.now()}`).digest('hex');
  }

  return {
    idTxn,
    user,
    date,
    value,
    paymentMethod,
    hash,
  };
}

// ─── VALIDACIONES DE ENTRADA ───────────────────────────────────────────────

export function validarEntradaTransaccion(tx: Partial<TransaccionExterna>): { valida: boolean; error?: string } {
  if (!tx.user || String(tx.user).trim() === '') {
    return { valida: false, error: 'El identificador de usuario es obligatorio' };
  }
  if (tx.value === undefined || tx.value === null || typeof tx.value !== 'number' || isNaN(tx.value)) {
    return { valida: false, error: 'El valor monetario debe ser un número válido' };
  }
  if (tx.value <= 0) {
    return { valida: false, error: 'El valor monetario debe ser mayor a cero' };
  }
  if (!tx.paymentMethod || !METODOS_PAGO.includes(tx.paymentMethod as any)) {
    return { valida: false, error: `Método de pago inválido. Permitidos: ${METODOS_PAGO.join(', ')}` };
  }
  if (!tx.hash || tx.hash.trim().length !== 64) {
    return { valida: false, error: 'El hash HMAC-SHA256 debe tener exactamente 64 caracteres hexadecimales' };
  }
  return { valida: true };
}

// ─── CLIENTE HTTP PARA ENVÍO AL BACKEND ────────────────────────────────────

export async function enviarAlBackend(payload: any): Promise<{ status: number; ok: boolean; body: any }> {
  const url = BACKEND_URL;
  const headers = generarHeadersHMAC(payload, HMAC_SECRET);

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });

    const body = await res.json().catch(() => ({}));
    return {
      status: res.status,
      ok: res.ok,
      body,
    };
  } catch (err: any) {
    return {
      status: 0,
      ok: false,
      body: { error: `No se pudo conectar con ${url}. ¿Está el backend encendido? Detalle: ${err.message}` },
    };
  }
}

// ─── ESCENARIOS DE DEMOSTRACIÓN ───────────────────────────────────────────

/**
 * Escenario 1: Envío de una transacción legítima
 */
export async function ejecutarTransaccionValida(usuario?: string) {
  console.log('\n\x1b[36m────────────────────────────────────────────────────────────\x1b[0m');
  console.log('\x1b[1m\x1b[32m✔ ESCENARIO 1: Envío de Transacción Legítima con HMAC-SHA256\x1b[0m');
  console.log('\x1b[36m────────────────────────────────────────────────────────────\x1b[0m');

  const tx = generarTransaccionAleatoria(usuario, false);
  const val = validarEntradaTransaccion(tx);
  if (!val.valida) {
    console.log(`\x1b[31m[VALIDACIÓN LOCAL FALLÓ]: ${val.error}\x1b[0m`);
    return;
  }

  console.log('📤 \x1b[33mPayload generado:\x1b[0m', JSON.stringify(tx, null, 2));
  console.log(`🔐 \x1b[35mFórmula HMAC:\x1b[0m HMAC_SHA256("${tx.user}.${tx.value}.${tx.paymentMethod}", clave)`);
  console.log(`🔑 \x1b[35mHash calculado:\x1b[0m ${tx.hash}`);

  const res = await enviarAlBackend(tx);
  if (res.ok) {
    console.log(`\n\x1b[32m✅ RESPUESTA BACKEND (HTTP ${res.status}): APROBADA\x1b[0m`);
    console.log('📦 Data devuelta:', JSON.stringify(res.body.data || res.body, null, 2));
  } else {
    console.log(`\n\x1b[31m❌ RESPUESTA BACKEND (HTTP ${res.status}):\x1b[0m`, res.body);
  }
}

/**
 * Escenario 2: Simulación de Fraude / Hash Manipulado (Tampering)
 */
export async function ejecutarFraudeHash() {
  console.log('\n\x1b[36m────────────────────────────────────────────────────────────\x1b[0m');
  console.log('\x1b[1m\x1b[31m⚠ ESCENARIO 2: Simulación de Ataque de Manipulación de Hash\x1b[0m');
  console.log('\x1b[36m────────────────────────────────────────────────────────────\x1b[0m');

  const tx = generarTransaccionAleatoria(undefined, true);
  console.log('📤 \x1b[33mPayload con HASH ADULTERADO:\x1b[0m', JSON.stringify(tx, null, 2));
  console.log('🛡️  El hash enviado no coincide con el contenido monetario del mensaje.');

  const res = await enviarAlBackend(tx);
  console.log(`\n\x1b[33m📥 RESPUESTA BACKEND (HTTP ${res.status}):\x1b[0m`);
  console.log('📦 Respuesta:', JSON.stringify(res.body, null, 2));

  const estado = res.body?.data?.estado || res.body?.data?.status;
  if (estado === 'RECHAZADA') {
    console.log('\n\x1b[32m✔ ÉXITO FORENSE: La transacción fue RECHAZADA por inconsistencia criptográfica.');
    console.log('🚨 Se ha generado una anomalía "MANIPULACION_HASH" con severidad CRÍTICO en la base de datos.\x1b[0m');
  }
}

/**
 * Escenario 3: Ráfaga rápida para activar el Algoritmo de Ventana Deslizante
 */
export async function ejecutarRafagaVentana(usuario: string = 'estudiante.demo@appresso.edu.co', cantidad: number = 5) {
  console.log('\n\x1b[36m────────────────────────────────────────────────────────────\x1b[0m');
  console.log(`\x1b[1m\x1b[33m⚡ ESCENARIO 3: Ráfaga de ${cantidad} Transacciones Rápidas (Ventana Deslizante)\x1b[0m`);
  console.log(`👤 Usuario objetivo: \x1b[36m${usuario}\x1b[0m`);
  console.log('\x1b[36m────────────────────────────────────────────────────────────\x1b[0m');

  for (let i = 1; i <= cantidad; i++) {
    const tx = generarTransaccionAleatoria(usuario, false);
    console.log(`[${i}/${cantidad}] Inyectando Tx #${tx.idTxn} - $${tx.value.toLocaleString('es-CO')} COP...`);
    const res = await enviarAlBackend(tx);
    console.log(`       → Estado HTTP: ${res.status} | ID Registrado: ${res.body?.data?.id || 'OK'}`);
    // Pequeño retardo entre 100ms y 150ms para que todas queden en la misma ventana de 3 segundos
    await new Promise((r) => setTimeout(r, 120));
  }

  console.log('\n\x1b[32m✔ RÁFAGA COMPLETADA.\x1b[0m');
  console.log('🔍 El motor de Ventana Deslizante (Sliding Window) analizó el lapso temporal.');
  console.log('🚨 Si superó el umbral (por defecto 3 transacciones en 3 segundos), se creó la anomalía "VELOCIDAD_EXCESIVA".');
  console.log('👉 Revisa el panel web en: \x1b[34mhttp://localhost:5173/seguridad\x1b[0m');
}

/**
 * Escenario 4: Envío en Lote (Array Batch)
 */
export async function ejecutarLoteBatch(cantidad: number = 3) {
  console.log('\n\x1b[36m────────────────────────────────────────────────────────────\x1b[0m');
  console.log(`\x1b[1m\x1b[35m📦 ESCENARIO 4: Envío en Lote de ${cantidad} Transacciones (Array JSON)\x1b[0m`);
  console.log('\x1b[36m────────────────────────────────────────────────────────────\x1b[0m');

  const lote: TransaccionExterna[] = [];
  for (let i = 0; i < cantidad; i++) {
    lote.push(generarTransaccionAleatoria(undefined, false));
  }

  console.log(`📤 Enviando array con ${lote.length} transacciones simultáneas...`);
  console.log(JSON.stringify(lote, null, 2));

  const res = await enviarAlBackend(lote);
  console.log(`\n\x1b[32m📥 RESPUESTA BACKEND (HTTP ${res.status}):\x1b[0m`);
  console.log('📦 Respuesta:', JSON.stringify(res.body, null, 2));
}

/**
 * Escenario 5: Modo Stream continuo para demostración en video
 */
export async function ejecutarModoStream(intervaloSegundos: number = 2.5) {
  console.log('\n\x1b[36m────────────────────────────────────────────────────────────\x1b[0m');
  console.log('\x1b[1m\x1b[32m🎬 ESCENARIO 5: Modo Simulación Continua en Vivo para Video\x1b[0m');
  console.log(`⏳ Emitiendo 1 transacción cada ${intervaloSegundos}s (Presiona CTRL+C para detener)`);
  console.log('\x1b[36m────────────────────────────────────────────────────────────\x1b[0m');

  let conteo = 1;
  const loop = async () => {
    // 85% transacciones legítimas, 15% simulación de intento de fraude
    const esFraude = Math.random() < 0.15;
    const tx = generarTransaccionAleatoria(undefined, esFraude);

    const etiqueta = esFraude ? '\x1b[31m[FRAUDE HASH]\x1b[0m' : '\x1b[32m[LEGÍTIMA]\x1b[0m';
    console.log(`\n\x1b[1m#${conteo}\x1b[0m ${etiqueta} Tx #${tx.idTxn} | ${tx.user} | $${tx.value.toLocaleString('es-CO')} | ${tx.paymentMethod}`);
    console.log(`   Hash: ${tx.hash.substring(0, 16)}...`);

    const res = await enviarAlBackend(tx);
    const estado = res.body?.data?.estado || res.body?.data?.status || (res.ok ? 'OK' : 'ERR');
    console.log(`   Resultado: HTTP ${res.status} → ${estado}`);

    conteo++;
    setTimeout(loop, intervaloSegundos * 1000);
  };

  loop();
}

/**
 * Escenario 6: Validaciones de Entrada (Pruebas de Blindaje Zod)
 */
export async function ejecutarPruebasValidaciones() {
  console.log('\n\x1b[36m────────────────────────────────────────────────────────────\x1b[0m');
  console.log('\x1b[1m\x1b[33m🛡️  ESCENARIO 6: Pruebas de Validaciones de Entrada (Zod Guard)\x1b[0m');
  console.log('\x1b[36m────────────────────────────────────────────────────────────\x1b[0m');

  const casos = [
    {
      nombre: 'Monto negativo (-50.000 COP)',
      payload: { user: 'test@appresso.edu.co', value: -50000, paymentMethod: 'TARJETA_CREDITO' },
    },
    {
      nombre: 'Usuario faltante (campo vacío)',
      payload: { value: 30000, paymentMethod: 'EFECTIVO' },
    },
    {
      nombre: 'Objeto vacío ({})',
      payload: {},
    },
    {
      nombre: 'Monto formateado con caracteres ("$45.000 COP")',
      payload: { user: 'test@appresso.edu.co', value: '$45.000 COP', paymentMethod: 'TRANSFERENCIA' },
    },
  ];

  for (const caso of casos) {
    console.log(`\n🧪 \x1b[1mPrueba: ${caso.nombre}\x1b[0m`);
    console.log('   Payload:', JSON.stringify(caso.payload));
    const res = await enviarAlBackend(caso.payload);
    console.log(`   Respuesta HTTP: ${res.status} | Body:`, JSON.stringify(res.body));
  }
}

// ─── MENÚ INTERACTIVO EN TERMINAL ──────────────────────────────────────────

function mostrarBanner() {
  console.clear();
  console.log('\x1b[35m' + `
 ╔════════════════════════════════════════════════════════════════════════════╗
 ║        ☕ APPRESSO — SIMULADOR DE TRANSACCIONES EXTERNAS                  ║
 ║           Criptografía HMAC-SHA256 & Detección de Ventana Deslizante       ║
 ╚════════════════════════════════════════════════════════════════════════════╝
  ` + '\x1b[0m');
  console.log(`🌐 \x1b[1mBackend URL:\x1b[0m    \x1b[36m${BACKEND_URL}\x1b[0m`);
  console.log(`🔑 \x1b[1mClave Secreta:\x1b[0m  \x1b[33m${HMAC_SECRET.substring(0, 6)}••••${HMAC_SECRET.slice(-4)}\x1b[0m`);
  console.log(`🔒 \x1b[1mAlgoritmo:\x1b[0m      \x1b[32mHMAC-SHA256\x1b[0m`);
  console.log('────────────────────────────────────────────────────────────────────────');
}

function iniciarMenu() {
  mostrarBanner();
  console.log('\x1b[1mSelecciona una opción para la grabación del video:\x1b[0m\n');
  console.log('  \x1b[32m[1]\x1b[0m Enviar 1 Transacción Válida (HMAC-SHA256 verificado)');
  console.log('  \x1b[31m[2]\x1b[0m Simular Fraude: Enviar Transacción con HASH Manipulado');
  console.log('  \x1b[33m[3]\x1b[0m Simular Ráfaga: Activar Ventana Deslizante (5 compras en 1s)');
  console.log('  \x1b[35m[4]\x1b[0m Enviar Lote (Batch Array) de 3 Transacciones');
  console.log('  \x1b[36m[5]\x1b[0m Iniciar Stream Continuo (Emisión en vivo para video)');
  console.log('  \x1b[34m[6]\x1b[0m Probar Validaciones de Entrada (Casos inválidos)');
  console.log('  \x1b[90m[0]\x1b[0m Salir\n');

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  rl.question('\x1b[1mIngresa tu opción (0-6): \x1b[0m', async (opcion) => {
    rl.close();
    switch (opcion.trim()) {
      case '1':
        await ejecutarTransaccionValida();
        break;
      case '2':
        await ejecutarFraudeHash();
        break;
      case '3':
        await ejecutarRafagaVentana();
        break;
      case '4':
        await ejecutarLoteBatch();
        break;
      case '5':
        await ejecutarModoStream();
        return; // Stream se mantiene en ejecución
      case '6':
        await ejecutarPruebasValidaciones();
        break;
      case '0':
        console.log('\n👋 Saliendo del simulador. ¡Éxitos con el video!\n');
        process.exit(0);
      default:
        console.log('\x1b[31mOpción no válida.\x1b[0m');
    }

    console.log('\nPresiona ENTER para volver al menú...');
    const rl2 = readline.createInterface({ input: process.stdin, output: process.stdout });
    rl2.question('', () => {
      rl2.close();
      iniciarMenu();
    });
  });
}

// ─── CONTROL DE EJECUCIÓN (ARGUMENTOS CLI O MENÚ) ──────────────────────────

const args = process.argv.slice(2);
const modoArg = args.find((a) => a.startsWith('--modo='))?.split('=')[1];

if (modoArg) {
  mostrarBanner();
  switch (modoArg.toLowerCase()) {
    case 'valida':
      ejecutarTransaccionValida();
      break;
    case 'fraude':
      ejecutarFraudeHash();
      break;
    case 'rafaga':
      ejecutarRafagaVentana();
      break;
    case 'lote':
      ejecutarLoteBatch();
      break;
    case 'stream':
      ejecutarModoStream();
      break;
    case 'validaciones':
      ejecutarPruebasValidaciones();
      break;
    default:
      console.log(`Modo desconocido: ${modoArg}. Opciones: valida, fraude, rafaga, lote, stream, validaciones`);
  }
} else {
  iniciarMenu();
}

