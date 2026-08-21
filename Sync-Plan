# Little Fires — Sync Implementation Plan

A session-by-session route from "local-only app" to "shared Partner list that
syncs between two people."

**Read this first, in a fresh session, before touching sync code.**

> **Status, August 2026.** Setup is finished and Session 1 can begin. Session 0
> is done but still wants device testing. Two things changed since this plan was
> first written and both are recorded below: notes, projects and goals turn out
> to have none of the sync groundwork tasks have (now Session 2.5), and
> `note.expanded` no longer exists as stored state, which closes one of the
> open items.

---

## The one constraint that shapes everything

Claude cannot run this app, and cannot reach Firebase from its sandbox. Every
piece of sync code will be written blind and verified by **you**, on a device.

That is why this plan is broken into small steps that each end in a shippable,
testable state. It is not caution for its own sake — a parse check cannot catch
a `ReferenceError` on one interaction path, and that failure mode has already
bitten once this project (a `useLayoutEffect` change that parsed clean and
crashed the app).

**Rule: never end a session with sync half-wired.** Each session below leaves
the app working, whether or not the next one ever happens.

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
> see "The other three object types" below. That gap is the single largest
> unplanned item in this document.

The reason the hoist mattered for sync specifically: a partner's edit arrives as
a state update, and while `Task` remounted on every parent render, that update
would have destroyed whatever you were typing at the time.

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
never given the same groundwork, and an August 2026 pass over the code confirmed
how wide the gap is:

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

**This is at least a session's work on its own**, and it belongs before Session 3
(one-way push), not after. Pushing objects that cannot be merged only moves the
problem into the cloud.

### Notes carried UI state inside the synced object — **FIXED (Aug 2026)**

> This is resolved. It is kept because the *reasoning* applies to every field
> added from here on, and because the fix arrived by accident: notes were
> changed to open as an overlay rather than expanding in place, and the stored
> flag stopped being needed. A design change removed a sync problem.

`note.expanded` was stored on the note and persisted. It is not data — it is
whether that card happens to be open on this device — and syncing it means
opening a note on the phone silently opens it on the desktop, while every
expand and collapse becomes a write worth merging.

Tasks already avoid this: expansion is component state, never stored. Notes now
match — `selectedNoteId` lives in the component, and nothing about which note is
open reaches storage. The same question is worth asking of any field
added later: **would a partner want this to change on their screen because I did
it on mine?** If not, it does not belong in the synced object.

The session-only preferences added in August 2026 — which sections are open,
whether a note's location field is showing — are deliberately React state and
never touch storage, for exactly this reason.

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
for a value that essentially never changes. Two uids cost nothing and keep the
rules cheap.

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
personal.** This is the decision the whole model rests on, and it is worth
defending: a shared list is shared from birth, so there is no history to leak
the moment you flip a switch, no original owner to reason about, and no
migration path to get wrong. It also means the two sets can never collide on a
key, because they are stored separately - so there is no shared-list-id
indirection and no per-device mapping table. Every one of those is a problem the
flag model would have created.

Consequences worth holding onto:

- **Shared lists share their label.** "Groceries" should read as Groceries for
  both of you. Ordering and hiding stay per-person - those are furniture.
- **Assignment applies to every shared list**, not one special one. The task
  code already keys off the list, so this is a predicate change, not a rewrite.
- **The `partner` built-in becomes an ordinary personal list.** It was a list of
  tasks *about* your partner; shared lists are tasks *with* them. Renaming it
  ends a naming collision that has been open since the start.
- **There is nothing to show in the shared set until you're paired.** That view
  needs an empty state that explains why, not a blank tab.

---

## App Store constraints — decide these before writing auth

Verified against Apple's current guidelines. Both shape the *schema*, so they
are much cheaper to design in now than to retrofit after sync exists.

### Sign in with Apple (Guideline 4.8)

An app that **exclusively** uses a third-party or social login — Google included
— must also offer Sign in with Apple as an equivalent option. The exemptions
that matter here: an app using only its own account system is exempt, as are
education/enterprise apps and clients for a specific third-party service. None
of the others apply to this app.

"Equivalent" is defined by capability, not by brand. The alternative must limit
collection to name and email, let the user keep their email private, and not
collect in-app interactions for advertising without consent. Sign in with Apple
satisfies this by definition; a plain email/password system of your own can too.

