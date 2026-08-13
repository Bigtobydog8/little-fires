# Little Fires — Project Handoff

Read this first. Repo: github.com/Bigtobydog8/little-fires

For sync specifically, read **`SYNC-PLAN.md`** — it supersedes anything here on
that subject.

---

## What it is

A single-file React task app (~19,800 lines) that I use daily. **Desktop and
mobile both matter** — it is not a phone-first app.

- **Vite build**, React 18 via npm (`index.html` → `main.jsx` →
  `little-fires-app.jsx`).
- **localStorage only.** No backend yet.
- **Deployed to Vercel**, installed as a PWA on iPhone.
- **Entry point:** `export default function LittleFires()` — an error boundary
  wrapping `LittleFiresApp`. Don't rename it; `main.jsx` imports the default.

npm dependencies can be added normally. Use the **modular** Firebase SDK
(`import { getAuth } from 'firebase/auth'`), not the compat CDN build.

### `index.html` is not inert — commit it

Two things live there that cannot live in the JSX, because they must take effect
*before* the app mounts:

- **Google Fonts `<link>` tags.** Previously an `@import` inside a React-rendered
  `<style>`, which meant fonts weren't requested until the bundle had parsed.
- **`viewport-fit=cover`**, which is what makes `env(safe-area-inset-*)` return
  real values instead of zero.

**Committing only the `.jsx` silently loses the fonts.** `git status` first.

### Validate every edit before presenting

```bash
cd /tmp && npm install --no-save @babel/core @babel/preset-react jsdom
node -e "require('@babel/core').transformSync(require('fs').readFileSync('/home/claude/little-fires/little-fires-app.jsx','utf8'),{presets:['@babel/preset-react']})"
```

**A parse check is necessary but not sufficient** — see "How this has gone
wrong". Two further checks are cheap and have both caught real bugs:

- **TDZ scan** — walk the component body with `@babel/traverse` and flag any
  identifier read at render time before its `const`. A dependency array is
  evaluated during render; getting this wrong crashes the app.
- **Cleanup reachability** — for every `useEffect`, check that each identifier
  its cleanup references is actually in scope there. Declaring listeners inside
  an `if` block while the cleanup sits outside it threw on every teardown.
- **Unresolved-reference scan** — for module-scope components, confirm every
  reference resolves. **Visit `Identifier` *and* `JSXIdentifier`.** JSX component
  names are a separate node type, so an `Identifier`-only scan silently misses
  every `<Component/>` and will report a broken file clean.
- **Sanitizer round-trip** — eval `sanitizeRichText` under jsdom and confirm the
  editor's own markup survives it.

**Never use backticks in comments inside the `<style>` blocks** — they terminate
the enclosing JSX template literal.

Four regression suites live in `tests/` and run under plain node + jsdom:
the sanitizer contract (editor builders round-trip; mutation-XSS probes stay
inert), the editor crash journal, the removal updaters (immutability, no-op
identity, double-invoke safety), and the load guard's skip/defer/rewrite
decision table. Each suite slices the code it tests out of the app file at run
time and shape-checks the slice, so a refactor that moves or changes the code
fails the suite instead of silently testing a stale copy. Run them all with
`node tests/run-all.js` after every edit, alongside the scans above. They are
the starting corpus for the Vitest item on the roadmap.

---

## Features

Tasks, Time (with Pomodoro), Goals, Projects, Notes, Calendar, Reports, Search,
Archive, Settings.

**Lists come in two sets**, each capped at 10: **personal** (personal, work,
home, travel, kids + custom) and **shared** (partner + custom). A personal list
can never become shared and vice versa — see `SYNC-PLAN.md` for why that
decision carries its weight.

**Settings cards:** Appearance (theme + accent), Lists, Partner, Menu Sections,
Report Settings, Pomodoro, App Behavior, Backup & Restore, Spreadsheet export.

---

## Decisions already made — don't relitigate

**List keys are permanent; labels are a display layer.** Keys are also
localStorage keys. Custom keys are slugs generated once at creation.

