# SwagzChat Visual Fidelity — Implementation Handoff

**Status: SIGNED OFF — remaining visual pass complete, with the gaps listed below**

**Current baseline:** `e6a87d2` — “Add a read-only reference preview and align the chat workspace with the visual target.”

**Implementation target:** `web/` (Angular 22, Tailwind CSS 4 configured)

**Reference:** [`reference.png`](./reference.png)

**Product rules and fixture copy:** [`spec.md`](./spec.md)

## Goal

Complete the remaining visual-fidelity work against `reference.png` while preserving the working live guest/chat experience. The reference is 1586 × 992; use a 1600 × 1000 browser viewport for sign-off. Keep all established product decisions in `spec.md`, including Notes pinned first, initials instead of portraits, no unsupported message receipts, honest demo labels, and a disabled Create group action while the group name is empty.

This is a focused finishing pass. The development-only preview and fixture have already been implemented in `e6a87d2`; do not schedule them for initial implementation again.

## Authority and scope

- This handoff is authoritative for **current implementation status, remaining milestones, and sign-off evidence**.
- `spec.md` remains authoritative for **product behavior, design principles, exact copy, fixture details, and intentional deviations from the image**.
- The older baseline and milestone language in `spec.md` §9 is superseded by this handoff. Do not interpret it as saying the preview still needs to be added.
- Stay in `web/` for UI work. Do not change the API, database schema, guest identity model, or deployment setup.
- Do not reintroduce Angular Material, Angular 8, or Firebase.

## Current implementation baseline

The current app is Angular 22 with standalone components and signals. Tailwind CSS 4 is registered, while the chat page’s styling is primarily in its component CSS files.

Already implemented in `e6a87d2`:

- Development-only `/preview` route guarded by `isDevMode()` in `web/src/app/app.routes.ts`.
- Fixed-time fixture in `web/src/app/core/preview-fixture.ts`, with Riley, Notes, Mina selected, exact conversation rows/messages, friend presence, and Mina/Jordan selected for group creation.
- Preview-specific state initialization and protections in `web/src/app/pages/chat/chat.ts`; normal `/chat` remains guest-guarded and service-backed.
- Three-pane workspace, separate Friends and Create group cards, SVG line icons, initials/color avatars, exact demo disclosure, and disabled unsupported call/upload actions.
- Fixture unit coverage in `web/src/app/core/preview-fixture.spec.ts` and preview/live component coverage in `web/src/app/pages/chat/chat.spec.ts`.

Existing live functionality remains in place: guest entry and Leave; Chats/People; filtering; live conversation selection and messages; send failure handling; read/unread; presence; friend add/message/unfriend; group creation; emoji insertion; pagination; jump-to-latest; responsive pane behavior.

### Current visual review

