# Little Fires — Sync Implementation Plan

A session-by-session route from "local-only app" to "shared Partner list that
syncs between two people" — **without ever putting a login in front of the
app.**

**Read this first, in a fresh session, before touching sync code.**

> **Status, late August 2026.** Session 1 was written in full and then
> **deliberately not committed** — see "Where Session 1 actually stands" below.
> The four files exist and build; they are waiting, not lost. The session they
> came from turned into a UI session instead, which shipped a large batch of
> changes including two new fields on projects and goals that Session 2.5 now
> has to carry.
>
> One decision was added this session and it is load-bearing enough to sit at
> the top of the document: **the app must work, fully, signed out.**

---

## The constraint that shapes everything technical

Claude cannot run this app, and cannot reach Firebase from its sandbox. Every
piece of sync code will be written blind and verified by **you**, on a device.

That is why this plan is broken into small steps that each end in a shippable,
testable state. It is not caution for its own sake — a parse check cannot catch
a `ReferenceError` on one interaction path, and that failure mode has already
bitten this project (a `useLayoutEffect` change that parsed clean and crashed
the app).

**Rule: never end a session with sync half-wired.** Each session below leaves
the app working, whether or not the next one ever happens.

---

## The constraint that shapes everything else — **NEW, Aug 2026**

**Little Fires is local-first and stays that way. Signed-out is a first-class
state, not a degraded one.**

The reason is concrete: you want to send the URL to a friend, a family member or
a colleague and have them *use the thing* — see real lists, add a task, get it —
without an account screen as the first thing they meet. That is true today, and
nothing in Sessions 1–5 may take it away.

What that means in practice, as a rule to hold in every later session:

- **No feature is gated behind `authUser`.** Sign-in *adds* sync; it does not
  unlock the app. If a feature needs an account, it is a sync feature and it
  lives inside the shared set, not in the personal one.
- **No interstitial, ever.** No "create an account to continue", no modal on
  launch, no dismissible banner that reappears. Sign-in lives in Settings.
- **The invitation appears where it is earned** — at the moment someone wants
  their data on a second device, or wants to pair with a partner. Not before.
- **A sync failure never blocks local work.** Offline, signed out, Firestore
  down, quota exceeded: the app keeps working on localStorage. Sync is a
  mirror, not the source of truth, right through Session 4.
- **localStorage stays authoritative for personal lists.** Shared lists live in
  the household because they must; personal lists have no reason to leave the
  device.

**This replaces the idea of maintaining a second local-only build.** It was
considered and rejected this session. A fork of a 25,000-line single-file app
means two places for the three known bug classes to reappear and a manual merge
on every change. One app that behaves correctly signed out is strictly better,
and is most of the way built already.

> If two *installed* apps are ever genuinely wanted — two icons, two datasets —
> the way to do it is a **second Vercel project pointing at the same GitHub
> repo**, not a fork. Same commit, second origin, therefore separate PWA
> storage and a separate icon. A `VITE_LOCAL_ONLY` env var could hide the
> sign-in row in that build. Costs: permanently separate data with export/import
> as the only bridge, distinct names and icons required in the manifest or you
> will add tasks to the wrong one, and the AI key entered twice.

### What this makes newly urgent: first-run

A friend opening the URL today gets the full interface and **completely empty
lists with no explanation**. That, not a login wall, is the actual obstacle to
"see it and get it."

This is queued as its own session below. It is small, it is not sync work, and
it pairs naturally with the outstanding manifest/PWA work.

### Two cautions that apply the moment you share the link

- **Their data is local and fragile.** Clearing browser data wipes it; there is
  no cloud copy for them either. Tell them, and point at Export.
- **AI Tasks will be inert for them**, which is correct. **Never bake your key
  into the deployed build** — that hands your API spend to everyone with the
  URL. See the AI section near the end; this is the same constraint from the
  other direction.

---

## Where Session 1 actually stands — **read before starting it**

Session 1 was written end-to-end in August 2026 and then held back. Nothing is
broken; the work is queued.

**What exists, built and verified to compile:**