**One flat namespace, two sets.** `TASK_LISTS` holds every key and is walked in
17 places (archive, calendar, reports, search, project cleanup). The personal /
shared split lives in storage and UI only, via `isSharedList(key)`. Splitting
`TASK_LISTS` in two would mean updating all 17, and any one missed would
silently drop shared lists from that view.

**Display vs. data operations are separate.** `visibleTaskLists` respects hiding
and ordering; `TASK_LISTS` is canonical. Auto-archive and project cleanup must
use the full set or tasks pile up invisibly in hidden lists.

**Settings store only deltas from defaults.** Consequence worth knowing: changing
a default reaches everyone who never overrode it. That is usually the point, but
it was wrong for `theme`, so the loader pins existing installs to `system` and
only fresh installs get the `light` default.

**Theming is fully tokenised** — ~828 `var(--…)` references. `--accent*`,
`--partner*`, and surface/text tokens: `--text`, `--text-muted`, `--text-soft`,
`--surface-line`, `--surface-rgb`, `--surface-raised-rgb`, `--surface-hover-rgb`,
`--surface-alt-rgb`, `--surface-deep-rgb`, `--border-rgb`, `--shadow-rgb`,
`--bg-1..3`, `--grain`. Two themes: `:root` (dark) and `.theme-light`.

> **`var()` does not work in SVG presentation attributes** — use
> `style={{ stroke: 'var(--accent)' }}`, never `stroke="var(--accent)"`. It also
> does not work in canvas: `ctx.fillStyle = 'var(--accent)'` is silently ignored
> and leaves the previous value (black). Both have shipped as bugs.

**Tasks are addressed by id, never array position.** Every mutator takes
`(listName, taskId)` and resolves through `findTaskIndex` / `findTask`.

**`updateTask(listName, taskId, patch)` is the single write path.** It replaces
the task object rather than mutating it and stamps `updatedAt`. Don't add a
mutator that bypasses it — sync needs both properties.

**Manual task order needs no field.** The display sort returns 0 for equal
priority and `Array.prototype.sort` is stable, so array order decides within a
band. Drag reorder just moves the array element, and is refused across
priority/section/completed bands rather than clamped.

**Rich text is sanitized at every boundary** — on write, on render, on load into
the live editor, and on backup import. `style` is *rebuilt*, not filtered: one
integer is parsed for `margin-left` and a known-good declaration emitted. `href`
is rebuilt via the `URL` constructor against an http/https/mailto allowlist.

**localStorage writes are debounced** through `queueSetItem(key, thunk)` — 400ms,
coalesced per key, flushed on `pagehide` and `visibilitychange`. The value is a
thunk so superseded serialisations never run.

**Hover effects are disabled on touch.** A tap latches `:hover`, so any hover
rule that changes appearance needs a counterpart in the `@media (hover: none)`
block at the end of the stylesheet. That block must stay last — it wins on
source order.

> This has produced three separate bugs (task cards, calendar rows, toolbar
> buttons). Treat it as a standing rule, not a fix.

**`window.confirm` does not work here.** A sandboxed iframe blocks it: it returns
`false` and shows nothing, so every destructive action guarded by it silently did
nothing. Use `confirmAction(message)` — promise-based, in-app. The error boundary
can't use hooks, so its reset arms on a second tap instead.

**Animation is deliberately restrained for battery.** Timer ticks once a second
and pauses when backgrounded; the flame flicker runs at 15fps and stops when
full. Battery saver (default on for touch devices) drops backdrop blur, the
ambient glow layer and the grain.

**Opening a task is never a write.** `saveDetails` is the single path from
editor DOM to storage — it mirrors checked state into attributes, sanitizes,
compares like with like, and no-ops when nothing changed. The three collapse
paths used to force an unconditional `updateTaskDetails` "to ensure text is
persisted"; that rationale predates the reliable cleanup save, and the
unconditional `updatedAt` stamp it carried is what would let merely reading a
task win a last-write-wins merge. Don't reintroduce a force-save.

