// websocket.js
const WebSocket = require('ws');
const admin = require('firebase-admin');

const serviceAccount = JSON.parse(process.env.FIREBASE_CREDENTIAL_JSON);


admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const fcmTokens = [];

let wss;

function iniciarWebSocket(server) {
  wss = new WebSocket.Server({ server });

  wss.on('connection', (ws) => {
    console.log('🟢 Cliente conectado al WebSocket');
    ws.send('Conectado al WebSocket');
  });
}

function enviarNotificacionTodos(mensaje) {
  if (!wss) return;

  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(mensaje);
    }
  });
}

async function enviarNotificacionPushATodos(title, body) {
  const mensajes = fcmTokens.map((token) => ({
    notification: { title, body },
    token,
  }));

  for (const msg of mensajes) {
    try {
      const response = await admin.messaging().send(msg);
      console.log('✅ Notificación push enviada:', response);
    } catch (error) {
      console.error('❌ Error enviando notificación push:', error);
    }
  }
}

function agregarTokenFCM(token) {
  if (!fcmTokens.includes(token)) {
    fcmTokens.push(token);
    console.log('🔑 Token FCM guardado:', token);
  } else {
    console.log('🔄 Token FCM ya registrado:', token);
  }
}

module.exports = {
  iniciarWebSocket,
  enviarNotificacionTodos,
  enviarNotificacionPushATodos,
  agregarTokenFCM,
};
