# Little Fires — Project Handoff

Read this first. Repo: github.com/Bigtobydog8/little-fires

For sync specifically, read **`SYNC-PLAN.md`** — it supersedes anything here on
that subject.

---

## What it is

A single-file React task app (~16,900 lines) that I use daily.

- **Vite build**, React 18 via npm (`index.html` → `main.jsx` →
  `little-fires-app.jsx`).
- **localStorage only.** No backend yet.
- **Deployed to Vercel**, installed as a PWA on iPhone.
- **Entry point:** `export default function LittleFires()` — an error boundary
  wrapping `LittleFiresApp`. `main.jsx` imports the default export; don't rename it.

**Because Vite is already in place:** npm dependencies can be added normally. Use
the **modular** Firebase SDK (`import { getAuth } from 'firebase/auth'`), not the
compat CDN build. Vitest is a natural fit for tests.

### `index.html` is not inert — commit it

Two things live there that cannot live in the JSX, because they must take effect
*before* the app mounts:

- **Google Fonts `<link>` tags.** These were previously an `@import` inside a
  `<style>` block React renders, which meant fonts weren't even requested until
  the bundle had parsed and mounted. In the head, the browser's preload scanner
  finds them while the HTML is still parsing.
- **`viewport-fit=cover`**, which is what makes `env(safe-area-inset-*)` return
  real values instead of zero.

**Committing only the `.jsx` silently loses the fonts.** `git status` before
committing.

### Validate every edit before presenting

```bash
cd /tmp && npm install --no-save @babel/core @babel/preset-react
node -e "require('@babel/core').transformSync(require('fs').readFileSync('/home/claude/little-fires/little-fires-app.jsx','utf8'),{presets:['@babel/preset-react']})"
```

This has caught real breakage repeatedly — including backticks inside a CSS
comment, which terminate the enclosing JSX template literal. **Never use
backticks in comments inside the `<style>` blocks.**

A parse check is necessary but **not sufficient**. See "How this has gone wrong."

---

## Features

Tasks (To Do / Backlog / Complete), Time tracking, Goals, Projects, Notes,
Calendar, Reports, Search, Archive, Settings.

**Task lists:** 6 built-in (personal, work, home, travel, kids, partner) plus
user-created ones, capped at 10. Renameable, hideable, drag-reorderable.

**Settings:** accent theming, list management, **partner (name / colour / linked
account)**, section toggles, fire goals, defaults, behavior, **reduce motion**,
**battery saver**, JSON backup/restore, CSV export.

---

## Decisions already made — don't relitigate

**List keys are permanent; labels are a display layer.** Keys are also
localStorage keys. Renaming only changes the label. Custom list keys are slugs
generated once at creation.

**Display vs. data operations are deliberately separate.** `visibleTaskLists`
respects hiding and ordering. `TASK_LISTS` is the full canonical set. Auto-archive
and project cleanup must always use the full set, or tasks pile up invisibly in
hidden lists.

**Settings store only deltas from defaults.** Writing the whole object would
freeze today's defaults into storage forever.

**Theming runs through CSS variables:** `--accent`, `--accent-light`,
`--accent-rgb`, `--accent-muted-rgb`, plus `--partner` / `--partner-rgb`. ~340
references. **`var()` does not work in SVG presentation attributes** — use
`style={{ stroke: 'var(--accent)' }}`, never `stroke="var(--accent)"`. It also
does not work in canvas: `ctx.fillStyle = 'var(--accent)'` is silently ignored
and leaves the previous value (black). Both mistakes have shipped.

**Tasks are addressed by id, never by array position.** Every mutator takes
`(listName, taskId)` and resolves through `findTaskIndex` / `findTask`. A stale
id fails as a no-op rather than hitting the wrong task.

**`updateTask(listName, taskId, patch)` is the single write path** for editing a
task. It replaces the task object rather than mutating it, and stamps
`updatedAt`. Don't add a mutator that bypasses it — sync needs both properties.

**Rich text is sanitized at every boundary.** `sanitizeRichText` uses a tag /
class / attribute allowlist. It runs on write, on render, when loading into the
live editor, and on backup import. The `style` attribute is *rebuilt*, not
filtered: one integer is parsed out for `margin-left` and a known-good
declaration emitted, so nothing an attacker writes is ever copied through.

**All date fields use the React `InlineDatePicker`.** There are no native
`<input type="date">` left. The native picker committed today's date and closed
on first tap inside an iOS home-screen app, because it's a browser overlay bound
to a DOM node the app re-creates on render.

**Animation was deliberately cut back for battery.** No unconditional infinite
animations. Fire flicker runs at 15fps and stops when full; flame pulse is
desktop-only. Don't reintroduce always-on animation without a reason.

**Hover effects are disabled on touch.** A tap latches `:hover` on touchscreens,
so every hover rule that moves something made it jump and stay moved. One
`@media (hover: none)` block at the end of the stylesheet neutralises them; it
must stay last, since it wins on source order.

**localStorage writes are debounced and coalesced** through `queueSetItem(key,
thunk)`, 400ms, flushed on `pagehide` and on `visibilitychange`. The value is a
thunk so superseded serialisations never run.