| File | Path | State |
|---|---|---|
| `firebase.js` | repo root | Written. Init, `auth` export, redirect helpers, error describer |
| `vercel.json` | repo root | Written. Auth reverse-proxy rewrites |
| `package.json` | repo root | Written. Adds `firebase ^12.18.0` |
| `manifest.json` | **`public/`** | Written. Unrelated to auth; see PWA below |

**Why it was held back.** The session ran long on UI work and it was late. The
app file has since moved on considerably, so **the auth block must be
re-applied to the current `little-fires-app.jsx`, not merged from the old
one.** That is a small, mechanical job: one import, one state block, one
Settings block. Do not attempt to reconcile two divergent copies of a
25,000-line file.

**Two discoveries from that session that are now decisions:**

### `authDomain` must be the serving domain, not `firebaseapp.com`

The plan originally said "use redirect, not popup," which is right, and stopped
there. That is not sufficient.

Redirect sign-in stores its result under `authDomain`'s origin. When that
differs from the origin serving the app, Safari's third-party storage blocking —
which governs the installed home-screen app, the exact context that matters here
— discards it. **The failure is silent: the redirect completes, Google
succeeds, and you come back signed out.** Worse, it may work on desktop Chrome,
so it passes a desktop check and dies on the device.

The fix, which is Firebase's own documented approach for apps not hosted on
Firebase Hosting:

```json
// vercel.json — transparent proxy, NOT a 302
{
  "rewrites": [
    { "source": "/__/auth/:path*",
      "destination": "https://little-fires.firebaseapp.com/__/auth/:path*" },
    { "source": "/__/firebase/:path*",
      "destination": "https://little-fires.firebaseapp.com/__/firebase/:path*" }
  ]
}
```

…paired with `authDomain: 'little-fires.vercel.app'` in the config. Auth then
lives entirely on our own origin: same-origin storage, no ITP involvement.

**These two files are a pair. If the app ever moves to a custom domain, change
both.** And the proxy is provider-agnostic — it serves the helper for any
provider, so Apple slots in later unchanged.

### One console step, or sign-in fails

In **Google Cloud Console → APIs & Services → Credentials**, on the OAuth client
Firebase auto-created ("Web client (auto created by Google Service)"):

- Authorized JavaScript origins: `https://little-fires.vercel.app`
- Authorized redirect URIs: `https://little-fires.vercel.app/__/auth/handler`

This is the pair to the `authDomain` change — the proxy makes your domain the
auth origin, so Google has to be told to trust it. **Not doing this produces a
failure that looks like a code bug.**

### Firestore is deliberately not initialized yet

`firebase.js` exports `auth` only. Importing `firebase/firestore` cost ~92 KB
gzipped — about a third of the bundle — for code nothing touches until Session
3. `db` arrives when something first reads or writes it.

---

## Already done (do not redo)

These prerequisites are complete and committed. A future session should verify
rather than rebuild — and "verify" is meant literally: the Aug 2026
stabilization audit checked this table against the code and found two rows
false (immutability, the auto-archive stamp). Both are repaired, and the
regression suites in `tests/` now pin them.

| Prerequisite | State |
|---|---|
| Collision-resistant IDs | `makeId()` (UUID + fallback) on all creation sites |
| ID-based addressing | All task mutators take `(listName, taskId)`; no array positions |
| `updatedAt` on every task | Stamped by `updateTask()`; auto-archive stamps too (was missing — fixed) |
| Tombstones | `deletedTaskIds` side table, 90-day TTL, pruned on load |
| Immutable updates | `updateTask()` replaces; removal paths copy the array before splicing (three violations found in the Aug 2026 audit, fixed) |
| HTML sanitization | Allowlist at every read and write boundary, incl. backup import |
| Shared-list model | Two sets, `isSharedList()`, `createdBy` / `assignedTo` / `completedBy` |
| Partner settings | Name, colour, linked-account field in Settings |
| No-op saves never stamp | Collapse routes through `saveDetails`; opening a task is not a write |
| Active-editor deferral | Load guard: skip / defer (focused + dirty) / rewrite — remote details can't clobber typing |
| Editor crash journal | Hide-time save journalled synchronously; survives a PWA kill and the auth redirect |
| Archive is not a delete | Auto-archive moves tasks to `archivedTasks` under the same id, stamping `updatedAt`, and writes **no** tombstone |
| Settings that must persist | `theme`, `accentId`, `fontChoice`, `hiddenLists`, `hiddenFeatures` are written unconditionally — see the trap below |

