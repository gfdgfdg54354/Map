const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const cors = require('cors');

const app = express();
app.use(cors());

const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

let flags = []; // { id, type, lat, lng }

wss.on('connection', (ws) => {
  console.log('Client connected');

  // Отправляем все текущие флаги новому клиенту
  ws.send(JSON.stringify({ type: 'init', data: flags }));

  // Обработка новых сообщений
  ws.on('message', (message) => {
    const msg = JSON.parse(message);

    if (msg.type === 'add') {
      flags.push(msg.data);
      broadcast({ type: 'add', data: msg.data });
    }

    if (msg.type === 'remove') {
      flags = flags.filter(f => f.id !== msg.data.id);
      broadcast({ type: 'remove', data: msg.data });
    }
  });

  ws.on('close', () => console.log('Client disconnected'));
});

// Рассылка всем клиентам
function broadcast(data) {
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(data));
    }
  });
}

// Сервер жив
app.get('/', (req, res) => {
  res.send('WebSocket сервер работает');
});

const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
  console.log(`Сервер запущен на порту ${PORT}`);
});