Rejections under 4.8 are common and specific, so plan for it rather than hoping.

### What it costs, and why it is not being done now

**4.8 binds apps distributed through the App Store.** Little Fires is a PWA
added to the home screen — Apple never reviews it — so the rule does not
currently apply. That may change; it does not apply today.

Implementing it is not a toggle. Sign In with Apple can only be configured by
members of the **Apple Developer Program** ($99/year), and for a *web* app all
four of these are required:

1. An **App ID** with Sign in with Apple enabled
2. A **Service ID**, configured with the domain and the return URL
   `https://little-fires.firebaseapp.com/__/auth/handler`
3. A **private key** with the Sign in with Apple capability — the `.p8` file and
   its Key ID
4. Your **Team ID**

Those go into Firebase → Authentication → Sign-in method → Apple. (Native-only
Apple apps may leave them blank; web apps may not.) It is also a well-known
source of opaque `invalid_client` failures, which is not what you want while
getting auth working at all.

**The part that is free is the part that matters now**: keep the schema
provider-agnostic, per the note below. Adding Apple later is then linking a
second provider to an existing account — supported — rather than a migration.

> **The design consequence: never treat a Google uid as the identity.** The
> household model keys `members`, `createdBy`, `assignedTo` and `completedBy` on
> a uid. Firebase Auth already issues one uid per user regardless of provider,
> so this costs nothing today — but only if Session 2 is written against "the
> current user's uid" rather than anything Google-specific. Linking a second
> provider to an existing account later is then a supported operation instead of
> a migration.

### Account deletion (Guideline 5.1.1(v))

An app supporting account creation must let the user **initiate deletion from
inside the app**. Deactivating or disabling is explicitly not sufficient, and
the option has to be easy to find.

One concrete extra: if Sign in with Apple is offered, deletion must also revoke
the user's token through Apple's REST API. That needs a server-side call, which
is the one place this app may genuinely need something beyond client-side
Firebase.

**The hard part is not the button, it's the household.** Deleting your account
must not silently destroy tasks your partner is relying on. The unpair decision
already answers this and should be reused: the household goes `active: false`
with a `dissolvedAt`, tasks are batch-flipped to `archived: true`, and the
remaining member keeps read access to the history. Deleting an account is then
"unpair, then remove this member's own data" rather than a second mechanism.