Everything above is in place, including the `Task` hoist that was Session 0 —
that one still wants real device testing before anything is built on top of it.

> **All of this is about tasks.** Notes, projects and goals have none of it —
> see the next section.

### One trap that will resurface if settings ever sync

Settings are stored as deltas from `DEFAULT_SETTINGS`, and the loader treats a
missing key as "existing install" and pins it. For any key whose default is also
a plausible *choice*, those two rules cancel: choosing the default writes
nothing, the pin then overrides it, and the choice reverts on the next launch.

Five keys have hit this — `theme`, `accentId`, `fontChoice`, `hiddenFeatures`,
`hiddenLists` — and all five are now written unconditionally.

It matters here because **merging settings across devices is the same problem
one layer up**: "this device has no value for X" and "this device deliberately
chose the default for X" are indistinguishable in a delta blob. If settings are
ever added to sync, they need per-key `updatedAt` stamps, not a delta merge.
Tasks already have that; settings do not.

---

## The other three object types are not sync-ready

Everything in the table above describes **tasks**. Notes, projects and goals were
never given the same groundwork:

| | Tasks | Notes | Projects | Goals |
|---|---|---|---|---|
| Collision-resistant id | yes | yes | yes | yes |
| `updatedAt` on write | yes | **no** | **no** | **no** |
| Tombstones on delete | yes | **no** | **no** | **no** |
| Immutable updates | yes | yes | yes | yes |
| HTML sanitized | yes | yes | n/a | n/a |
| Free of UI state | yes | yes (fixed Aug 2026) | yes | yes |

Without `updatedAt` there is nothing to compare, so last-write-wins has no
"last". Without tombstones, deleting a note on one device and syncing from
another restores it — the resurrection bug, and the reason tasks got tombstones
in the first place.

**This is at least a session's work on its own** (Session 2.5), and it belongs
before Session 3, not after. Pushing objects that cannot be merged only moves
the problem into the cloud.

### Projects and goals gained fields in August 2026 — **Session 2.5 must carry them**

Both object types were given task-style grouping this session:

```
section:     'active' | 'backlog' | 'complete'
completedAt: ISO string | null
```

Three things about this that matter for sync:

- **Undefined means `'active'`.** Records created before this change carry
  neither field, and every read site treats a missing `section` as active. There
  was no migration, which means **an older device can push a project or goal
  with no `section` at all** and the merge must not treat that as invalid.
- **`completedAt` is stamped on entry and cleared on exit**, so reopening a
  completed item does not leave a stale date behind. A merge that resurrects an
  old `completedAt` alongside a newer `section: 'active'` would produce a
  contradiction.
- **`section` is data, not UI state** — it passes the "would a partner want this
  to change on their screen because I did it on mine?" test. It belongs in the
  synced object. Which sections are *open* does not, and is React state.

### Notes carried UI state inside the synced object — **FIXED (Aug 2026)**

> Resolved, but kept because the *reasoning* applies to every field added from
> here on, and because the fix arrived by accident: notes were changed to open
> as an overlay rather than expanding in place, and the stored flag stopped
> being needed. A design change removed a sync problem.

`note.expanded` was stored on the note and persisted. It is not data — it is
whether that card happens to be open on this device — and syncing it means
opening a note on the phone silently opens it on the desktop, while every
expand and collapse becomes a write worth merging.

The same question is worth asking of any field added later: **would a partner
want this to change on their screen because I did it on mine?** If not, it does
not belong in the synced object.

All the session-only preferences added in August 2026 — which sections are open
on projects, goals, the AI shelves and the task list; whether a note's location
field is showing — are deliberately React state and never touch storage, for
exactly this reason.

### Note fields changed in August 2026

- **`title` added.** Empty on creation, falling back to the note's date for
  display. Plain text, so no sanitization, and no merge subtlety beyond
  last-write-wins.
- **`extractedText` and `isProcessing` removed** with the OCR engine. Notes
  saved before that still carry both keys in storage. They are ignored on read
  and dropped the next time the note is written, but a sync schema should not be
  surprised to see them arrive from an older device.

