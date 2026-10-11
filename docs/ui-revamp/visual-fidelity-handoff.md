# SwagzChat UI Revamp — Implementation Handoff

**Status: READY TO HAND-OFF**  
**Refreshed against:** `c3825b0` — “Replace Angular Material with Tailwind for the chat client.”  
**Implementation target:** `web/` (Angular 22)  
**Visual reference:** [`reference.png`](./reference.png)  
**Product rules and exact demo copy:** [`spec.md`](./spec.md)

## Objective

Bring the current SwagzChat workspace closer to `reference.png` while preserving the working guest and live chat experience. The reference is the visual target for the populated desktop composition. `spec.md` is the authority for fixture copy, product behavior, design principles, and intentional deviations from the image.

Implement against the current Angular 22 and Tailwind-configured client, not the removed Angular 8/Firebase client or the removed Angular Material design system. Do not change the Node/MongoDB service contract for this visual pass.

## Current baseline

The reviewed source is commit `c3825b0`. The client is a standalone Angular 22 app using signals, with Tailwind CSS 4 registered in the build. Chat and landing UI still have component stylesheets (`web/src/app/pages/chat/chat.css` and `landing.css`), so keep the visual implementation coherent with the current CSS tokens and conventions. Do not reintroduce Angular Material.

Relevant current files:

- `web/src/app/pages/chat/chat.ts`, `chat.html`, `chat.css` — workspace state, interaction handlers, template, and styling.
- `web/src/app/pages/landing/landing.ts`, `landing.html`, `landing.css` — guest name entry.
- `web/src/app/core/chat-model.ts` — conversation/profile formatting and ordering helpers.
- `web/src/app/core/chat-db.service.ts` and `core/api.ts` — live service integration.
- `web/src/app/app.routes.ts` — `/` and guest-guarded `/chat`; there is no demo-preview route today.
- `web/src/styles.css` and `web/.postcssrc.json` — global styles and Tailwind/PostCSS setup.

The existing app already supports guest entry and stored handles; Chats and People views; filtering; live conversation selection and messages; send/error handling; unread/read-on-open; pagination and jump-to-latest; presence; add/message/unfriend friend actions; group creation and validation; emoji insertion; and responsive pane behavior. Calls, video, attachments, and images are intentionally unavailable and must remain clearly disabled. Preserve these flows; the revamp is not a chat-feature rewrite.

The `/chat` page currently starts with no selected conversation. Its state comes from the guest and live API. The template uses Unicode/emoji glyphs for several navigation and message actions, and the right rail presents Friends and Create group in a single pane. There is no deterministic fixture preview in the current routes or chat state. Treat prior screenshots of a real guest session as observations of that session only, not as a canonical demo state.

## Settled product choices

The following decisions in `spec.md` govern implementation and sign-off:

1. Keep **Notes** pinned first and unselected; select Mina in the preview.
2. Use deterministic initials and avatar colors, not portraits.
3. Omit delivery/read marks because the service does not record receipts.
4. Keep the preview group name empty and **Create group** disabled with its inline reason, despite the reference’s enabled-looking button.
5. Emoji inserts into the draft. Calls, video, attachments, and images remain disabled with explanations.
6. Keep **Demo account** and **Demo chat · names are not verified** visible. Do not imply identity verification, encryption, privacy, or receipt state that the service cannot establish.
7. Keep `/chat` live and service-backed. Do not substitute fixtures for live data or force a selected conversation for real guests.
8. Use the fixture text, local clock, order, unread count, presence, and handles exactly as specified in `spec.md` section 10.

## Design principles

1. **Conversation first:** give the active thread and composer the strongest hierarchy; keep people management available without competing with the conversation.
2. **Identity stays honest:** show guest display name and stable handle, and retain the demo/unverified cues. Never invent verification, delivery, or privacy states.
3. **State is visible:** selection, unread, presence, loading, failure, disabled, and success states must be communicated with text, shape, icon, or status as well as color.
4. **Preserve behavior:** refine the existing Angular components and service-backed handlers. Do not replace live interactions with fixture-only controls.
5. **Keep actions understandable:** preserve friend-removal confirmation, failed-send drafts, group validation, and clear Leave behavior.
6. **Use one visual system:** align spacing, typography, borders, avatar treatment, icons, and focus states across the header, list, thread, and rail. Use blue for primary/selected, amber for the demo disclosure, and red for Leave/destructive actions.
7. **Responsive continuity:** compact layouts move among list, People, and thread panes without losing selection or draft; they do not squeeze three desktop columns into a phone.
8. **Accessibility is part of the design:** provide labels, keyboard operation, visible focus, readable contrast, announcements, and reduced-motion handling.
9. **Preview is isolated and read-only:** fixture rendering must not create guests, call mutating endpoints, change MongoDB, or alter the live guest session.

## Implementation plan

### Milestone 1 — Add a deterministic, read-only reference preview

**Likely files:** `web/src/app/app.routes.ts`, a small fixture/view-model module under `web/src/app/`, `chat.ts`, `chat.html`, and focused tests.

