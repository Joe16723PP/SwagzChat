import { randomUUID } from 'node:crypto';

const MESSAGE_PAGE = 50;

export function createStore(db) {
  const profiles = db.collection('profiles');
  const friends = db.collection('friends');
  const conversations = db.collection('conversations');
  const messages = db.collection('messages');
  const inbox = db.collection('inbox');

  return {
    async indexes() {
      await friends.createIndex({ uid: 1 });
      await inbox.createIndex({ uid: 1 });
      await messages.createIndex({ conversationId: 1, createdAt: 1 });
      await profiles.createIndex({ handle: 1 }, { unique: true, sparse: true });
    },

    async listProfiles() {
      const rows = await profiles.find({}).toArray();
      const taken = new Set(rows.map((row) => row.handle).filter(Boolean));
      const result = [];
      for (const row of rows) {
        let handle = row.handle;
        if (!handle) {
          handle = chooseHandle(row.nickname || 'guest', row._id, taken);
          taken.add(handle);
          await profiles.updateOne({ _id: row._id }, { $set: { handle } });
        }
        result.push({
          uid: row._id,
          nickname: row.nickname,
          handle,
          status: row.status === true,
        });
      }
      return result;
    },

    listFriends(uid) {
      return friends
        .find({ uid })
        .toArray()
        .then((rows) => rows.map((row) => row.friendUid));
    },

    listInbox(uid) {
      return inbox
        .find({ uid })
        .toArray()
        .then((rows) =>
          rows.map((row) => {
            const item = {
              id: row.conversationId,
              kind: row.kind,
              lastText: row.lastText ?? '',
              updatedAt: row.updatedAt ?? 0,
              unread: row.unread ?? 0,
            };
            if (typeof row.title === 'string') {
              item.title = row.title;
            }
            if (typeof row.peerUid === 'string') {
              item.peerUid = row.peerUid;
            }
            return item;
          }),
        );
    },

    listMessages(conversationId) {
      return messages
        .find({ conversationId })
        .sort({ createdAt: -1 })
        .limit(MESSAGE_PAGE)
        .toArray()
        .then((rows) => rows.reverse().map(messageView));
    },

    listMessagesBefore(conversationId, before, limit) {
      const size = Math.min(Math.max(limit, 1), MESSAGE_PAGE);
      return messages
        .find({ conversationId, createdAt: { $lt: before } })
        .sort({ createdAt: -1 })
        .limit(size)
        .toArray()
        .then((rows) => rows.reverse().map(messageView));
    },

    async ensureAccount(uid, name) {
      const existing = await profiles.findOne({ _id: uid });
      let handle = existing?.handle;
      if (!handle) {
        const takenRows = await profiles.find({ handle: { $exists: true } }, { projection: { handle: 1 } }).toArray();
        handle = chooseHandle(name, uid, new Set(takenRows.map((row) => row.handle)));
      }
      await profiles.updateOne(
        { _id: uid },
        { $set: { nickname: name, handle, status: true } },
        { upsert: true },
      );
      const id = `own_${uid}`;
      const ownChat = await conversations.findOne({ _id: id });
      if (!ownChat) {
        const ts = Date.now();
        await conversations.insertOne({
          _id: id,
          kind: 'own',
          ownerUid: uid,
          createdAt: ts,
          updatedAt: ts,
          members: [{ uid, joinedAt: ts }],
        }).catch(ignoreDuplicate);
        await inbox.insertOne({
          _id: `${uid}:${id}`,
          uid,
          conversationId: id,
          kind: 'own',
          title: 'Notes',
          lastText: '',
          updatedAt: ts,
          unread: 0,
        }).catch(ignoreDuplicate);
      }
      return handle;
    },

    async setStatus(uid, status) {
      await profiles.updateOne({ _id: uid }, { $set: { status } });
    },

    async addFriend(myUid, friendUid) {
      if (myUid === friendUid) {
        fail(400, 'You cannot add yourself.');
      }
      const ts = Date.now();
      await friends.updateOne({ _id: `${myUid}:${friendUid}` }, { $set: { uid: myUid, friendUid, createdAt: ts } }, { upsert: true });
      await friends.updateOne({ _id: `${friendUid}:${myUid}` }, { $set: { uid: friendUid, friendUid: myUid, createdAt: ts } }, { upsert: true });
    },

    async removeFriend(myUid, friendUid) {
      await friends.deleteOne({ _id: `${myUid}:${friendUid}` });
      await friends.deleteOne({ _id: `${friendUid}:${myUid}` });
    },

    async createFriendConversation(myUid, friendUid) {
      const edge = await friends.findOne({ _id: `${myUid}:${friendUid}` });
      if (!edge) {
        fail(400, 'Add that person as a friend first.');
      }
      const existing = await conversations.findOne({
        kind: 'friend',
        'members.uid': { $all: [myUid, friendUid] },
      });
      if (existing) {
        return existing._id;
      }
      const id = `c_${randomUUID()}`;
      const ts = Date.now();
      await conversations.insertOne({
        _id: id,
        kind: 'friend',
        ownerUid: myUid,
        peerUid: friendUid,
        createdAt: ts,
        updatedAt: ts,
        members: [
          { uid: myUid, joinedAt: ts },
          { uid: friendUid, joinedAt: ts },
        ],
      });
      await inbox.insertOne(inboxDoc(myUid, id, 'friend', ts, { peerUid: friendUid }));
      await inbox.insertOne(inboxDoc(friendUid, id, 'friend', ts, { peerUid: myUid }));
      return id;
    },

    async createGroup(ownerUid, name, memberUids) {
      const uniqueMembers = [...new Set(memberUids.filter((uid) => uid && uid !== ownerUid))];
      if (!name || uniqueMembers.length < 2) {
        fail(400, 'A group needs a name and two other people.');
      }
      const friendUids = new Set(await this.listFriends(ownerUid));
      if (uniqueMembers.some((uid) => !friendUids.has(uid))) {
        fail(400, 'A group can only include friends.');
      }
      const id = `c_${randomUUID()}`;
      const ts = Date.now();
      await conversations.insertOne({
        _id: id,
        kind: 'group',
        ownerUid,
        name,
        createdAt: ts,
        updatedAt: ts,
        members: [{ uid: ownerUid, joinedAt: ts }, ...uniqueMembers.map((uid) => ({ uid, joinedAt: ts }))],
      });
      await inbox.insertOne(inboxDoc(ownerUid, id, 'group', ts, { title: name }));
      for (const memberUid of uniqueMembers) {
        await inbox.insertOne(inboxDoc(memberUid, id, 'group', ts, { title: name }));
      }
      return id;
    },

    async sendMessage(conversationId, senderUid, text) {
      const conversation = await conversations.findOne({ _id: conversationId });
      if (!conversation) {
        fail(404, 'That conversation does not exist.');
      }
      const memberUids = conversation.members.map((member) => member.uid);
      if (!memberUids.includes(senderUid)) {
        fail(403, 'You are not a member of this conversation.');
      }
      const ts = Date.now();
      const messageId = `m_${randomUUID()}`;
      await messages.insertOne({
        _id: messageId,
        conversationId,
        senderUid,
        text,
        createdAt: ts,
      });
      await conversations.updateOne({ _id: conversationId }, { $set: { updatedAt: ts } });
      for (const memberUid of memberUids) {
        const row = inboxFields(conversation, memberUid, memberUids);
        const existing = await inbox.findOne({ _id: `${memberUid}:${conversationId}` });
        const unread = memberUid === senderUid ? 0 : (existing?.unread ?? 0) + 1;
        const fields = {
          uid: memberUid,
          conversationId,
          kind: row.kind,
          lastText: text,
          updatedAt: ts,
          unread,
        };
        if (row.title) {
          fields.title = row.title;
        }
        if (row.peerUid) {
          fields.peerUid = row.peerUid;
        }
        await inbox.updateOne({ _id: `${memberUid}:${conversationId}` }, { $set: fields }, { upsert: true });
      }
      return memberUids;
    },

    async markRead(uid, conversationId) {
      await inbox.updateOne({ _id: `${uid}:${conversationId}` }, { $set: { unread: 0 } });
    },

    async isMember(conversationId, uid) {
      const conversation = await conversations.findOne({ _id: conversationId, 'members.uid': uid });
      return Boolean(conversation);
    },
  };
}

