// ╔═══════════════════════════════════════════════════════════════════════════╗
// ║  APPRESSO — SCRIPT DE PRUEBA: VENTANA DESLIZANTE (SLIDING WINDOW)         ║
// ║  Simula una ráfaga de transacciones para validar la detección de fraude  ║
// ╚═══════════════════════════════════════════════════════════════════════════╝

const BASE_URL = process.env.API_URL || 'http://localhost:3000/api/v1';

async function ejecutarPrueba() {
  console.log('\n============================================================');
  console.log('🧪 PRUEBA AUTOMÁTICA DE VENTANA DESLIZANTE (SLIDING WINDOW)');
  console.log('============================================================\n');
  console.log(`📡 Conectando a: ${BASE_URL}`);

  try {
    // 1. Verificar salud del backend
    const healthRes = await fetch('http://localhost:3000/health');
    if (!healthRes.ok) {
      throw new Error(`El servidor backend no responde en http://localhost:3000 (status ${healthRes.status})`);
    }
    console.log('✅ Servidor backend activo y saludable.\n');

    // 2. Consultar anomalías previas para tener línea base
    const antesRes = await fetch(`${BASE_URL}/anomalias`);
    const antesJson = await antesRes.json();
    const anomaliasAntes = Array.isArray(antesJson.data) ? antesJson.data : (antesJson.data?.data || []);
    const totalAnomaliasAntes = anomaliasAntes.length;
    console.log(`📊 Anomalías registradas antes de la prueba: ${totalAnomaliasAntes}\n`);

    // 3. Disparar ráfaga de 5 transacciones en menos de 2 segundos para el Usuario #1
    const ID_USUARIO = 1;
    const NUMERO_TRANSACCIONES = 5;
    console.log(`🚀 Disparando ráfaga de ${NUMERO_TRANSACCIONES} transacciones rápidas para el Usuario #${ID_USUARIO}...`);
    console.log('   (Umbral configurado: más de 3 transacciones en 30 segundos)\n');

    const promesas = [];
    for (let i = 1; i <= NUMERO_TRANSACCIONES; i++) {
      const payload = {
        idUsuario: ID_USUARIO,
        valor: 15000 * i,
        metodoPago: 'TARJETA_CREDITO',
      };

      console.log(`   [TX #${i}] Enviando: Valor $${payload.valor.toLocaleString()} COP | Método: ${payload.metodoPago}`);

      const req = fetch(`${BASE_URL}/transacciones`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }).then(async (r) => {
        const res = await r.json();
        return { status: r.status, data: res.data };
      });

      promesas.push(req);
      // Breve pausa de 150ms entre envíos para simular alta velocidad
      await new Promise((r) => setTimeout(r, 150));
    }

    const resultados = await Promise.all(promesas);
    console.log(`\n✅ ${resultados.length} transacciones procesadas con éxito por el backend.`);

    // 4. Esperar 1 segundo a que el análisis asíncrono de la ventana deslizante termine en PostgreSQL
    console.log('⏳ Esperando análisis asíncrono de la ventana deslizante...');
    await new Promise((r) => setTimeout(r, 1000));

    // 5. Verificar si se registró la anomalía
    const despuesRes = await fetch(`${BASE_URL}/anomalias`);
    const despuesJson = await despuesRes.json();
    const anomalias = Array.isArray(despuesJson.data) ? despuesJson.data : (despuesJson.data?.data || []);
    const totalAnomaliasDespues = anomalias.length;

    console.log(`\n============================================================`);
    console.log(`📊 RESULTADO DEL MOTOR DE SEGURIDAD`);
    console.log(`============================================================`);
    console.log(`Total anomalías después de la ráfaga: ${totalAnomaliasDespues}`);

    if (totalAnomaliasDespues > totalAnomaliasAntes) {
      const ultimaAnomalia = anomalias[0];
      console.log('\n🎉 ¡PRUEBA EXITOSA! La Ventana Deslizante detectó la anomalía:');
      console.log(`   - ID Anomalía: ${ultimaAnomalia.id}`);
      console.log(`   - Tipo: ${ultimaAnomalia.tipoAnomalia}`);
      console.log(`   - Nivel de Riesgo: ${ultimaAnomalia.nivelRiesgo}`);
      console.log(`   - Transacciones en ventana: ${ultimaAnomalia.cantidadTransacciones}`);
      console.log(`   - Ventana de tiempo: ${ultimaAnomalia.ventanaSegundos} segundos`);
      console.log(`   - Transacciones involucradas: ${ultimaAnomalia.transaccionesInvolucradas?.length || 0}`);
      console.log('\n💡 Puedes abrir tu navegador en http://localhost:5173/seguridad para ver esta anomalía en el panel visual.');
    } else {
      console.log('\n⚠️ No se detectó incremento. Verifica si el usuario ya tenía transacciones previas o revisa los logs del backend.');
    }
    console.log('============================================================\n');
  } catch (error) {
    console.error('\n❌ Error ejecutando la prueba:', error.message);
    console.log('Asegúrate de que el backend esté corriendo con: npm run dev:backend\n');
  }
}

ejecutarPrueba();