---

## Decisions already made

Do not relitigate these in a later session unless something has changed.

**Data model.** Shared tasks do not live in either person's data. They live in a
household both people belong to.

```
households/{householdId}
  members:     [uidA, uidB]
  active:      true
  createdAt
  dissolvedAt: null

households/{householdId}/lists/{listKey}
  label, color, createdBy, createdAt
  archived:    false

households/{householdId}/tasks/{taskId}
  listKey:     the shared list this belongs to
  text, details, dueDate, dueTime, completed, priority, section
  createdBy:   uid
  assignedTo:  uid | null
  completedBy: uid | null
  createdAt, updatedAt, completedAt
  archived:    false
  deletedAt:   null            // tombstone
  members:     [uidA, uidB]    // denormalised copy of household.members
```

`members` is deliberately duplicated onto every task. Rules could look up the
parent household instead, but that is an extra document read on every operation
for a value that essentially never changes.

**Permissions.** Either partner may read, create, edit and complete any shared
task. Delete is restricted to the creator or the assignee. An unassigned task
falls back to creator-only.

```
match /households/{householdId}/tasks/{taskId} {
  allow read:   if request.auth.uid in resource.data.members;
  allow create: if request.auth.uid in request.resource.data.members
                && request.resource.data.createdBy == request.auth.uid;
  allow update: if request.auth.uid in resource.data.members;
  allow delete: if request.auth.uid in resource.data.members
                && (resource.data.createdBy == request.auth.uid
                    || resource.data.assignedTo == request.auth.uid);
}
```

**Unpairing archives, it does not delete.** Household gets `active: false` and a
`dissolvedAt`; a batch write flips `archived: true` on every task. Both people
keep read access to the dissolved household, so history survives. One batch
covers it (Firestore allows 500 writes per batch), so **no Cloud Function is
needed** — which matters, because Cloud Functions require the paid Blaze plan
and this fits comfortably in free Spark.

**Two separate sets of lists: personal and shared.** Not a per-list "shared"
flag. Personal lists live in localStorage exactly as they do today. Shared lists
live only in the household. Each set caps at 10.

**A personal list can never become shared, and a shared list never becomes
personal.** This is the decision the whole model rests on: a shared list is
shared from birth, so there is no history to leak the moment you flip a switch,
no original owner to reason about, and no migration path to get wrong. It also
means the two sets can never collide on a key.

Consequences worth holding onto:

- **Shared lists share their label.** Ordering and hiding stay per-person —
  those are furniture.
- **Assignment applies to every shared list**, not one special one.
- **The `partner` built-in becomes an ordinary personal list.** It was a list of
  tasks *about* your partner; shared lists are tasks *with* them.
- **There is nothing to show in the shared set until you're paired.** That view
  needs an empty state that explains why, not a blank tab. This is the same
  problem as first-run, and should be solved with it.

---

## App Store constraints — decide these before writing auth

Both shape the *schema*, so they are much cheaper to design in now than to
retrofit after sync exists.

**Sign in with Apple (Guideline 4.8).** Binds apps using third-party login
exclusively. Deferred — it requires a paid Apple Developer account. The
mitigation is that **auth is provider-agnostic from the first line**: everything
downstream reads `uid` / `email` / `photoURL` from the current user, never a
Google-specific field. Adding Apple later is one function and one button.

**Account deletion (Guideline 5.1.1(v)).** Must be in-app, not a support email.
Planned to reuse the unpair flow: dissolve the household, then delete the user.

**Google is the only provider, deliberately.** Email/Password was enabled at
first and turned off before Session 1 — two providers means two sign-in paths,
password reset, and handling `auth/account-exists-with-different-credential`.

---

## Firebase setup — **DONE (Aug 2026)**

| Step | State |
|---|---|
| Firebase project | Created — `little-fires`, Spark plan (no cost) |
| Google Analytics | Linked but unused — never add the `getAnalytics` import |
| Sign-in provider | **Google only** |
| Firestore | Created, rules scoped to the signed-in user (placeholder — Session 2 replaces them) |
| Web app | Registered; config in hand |
| Authorized domains | `localhost`, `little-fires.firebaseapp.com`, `little-fires.web.app`, `little-fires.vercel.app` |
| **Google Cloud OAuth client** | **NOT DONE — see "One console step" above** |

