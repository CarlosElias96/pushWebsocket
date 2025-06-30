// server.js
const express = require('express');
const axios = require('axios');
const cors = require('cors');
const http = require('http');

const {
  iniciarWebSocket,
  enviarNotificacionTodos,
  enviarNotificacionPushATodos,
  agregarTokenFCM,
}
 = require('./websocket');

const app = express();
const PORT_HTTP = process.env.PORT || 3000;

app.use(cors());
app.use(express.json()); // Soporte JSON en POST

// Guardar token FCM
app.post('/guardar-token', (req, res) => {
  const { token } = req.body;
  if (!token) {
    return res.status(400).json({ error: 'Token no enviado' });
  }
  agregarTokenFCM(token);
  res.json({ success: true });
});

// Endpoint que dispara la notificación
app.get('/disparar-notificacion', async (req, res) => {
  try {
    const { data } = await axios.get(
      'https://backend.efleet.app/api/Destino/get/01394ee1-acf9-4727-a10f-2a3d95859d19'
    );

    if (!Array.isArray(data) || data.length === 0) {
      return res.status(404).send('No hay destinos');
    }

    const ultimo = data[data.length - 1];
    const nombre = ultimo.nombre ?? 'Sin nombre';
    const comuna = ultimo.comuna?.nombre ?? 'Sin comuna';
    const mensaje = `📍 Nuevo destino: ${nombre} (${comuna})`;

    // Enviar por WebSocket
    enviarNotificacionTodos(mensaje);

    // Enviar por FCM
    await enviarNotificacionPushATodos('Nuevo destino', mensaje);

    res.json({ mensaje, data });
  } catch (err) {
    console.error('❌ Error:', err);
    res.status(500).send('Error al obtener datos');
  }
});

// Crear HTTP server
const server = http.createServer(app);

// Iniciar WebSocket
iniciarWebSocket(server);

// Escuchar en el puerto
server.listen(PORT_HTTP, () => {
  console.log(`🟢 Servidor corriendo en http://0.0.0.0:${PORT_HTTP}/`);
});
