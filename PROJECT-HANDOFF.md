# Little Fires — Project Handoff

Read this first. Repo: github.com/Bigtobydog8/little-fires

For sync specifically, read **`SYNC-PLAN.md`** — it supersedes anything here on
that subject.

---

## What it is

A single-file React task app (~25,000 lines) that I use daily. **Desktop and
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
- **The theme boot script** (an inline `<script>` at the top of `<head>`). The
  stylesheets are React-rendered, so before the bundle mounts the `.theme-light`
  class has no rules to trigger — a light-theme user got a flash of the dark
  static background. The script resolves the theme synchronously (same rules as
  the settings loader: fresh install → light, stored blob without a theme →
  system, parse failure → light) and sets the class plus an inline
  `background-color` and `color-scheme` on `<html>` before first paint; the
  React theme effect owns those two properties from mount on.
  `tests/theme-boot-test.js` pins both copies of the resolution — change one
  side and the suite fails until the other matches.

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

Thirty-nine regression suites live in `tests/` and run under plain node +
jsdom — 1,164 assertions.

Three of them were added in August 2026 after the same fault reached the device
twice each. They catch *classes* rather than instances, which is the only kind of
test worth adding to a project like this:

- **A `const` used before it is declared** (`scope-test.js`). It resolves fine
  and still throws. A React component is one long function body, so a helper
  placed above the thing it depends on is a crash on first render, not a
  warning. This shipped twice — `setSelectedDate`, then `toggleFocusTime`
  reaching for `toggleSection` from 500 lines below it.
- **A component declared inside another component** (`scope-test.js`). React
  reconciles by component *type*, so a nested component gets a new identity on
  every render and its DOM is destroyed and rebuilt. `DetailField` did this and
  every keystroke in a project description threw away the textarea being typed
  into — the same fault the `Task` hoist fixed, in miniature. The check fails
  only when the nested component holds a form control or a hook; display-only
  ones are counted and allowed.
- **A class that cannot override `input[type="text"]`** (`css-boxmodel-test.js`).
  Element + attribute is specificity (0,1,1); a plain class is (0,1,0). Three
  rules styling text inputs silently lost every property they shared with the
  global rule. The test reads the classes off the actual `<input>` elements
  rather than guessing from proximity — the first version reported nine false
  positives including `.tab` and `.modal-content`.

**And run the real build, not just a parse.** `npx esbuild little-fires-app.jsx
--loader:.jsx=jsx --bundle --external:react --external:react-dom --outfile=/tmp/out.js`
is what Vercel does. A Babel parse check passes things the bundler warns about —
it found a duplicate `onClick` where the first handler was being silently
discarded. `node tests/run-all.js` after every edit, alongside the
parse check above.

Each suite slices the code it tests out of the app file at run time and
shape-checks the slice, so a refactor that moves or renames the code fails the
suite instead of silently testing a stale copy. Several go further and execute
the real function text against a stub: `auto-archive-test.js` runs the actual
sweep against a fake React, `suggestion-api-test.js` runs the real request
builder against a stubbed `fetch`.

The three that earn their place most often:

- **`scope-test.js`** — the AST scan, visiting `Identifier` *and*
  `JSXIdentifier`. It catches the class of bug that has reached the device
  twice, and nothing else can see it. It also includes a guard on the guard:
  it deliberately breaks a component reference and asserts the scan notices.
- **`theme-persistence-test.js`** / **`install-defaults-test.js`** — the
  launch-1 → launch-2 → launch-3 round trip for every key carrying the
  unconditional-write exception.
- **`css-boxmodel-test.js`** — percentage width plus padding with no
  `box-sizing`, merged across media blocks, because the base rule and the
  mobile override usually live far apart.

They are the seed corpus for the Vitest item on the roadmap; porting is mostly
renaming `t()` to `test()`.

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

## Not yet verified on a device — read this first

As of 20 Aug 2026, ~3,750 lines went in over a single session and **almost none
of it has been used on a phone**. One thing was confirmed working (the details
close animation); everything else that was verified was verified by breaking.