**The load guard defers; it does not clobber.** Three branches, in order: skip
when the DOM already serializes to the incoming value (a rewrite would be a
no-op that only costs the caret); defer when the editor is focused AND holds
unsaved local changes (the user's next save then wins LWW as the genuinely
newest edit); rewrite otherwise — including focused-but-untouched, which must
take the rewrite or its next blur would save stale content over the newer
value. `lastSavedHtmlRef` is the "unsaved changes" baseline and is set on
load and on every save, including no-op saves.

**The editor has a crash journal.** A save dispatched on `pagehide` cannot
reach localStorage through the normal path — the state update and its
debounced write never run if iOS kills the suspended PWA (or an auth redirect
navigates away). So the hide-time save also writes
`little_fires_editor_draft` synchronously. The `allLists` initializer applies
it read-only (StrictMode invokes initializers twice in dev) and only if
strictly newer than the stored task; a mount effect consumes it.

---

## Sync prerequisites — all done

| Prerequisite | Where |
|---|---|
| Collision-resistant IDs | `makeId()` — UUID with fallback |
| ID-based addressing | All mutators; `findTask` / `findTaskIndex` |
| `updatedAt` on every task | Stamped inside `updateTask()`; auto-archive stamps too (was missing — fixed Aug 2026) |
| Tombstones | `deletedTaskIds` side table, 90-day TTL, pruned on load |
| Immutable updates | `updateTask()` replaces; removal paths copy the array before splicing (three violations found and fixed Aug 2026) |
| HTML sanitization | `sanitizeRichText` at all four boundaries |
| Shared-list model | Two sets, `isSharedList()`, `createdBy`/`assignedTo`/`completedBy` |

**Tombstones are a side table, not dead rows** — nothing that renders, filters,
counts or exports has to learn to skip them. Archiving is removal *without* a
tombstone; the task still exists under the same id.

This table was verified against the code in the Aug 2026 stabilization audit.
Two rows were found false and repaired (immutability; the auto-archive stamp) —
a claim of "done" in a handoff is a hypothesis until a scan or a test says so.

---

## Known issues / tech debt

**1. ~~`Task` inside `LittleFiresApp`~~ — DONE.** Hoisted to module scope; its 26
app-level dependencies arrive through `TaskContext`. It keeps one stable identity
now, so parent renders re-render the task subtree instead of remounting it.
Wants real device testing — it moved ~2,100 lines and was verified structurally,
not at runtime. See `SYNC-PLAN.md` Session 0 for the three bugs it surfaced.

**2. Undo is partly unreliable in the details editor.** Paste and cut now go
through `execCommand`, so those register with the browser's undo stack. Inserting
a checkbox, drag-to-indent and the multi-line conversions still mutate the DOM
directly and remain outside it. Convertible the same way; not yet done.

**3. Reordering is desktop-only.** HTML5 drag events don't fire on touch. On the
phone, horizontal touch is swipe-to-complete and vertical is scrolling, so
reordering would need a long-press to lift.

**4. No code splitting.** One ~810KB source file. The bundler can only split at
module boundaries and every tab is conditional JSX inside one component.

**5. Small.** `pickerActiveRef` is read as a guard in the outside-click
handler but never set anywhere, so the native-picker protection it implements
is permanently inert (moot since `InlineDatePicker` replaced native pickers —
the guard and the INPUT-type special case beside it are removal candidates).
`pickerResetRef` is cleared but never set. `saveTimeoutRef` is declared and
never used. `SETTINGS_VERSION` is still 1 despite ~14 added keys (safe —
additive with defaults — but decide deliberately). `.project-actions` is
defined twice.

---

## How this has gone wrong — read before "small safe changes"

**`useLayoutEffect` crashed the app.** Swapping the details editor's content-load
effect to a layout effect — to hide the remount flash — parsed clean and took the
app down. That effect's cleanup writes state, and a layout effect runs
synchronously, so save → deps change → cleanup saves again, with no paint to
break the cycle.

> **Never use `useLayoutEffect` where the cleanup writes state.**

**A ref read in a cleanup was `null`.** The collapse-time save read
`detailsRef.current`, but React nulls refs during unmount *before* passive
cleanups run — so collapsing a task saved nothing while blurring saved fine.
Capture the node in a local at effect time.

**The editor kept writing markup its own sanitizer stripped.** Three times:
`display:flex` on checkbox lines, `<a>` links, and `has-children` markers. The
failure is silent — it looks right until you reopen it.

