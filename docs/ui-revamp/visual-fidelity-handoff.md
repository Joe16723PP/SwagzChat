# SwagzChat Visual Fidelity — Implementation Handoff

**Status: SIGNED OFF — preview Leave is isolated, and the desktop capture is a single 1600 × 1000 viewport**

**Current baseline:** `14ded14` — “Document the preview screenshot and the visual milestone design.”

**UI implementation:** `78b06e6`; **preview foundation:** `e6a87d2`.

**Target:** `web/` (Angular 22; Tailwind CSS 4 configured)

**Reference:** [`reference.png`](./reference.png)

**Product rules and exact fixture:** [`spec.md`](./spec.md)

## Goal

Hand off the completed UI work for final visual review. Preserve the existing live guest/chat flows and compare the development-only `/preview` route against `reference.png`. Do not schedule the preview, fixture, line icons, separate rail cards, or responsive shell as new implementation work.

The reference image is **1586 × 992**. The review viewport is **1600 × 1000**, zoom 100%, device pixel ratio 1, captured from `npm start` at http://127.0.0.1:4200/preview. Phone Back is an explicit close and may clear the selection and draft. The Friends/Chats swap keeps both. Do not change Back in this pass.

## Authority and scope

- This handoff is authoritative for implementation status, the remaining sign-off steps, and current visual gaps.
- `spec.md` is authoritative for product behavior, design principles, exact fixture content, and intentional differences from the image.
- The earlier milestones in `spec.md` §9 are superseded. The preview and primary visual pass are implemented.
- UI changes stay in `web/`. Do not change the API, database schema, guest identity model, or deployment setup.
- Do not reintroduce Angular Material, Angular 8, or Firebase.

## Completed implementation

The current client is Angular 22 with standalone components and signals. Tailwind CSS 4 is configured; the chat workspace’s visual styles are primarily in component CSS.

- Development-only `/preview` route guarded by `isDevMode()` in `web/src/app/app.routes.ts`.
- Fixed-time fixture in `web/src/app/core/preview-fixture.ts`: Riley Park, Notes, Mina selected, reference conversation rows and thread, friend presence, and Mina/Jordan group selection.
- Preview-specific state and mutation guards in `web/src/app/pages/chat/chat.ts`; live `/chat` stays guest-guarded and service-backed.
- Three-pane shell, distinct Friends/Create group cards, SVG line icons, initials/color avatars, exact disclosure copy, disabled unsupported call/upload controls, and responsive pane behavior.
- Group member choices start collapsed behind **Choose members**; selected chips remain visible. Search or the disclosure reveals choices.
- Unit coverage for fixture data and chat preview/live behavior.

Existing live flows remain in place: guest entry/Leave, search, conversation selection, messaging and failure recovery, unread/read-on-open, presence, friend actions, group creation, emoji insertion, pagination, jump-to-latest, and responsive pane navigation.

## Current visual comparison

[`captures/preview-1600x1000.png`](./captures/preview-1600x1000.png) is a single 1600 × 1000 viewport from headless Chrome at device pixel ratio 1. The right column is Friends and Create group. The thread, composer, selected Mina row, disclosure, and collapsed **Choose members** control are inside the frame. **Choose members** does not cover the chips or push Create group out of the frame, so its visual weight was left unchanged.

Preview Leave navigates to `/` and does not call `GuestService.leave()`. The stored `swagzchat.guest` entry stays. `/chat` Leave still clears that guest and returns to the entry screen.

Remaining visual differences to retain as intentional or minor:

- Stable initials and colors replace reference portraits.
- Receipt marks are omitted because the service does not store them.
- Create group is disabled while its required name is empty.
- Calls, video, attachments, and images remain disabled with explanations.
- The **Choose members** control adds a labeled row that is not in the static reference. It stays, because the 1600 × 1000 capture still shows the chips and Create group.
- Incoming/outgoing timestamp placement and incoming avatar grouping may differ slightly from the image; do not add receipt marks or portraits to address those differences.

## Design principles

1. **Conversation first:** keep the active thread and composer as the primary work surface.
2. **Identity stays honest:** preserve the demo/unverified cues; do not imply verification, privacy, or receipt state the service cannot prove.
3. **State is visible:** show selection, unread, presence, loading, failure, and disabled states with non-color cues as well as color.
4. **Preserve behavior:** refine existing components instead of replacing service-backed flows with fixture-only controls.
5. **Progressive disclosure:** selected members remain visible; secondary member choices appear only when requested or searched. The emoji picker is functional; calls, video, and attachments stay disabled until supported.
6. **One visual system:** maintain consistent spacing, typography, borders, avatars, icons, and focus styles; blue for primary/selected, amber for disclosure, red for Leave/destructive actions.
7. **Responsive continuity:** phone Back is an explicit close and may clear the selection and draft. The Friends/Chats swap keeps both. Do not change Back in this pass.
8. **Accessibility is part of sign-off:** labels, keyboard access, visible focus, announcements, contrast, and reduced motion matter alongside appearance.
9. **Preview isolation:** preview does not create a guest or call live service/database mutations.

## Remaining plan

