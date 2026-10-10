import http from 'node:http';
import cors from 'cors';
import express from 'express';
import { MongoClient } from 'mongodb';
import { WebSocketServer } from 'ws';
import { createStore } from './store.js';

const port = Number(process.env.PORT ?? 3000);
const mongoUrl = process.env.MONGO_URL ?? 'mongodb://127.0.0.1:27017/swagzchat';
const origins = ['http://127.0.0.1:4200', 'http://localhost:4200'];

const client = new MongoClient(mongoUrl);
await client.connect();
const store = createStore(client.db());
await store.indexes();

const app = express();
app.use(cors({ origin: origins }));
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ ok: true });
});

app.put('/account', asyncRoute(async (req) => {
  const uid = guestId(req.body?.id);
  const name = personName(req.body?.name);
  await store.ensureAccount(uid, name);
  await publish({ profiles: true, uids: [uid] });
  return { id: uid };
}));

app.put('/presence', asyncRoute(async (req) => {
  const uid = guestId(req.body?.uid);
  await store.setStatus(uid, req.body?.status === true);
  await publish({ profiles: true });
  return { ok: true };
}));

app.post('/friends', asyncRoute(async (req) => {
  const myUid = guestId(req.body?.myUid);
  const friendUid = guestId(req.body?.friendUid);
  await store.addFriend(myUid, friendUid);
  await publish({ uids: [myUid, friendUid] });
  return { ok: true };
}));

app.delete('/friends', asyncRoute(async (req) => {
  const myUid = guestId(req.body?.myUid);
  const friendUid = guestId(req.body?.friendUid);
  await store.removeFriend(myUid, friendUid);
  await publish({ uids: [myUid, friendUid] });
  return { ok: true };
}));

app.post('/conversations/friend', asyncRoute(async (req) => {
  const myUid = guestId(req.body?.myUid);
  const friendUid = guestId(req.body?.friendUid);
  const id = await store.createFriendConversation(myUid, friendUid);
  await publish({ uids: [myUid, friendUid] });
  return { id };
}));

app.post('/conversations/group', asyncRoute(async (req) => {
  const ownerUid = guestId(req.body?.ownerUid);
  const name = personName(req.body?.name);
  const memberUids = Array.isArray(req.body?.memberUids) ? req.body.memberUids.map(guestId) : [];
  const id = await store.createGroup(ownerUid, name, memberUids);
  await publish({ uids: [ownerUid, ...memberUids] });
  return { id };
}));

app.post('/conversations/:id/messages', asyncRoute(async (req) => {
  const conversationId = guestId(req.params.id);
  const senderUid = guestId(req.body?.senderUid);
  const text = messageText(req.body?.text);
  const memberUids = await store.sendMessage(conversationId, senderUid, text);
  await publish({ uids: memberUids, conversationId });
  return { ok: true };
}));

app.post('/conversations/:id/read', asyncRoute(async (req) => {
  const conversationId = guestId(req.params.id);
  const uid = guestId(req.body?.uid);
  await store.markRead(uid, conversationId);
  await publish({ uids: [uid] });
  return { ok: true };
}));

app.use((error, _req, res, _next) => {
  const status = error.status ?? 500;
  res.status(status).json({ error: error.message || 'Something went wrong.' });
});

const server = http.createServer(app);
const sockets = new WebSocketServer({ server, path: '/live' });
const clients = new Set();

sockets.on('connection', (socket) => {
  const client = { socket, uid: '', conversationId: '' };
  clients.add(client);
  socket.on('message', (raw) => {
    void onMessage(client, raw).catch((error) => {
      send(client, { type: 'error', error: error.message || 'Something went wrong.' });
    });
  });
  socket.on('close', () => {
    clients.delete(client);
    if (!client.uid || [...clients].some((other) => other.uid === client.uid)) {
      return;
    }
    void store.setStatus(client.uid, false).then(() => publish({ profiles: true }));
  });
});

async function onMessage(client, raw) {
  const message = JSON.parse(String(raw));
  if (message.type === 'hello') {
    client.uid = guestId(message.uid);
    await store.setStatus(client.uid, true);
    await publish({ profiles: true, uids: [client.uid] });
    send(client, { type: 'ready' });
    return;
  }
  if (!client.uid) {
    return;
  }
  if (message.type === 'watch') {
    const conversationId = guestId(message.conversationId);
    if (!(await store.isMember(conversationId, client.uid))) {
      return;
    }
    client.conversationId = conversationId;
    send(client, {
      type: 'messages',
      conversationId,
      messages: await store.listMessages(conversationId),
    });
    return;
  }
  if (message.type === 'unwatch') {
    client.conversationId = '';
  }
}

async function publish({ profiles = false, uids = [], conversationId = '' }) {
  const profileRows = profiles ? await store.listProfiles() : null;
  const inboxByUid = new Map();
  const friendsByUid = new Map();
  for (const uid of new Set(uids)) {
    inboxByUid.set(uid, await store.listInbox(uid));
    friendsByUid.set(uid, await store.listFriends(uid));
  }
  const messageRows = conversationId ? await store.listMessages(conversationId) : null;
  for (const client of clients) {
    if (profileRows) {
      send(client, { type: 'profiles', profiles: profileRows });
    }
    if (inboxByUid.has(client.uid)) {
      send(client, { type: 'friends', friendUids: friendsByUid.get(client.uid) });
      send(client, { type: 'inbox', items: inboxByUid.get(client.uid) });
    }
    if (messageRows && client.conversationId === conversationId) {
      send(client, { type: 'messages', conversationId, messages: messageRows });
    }
  }
}

function send(client, payload) {
  if (client.socket.readyState === 1) {
    client.socket.send(JSON.stringify(payload));
  }
}

function asyncRoute(handler) {
  return (req, res, next) => {
    Promise.resolve()
      .then(() => handler(req))
      .then((body) => {
        if (!res.headersSent) {
          res.json(body);
        }
      })
      .catch(next);
  };
}

function guestId(value) {
  if (typeof value !== 'string' || !/^[A-Za-z0-9_-]{1,80}$/.test(value)) {
    const error = new Error('That id is not valid.');
    error.status = 400;
    throw error;
  }
  return value;
}

function personName(value) {
  const name = typeof value === 'string' ? value.trim() : '';
  if (!name || name.length > 32) {
    const error = new Error('Enter a name.');
    error.status = 400;
    throw error;
  }
  return name;
}

function messageText(value) {
  const text = typeof value === 'string' ? value.trim() : '';
  if (!text || text.length > 4000) {
    const error = new Error('Enter a message.');
    error.status = 400;
    throw error;
  }
  return text;
}

server.listen(port, () => {
  console.log(`SwagzChat API listening on ${port}`);
});