**The config is not secret.** Firebase web config is public by design; the
`apiKey` identifies the project, it does not authorise anything, and it ships in
every browser regardless. Security comes entirely from the Firestore rules.

`measurementId` may stay in the object — it is inert without the analytics
import — but `firebase.js` as written omits it, since nothing reads it.

---

## Sessions

### Session A — First run and empty states — **NEW, do this early**

**Goal.** Someone who has never seen Little Fires opens the link and understands
it within thirty seconds.

Not sync work. Independent of every other session. Pairs naturally with the
outstanding PWA/manifest work.

**The work.**
- An empty state on the task list that says what the app is for, rather than
  showing nothing
- A "load sample tasks" action that seeds a handful of realistic items across a
  couple of lists, and is easy to clear afterwards
- The shared-set empty state ("nothing here until you pair") — same problem,
  same session
- Check the whole first-run path with **storage cleared**, which is the state
  every new person arrives in and the one you never see

**Done when.** You can hand the URL to someone cold and not have to narrate it.

**Rollback.** All additive.

---

### Session 1 — Auth only, no data

**Goal.** A working sign-in. Nothing syncs yet. **The app is unchanged for
anyone who ignores it.**

Largely written already — see "Where Session 1 actually stands" for the four
files, the `authDomain` decision, and the console step. The remaining work is
re-applying the auth block to the current app file.

**The work.**
- Commit `firebase.js`, `vercel.json`, `package.json`, `public/manifest.json`
- Re-apply to the current `little-fires-app.jsx`: the import, the auth state
  block, the Settings sign-in block under the Partner card
- Do the Google Cloud Console step
- Provider-agnostic throughout: read `uid` from the current user, never a
  Google-specific field

**Verify.**
- Sign in on desktop
- Sign in on iOS **from the home-screen app**, not just Safari — this is the one
  that breaks
- Reload: still signed in
- Sign out, sign back in
- Airplane mode: app still works fully offline
- **Signed out, everything still works** — the local-first rule, checked rather
  than assumed

**Done when.** You can sign in on both devices and the app is otherwise
unchanged.

**Rollback.** Sign-in UI is additive; remove the Settings block.

---

### Session 2 — Households and pairing

**Goal.** Two accounts can pair. Still no task sync.

The session people underestimate. "How does my partner join" is a feature, not a
setting.

**The work.**
- Firestore rules deployed (households + tasks, as above)
- On first sign-in, create a household with `members: [myUid]`
- Short invite code; `invites/{code} -> householdId`, with an expiry
- Join flow: enter code → add uid to `members` → delete the invite
- Guard: someone already in an active household cannot join another
- Unpair: `active: false`, `dissolvedAt`, and the archive batch
- Settings shows: paired / not paired, partner's name, invite code, Unpair

**Verify.**
- A creates a household and a code; B joins with it; both see each other
- A used code cannot be reused
- B cannot join a second household while paired
- Unpair from either side; both drop to unpaired
- Try to read another household's doc as the wrong user — rules should refuse

**Rollback.** Delete the household docs; app returns to local-only.

---

### Session 2.5 — `updatedAt` and tombstones for notes, projects, goals

**Goal.** Give the other three object types the groundwork tasks already have.

**The work.**
- `updatedAt` stamped on every write path for notes, projects and goals —
  including the section moves added in August 2026
- Tombstone side tables mirroring `deletedTaskIds`, with the same TTL and prune
- Audit every mutator for the "no-op write still stamps" trap tasks already
  solved
- Confirm `section` / `completedAt` on projects and goals are stamped like any
  other field, and that a missing `section` from an older device is treated as
  `'active'` rather than rejected

**Done when.** The sync-readiness table above is all "yes".

---

### Session 3 — One-way push (local → cloud)

**Goal.** Partner-list tasks appear in Firestore. The app still reads only from
localStorage. Deliberately one-way: nothing can corrupt local data, because
nothing is read back yet.

**The work.**
- On any write to a list where `isSharedList(listName)` is true, mirror to
  `households/{id}/tasks/{taskId}`, carrying its `listKey`