These milestones are done. Phone Back is an explicit close and may clear the selection and draft. The Friends/Chats swap keeps both. Do not change Back in this pass.

### Milestone 1 — Keep preview exit read-only

**Files:** `web/src/app/pages/chat/chat.ts`, `chat.spec.ts`.

- In preview mode, make Leave navigate out of `/preview` without calling `GuestService.leave()` or clearing the `swagzchat.guest` local-storage entry.
- Keep the regular `/chat` Leave flow unchanged: it clears the current guest session and returns to the entry screen.
- Add a focused test proving preview Leave does not call the guest-session clearing method, while regular Leave still does.

**Exit check:** pressing Leave in `/preview` does not mutate guest local storage or invoke API/database actions; pressing Leave in the regular workspace retains existing behavior.

### Milestone 2 — Replace the invalid desktop capture

**Files:** `docs/ui-revamp/captures/preview-1600x1000.png`, `docs/ui-revamp/visual-fidelity-handoff.md`.

- Capture only the `/preview` page at **1600 × 1000**, browser zoom 100%, device pixel ratio 1. Ensure the screenshot contains one app viewport, all three columns, and no neighboring window or duplicated page content.
- Compare the capture with `reference.png` side by side. Confirm the complete Friends list, Create group card, thread, and composer are visible.
- Record the capture source, viewport, zoom, and any remaining differences here. Keep the reference’s settled deviations above.

**Exit check:** the saved PNG is exactly 1600 × 1000 and visually shows one complete SwagzChat preview. A reviewer can compare the app to `reference.png` without reconstructing a viewport from a composite.

### Milestone 3 — Optional picker polish, only if needed after the target capture

**Files if changed:** `web/src/app/pages/chat/chat.html`, `chat.css`, and focused tests.

- Inspect **Choose members** at the target viewport. If it competes with the selected chips, reduce its visual weight while preserving a visible label, keyboard operation, and `aria-expanded` state.
- Keep the default choices collapsed, matching results searchable/reachable, and the currently selected chips visible and removable.
- Preserve the live group validation rule and keep preview group creation disabled with **Enter a group name.**

**Exit check:** the default reference state stays uncluttered; keyboard and pointer users can still reveal, search, select, and remove members; live group creation behavior is unchanged.

### Milestone 4 — Preserve regression and responsive evidence

Existing run results in the previous handoff are recorded below. If UI code changes in Milestone 1 or Milestone 3, rerun the relevant commands and update their results:

```bash
(cd web && npm test -- --watch=false)
(cd web && npm run build)
(cd server && node --test src/handle.test.js)
```

- Retain and verify the existing **390 × 844** capture and recorded checks at **1024 × 768** and **768 × 1024**.
- Confirm production build does not expose `/preview` and preview interactions do not call `GuestService.leave()` or account, presence, send, read, friendship, or group mutation methods.
- Confirm live flows remain service-backed if implementation code changes.

**Exit check:** screenshots, viewport details, test/build results, production-route result, and preview no-mutation evidence agree with the checked-in source.

## Acceptance checklist

- [x] Development-only `/preview` and deterministic fixture exist.
- [x] Live `/chat` remains guest-guarded and service-backed.
- [x] The group picker starts collapsed with selected chips visible; actions remain accessible.
- [x] Three-pane layout, separate rail cards, icons, message thread, and composer are implemented.
- [x] Project tests/build and responsive checks have prior recorded passing results.
- [x] Preview Leave preserves any existing live guest session and has a focused regression test.
- [x] Replace the invalid desktop capture with a single, correct 1600 × 1000 screenshot.
- [x] Review **Choose members** at the target viewport; make a visual adjustment only if it materially improves the comparison.
- [x] Confirm the final handoff lists only current intentional differences and current verification evidence.

## Verification

Recorded from Node 22 after preview Leave isolation:

- `(cd web && npm test -- --watch=false)` — 19 passed, including preview Leave leaving `swagzchat.guest` alone and `/chat` Leave still clearing it.
- `(cd web && npm run build)` — passed; initial bundle 233.72 kB.
- `(cd server && node --test src/handle.test.js)` — 2 passed. Server code was unchanged.
- Desktop capture: headless Chrome, `npm start` at http://127.0.0.1:4200/preview, window 1600 × 1000, zoom 100%, device pixel ratio 1. File [`captures/preview-1600x1000.png`](./captures/preview-1600x1000.png).
- Phone capture retained: [`captures/preview-390x844.png`](./captures/preview-390x844.png). Earlier checks at 1024 × 768 and 768 × 1024 still stand; this pass did not change pane layout.
- In the development server, Leave on `/preview` opened `/` and left `swagzchat.guest` set to the existing guest.
- Production route behavior from the previous build still applies: `/preview` is development-only. This pass did not change the route.

## Out of scope

- Changing phone Back. It is an explicit close and may clear the selection and draft. The Friends/Chats swap keeps both.
- Rebuilding guest, chat, search, presence, friendship, group, messaging, emoji, pagination, or responsive features already implemented.
- Authentication/identity redesign, API/schema/database changes, fixture data in MongoDB, or deployment.
- Calls, video, attachment/image upload, delivery/read receipts, or reintroducing Angular Material, Angular 8, or Firebase.