function inboxDoc(uid, conversationId, kind, ts, extra) {
  return {
    _id: `${uid}:${conversationId}`,
    uid,
    conversationId,
    kind,
    lastText: '',
    updatedAt: ts,
    unread: 0,
    ...extra,
  };
}

function inboxFields(conversation, memberUid, memberUids) {
  if (conversation.kind === 'own') {
    return { kind: 'own', title: 'Notes' };
  }
  if (conversation.kind === 'group') {
    return { kind: 'group', title: conversation.name || 'Group' };
  }
  return { kind: 'friend', peerUid: memberUids.find((uid) => uid !== memberUid) };
}

function messageView(row) {
  return {
    id: row._id,
    senderUid: row.senderUid,
    text: row.text,
    createdAt: row.createdAt,
  };
}

export function chooseHandle(name, uid, taken) {
  let base = String(name ?? '').toLowerCase().replace(/[^a-z0-9]/g, '');
  if (base.length < 3) {
    base = 'guest';
  }
  base = base.slice(0, 16);
  if (!taken.has(base)) {
    return base;
  }
  const idPart = String(uid ?? '').toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 4) || '0000';
  const room = Math.max(1, 20 - idPart.length - 1);
  const stem = `${base.slice(0, room)}_${idPart}`;
  if (!taken.has(stem)) {
    return stem;
  }
  let n = 2;
  while (n < 1000) {
    const suffix = String(n);
    const candidate = `${stem.slice(0, 20 - suffix.length)}${suffix}`;
    if (!taken.has(candidate)) {
      return candidate;
    }
    n += 1;
  }
  return stem;
}

function fail(status, message) {
  const error = new Error(message);
  error.status = status;
  throw error;
}

function ignoreDuplicate(error) {
  if (error?.code !== 11000) {
    throw error;
  }
}
