const WebSocket = require('ws');
const admin = require('firebase-admin');

// Inicializar Firebase Admin con credenciales
// Cambia al nombre correcto de tu archivo JSON, con la ruta relativa correcta
const serviceAccount = require('./websocket_server/notificationpush-f7da7-firebase-adminsdk-fbsvc-5c8770c6fe.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

// Lista simple de tokens FCM (en producción, base de datos)
const fcmTokens = [];

// Crear servidor WebSocket (puedes pasar puerto/host desde afuera)
let wss;

function iniciarWebSocket(server) {
  wss = new WebSocket.Server({ server });

  wss.on('connection', (ws) => {
    console.log('🟢 Cliente conectado por WebSocket');
    ws.send('Conectado al WebSocket');
  });
}

// Función para enviar mensaje a todos por WebSocket
function enviarNotificacionTodos(mensaje) {
  if (!wss) return;

  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(mensaje);
    }
  });
}

// Enviar notificaciones push FCM a todos los tokens guardados
function enviarNotificacionPushATodos(title, body) {
  const mensajes = fcmTokens.map(token => ({
    notification: { title, body },
    token,
  }));

  mensajes.forEach(msg => {
    admin.messaging().send(msg)
      .then(response => console.log('✅ Notificación push enviada:', response))
      .catch(error => console.error('❌ Error enviando notificación push:', error));
  });
}

// Agregar token FCM (evitando duplicados)
function agregarTokenFCM(token) {
  if (!fcmTokens.includes(token)) {
    fcmTokens.push(token);
    console.log('🔑 Token FCM guardado:', token);
  } else {
    console.log('🔄 Token FCM ya registrado:', token);
  }
}

// Exportar funciones para usarlas en server.js
module.exports = {
  iniciarWebSocket,
  enviarNotificacionTodos,
  enviarNotificacionPushATodos,
  agregarTokenFCM,
};