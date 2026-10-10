# SwagzChat migration checklist

Legacy Angular 8 client stays at the repo root. The new client lives in `web/`.
Chat data for the new client is stored in MongoDB by the Node service in `server/`.
`docker compose up --build` starts MongoDB and that service. The Angular app calls `http://127.0.0.1:3000`.

The old Firebase project is `swagzchat-f9a11`. The new client does not use it.

Checked items are done in the repo. Deploy, LiveKit, and the chat port are still open.

## 1. Lock the data

- [x] Replace open root read/write with uid-scoped Realtime Database rules
- [x] Allow any signed-in user to read `users` (the people directory)
- [x] Allow a user to write only `users/{their uid}`
- [x] Allow friend-edge writes only by one of the two people
- [x] Allow a chat log read/write only by one of the two participants
- [x] Allow a group node write on another user only when that user already has the writer as a friend
- [x] Allow group chat read/write only when `groups/{auth.uid}/{groupId}` exists
- [ ] Deploy `database.rules.json` (`firebase deploy --only database`) at cutover
- [ ] Turn on App Check for the web app, then enforce it after the new client sends tokens

## 2. New Angular 22 client

- [x] Docker Compose runs MongoDB, and the Node service in `server/` stores chat
- [x] The Angular client calls that service instead of Firebase
- [x] Scaffold `web/` with Angular 22, standalone, zoneless, Vitest, no SSR
- [x] Call Firebase JS SDK 13 directly
- [x] Landing asks for a name and opens chat as that guest. Email and Google sign-in stay unused
- [x] Guarded `/chat` shell
- [ ] Point Firebase Hosting at `web/dist/swagz-chat/browser` when the new client replaces the legacy one
- [ ] Facebook sign-in (needs the Facebook provider enabled on the Firebase project)
- [x] Friends, people directory, and conversations (own, friend, group). Existing `chat_log` rows stay
- [x] `limitToLast` for the live tail, and unsubscribe when the thread changes
- [x] A new group is its own conversation. Friend chats stay as they are
- [ ] Backfill `chat_log` and `group_chat_log` into conversations
- [x] `onDisconnect` presence, separate from any call flag
- [ ] Playwright: sign in, send a message, open a thread

## 3. Calls

- [ ] Cloud Function issues a short-lived LiveKit token only after a friend check
- [ ] In-app call UI on the chat page
- [ ] Firebase Cloud Messaging ring when the tab is hidden
- [ ] Group rooms for an existing group

## 4. After the chat is private

- [ ] Attachments in Cloud Storage with storage rules
- [ ] Replies and reactions
- [ ] Typing indicator
- [ ] Read cursor
- [ ] Optional thread summary with Firebase AI Logic, started by the user, after App Check is enforced

## Leave for later

- End-to-end encryption
- A native app
- A second frontend
- Search. If it becomes a real feature, mirror settled messages to Firestore

## Check

From `web/`, with Node 22 (this machine: `~/.nvm/versions/node/v22.23.2`). Firebase JS SDK 13 declares Node 24 in its package metadata; the browser build still runs on Node 22.

```bash
npm run build
npx ng test --watch=false
```