Worth settling explicitly before Session 2, because it decides whether tasks are
owned by the household (they survive) or by their creator (they don't). The
schema here assumes the household owns them.

## Before Session 1 — setup — **DONE (Aug 2026)**

All of it is complete and verified in the console. Kept here as a record of what
was chosen and why, because several of these decisions shape Session 1 and 2.

| Step | State |
|---|---|
| Firebase project | Created — `little-fires`, Spark plan (no cost) |
| Google Analytics | Linked but unused — see the note below |
| Sign-in provider | **Google only.** Email/Password deliberately disabled |
| Firestore | Created, rules already scoped to the signed-in user |
| Web app | Registered as "Little Fires Web"; config in hand |
| Authorized domains | `localhost`, `little-fires.firebaseapp.com`, `little-fires.web.app`, and `little-fires.vercel.app` |

### The config

```js
const firebaseConfig = {
  apiKey: "AIzaSyCe9iy0avKz9rwwi5fuk_gQsFrieEot3so",
  authDomain: "little-fires.firebaseapp.com",
  projectId: "little-fires",
  storageBucket: "little-fires.firebasestorage.app",
  messagingSenderId: "751852393812",
  appId: "1:751852393812:web:e72c9a1bdcbe54276664c1",
  measurementId: "G-MEE6MDGWVJ"
};
```

**This is not secret.** Firebase web config is public by design; the `apiKey`
identifies the project, it does not authorise anything, and it ships in every
user's browser regardless. Security comes entirely from the Firestore rules.
Committing it is normal and fine.

### Two things Session 1 must not copy from the console snippet

Firebase's setup snippet includes these. **Leave both out:**

```js
import { getAnalytics } from "firebase/analytics";
const analytics = getAnalytics(app);
```

Analytics is linked to the project, so `measurementId` appears in the config —
but on **web**, nothing is collected unless that import runs. Keep
`measurementId` in the object (inert without the import, and removing it makes
the file differ from the console for no reason); never add the import.

If the link is ever unwanted: Project settings → Integrations → Google Analytics
→ remove. Fully reversible in both directions.

### Google is the only provider, deliberately

Email/Password was enabled at first and turned off before Session 1. Two
providers means two sign-in paths, password reset, and handling
`auth/account-exists-with-different-credential` when the same address arrives
via both — real work for a feature nobody had asked for.

The counter-argument, if it is ever revisited: Guideline 4.8 binds apps that use
third-party login **exclusively**, so an app with its own email/password system
is outside it. That makes Email/Password a free alternative to the paid Apple
setup — but only relevant if this is ever submitted to the App Store, which a
home-screen PWA is not.

**Whichever is true at Session 1, say so at the start.** Building for one
provider and retrofitting the second is more work than building for both.

### The current Firestore rules are a placeholder

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

Safe, and not test mode — there is no expiry timestamp, and `request.auth.uid ==
userId` is what makes it safe rather than merely authenticated. Without that
second clause any signed-in user could read anyone's data, and anyone can create
a Google account against the project.

**But it cannot express the household**, which is the whole point of a shared
Partner list: tasks live somewhere both members reach, not under one member's
uid. Session 2 replaces these. Treat them as a placeholder that fails safe.

### One thing worth checking before Session 1 starts

The rule versions are dated **March 2026** — the project predates the work by
five months. Glance at Authentication → Users for accounts left from that
earlier attempt. Not a problem, but better known than discovered mid-session.

---

## Session 0 — Hoist `Task` — **DONE**

`Task` now lives at module scope and receives its 26 app-level dependencies
through `TaskContext`. It no longer gets a new function identity on every parent
render, so React stops treating it as a different component type and no longer
remounts the whole task subtree.

**Still needs real device testing.** It moved ~2,100 lines and was verified
structurally, not at runtime.

### What it surfaced — read this before trusting "it worked before"

The remount was masking real bugs. Three appeared immediately, all the same
shape: state that was being accidentally reset by the constant remounting, and
that became genuinely persistent once it stopped.

1. **`LitFlame` / `UnlitFlame` were unresolvable.** They were declared inside
   `LittleFiresApp` and used by `Task`. The scope analysis missed them because it
   used Babel's `Identifier` visitor, and JSX component names are `JSXIdentifier`
   nodes — a different node type. Every `<Component/>` reference inside `Task` was
   invisible to the check that reported it clean. They render only on an expanded
   task, so expanding crashed the app.

   > Any scope analysis over JSX must visit **both** `Identifier` and
   > `JSXIdentifier`, or it will confidently miss every component reference.

2. **The details editor stopped saving on collapse.** The save was gated on
   `isExpanded && hasSetInitialContent.current`, conditions that could only ever
   prevent a save. That was survivable while the constant remount cycle was
   saving the editor by accident many times a second. Also found: `Task`'s
   save-on-outside-click listened only on `mousedown`, so on touch the collapse
   ran on `touchend` and the emulated mousedown arrived after the editor had
   already unmounted.

3. **Content was lost on re-expand — a load bug, not a save bug.** The "echo
   guard" skips rewriting the editor when `task.details` matches
   `lastSavedHtmlRef`, to avoid destroying the caret on our own save. That was
   safe only because remounting rebuilt those refs empty every time. Persisting
   them meant that after collapse and re-expand the two still matched while the
   editor was a brand new *empty* div — so the load was skipped, the editor
   stayed blank, and the next collapse saved that blank over the real content.
   The guard now also requires the DOM to actually hold the content.

> The general lesson: any `useRef` in a component that used to remount was being
> reset for free. Audit each one for logic that assumed freshness.


### It recurred, five months later

In August 2026 a `DetailField` component was written inside `LittleFiresApp` —
the same fault the hoist fixed, in a smaller place. Every keystroke in a
project's description destroyed the textarea being typed into, because React
reconciles by component type and a component declared inside another gets a new
identity on every render.

Two things came out of it worth keeping:

- **The suite now catches the class.** `scope-test.js` walks the AST for any
  component declared inside another and fails if one holds a form control or a
  hook. Display-only ones are counted and allowed.
- **It is the same mechanism sync depends on.** A partner's edit arrives as a
  state update; anything that remounts on a parent render will throw away what
  the reader is typing when it lands. The hoist was not a performance fix.

A second guard was added at the same time, for a fault that reached the device
twice: `const` referenced before its declaration in the same function body. It
resolves fine and still throws — React components are one long function, so a
helper placed above its dependency is a crash on first render.

## Session 1 — Auth only, no data

**Goal.** A working sign-in. Nothing syncs yet.

**Write it provider-agnostically from the first line.** Google is the quickest
provider to stand up, but nothing downstream may assume it - see the App Store
section above. Everything after auth should read the uid from the current user,
never from a Google-specific field.

**The work.**
- `npm install firebase`
- A `firebase.js` module: init app, export `auth` and `db`
- Sign in / sign out in Settings, under the Partner card
- Show signed-in email and avatar; persist across reload

**Use the redirect flow, not popup.** Popup sign-in is unreliable inside an iOS
home-screen web app. Redirect navigates away and returns, so anything unsaved in
page state must survive that. Verified in the Aug 2026 audit: the debounced-write
flush alone did NOT — it can only write state already captured into React, and
an open editor's un-blurred typing wasn't. The hide-time save plus the editor
crash journal (`little_fires_editor_draft`) now cover it, and the redirect rides
the same mechanism. Still worth one on-device check during this session.

**Verify.**
- Sign in on desktop
- Sign in on iOS **from the home-screen app**, not just Safari — this is the one
  that breaks
- Reload: still signed in
- Sign out, sign back in
- Airplane mode: app still works fully offline, since nothing depends on auth yet

**Done when.** You can sign in on both devices and the app is otherwise
unchanged.

**Rollback.** Sign-in UI is additive; remove the Settings block.

---

## Session 2 — Households and pairing

**Goal.** Two accounts can pair. Still no task sync.

This is the session people underestimate. "How does my partner join" is a
feature, not a setting.

**The work.**
- Firestore rules deployed (households + tasks, as above)
- On first sign-in, create a household with `members: [myUid]`
- Generate a short invite code; store `invites/{code} -> householdId`, with an
  expiry
- Join flow: enter code → add uid to `members` → delete the invite
- Guard: someone already in an active household cannot join another
- Unpair: `active: false`, `dissolvedAt`, and the archive batch
- Settings shows: paired / not paired, partner's name, invite code, Unpair

**Verify.**
- Account A creates a household, generates a code
- Account B joins with it
- Both see each other as paired
- A used code cannot be reused
- B cannot join a second household while paired
- Unpair from either side; both drop to unpaired
- Try to read another household's doc in the Firebase console as the wrong user
  — rules should refuse

**Done when.** Two real accounts pair and unpair reliably, and the rules reject
what they should.

**Rollback.** Delete the household docs; app returns to local-only.

---

## Session 3 — One-way push (local → cloud)

**Goal.** Partner-list tasks appear in Firestore. The app still reads only from
localStorage.

Deliberately one-way. Nothing can corrupt local data, because nothing is read
back yet.

**The work.**
- On any write to a list where `isSharedList(listName)` is true, mirror the task
  to `households/{id}/tasks/{taskId}`, carrying its `listKey`
- Mirror the shared *lists* themselves to `households/{id}/lists/{listKey}` —
  label and colour are shared; ordering and hiding stay per-device
- Map local `'me'` / `'partner'` placeholders to real uids — this is the
  find-and-replace the placeholders were designed for
- Deletes write `deletedAt` rather than removing the doc
- Enable Firestore offline persistence (`persistentLocalCache`) — this hands you
  offline write queueing for free

**Verify.** Add, edit, complete, delete a Partner task; watch each appear and
change in the Firebase console. Then go offline, make changes, come back online,
and confirm they land.

**Done when.** The console mirrors your Partner list. The app behaves exactly as
before.

**Rollback.** Remove the mirror call. Local data untouched throughout.

---

## Session 4 — Two-way sync

**Goal.** Changes from either device appear on both.

The hard one. Do not start it in a session that is already half-spent.

**The work.**
- `onSnapshot` on the household tasks collection
- Merge remote into local state: last-write-wins on `updatedAt`
- Honour `deletedAt` tombstones — a delete must not resurrect
- Ignore your own echo (writes come back through the listener)
- Do not clobber a task the user is actively editing — the client half is
  already built: write remote `details` through the normal state path and the
  load guard handles the rest (skip when the DOM already matches; defer when
  the editor is focused with unsaved changes, so the user's next save wins
  LWW as the genuinely newest edit; rewrite otherwise). What this session
  still owes is the listener-side echo guard above, and the merge itself
- **Archived is a state, not an absence.** A task that has been auto-archived is
  gone from `allLists` and present in `archivedTasks` with a fresh `updatedAt`
  and no tombstone. A merge that treats "missing from the active list" as a
  delete will destroy archived work on the other device. Merge the two maps as
  one keyspace, keyed by task id, and let `updatedAt` decide which side's view
  of *where* the task lives is newer
- **Never reuse `mergeById` / `mergeKeyed` for this merge.** They are backup
  semantics — additive, existing-wins, no stamp comparison. The sync merge is
  a different function: last-write-wins on `updatedAt`, tombstone-aware,
  built fresh and covered by tests before it touches real data

**Verify.**
- Two devices side by side: add on A, appears on B
- Complete on B, reflects on A, with the right `completedBy` badge
- Delete on A, disappears on B and stays gone after reload
- Edit the same task on both while one is offline; reconnect; newest wins
- Edit details on A while B changes the same task — the editor must not be
  yanked out from under you

**Done when.** All of the above, including the offline reconnect case.

**Rollback.** Detach the listener; you are back to Session 3's one-way push,
which still works.

---

## Session 5 — Hardening

**Goal.** Make it trustworthy rather than demoable.

- Sync status indicator (synced / offline / error)
- Auth errors: expired token, revoked access, wrong account
- Firestore quota and permission-denied errors surfaced, not swallowed
- Unpair archive verified with a realistic number of tasks
- Partner's display name pulled from their profile rather than typed by hand
- Decide what happens if a partner deletes their account

---

## AI suggestions depend on this plan, in one specific way

The AI Tasks feature is built and works today with **bring-your-own-key**: the
key is typed into Settings, held in `little_fires_ai_key`, and sent from the
browser straight to `api.anthropic.com` with the
`anthropic-dangerous-direct-browser-access` header. That is a legitimate,
documented pattern — but only while the key belongs to the person using it, on
their own device.

**The moment anyone else uses this app, that has to change.** Shipping a build
with a key in it — or asking someone else to paste a key into a client-side app
you distribute — puts a credential in a browser you do not control. The fix is
not a bolt-on: the call has to move behind an endpoint that knows who is
calling, which is a server, an authenticated identity, and a rate limit per
user. That is Sessions 1–3 of this plan, not a separate piece of work.

So the ordering constraint is: **BYO-key is fine for one person; a shared build
requires auth first.** Concretely, a Cloud Function or Vercel route holding the
key server-side, verifying a Firebase ID token, and rate-limiting per uid.

Three smaller things worth carrying forward:

- **The key raises the stakes on `sanitizeRichText`.** Anything that can inject
  script into the page can read localStorage. Task details are rich HTML, the
  sanitizer is the only thing standing between them and script execution, and it
  has had bugs before. Treat a sanitizer change as security-relevant now, not
  just correctness-relevant.
- **The key and the "about you" note are deliberately outside `settings`.**
  `buildBackup()` serialises `settings` into every exported backup, and the error
  boundary's raw dump reads the same entry. Keys and personal notes must never
  land in a file someone emails to themselves. If a future key gets added to the
  AI feature, put it beside these, not in settings.
- **These keys must never sync.** `little_fires_ai_suggestions`,
  `little_fires_ai_rejected`, `little_fires_ai_key`, `little_fires_ai_profile`,
  `little_fires_ai_instructions`, `little_fires_archive_notice` and
  `little_fires_editor_draft`. Each is wrong to share for a different reason: a
  suggestion is a proposal rather than work; a dismissal is one person's
  opinion; a key and a profile belong to a device and a person; the archive
  notice describes what *this* device just did; and the editor draft is a crash
  journal for one session on one device. If sync ever moves to an allowlist,
  build it as an allowlist — a denylist of "everything except these" acquires a
  hole every time a key is added, and today alone added three.

## One performance fact that will matter at Session 4

`taskContextValue` is rebuilt on every render, so **every mounted task
re-renders on any state change anywhere in the app**. Today that is a battery
question. Once a snapshot listener is attached it becomes a correctness-adjacent
one: every remote change arriving from Firestore sets state, and every one of
those will re-render every task on screen.

The `Task` hoist already fixed the version of this that destroyed typing — a
remount would have thrown away whatever was in the editor. Re-rendering is
survivable where remounting was not, and the load guard defers a rewrite while
the editor is focused and dirty. But a partner typing steadily on the other
device would drive a re-render of the whole visible list per keystroke-batch.

Worth fixing (`useMemo` on the context value, plus splitting stable functions
from volatile data) **before** Session 4, not after. It is listed as tech debt
item 5 in `PROJECT-HANDOFF.md`.

## Known traps

**iOS home-screen auth.** Test sign-in from the installed app, not just Safari.
Different storage context, different redirect behaviour.

**Authorized domains.** Sign-in fails silently from an unlisted domain.

**Your own echo.** Every write returns through the snapshot listener. Without a
guard this either loops or overwrites what you just typed.

**Placeholder uids.** `'me'` and `'partner'` are string literals throughout the
task code. Session 3 replaces them; miss one and assignment silently breaks.

**Naming collision.** The built-in "Partner" list means tasks *about* your
partner. The shared list means tasks *with* them. Consider renaming one —
"Household" or "Us" — before this ships, or it will confuse both of you.

**A client-side API key is a one-person arrangement.** The AI suggestions
feature calls Anthropic straight from the browser using the user's own key. That
is fine for a personal install and unacceptable in a shared one — see the AI
section above. If this app is ever handed to someone else, the call moves behind
authenticated server code *before* they get the build, not after.

**Do not use `useLayoutEffect` where the cleanup writes state.** Already crashed
the app once. The details editor's save-on-cleanup makes this specific trap live.

**Opening a task must never become a write again.** The collapse paths used to
force-save "to ensure persistence", stamping `updatedAt` on every open-and-close.
Under last-write-wins that lets a read beat a real edit from the other device.
They now route through `saveDetails`, which no-ops when unchanged — keep it that
way, whatever persistence worry tempts a force-save back in.

**Backup merge resurrects deleted tasks.** Merge-import is deliberately additive
and ignores `deletedTaskIds` — fine while local-only, but after Session 3 a
resurrected shared-list task gets mirrored to the household and reappears on
your partner's device, possibly against a remote tombstone. Treat a remote
`deletedAt` as authoritative over any local resurrection, and check tombstones
before merging a backup into a shared list.

**Both files must be committed.** `index.html` carries the font `<link>` tags and
`viewport-fit=cover`. Committing only the `.jsx` silently loses the fonts.

---


### Two CSS traps that cost real time in August 2026

Neither is a sync concern, but both are the same shape as the settings-delta
trap above — a rule that is present, parses, and silently does nothing:

- **`input[type="text"]` beats a class.** Element + attribute is specificity
  (0,1,1); a plain class is (0,1,0). Three rules styling text inputs lost every
  property they shared with the global rule and rendered as the default pill for
  as long as they existed. Fixed by matching the selector's shape, not by
  `!important`, so the reason stays visible.
- **`width: 100%` plus padding with no `box-sizing`.** Repeatedly. There is a
  suite for it now.

The general lesson, and the reason they are recorded here: **a change that
appears to have no effect is more expensive than one that breaks visibly.** The
same is true of a sync write that silently loses.

## Suggested order

```
Prereqs     Firebase project setup        DONE - Aug 2026
Session 0   Hoist Task                    DONE - needs device testing
Session 1   Auth                          ready to start
Session 2   Households + pairing          needs two Google accounts
Session 2.5 updatedAt + tombstones for    NEW - not in the original plan
            notes, projects and goals
Session 3   One-way push                  safe, reversible
Session 4   Two-way sync                  the hard one
Session 5   Hardening
```

Sessions 0, 1 and 3 are low-risk. Session 2 is larger than it sounds. Session 4
deserves a full fresh session with nothing else in it.

**Session 2.5 is new.** The original plan assumed the whole app had the
groundwork tasks have; it does not. Notes, projects and goals need `updatedAt`
stamps and tombstones before anything pushes them, and `note.expanded` needs to
stop being stored. Doing it here rather than during Session 3 keeps the push
session about the push.

Stopping after any session leaves a working app.
