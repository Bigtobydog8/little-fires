# Little Fires — Project Handoff

Read this first. Repo: github.com/Bigtobydog8/little-fires

---

## What it is

A single-file React task app (~15,800 lines) that I use daily.

- **Vite build**, React 18 via npm. Repo: https://github.com/Bigtobydog8/little-fires
  (`index.html` → `main.jsx` → `little-fires-app.jsx`).
- **localStorage only.** No backend yet.
- **Deployed to Vercel**, installed as a PWA on iPhone.
- **Entry point:** `export default function LittleFires()` — an error boundary wrapping
  `LittleFiresApp`. `main.jsx` imports the default export; don't rename it.

**Because Vite is already in place:** npm dependencies can be added normally. Use the
**modular** Firebase SDK (`import { getAuth } from 'firebase/auth'`), not the compat
CDN build. Vitest is a natural fit for tests.

**Validate every edit** before presenting:
```bash
cd /tmp && npm install --no-save @babel/core @babel/preset-react
node -e "require('@babel/core').transformSync(require('fs').readFileSync('/mnt/user-data/outputs/little-fires-app.jsx','utf8'),{presets:['@babel/preset-react']})"
```
This has caught real breakage several times, including an orphaned markup fragment
after a bad slice.

---

## Features

Tasks (To Do / Backlog / Complete), Time tracking, Goals, Projects, Notes,
Calendar, Reports, Search, Archive, Settings.

**Task lists:** 6 built-in (personal, work, home, travel, kids, partner) plus
user-created ones, capped at 10 total. Renameable, hideable, drag-reorderable.

**Settings:** accent theming, list management, section toggles, fire goals,
defaults, behavior, JSON backup/restore, CSV export.

---

## Decisions already made — don't relitigate

**List keys are permanent; labels are a display layer.** Keys are also localStorage
keys. Renaming only changes the label. Custom list keys are slugs generated once at
creation.

**Display vs. data operations are deliberately separate.** `visibleTaskLists` respects
hiding and ordering. `TASK_LISTS` is the full canonical set. Auto-archive and project
cleanup must always use the full set — otherwise tasks pile up invisibly in hidden lists.

**Settings store only deltas from defaults.** Writing the whole object would freeze
today's defaults into a user's storage forever, so changing a default later would never
reach them.

**Theming runs through CSS variables:** `--accent`, `--accent-light`, `--accent-rgb`,
`--accent-muted-rgb`. ~350 references. **`var()` does not work in SVG presentation
attributes** — use `style={{ stroke: 'var(--accent)' }}`, never `stroke="var(--accent)"`.
That mistake shipped a broken timer ring once.

**Animation was deliberately cut back for battery.** No unconditional infinite
animations remain. The title pulse and background drift were removed; the fire flicker
runs at 15fps and stops when full; the flame pulse is desktop-only. Don't reintroduce
always-on animation without a reason.

**Reports intro animates once per chart mode per session**, then snaps. Filter changes
should not replay it.

---

## Known issues / tech debt

**Ranked by risk:**

1. **XSS surface.** Three `dangerouslySetInnerHTML` render HTML captured from
   contentEditable. Harmless today (own data, own browser). **Becomes a real vector the
   moment Partner sync renders someone else's content.** Sanitize before sync ships.

2. **`Date.now()` IDs** (7 creation sites). Two devices can collide in the same
   millisecond, and merge dedupes by ID — one task would silently swallow another.
   Fix before sync.

3. **Index-based mutations.** `toggleTask(listName, index)` etc. Indices are captured at
   render and used later; a delete or auto-archive in between hits the wrong task.
   Expansion was already moved to `task.id`. Mutations should follow.

4. **`Task` is defined inside `LittleFiresApp`**, so it's remount-prone by construction,
   and every state change re-renders the whole tree (116 useState hooks). Hoisting it out
   is the real fix for both stability and performance.

**Unresolved:** on mobile, opening the due-date picker sometimes auto-selects today and
closes. Multiple guards added (picker-active ref, click-outside guard, uncontrolled
input, id-based expansion). **Last seen in the Claude artifact preview — needs verifying
on Vercel**, since sandboxed iframes handle native pickers badly. May not be a real bug.

---

## Roadmap (agreed order)

1. **Device sync (Firebase)** — hard prerequisite for everything below
2. **Partner shared list** — rides on the same auth
3. **Google Calendar** — reuses the same Google OAuth consent
4. **Push notifications** — free, no phone numbers, no compliance burden
5. **SMS reminders** — only if reaching people without the app matters

**Why this order:** SMS and calendar both need server-side data, which means sync first.
Calendar needs Google OAuth, which is the same consent flow as sync's Google Sign-In —
build it once. Push beats SMS on cost, compliance, and UX (it deep-links; SMS can't).

### Sync design (decided, not built)

- Google Sign-In, login required
- **One document per task**, not one per list — a per-list blob means a phone
  reconnecting after a tunnel overwrites whatever the desktop did
- **Deletes need tombstones** (`deletedAt`), or offline deletes resurrect on sync
- Archive becomes `archived: true`, not a move between collections
- First sync **merges with a summary**, never a silent overwrite. Existing
  backup/import merge logic is the same shape — idempotent, dedupes by ID
- Stay on the Spark plan while possible: it cannot bill you. Cloud Functions
  (needed for scheduled reminders) require Blaze
- Firebase config is public by design; security lives in Firestore rules

**Blocked on:** creating a Firebase project and providing the config block.
See `SYNC-SETUP-STEP-1.md`.

**Note:** `firebase-sync.js` in outputs is from an earlier attempt and is
**single-user, whole-array sync**. Its migration blindly overwrites the cloud, which
would destroy the first device's data when the second signs in. Treat as reference only.

### Pre-sync work worth doing first

**Set up a staging Firebase project** so sync is never tested against real data.
Vercel preview deployments (automatic per branch) pair well with this.

**Add Vitest** — `npm i -D vitest`. The merge logic is the one place a bug destroys
data silently rather than throwing. Idempotency was verified by hand this session;
that should be a permanent test, not something re-derived from memory.

- Sanitize HTML (issue #1)
- Collision-resistant IDs (issue #2)
- Switch mutations to `task.id` (issue #3)
- `dueDate` already has an optional `dueTime` companion; UI stamps `'00:00'` and hides
  the time field. `'00:00'` is treated as all-day so tasks aren't overdue at 12:01am.

---

## Working style that worked

- Investigate before editing — grep the actual code rather than assuming
- Validate parse after every change
- Test logic in isolation with node/jsdom before presenting
- Say when something is a guess, and when a fix is unverified
- Push back on requests that would cause harm (e.g. hiding Archive would make
  auto-archived tasks unreachable — deliberately not built)

---

## Commercial notes (explored, not decided)

- Vite is already in place, so the build-step prerequisite for native packaging
  (Capacitor) is met.
- **Pure PWAs are rejected** from the App Store under Guideline 4.2. Passing needs
  genuinely native capabilities — widgets, Siri/App Intents. Adding push notifications
  alone is not enough.
- Apple takes 15–30%. Stripe takes ~2.9% + 30¢.
- **Recommended path:** validate with a web subscription + PWA install first. Native
  only after demand is proven.
- Firestore at 1,000 users ≈ $5–10/month. Infrastructure is not the cost problem.
- The **Partner/household angle** is the real differentiator — "another task app"
  competes with free, preinstalled Apple Reminders.
