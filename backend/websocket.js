const WebSocket = require('ws');
const admin = require('firebase-admin');

const serviceAccount = JSON.parse(process.env.FIREBASE_CREDENTIAL_JSON);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const fcmTokens = [];
const clientes = new Set();
let wss;

function iniciarWebSocket(server) {
  wss = new WebSocket.Server({ server });

  wss.on('connection', (ws) => {
    console.log('🟢 Cliente conectado al WebSocket');
    clientes.add(ws);
    console.log(`📈 Total clientes conectados: ${clientes.size}`);

    ws.send('✅ Conectado al WebSocket');

    ws.on('close', () => {
      clientes.delete(ws);
      console.log('❌ Cliente desconectado');
      console.log(`📉 Total clientes conectados: ${clientes.size}`);
    });

    ws.on('error', (err) => {
      console.error('⚠️ Error en conexión WebSocket:', err);
    });

    ws.on('message', (msg) => {
      console.log('📩 Mensaje recibido del cliente:', msg);
    });
  });

  console.log('✅ WebSocket server iniciado y escuchando conexiones');
}

function enviarNotificacionTodos(mensaje) {
  if (!wss) {
    console.warn('⚠️ WebSocket no iniciado');
    return;
  }

  console.log(`📤 Enviando mensaje a ${clientes.size} clientes: ${mensaje}`);
  for (const client of clientes) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(mensaje);
    }
  }
}

async function enviarNotificacionPushATodos(title, body) {
  if (fcmTokens.length === 0) {
    console.warn('⚠️ No hay tokens FCM registrados');
    return;
  }

  console.log(`📲 Enviando notificación push a ${fcmTokens.length} dispositivos`);

  for (const token of fcmTokens) {
    try {
      const response = await admin.messaging().send({
        token,
        notification: {
          title: 'Notificación FCM',
          body: '¡Contenido del mensaje!',
        },
        data: {
          extraData: 'valor'
        }
      });
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
