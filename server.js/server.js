const http = require('http');
const { randomBytes } = require('crypto');
const { WebSocket, WebSocketServer } = require('ws');
const PORT = Number(process.env.PORT || 10000);
const GAME_ORIGIN = 'https://little-known-game.onrender.com';
const rooms = new Map();
const clients = new WeakMap();
const server = http.createServer((req, res) => {
  if (req.method === 'OPTIONS') { addCors(req, res); res.writeHead(204); return res.end(); }
  if (req.url === '/health') { addCors(req, res); res.writeHead(200, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }); return res.end(JSON.stringify({ ok: true })); }
  res.writeHead(404, { 'Content-Type': 'text/plain' }); res.end('Not found');
});
const wss = new WebSocketServer({ noServer: true, maxPayload: 16 * 1024 });
function addCors(req, res) { if (req.headers.origin === GAME_ORIGIN) { res.setHeader('Access-Control-Allow-Origin', GAME_ORIGIN); res.setHeader('Vary', 'Origin'); } }
function send(ws, message) { if (ws && ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify(message)); }
function reject(ws, type) { send(ws, { type }); setTimeout(() => { try { ws.close(1000); } catch {} }, 100); }
function makeId() { return randomBytes(8).toString('hex'); }
server.on('upgrade', (req, socket, head) => {
  let url; try { url = new URL(req.url, 'http://' + (req.headers.host || 'localhost')); } catch { socket.destroy(); return; }
  if (url.pathname !== '/ws' || req.headers.origin !== GAME_ORIGIN) { socket.destroy(); return; }
  wss.handleUpgrade(req, socket, head, (ws) => wss.emit('connection', ws, req));
});
wss.on('connection', (ws, req) => {
  const url = new URL(req.url, 'http://localhost');
  const roomCode = (url.searchParams.get('room') || '').toUpperCase();
  const role = url.searchParams.get('role');
  if (!/^[A-Z0-9]{5}$/.test(roomCode) || !['host', 'join'].includes(role)) { reject(ws, 'no-room'); return; }
  let room = rooms.get(roomCode);
  const id = makeId();
  if (role === 'host') {
    if (room) { reject(ws, 'room-taken'); return; }
    room = { host: ws, members: new Map() }; rooms.set(roomCode, room); clients.set(ws, { roomCode, role, id }); send(ws, { type: 'open', id });
  } else {
    if (!room || room.host.readyState !== WebSocket.OPEN) { reject(ws, 'no-room'); return; }
    if (room.members.size >= 7) { reject(ws, 'full'); return; }
    room.members.set(id, ws); clients.set(ws, { roomCode, role, id }); send(ws, { type: 'open', id });
  }
  ws.isAlive = true; ws.on('pong', () => { ws.isAlive = true; });
  ws.on('message', (raw) => {
    let message; try { message = JSON.parse(raw.toString()); } catch { return; }
    const client = clients.get(ws); const currentRoom = client && rooms.get(client.roomCode); if (!client || !currentRoom) return;
    if (client.role === 'join' && message.type === 'join') {
      const name = String(message.name || 'Friend').trim().slice(0, 18) || 'Friend';
      send(currentRoom.host, { type: 'relay', from: client.id, payload: { type: 'join', name } });
    } else if (client.role === 'join' && message.type === 'host') {
      send(currentRoom.host, { type: 'relay', from: client.id, payload: message.payload });
    } else if (client.role === 'host' && message.type === 'to') {
      send(currentRoom.members.get(message.to), { type: 'message', payload: message.payload });
    }
  });
  ws.on('close', () => {
    const client = clients.get(ws); if (!client) return;
    const currentRoom = rooms.get(client.roomCode); if (!currentRoom) return;
    if (client.role === 'host' && currentRoom.host === ws) {
      rooms.delete(client.roomCode);
      for (const guest of currentRoom.members.values()) { send(guest, { type: 'closed' }); setTimeout(() => { try { guest.close(1000); } catch {} }, 100); }
    } else if (client.role === 'join' && currentRoom.members.get(client.id) === ws) {
      currentRoom.members.delete(client.id); send(currentRoom.host, { type: 'relay', from: client.id, payload: { type: 'leave' } });
    }
  });
});
const heartbeat = setInterval(() => { for (const ws of wss.clients) { if (ws.isAlive === false) { ws.terminate(); continue; } ws.isAlive = false; try { ws.ping(); } catch { ws.terminate(); } } }, 25000);
server.listen(PORT, '0.0.0.0', () => console.log('Little Known relay listening on ' + PORT));
function shutdown() { clearInterval(heartbeat); for (const ws of wss.clients) { try { ws.close(1001, 'Server restarting'); } catch {} } wss.close(() => server.close(() => process.exit(0))); setTimeout(() => process.exit(0), 10000).unref(); }
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