- Mirror the shared *lists* to `households/{id}/lists/{listKey}` — label and
  colour are shared; ordering and hiding stay per-device
- Map local `'me'` / `'partner'` placeholders to real uids
- Deletes write `deletedAt` rather than removing the doc
- Enable Firestore offline persistence (`persistentLocalCache`)
- **The AI key moves server-side in this session or immediately after** — see
  below

**Verify.** Add, edit, complete, delete a Partner task; watch each in the
console. Then go offline, make changes, reconnect, confirm they land.

**Rollback.** Remove the mirror call. Local data untouched throughout.

---

### Session 4 — Two-way sync

**Goal.** Changes from either device appear on both.

The hard one. Do not start it in a session that is already half-spent.

**The work.**
- `onSnapshot` on the household tasks collection
- Merge remote into local: last-write-wins on `updatedAt`
- Honour `deletedAt` tombstones — a delete must not resurrect
- Ignore your own echo
- Do not clobber a task being actively edited — the client half is built (the
  load guard: skip / defer / rewrite). What this session owes is the
  listener-side echo guard and the merge itself
- **Archived is a state, not an absence.** A merge that treats "missing from the
  active list" as a delete will destroy archived work on the other device. Merge
  active and archived as one keyspace keyed by id, and let `updatedAt` decide
- **Never reuse `mergeById` / `mergeKeyed`.** They are backup semantics —
  additive, existing-wins, no stamp comparison. The sync merge is a different
  function: last-write-wins, tombstone-aware, built fresh and covered by tests
  before it touches real data

**Verify.**
- Two devices: add on A, appears on B
- Complete on B, reflects on A with the right `completedBy` badge
- Delete on A, gone on B and stays gone after reload
- Edit the same task on both while one is offline; reconnect; newest wins
- Edit details on A while B changes the same task — the editor must not be
  yanked out from under you

**Rollback.** Detach the listener; back to Session 3's one-way push.

---

### Session 5 — Hardening

- Sync status indicator (synced / offline / error)
- Auth errors: expired token, revoked access, wrong account
- Firestore quota and permission-denied surfaced, not swallowed
- Unpair archive verified with a realistic number of tasks
- Partner's display name pulled from their profile rather than typed by hand
- Decide what happens if a partner deletes their account

---

## Outstanding, not sync — the PWA reinstall

Independent of everything above, but blocked on a deploy.

`index.html` links `/manifest.json` and **no manifest exists in the repo** — the
link is dangling. The installed iPhone app still runs standalone because iOS
captured that at install time from a manifest that has since been deleted. The
icon is stale for the same reason: iOS snapshots it at install and never
refreshes.

`public/manifest.json` is written and waiting. **Sequence matters:**

1. Commit and deploy the manifest **first**
2. **Export a backup from inside the installed app** — deleting the icon deletes
   that device's storage, and there is no cloud copy and no desktop mirror
3. Delete the icon; re-add from Safari at `little-fires.vercel.app`
4. Import the backup

Reinstalling before the manifest is live gets you a Safari bookmark with an
address bar instead of a standalone app — a worse outcome than a stale icon.

---

## AI suggestions depend on this plan, in one specific way

AI Tasks works today with **bring-your-own-key**: typed into Settings, held in
`little_fires_ai_key`, sent from the browser straight to `api.anthropic.com`.
That is a legitimate, documented pattern — but only while the key belongs to the
person using it, on their own device.

**This is exactly where the local-first rule and the sharing goal collide.**
Handing the URL to a friend is fine — the feature is simply inert for them
unless they add their own key. **Shipping a build with your key in it is not**,
and neither is asking someone else to paste a key into a client-side app you
distribute.

The fix is not a bolt-on: the call has to move behind an endpoint that knows who
is calling — a Cloud Function or Vercel route holding the key server-side,
verifying a Firebase ID token, rate-limiting per uid. That is Sessions 1–3.

**BYO-key is fine for one person; a shared build with a shared key requires auth
first.**

Three smaller things worth carrying forward:

- **The key raises the stakes on `sanitizeRichText`.** Anything that can inject
  script into the page can read localStorage. Treat a sanitizer change as
  security-relevant, not just correctness-relevant.
