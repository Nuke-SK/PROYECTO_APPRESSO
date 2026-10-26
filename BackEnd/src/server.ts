import { app } from "./app";
import dotenv from "dotenv";

dotenv.config();

const PORT = Number(process.env.PORT) || 3000;

// Al omitir el host o usar default, Node.js escucha en dual-stack (IPv6 [::1] e IPv4 127.0.0.1/0.0.0.0)
// Esto evita el error de ngrok: 'dial tcp [::1]:3000: connectex'
app.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`☕ APPRESSO API corriendo en http://localhost:${PORT}`);
  console.log(`🌐 Escuchando en IPv4 y IPv6 (soporta [::1]:${PORT} y 127.0.0.1:${PORT})`);
  console.log(`🔗 Compatible con NGROK: ngrok http ${PORT}`);
  console.log(`====================================================`);
});