- Add an explicit development-only preview entry (for example `/chat?demo=1`) that is absent or rejected in production builds. Keep the normal `/chat` guest guard and data path unchanged.
- Add fixture data from `spec.md` section 10: Riley Park `@riley`, Notes plus the exact ordered conversation rows, Mina selected, exact message thread, friends/presence, and Mina/Jordan selected in the group form.
- Pin fixture time to Thursday 11 June 2026 at 10:30 in the browser’s local zone so timestamps/activity labels remain stable.
- Keep fixture data outside the API/database and do not use `GuestService.enter`, presence registration, or any mutating `ChatDbService` method in preview mode.
- Prevent preview actions from sending, marking read, adding/removing friends, creating groups, changing presence, or leaving/clearing a real guest session. Safe local-only search, selection, and emoji-picker presentation may work if clearly isolated.
- Preserve the normal live initial state: no forced selection and no demo records.

**Exit checks:** two reloads show identical fixture content and state; preview causes no API/database mutation; regular `/chat` remains service-backed and unchanged.

### Milestone 2 — Match desktop composition and conversation hierarchy

**Likely files:** `chat.html`, `chat.css`, `styles.css`.

- Use `reference.png` at 1586 × 992 as the comparison target and capture the implementation at 1600 × 1000.
- Refine the full-width header, three-column proportions, pane borders/radii, gutters, list density, selected Mina row, unread badge, conversation header, disclosure banner, message rhythm, and anchored composer.
- Keep Notes pinned above Mina; use stable initials and colors. Keep message bubbles and metadata readable and prevent long names/previews/messages from forcing column overflow.
- Style Friends and Create group as distinct nested cards within the right rail while retaining the existing data and action handlers.
- Retain the light neutral palette and restrained blue/amber/red accents specified in `spec.md`; adjust existing CSS variables instead of creating an unrelated design system.

**Exit checks:** reference fixture fills the center thread and right rail; columns, content density, hierarchy, and spacing closely match the reference at desktop size; the live empty-selection state remains valid.

### Milestone 3 — Unify controls and finish friend/group states

**Likely files:** `chat.html`, `chat.css`, and any small shared icon assets/component if needed.

- Replace mixed navigation emoji and text glyph controls with a consistent line-icon treatment matching the reference. Prefer small inline SVGs or an existing project asset; do not add a UI framework solely for icons.
- Style group member toggles, selected chips, removal affordances, search, and disabled/validation states. Keep `aria-pressed`, labels, and visible focus states.
- Preserve exact group rule: a name and at least two selected friends are required; empty name displays the reason and disables Create group.
- Keep calls/video/attachment/image controls disabled and explained. Keep the emoji picker functional in live mode, with insertion rather than sending.

**Exit checks:** no browser-default member selector remains; icon-only actions have accessible names; disabled controls explain why; live friend/group/emoji actions still call their existing handlers.

### Milestone 4 — Responsive and accessibility pass

- Compare desktop and compact behavior at **1024 × 768**, **768 × 1024**, and **390 × 844**.
- Preserve the current pane-switching behavior, selected conversation, and draft when moving between panes. Check that the header and Leave action remain discoverable without horizontal page scrolling.
- Verify keyboard navigation, focus visibility, semantic pressed/current state, labels, live announcements for errors/status, and reduced-motion behavior for animations.

**Exit checks:** all specified widths remain usable with no horizontal page overflow; the thread remains readable and composer reachable; core actions are keyboard accessible.

### Milestone 5 — Regression checks and handoff evidence

- Run the documented checks from the project README:

  ```bash
  (cd web && npm test -- --watch=false)
  (cd web && npm run build)
  (cd server && node --test src/handle.test.js)
  ```

- Capture final screenshots at **1600 × 1000** and **390 × 844**. Record intentional visual differences and any remaining gaps.
- Confirm regular live flows still work: guest entry/Leave, conversation selection, search, send/failure recovery, unread/read-on-open, presence, friend actions, group validation/creation, emoji insertion, earlier messages, and jump-to-latest.
- Record exact command results, screenshots, changed files, and deferred features in the handoff notes.

**Exit checks:** all project checks pass; live behavior remains intact; preview remains read-only; final screenshots and any residual gaps are recorded.

## Acceptance checklist

- [ ] Handoff and implementation target the current Angular 22/Tailwind-configured app at `c3825b0`; no Angular Material or old Firebase assumptions remain.
- [ ] A development-only deterministic preview matches `spec.md` section 10 and is read-only.
- [ ] Ordinary `/chat` remains guest-guarded, API-backed, and initially unselected.
- [ ] Notes is first and unselected; Mina is selected with unread count 2 in the fixture.
- [ ] Desktop layout matches the reference composition and density, subject to settled differences.
- [ ] Friends and Create group are visually distinct cards; group validation and selection are styled and accessible.
- [ ] Existing guest, search, message, unread, presence, friend, group, emoji, pagination, and responsive behavior is preserved.
- [ ] Unsupported call/video/upload controls are disabled and explained; no fake receipts are shown.
- [ ] Compact widths have no horizontal page overflow and preserve task continuity.
- [ ] Client tests, client build, and server handle tests pass; commands/results and final screenshots are recorded.

## Out of scope

- Rebuilding current guest, chat, search, presence, friendship, group, message history, emoji, or mobile flows.
- Authentication or identity/security redesign; API/schema/database changes; writing reference fixtures to MongoDB.
- Calls, video, attachment/image upload, delivery/read receipts, or deployment.
- Reintroducing Angular 8, Firebase, or Angular Material.