The target-viewport review is recorded in [Sign-off evidence](#sign-off-evidence). The earlier 1600 × 768 checkpoint is superseded: at 1600 × 1000 the Friends list and Create group card are both on screen, the member list starts collapsed, incoming initials mark the first bubble of a run, and the header and panes sit in one rounded frame.

## Design principles

1. **Conversation first:** keep the active thread and composer as the primary work surface; people management must not crowd it.
2. **Identity stays honest:** show the demo and unverified-name cues; never imply verification, privacy, delivery, or read state the service cannot prove.
3. **State is visible:** selection, unread, presence, loading, failure, and disabled states need non-color cues as well as color.
4. **Preserve behavior:** refine existing components and handlers instead of replacing live interactions with fixture-only behavior.
5. **Progressive disclosure:** show core controls by default and reveal secondary member choices when the user searches or explicitly opens that picker.
6. **One visual system:** align spacing, typography, borders, avatar treatment, icons, and focus states; use blue for primary/selected, amber for disclosure, and red for Leave/destructive actions.
7. **Responsive continuity:** compact layouts move among panes without losing selection or draft.
8. **Accessible by construction:** keyboard operation, visible focus, labels, announcements, readable contrast, and reduced-motion behavior are part of sign-off.
9. **Preview remains isolated:** preview never creates a guest or calls API/database mutations.

## Remaining implementation plan

### Milestone 1 — Reduce default group-picker density

**Files:** `web/src/app/pages/chat/chat.ts`, `chat.html`, `chat.css` (and related tests).

- Keep the group name field, Add members search, and selected Mina/Jordan chips visible in the reference state.
- Do not render the unfiltered friend-choice list while the search is empty. Show matching choices when the user enters a non-empty query; selected members remain visible as removable chips.
- If the existing interaction needs a way to browse without typing, add a clearly labeled, keyboard-operable “Choose members” disclosure control. Keep the default preview collapsed.
- Preserve selected/unselected state, `aria-pressed`, keyboard operation, group validation, and existing live group-creation handlers.
- Keep preview group creation inert; the empty name keeps Create group disabled with the reason **Enter a group name.**

**Exit checks:** with empty group search, no member-option rows are rendered; typing a friend name reveals only matches; keyboard users can select/remove members; the live service receives the same member IDs as before.

### Milestone 2 — Match message-thread rhythm and workspace frame

**Files:** `web/src/app/pages/chat/chat.html`, `chat.css`, and `chat-shell.css`.

- At the target viewport, compare column boundaries, outer radius/frame, header height, pane gutters, list row height, thread header, disclosure, message spacing, and composer placement against `reference.png`.
- Add deterministic initials beside incoming message turns where this improves the reference match; do not introduce portrait assets or duplicate avatars on every consecutive incoming message.
- Align timestamps consistently with the bubble edge and turn grouping, matching the reference’s compact rhythm without reducing readability.
- Keep the reference deviations required by `spec.md`: Notes row first, initials/color avatars, no receipt marks, and disabled empty group form.
- Preserve scrolling ownership: conversation list, message history, and Friends card scroll internally; header and composer remain visible.

**Exit checks:** at 1600 × 1000 the complete Friends list, Create group card, message thread, and composer are visible in the intended hierarchy; no pane is clipped or causes page-level horizontal scrolling; live `/chat` still supports its empty-selection state.

### Milestone 3 — Verify compact layouts and interaction accessibility

- Review **1024 × 768**, **768 × 1024**, and **390 × 844** in addition to desktop.
- Confirm the Friends card scrolls internally when vertical space is short; verify the group form remains reachable and does not cover or displace the conversation task.
- Check keyboard access and visible focus for navigation, conversation rows, member search/options, chips/removal, menus, and composer.
- Check reduced-motion behavior, semantic selected/current state, accessible names, and status/error announcements.

**Exit checks:** no horizontal page scrolling; selection and draft survive pane changes; all core tasks can be completed by keyboard; status is not conveyed by color alone.

### Milestone 4 — Regression, visual sign-off, and handoff record

Run these documented checks from the project root:

```bash
(cd web && npm test -- --watch=false)
(cd web && npm run build)
(cd server && node --test src/handle.test.js)
```

Then:

- Capture `/preview` at **1600 × 1000** and **390 × 844**. Record browser zoom and confirm the local development server is serving the current build.
- Compare the desktop capture with the 1586 × 992 reference and list only remaining gaps, with their impact.
- Verify a production build does not expose `/preview`; the route is development-only.
- Confirm `/preview` does not call `waitUntilConnected`, `ensureAccount`, `startPresence`, `markRead`, `sendMessage`, `addFriend`, `removeFriend`, `createFriendConversation`, or `createGroup`.
- Confirm live guest entry/Leave, search, conversation selection, send/failure recovery, read/unread, presence, friend actions, group validation/creation, emoji insertion, earlier messages, and jump-to-latest still use the existing service-backed behavior.
- Record exact check results, screenshot paths, changed files, known gaps, and deferred unsupported controls in this file.

**Exit checks:** all three project checks pass; the production route check and preview no-mutation check pass; target-viewport screenshots are reviewed; remaining deviations are documented.

## Acceptance checklist

- [x] Development-only `/preview` route exists and is unavailable outside development mode.
- [x] Exact, fixed-time reference fixture exists and is isolated from live service data.
- [x] Preview opens as Riley with Mina selected; Notes remains first; group form begins with Mina and Jordan selected and an empty name.
- [x] Chat uses the current Angular 22/Tailwind-configured client; no Material/Firebase/Angular 8 assumptions remain.
- [x] Unfiltered group options are hidden by default and search reveals matching choices accessibly.
- [x] At 1600 × 1000, full Friends and Create group cards, messages, and composer match the reference hierarchy and density.
- [x] Message timestamp/avatar rhythm and outer workspace framing receive a desktop comparison pass.
- [x] Responsive and keyboard/focus checks pass at all specified viewports.
- [x] Client tests, client production build, and server handle tests pass and are recorded.
- [x] Final desktop/mobile captures and remaining differences are recorded.

## Sign-off evidence

Captured from `ng serve` at `http://127.0.0.1:4200/preview`, zoom 100%, device pixel ratio 1.

- Desktop: [`captures/preview-1600x1000.png`](./captures/preview-1600x1000.png) — 1600 × 1000. Friends, Create group, the Mina thread, and the composer are all inside the frame. Page scroll width equals the viewport.
- Phone: [`captures/preview-390x844.png`](./captures/preview-390x844.png) — 390 × 844. The open thread shows Back and Leave; the message list scrolls inside the pane.

Checks, run with Node 22:

- `(cd web && npm test -- --watch=false)` — 17 passed.
- `(cd web && npm run build)` — passed. Initial bundle 233.72 kB. No component-style budget error.
- `(cd server && node --test src/handle.test.js)` — 2 passed.
- Production `dist` served locally: `/preview` resolves to `/` and shows the name form. The development server still serves the fixture at `/preview`.
- Preview resource timing contained no account, live, or presence requests. Preview create stays disabled with **Enter a group name.**

Also checked 1024 × 768 and 768 × 1024. At 1024 × 768, opening Friends hides the thread, the Friends card scrolls internally, and the group form stays on screen. Mina stays selected and the composer draft stays. At 768 × 1024 and 390 × 844 there is no page-level horizontal scroll. Focus styles are defined for navigation, rows, member choices, chips, Choose members, and buttons.

Changed for this pass: `web/src/app/pages/chat/chat.html`, `chat.ts`, `chat-shell.css`, `chat.spec.ts`.

### Remaining gaps

- Initials and color avatars stand in for the reference portraits. No delivery or read marks. Both are required by `spec.md`.
- Incoming initials appear on the first bubble of a consecutive run. The reference repeats a portrait on every incoming bubble.
- Incoming times sit on the bubble’s trailing edge. Outgoing times sit under that edge.
- Calls, video, and attachments stay disabled.
- Preview Leave still calls `GuestService.leave()`. Clearing that stored guest is deferred until after this visual pass.
- `spec.md` §5 still mentions Material theme tokens, and principle 5 still says to disable emoji. Settled behavior is Tailwind styling and an emoji control that inserts a character.

## Out of scope

- Rebuilding the existing guest, chat, search, presence, friendship, group, messaging, emoji, pagination, or responsive flows.
- Authentication/identity redesign; API/schema/database changes; storing fixture data in MongoDB.
- Calls, video, attachment/image upload, delivery/read receipts, or deployment.
- Reintroducing Angular Material, Angular 8, or Firebase.