Three of that day's bugs reached the device, two of them fatal — a stale base
file that reverted the day's work, and a `CheckedBox` scope error that took the
app down behind the error boundary. Both were caught by the person, not by the
suites, because neither parsing nor text-matching can see them.

Untested at time of writing: the archive sweep and its notice, the completed
list's dates and ordering, fresh-install list and menu defaults, the new icons,
the priority divider, the AI Tasks off state, the health filter, the report
drill-down, the standing-instructions field, the checklist tap rules, the
keyboard title fix, and the self-hosted OCR loader.

> **Verify before adding.** Every unverified change makes the next bug harder to
> locate. If you are picking this up cold, the highest-value hour is not a
> feature — it is opening the app and using it.

Order worth testing in, most-likely-wrong first: checklist tapping (it moves a
gesture with existing muscle memory), the details editor generally (over half of
that day's reports were here), typing with the keyboard up, the task list, then
the surfaces that cannot be seen from a container at all — the home-screen icon,
OCR on a photo, the report drill-down at real volume.

## Decisions already made — don't relitigate

**List keys are permanent; labels are a display layer.** Keys are also
localStorage keys. Custom keys are slugs generated once at creation.

**One flat namespace, two sets.** `TASK_LISTS` holds every key and is walked in
~20 places (archive, calendar, reports, search, project cleanup, export, the
flame goals). The personal / shared split lives in storage and UI only, via
`isSharedList(key)`. Splitting `TASK_LISTS` in two would mean updating every
one of them, and any single miss would silently drop shared lists from that
view.

> The same argument is why AI suggestions are a side table and not a list.
> Membership of `TASK_LISTS` means "this is real work" to twenty call sites.

**Two values in `currentList` are tabs rather than lists**: `'master'` (All
Tasks) and `SUGGESTIONS_TAB`. Both appear in the tab row, neither is in
`TASK_LISTS`, `listOrder` or `listLabels` — so flame goals, the calendar,
reports, export, the ten-list cap and a future sync are all untouched by them.

`'master'` is the precedent and the reason this works: it has sat in that state
since the beginning, and every branch that needs to know already asks about it.

- The AI Tasks tab is **pinned last and not reorderable**, and that is a
  decision rather than a shortcut. Order lives in `listOrder`, which is the list
  registry — joining it would bring a rename field, a hide toggle and a slot
  counted against the ten-list cap, which is being a list in every way that
  matters.
- It appears only when `settings.aiSuggestions` is on.
- **Archive, Goals and Projects reuse `currentList` as a real list key.** So a
  guard drops the pseudo-value back to `'master'` on leaving the task view, and
  again if the feature is switched off while sitting on the tab. Both are in the
  same effect, and its deps include `appMode` and `settings.aiSuggestions` — a
  guard that never re-runs is a guard that does not exist.
- The shelves live in `renderSuggestions()` and are rendered from two places
  (the menu entry and the tab) rather than duplicated. The menu entry stays
  because that is where the off-state explanation lives.

**What a new install opens with.** Lists: Personal, Work, Partner — Home, Travel
and Kids exist and keep any tasks, they are just hidden until switched on in
Settings > Lists. Menu: Goals, Projects, Search, Calendar, Reports, Archive; Time
and Notes are off. AI Tasks needs no entry in `hiddenFeatures` because its menu
item is gated on `settings.aiSuggestions`, which is false until switched on —
listing it in both would give it two independent off-switches.

Appearance: light theme, Matcha accent, Lora & Inter. All of it survives a second
launch only because of the unconditional-write rule above.

**Display vs. data operations are separate.** `visibleTaskLists` respects hiding
and ordering; `TASK_LISTS` is canonical. Auto-archive and project cleanup must
use the full set or tasks pile up invisibly in hidden lists.

**Settings store only deltas from defaults, and that has one trap worth learning
once.** Changing a default reaches everyone who never overrode it. Usually the
point — but it interacts badly with the loader's "existing install" pins.

The failure is always the same shape. A key whose default is *also* a plausible
choice can't be persisted: choosing the default produces a value equal to the
default, so nothing is written; the loader then reads the missing key as "this
is an existing install" and applies the pin; and the user's choice reverts on
the next launch. It has bitten five keys now:

| Key | Symptom before the fix |
|---|---|
| `theme` | Choosing Light reopened dark on a dark phone, every time |
| `accentId` | Choosing the default accent didn't stick |
| `fontChoice` | Same, for the default pairing |
| `hiddenFeatures` | The minimal first-run menu lasted exactly one launch |
| `hiddenLists` | Same, for the fresh-install list selection |

> **Any key whose default a user could also choose deliberately must be written
> unconditionally.** They are grouped together in the persistence effect. Adding
> a sixth means adding it there, not reasoning about whether this one is
> different. `tests/theme-persistence-test.js` and
> `tests/install-defaults-test.js` both run the launch-1 → launch-2 → launch-3
> round trip; a new key without the exception fails them.

The pins stay regardless, and are a separate fact from the default: the pin says
what an install predating the key already looked like, the default says what a
new install gets. They currently coincide for `accentId` — deleting the pin on
those grounds would make the *next* default change silently restyle every old
install.

**Theming is fully tokenised** — ~828 `var(--…)` references. `--accent*`,
`--partner*`, and surface/text tokens: `--text`, `--text-muted`, `--text-soft`,
`--surface-line`, `--surface-rgb`, `--surface-raised-rgb`, `--surface-hover-rgb`,
`--surface-alt-rgb`, `--surface-deep-rgb`, `--border-rgb`, `--shadow-rgb`,
`--bg-1..3`, `--grain`. Two themes: `:root` (dark) and `.theme-light`.

> **`var()` does not work in SVG presentation attributes** — use
> `style={{ stroke: 'var(--accent)' }}`, never `stroke="var(--accent)"`. It also
> does not work in canvas: `ctx.fillStyle = 'var(--accent)'` is silently ignored
> and leaves the previous value (black). Both have shipped as bugs.

**The editor owns its own undo stack.** The browser's could only ever see five
operations here — bold, underline, indent/outdent on a bullet, paste, one
delete. Everything distinctive (checkbox insert, the bullet and Follow Up
buttons, indenting a plain line, Tab, Enter and Backspace inside a checklist
item, drag-to-indent, ticking a box) mutates the DOM directly and was invisible
to it.

> The failure was worse than "undo does nothing". The native stack still held
> the earlier typing, so Cmd-Z after inserting a checkbox undid **the sentence**
> and left the checkbox behind.

Design notes worth keeping:

- **Intercepted at `beforeinput`, not `keydown`.** Cmd-Z is not the only route:
  iOS has shake-to-undo and an undo button on some keyboard layouts, and all of
  them arrive as `inputType: 'historyUndo'`. Catching the shortcut alone would
  leave those running the native stack against a partial picture.
- **`beforeinput` is also the snapshot point**, since it fires before the change.
  `execCommand` dispatches it too, so bold, underline, bullet-indent and paste
  are covered without touching their call sites. Only direct-DOM mutations need
  an explicit `pushHistory` — there are seven.
- **The caret is stored as a character offset**, not a Range. Restoring replaces
  every node, so a stored Range points at something detached.
- **Coalescing measures time since the last *typing* snapshot**, not since any
  snapshot. Otherwise typing straight after inserting a bullet merges into it,
  and taking back the words takes back the bullet.
- **`rehydrateEditor` replays what HTML cannot carry** — above all
  `contentEditable='false'` on the boxes, which the sanitizer strips and which is
  set on the live DOM after every load. Without it, one undo turns every checkbox
  into a caret position.
- **An undo calls `saveDetails`.** It is an edit like any other; without it,
  collapsing the task writes back the state you just undid.

**Expanding anything collapsible scrolls to it; collapsing returns you.**
One mechanism — `toggleSection(key, isOpen, setOpen)` plus `sectionRef(key)` —
serves all eight collapsible sections: To Do, Backlog, Complete, each All Tasks
list, archived tasks/goals/projects, and the report drill-down.

Three things in it were each a bug first:

- **The scroller is found by `scrollPortFor`, and it must not require the
  container to be overflowing yet.** The port is captured *before* a section
  expands, when the list often does not overflow — so requiring
  `scrollHeight > clientHeight` returned null, the caller scrolled the *window*,
  and the restore silently did nothing. It looked like a section snapping shut.
  Two passes now: prefer a container that is scrolling, accept one that can.
- **Collapsing scrolls back BEFORE the content is removed.** Removing it first
  shrinks the scroller, the browser clamps the position in one jump, and the
  smooth scroll has nothing left to animate. So the close waits on
  `onScrollSettled` and only then sets state — opening is instant, closing takes
  as long as the travel.
- **The reveal rule is narrower than the one for task cards** and must stay that
  way. A section is opened from a header you are already looking at, so only
  content that has appeared *below the fold* is worth correcting; a header at or
  above the top is left alone. `needsScrollIntoView` (cards) and
  `sectionNeedsReveal` (sections) differ on exactly that case, and a test pins
  the difference.

Two views store the inverse — "collapsed" rather than "open" — and their call
sites flip it, rather than teaching the shared toggle about two conventions.

**Tapping a checklist item ticks it. Editing moved to the end of the line.**
On touch, inside the details editor:

| Where you tap | What happens |
|---|---|
| Past the end of a line's text (24px zone) | Caret goes there, keyboard opens |
| Anywhere else on a checklist item | The box toggles; no focus, no keyboard |
| Anywhere else on a plain line | The browser's own caret placement |

This is a deliberate gesture change, not a bug — don't "fix" it back. Tapping
the words of a checklist item previously did **nothing at all**: focus was
prevented and no toggle happened, so a finger that missed the 20px box simply
failed. The box also carries a `::after` pseudo-element extending its target to
~42px, done that way because padding would have moved the text and re-spaced
every checklist in the app.

> One subtlety in the measurement: a plain line is a `div`, and a div is as wide
> as the editor — so its bounding box says the text ends at the right margin
> however short the line is. "Past the end" is measured with a Range over the
> contents, taking the **last** client rect so a wrapped paragraph ends at the
> end of its final row.

All of it is touch-only. A mouse doesn't miss, so clicking text on desktop still
places a cursor.

**The keyboard must not hide the task title.** iOS scrolls a focused element
into view itself, and the details editor is tall enough that doing so carries
the title off the top — leaving you typing into an unlabelled box.
`keyboardScrollAdjustment()` keeps both in view, and is explicit about which
wins: clearing the keyboard always takes priority, and the title is recovered
only with whatever slack remains. The 300ms settle delay after `focusin` is a
guess at iOS's keyboard animation — if the title flickers, that constant is the
first thing to try.

**Auto-archive is calendar-month, not a rolling window.** A task completed on the
31st stays through the 31st; the whole month leaves together on the 1st. The
test is `completedDate < currentMonthStart` and it was always right — what was
broken was the gate deciding whether to run it, which stored a timestamp,
defaulted a missing key to *now*, and only wrote the key inside the
is-it-a-new-month branch. The branch could only be reached if the key existed,
and the key could only exist if the branch had run: it never swept, on any
device, ever.

It now stores a month key (`"2026-08"`), treats a missing key as *never run*
(which sweeps), and re-checks on `visibilitychange` — an iOS home-screen PWA is
suspended rather than reloaded, so a month can turn over with every timer paused
and no load event.

> Archiving is removal **without** a tombstone. The task keeps its id and moves
> to `archivedTasks`. Never add a tombstone here: filing something away is not
> deleting it, and sync would then destroy it on the other device.

**The sweep announces itself, and the notice is persisted.** The first sweep on
any device moves every completed task from every prior month at once — on this
install, 79 — and did it in silence. Opening the app to a month of finished work
gone reads as data loss, not filing.

> Stored in `little_fires_archive_notice`, not held in state, and that is the
> whole point: the sweep also runs at midnight and on foregrounding, so a notice
> living only in memory is lost the first time the app is killed after a sweep —
> exactly the case that needs explaining. Cleared on dismiss, and viewing the
> archive counts as dismissing.

It names a single month only when the sweep took one; the first run usually
spans several, where naming one would be false.

**The calendar shows archived tasks too.** `getItemsForDate` walks both maps, so
looking back at March shows what March actually looked like. It cannot leak into
the present — anything archived was completed in a month that has already ended,
so its anchor date is necessarily past. A `seenIds` guard covers the moment
mid-sweep when a task is in both maps; the active copy wins.

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

**The AI key is client-side, and that is a one-person decision.** AI Tasks calls
Anthropic directly from the browser with the user's own key and the
`anthropic-dangerous-direct-browser-access` header — a documented pattern, valid
while the key belongs to whoever is holding the phone. It stops being valid the
moment anyone else runs this build. See `SYNC-PLAN.md`; the fix is server-side
auth, which is Sessions 1–3, not a bolt-on.

> Two consequences worth carrying: a sanitizer bug is now a **key-disclosure**
> bug, because anything that can run script can read localStorage; and secrets
> live in their own storage entries (`little_fires_ai_key`,
> `little_fires_ai_profile`) rather than in `settings`, because `buildBackup()`
> serialises `settings` into every exported backup and the error boundary dumps
> it too.

**Suggestions are not tasks, and never join `TASK_LISTS`.** They live in
`little_fires_ai_suggestions`, a side table, for the same reason tombstones do:
`TASK_LISTS` is walked in ~18 places that all treat membership as real work, so
a suggestions list would reach the flame goals, calendar, reports, exports and
the 10-list cap — and, post-sync, a partner's device. The AI view is reached by
`appMode`, not by being a list. None of the AI storage keys should ever sync.

**OCR was removed, and should not come back in that form.** Every photo added to
a note used to be run through Tesseract on upload, with the transcript shown
under the picture.

It went because the thing it existed for — making handwritten notes searchable —
is not something Tesseract can do. It is trained on printed text, so handwriting
came back as garble, and no tuning would have changed that. The feature could
not do its job.

What it cost: a page-context script with full `localStorage` access (the top
finding in the security audit), several megabytes of WASM and language data on
first use, a self-hosted `public/vendor/` file, a two-file deployment coupling,
and a CDN origin in the CSP. What it bought: a notes-only search over text
nobody could rely on.

> **`public/vendor/` can be deleted from the repo.** Nothing references it.

If handwriting search is wanted again: iOS Live Text reads handwriting well and
is already on the phone, so copying across by hand is more accurate and free.
In-app, the model behind AI Tasks reads handwriting and the image is already
base64 in storage — but that sends the *picture* off-device, which is a bigger
step than sending task text, and would want to be opt-in per photo rather than
automatic.

**Notes are a record you open, not a card that grows.** Tapping one puts it in a
full-screen overlay; `selectedNoteId` is component state and nothing about which
note is open reaches storage. The stored `note.expanded` flag it replaced was
also a sync problem — see SYNC-PLAN.md — so a design change closed a data
question, which is worth noticing as a pattern.

Notes gained a `title` in the same pass. Empty on creation, falling back to the
note's date for display, and read by both searches.

**App icons are files, not generated.** They live in `public/icons/` and are
declared in `index.html`; `manifest.json` carries the Android set including
maskable variants. The app must not touch icon links at runtime.

It used to build them on every accent change — and got a black flame on a green
square, because the flame SVG's fill was `var(--text)` and a detached SVG loaded
through an `<img>` has no page to inherit CSS variables from. That is the same
trap as `ctx.fillStyle = 'var(--accent)'`, which was already documented three
lines from the offending code. The structural reason matters more than the
cosmetic one: iOS reads the home-screen icon when the user taps *Add to Home
Screen*, which can be before any script has run, and then caches it hard enough
to survive a redeploy.

`theme-color` is the exception and stays dynamic — that one genuinely should
follow the accent.

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

**2. ~~Undo is partly unreliable in the details editor~~ — DONE.** The editor
keeps its own history now; see the decision above. Untested on a device.

**3. Reordering is desktop-only.** HTML5 drag events don't fire on touch. On the
phone, horizontal touch is swipe-to-complete and vertical is scrolling, so
reordering would need a long-press to lift.

**4. No code splitting.** One ~1MB source file. The bundler can only split at
module boundaries and every tab is conditional JSX inside one component.

**5. Every state change re-renders every mounted task.** `taskContextValue` is a
fresh object literal each render — 26 entries — and every `Task` consumes it, so
all mounted tasks re-render on any state change anywhere in `LittleFiresApp`,
which holds **132 `useState` hooks**. `Task` is not memoised, and `React.memo`
would not help while the context identity is unstable. Each `Task` carries 39
hooks across ~2,900 lines.

The sharpest case: the time-logging timer ticks once a second, and with the
Complete section expanded that is ~90 task components re-rendering per second.
The tick was already reduced from 50ms to 1000ms for this reason — that lowered
the frequency, not the fan-out.

Two things limit the damage today: Complete is collapsed by default, and the
timer stops entirely when the app is hidden. Fix is `useMemo` on the context
value plus splitting stable functions from volatile data — a real refactor, its
own session, not a patch.

**6. `detailsToPlainText` parses into a live document.** `d.createElement('div')`
then `innerHTML = source`. The sanitizer uses
`document.implementation.createHTMLDocument('')` precisely because *"assigning to
a live element's innerHTML would fire `<img onerror>` before we ever got to strip
it"* — this function does the thing that comment warns against. Input is
sanitized in principle, so it is defence-in-depth, but it is two lines.

**7. Geolocation sends precise coordinates to a third party.**
`fetchLocationForNote` requests `enableHighAccuracy` and posts to
`nominatim.openstreetmap.org` with no disclosure — the only feature that sends
data off-device without one. Its `User-Agent` header is also a forbidden header
name, silently ignored by browsers, so Nominatim's attribution requirement is
not actually met.

**8. Five `alert()` calls remain.** The app replaced `window.confirm` with
`confirmAction` because a sandboxed iframe blocks it. `alert()` has the same
constraint and is still used in five error paths.

**9. Notes editor lags the details editor.** Two inline copies of the
`has-children` heading logic that still key off the previous checkbox line
regardless of gaps, and a `Tab` handler still gated on `checkboxLine`. Same
one-line fixes as the details editor received; separate code paths, so they want
their own device test.

**10. `Partner` is visible on a new install but sync does not exist.** A shared
list with nobody on the other end. Worth hiding until Session 3 lands — one word
in `DEFAULT_SETTINGS.hiddenLists`.

**11. Small.** `pickerActiveRef` is read as a guard in the outside-click
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

**A scope error shipped, twice, and neither parse nor tests caught it.**
`setSelectedDate` in the calendar; then `<CheckedBox />` used inside `Task` when
it is declared inside `LittleFiresApp`. The second took the whole app down
behind the error boundary. Both parsed cleanly, and the text-matching suites
passed — they compare strings, they do not resolve bindings.

> `tests/scope-test.js` now runs the AST scan on every suite run, visiting
> **`Identifier` and `JSXIdentifier`**, and includes a guard on the guard: it
> deliberately breaks a component reference and asserts the scan catches it.
> Running it is no longer something to remember.

**A stale base file wiped a day's work.** `/mnt/user-data/uploads/` holds what
was uploaded at the *start* of a session, not the current state. A fix was built
on that instead of on the working copy, and shipping it reverted everything
after it.

> Before handing back a file, check it is the one you have been editing: a line
> count against the previous version, and a grep for two or three features you
> know landed recently. A syntax check proves nothing about provenance.

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

6. **AI suggestions** — built and usable with a personal key. Before it goes to
   anyone else, the API call moves server-side behind auth (see `SYNC-PLAN.md`),
   which makes it dependent on Sessions 1–3 rather than parallel to them.

Also worth doing: **Vitest**. The merge logic is the one place a bug destroys
data silently rather than throwing. The thirty-nine node/jsdom suites in
`tests/` are the seed corpus — porting them is mostly renaming `t()` to
`test()`.

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