- **The key and the "about you" note are deliberately outside `settings`.**
  `buildBackup()` serialises `settings` into every export, and the error
  boundary dumps the same entry. Keys and personal notes must never land in a
  file someone emails themselves.
- **These keys must never sync.** `little_fires_ai_suggestions`,
  `little_fires_ai_rejected`, `little_fires_ai_key`, `little_fires_ai_profile`,
  `little_fires_ai_instructions`, `little_fires_archive_notice`,
  `little_fires_editor_draft`. If sync ever moves to an allowlist, build it as
  an allowlist — a denylist acquires a hole every time a key is added.

---

## One performance fact that will matter at Session 4

`taskContextValue` is rebuilt on every render, so **every mounted task
re-renders on any state change anywhere in the app**. Today that is a battery
question. Once a snapshot listener is attached it becomes correctness-adjacent:
every remote change sets state, and every one re-renders every task on screen.

The `Task` hoist fixed the version of this that destroyed typing. Re-rendering
is survivable where remounting was not. But a partner typing steadily on the
other device would drive a re-render of the whole visible list per
keystroke-batch.

Worth fixing (`useMemo` on the context value, plus splitting stable functions
from volatile data) **before** Session 4. Tech debt item 5 in
`PROJECT-HANDOFF.md`.

---

## Known traps

**iOS home-screen auth.** Test sign-in from the installed app, not just Safari.
Different storage context, different redirect behaviour. And see the
`authDomain` decision above — the naive configuration fails here specifically.

**Authorized domains.** Sign-in fails silently from an unlisted domain. Two
separate lists matter: Firebase authorized domains *and* the Google Cloud OAuth
client's origins and redirect URIs.

**Your own echo.** Every write returns through the snapshot listener. Without a
guard this either loops or overwrites what you just typed.

**Placeholder uids.** `'me'` and `'partner'` are string literals throughout the
task code. Session 3 replaces them; miss one and assignment silently breaks.

**Reorder indices are computed from a filtered list.** `reorderProjects` splices
the raw array, but the index handed to it comes from a list with archived
projects already removed. Reordering a list containing archived projects is
therefore off. Pre-existing, found in August 2026, deliberately not fixed inside
a UI change. Fix it where reordering is being touched anyway.

**Grouped lists renumber rows.** Projects and goals now render in three groups.
Each row carries its index in the *ungrouped* list, and cross-group drops are
ignored. Touch-drag reordering still hands `handleTouchMove` the full ungrouped
list and **has not been verified on a device**.

### Two CSS traps that cost real time in August 2026

Neither is a sync concern, but both are the same shape as the settings-delta
trap — a rule that is present, parses, and silently does nothing:

- **`input[type="text"]` beats a class.** Element + attribute is (0,1,1); a
  plain class is (0,1,0). Fixed by matching the selector's shape, not by
  `!important`, so the reason stays visible.
- **`width: 100%` plus padding with no `box-sizing`.** Repeatedly. There is a
  suite for it now.

A third, added this session:

- **`overflow: hidden` on an animation wrapper clips popups.** The
  `section-shell` collapse animation needs it to clip growing content; the Goal
  dropdown needs to escape its box. Resolved by timing, not by choosing:
  the shell releases overflow ~40ms after the open transition and reinstates it
  synchronously on close. Scoped to that one section deliberately.

The general lesson: **a change that appears to have no effect is more expensive
than one that breaks visibly.** The same is true of a sync write that silently
loses.

---

## Suggested order

```
Prereqs     Firebase project setup        DONE — except the OAuth client step
Session 0   Hoist Task                    DONE — needs device testing
Session A   First run + empty states      NEW — small, independent, do it early
Session 1   Auth                          written, not committed; re-apply
Session 2   Households + pairing          needs two Google accounts
Session 2.5 updatedAt + tombstones for    now also covers section/completedAt
            notes, projects and goals
Session 3   One-way push                  safe, reversible; AI key moves here
Session 4   Two-way sync                  the hard one
Session 5   Hardening
```

Sessions A, 1 and 3 are low-risk. Session 2 is larger than it sounds. Session 4
deserves a full fresh session with nothing else in it.

Stopping after any session leaves a working app — and at every point along the
way, **a stranger with the URL can still open it and use it.**