> **Anything the editor writes into content must be checked against the
> allowlist.**

**Refs in a remounting component were being reset for free.** While `Task`
remounted on every parent render, every `useRef` inside it was rebuilt. Logic
that quietly depended on that freshness broke the moment the remount stopped —
the editor's load guard concluded the content was already on screen when the
editor was in fact a new empty node, and the next collapse saved that blank over
the real content. After any change that stops a component remounting, audit its
refs for assumed freshness.

**A comparison compared unlike things.** `saveDetails` tested raw DOM against
sanitized storage, which could never match, so a save fired on every blur and
every tick whether anything had changed or not.

**Two `ReferenceError`s shipped in the calendar and parsed clean.** The three
"Go to" buttons called `setSelectedDate` (the state is `selectedDay`), and the
note path read `allNotes` (the state is `notes`). Event-handler errors bypass
the error boundary, so every tap failed silently except in the console.

> A parse check cannot see an unresolved name. The scope scan — visiting
> `Identifier` AND `JSXIdentifier` — can, and now reports the file clean.

**`{ ...prev }` copies the object, not its arrays.** Three removal paths
spliced `prev`'s own list arrays after a shallow object spread. Masked today —
nothing memoizes on the arrays, and the id lookup makes re-runs idempotent —
but fatal for any change detection that compares old and new list references,
which is what a sync push layer does on exactly the operations where
tombstones matter.

**A `return` from a `setTimeout` callback goes nowhere.** The midnight
auto-archive "returned" its interval cleanup from inside the timeout, where it
was unreachable. Worse, the effect's `[]` deps froze `checkAndArchive` at
first render, so the midnight run filtered the app-LAUNCH snapshot of
`allLists` — re-adding tasks deleted or manually archived during the day.
Timers that outlive a render must call through a latest-ref, not a captured
closure.

**Handlers defined inside an effect keep the closure of its last run.** The
delegated tick save compared against `task.details` from whenever the listener
effect last ran; after any save while expanded, the stale comparison failed
both ways — unchanged content looked changed (a redundant stamped write), and
content reverted to the stale snapshot looked unchanged (a skipped save). The
effect's deps now include `task.details`. If a handler compares against
something, that something belongs in the deps.

**The `pagehide` flush cannot save what was never captured.** It flushes the
queued localStorage writes — content typed since the last blur existed only in
the editor DOM, and iOS does not reliably blur the focused element on
backgrounding. Hence the crash journal under "Decisions".

---

## Roadmap (agreed order)

1. ~~Hoist `Task`~~ — done
2. **Device sync + shared lists (Firebase)** — see `SYNC-PLAN.md`, and note the
   App Store constraints there: auth must be provider-agnostic from the start,
   and account deletion has to be designed into the household schema
3. **Google Calendar** — reuses the same Google OAuth consent
4. **Push notifications** — free, no phone numbers, no compliance burden
5. **SMS reminders** — only if reaching people without the app matters

**Calendar events are not a sync entity.** Google is the source of truth for
those; it's a read-through overlay, not stored in Firestore. Requesting the
Calendar scope also drags Google's app-verification process forward, so don't ask
for it before it's needed.

Also worth doing: **Vitest**. The merge logic is the one place a bug destroys
data silently rather than throwing. The four node/jsdom suites in `tests/` are
the seed corpus — porting them is mostly renaming `t()` to `test()`.

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

- **Pure PWAs are rejected** from the App Store under Guideline 4.2. Passing needs
  genuinely native capabilities — widgets, Siri/App Intents. Push alone isn't enough.
- Apple takes 15–30%. Stripe takes ~2.9% + 30¢.
- **Recommended path:** validate with a web subscription + PWA install first.
- Firestore at 1,000 users ≈ $5–10/month. Infrastructure is not the cost problem.
- **The monetizable moment is pairing, not shared lists.** A shared list with
  nobody on the other end costs nothing and delivers nothing; pairing is what
  costs money and delivers value. Keeping one free shared list is a sensible
  freemium shape — people who have *used* one will pay for sync.