**Reports intro animates once per chart mode per session**, then snaps.

---

## Sync prerequisites — all done

Verify rather than rebuild.

| Prerequisite | Where |
|---|---|
| Collision-resistant IDs | `makeId()` — UUID with fallback, all creation sites |
| ID-based addressing | All mutators; `findTask` / `findTaskIndex` |
| `updatedAt` on every task | Stamped inside `updateTask()` |
| Tombstones | `deletedTaskIds` side table, 90-day TTL, pruned on load |
| Immutable updates | `updateTask()` — `prev` is never mutated |
| HTML sanitization | `sanitizeRichText` at all four boundaries |
| Shared-list fields | `SHARED_LIST_KEY`, `createdBy` / `assignedTo` / `completedBy` |
| Partner settings | Name, colour, linked-account field |

**Tombstones are a side table, not dead rows.** Nothing that renders, filters,
counts or exports has to learn to skip them. Archiving is removal *without* a
tombstone — the task still exists under the same id.

---

## Known issues / tech debt

**1. `Task` is defined inside `LittleFiresApp`.** React sees a new component type
every parent render and remounts the whole task subtree. Today it's a performance
cost and a visible flash when ticking a checkbox. **It becomes a correctness
problem once sync lands**, because a remount mid-edit discards contenteditable
state.

AST scope analysis has been run — `Task` has **exactly 22 free identifiers**:

- Already module scope, need nothing: `React`, `sanitizeRichText`,
  `parseLocalDateTime`, `isFeatureOn`
- Should move to module scope: `SHARED_LIST_KEY`, `partnerDisplayName`
- Become props (16): `settings`, `getAllProjects`, `expandedTaskId`,
  `setExpandedTaskId`, `editingTaskName`, `setEditingTaskName`, `toggleTask`,
  `deleteTask`, `archiveTask`, `renameTask`, `cycleAssignment`,
  `moveTaskToSection`, `assignTaskToProject`, `updateTaskDetails`,
  `updateTaskDueDate`, `updateTaskPriority`

**2. No code splitting.** One ~766KB source file; every tab's code loads before
anything renders. Real, but it's a refactor: the bundler can only split at module
boundaries, and every tab is currently conditional JSX inside one component.

**3. Naming collision.** The built-in "Partner" list means tasks *about* your
partner; the shared list means tasks *with* them. Worth renaming one —
"Household" or "Us" — before sync ships.

**4. `.project-actions` is defined twice** with the same selector. The second
silently wins.

**5. Minor.** Project and goal date badges render their icon even when the date
is empty. Notes have their own checkbox handling, deliberately untouched.

---

## How this has gone wrong — read before "small safe changes"

**A parse check cannot catch a runtime error on one interaction path.** Two
incidents:

**`useLayoutEffect` crashed the app.** Swapping the details editor's content-load
effect from `useEffect` to `useLayoutEffect` — to hide the remount flash — parsed
clean and took the app down. That effect's cleanup writes state, and a layout
effect runs synchronously, so save → `task.details` changes → effect re-runs →
cleanup saves again, with no paint to break the cycle.

> **Never use `useLayoutEffect` where the cleanup writes state.**

**The editor was fighting its own sanitizer.** The checkbox builders emitted
`style="display:flex"` and `contenteditable="true"`, both of which the sanitizer
strips. `saveDetails` compared raw DOM against sanitized storage, so the check
could never match and **a save fired on every blur and every tick** — each one
re-rendering, remounting, and reloading the editor from markup that had lost its
layout. Fixed by sanitizing before comparing, and moving layout into CSS.

> **When comparing "has this changed", compare like with like.**

---

## Roadmap (agreed order)

1. **Device sync + Partner shared list (Firebase)** — see `SYNC-PLAN.md`
2. **Google Calendar** — reuses the same Google OAuth consent
3. **Push notifications** — free, no phone numbers, no compliance burden
4. **SMS reminders** — only if reaching people without the app matters

**Why this order:** SMS and calendar both need server-side data, so sync first.
Calendar needs Google OAuth, the same consent flow as sync's Google Sign-In —
build it once. Push beats SMS on cost, compliance and UX.

Also worth doing: **Vitest**. The merge logic is the one place a bug destroys data
silently rather than throwing.

---

## Working style that worked

- Investigate before editing — grep the actual code rather than assuming
- Validate parse after every change, and know that it isn't proof
- Test logic in isolation with node/jsdom before presenting
- Say when something is a guess, and when a fix is unverified
- Own mistakes plainly and explain the mechanism, not just the fix
- Push back on requests that would cause harm

---

## Commercial notes (explored, not decided)

- Vite is in place, so the build-step prerequisite for Capacitor is met.
- **Pure PWAs are rejected** from the App Store under Guideline 4.2. Passing needs
  genuinely native capabilities — widgets, Siri/App Intents. Push alone isn't enough.
- Apple takes 15–30%. Stripe takes ~2.9% + 30¢.
- **Recommended path:** validate with a web subscription + PWA install first.
- Firestore at 1,000 users ≈ $5–10/month. Infrastructure is not the cost problem.
- The **Partner/household angle** is the real differentiator — "another task app"
  competes with free, preinstalled Apple Reminders.
