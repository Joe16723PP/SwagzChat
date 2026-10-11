# SwagzChat

Angular 22 chat client in `web/`, with a Node service and MongoDB in `server/`.

## Run locally

Start MongoDB and the API:

```bash
docker compose up --build
```

In another terminal, from `web/`, use Node 22:

```bash
npm start
```

Open http://127.0.0.1:4200, enter a name, and the chat workspace opens. The API is http://127.0.0.1:3000.

## Checks

From `web/`:

```bash
npm test -- --watch=false
npm run build
```

From `server/`:

```bash
node --test src/handle.test.js
```
