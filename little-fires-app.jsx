import React, { useState, useEffect } from 'react';


// ---- Inline date picker ----------------------------------------------------
// Deliberately not <input type="date">. The native picker renders as a browser
// overlay attached to a specific DOM node, and this app re-creates task rows on
// parent renders - when that node is replaced mid-interaction, iOS commits the
// highlighted value (today) as it tears the sheet down. A React-rendered
// calendar has no overlay to lose: worst case it simply closes, and it can
// never write a date the user didn't tap.
function InlineDatePicker({ value, onChange, style }) {
  const [open, setOpen] = React.useState(false);
  const parse = (v) => {
    if (!v) return null;
    const [y, m, d] = String(v).split('-').map(Number);
    return (y && m && d) ? new Date(y, m - 1, d) : null;
  };
  const selected = parse(value);
  const [view, setView] = React.useState(() => {
    const base = selected || new Date();
    return { year: base.getFullYear(), month: base.getMonth() };
  });

  const MONTHS = ['January','February','March','April','May','June',
                  'July','August','September','October','November','December'];
  const pad = (n) => String(n).padStart(2, '0');
  const toValue = (y, m, d) => `${y}-${pad(m + 1)}-${pad(d)}`;

  const daysInMonth = new Date(view.year, view.month + 1, 0).getDate();
  const firstWeekday = new Date(view.year, view.month, 1).getDay();
  const today = new Date();
  const isToday = (d) => today.getFullYear() === view.year &&
    today.getMonth() === view.month && today.getDate() === d;
  const isSelected = (d) => selected && selected.getFullYear() === view.year &&
    selected.getMonth() === view.month && selected.getDate() === d;

  const shiftMonth = (delta) => setView(v => {
    const nm = v.month + delta;
    return { year: v.year + Math.floor(nm / 12), month: ((nm % 12) + 12) % 12 };
  });

  const stop = (e) => { e.stopPropagation(); };
  // The app has a global `button` rule: accent gradient, uppercase text,
  // letter-spacing, an accent-coloured glow and a lift on hover. Every control
  // in this picker is a plain field or a bare text button, so each one starts
  // from this reset. `transform` is pinned here because the global :hover rule
  // lifts buttons - a pseudo-class can't beat an inline style, so this is what
  // holds the field still.
  const btnReset = {
    boxShadow: 'none',
    textTransform: 'none',
    letterSpacing: 'normal',
    fontWeight: 500,
    transform: 'none'
  };
  // 44px is the iOS minimum comfortable touch target. These controls were
  // roughly 20px tall, which is a real miss on a phone-first app. Centring the
  // glyph keeps them looking the same size as before.
  const tapTarget = {
    minWidth: '44px', minHeight: '44px', padding: 0,
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center'
  };
  // Matched to .project-selector and the app's text inputs so this sits in a
  // row with them without looking like a different kind of control.
  const field = {
    ...btnReset,
    padding: '10px 12px', background: 'rgba(var(--surface-rgb), 0.8)',
    backdropFilter: 'blur(10px)',
    border: '2px solid rgba(var(--accent-rgb), 0.2)', borderRadius: '20px',
    boxShadow: '0 4px 15px rgba(var(--shadow-rgb), 0.3)',
    color: value ? 'var(--text)' : '#8a8a9a', fontFamily: "'Nunito', sans-serif",
    fontSize: '0.95rem', cursor: 'pointer', minWidth: '132px', textAlign: 'left',
    // When a caller sizes the wrapper (width, flex, etc), the button should
    // fill it rather than sitting at its natural content width inside it.
    ...(style ? { width: '100%' } : {})
  };

  return (
    <span style={{
      position: 'relative',
      // inline-flex, not inline-block. The clear button is a sibling of the
      // trigger, and as inline content it wrapped onto a second line once the
      // field got narrow - which made a filled date field taller than an empty
      // one and knocked Start and End out of alignment with each other.
      display: 'inline-flex',
      alignItems: 'center',
      gap: '2px',
      whiteSpace: 'nowrap',
      verticalAlign: 'middle',
      ...style
    }}
      onMouseDown={stop} onTouchStart={stop} onClick={stop}>
      <button type="button" style={field} onClick={(e) => { stop(e); setOpen(o => !o); }}>
        {selected ? selected.toLocaleDateString('en-US',
          { month: 'short', day: 'numeric', year: 'numeric' })
          /* No placeholder text - an unset field reads as empty, like the
             other inputs. The non-breaking space keeps the button from
             collapsing to zero height when there's nothing to show. */
          : '\u00A0'}
      </button>
      {value && (
        <button type="button" title="Clear date" aria-label="Clear date"
          onClick={(e) => { stop(e); onChange(''); setOpen(false); }}
          style={{ ...btnReset, background: 'transparent', border: 'none',
            // Was a hardcoded grey - the last one in this component, so it
            // stayed cool-toned against the warm light theme.
            color: 'var(--text-muted)',
            cursor: 'pointer', fontSize: '1rem', flexShrink: 0, ...tapTarget }}>×</button>
      )}

      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 6px)', left: 0, zIndex: 2000,
          background: 'rgba(var(--surface-deep-rgb), 0.99)',
          border: '2px solid rgba(var(--accent-rgb), 0.4)',
          borderRadius: '12px', padding: '12px', width: '252px',
          boxShadow: '0 10px 30px rgba(var(--shadow-rgb),0.55)',
          fontFamily: 'var(--font-ui)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center',
            justifyContent: 'space-between', marginBottom: '8px' }}>
            <button type="button" aria-label="Previous month"
              onClick={(e) => { stop(e); shiftMonth(-1); }}
              style={{ ...btnReset, background: 'transparent', border: 'none', color: 'var(--text)',
                cursor: 'pointer', fontSize: '1.1rem', ...tapTarget }}>‹</button>
            <span style={{ color: 'var(--text)', fontSize: '0.85rem', fontWeight: 600 }}>
              {MONTHS[view.month]} {view.year}
            </span>
            <button type="button" aria-label="Next month"
              onClick={(e) => { stop(e); shiftMonth(1); }}
              style={{ ...btnReset, background: 'transparent', border: 'none', color: 'var(--text)',
                cursor: 'pointer', fontSize: '1.1rem', ...tapTarget }}>›</button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '2px' }}>
            {['S','M','T','W','T','F','S'].map((d, i) => (
              <div key={i} style={{ textAlign: 'center', color: '#8a8a9a',
                fontSize: '0.65rem', padding: '3px 0' }}>{d}</div>
            ))}
            {Array.from({ length: firstWeekday }).map((_, i) => <div key={'b' + i} />)}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const d = i + 1;
              const sel = isSelected(d);
              return (
                <button key={d} type="button"
                  onClick={(e) => { stop(e); onChange(toValue(view.year, view.month, d)); setOpen(false); }}
                  style={{
                    ...btnReset,
                    padding: '6px 0', borderRadius: '7px', cursor: 'pointer',
                    fontSize: '0.8rem', fontFamily: 'var(--font-ui)',
                    border: isToday(d) && !sel ? '1px solid rgba(var(--accent-rgb), 0.6)' : '1px solid transparent',
                    background: sel ? 'linear-gradient(135deg, var(--accent), var(--accent-light))' : 'transparent',
                    color: sel ? '#fff' : 'var(--text)', fontWeight: sel ? 700 : 500
                  }}>
                  {d}
                </button>
              );
            })}
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px' }}>
            <button type="button" onClick={(e) => {
                stop(e);
                const t = new Date();
                onChange(toValue(t.getFullYear(), t.getMonth(), t.getDate()));
                setOpen(false);
              }}
              style={{ ...btnReset, background: 'transparent', border: 'none', color: 'var(--accent-light)',
                cursor: 'pointer', fontSize: '0.78rem', fontFamily: 'var(--font-ui)' }}>
              Today
            </button>
            <button type="button" onClick={(e) => { stop(e); setOpen(false); }}
              style={{ ...btnReset, background: 'transparent', border: 'none', color: '#8a8a9a',
                cursor: 'pointer', fontSize: '0.78rem', fontFamily: 'var(--font-ui)' }}>
              Close
            </button>
          </div>
        </div>
      )}
    </span>
  );
}

// Monochrome calendar glyph, drawn deliberately without a date number. It
// replaces the 📅 emoji, which most platforms render with a fixed date baked
// into the artwork (July 17 on iOS) - sitting immediately before a real due
// date, that reads as a second, contradictory date. Stroked with currentColor
// so it inherits whatever the surrounding text is doing, including turning red
// alongside overdue dates.
function CalendarIcon({ size = 13 }) {
  return (
    <svg
      width={size} height={size} viewBox="0 0 16 16"
      fill="none" stroke="currentColor" strokeWidth="1.5"
      strokeLinecap="round" strokeLinejoin="round"
      aria-hidden="true"
      style={{ verticalAlign: '-1px', flexShrink: 0 }}
    >
      <rect x="2" y="3.5" width="12" height="10.5" rx="2" />
      <path d="M2 7.25h12" />
      <path d="M5.5 2v3" />
      <path d="M10.5 2v3" />
    </svg>
  );
}

// Companions to CalendarIcon, for the same reason: emoji are full-colour, vary
// by platform, and sit oddly beside the app's flat cream-on-navy palette. All
// stroke with currentColor so they inherit their surrounding text.
function IconBase({ size = 13, children }) {
  return (
    <svg
      width={size} height={size} viewBox="0 0 16 16"
      fill="none" stroke="currentColor" strokeWidth="1.5"
      strokeLinecap="round" strokeLinejoin="round"
      aria-hidden="true"
      style={{ verticalAlign: '-1px', flexShrink: 0 }}
    >
      {children}
    </svg>
  );
}

// Replaces 📦 on archived items.
function ArchiveIcon(props) {
  return (
    <IconBase {...props}>
      <rect x="1.75" y="2.25" width="12.5" height="3.5" rx="1" />
      <path d="M3 5.75v7a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1v-7" />
      <path d="M6.5 8.5h3" />
    </IconBase>
  );
}

// Replaces 🏗️ on project rows.
function ProjectIcon(props) {
  return (
    <IconBase {...props}>
      <path d="M8 1.75 14.25 5 8 8.25 1.75 5 8 1.75Z" />
      <path d="M1.75 8 8 11.25 14.25 8" />
      <path d="M1.75 11 8 14.25 14.25 11" />
    </IconBase>
  );
}

// Replaces 📷 on notes carrying images.
function ImageIcon(props) {
  return (
    <IconBase {...props}>
      <rect x="1.75" y="3" width="12.5" height="10" rx="2" />
      <circle cx="5.75" cy="6.5" r="1.15" />
      <path d="M2.25 11.5 5.75 8.5l3 2.5 2.25-1.75 2.75 2.25" />
    </IconBase>
  );
}

// Replaces ☑ on the details toolbar. U+2611 gets emoji presentation on iOS,
// so it rendered as a coloured glyph next to two plain text buttons.
function CheckboxIcon(props) {
  return (
    <IconBase {...props}>
      <rect x="2" y="2" width="12" height="12" rx="2.5" />
      <path d="M5 8.25 7.25 10.5 11 6.25" />
    </IconBase>
  );
}

// Replaces 🔥 as a priority marker. Filled rather than stroked, and kept in the
// app's existing priority orange - the colour is the signal here, so unlike the
// others this one doesn't inherit currentColor.
function FlameIcon({ size = 13 }) {
  return (
    <svg
      width={size} height={size} viewBox="0 0 16 16"
      aria-hidden="true"
      style={{ verticalAlign: '-2px', flexShrink: 0 }}
    >
      <path
        d="M8 1.5c.4 2-1 3-2.2 4.3C4.5 7.1 3.75 8.4 3.75 10a4.25 4.25 0 0 0 8.5 0c0-2.1-1.1-3.4-2.3-4.8-.6-.7-1.1-1.4-1.2-2.2-.3.5-.7.9-1.1 1.3.2-1 .3-1.9.35-2.8Z"
        fill="#FF8C42"
      />
      <path
        d="M8 8c.3 1-.5 1.6-1 2.2-.35.4-.5.8-.5 1.3a1.75 1.75 0 0 0 3.5 0c0-.9-.5-1.5-1-2.1-.4-.5-.8-.9-1-1.4Z"
        fill="#FFD93D"
      />
    </svg>
  );
}

// Collision-resistant IDs for tasks. Date.now() has millisecond resolution, so
// two tasks created in the same millisecond shared an ID. On one device that's
// unlikely; on a list shared between two people - both adding items while
// looking at the same fridge - it stops being unlikely, and a duplicate ID in a
// synced list means one person's edits land on the other's task.
// randomUUID needs a secure context, which localhost and any https host are;
// the fallback covers plain-http origins where it isn't exposed.
// Indent / outdent for the details toolbar. Lines plus an arrow, matching the
// stroke weight of their neighbours. currentColor throughout, so they inherit
// the toolbar button's text colour in both themes and when active.
function IndentIcon(props) {
  return (
    <IconBase {...props}>
      <path d="M2 3h12" />
      <path d="M7 6.5h7" />
      <path d="M7 9.5h7" />
      <path d="M2 13h12" />
      <path d="M2 6.5l2.5 1.75L2 10z" fill="currentColor" stroke="none" />
    </IconBase>
  );
}

function OutdentIcon(props) {
  return (
    <IconBase {...props}>
      <path d="M2 3h12" />
      <path d="M7 6.5h7" />
      <path d="M7 9.5h7" />
      <path d="M2 13h12" />
      <path d="M4.5 6.5L2 8.25 4.5 10z" fill="currentColor" stroke="none" />
    </IconBase>
  );
}

function makeId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'id-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 10);
}

// --- Rich text sanitising ---------------------------------------------------
// Task details and note bodies are stored as HTML and rendered with
// dangerouslySetInnerHTML. On a single device the only person who can put a
// <script> in your own notes is you. The moment a list is shared that stops
// being true: whatever your partner types is rendered inside your session, with
// reach over everything in localStorage. So the HTML is filtered on the way in
// and on the way out.
//
// The allowlist is small because the editors only ever produce a handful of
// tags: contenteditable divs and spans, <br>, bold from execCommand, bullet
// lists, and the checkbox inputs.
const RICH_TEXT_TAGS = new Set([
  'DIV', 'SPAN', 'P', 'BR', 'B', 'STRONG', 'I', 'EM', 'U', 'UL', 'OL', 'LI', 'INPUT', 'A'
]);
// Classes carry real behaviour and styling here, so a few are kept - but only
// these, so nothing can borrow the app's own styling to fake UI.
const RICH_TEXT_CLASSES = new Set([
  'task-checkbox', 'checkbox-line', 'follow-up-heading', 'task-link',
  // Mark a checkbox that has indented children beneath it, and the item that
  // closes such a group. Task details recompute these on load, so their absence
  // went unnoticed there - but a note is rendered straight from stored HTML with
  // nothing to recompute, so the hierarchy was flattened every time one saved.
  'has-children', 'ends-list'
]);

// Link targets are rebuilt, never passed through. Parsing with the URL
// constructor rather than pattern-matching matters: "javascript:" can be
// smuggled past a regex using embedded newlines, tabs, control characters or
// HTML entities, but none of that survives being parsed and re-serialised.
// Anything that isn't a plain web or mail address comes back null.
const SAFE_LINK_PROTOCOLS = new Set(['http:', 'https:', 'mailto:']);
function safeHref(value) {
  if (!value || typeof value !== 'string') return null;
  try {
    const base = (typeof window !== 'undefined' && window.location)
      ? window.location.href
      : 'https://localhost/';
    const url = new URL(value, base);
    return SAFE_LINK_PROTOCOLS.has(url.protocol) ? url.href : null;
  } catch (err) {
    return null;
  }
}

function sanitizeRichText(html) {
  if (!html || typeof html !== 'string') return '';
  if (typeof document === 'undefined') return '';

  // createHTMLDocument gives an inert document: parsing happens, but images
  // don't fetch and nothing executes. Assigning to a live element's innerHTML
  // would fire <img onerror> before we ever got to strip it.
  const doc = document.implementation.createHTMLDocument('');
  doc.body.innerHTML = html;

  const walk = (parent) => {
    // Static copy: the loop removes and unwraps as it goes.
    Array.from(parent.childNodes).forEach(node => {
      if (node.nodeType === 3) return;              // text is always fine
      if (node.nodeType !== 1) { node.remove(); return; }  // comments, etc

      const tag = node.tagName;

      if (!RICH_TEXT_TAGS.has(tag)) {
        // Unknown tags are unwrapped rather than deleted, so a paste wrapped in
        // some foreign element keeps its text. script and style are the
        // exception - there, the text content is the payload.
        if (tag === 'SCRIPT' || tag === 'STYLE') {
          node.remove();
        } else {
          // Clean the subtree BEFORE promoting it. This loop iterates a
          // snapshot of the children taken on entry, so anything moved up here
          // would otherwise never be visited - and a payload one level inside a
          // disallowed wrapper (<form><img onerror=...></form>) would ride
          // straight through untouched.
          walk(node);
          while (node.firstChild) parent.insertBefore(node.firstChild, node);
          node.remove();
        }
        return;
      }

      // The only input the editors make is a checkbox. Anything else claiming
      // to be an input is not ours.
      if (tag === 'INPUT' && node.getAttribute('type') !== 'checkbox') {
        node.remove();
        return;
      }

      Array.from(node.attributes).forEach(attr => {
        const name = attr.name.toLowerCase();
        if (name === 'class') {
          const kept = attr.value.split(/\s+/).filter(c => RICH_TEXT_CLASSES.has(c));
          if (kept.length) node.setAttribute('class', kept.join(' '));
          else node.removeAttribute('class');
          return;
        }
        if (tag === 'INPUT' && (name === 'type' || name === 'checked')) return;
        if (tag === 'A' && name === 'href') {
          const safe = safeHref(attr.value);
          if (safe) node.setAttribute('href', safe);
          else node.removeAttribute('href');
          return;
        }
        // The title is the full URL, shown on hover - plain text, and useful
        // because the visible label is just "Link".
        if (tag === 'A' && name === 'title') return;
        // Nested checklists carry their indent as an inline margin-left, so a
        // blanket style strip silently flattened them on every save. Rather
        // than allow style through, the value is rebuilt from scratch: parse
        // one number out, discard the original string, emit a known-good
        // declaration. Nothing an attacker writes can survive that, because
        // nothing of theirs is copied - only a matched integer.
        if (name === 'style') {
          const indent = /(?:^|;)\s*margin-left\s*:\s*(\d{1,3})px\s*(?:;|$)/i.exec(attr.value);
          if (indent) node.setAttribute('style', 'margin-left: ' + indent[1] + 'px');
          else node.removeAttribute('style');
          return;
        }
        // Everything else goes: on* handlers, src, href, srcset,
        // contenteditable, data-*. Nothing in the allowlist needs them, and an
        // attribute allowlist can't be outflanked the way a blocklist can.
        node.removeAttribute(attr.name);
      });

      if (tag === 'A') {
        if (!node.getAttribute('href')) {
          // The href didn't survive validation, so this is no longer a link.
          // Unwrap rather than keep a dead anchor that still looks clickable.
          const parent = node.parentNode;
          while (node.firstChild) parent.insertBefore(node.firstChild, node);
          parent.removeChild(node);
          return;
        }
        // Set here rather than trusted from the input: a link that opens in
        // this tab would navigate away from the app and lose unsaved edits,
        // and without noopener the opened page can reach back via window.opener.
        node.setAttribute('target', '_blank');
        node.setAttribute('rel', 'noopener noreferrer');
      }

      walk(node);
    });
  };

  walk(doc.body);
  return doc.body.innerHTML;
}

// ---- Editor crash journal --------------------------------------------------
// The debounced-write flush on pagehide can only persist state that has
// already been captured into React. Content typed into the details editor
// since the last blur exists only in the DOM - and a save dispatched during
// pagehide cannot reach localStorage through the normal path, because the
// state update and its debounced write never run if iOS kills the suspended
// PWA (or an auth redirect navigates away). So a hide-time save is also
// journalled here, synchronously, and applied on the next load only if it is
// strictly newer than what the stored task already carries.
//
// The draft holds the SANITIZED form (what saveDetails computed), so applying
// it is equivalent to the save that would have landed.
const EDITOR_DRAFT_KEY = 'little_fires_editor_draft';

function writeEditorDraft(listName, taskId, details) {
  try {
    localStorage.setItem(EDITOR_DRAFT_KEY, JSON.stringify({
      listName, taskId, details, savedAt: new Date().toISOString()
    }));
  } catch (err) {
    // Storage full or unavailable. The normal save path was still dispatched;
    // only the crash journal is lost, which is the pre-journal behaviour.
  }
}

function clearEditorDraft() {
  try { localStorage.removeItem(EDITOR_DRAFT_KEY); } catch (err) {}
}

// Read-only: called from a useState initializer, which StrictMode invokes
// twice in development - so this must not consume the draft. The mount effect
// next to the allLists state is what clears it.
function applyEditorDraft(lists) {
  try {
    const raw = localStorage.getItem(EDITOR_DRAFT_KEY);
    if (!raw) return lists;
    const draft = JSON.parse(raw);
    if (!draft || typeof draft.details !== 'string') return lists;
    const list = lists && lists[draft.listName];
    if (!Array.isArray(list)) return lists;
    const idx = list.findIndex(t => t && t.id === draft.taskId);
    if (idx === -1) return lists;
    const task = list[idx];
    // Strictly newer only. If the app survived the hide, the normal save (or
    // a later edit) stamped updatedAt at or after savedAt, and the stored
    // value wins - a stale draft must never overwrite newer content.
    if (task.updatedAt && draft.savedAt && draft.savedAt <= task.updatedAt) return lists;
    if ((task.details || '') === draft.details) return lists;
    const nextList = [...list];
    nextList[idx] = { ...task, details: draft.details, updatedAt: draft.savedAt || new Date().toISOString() };
    return { ...lists, [draft.listName]: nextList };
  } catch (err) {
    return lists;
  }
}

// Battery saver defaults on for touch devices. Phones and tablets run on a
// battery and pay the real cost of backdrop blur and a full-screen gradient
// layer; a desktop plugged into the wall does not. Deliberately tests the
// pointer rather than the viewport width - a desktop browser with a narrow
// window is still a desktop, and would otherwise be opted in for no reason.
//
// Evaluated once at module load rather than inside the component, because
// DEFAULT_SETTINGS is rebuilt on every render and the answer cannot change for
// the life of the page.
const IS_TOUCH_DEVICE =
  typeof window !== 'undefined' &&
  typeof window.matchMedia === 'function' &&
  window.matchMedia('(hover: none) and (pointer: coarse)').matches;

// An internal clipboard, used only as a fallback.
//
// Pasting rich content depends on reading 'text/html' from the paste event, and
// that is not dependable - iOS Safari in particular often exposes only
// 'text/plain', which is why copying a checklist from one task to another came
// back as bare text. So a copy out of the details editor also stashes its own
// HTML here, keyed to the exact plain text the browser will carry alongside it.
//
// The text acts as the key on purpose: if the user copies something else in
// between, from any other app, the plain text won't match and the stash is
// correctly ignored rather than pasting stale content.
let internalClipboard = { text: '', html: '' };

// Font choices. `ui` is the display face (headings, tabs, buttons); `body` is
// the reading face (task text, notes). Both are named per option so a choice is
// a coherent pairing rather than two dropdowns to get wrong.
//
// `google` is the families to request, or null for the system stack - which
// costs no network at all and is the fastest possible option.
const FONT_OPTIONS = [
  {
    id: 'default', label: 'Quicksand & Nunito', note: 'The original pairing',
    ui: "'Quicksand', sans-serif", body: "'Nunito', sans-serif",
    google: 'Quicksand:wght@400;500;600;700&family=Nunito:wght@400;500;600;700'
  },
  {
    id: 'system', label: 'System', note: 'Your device\'s own font - loads instantly',
    ui: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    body: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    google: null
  },
  {
    id: 'serif', label: 'Lora & Inter', note: 'Bookish headings, plain body',
    ui: "'Lora', Georgia, serif", body: "'Inter', sans-serif",
    google: 'Lora:wght@500;600;700&family=Inter:wght@400;500;600;700'
  },
  {
    id: 'mono', label: 'Space Grotesk & Inter', note: 'Geometric and technical',
    ui: "'Space Grotesk', sans-serif", body: "'Inter', sans-serif",
    google: 'Space+Grotesk:wght@400;500;600;700&family=Inter:wght@400;500;600;700'
  },
  {
    id: 'humanist', label: 'Nunito', note: 'One rounded face throughout',
    ui: "'Nunito', sans-serif", body: "'Nunito', sans-serif",
    google: 'Nunito:wght@400;500;600;700;800'
  }
];

// The timer's duration choices, defined once. The dropdown, the label shown on
// it and the progress ring all read from here - previously the list and a long
// ternary chain that mapped values to labels were each duplicated across two
// render sites, so adding an option meant four edits and leaving one behind
// showed a duration with no name.
const DURATION_OPTIONS = [
  { value: '', label: 'Timer' },
  { value: 300, label: '5 Minutes' },
  { value: 420, label: '7 Minutes' },
  { value: 600, label: '10 Minutes' },
  { value: 900, label: '15 Minutes' },
  { value: 1500, label: '25 Minutes' },
  { value: 1800, label: '30 Minutes' },
  { value: 3600, label: '60 Minutes' }
];

// Completion animation timing. These three numbers have to agree, and they used
// to be written out separately - a JS timer, a CSS transition-delay and a commit
// timeout - so nudging one silently desynchronised the others: the row could
// start collapsing before the tick had been seen, or the task could swap lists
// while still visibly fading.
const COMPLETE_HOLD_MS = 900;   // tick lit, nothing moving yet
const COMPLETE_ANIM_MS = 400;   // fade and collapse, run together
const COMPLETE_TOTAL_MS = COMPLETE_HOLD_MS + COMPLETE_ANIM_MS + 50;

// Self-contained SVG marks, so they belong at module scope alongside the other
// icons. They were declared inside LittleFiresApp and referenced by Task, which
// only breaks once Task is hoisted - and only on the expanded task, since that
// is the one place they render.
// ---- Calendar day grouping -------------------------------------------------
// The same three buckets the task list and the project detail already use, in
// the same order.
//
// One deliberate difference: To Do is "not completed and not backlog" rather
// than section === 'todo'. `section` is only set at creation and has never
// been backfilled, so a task old enough to predate the field has no section at
// all - and an equality test would put it in no bucket, silently dropping it
// from the day. Defining the default bucket by exclusion means every task
// lands somewhere.
const CALENDAR_STATUS_GROUPS = [
  { key: 'todo', label: 'To Do', match: (t) => !t.completed && t.section !== 'backlog' },
  { key: 'backlog', label: 'Backlog', match: (t) => !t.completed && t.section === 'backlog' },
  { key: 'complete', label: 'Complete', match: (t) => !!t.completed }
];

// Empty buckets are dropped so a day with only completed tasks doesn't render
// two empty headings above them.
function groupTasksByStatus(items, getTask) {
  return CALENDAR_STATUS_GROUPS
    .map(group => ({
      key: group.key,
      label: group.label,
      items: (items || []).filter(item => group.match(getTask(item) || {}))
    }))
    .filter(group => group.items.length > 0);
}

// ---- Indent helpers --------------------------------------------------------
// Indentation is represented two different ways, and both already existed
// before the toolbar buttons did - the drag gesture and the Tab key use this
// same split, so the buttons must too or the two would disagree about what an
// indented line is.
//
//   bullets      - structural nesting (<ul> inside <li>). A bullet's depth has
//                  to be real nesting or the markers all render at one level.
//   everything   - marginLeft in fixed steps, on the line element itself
//   else           (.checkbox-line, or a plain block).
//
// execCommand('indent') is used ONLY for bullets. On a non-list block some
// browsers implement it by wrapping the line in <blockquote>, which the
// sanitizer unwraps on save - the indent would appear to work and then vanish
// when the task was reopened.
const EDITOR_INDENT_STEP = 20;

// The block the caret sits in, and how its indent is expressed.
function indentTargetAt(area, node) {
  if (!area || !node) return null;
  const el = node.nodeType === Node.ELEMENT_NODE ? node : node.parentElement;
  if (!el || !area.contains(el)) return null;
  const li = el.closest ? el.closest('li') : null;
  if (li && area.contains(li)) return { kind: 'bullet', line: li };
  let line = el;
  while (line && line.parentElement !== area && line !== area) line = line.parentElement;
  if (!line || line === area) return null;
  return { kind: 'block', line };
}

function blockIndent(line) {
  return parseInt((line && line.style && line.style.marginLeft) || '0') || 0;
}

// A bullet is outdentable when it sits inside a nested list, i.e. its list has
// a list ancestor still inside the editor.
function bulletIsNested(area, li) {
  const list = li && li.parentElement;
  if (!list) return false;
  const parent = list.parentElement;
  return !!(parent && area.contains(parent) && parent.closest &&
    parent.closest('ul, ol') && parent.closest('ul, ol') !== list);
}

// Text typed into an empty editor has no wrapping block - browsers leave it as
// bare text nodes until the first Enter. That is the FIRST line of most tasks,
// and indentTargetAt walks up to a direct child of the editor, so it found
// nothing there and the line simply could not be indented. Wrapping the run
// around the caret makes it an ordinary line. Mirrors the Box button, which
// had to solve exactly this for the same reason.
function wrapBareLineAt(area, node) {
  if (!area || !node) return null;
  let n = node;
  if (n === area) n = area.childNodes[0] || null;
  while (n && n.parentElement !== area) n = n.parentElement;
  if (!n) return null;
  const isBoundary = (x) => !x || (x.nodeType === Node.ELEMENT_NODE &&
    ['BR', 'DIV', 'P', 'UL', 'OL'].includes(x.tagName));
  if (isBoundary(n)) return null;
  let first = n, last = n;
  while (first.previousSibling && !isBoundary(first.previousSibling)) first = first.previousSibling;
  while (last.nextSibling && !isBoundary(last.nextSibling)) last = last.nextSibling;
  const wrapper = document.createElement('div');
  area.insertBefore(wrapper, first);
  let cur = first;
  while (cur) {
    const next = (cur === last) ? null : cur.nextSibling;
    wrapper.appendChild(cur);
    cur = next;
  }
  return wrapper;
}

// What indent/outdent should act on, wrapping a bare line first if that is
// what the caret is sitting in. Shared by the toolbar buttons and the Tab key
// so the two can never disagree about what a line is.
function resolveIndentTarget(area, node) {
  const found = indentTargetAt(area, node);
  if (found) return found;
  const wrapped = wrapBareLineAt(area, node);
  return wrapped ? { kind: 'block', line: wrapped } : null;
}

// Can the line at the caret be outdented right now?
function canOutdentAt(area, node) {
  const target = indentTargetAt(area, node);
  if (!target) return false;
  return target.kind === 'bullet'
    ? bulletIsNested(area, target.line)
    : blockIndent(target.line) > 0;
}

// Does the editor contain any indented content at all? The outdent button
// appears for either reason - the caret sitting on an indented line, or the
// document simply having indented content somewhere.
function hasAnyIndent(area) {
  if (!area) return false;
  const blocks = area.querySelectorAll('[style*="margin-left"]');
  for (const el of blocks) if (blockIndent(el) > 0) return true;
  return !!area.querySelector('ul ul, ul ol, ol ul, ol ol, li ul, li ol');
}

const UnlitFlame = () => (
  <svg version="1.0" xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 1280.000000 1280.000000"
    preserveAspectRatio="xMidYMid meet">
    <g transform="translate(0.000000,1280.000000) scale(0.100000,-0.100000)"
      fill="#000000" stroke="none">
      <path d="M7090 12669 c-1 -257 -76 -628 -175 -871 -149 -365 -354 -643 -825
      -1123 -562 -572 -1053 -1165 -1415 -1710 -256 -385 -443 -729 -568 -1045 -164
      -415 -213 -716 -189 -1167 7 -126 17 -257 22 -293 4 -36 11 -87 15 -115 3 -27
      17 -108 31 -180 66 -339 167 -634 321 -937 181 -358 383 -630 707 -954 206
      -206 336 -319 558 -486 130 -98 458 -322 462 -316 1 1 20 53 40 113 45 131
      132 315 211 452 58 99 233 361 296 443 231 303 515 606 864 926 411 375 725
      680 839 814 99 117 243 309 323 432 261 403 385 922 386 1623 0 207 -4 314
      -17 410 -76 586 -230 1136 -500 1782 -358 860 -885 1741 -1298 2168 l-87 90
      -1 -56z"/>
      <path d="M9510 9493 c0 -5 9 -55 21 -113 89 -462 132 -1021 110 -1453 -13
      -249 -39 -482 -67 -597 -109 -438 -605 -1140 -1299 -1835 -126 -127 -291 -284
      -365 -350 -160 -142 -223 -206 -374 -380 -276 -318 -452 -600 -476 -761 -5
      -38 -19 -133 -31 -211 -21 -141 -21 -189 2 -261 8 -25 15 -32 28 -26 73 31
      289 101 416 134 203 54 418 97 820 164 894 149 1116 222 1550 511 387 257 676
      553 814 833 98 197 195 572 233 892 19 165 16 597 -5 780 -104 913 -509 1833
      -1058 2404 -105 109 -294 276 -312 276 -4 0 -7 -3 -7 -7z"/>
      <path d="M3355 8046 c-199 -134 -336 -247 -523 -430 -189 -186 -290 -306 -418
      -498 -270 -403 -415 -856 -401 -1261 8 -258 75 -514 202 -772 237 -481 641
      -873 1170 -1135 358 -177 715 -283 1170 -349 153 -22 511 -54 546 -49 16 2
      -12 23 -107 82 -709 437 -1164 850 -1434 1303 -118 197 -228 493 -244 653 -4
      36 -11 92 -16 125 -5 33 -16 116 -25 185 -8 69 -20 163 -26 210 -6 47 -13 196
      -16 332 -5 240 4 411 38 673 5 44 12 98 15 120 3 22 9 65 14 95 5 30 12 73 16
      95 26 174 135 576 188 698 5 9 4 17 0 17 -5 0 -72 -43 -149 -94z"/>
    </g>
  </svg>
);

const LitFlame = () => (
  <svg version="1.0" xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 1280.000000 1280.000000"
    preserveAspectRatio="xMidYMid meet">
    <g transform="translate(0.000000,1280.000000) scale(0.100000,-0.100000)"
      fill="#FF4500" stroke="none">
      <path d="M7090 12669 c-1 -257 -76 -628 -175 -871 -149 -365 -354 -643 -825
      -1123 -562 -572 -1053 -1165 -1415 -1710 -256 -385 -443 -729 -568 -1045 -164
      -415 -213 -716 -189 -1167 7 -126 17 -257 22 -293 4 -36 11 -87 15 -115 3 -27
      17 -108 31 -180 66 -339 167 -634 321 -937 181 -358 383 -630 707 -954 206
      -206 336 -319 558 -486 130 -98 458 -322 462 -316 1 1 20 53 40 113 45 131
      132 315 211 452 58 99 233 361 296 443 231 303 515 606 864 926 411 375 725
      680 839 814 99 117 243 309 323 432 261 403 385 922 386 1623 0 207 -4 314
      -17 410 -76 586 -230 1136 -500 1782 -358 860 -885 1741 -1298 2168 l-87 90
      -1 -56z"/>
      <path d="M9510 9493 c0 -5 9 -55 21 -113 89 -462 132 -1021 110 -1453 -13
      -249 -39 -482 -67 -597 -109 -438 -605 -1140 -1299 -1835 -126 -127 -291 -284
      -365 -350 -160 -142 -223 -206 -374 -380 -276 -318 -452 -600 -476 -761 -5
      -38 -19 -133 -31 -211 -21 -141 -21 -189 2 -261 8 -25 15 -32 28 -26 73 31
      289 101 416 134 203 54 418 97 820 164 894 149 1116 222 1550 511 387 257 676
      553 814 833 98 197 195 572 233 892 19 165 16 597 -5 780 -104 913 -509 1833
      -1058 2404 -105 109 -294 276 -312 276 -4 0 -7 -3 -7 -7z"/>
      <path d="M3355 8046 c-199 -134 -336 -247 -523 -430 -189 -186 -290 -306 -418
      -498 -270 -403 -415 -856 -401 -1261 8 -258 75 -514 202 -772 237 -481 641
      -873 1170 -1135 358 -177 715 -283 1170 -349 153 -22 511 -54 546 -49 16 2
      -12 23 -107 82 -709 437 -1164 850 -1434 1303 -118 197 -228 493 -244 653 -4
      36 -11 92 -16 125 -5 33 -16 116 -25 185 -8 69 -20 163 -26 210 -6 47 -13 196
      -16 332 -5 240 4 411 38 673 5 44 12 98 15 120 3 22 9 65 14 95 5 30 12 73 16
      95 26 174 135 576 188 698 5 9 4 17 0 17 -5 0 -72 -43 -149 -94z"/>
    </g>
  </svg>
);

// Supplies Task with everything it needs from the app, so Task itself can live
// at module scope and keep one stable identity for the life of the page.
const TaskContext = React.createContext(null);

const Task = ({ task, listName, showMoveButtons }) => {
  // Everything Task needs from the app. Previously these were closure
  // variables, which is what forced Task to live inside LittleFiresApp - and
  // being redeclared there gave it a new function identity on every parent
  // render, so React treated it as a different component type and remounted
  // the entire task subtree. That remount is what discarded in-progress edits,
  // reset the undo stack, cancelled drags, and caused the tick flash.
  const {
    allLists,
    archiveTask,
    assignTaskToProject,
    canReorderTogether,
    collapseGuardRef,
    cycleAssignment,
    deleteTask,
    draggingTaskRef,
    editingTaskName,
    expandedTaskId,
    findTask,
    getAllProjects,
    isFeatureOn,
    isSharedList,
    moveTaskToSection,
    parseLocalDateTime,
    partnerDisplayName,
    renameTask,
    reorderTask,
    setEditingTaskName,
    setExpandedTaskId,
    settings,
    toggleTask,
    updateTaskDetails,
    updateTaskDueDate,
    updateTaskPriority
  } = React.useContext(TaskContext);

  // With a time set, overdue means past that moment. Without one, the task
  // isn't late until the day itself has ended.
  const dueDate = task.dueDate ? parseLocalDateTime(task.dueDate, task.dueTime) : null;
  // '00:00' is the implicit stamp for a plain due date, so treat it the same
  // as no time at all: the task isn't late until the day has ended.
  const isAllDay = !task.dueTime || task.dueTime === '00:00';
  const overdueThreshold = dueDate && isAllDay
    ? new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate(), 23, 59, 59, 999)
    : dueDate;
  const isOverdue = overdueThreshold && overdueThreshold < new Date() && !task.completed;
  const dueDateText = dueDate ? dueDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '';
  const createdDate = task.createdAt ? new Date(task.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '';
  const completedDate = task.completedAt ? new Date(task.completedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '';

  // --- Shared-task attribution (Partner sync groundwork) -----------------
  // Every task in the shared list gets this treatment automatically - there
  // is no per-task opt-in, because being in that list IS what makes a task
  // shared. Holds in All Tasks too, since the real listName is passed there.
  const isSharedTask = isSharedList(listName);
  // Tasks that predate sync carry no createdBy. They were all created on this
  // device, so they are yours - without this fallback they'd read as nobody's
  // and the delete button would vanish from tasks you created yourself.
  const sharedCreatedBy = task.createdBy || 'me';
  // `key` drives styling, `label` is what's shown - kept separate so the
  // displayed text can change without the CSS class following it. That split
  // is what lets the partner's name be user-set while .partner keeps styling
  // it. Falls back to 'Partner' if the field is blanked out.
  const partnerLabel = partnerDisplayName;
  const badgeFor = (who) => {
    if (who === 'me') return { key: 'you', label: 'You' };
    if (who === 'partner') return { key: 'partner', label: partnerLabel };
    return null;
  };
  // Incomplete: badge shows who it's assigned to (creator, if unassigned).
  // Complete: badge shows who actually did it - the point of a shared list.
  const sharedBadge = isSharedTask
    ? (task.completed
        ? badgeFor(task.completedBy || sharedCreatedBy)
        : badgeFor(task.assignedTo || sharedCreatedBy))
    : null;
  // Delete is restricted to creator or assignee for shared tasks; unassigned
  // shared tasks fall back to creator-only. Personal tasks are unaffected.
  const canDeleteShared = !isSharedTask || sharedCreatedBy === 'me' || task.assignedTo === 'me';

  const isExpanded = expandedTaskId === `${listName}-${task.id}`;
  const taskRef = React.useRef(null);

  // --- Swipe to complete (touch only) ---------------------------------
  // The card is moved by writing transform straight to the DOM rather than
  // through state. Two reasons: a state update per touchmove would re-render
  // the whole task tree sixty times a second, and because Task is declared
  // inside the parent, any re-render remounts it - which would drop the
  // gesture halfway through. Only the final decision touches React.
  const swipe = React.useRef({ x: 0, y: 0, dx: 0, axis: null, active: false });
  const SWIPE_TRIGGER = 90;

  const setSwipeVisual = (dx, animate) => {
    const el = taskRef.current;
    if (!el) return;
    el.style.transition = animate ? 'transform 0.2s ease' : 'none';
    el.style.transform = dx ? `translateX(${dx}px)` : '';
    // The reveal layer is a pseudo-element of the card, so it would slide
    // along with it and never be revealed. Publishing the offset lets the
    // CSS cancel it out, holding the check still while the card moves off it.
    el.style.setProperty('--swipe-dx', `${dx}px`);
    // Fades in as you approach the threshold, so the point of no return is
    // visible before you commit rather than a surprise on release.
    el.style.setProperty('--swipe-progress', String(Math.min(1, Math.abs(dx) / SWIPE_TRIGGER)));
  };

  const onTouchStart = (e) => {
    // Not while expanded: the details editor owns touch there, for selecting
    // text and ticking checkboxes.
    if (isExpanded || task.isArchived || e.touches.length !== 1) return;
    const t = e.touches[0];
    swipe.current = { x: t.clientX, y: t.clientY, dx: 0, axis: null, active: true };
  };

  const onTouchMove = (e) => {
    const g = swipe.current;
    if (!g.active) return;
    const t = e.touches[0];
    const dx = t.clientX - g.x;
    const dy = t.clientY - g.y;

    // Lock to one axis on the first decisive movement and never re-decide.
    // Without this a slightly diagonal scroll drags the card sideways, which
    // makes the whole list feel unstable.
    if (!g.axis) {
      if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return;
      g.axis = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y';
    }
    if (g.axis !== 'x') return;

    // Only rightward. Leftward is left alone deliberately - it's where a
    // delete gesture would live, and an accidental destructive swipe is a
    // much worse failure than a missed one.
    g.dx = Math.max(0, dx);
    setSwipeVisual(g.dx, false);
  };

  const onTouchEnd = () => {
    const g = swipe.current;
    if (!g.active) return;
    const passed = g.axis === 'x' && g.dx >= SWIPE_TRIGGER;
    g.active = false;
    if (passed && !task.completed) {
      // Clear the styles written during the gesture so React's own style prop
      // takes over cleanly. Direct DOM writes and React's transform were both
      // targeting the same property, and React won on the next render - which
      // is what replaced the slide-off with a shrink.
      const el = taskRef.current;
      if (el) {
        el.style.transition = '';
        el.style.transform = '';
        el.style.removeProperty('--swipe-dx');
        el.style.removeProperty('--swipe-progress');
      }
      setSwipedOut(true);
    } else {
      setSwipeVisual(0, true);
    }
    if (passed) {
      // Suppress the click that follows the touch, or the card would also
      // expand on the way past.
      swipe.current.justSwiped = true;
      setTimeout(() => { swipe.current.justSwiped = false; }, 400);
      // The same path the checkbox takes - so a swipe and a tick produce
      // exactly the same hold, fade and collapse rather than two different
      // ideas of what completing a task looks like.
      requestComplete();
    }
    g.dx = 0;
    g.axis = null;
  };
  const detailsRef = React.useRef(null);
  const hasSetInitialContent = React.useRef(false);
  const saveTimeoutRef = React.useRef(null);
  // Set while a drag-to-indent is finishing, so the click that follows it
  // doesn't also toggle the checkbox that was used as the handle.
  const indentSuppressRef = React.useRef(false);
  const clickTimeoutRef = React.useRef(null);
  // Holds the task in place briefly after checking it, so the checkmark is
  // visible before the task leaves the list.
  const [isCompleting, setIsCompleting] = React.useState(false);
  // Set when completion came from a swipe. The card then leaves by sliding
  // fully off to the right, uncovering the green panel, instead of shrinking
  // in place - two different exits fighting each other was what made it look
  // like the card was being sucked into the checkmark.
  const [swipedOut, setSwipedOut] = React.useState(false);

  // Whether bold+underline is active where the cursor is. Read from the
  // document rather than tracked as an intent, because formatting can also
  // change by moving the caret into or out of styled text - a flag set when
  // the button was pressed would go stale immediately and show "engaged"
  // when nothing is.
  const [formatOn, setFormatOn] = React.useState(false);
  // Whether the outdent button is showing. Driven by the editor's content and
  // the caret, not by a click, so it survives a collapse and re-expand: a task
  // saved with indented lines shows the button the moment it is reopened.
  const [showOutdent, setShowOutdent] = React.useState(false);

  // Recomputed on anything that can move the caret or change the content.
  // Passing the same boolean back is free - React bails out of the re-render
  // when the value is unchanged, which is the common case on every keystroke.
  const refreshOutdentVisibility = React.useCallback((area) => {
    if (!area) { setShowOutdent(false); return; }
    let atCaret = false;
    const sel = window.getSelection();
    if (sel && sel.rangeCount) {
      const node = sel.getRangeAt(0).startContainer;
      if (area.contains(node.nodeType === Node.ELEMENT_NODE ? node : node.parentElement)) {
        atCaret = canOutdentAt(area, node);
      }
    }
    const next = atCaret || hasAnyIndent(area);
    setShowOutdent(next);
    return next;
  }, []);

  // Suppresses the one synthetic click that follows a press whose target this
  // component removed. Self-clearing, so a press that turns out not to produce
  // that click can never swallow a later, genuine tap on the card.
  const guardTimerRef = React.useRef(null);
  const armCollapseGuard = React.useCallback(() => {
    collapseGuardRef.current = true;
    if (guardTimerRef.current) clearTimeout(guardTimerRef.current);
    guardTimerRef.current = setTimeout(() => {
      collapseGuardRef.current = false;
      guardTimerRef.current = null;
    }, 400);
  }, [collapseGuardRef]);
  const [projectDropdownOpen, setProjectDropdownOpen] = React.useState(false);

  // A native select closed itself on an outside tap; a div has to be told.
  // Without this the list stays open until something else re-renders, and
  // tapping elsewhere in the card leaves it hanging over the content.
  React.useEffect(() => {
    if (!projectDropdownOpen) return;
    const close = (e) => {
      if (taskRef.current && taskRef.current.contains(e.target)) {
        // Inside the card: the dropdown's own handlers stopPropagation, so
        // reaching here means the tap was somewhere else in the card.
        setProjectDropdownOpen(false);
        return;
      }
      setProjectDropdownOpen(false);
    };
    document.addEventListener('mousedown', close);
    document.addEventListener('touchstart', close);
    return () => {
      document.removeEventListener('mousedown', close);
      document.removeEventListener('touchstart', close);
    };
  }, [projectDropdownOpen]);

  React.useEffect(() => {
    if (!isExpanded) return;
    let raf = null;
    const check = () => {
      raf = null;
      try {
        const el = detailsRef.current;
        const sel = window.getSelection();
        if (!el || !sel || !sel.rangeCount || !el.contains(sel.anchorNode)) {
          setFormatOn(false);
          return;
        }
        setFormatOn(document.queryCommandState('bold') || document.queryCommandState('underline'));
      } catch (err) {
        setFormatOn(false);
      }
    };
    // selectionchange fires on every caret move, so the work is coalesced to
    // one check per frame. queryCommandState forces style resolution, which
    // is not something to run per keystroke.
    const onSel = () => { if (!raf) raf = requestAnimationFrame(check); };
    document.addEventListener('selectionchange', onSel);
    check();
    return () => {
      document.removeEventListener('selectionchange', onSel);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [isExpanded]);
  // Collapsing the row's height while it fades makes the tasks below slide up
  // instead of snapping. Height must animate from a real px value, not 'auto',
  // so we measure the row before starting.
  const [collapsing, setCollapsing] = React.useState(false);
  const [measuredHeight, setMeasuredHeight] = React.useState(null);
  const collapseTimeoutRef = React.useRef(null);
  const completeTimeoutRef = React.useRef(null);

  // Writes the captured HTML onto the clipboard itself, instead of leaving
  // the browser to serialise the raw selection.
  //
  // The browser's version omits the checkbox - it is a contentEditable=false
  // sibling that sits outside the selection range - so overriding it is what
  // makes an ordinary paste carry the box. The internal stash stays as the
  // fallback for platforms that won't hand back text/html on paste, and
  // because we now also set text/plain ourselves, the two are guaranteed to
  // match rather than differing by a stray newline.
  const writeClipboard = (e) => {
    const captured = stashSelectionHtml();
    if (!captured || !captured.html || !e.clipboardData) return null;
    try {
      e.preventDefault();
      e.clipboardData.setData('text/plain', captured.text);
      e.clipboardData.setData('text/html', captured.html);
      return captured;
    } catch (err) {
      // Blocked - let the browser write its own version rather than nothing.
      return null;
    }
  };

  // A field holding only a stray <br> is empty to a reader but not to
  // :empty, so emptiness is decided here and published as a class. Checkboxes
  // and images count as content even with no text alongside them.
  const syncPlaceholder = (area) => {
    if (!area) return;
    const hasText = (area.textContent || '').replace(/\u00A0/g, '').trim() !== '';
    const hasWidgets = !!area.querySelector('input, img, li');
    area.classList.toggle('is-empty', !hasText && !hasWidgets);
  };

  // Serialises whatever is selected, so a copy out of this editor keeps its
  // structure even when the clipboard will only carry plain text.
  const stashSelectionHtml = () => {
    try {
      const sel = window.getSelection();
      if (!sel || !sel.rangeCount || sel.isCollapsed) return;
      const range = sel.getRangeAt(0);
      const area = detailsRef.current;

      // The whole line, not just the text you dragged across.
      //
      // Selecting a checkbox line's text produces a range over the <span>
      // alone - the checkbox is a contentEditable="false" sibling that
      // browsers leave outside the selection, so cloning the range gave back
      // the words with no box. Expanding to the enclosing block is what
      // actually captures the structure.
      const blockOf = (node) => {
        const el = node.nodeType === Node.ELEMENT_NODE ? node : node.parentElement;
        if (!el || !el.closest || !area || !area.contains(el)) return null;
        return el.closest('.checkbox-line, li');
      };
      const startBlock = blockOf(range.startContainer);
      const endBlock = blockOf(range.endContainer);

      // Only expand when the selection is really about whole lines: either it
      // crosses more than one, or it covers all of the text in the one it's
      // in. Selecting a single word inside a line still copies just that word
      // rather than silently dragging a checkbox along with it.
      const selected = sel.toString().replace(/\u00A0/g, ' ').trim();
      const wholeLine = startBlock &&
        selected === (startBlock.textContent || '').replace(/\u00A0/g, ' ').trim();
      const spansBlocks = startBlock && endBlock && startBlock !== endBlock;

      let cloneRange = range;
      if (startBlock && (wholeLine || spansBlocks)) {
        cloneRange = document.createRange();
        cloneRange.setStartBefore(startBlock);
        cloneRange.setEndAfter(endBlock || startBlock);
      }

      const holder = document.createElement('div');
      holder.appendChild(cloneRange.cloneContents());
      internalClipboard = { text: sel.toString(), html: holder.innerHTML };
      // The range is handed back so a cut can remove exactly what was taken.
      // It isn't always the user's literal selection - selecting a checkbox
      // line's text captures the whole line, box included - so deleting the
      // raw selection instead would leave an orphaned empty checkbox behind.
      return { ...internalClipboard, range: cloneRange };
    } catch (err) {
      internalClipboard = { text: '', html: '' };
      return null;
    }
  };

  // The one way a task gets completed, whichever gesture asked for it.
  // Completing pauses: the tick stays lit while the card fades, then the card
  // collapses its own height so everything below slides up into the gap
  // rather than jumping. Un-completing is immediate - there's nothing to
  // celebrate and no reason to make it wait.
  const requestComplete = () => {
    if (task.isArchived) return;
    if (task.completed) {
      toggleTask(listName, task.id);
      return;
    }
    if (isCompleting) return; // already on its way out
    if (!settings.completionDelay) {
      toggleTask(listName, task.id);
      return;
    }
    // Measured before anything changes, because once the card starts fading
    // its height is no longer the height the collapse needs to animate from.
    if (taskRef.current) setMeasuredHeight(taskRef.current.offsetHeight);
    setIsCompleting(true);
    collapseTimeoutRef.current = setTimeout(() => setCollapsing(true), COMPLETE_HOLD_MS);
    completeTimeoutRef.current = setTimeout(() => {
      toggleTask(listName, task.id);
    }, COMPLETE_TOTAL_MS);
  };

  // True while a native picker (date/select) is open. iOS presents these as a
  // sheet and moves focus off the input, so focus can't be used to detect it.
  const pickerActiveRef = React.useRef(false);
  const pickerResetRef = React.useRef(null);
  // What we last wrote to storage ourselves. The load effect below compares
  // against this so it can tell its own echo from a genuine outside change -
  // without that, saving while the task is open re-runs the effect and
  // re-writes innerHTML, which throws away the container's scroll position.
  const lastSavedHtmlRef = React.useRef(null);

  // The single path from live editor DOM to saved value. A checkbox's ticked
  // state lives on the DOM property, not in the markup, so it has to be
  // written back to attributes before innerHTML will include it - that's why
  // every save site did this dance. Now they all call this instead.
  const saveDetails = (el, { force = false } = {}) => {
    const area = el || detailsRef.current;
    if (!area) return;
    area.querySelectorAll('.task-checkbox').forEach(cb => {
      if (cb.checked) cb.setAttribute('checked', 'checked');
      else cb.removeAttribute('checked');
    });
    const content = area.innerHTML;
    // Sanitize FIRST, then compare. task.details is always the sanitized
    // form, while area.innerHTML is the live DOM - and the editor's own
    // builders write things the sanitizer strips (inline style, the span's
    // contenteditable). Comparing raw DOM against sanitized storage could
    // therefore never match, so this fired a save on every blur and every
    // tick whether anything had changed or not - and each of those saves
    // re-rendered, remounted the subtree and reloaded the editor. Comparing
    // like with like makes "unchanged" actually mean unchanged.
    const cleaned = sanitizeRichText(content);
    if (!force && cleaned === task.details) {
      // Nothing to write - but the DOM demonstrably matches storage right
      // now, so refresh the baseline the load guard's unsaved-changes test
      // compares against. Without this a reverted edit could leave the
      // baseline pointing at an older save and misread a clean editor as
      // dirty.
      lastSavedHtmlRef.current = cleaned;
      return null;
    }
    lastSavedHtmlRef.current = cleaned;
    updateTaskDetails(listName, task.id, content);
    // The sanitized value that is now on its way to storage. The hide-time
    // save journals exactly this, so the crash journal and the stored task
    // can never disagree about what the save contained.
    return cleaned;
  };

  React.useEffect(() => {
    return () => {
      if (completeTimeoutRef.current) clearTimeout(completeTimeoutRef.current);
      if (collapseTimeoutRef.current) clearTimeout(collapseTimeoutRef.current);
      if (pickerResetRef.current) clearTimeout(pickerResetRef.current);
    };
  }, []);

  // Sync parent checkboxes based on their indented children.
  // A parent is a line whose immediately-following lines are more indented.
  // Its direct children are the more-indented lines up until the indent
  // returns to the parent's level or shallower. This does NOT assume a fixed
  // 20px step - it works with any indent values.
  // Recompute list markers across the editor: which lines are parents
  // (have indented children below them) and which top-level lines end a
  // nested group. Runs on every content change so markers never go stale.
  const refreshListMarkers = (area) => {
    try {
      if (!area) return;
      const lines = Array.from(area.querySelectorAll('.checkbox-line'));
      const getIndent = (l) => parseInt(l.style.marginLeft || '0') || 0;
      // Clear existing markers first (both class and inline styles)
      lines.forEach(l => {
        l.classList.remove('has-children');
        l.classList.remove('ends-list');
        l.style.borderBottom = '';
        l.style.borderTop = '';
        // Only clear the spacing we control for markers
        if (l.style.paddingBottom === '6px') l.style.paddingBottom = '';
        if (l.style.paddingTop === '8px') l.style.paddingTop = '';
      });
      for (let i = 0; i < lines.length; i++) {
        const indent = getIndent(lines[i]);
        const nextIndent = i + 1 < lines.length ? getIndent(lines[i + 1]) : -1;
        const prevIndent = i > 0 ? getIndent(lines[i - 1]) : -1;
        // Parent: a line immediately followed by a more-indented line, with text
        if (nextIndent > indent) {
          const txt = (lines[i].textContent || '').replace(/\u00A0/g, '').trim();
          if (txt) {
            // Class only. These used to also set fontWeight, borderBottom and
            // paddingBottom inline, with a comment claiming that was what made
            // the styling survive a save - but the sanitizer strips the style
            // attribute, so those three lines never once did anything. The
            // .has-children CSS is what actually renders it.
            lines[i].classList.add('has-children');
          }
        } else {
          // Not a parent anymore - remove any leftover bold from inline styles
          lines[i].style.fontWeight = '';
          const sp = lines[i].querySelector('span');
          if (sp) sp.style.fontWeight = '';
        }
        // End-of-list boundary: a top-level line that comes right after a
        // more-indented (child) line - i.e. indentation stepped back to 0.
        if (indent === 0 && prevIndent > 0) {
          lines[i].classList.add('ends-list');
          lines[i].style.borderTop = '2px solid rgba(var(--accent-rgb), 0.55)';
          lines[i].style.paddingTop = '8px';
        }
      }
    } catch (err) {
      console.error('refreshListMarkers error:', err);
    }
  };

  const syncParentCheckboxes = (detailsArea) => {
    try {
      if (!detailsArea) return;
      const lines = Array.from(detailsArea.querySelectorAll('.checkbox-line'));
      if (lines.length < 2) return;
      
      const getIndent = (line) => parseInt(line.style.marginLeft || '0') || 0;
      const items = lines.map((line) => ({
        line,
        indent: getIndent(line),
        checkbox: line.querySelector('.task-checkbox')
      }));
      
      // Determine, for each item, the set of DIRECT children.
      // Direct children = the immediately-following run of lines that are
      // more indented, where a "direct" child is at the shallowest indent
      // within that run (deeper ones are grandchildren).
      // Process parents from those deepest in the tree upward so nested
      // chains resolve. We do multiple passes until stable.
      let changed = true;
      let guard = 0;
      while (changed && guard < 20) {
        changed = false;
        guard++;
        for (let i = 0; i < items.length; i++) {
          const parent = items[i];
          if (!parent.checkbox) continue;
          
          // Gather the run of following lines more indented than this one
          const run = [];
          for (let j = i + 1; j < items.length; j++) {
            if (items[j].indent <= parent.indent) break;
            run.push(items[j]);
          }
          if (run.length === 0) continue;
          
          // Direct children = lines in the run at the minimum indent of the run
          const minChildIndent = Math.min(...run.map(r => r.indent));
          const directChildren = run.filter(r => r.indent === minChildIndent && r.checkbox);
          if (directChildren.length === 0) continue;
          
          const allChecked = directChildren.every(r => r.checkbox.checked);
          if (parent.checkbox.checked !== allChecked) {
            parent.checkbox.checked = allChecked;
            changed = true;
          }
          if (allChecked) {
            parent.checkbox.setAttribute('checked', 'checked');
          } else {
            parent.checkbox.removeAttribute('checked');
          }
        }
      }
      
      // Persist all checkbox states as attributes for save/reload
      items.forEach(it => {
        if (!it.checkbox) return;
        if (it.checkbox.checked) {
          it.checkbox.setAttribute('checked', 'checked');
        } else {
          it.checkbox.removeAttribute('checked');
        }
      });
    } catch (err) {
      console.error('syncParentCheckboxes error:', err);
    }
  };

  // Set initial content only when task first expands.
  //
  // Deliberately useEffect, NOT useLayoutEffect. Switching it to a layout
  // effect to hide the remount flash crashed the app: this effect's cleanup
  // saves, and a layout effect runs synchronously, so save -> task.details
  // changes -> effect re-runs -> cleanup saves again, with no paint in
  // between to break the cycle. React kills it as a runaway update.
  React.useEffect(() => {
    // Captured here, while the element is still mounted. React sets refs to
    // null during unmount, and passive effect cleanups run AFTER that - so a
    // cleanup reading detailsRef.current on collapse found null and saved
    // nothing. Everything typed since the last blur was lost, and only on the
    // collapse path, which is why clicking away without collapsing worked.
    // A detached node still holds its innerHTML, so this stays readable.
    const area = detailsRef.current;

    if (isExpanded && area) {
      // Only set content once when first expanded
      if (!hasSetInitialContent.current) {
        // The guard is DOM truth, not ref bookkeeping.
        //
        // lastSavedHtmlRef tracks what we last wrote to storage, and the skip
        // used to require it to match as well. That condition was vestigial:
        // whenever the DOM already serializes to exactly the incoming value, a
        // rewrite is a no-op that only costs the caret and scroll position -
        // regardless of who wrote the value. (The DOM check itself is load-
        // bearing and stays: after collapse and re-expand the editor is a
        // brand new EMPTY div, and skipping the load then is what once left
        // it blank and saved that blank over the real content.)
        const domNow = sanitizeRichText(area.innerHTML || '');
        const incoming = sanitizeRichText(task.details || '');
        if (domNow === incoming) {
          // The DOM already shows exactly this - nothing to change.
          hasSetInitialContent.current = true;
          lastSavedHtmlRef.current = incoming;
        } else if (
          // Defer, don't clobber: a rewrite here while the user is typing
          // destroys the caret and everything since the last save. Applies
          // only when the editor is focused AND holds unsaved local changes
          // (the DOM has moved past the last load/save baseline). Both
          // conditions matter - a focused-but-untouched editor must take the
          // rewrite, or its next blur would save stale content over the newer
          // incoming value.
          //
          // Nothing external writes task.details while expanded today; this
          // is the rule Session 4's snapshot listener relies on. The deferred
          // value is not lost: the user's next save (blur, tick, collapse)
          // writes the local DOM with a fresh updatedAt, and last-write-wins
          // then resolves in favour of the person actively editing - which is
          // the newest edit in fact, not just in bookkeeping.
          lastSavedHtmlRef.current !== null &&
          domNow !== lastSavedHtmlRef.current &&
          area.contains(document.activeElement)
        ) {
          hasSetInitialContent.current = true;
        } else {
          // Sanitized here too, not just on write. A task's details can arrive
          // from a restored backup - and later from a partner's device - so the
          // stored value can't be assumed to have gone through this app's own
          // editor. This assignment is into a live element, so anything unsafe
          // would execute immediately.
          area.innerHTML = incoming;
          // Baseline for the unsaved-changes test above: from this moment the
          // DOM matches storage, so any later divergence is a local edit.
          lastSavedHtmlRef.current = incoming;
          hasSetInitialContent.current = true;
          // After loading, reflect any already-complete child sets on their parents
          setTimeout(() => syncParentCheckboxes(area), 0);
          setTimeout(() => refreshListMarkers(area), 0);
          syncPlaceholder(area);
          // A task saved with indented lines shows the outdent button as soon
          // as it is reopened, without waiting for the caret to move.
          refreshOutdentVisibility(area);
        }
      }
    }
    
    // Cleanup: save details when the task is about to collapse.
    //
    // Gated only on the node existing. It used to also require isExpanded and
    // hasSetInitialContent, and those could only ever *prevent* a save - never
    // enable one. That was survivable while Task remounted on every parent
    // render, because the constant unmount/remount cycle was saving the editor
    // by accident many times a second. With Task hoisted it no longer remounts,
    // so this cleanup became the only reliable save on collapse and the extra
    // conditions turned into a way to lose work.
    //
    // `area` is non-null only while the editor is mounted, and saveDetails
    // no-ops when nothing changed, so an unnecessary call costs nothing.
    return () => {
      if (area) saveDetails(area);
      hasSetInitialContent.current = false;
    };
  }, [isExpanded, listName, task.id, task.details]);

  React.useEffect(() => {
    if (!isExpanded) return;

    const handleClickOutside = (e) => {
      if (!taskRef.current) return;

      // A native picker is open. Its sheet/overlay lives outside this DOM
      // subtree, so any interaction with it reads as an outside click and
      // would collapse the task - destroying the input the picker belongs to.
      if (pickerActiveRef.current) return;

      // Fallback for desktop, where focus does stay on the input.
      const active = document.activeElement;
      if (active && taskRef.current.contains(active)) {
        const tag = active.tagName;
        const type = (active.getAttribute && active.getAttribute('type')) || '';
        if (tag === 'SELECT' || tag === 'INPUT' && ['date', 'time', 'month', 'week'].includes(type)) {
          return;
        }
      }

      // The target was removed from the document before this listener ran -
      // a conditionally rendered control that unmounted on its own press. It
      // was inside the task when it was pressed, so it is not an outside tap,
      // but contains() on a detached node says otherwise.
      if (e.target && e.target.isConnected === false) return;

      if (!taskRef.current.contains(e.target)) {
        // Save details before collapsing when clicking outside. Through
        // saveDetails, which mirrors checked state and no-ops when nothing
        // changed - the unconditional updateTaskDetails this replaces stamped
        // updatedAt on every open-and-close, and under last-write-wins sync a
        // task you merely looked at must never beat a real edit from the
        // other device. The cleanup save on collapse is the backstop.
        saveDetails(taskRef.current.querySelector('.details-richtext'));
        setExpandedTaskId(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    // touchend as well. On a phone the collapse is driven by touchend, and the
    // emulated mousedown only arrives afterwards - by which point the editor
    // has already been unmounted and there is nothing left to read.
    document.addEventListener('touchend', handleClickOutside);
    
    // Attach onChange handlers to existing checkboxes
    const detailsArea = taskRef.current?.querySelector('.details-richtext');
    
    // Delegated listener - use BOTH click and change for reliability inside
    // contentEditable (change doesn't always fire for checkboxes there).
    // After a click, the checked state is updated synchronously, but we defer
    // with a microtask/timeout to be safe, then sync parents.
    const runSync = () => {
      syncParentCheckboxes(detailsArea);
    };
    const handleDelegatedClick = (evt) => {
      // Open pasted links in a new tab. Inside contentEditable a click would
      // otherwise just place the cursor instead of following the link.
      const link = evt.target && evt.target.closest && evt.target.closest('a.task-link');
      if (link) {
        evt.preventDefault();
        const href = link.getAttribute('href');
        if (href) window.open(href, '_blank', 'noopener,noreferrer');
        return;
      }
      if (evt.target && evt.target.classList && evt.target.classList.contains('task-checkbox')) {
        if (indentSuppressRef.current) {
          // The box was a drag handle, not a target. Undo the toggle the
          // browser already applied before this handler saw the event.
          evt.target.checked = !evt.target.checked;
          return;
        }
        // Ticking a box is a complete action on its own. Handled here rather
        // than per-checkbox so boxes created later in the session behave
        // identically - a per-element handler only ever reached the ones
        // present at load.
        //
        // No blur any more: focus was already prevented from entering the
        // editor at mousedown, so there is nothing to take back. Blurring
        // here as well was actively harmful - if you were mid-sentence
        // elsewhere in the notes and ticked a box, it threw your cursor away.
        // Deferred a tick so the browser has finished toggling `checked`.
        setTimeout(() => {
          runSync();
          saveDetails(detailsArea);
        }, 0);
      }
    };
    const handleDelegatedChange = (evt) => {
      if (evt.target && evt.target.classList && evt.target.classList.contains('task-checkbox')) {
        runSync();
      }
    };
    // Declared in the effect's own scope, not inside the `if` below.
    // These are referenced by the cleanup, which lives outside that block -
    // declaring them inside it meant every cleanup threw a ReferenceError,
    // so collapsing, rotating, or anything that re-ran the effect crashed.
    // --- Indent by dragging a checkbox sideways ------------------------
    // iOS has no Tab key, so the keyboard route to nesting doesn't exist on
    // a phone. This uses the gesture that's free here: swipe-to-complete is
    // disabled while a task is expanded, so horizontal drags inside the
    // editor are unclaimed.
    //
    // The drag must START on the checkbox. That element is
    // contentEditable="false", so dragging from it can't begin a text
    // selection - starting anywhere in the text would fight iOS's own
    // selection handles.
    const indentDrag = { x: 0, y: 0, line: null, moved: false, axis: null, kind: null };
    const INDENT_STEP = 20;
    const INDENT_TRIGGER = 22;

    const MARKER_ZONE = 30;

    const onIndentStart = (evt) => {
      indentDrag.line = null;
      if (evt.touches.length !== 1) return;
      const t = evt.touches[0];
      const el = evt.target;
      if (!el || !el.closest) return;

      const box = el.closest('.task-checkbox');
      const checkboxLine = box && box.closest('.checkbox-line');
      if (checkboxLine) {
        indentDrag.kind = 'checkbox';
        indentDrag.line = checkboxLine;
      } else {
        // A bullet has no element to grab - its marker is a ::marker pseudo,
        // which can't receive touches. The space the marker occupies works
        // instead: a drag starting in the line's left inset is the handle,
        // and starting there also keeps the gesture out of the text, where
        // it would fight iOS's selection handles exactly as it would on a
        // checkbox line.
        const li = el.closest('li');
        if (!li || !detailsArea.contains(li)) return;
        const rect = li.getBoundingClientRect();
        if (t.clientX - rect.left > MARKER_ZONE) return;
        indentDrag.kind = 'bullet';
        indentDrag.line = li;
      }

      indentDrag.x = t.clientX;
      indentDrag.y = t.clientY;
      indentDrag.moved = false;
      indentDrag.axis = null;
    };

    const onIndentMove = (evt) => {
      if (!indentDrag.line) return;
      const t = evt.touches[0];
      const dx = t.clientX - indentDrag.x;
      const dy = t.clientY - indentDrag.y;

      // Decide the axis once, on the first real movement, and hold it.
      // Re-deciding every frame is what made this feel unreliable: a drag
      // that wandered a few pixels vertically mid-gesture would abandon
      // itself halfway through.
      if (indentDrag.axis === null) {
        if (Math.abs(dx) < 6 && Math.abs(dy) < 6) return;
        indentDrag.axis = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y';
      }
      if (indentDrag.axis === 'y') { indentDrag.line = null; return; }

      // Claimed from here on, every frame - not only when a step is crossed.
      // Previously the page was free to pan during the 28px before the first
      // step, which is the drift you could feel before anything happened.
      evt.preventDefault();

      if (Math.abs(dx) < INDENT_TRIGGER) return;

      if (indentDrag.kind === 'bullet') {
        // Nesting, not a margin: a bullet's depth is structural, and faking
        // it with an indent would leave the markers all at the same level.
        // execCommand needs the caret inside the item it is to act on.
        const sel = window.getSelection();
        const r = document.createRange();
        r.selectNodeContents(indentDrag.line);
        r.collapse(true);
        sel.removeAllRanges();
        sel.addRange(r);
        document.execCommand(dx > 0 ? 'indent' : 'outdent', false, null);
        indentDrag.moved = true;
      } else {
        const current = parseInt(indentDrag.line.style.marginLeft || '0') || 0;
        const next = dx > 0
          ? current + INDENT_STEP
          : Math.max(0, current - INDENT_STEP);
        if (next !== current) {
          indentDrag.line.style.marginLeft = next + 'px';
          refreshListMarkers(detailsArea);
        }
      }
      // Re-anchor rather than end the gesture, so one continuous drag can
      // step through several levels the way repeated Tabs would.
      indentDrag.x = t.clientX;
      indentDrag.moved = true;
      evt.preventDefault();
    };

    const onIndentEnd = () => {
      if (indentDrag.moved) {
        // The tap that ends this drag would otherwise tick the box - the
        // one thing the user certainly didn't mean by dragging it.
        indentSuppressRef.current = true;
        setTimeout(() => { indentSuppressRef.current = false; }, 400);
        saveDetails(detailsArea);
      }
      indentDrag.line = null;
      indentDrag.moved = false;
      indentDrag.axis = null;
      indentDrag.kind = null;
    };

    // Focus moves on mousedown, not on click - so this is the only moment
    // where it can be stopped from happening at all. Preventing the default
    // here keeps the caret and the keyboard out of the editor entirely when
    // you tap a checkbox; blurring afterwards, as it did before, meant the
    // keyboard could still flash open and closed on the way through.
    //
    // The toggle is unaffected: a checkbox flips on click, which is a
    // separate default action from the focus that happens on mousedown.
    // On iOS the emulated mousedown fires after touchend, so this covers
    // touch as well without needing a non-passive touch listener.
    const onCheckboxMouseDown = (evt) => {
      const t = evt.target;
      if (!t || !t.closest) return;

      // Tapping the empty space below the content is the way in to typing.
      // The target being the editor itself - rather than any line inside it -
      // is exactly what "below everything" means.
      //
      // The caret is moved to the very end rather than left where the browser
      // put it. Clicking blank space below a checklist otherwise drops the
      // cursor at whatever position happens to be nearest, which can be the
      // middle of an earlier line - so the gesture has to be explicit about
      // meaning "carry on from the end".
      if (t === detailsArea) {
        // Where the tap landed vertically, captured before the deferred work -
        // the event object is not safe to read from a timeout.
        const tapY = evt.clientY;
        // The horizontal position matters as much as the vertical one. A line
        // with no block wrapper - the first line of a task, until the first
        // Enter - is a direct child of the editor, so clicks on its own text
        // arrive here with the editor as the target, exactly like a click in
        // the margin beside it. Without X, the two are indistinguishable and
        // every click on the first line was read as "carry on from the end",
        // which made it impossible to put the caret at the start of it.
        const tapX = evt.clientX;
        setTimeout(() => {
          try {
            // Tapping to the right of a line also lands on detailsArea when that
            // line has no block wrapper - which is exactly what freshly typed
            // text is, until the first Enter. Without this the tap was read as
            // "below everything" and the caret was sent to the bottom of the
            // editor, past any checkboxes underneath.
            let alongside = null;
            let alongsideRect = null;
            detailsArea.childNodes.forEach(node => {
              let rect = null;
              if (node.nodeType === Node.ELEMENT_NODE) {
                rect = node.getBoundingClientRect();
              } else if (node.nodeType === Node.TEXT_NODE && (node.textContent || '').trim()) {
                const rr = document.createRange();
                rr.selectNodeContents(node);
                rect = rr.getBoundingClientRect();
              }
              if (rect && rect.height && tapY >= rect.top && tapY <= rect.bottom) {
                alongside = node;
                alongsideRect = rect;
              }
            });

            if (alongside && alongsideRect) {
              // The tap was on the line's own text, not in the margin beside
              // it. The browser has already placed the caret where the user
              // aimed - anywhere in the line, including its very start - so
              // the only correct thing to do is leave it alone.
              if (tapX >= alongsideRect.left && tapX <= alongsideRect.right) return;

              // To the LEFT of the text: that is a request for the start of
              // the line, not the end of it.
              if (tapX < alongsideRect.left) {
                const rr = document.createRange();
                const startHost = alongside.nodeType === Node.ELEMENT_NODE
                  ? (alongside.querySelector('span') || alongside)
                  : alongside;
                rr.selectNodeContents(startHost);
                rr.collapse(true);
                const selStart = window.getSelection();
                selStart.removeAllRanges();
                selStart.addRange(rr);
                return;
              }

              // Same treatment as the end of a checkbox line: sit one space
              // clear of the last word, ready to keep writing.
              const host = alongside.nodeType === Node.ELEMENT_NODE
                ? (alongside.querySelector('span') || alongside)
                : alongside.parentNode;
              const existing = (alongside.textContent || '');
              if (existing && !/[\s\u00A0]$/.test(existing)) {
                if (alongside.nodeType === Node.TEXT_NODE) alongside.textContent = existing + ' ';
                else host.appendChild(document.createTextNode(' '));
              }
              const rr = document.createRange();
              rr.selectNodeContents(alongside.nodeType === Node.TEXT_NODE ? alongside : host);
              rr.collapse(false);
              const sel2 = window.getSelection();
              sel2.removeAllRanges();
              sel2.addRange(rr);
              return;
            }

            const last = detailsArea.lastElementChild;
            const isStructured = last && (
              (last.classList && last.classList.contains('checkbox-line')) ||
              last.tagName === 'UL' || last.tagName === 'OL'
            );
            const isBlankLine = last && last.tagName === 'DIV' &&
              !isStructured &&
              (last.textContent || '').replace(/\u00A0/g, '').trim() === '';

            // Collapsing to the end of the content would land the caret
            // inside the last checkbox line, so typing continued that item
            // instead of starting something new. A fresh plain line below the
            // structure is what "carry on underneath" actually means.
            let target = null;
            if (isBlankLine) {
              // One already exists from a previous tap - reuse it rather than
              // stacking up empty lines every time the space is touched.
              target = last;
            } else if (isStructured) {
              target = document.createElement('div');
              target.innerHTML = '<br>';
              detailsArea.appendChild(target);
            }

            const r = document.createRange();
            if (target) {
              r.setStart(target, 0);
              r.collapse(true);
            } else {
              r.selectNodeContents(detailsArea);
              r.collapse(false);
            }
            const sel = window.getSelection();
            sel.removeAllRanges();
            sel.addRange(r);
          } catch (err) {
            // Focus still landed; only the caret position is a nicety.
          }
        }, 0);
        return;
      }

      // The checkbox itself never focuses anything.
      if (t.closest('.task-checkbox')) { evt.preventDefault(); return; }

      // Touch only, from here down. The restriction exists because a finger
      // aiming for a checkbox often lands on the words beside it, and every
      // miss used to open the keyboard and shift the layout mid-tap. A mouse
      // doesn't miss, so on desktop clicking the text means exactly what it
      // says and should place a cursor.
      if (!IS_TOUCH_DEVICE) return;

      const line = t.closest('.checkbox-line');
      if (!line) return;   // plain text, or the empty space below - editable

      // The deliberate way in on touch: tap at or past the end of the line's
      // text. That is an unambiguous "put the cursor here" and it can't be hit
      // by aiming for the box. Clicking below the content works the same way,
      // since that isn't inside a checkbox line at all.
      const label = line.querySelector('span') || line;
      const rect = label.getBoundingClientRect();

      // A margin before the end of the text still counts as "the end of the
      // line". The target used to be the exact pixel edge of the last glyph,
      // which is far finer than a fingertip - so carrying on writing a line you
      // had already started was close to impossible.
      const END_ZONE = 24;
      if (evt.clientX <= rect.right - END_ZONE) {
        evt.preventDefault();
        return;
      }

      // Place the caret after the last word rather than leaving it to the
      // browser. A tap in the blank space right of the text has no character
      // under it, so the browser's guess is often the start of the line or the
      // far side of the checkbox.
      setTimeout(() => {
        try {
          // Separate the caret from the last word, so continuing a line doesn't
          // start by typing a space. A plain space rather than \u00A0 because
          // the editor is white-space: pre-wrap, which preserves it and still
          // allows the line to wrap there - a non-breaking space would render
          // the same but quietly stop wrapping mid-sentence.
          const existing = label.textContent || '';
          if (existing && !/[\s\u00A0]$/.test(existing)) {
            label.appendChild(document.createTextNode(' '));
          }
          const r = document.createRange();
          r.selectNodeContents(label);
          r.collapse(false);
          const sel = window.getSelection();
          sel.removeAllRanges();
          sel.addRange(r);
        } catch (err) {
          // Focus still landed; only the caret position is a nicety.
        }
      }, 0);
    };

    if (detailsArea) {
      detailsArea.addEventListener('mousedown', onCheckboxMouseDown);
      detailsArea.addEventListener('touchstart', onIndentStart, { passive: true });
      detailsArea.addEventListener('touchmove', onIndentMove, { passive: false });
      detailsArea.addEventListener('touchend', onIndentEnd);
      detailsArea.addEventListener('touchcancel', onIndentEnd);

      detailsArea.addEventListener('change', handleDelegatedChange);
      detailsArea.addEventListener('click', handleDelegatedClick);
      
      const checkboxes = detailsArea.querySelectorAll('.task-checkbox');
      checkboxes.forEach(checkbox => {
        // Clicking is handled by the delegated listener above, not here.
        // What this does need is to make the box a non-editable island: the
        // caret could otherwise be placed to its left - inside the line but
        // before the box - where typing put text ahead of the checkbox.
        // Set on the live DOM rather than in the markup because the sanitizer
        // strips contenteditable, and it doesn't need to persist since this
        // runs on every load.
        checkbox.contentEditable = 'false';
        checkbox.onclick = null;
        checkbox.onchange = null;
      });

      // Links get the same treatment. The paste handler marks them
      // non-editable so the "Link" label can't be typed into, but the
      // sanitizer strips contenteditable - so it has to be reapplied
      // whenever stored content is loaded back in.
      detailsArea.querySelectorAll('a.task-link').forEach(a => {
        a.contentEditable = 'false';
      });
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchend', handleClickOutside);
      if (detailsArea) {
        detailsArea.removeEventListener('change', handleDelegatedChange);
        detailsArea.removeEventListener('click', handleDelegatedClick);
        detailsArea.removeEventListener('mousedown', onCheckboxMouseDown);
        detailsArea.removeEventListener('touchstart', onIndentStart);
        detailsArea.removeEventListener('touchmove', onIndentMove);
        detailsArea.removeEventListener('touchend', onIndentEnd);
        detailsArea.removeEventListener('touchcancel', onIndentEnd);
      }
    };
    // task.details is in the deps for correctness, not convenience. The
    // handlers above (outside-click save, the delegated tick save) close over
    // saveDetails, whose "did anything change" comparison closes over
    // task.details. Without this dep those handlers keep the snapshot from
    // when the effect last ran, and after any save while expanded the stale
    // comparison fails both ways: content that hadn't changed looked changed
    // (a redundant save, stamping updatedAt - the exact write a sync merge
    // must not see), and content reverted to the stale snapshot looked
    // unchanged (a skipped save, rescued only by the collapse backstop).
    // Re-running on each save re-registers the listeners and resets the
    // indent-drag accumulator; every save happens between gestures, so
    // there is nothing in flight to lose. A side benefit: the
    // contentEditable re-arm above now also re-runs if details are ever
    // rewritten externally while expanded.
  }, [isExpanded, listName, task.id, task.details]);

  // Save the open editor the moment the app is hidden or torn down. Saves
  // otherwise happen on blur, cut, indent-end and collapse - but iOS does not
  // reliably blur the focused element when a home-screen app is backgrounded,
  // and a backgrounded PWA can be killed before the user ever returns. The
  // dispatch below feeds the normal save path for the case where the app
  // survives; the journal write is the synchronous copy for the case where it
  // does not (see EDITOR_DRAFT_KEY). saveDetails no-ops on unchanged content,
  // so the common case costs one sanitize and a string compare.
  //
  // task.details is deliberately in the deps: the handler's comparison inside
  // saveDetails closes over it, and a stale closure would re-save (and
  // re-stamp) content that had not actually changed.
  React.useEffect(() => {
    if (!isExpanded) return;
    const saveOnHide = () => {
      const cleaned = saveDetails(detailsRef.current);
      if (typeof cleaned === 'string') {
        writeEditorDraft(listName, task.id, cleaned);
      } else {
        // Nothing new to save, so any draft still sitting in storage is by
        // definition stale. Clearing it keeps the journal from ever holding
        // something older than the state it would be applied to.
        clearEditorDraft();
      }
    };
    const onVisibility = () => { if (document.hidden) saveOnHide(); };
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('pagehide', saveOnHide);
    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('pagehide', saveOnHide);
    };
  }, [isExpanded, listName, task.id, task.details]);

  return (
    <div 
      ref={taskRef}
      className={`task ${task.completed ? 'completed' : ''} ${isExpanded ? 'expanded' : ''} ${collapsing ? 'collapsing' : ''} ${task.isArchived ? 'archived-task-readonly' : ''}`}
      // Not while expanded: the details editor needs normal text selection,
      // and a draggable ancestor breaks it.
      draggable={!isExpanded && !task.isArchived && !isCompleting}
      onDragStart={(e) => {
        draggingTaskRef.current = { id: task.id, listName };
        e.dataTransfer.effectAllowed = 'move';
        // Firefox refuses to start a drag without data set.
        try { e.dataTransfer.setData('text/plain', String(task.id)); } catch (err) {}
        if (taskRef.current) taskRef.current.style.opacity = '0.4';
      }}
      onDragEnd={() => {
        draggingTaskRef.current = null;
        if (taskRef.current) {
          taskRef.current.style.opacity = '';
          taskRef.current.style.boxShadow = '';
        }
      }}
      onDragOver={(e) => {
        const g = draggingTaskRef.current;
        if (!g || g.listName !== listName || g.id === task.id) return;
        if (!canReorderTogether(findTask(allLists[listName], g.id), task)) return;
        e.preventDefault();
        // Highlight written straight to the node. Doing this through state
        // would re-render, and because Task is declared inside the parent
        // that remounts the card and cancels the drag mid-gesture.
        if (taskRef.current) {
          taskRef.current.style.boxShadow = 'inset 0 3px 0 0 var(--accent)';
        }
      }}
      onDragLeave={() => {
        if (taskRef.current) taskRef.current.style.boxShadow = '';
      }}
      onDrop={(e) => {
        e.preventDefault();
        const g = draggingTaskRef.current;
        if (taskRef.current) taskRef.current.style.boxShadow = '';
        if (g && g.listName === listName) reorderTask(listName, g.id, task.id);
        draggingTaskRef.current = null;
      }}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      onTouchCancel={onTouchEnd}
      onClick={() => {
        if (task.isArchived) return;
        // A completed swipe is followed by a click; ignore it so the card
        // doesn't expand as a side effect of being completed.
        if (swipe.current.justSwiped) return;
        // This tap already did a job - it closed a different task. Checked
        // and cleared here so the tap after it behaves normally.
        if (collapseGuardRef.current) {
          collapseGuardRef.current = false;
          return;
        }
        
        // Save details before collapsing. Through saveDetails rather than the
        // unconditional updateTaskDetails this replaces: "always save even if
        // content looks the same" predates the reliable cleanup save on
        // collapse, and its unconditional updatedAt stamp is what would let
        // merely opening a task win sync conflicts. saveDetails no-ops when
        // unchanged; the collapse cleanup still saves as the backstop.
        if (isExpanded) saveDetails(detailsRef.current);
        
        setExpandedTaskId(isExpanded ? null : `${listName}-${task.id}`);
      }}
      style={{
        pointerEvents: task.isArchived ? 'none' : 'auto',
        // Swiped out: the card stays opaque and slides clear, so what you're
        // left looking at is the full green panel and its checkmark. Ticked:
        // it fades in place as before.
        ...(swipedOut ? { '--swipe-progress': 1, '--swipe-dx': '110%' } : {}),
        opacity: task.isArchived ? 0.7 : (isCompleting && !swipedOut ? 0 : 1),
        transform: swipedOut
          ? 'translateX(110%)'
          : (isCompleting ? 'translateX(14px) scale(0.97)' : 'none'),
        // Height collapse: pinned to the measured value first, then driven to 0
        // once `collapsing` flips, which pulls the rows below up smoothly.
        ...(isCompleting && measuredHeight != null ? {
          maxHeight: collapsing ? '0px' : `${measuredHeight}px`,
          marginBottom: collapsing ? '0px' : undefined,
          paddingTop: collapsing ? '0px' : undefined,
          paddingBottom: collapsing ? '0px' : undefined,
          // Not while swiped out. The green panel is a pseudo-element that
          // counter-translates to stay put while the card slides away, which
          // puts it outside the card's own box - overflow:hidden would clip
          // away the very thing the gesture is meant to reveal. The card is
          // off-screen by then, so there is nothing left to spill.
          ...(swipedOut ? {} : { overflow: 'hidden' })
        } : {}),
        // Opacity/transform wait for the hold; the collapse is already
        // delayed by its own timer, so it gets no extra delay here.
        // Built from the same constants as the timers above. Opacity and
        // transform wait out the hold; the collapse needs no delay here
        // because its own timer already fires at that moment.
        transition: isCompleting
          ? (swipedOut ? [
              // The slide-off happens immediately - it's the tail of the
              // gesture, not something to wait for. Only the collapse waits
              // out the hold, and its own timer already handles that.
              'transform 260ms ease',
              `max-height ${COMPLETE_ANIM_MS}ms ease`,
              `margin ${COMPLETE_ANIM_MS}ms ease`,
              `padding ${COMPLETE_ANIM_MS}ms ease`
            ].join(', ') : [
              `opacity ${COMPLETE_ANIM_MS}ms ease ${COMPLETE_HOLD_MS}ms`,
              `transform ${COMPLETE_ANIM_MS}ms ease ${COMPLETE_HOLD_MS}ms`,
              `max-height ${COMPLETE_ANIM_MS}ms ease`,
              `margin ${COMPLETE_ANIM_MS}ms ease`,
              `padding ${COMPLETE_ANIM_MS}ms ease`
            ].join(', '))
          : 'none'
      }}
    >
      {task.priority && task.priority !== 'low' && (
        <div className={`priority-indicator ${task.priority}`}></div>
      )}
      
      <div className="task-main">
        <div className="checkbox-wrapper">
          <input
            type="checkbox"
            checked={task.completed || isCompleting}
            onChange={(e) => {
              e.stopPropagation();
              requestComplete();
            }}
            onClick={(e) => e.stopPropagation()}
            disabled={task.isArchived}
          />
        </div>
        <div className="task-content">
          {isExpanded && editingTaskName === `${listName}-${task.id}` ? (
            <input
              type="text"
              value={task.text}
              onChange={(e) => {
                e.stopPropagation();
                renameTask(listName, task.id, e.target.value);
              }}
              onBlur={() => setEditingTaskName(null)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  setEditingTaskName(null);
                }
              }}
              onClick={(e) => e.stopPropagation()}
              autoFocus
              style={{
                width: '100%',
                padding: '8px 12px',
                background: 'rgba(var(--surface-rgb), 0.8)',
                border: '2px solid rgba(var(--accent-rgb), 0.3)',
                borderRadius: '8px',
                color: 'var(--text)',
                fontSize: '1rem',
                fontFamily: 'var(--font-ui)',
                fontWeight: '600'
              }}
            />
          ) : (
            <div 
              className="task-text"
              onClick={(e) => {
                e.stopPropagation();
                // Renaming needs the click to land on the words. Clicking the
                // space beside them is a click on the row, and falls through
                // to the same expand/collapse everything else does.
                const onLabel = e.target && e.target.closest
                  && e.target.closest('.task-text-label');
                if (isExpanded && !task.isArchived && onLabel) {
                  setEditingTaskName(`${listName}-${task.id}`);
                } else {
                  // If collapsed, single click expands
                  // Delay single-click action to allow double-click to cancel it
                  clickTimeoutRef.current = setTimeout(() => {
                    // Save details before toggling if expanded. Same reasoning
                    // as the collapse path above: saveDetails no-ops when
                    // unchanged, so opening a task is never a write.
                    if (isExpanded) saveDetails(detailsRef.current);
                    
                    // Single click toggles task expanded/collapsed
                    if (!task.isArchived) {
                      setExpandedTaskId(isExpanded ? null : `${listName}-${task.id}`);
                    }
                  }, 250); // 250ms delay
                }
              }}
              onDoubleClick={(e) => {
                e.stopPropagation();
                // Cancel the pending single-click
                if (clickTimeoutRef.current) {
                  clearTimeout(clickTimeoutRef.current);
                }
                // Double-click enters edit mode (works whether expanded or not)
                if (!task.isArchived) {
                  if (!isExpanded) {
                    setExpandedTaskId(`${listName}-${task.id}`);
                  }
                  setEditingTaskName(`${listName}-${task.id}`);
                }
              }}
              style={{cursor: isExpanded ? 'text' : 'pointer'}}
            >
              {/* Inline span, so its box ends where the text ends. The div
                  around it is a flex child that fills the row, so hanging the
                  rename off the div meant the whole empty area beside a short
                  title opened the editor. */}
              <span className="task-text-label">{task.text}</span>
            </div>
          )}

          {/* Only rendered when there's something to show. As an
              unconditional div it still contributed its margin and line
              box, padding out every task that had no due date. */}
          {dueDate && !task.completed && (
            <div className="task-meta">
              <span className={`task-due-date ${isOverdue ? 'overdue' : ''}`}><CalendarIcon /> {dueDateText}</span>
            </div>
          )}
        </div>
        {/* A direct child of .task-main rather than of .task-content, so it
            isn't stacked under the title. align-self:flex-start (in the CSS)
            pins it to the task's first line; margin-left:auto pushes it to
            the right edge. */}
        {sharedBadge && (
          <span
            className={`shared-badge ${sharedBadge.key}`}
            title={task.completed ? `Completed by ${sharedBadge.label}` : `Assigned to ${sharedBadge.label}`}
          >
            {sharedBadge.label}
          </span>
        )}
        {task.priority === 'high' && (
          <span className="pinned-flame-right">
            <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" style={{width: '20px', height: '20px', display: 'inline-block'}}>
              <path d="M 32 8 Q 26 14 22 24 Q 18 35 20 46 Q 23 54 32 58 Q 41 54 44 46 Q 46 35 42 24 Q 38 14 32 8 Z" fill="#FF6B35" opacity="0.8"/>
              <path d="M 32 8 Q 36 14 40 24 Q 44 35 42 46 Q 39 52 32 56 Q 25 52 22 46 Q 20 35 24 24 Q 28 14 32 8 Z" fill="#FF8C42" opacity="0.9"/>
              <path d="M 32 12 Q 28 18 26 28 Q 24 38 27 46 Q 29 50 32 52 Q 35 50 37 46 Q 40 38 38 28 Q 36 18 32 12 Z" fill="#FFD93D"/>
              <path d="M 32 18 Q 30 24 29 32 Q 28 40 30 46 Q 31 48 32 49 Q 33 48 34 46 Q 36 40 35 32 Q 34 24 32 18 Z" fill="#FFF4CC"/>
            </svg>
          </span>
        )}
      </div>

      {isExpanded && (
        <div className="task-details-section">
          {/* First field in the expanded view: on a shared list, who owns
              this task is the thing you want to see before the notes. */}
          {isSharedTask && (
            <div className="assign-field">
              <label className="details-label" style={{ margin: 0 }}>Assigned:</label>
              <button
                type="button"
                className={`assign-pill ${task.assignedTo || 'unassigned'}`}
                onClick={(e) => {
                  e.stopPropagation();
                  cycleAssignment(listName, task.id);
                }}
                title="Tap to reassign"
              >
                {task.assignedTo === 'me' ? 'You'
                  : task.assignedTo === 'partner' ? partnerLabel
                  : 'Unassigned'}
              </button>
            </div>
          )}

          <label className="details-label">Details</label>
          <div className="richtext-toolbar" onClick={(e) => e.stopPropagation()}>
            <button 
              className="toolbar-btn"
              onMouseDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
                
                // Find and focus the details richtext area
                const detailsArea = e.target.closest('.task-details-section').querySelector('.details-richtext');
                detailsArea.focus();
                
                // Ensure cursor is positioned
                const selection = window.getSelection();
                if (!selection.rangeCount || !detailsArea.contains(selection.anchorNode)) {
                  const range = document.createRange();
                  range.selectNodeContents(detailsArea);
                  range.collapse(false);
                  selection.removeAllRanges();
                  selection.addRange(range);
                } else {
                  const range = selection.getRangeAt(0);
                  
                  // Helper to build a fresh checkbox line
                  const buildCheckboxLine = () => {
                    const checkbox = document.createElement('input');
                    checkbox.type = 'checkbox';
                    checkbox.className = 'task-checkbox';
                    // No click handler: the delegated listener on the details
                    // area covers this box too. contentEditable=false keeps
                    // the caret from landing to its left.
                    checkbox.contentEditable = 'false';
                    // No inline onchange - the delegated change listener on the
                    // details area handles parent auto-check for all checkboxes.
                    const line = document.createElement('div');
                    line.className = 'checkbox-line';
                    const span = document.createElement('span');
                    span.contentEditable = 'true';
                    span.innerHTML = '&nbsp;';
                    line.appendChild(checkbox);
                    line.appendChild(span);
                    return { line, span };
                  };
                  
                  // A selection spanning several lines converts each of them,
                  // rather than the single line the caret happens to sit in.
                  // Everything below this point assumes one line - it walks up
                  // from range.startContainer and never looks at where the
                  // selection ends - so multi-line is handled here and returns.
                  if (!range.collapsed) {
                    const blocks = Array.from(detailsArea.children).filter(
                      el => range.intersectsNode(el)
                    );
                    if (blocks.length > 1) {
                      blocks.forEach(block => {
                        // Already a real checkbox line - leave it alone rather
                        // than nesting a second box inside it.
                        if (block.classList.contains('checkbox-line') &&
                            block.querySelector('.task-checkbox')) return;

                        const { line, span } = buildCheckboxLine();
                        // Text is moved, not copied: this converts the line in
                        // place, so anything already on it has to come across
                        // including its formatting.
                        span.innerHTML = '';
                        while (block.firstChild) span.appendChild(block.firstChild);
                        if (!span.textContent.trim()) span.innerHTML = '&nbsp;';
                        // Indent carries over so converting a nested bullet
                        // doesn't silently flatten the hierarchy.
                        if (block.style && block.style.marginLeft) {
                          line.style.marginLeft = block.style.marginLeft;
                        }
                        block.parentElement.replaceChild(line, block);
                      });
                      setTimeout(() => {
                        syncParentCheckboxes(detailsArea);
                        refreshListMarkers(detailsArea);
                      }, 0);
                      return;
                    }
                  }

                  // Find the current line/block the cursor is on
                  let currentNode = range.startContainer;
                  let currentLine = currentNode.nodeType === Node.ELEMENT_NODE ?
                    currentNode : currentNode.parentElement;
                  
                  // Walk up to find the direct child of detailsArea (the line container)
                  while (currentLine && currentLine.parentElement !== detailsArea && currentLine !== detailsArea) {
                    currentLine = currentLine.parentElement;
                  }
                  
                  // If it's a checkbox line that still has a live checkbox, don't double-add.
                  // But if it's a leftover empty checkbox-line (checkbox was deleted),
                  // fall through and treat it as a normal empty line.
                  if (currentLine && currentLine.classList && currentLine.classList.contains('checkbox-line')) {
                    const hasCheckbox = currentLine.querySelector('.task-checkbox');
                    const lineText = (currentLine.textContent || '').replace(/\u00A0/g, '').trim();
                    if (hasCheckbox && lineText !== '') {
                      // A real, populated checkbox line - don't add another
                      return;
                    }
                    if (hasCheckbox && lineText === '') {
                      // Empty checkbox line that still has its box - nothing to do
                      return;
                    }
                    // else: leftover markup with no checkbox - fall through to convert it
                  }
                  
                  // A bullet with text at the caret becomes a checkbox - the
                  // marker is REPLACED. This has to be handled here because
                  // currentLine above walks up to the direct child of the
                  // details area, which for a bullet is the whole <ul>: the
                  // generic path below would then convert the ENTIRE list
                  // into a single checkbox line, silently swallowing every
                  // other item in it.
                  //
                  // Converting an item from the middle splits the list, so
                  // the items after it stay bullets in their own list.
                  {
                    const caretForLi = currentNode.nodeType === Node.ELEMENT_NODE
                      ? currentNode : currentNode.parentElement;
                    const liAtCaret = caretForLi && caretForLi.closest
                      ? caretForLi.closest('li') : null;
                    if (liAtCaret && detailsArea.contains(liAtCaret) &&
                        (liAtCaret.textContent || '').replace(/\u00A0/g, '').trim() !== '') {
                      const list = liAtCaret.parentElement;
                      const { line, span } = buildCheckboxLine();
                      span.innerHTML = '';
                      while (liAtCaret.firstChild) span.appendChild(liAtCaret.firstChild);
                      if (!span.textContent.trim()) span.innerHTML = '&nbsp;';
                      // Indent lives on the <ul> for a bullet and on the line
                      // itself for a checkbox, so it moves across explicitly.
                      const indent = (list && list.style && list.style.marginLeft) ||
                        (liAtCaret.style && liAtCaret.style.marginLeft) || '';
                      if (indent) line.style.marginLeft = indent;

                      const items = Array.from(list.children).filter(el => el.tagName === 'LI');
                      const after = items.slice(items.indexOf(liAtCaret) + 1);
                      liAtCaret.remove();
                      if (after.length) {
                        const rest = document.createElement('ul');
                        if (indent) rest.style.marginLeft = indent;
                        after.forEach(item => rest.appendChild(item));
                        list.parentElement.insertBefore(rest, list.nextSibling);
                        list.parentElement.insertBefore(line, rest);
                      } else {
                        list.parentElement.insertBefore(line, list.nextSibling);
                      }
                      // A list with nothing left in it is empty scaffolding.
                      if (!list.querySelector('li')) list.remove();

                      const caret = document.createRange();
                      caret.selectNodeContents(span);
                      caret.collapse(false);
                      selection.removeAllRanges();
                      selection.addRange(caret);

                      setTimeout(() => {
                        syncParentCheckboxes(detailsArea);
                        refreshListMarkers(detailsArea);
                      }, 0);
                      return;
                    }
                  }

                  // An empty bullet at the caret is an intent, not content:
                  // you started a bullet and then chose a checkbox instead.
                  // It has to be handled separately because currentLine walks
                  // up to the direct child of the details area, which for a
                  // bullet is the whole <ul> - so an empty <li> inside a list
                  // that still has other items was invisible to the checks
                  // below, and the checkbox landed under a stray dot.
                  let explicitAnchor = null;
                  const caretEl = currentNode.nodeType === Node.ELEMENT_NODE
                    ? currentNode : currentNode.parentElement;
                  const emptyLi = caretEl && caretEl.closest ? caretEl.closest('li') : null;
                  if (emptyLi && detailsArea.contains(emptyLi) &&
                      (emptyLi.textContent || '').replace(/\u00A0/g, '').trim() === '') {
                    const list = emptyLi.parentElement;
                    const wasOnlyItem = list && list.querySelectorAll('li').length === 1;
                    // Anchor captured before removing anything, or the
                    // reference point disappears along with the node.
                    explicitAnchor = { parent: list.parentElement, before: list.nextSibling };
                    emptyLi.remove();
                    // A list with no items left is empty scaffolding, not a
                    // list - drop it rather than leaving invisible markup
                    // that still takes vertical space.
                    if (wasOnlyItem || !list.querySelector('li')) list.remove();
                  }

                  const { line: checkboxLine, span: textSpan } = buildCheckboxLine();
                  
                  // Determine if the current line has text
                  const isProperLine = currentLine && currentLine !== detailsArea && currentLine.parentElement === detailsArea;
                  const currentLineText = isProperLine ? (currentLine.textContent || '').replace(/\u00A0/g, '').trim() : '';
                  
                  // Text typed straight into an empty editor has no wrapping
                  // block - browsers leave it as bare text nodes until the first
                  // Enter. That is the most common way to reach this button, so
                  // the run around the caret is wrapped first and then treated
                  // like any other line.
                  const wrapBareLine = () => {
                    let node = range.startContainer;
                    if (node === detailsArea) {
                      node = detailsArea.childNodes[Math.max(0, range.startOffset - 1)]
                        || detailsArea.firstChild;
                    }
                    while (node && node.parentElement !== detailsArea) node = node.parentElement;
                    if (!node) return null;
                    const isBoundary = (n) => !n || (n.nodeType === Node.ELEMENT_NODE &&
                      ['BR', 'DIV', 'P', 'UL', 'OL'].includes(n.tagName));
                    if (isBoundary(node)) return null;
                    let first = node, last = node;
                    while (first.previousSibling && !isBoundary(first.previousSibling)) first = first.previousSibling;
                    while (last.nextSibling && !isBoundary(last.nextSibling)) last = last.nextSibling;
                    const wrapper = document.createElement('div');
                    detailsArea.insertBefore(wrapper, first);
                    let n = first;
                    while (n) {
                      const next = (n === last) ? null : n.nextSibling;
                      wrapper.appendChild(n);
                      n = next;
                    }
                    return wrapper;
                  };

                  // Converts a line in place, keeping its text and indent, so a
                  // checkbox can be added to something already written. This
                  // used to insert an empty checkbox on the NEXT line instead,
                  // which meant you could never tick a line you'd already typed.
                  const convertInPlace = (lineEl) => {
                    textSpan.innerHTML = '';
                    while (lineEl.firstChild) textSpan.appendChild(lineEl.firstChild);
                    if (lineEl.style && lineEl.style.marginLeft) {
                      checkboxLine.style.marginLeft = lineEl.style.marginLeft;
                    }
                    lineEl.parentElement.replaceChild(checkboxLine, lineEl);
                  };

                  let caretToEnd = false;

                  if (explicitAnchor) {
                    explicitAnchor.parent.insertBefore(checkboxLine, explicitAnchor.before);
                  } else if (isProperLine && currentLineText === '') {
                    // Empty line (including a leftover empty checkbox-line)
                    currentLine.parentElement.replaceChild(checkboxLine, currentLine);
                  } else if (isProperLine && currentLineText !== '') {
                    convertInPlace(currentLine);
                    caretToEnd = true;
                  } else {
                    const areaText = (detailsArea.textContent || '').replace(/\u00A0/g, '').trim();
                    if (areaText === '') {
                      detailsArea.appendChild(checkboxLine);
                    } else {
                      const wrapped = wrapBareLine();
                      if (wrapped && (wrapped.textContent || '').replace(/\u00A0/g, '').trim() !== '') {
                        convertInPlace(wrapped);
                        caretToEnd = true;
                      } else {
                        if (wrapped && wrapped.parentElement) wrapped.remove();
                        range.collapse(false);
                        range.insertNode(checkboxLine);
                      }
                    }
                  }
                  
                  // After converting existing text the caret belongs at the end
                  // of it, not in front of what you already wrote.
                  const newRange = document.createRange();
                  if (caretToEnd) {
                    newRange.selectNodeContents(textSpan);
                    newRange.collapse(false);
                  } else {
                    newRange.setStart(textSpan, 0);
                    newRange.collapse(true);
                  }
                  selection.removeAllRanges();
                  selection.addRange(newRange);
                  setTimeout(() => refreshListMarkers(detailsArea), 0);
                }
              }}
              title="Insert Checkbox"
            >
              <CheckboxIcon />Box
            </button>
            <button 
              className="toolbar-btn"
              onMouseDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
                
                // Find and focus the details richtext area
                const detailsArea = e.target.closest('.task-details-section').querySelector('.details-richtext');
                detailsArea.focus();
                
                // Ensure cursor is positioned
                const selection = window.getSelection();
                if (!selection.rangeCount || !detailsArea.contains(selection.anchorNode)) {
                  const range = document.createRange();
                  range.selectNodeContents(detailsArea);
                  range.collapse(false);
                  selection.removeAllRanges();
                  selection.addRange(range);
                }
                
                // execCommand handles ordinary block elements, but the editor's
                // lines are custom checkbox-line divs containing an <input> -
                // it either skips those or nests the box inside the new <li>.
                // A multi-line selection is converted explicitly instead, and
                // only genuinely plain lines fall through to the native path.
                const range = selection.getRangeAt(0);
                if (!range.collapsed) {
                  const blocks = Array.from(detailsArea.children).filter(
                    el => range.intersectsNode(el)
                  );
                  if (blocks.length > 1) {
                    const list = document.createElement('ul');
                    blocks[0].parentElement.insertBefore(list, blocks[0]);
                    blocks.forEach(block => {
                      const li = document.createElement('li');
                      // The checkbox itself is dropped: a line is either a
                      // checkbox or a bullet, and keeping both would leave a
                      // dead box sitting inside the bullet.
                      const box = block.querySelector('.task-checkbox');
                      if (box) box.remove();
                      while (block.firstChild) li.appendChild(block.firstChild);
                      if (!li.textContent.trim()) li.innerHTML = '<br>';
                      list.appendChild(li);
                      block.remove();
                    });
                    setTimeout(() => refreshListMarkers(detailsArea), 0);
                    return;
                  }
                }

                // A checkbox line at the caret becomes a bullet - the marker
                // is REPLACED, not added to. A line is one thing or the other,
                // and execCommand would wrap the whole .checkbox-line in an
                // <li>, leaving a dead box sitting inside the bullet. This
                // applies whether the line has text or not; an empty one is
                // just the case where you made a checkbox and immediately
                // changed your mind.
                const caretNode = range.startContainer;
                const caretEl = caretNode.nodeType === Node.ELEMENT_NODE
                  ? caretNode : caretNode.parentElement;
                const boxLine = caretEl && caretEl.closest
                  ? caretEl.closest('.checkbox-line') : null;
                if (boxLine && detailsArea.contains(boxLine)) {
                  const hadText = (boxLine.textContent || '')
                    .replace(/\u00A0/g, '').trim() !== '';
                  // The box goes first, so it can't be carried into the <li>
                  // along with the text.
                  const box = boxLine.querySelector('.task-checkbox');
                  if (box) box.remove();
                  const source = boxLine.querySelector('span') || boxLine;
                  const li = document.createElement('li');
                  while (source.firstChild) li.appendChild(source.firstChild);
                  if (!(li.textContent || '').replace(/\u00A0/g, '').trim()) {
                    li.innerHTML = '<br>';
                  }

                  // Indent carries across so swapping the marker type doesn't
                  // silently promote the line back to the top level.
                  const indent = (boxLine.style && boxLine.style.marginLeft) || '';
                  // Join an adjacent list at the same indent rather than
                  // leaving two <ul>s abutting, which renders as a visible
                  // break in what the user sees as one list.
                  const isListAt = (el) => !!el && el.tagName === 'UL' &&
                    ((el.style && el.style.marginLeft) || '') === indent;
                  const prev = boxLine.previousElementSibling;
                  const next = boxLine.nextElementSibling;
                  if (isListAt(prev)) {
                    prev.appendChild(li);
                    boxLine.remove();
                  } else if (isListAt(next)) {
                    next.insertBefore(li, next.firstChild);
                    boxLine.remove();
                  } else {
                    const list = document.createElement('ul');
                    if (indent) list.style.marginLeft = indent;
                    list.appendChild(li);
                    boxLine.parentElement.replaceChild(list, boxLine);
                  }

                  // Caret to the end of text that was already there, to the
                  // start of a line that is still empty.
                  const caret = document.createRange();
                  caret.selectNodeContents(li);
                  caret.collapse(!hadText);
                  selection.removeAllRanges();
                  selection.addRange(caret);

                  setTimeout(() => refreshListMarkers(detailsArea), 0);
                  return;
                }

                document.execCommand('insertUnorderedList', false, null);
              }}
              title="Bullet List"
            >
              • Bullets
            </button>
            <button
              className={`toolbar-btn ${formatOn ? 'format-on' : ''}`}
              onMouseDown={(e) => {
                // onMouseDown with preventDefault, like its neighbours: the
                // selection has to survive the press, and a plain click would
                // have already moved focus out of the editor by then.
                e.preventDefault();
                e.stopPropagation();
                const detailsArea = e.target.closest('.task-details-section').querySelector('.details-richtext');
                detailsArea.focus();
                const selection = window.getSelection();
                if (!selection.rangeCount || !detailsArea.contains(selection.anchorNode)) {
                  const range = document.createRange();
                  range.selectNodeContents(detailsArea);
                  range.collapse(false);
                  selection.removeAllRanges();
                  selection.addRange(range);
                }
                // Both at once, so the button is one state rather than two
                // that can drift apart. With a selection it styles it; with a
                // bare cursor it arms the styling for what you type next.
                document.execCommand('bold', false, null);
                document.execCommand('underline', false, null);
              }}
              title="Bold + underline"
            >
              {/* A span, not <strong>: the underline is the only cue this
                  button needs, and <strong> was overriding the toolbar's own
                  font weight so it sat heavier than its neighbours. */}
              <span style={{ textDecoration: 'underline' }}>Bold</span>
            </button>
            <button 
              className="toolbar-btn"
              onMouseDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
                
                const detailsArea = e.target.closest('.task-details-section').querySelector('.details-richtext');
                // One Follow Up section per task. The heading is tagged with
                // its own class and that survives into the saved HTML, so its
                // presence is the check - and it holds for a task reopened
                // later, not just within this editing session. Bailing before
                // focus() keeps a repeat press a true no-op: no cursor jump,
                // no scroll, nothing.
                if (!detailsArea || detailsArea.querySelector('.follow-up-heading')) return;
                detailsArea.focus();

                // Build a "Follow Up" heading line with the matcha underline
                // Styled by .follow-up-heading rather than inline: the
                // sanitiser strips style attributes, so anything set here
                // would be discarded on the next save.
                const heading = document.createElement('div');
                heading.className = 'follow-up-heading';
                const headingSpan = document.createElement('span');
                headingSpan.textContent = 'Follow Up';
                heading.appendChild(headingSpan);
                
                // Build a bullet list with one empty bullet beneath the heading
                const list = document.createElement('ul');
                const item = document.createElement('li');
                item.innerHTML = '<br>';
                list.appendChild(item);
                
                // Append a spacer + the section a few lines below existing content
                const spacer = document.createElement('div');
                spacer.innerHTML = '<br>';
                detailsArea.appendChild(spacer);
                detailsArea.appendChild(heading);
                detailsArea.appendChild(list);
                
                // Place the cursor in the new bullet
                const selection = window.getSelection();
                const range = document.createRange();
                range.setStart(item, 0);
                range.collapse(true);
                selection.removeAllRanges();
                selection.addRange(range);
                
                // Refresh markers so everything stays consistent
                setTimeout(() => refreshListMarkers(detailsArea), 0);
              }}
              title="Add Follow Up section"
            >
              Follow Up
            </button>
            {/* Indent / outdent. Icon-only, so the toolbar doesn't grow two
                more word-width buttons - the pair reads as one control.
                Both delegate to the same two representations the Tab key and
                the drag gesture use: nesting for bullets, marginLeft for
                everything else. */}
            <button
              className="toolbar-btn toolbar-btn-icon"
              onMouseDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
                const detailsArea = e.target.closest('.task-details-section')
                  .querySelector('.details-richtext');
                if (!detailsArea) return;
                detailsArea.focus();
                const selection = window.getSelection();
                if (!selection.rangeCount || !detailsArea.contains(selection.anchorNode)) {
                  // Nothing to act on: put the caret somewhere sensible and
                  // stop, rather than indenting a line the user can't see.
                  const range = document.createRange();
                  range.selectNodeContents(detailsArea);
                  range.collapse(false);
                  selection.removeAllRanges();
                  selection.addRange(range);
                  return;
                }
                const target = resolveIndentTarget(detailsArea, selection.getRangeAt(0).startContainer);
                if (!target) return;
                if (target.kind === 'bullet') {
                  document.execCommand('indent', false, null);
                } else {
                  target.line.style.marginLeft =
                    (blockIndent(target.line) + EDITOR_INDENT_STEP) + 'px';
                }
                refreshListMarkers(detailsArea);
                refreshOutdentVisibility(detailsArea);
              }}
              title="Indent"
              aria-label="Indent"
            >
              <IndentIcon />
            </button>
            {showOutdent && (
              <button
                className="toolbar-btn toolbar-btn-icon"
                onMouseDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  const detailsArea = e.target.closest('.task-details-section')
                    .querySelector('.details-richtext');
                  if (!detailsArea) return;
                  detailsArea.focus();
                  const selection = window.getSelection();
                  if (!selection.rangeCount || !detailsArea.contains(selection.anchorNode)) return;
                  const target = resolveIndentTarget(detailsArea, selection.getRangeAt(0).startContainer);
                  if (!target) return;
                  if (target.kind === 'bullet') {
                    document.execCommand('outdent', false, null);
                  } else {
                    const next = Math.max(0, blockIndent(target.line) - EDITOR_INDENT_STEP);
                    // Removed rather than set to 0px: an empty declaration is
                    // what the rest of the app treats as "not indented", and
                    // the sanitizer would keep a literal 0px around forever.
                    if (next === 0) target.line.style.removeProperty('margin-left');
                    else target.line.style.marginLeft = next + 'px';
                  }
                  refreshListMarkers(detailsArea);
                  // Removing this button mid-press is what made the task
                  // collapse. The press starts on the button; by the time the
                  // browser dispatches the click, the button is gone, so the
                  // click is delivered to the nearest surviving ancestor
                  // instead - past the toolbar's stopPropagation and into the
                  // card's tap-to-collapse. Same guard the outside-tap
                  // collapse already uses for "this tap has done its job",
                  // armed only when the button is actually going away.
                  if (!refreshOutdentVisibility(detailsArea)) armCollapseGuard();
                }}
                title="Outdent"
                aria-label="Outdent"
              >
                <OutdentIcon />
              </button>
            )}
          </div>
          <div 
            className="details-richtext"
            contentEditable
            suppressContentEditableWarning
            // A bare contenteditable is announced as an unnamed group. These
            // make it a named, multi-line text field to a screen reader.
            role="textbox"
            aria-multiline="true"
            aria-label="Task details"
            // Sentence case and autocorrect match every other text field on
            // the device; without them a contenteditable silently opts out of
            // both on iOS and typing here feels different from everywhere else.
            autoCapitalize="sentences"
            autoCorrect="on"
            spellCheck="true"
            onInput={(e) => {
              refreshListMarkers(e.currentTarget);
              syncPlaceholder(e.currentTarget);
              refreshOutdentVisibility(e.currentTarget);
            }}
            // Caret moves that aren't edits: arrows, taps, and the selection
            // landing here on focus. Without these the button would only
            // update when the text changed, so moving onto an indented line
            // would leave it hidden.
            onKeyUp={(e) => refreshOutdentVisibility(e.currentTarget)}
            onFocus={(e) => refreshOutdentVisibility(e.currentTarget)}
            onBlur={(e) => {
              e.stopPropagation();
              saveDetails(e.currentTarget);
            }}
            onClick={(e) => {
              e.stopPropagation();
              refreshOutdentVisibility(e.currentTarget);
            }}
            onCopy={(e) => {
              e.stopPropagation();
              writeClipboard(e);
            }}
            onCut={(e) => {
              e.stopPropagation();
              // preventDefault on a cut cancels the deletion as well as the
              // clipboard write - the two are one default action, not two.
              // That is why cut was behaving like copy. Since we override the
              // write, we have to do the removal ourselves.
              const captured = writeClipboard(e);
              if (!captured) return;
              try {
                if (captured.range) {
                  const sel = window.getSelection();
                  sel.removeAllRanges();
                  sel.addRange(captured.range);
                }
                // execCommand rather than range.deleteContents(): this one
                // registers with the browser's own undo stack, so Cmd-Z can
                // still reverse the cut.
                document.execCommand('delete', false, null);
                saveDetails(e.currentTarget);
              } catch (err) {
                // Nothing removed - the clipboard still holds the content,
                // so no data is lost either way.
              }
            }}
            onPaste={(e) => {
              e.preventDefault();
              e.stopPropagation();
              
              const text = (e.clipboardData?.getData('text/plain') || '');
              const trimmed = text.trim();
              // A bare URL still wins over the HTML branch below, so copying
              // a link out of a browser bar keeps producing a compact anchor
              // rather than a page's worth of markup.
              //
              // Falls back to the internal stash when the clipboard offers no
              // HTML, which is the common case on iOS. Matched on the plain
              // text so a copy made elsewhere in between can't be mistaken
              // for this one.
              const clipboardHtml = (e.clipboardData?.getData('text/html') || '');
              // The stash takes precedence over the browser's own HTML when
              // it matches. The browser serialises the raw selection, which
              // has the same gap - a checkbox left outside the range - so
              // preferring it would reintroduce exactly the bug the stash
              // exists to fix. Matched on plain text, so a copy from anywhere
              // else falls through to the clipboard as normal.
              const stashed = internalClipboard.text && internalClipboard.text === text
                ? internalClipboard.html
                : '';
              const html = stashed || clipboardHtml;
              
              const selection = window.getSelection();
              if (!selection.rangeCount) return;
              const range = selection.getRangeAt(0);
              range.deleteContents();
              
              // If the pasted content is a single URL, insert a compact "Link"
              // anchor instead of the full URL text.
              const isUrl = /^(https?:\/\/|www\.)\S+$/i.test(trimmed);
              if (isUrl) {
                const href = /^https?:\/\//i.test(trimmed) ? trimmed : 'https://' + trimmed;
                const a = document.createElement('a');
                a.href = href;
                a.textContent = 'Link';
                a.className = 'task-link';
                a.target = '_blank';
                a.rel = 'noopener noreferrer';
                a.title = href;
                // Atomic unit so the label isn't editable and clicks register
                a.contentEditable = 'false';
                range.insertNode(a);
                // Trailing space so typing can continue after the link
                const after = document.createTextNode('\u00A0');
                a.parentNode.insertBefore(after, a.nextSibling);
                const newRange = document.createRange();
                newRange.setStart(after, 1);
                newRange.collapse(true);
                selection.removeAllRanges();
                selection.addRange(newRange);
              } else if (html) {
                // Structure survives a copy/paste: checkboxes, bullets,
                // indent and formatting all come through.
                //
                // Pasting HTML from an arbitrary source is only safe because
                // sanitizeRichText is an allowlist, and it happens to permit
                // exactly what this editor creates - so content copied from
                // within a task arrives intact, while anything from a web page
                // is reduced to the same small set of tags or to plain text.
                // This is the sanitizer doing the job it exists for, not a
                // relaxation of it.
                const clean = sanitizeRichText(html);

                // insertHTML rather than range.insertNode. Both put the same
                // nodes in the same place, but only execCommand registers
                // with the browser's undo stack - a directly inserted node is
                // invisible to it, which is why Cmd-Z after a paste did
                // nothing. It also places the caret after the insertion for
                // us, so the manual range juggling goes away.
                let inserted = false;
                try {
                  inserted = document.execCommand('insertHTML', false, clean);
                } catch (err) {
                  inserted = false;
                }

                if (!inserted) {
                  // Fallback for anywhere execCommand is unavailable: correct
                  // content, no undo.
                  const holder = document.createElement('div');
                  holder.innerHTML = clean;
                  const fragment = document.createDocumentFragment();
                  while (holder.firstChild) fragment.appendChild(holder.firstChild);
                  const lastNode = fragment.lastChild;
                  range.insertNode(fragment);
                  if (lastNode) {
                    const after = document.createRange();
                    after.setStartAfter(lastNode);
                    after.collapse(true);
                    selection.removeAllRanges();
                    selection.addRange(after);
                  }
                }

                // Pasted nodes need the same treatment as freshly loaded ones:
                // contentEditable is stripped by the sanitizer by design, so
                // without this a pasted checkbox's label would be typeable and
                // a pasted link would take a caret instead of opening.
                const area = e.currentTarget;
                area.querySelectorAll('.task-checkbox').forEach(cb => {
                  cb.contentEditable = 'false';
                });
                area.querySelectorAll('a.task-link').forEach(a => {
                  a.contentEditable = 'false';
                });
                // Parent/boundary marks are recomputed rather than trusted
                // from the pasted markup, which may have been copied from the
                // middle of a list and describe a hierarchy that no longer
                // holds where it landed.
                setTimeout(() => {
                  syncParentCheckboxes(area);
                  refreshListMarkers(area);
                }, 0);
              } else {
                // Insert plain text without formatting
                const textNode = document.createTextNode(text);
                range.insertNode(textNode);
                selection.collapseToEnd();
              }
            }}
            onKeyDown={(e) => {
              e.stopPropagation();

              // A bold+underline run ends at the line it was written on.
              // contentEditable carries active formatting across a newline,
              // so without this a heading would quietly turn the rest of the
              // note bold - and turning it off by hand means finding the
              // button again. Deferred a tick: the new line has to exist
              // before the commands apply to it.
              if (e.key === 'Enter') {
                const wasBold = document.queryCommandState('bold');
                const wasUnderline = document.queryCommandState('underline');
                if (wasBold || wasUnderline) {
                  setTimeout(() => {
                    if (document.queryCommandState('bold')) document.execCommand('bold', false, null);
                    if (document.queryCommandState('underline')) document.execCommand('underline', false, null);
                  }, 0);
                }
              }

              const selection = window.getSelection();
              if (!selection.rangeCount) return;
              
              const range = selection.getRangeAt(0);
              const currentNode = range.startContainer;
              
              // Check if we're in a checkbox-line
              let checkboxLine = currentNode.nodeType === Node.ELEMENT_NODE ? 
                currentNode.closest('.checkbox-line') : 
                currentNode.parentElement?.closest('.checkbox-line');
              
              // Handle Tab key - indent the line at the caret.
              //
              // This used to be gated on `&& checkboxLine`, so Tab worked on a
              // checkbox and nowhere else: a plain line, a bullet, and above
              // all the FIRST line of a task - which is usually bare text with
              // no block wrapper at all - fell through to the browser, which
              // moved focus out of the editor instead of indenting.
              //
              // Routed through the same resolver the toolbar buttons use, so
              // the key and the buttons cannot disagree: bullets nest, and
              // everything else takes marginLeft.
              if (e.key === 'Tab') {
                e.preventDefault();
                const area = e.currentTarget;
                const target = resolveIndentTarget(area, currentNode);
                if (!target) return;

                if (target.kind === 'bullet') {
                  document.execCommand(e.shiftKey ? 'outdent' : 'indent', false, null);
                  refreshListMarkers(area);
                  refreshOutdentVisibility(area);
                  return;
                }

                const line = target.line;
                const currentIndent = parseInt(line.style.marginLeft || '0') || 0;
                // Shift+Tab outdents. The handler used to ignore the modifier
                // entirely, so Shift+Tab indented like a plain Tab and there
                // was no way back out of a nesting level except backspacing
                // from the start of the line.
                const newIndent = e.shiftKey
                  ? Math.max(0, currentIndent - EDITOR_INDENT_STEP)
                  : currentIndent + EDITOR_INDENT_STEP;
                if (newIndent === currentIndent) return;
                // Removed rather than set to 0px, matching the outdent button:
                // an empty declaration is what the rest of the app reads as
                // "not indented".
                if (newIndent === 0) line.style.removeProperty('margin-left');
                else line.style.marginLeft = newIndent + 'px';

                // Parent and boundary marks are recomputed for the whole list
                // rather than patched for this one line. Outdenting can orphan
                // a parent that no longer has children, which hand-patching
                // the line you just moved could never notice - and this is
                // the same function that runs on load, so the two can't
                // disagree about what the list looks like.
                refreshListMarkers(area);
                refreshOutdentVisibility(area);
              }
              
              // Handle Backspace at the start of a checkbox line - remove the checkbox.
              // contentEditable's default backspace is unreliable at the boundary
              // right after a checkbox input, so we handle it explicitly.
              else if (e.key === 'Backspace' && checkboxLine && selection.isCollapsed) {
                const textSpan = checkboxLine.querySelector('span');
                // Determine if the caret is at the very start of the line's text.
                let atStart = false;
                const container = range.startContainer;
                const offset = range.startOffset;
                if (textSpan) {
                  if (offset === 0 && (container === textSpan || container === textSpan.firstChild || (textSpan.firstChild && container === textSpan.firstChild))) {
                    atStart = true;
                  }
                  // Also treat "&nbsp;-only" placeholder spans with caret at 0/1 as start
                  const spanText = (textSpan.textContent || '').replace(/\u00A0/g, '');
                  if (spanText === '' && offset <= 1) atStart = true;
                } else if (container === checkboxLine && offset === 0) {
                  atStart = true;
                }
                // If caret is somewhere inside actual text (not at start), let default run
                if (atStart) {
                  e.preventDefault();
                  const indent = parseInt(checkboxLine.style.marginLeft || '0') || 0;
                  const lineHasText = (checkboxLine.textContent || '').replace(/\u00A0/g, '').trim() !== '';
                  
                  if (indent > 0) {
                    // Indented: first backspace outdents rather than deleting
                    checkboxLine.style.marginLeft = Math.max(0, indent - 20) + 'px';
                    const r = document.createRange();
                    r.setStart(textSpan || checkboxLine, 0);
                    r.collapse(true);
                    selection.removeAllRanges();
                    selection.addRange(r);
                  } else {
                    // Convert checkbox line into a plain text line, preserving any text
                    const newLine = document.createElement('div');
                    newLine.style.display = 'block';
                    const newSpan = document.createElement('span');
                    newSpan.contentEditable = 'true';
                    newSpan.innerHTML = (textSpan && textSpan.innerHTML) ? textSpan.innerHTML : '&nbsp;';
                    newLine.appendChild(newSpan);
                    checkboxLine.parentNode.replaceChild(newLine, checkboxLine);
                    // Place caret at the start of the converted line
                    const r = document.createRange();
                    r.setStart(newSpan.firstChild || newSpan, 0);
                    r.collapse(true);
                    selection.removeAllRanges();
                    selection.addRange(r);
                  }
                }
              }
              
              // Handle Enter key
              else if (e.key === 'Enter' && checkboxLine) {
                const checkbox = checkboxLine.querySelector('.task-checkbox');
                // Read text from the entire line, excluding the checkbox input.
                // textContent of the line naturally excludes the input's value,
                // so this reliably captures any typed text regardless of span structure.
                const lineText = (checkboxLine.textContent || '').replace(/\u00A0/g, ' ').trim();
                const isEmpty = lineText === '';
                const currentIndent = parseInt(checkboxLine.style.marginLeft || '0');
                // Find the text span to reposition cursor (fallback to line itself)
                const textSpan = checkboxLine.querySelector('span') || checkboxLine;
                
                // Case 1: Empty checkbox with no indent - delete checkbox, create normal text line
                if (isEmpty && currentIndent === 0) {
                  e.preventDefault();
                  
                  // Create normal text line
                  const newLine = document.createElement('div');
                  newLine.style.display = 'block';
                  const newTextSpan = document.createElement('span');
                  newTextSpan.innerHTML = '&nbsp;';
                  newTextSpan.contentEditable = 'true';
                  newLine.appendChild(newTextSpan);
                  
                  // Insert after current line and remove checkbox line
                  checkboxLine.parentNode.insertBefore(newLine, checkboxLine.nextSibling);
                  checkboxLine.remove();
                  
                  // Move cursor to new line
                  const newRange = document.createRange();
                  newRange.setStart(newTextSpan, 0);
                  newRange.collapse(true);
                  selection.removeAllRanges();
                  selection.addRange(newRange);
                }
                
                // Case 2: Empty indented checkbox - outdent (reduce indent)
                else if (isEmpty && currentIndent > 0) {
                  e.preventDefault();
                  checkboxLine.style.marginLeft = Math.max(0, currentIndent - 20) + 'px';
                  // Keep focus in the text span
                  const newRange = document.createRange();
                  newRange.setStart(textSpan, 0);
                  newRange.collapse(true);
                  selection.removeAllRanges();
                  selection.addRange(newRange);
                }
                
                // Case 3: Checkbox with text - create new checkbox at same indent
                else {
                  e.preventDefault();
                  
                  // Create new checkbox line with same indent
                  const newCheckboxLine = document.createElement('div');
                  newCheckboxLine.className = 'checkbox-line';
                  newCheckboxLine.style.marginLeft = currentIndent + 'px';
                  
                  const newCheckbox = document.createElement('input');
                  newCheckbox.type = 'checkbox';
                  newCheckbox.className = 'task-checkbox';
                  // Delegated listener handles the click; see buildCheckboxLine.
                  newCheckbox.contentEditable = 'false';
                  // No inline onchange - delegated change listener handles sync
                  
                  const newTextSpan = document.createElement('span');
                  newTextSpan.innerHTML = '&nbsp;';
                  newTextSpan.contentEditable = 'true';
                  
                  newCheckboxLine.appendChild(newCheckbox);
                  newCheckboxLine.appendChild(newTextSpan);
                  
                  // Insert after current checkbox line
                  checkboxLine.parentNode.insertBefore(newCheckboxLine, checkboxLine.nextSibling);
                  
                  // Move cursor to new checkbox line
                  const newRange = document.createRange();
                  newRange.setStart(newTextSpan, 0);
                  newRange.collapse(true);
                  selection.removeAllRanges();
                  selection.addRange(newRange);
                }
              }
              
              // After any structural key (Tab/Enter/Backspace), refresh markers
              if (e.key === 'Tab' || e.key === 'Enter' || e.key === 'Backspace') {
                setTimeout(() => refreshListMarkers(e.target.closest('.details-richtext')), 0);
              }
            }}
            ref={detailsRef}
          />

          <div className="date-project-row">
            <div className="due-date-display">
              <label className="details-label" style={{ margin: 0 }}>Due Date:</label>
              {/* Was a native <input type="date">. On iOS the picker is a
                  browser overlay bound to a DOM node, and this app re-creates
                  task rows on parent renders - when the node is swapped
                  mid-interaction iOS commits the highlighted value (today)
                  and tears the sheet down, which is the "sets today and
                  closes on first tap" bug. InlineDatePicker is React-rendered,
                  so there is no overlay to lose and it can only ever write a
                  date that was actually tapped. It also carries its own clear
                  button, which the native field had no reliable equivalent
                  for. */}
              <InlineDatePicker
                value={task.dueDate || ''}
                onChange={(v) => updateTaskDueDate(listName, task.id, v)}
              />
            </div>

            {/* Hidden when Projects is switched off. Any existing projectId
                is preserved untouched, so re-enabling restores the link. */}
            {isFeatureOn('projects') && (() => {
              // Replaces a native <select>. Its popup is drawn by the browser
              // as OS chrome - no rounded corners, no theming beyond the
              // option colours - so it was the one control in the app that
              // couldn't be made to match. This is the same div-based pattern
              // the Goal, Timer and Report dropdowns already use.
              const chosen = getAllProjects().find(
                pr => String(pr.id) === String(task.projectId)
              );
              const pick = (value) => {
                assignTaskToProject(listName, task.id, value);
                setProjectDropdownOpen(false);
              };
              const optionStyle = (selected) => ({
                padding: '10px 14px',
                color: 'var(--text)',
                fontSize: '0.9rem',
                cursor: 'pointer',
                background: selected ? 'rgba(var(--accent-rgb), 0.25)' : 'transparent',
                borderBottom: '1px solid rgba(var(--accent-rgb), 0.15)',
                transition: 'background 0.2s ease'
              });
              return (
                <div className="due-date-display">
                  <label className="details-label" style={{ margin: 0 }}>Project:</label>
                  <div style={{ position: 'relative', flex: 1, minWidth: 0 }}>
                    <div
                      onClick={(e) => e.stopPropagation()}
                      onMouseDown={(e) => {
                        // Toggled on mousedown, and stopped there, so the
                        // document-level close listener below never sees the
                        // tap that opened it - otherwise it would open and
                        // shut in the same gesture.
                        e.stopPropagation();
                        setProjectDropdownOpen(o => !o);
                      }}
                      onTouchStart={(e) => e.stopPropagation()}
                      className="project-selector"
                      style={{
                        display: 'flex', alignItems: 'center',
                        justifyContent: 'space-between', gap: '8px'
                      }}
                    >
                      <span style={{
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                        color: chosen ? 'var(--text)' : 'var(--text-muted)'
                      }}>
                        {chosen ? chosen.name : 'No project'}
                      </span>
                      <span style={{
                        transform: projectDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                        transition: 'transform 0.2s ease',
                        fontSize: '0.7rem', flexShrink: 0
                      }}>▼</span>
                    </div>

                    {projectDropdownOpen && (
                      <div
                        onClick={(e) => e.stopPropagation()}
                        onMouseDown={(e) => e.stopPropagation()}
                        onTouchStart={(e) => e.stopPropagation()}
                        style={{
                          position: 'absolute', top: '100%', left: 0, right: 0,
                          marginTop: '4px',
                          background: 'rgba(var(--surface-rgb), 1)',
                          border: '2px solid rgba(var(--accent-rgb), 0.3)',
                          borderRadius: '12px',
                          overflow: 'hidden',
                          // Long project lists shouldn't run off the card.
                          maxHeight: '220px', overflowY: 'auto',
                          zIndex: 1000,
                          boxShadow: '0 8px 24px rgba(var(--shadow-rgb), 0.35)'
                        }}
                      >
                        <div
                          onClick={() => pick(null)}
                          style={{ ...optionStyle(!task.projectId), color: 'var(--text-muted)' }}
                        >
                          No project
                        </div>
                        {getAllProjects().map(pr => (
                          <div
                            key={pr.id}
                            onClick={() => pick(pr.id)}
                            style={optionStyle(String(pr.id) === String(task.projectId))}
                          >
                            {pr.name}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })()}
          </div>

          <div className="fire-flag-selector">
            <span 
              className={`fire-flag-icon clickable ${task.priority === 'high' ? 'active' : ''}`}
              onClick={(e) => {
                e.stopPropagation();
                updateTaskPriority(listName, task.id, task.priority === 'high' ? 'low' : 'high');
              }}
              title="Pin to top"
            >
              {task.priority === 'high' ? <LitFlame /> : <UnlitFlame />}
            </span>
          </div>

          <div className="date-field">
            <label className="details-label" style={{ margin: 0 }}>Created:</label>
            <span className="date-field-value">{createdDate}</span>
          </div>

          {task.completed && (
            <div className="date-field">
              <label className="details-label" style={{ margin: 0 }}>Completed:</label>
              <span className="date-field-value">{completedDate}</span>
            </div>
          )}

          <div className="task-actions">
            {showMoveButtons && !task.completed && (
              <>
                {task.section === 'todo' && (
                  <button 
                    className="edit-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      moveTaskToSection(listName, task.id, 'backlog');
                    }}
                  >
                    → Backlog
                  </button>
                )}
                {task.section === 'backlog' && (
                  <button 
                    className="edit-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      moveTaskToSection(listName, task.id, 'todo');
                    }}
                  >
                    → To Do
                  </button>
                )}
              </>
            )}
            {task.completed && (
              <button
                className="edit-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  archiveTask(listName, task.id);
                }}
              >
                Archive
              </button>
            )}
            {canDeleteShared && (
              <button
                className="delete-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  deleteTask(listName, task.id);
                }}
              >
                Delete
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

function LittleFiresApp() {
  // ---- Guarded storage ----------------------------------------------------
  // localStorage.setItem throws when the quota is exceeded, and in Safari
  // private browsing it can throw on every write. Unguarded, that surfaces as
  // an unhandled exception inside a useEffect and persistence silently stops -
  // you'd only notice after losing work. This surfaces it instead.
  const [storageError, setStorageError] = useState(null);
  // In-app confirmation, because window.confirm cannot be relied on here.
  // A sandboxed iframe without allow-modals blocks it outright - it returns
  // false and never shows anything, so every destructive action guarded by it
  // silently did nothing. Some embedded webviews suppress it too.
  //
  // Promise-based so call sites read almost exactly as they did:
  //   if (!(await confirmAction(msg))) return;
  const [confirmRequest, setConfirmRequest] = useState(null);
  const confirmAction = (message, confirmLabel = 'Delete') =>
    new Promise(resolve => setConfirmRequest({ message, confirmLabel, resolve }));
  const settleConfirm = (answer) => {
    setConfirmRequest(prev => {
      if (prev) prev.resolve(answer);
      return null;
    });
  };

  // Creating a list no longer takes a name up front - the button makes one with
  // a placeholder name and you rename it in place, using the same field every
  // other list already has. That removed the last text input from this card,
  // which is just as well: it lived inside a component defined during render,
  // so every keystroke remounted it and threw away focus after one character.
  const addListQuick = (shared) => {
    const base = shared ? 'New Shared List' : 'New List';
    let name = base;
    let n = 2;
    // addCustomList rejects duplicate labels across both sets, so the name has
    // to be unique before it's offered.
    while (TASK_LISTS.some(k => listLabel(k).toLowerCase() === name.toLowerCase())) {
      name = `${base} ${n}`;
      n += 1;
    }
    setListMessage(addCustomList(name, shared));
  };
  const [listMessage, setListMessage] = useState(null);
  const [draggingList, setDraggingList] = useState(null);
  const [dragOverList, setDragOverList] = useState(null);
  const safeSetItem = React.useCallback((key, value) => {
    try {
      localStorage.setItem(key, value);
      return true;
    } catch (err) {
      const quota = err && (err.name === 'QuotaExceededError' ||
        err.name === 'NS_ERROR_DOM_QUOTA_REACHED' || err.code === 22);
      setStorageError(quota
        ? "Storage is full, so recent changes aren't being saved. Export a backup from Settings, then remove some archived tasks or old notes."
        : "This browser is blocking local storage, so changes won't be saved. Private browsing mode is the usual cause.");
      console.error('localStorage write failed for ' + key + ':', err);
      return false;
    }
  }, []);


  // Persistence is debounced and coalesced per key.
  //
  // Each of these keys holds an entire collection as one JSON blob, and each
  // was rewritten in full, synchronously, on every change to its state - so
  // ticking one checkbox re-serialised and wrote the whole task list, on the
  // main thread. Batching turns a burst of edits into a single write, and
  // deferring the stringify means the serialisation cost is paid once too.
  //
  // The value is passed as a thunk rather than a string precisely so that
  // stringify is skipped for every superseded write. A later call for the same
  // key replaces the earlier thunk, so only the final state is ever encoded.
  const pendingWritesRef = React.useRef(new Map());
  const flushTimerRef = React.useRef(null);

  const flushWrites = React.useCallback(() => {
    if (flushTimerRef.current) {
      clearTimeout(flushTimerRef.current);
      flushTimerRef.current = null;
    }
    const pending = pendingWritesRef.current;
    if (!pending.size) return;
    pending.forEach((getValue, key) => {
      try {
        safeSetItem(key, getValue());
      } catch (err) {
        console.error('Deferred write failed for ' + key + ':', err);
      }
    });
    pending.clear();
  }, [safeSetItem]);

  const queueSetItem = React.useCallback((key, getValue) => {
    pendingWritesRef.current.set(key, getValue);
    if (flushTimerRef.current) clearTimeout(flushTimerRef.current);
    flushTimerRef.current = setTimeout(flushWrites, 400);
  }, [flushWrites]);

  // A debounce must never be able to cost data. Anything still pending is
  // written the moment the page is hidden or torn down - pagehide is the
  // reliable one on iOS, where unload often doesn't fire at all.
  useEffect(() => {
    const onHide = () => flushWrites();
    const onVisibility = () => { if (document.hidden) flushWrites(); };
    window.addEventListener('pagehide', onHide);
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      window.removeEventListener('pagehide', onHide);
      document.removeEventListener('visibilitychange', onVisibility);
      flushWrites();
    };
  }, [flushWrites]);

  const [appMode, setAppMode] = useState('tasks'); // 'tasks', 'projects', 'notes', 'goals', 'search', 'archive', 'time', 'calendar', 'reports'
  const [menuOpen, setMenuOpen] = useState(false);
  const [currentList, setCurrentList] = useState('master');
  const [archiveType, setArchiveType] = useState('tasks'); // 'tasks', 'goals', 'projects'
  const [archiveDropdownOpen, setArchiveDropdownOpen] = useState(false);
  const [reportTimeframe, setReportTimeframe] = useState(() => {
    try {
      const sv = localStorage.getItem('little_fires_settings');
      return sv ? (JSON.parse(sv).defaultReportTimeframe || 'thisWeek') : 'thisWeek';
    } catch { return 'thisWeek'; }
  }); // 'thisWeek','thisMonth','lastMonth','last3','last6','allTime'
  const [reportChartType, setReportChartType] = useState('line'); // 'line' or 'bar'
  const [reportTimeframeDropdownOpen, setReportTimeframeDropdownOpen] = useState(false);
  const [reportHoverIndex, setReportHoverIndex] = useState(null); // hovered bucket index for tooltip
  const [reportHiddenLists, setReportHiddenLists] = useState({}); // { work: true } => hidden from chart
  const [reportTaskStatus, setReportTaskStatus] = useState('complete'); // 'complete','open','both'
  const [reportStatusDropdownOpen, setReportStatusDropdownOpen] = useState(false);
  const [fireFillAnim, setFireFillAnim] = useState(0); // 0..1 animated multiplier for the rise-on-load effect
  const [fireFlicker, setFireFlicker] = useState(0); // toggles spike pattern for idle flicker
  // Narrow-screen flag. Many layout values live in inline styles (which media
  // queries can't reach), so we track viewport width in state instead.
  const [isMobile, setIsMobile] = useState(
    typeof window !== 'undefined' ? window.innerWidth <= 700 : false
  );
  // How long the report chart takes to draw itself in (lines sweep, bars grow).
  // The fire chart waits this long before igniting, so they run in sequence.
  const CHART_DRAW_MS = 1500;
  // How long the flame takes to rise, and how long the charts wait for it.
  // The charts start slightly before the flame finishes so the sequence reads
  // as one movement handing off to the next, rather than two animations with a
  // gap between them.
  const FIRE_FILL_MS = 2200;
  const CHART_START_DELAY_MS = Math.round(FIRE_FILL_MS * 0.75);

  // Curated accent presets. Each is dark enough that white text on the
  // gradient buttons stays readable - a free-form picker can't guarantee that,
  // so these are the safe path and the custom picker is the escape hatch.
  const ACCENT_PRESETS = [
    { id: 'matcha', name: 'Matcha',  accent: '#53745f', light: '#6a8f76' },
    { id: 'ember',  name: 'Ember',   accent: '#b45309', light: '#f59e0b' },
    { id: 'ocean',  name: 'Ocean',   accent: '#2563eb', light: '#60a5fa' },
    { id: 'plum',   name: 'Plum',    accent: '#7e22ce', light: '#a855f7' },
    { id: 'rose',   name: 'Rose',    accent: '#be123c', light: '#fb7185' },
    { id: 'slate',  name: 'Slate',   accent: '#475569', light: '#94a3b8' }
  ];

  const hexToRgbTriplet = (hex) => {
    const h = String(hex || '').replace('#', '');
    const full = h.length === 3 ? h.split('').map(c => c + c).join('') : h;
    const n = parseInt(full, 16);
    if (isNaN(n) || full.length !== 6) return '83, 116, 95';
    return `${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}`;
  };

  // Blend a colour toward neutral slate so it reads as a tinted grey rather
  // than a washed-out version of itself. Used for subtle chrome like the
  // header ring, which shouldn't compete with the flame.
  const muteHex = (hex, amount = 0.62) => {
    const h = String(hex || '').replace('#', '');
    const full = h.length === 3 ? h.split('').map(c => c + c).join('') : h;
    const n = parseInt(full, 16);
    if (isNaN(n) || full.length !== 6) return '107, 107, 122';
    const NEUTRAL = [107, 107, 122];
    const mix = (c, i) => Math.round(c * (1 - amount) + NEUTRAL[i] * amount);
    return [
      mix((n >> 16) & 255, 0),
      mix((n >> 8) & 255, 1),
      mix(n & 255, 2)
    ].join(', ');
  };

  // Derive a lighter companion shade for gradients by mixing toward white
  const lightenHex = (hex, amount = 0.22) => {
    const h = String(hex || '').replace('#', '');
    const full = h.length === 3 ? h.split('').map(c => c + c).join('') : h;
    const n = parseInt(full, 16);
    if (isNaN(n) || full.length !== 6) return '#6a8f76';
    const mix = (c) => Math.round(c + (255 - c) * amount);
    const r = mix((n >> 16) & 255), g = mix((n >> 8) & 255), b = mix(n & 255);
    return '#' + [r, g, b].map(v => v.toString(16).padStart(2, '0')).join('');
  };

  // The canonical task lists. These keys are also the storage keys, so they
  // never change - renaming only affects the display label.
  // Two sets of lists, stored and presented separately.
  //
  // Personal lists are yours alone. Shared lists are the ones a partner also
  // sees - today they behave the same and live in the same storage, but they
  // are the set that will be backed by the household once sync lands. Keeping
  // the split now means sync becomes a change of where one set is stored,
  // rather than a storage change plus a UI redesign at the same time.
  //
  // A personal list can never become shared and a shared list never becomes
  // personal. That's what keeps this simple: a shared list is shared from
  // birth, so there's no history to expose and no migration to get wrong.
  const BUILT_IN_PERSONAL_LISTS = ['personal', 'work', 'home', 'travel', 'kids'];
  const BUILT_IN_SHARED_LISTS = ['partner'];
  const BUILT_IN_LISTS = [...BUILT_IN_PERSONAL_LISTS, ...BUILT_IN_SHARED_LISTS];
  // Each set gets its own allowance rather than sharing one.
  const MAX_LISTS_PER_SET = 10;
  // Colours offered to new lists, in order. Chosen to stay distinguishable
  // against each other and the dark background in the Reports legend.
  const LIST_COLOR_PALETTE = [
    '#f59e0b', '#8b5cf6', '#14b8a6', '#ef4444',
    '#84cc16', '#06b6d4', '#ec4899', '#a3a3a3'
  ];
  const DEFAULT_LIST_LABELS = {
    personal: 'Personal', work: 'Work', home: 'Home',
    travel: 'Travel', kids: 'Kids', partner: 'Partner'
  };

  // User-configurable settings, persisted like the rest of the app data.
  const DEFAULT_SETTINGS = {
    weeklyFireGoal: 7,        // tasks to fully light the flame for a week
    monthlyFireGoal: 30,      // ...and for a month
    defaultTimerDuration: '', // '' = open-ended "Timer"
    defaultReportTimeframe: 'thisWeek',
    completionDelay: true,    // pause so the checkmark is visible before a task moves
    // Fresh-install defaults: Ember accent, Lora & Inter, light theme.
    // Existing installs are held on the previous defaults by the pins in the
    // loader below - changing a default normally reaches everyone who never
    // overrode it, which is right for most keys but would silently restyle an
    // app somebody is already using.
    accentId: 'ember',        // preset id, or 'custom'
    customAccent: '#53745f',
    fontChoice: 'serif',      // Lora & Inter
    // 'system' follows the phone; 'dark' and 'light' pin it. Light is the
    // default for a fresh install - see the loader below, which keeps everyone
    // who was already using the app on what they had.
    theme: 'light',
    reduceMotion: false,
    // --- Pomodoro ---
    // Cirillo's canonical numbers: 25 work, 5 short, 15 long, long every 4th.
    pomodoroEnabled: false,
    pomodoroWork: 1500,
    pomodoroShortBreak: 300,
    pomodoroLongBreak: 900,
    pomodoroInterval: 4,
    pomodoroAutoStart: true,
    // Drops the frosted-glass backdrop blur and the ambient glow layer. Separate
    // from reduceMotion because it's not about motion: blur is a continuous GPU
    // cost, re-computed on every composite, whereas an animation costs only
    // while it runs. Defaults on for touch devices - see IS_TOUCH_DEVICE.
    batterySaver: IS_TOUCH_DEVICE,
    // --- Partner (shared list) ---
    // partnerName is the display name shown on shared tasks. It is separate
    // from listLabels.partner, which renames the list itself - one is a person,
    // the other is a tab.
    partnerName: 'Partner',
    partnerColor: '#f472b6',
    partnerAccountEmail: '',
    listLabels: { ...DEFAULT_LIST_LABELS },
    hiddenLists: {},          // { travel: true } => hidden from the app
    listOrder: null,          // user's drag-ordered keys; null = built-in order
    customLists: [],          // [{ key, label, color }] added by the user
    // Off by default, so a new install opens as a task list and nothing else.
    // Every one of these is discoverable in Settings > Menu Sections, and
    // switching one on never lost data - it was only ever hidden.
    // Search stays on: it's a way of getting around, not a section to manage.
    hiddenFeatures: { time: true, goals: true, projects: true, notes: true }
  };
  // Bump when the settings shape changes in a way that needs migrating
  const SETTINGS_VERSION = 1;
  // True once the user has actually touched the Battery Saver switch. Distinct
  // from the setting's own value, because that value can also be filled in
  // automatically below - and only a real choice should be treated as one.
  // Set synchronously inside the settings initializer just below, before
  // anything else reads it.
  const batterySaverUserChoiceRef = React.useRef(false);

  const [settings, setSettings] = useState(() => {
    try {
      const saved = localStorage.getItem('little_fires_settings');
      if (!saved) return DEFAULT_SETTINGS;
      const parsed = JSON.parse(saved);
      // Changing a default normally reaches everyone, because only deltas are
      // stored - that's the point of the delta scheme. It's the wrong outcome
      // for theme: someone who has been using a dark app would open it one day
      // to find it light, having changed nothing.
      //
      // Narrower than it looks now. The persistence effect writes `theme`
      // unconditionally, so any blob saved by current code HAS the key and
      // never reaches this line. Only a blob written before that change can
      // be missing it - a genuine pre-existing install, which is precisely
      // who this pin is for. It used to catch everyone, including fresh
      // installs on their second launch, which is what made a chosen Light
      // theme revert to the phone's dark setting on every open.
      if (parsed.theme === undefined) parsed.theme = 'system';
      // Same treatment, same reasoning, for the two other look-and-feel
      // defaults that changed when Ember and Lora & Inter became the
      // fresh-install look. Current code writes both keys unconditionally, so
      // a blob missing them predates that change and belongs to someone
      // already using the app: hold them on what they had.
      if (parsed.accentId === undefined) parsed.accentId = 'matcha';
      if (parsed.fontChoice === undefined) parsed.fontChoice = 'default';
      // Same reasoning as theme, and it matters more here: someone already
      // using Notes or Projects would open the app one day to find those
      // sections simply gone. A stored blob means an existing install, so
      // anyone who never touched these keeps everything switched on.
      if (parsed.hiddenFeatures === undefined) parsed.hiddenFeatures = {};
      if ('batterySaver' in parsed) batterySaverUserChoiceRef.current = true;
      return { ...DEFAULT_SETTINGS, ...parsed };
    } catch {
      return DEFAULT_SETTINGS;
    }
  });

  // Battery Saver defaults on for touch devices, resolved synchronously via
  // IS_TOUCH_DEVICE. A laptop isn't touch but drains a real battery the same
  // way, and until now the setting did nothing for it. This fills in the one
  // case IS_TOUCH_DEVICE can't see: on battery power, not plugged in.
  //
  // Resolved once, not watched continuously. A live listener that flipped the
  // setting the instant you plugged in would mean the app's chrome changing
  // while you're using it, for a decision you didn't make - closing the lid
  // and reopening later is a natural point to re-check; mid-session isn't.
  //
  // Battery Status API support is inconsistent across browsers, so its absence
  // is treated as "cannot tell," not "must be plugged in" - nothing here fires
  // where it's unavailable, and desktop keeps exactly today's behaviour there.
  useEffect(() => {
    if (IS_TOUCH_DEVICE) return;                    // already resolved correctly
    if (batterySaverUserChoiceRef.current) return;  // user has an actual opinion
    if (typeof navigator === 'undefined' || typeof navigator.getBattery !== 'function') return;

    let cancelled = false;
    navigator.getBattery().then((battery) => {
      if (cancelled || batterySaverUserChoiceRef.current) return;
      setSettings(prev => ({ ...prev, batterySaver: !battery.charging }));
    }).catch(() => {}); // advisory only - never let a rejected promise surface

    return () => { cancelled = true; };
  }, []);

  // Persist only what the user has actually changed. Writing the whole object
  // would freeze today's defaults into their storage forever - so a default we
  // change later would never reach anyone who'd already opened the app once.
  useEffect(() => {
    const overrides = { _v: SETTINGS_VERSION };
    Object.keys(DEFAULT_SETTINGS).forEach(k => {
      // Battery Saver has two rules, not the usual one.
      //
      // Auto-detected guesses are excluded entirely, or persisting one would
      // be self-defeating: unplugging today writes an override of true, the
      // effect above then sees a stored value and assumes it was chosen, and
      // it stops checking - so the setting stays stuck on forever, even after
      // being plugged back in.
      //
      // Once the user HAS chosen a value, it is written unconditionally - even
      // if it happens to match today's static default. That exception is
      // necessary specifically here: DEFAULT_SETTINGS.batterySaver on desktop
      // is always false, so "I chose off" and "I never touched it" produce the
      // identical value. The generic equals-default check below can't tell
      // those apart, and without this, choosing off would go unrecorded and
      // the next auto-detect could silently override it back to on.
      if (k === 'batterySaver') {
        if (batterySaverUserChoiceRef.current) overrides.batterySaver = settings.batterySaver;
        return;
      }
      // Theme is always written, for the same reason batterySaver is: its
      // chosen value can equal the default, and the generic check below
      // cannot tell "I chose Light" from "I never touched it".
      //
      // That distinction is not cosmetic here. DEFAULT_SETTINGS.theme is
      // 'light', so choosing Light used to write nothing at all - and the
      // loader treats a stored blob with no theme key as an existing install
      // and pins it to 'system'. On a phone set to dark, the app therefore
      // reopened dark every single time, no matter how often Light was
      // chosen. It also caught fresh installs, because this effect writes a
      // blob on first mount, so by the second launch every install looked
      // like an "existing" one.
      //
      // With the key always present, a blob that lacks it can only have been
      // written before this change - a genuine pre-existing install - which
      // is exactly what the loader's pin was written for, so that pin stays.
      if (k === 'theme') {
        overrides.theme = settings.theme;
        return;
      }
      // accentId and fontChoice need the identical exception, and for the
      // identical reason: both now have a fresh-install default a user can
      // also choose deliberately (Ember, Lora & Inter). Under the generic
      // equals-default check, choosing the default writes nothing, the
      // loader's pin above then reads the key as absent, and the choice
      // reverts to the old default on the next launch - which is exactly the
      // bug that made a chosen Light theme reopen dark.
      if (k === 'accentId' || k === 'fontChoice') {
        overrides[k] = settings[k];
        return;
      }
      if (JSON.stringify(settings[k]) !== JSON.stringify(DEFAULT_SETTINGS[k])) {
        overrides[k] = settings[k];
      }
    });
    safeSetItem('little_fires_settings', JSON.stringify(overrides));
  }, [settings]);

  // The accent resolved to real colour values. Shared by the CSS-variable
  // effect below and by the icon effect, which needs an actual hex - a canvas
  // can't read a CSS variable.
  const accentColors = (() => {
    const preset = ACCENT_PRESETS.find(p => p.id === settings.accentId);
    const accent = preset ? preset.accent : (settings.customAccent || '#53745f');
    return { accent, light: preset ? preset.light : lightenHex(accent) };
  })();

  // Push the chosen accent into CSS variables on :root, so every rule and
  // inline style that references var(--accent) updates at once.
  useEffect(() => {
    const accent = accentColors.accent;
    const light = accentColors.light;
    const root = document.documentElement;
    root.style.setProperty('--accent', accent);
    root.style.setProperty('--accent-light', light);
    root.style.setProperty('--accent-rgb', hexToRgbTriplet(accent));
    root.style.setProperty('--accent-muted-rgb', muteHex(accent));
  }, [settings.accentId, settings.customAccent]);

  // Partner colour, same mechanism as the accent. Pushed into CSS variables so
  // the badge and the assign pill both follow it without either needing an
  // inline style.
  useEffect(() => {
    const colour = settings.partnerColor || '#f472b6';
    const root = document.documentElement;
    root.style.setProperty('--partner', colour);
    root.style.setProperty('--partner-rgb', hexToRgbTriplet(colour));
  }, [settings.partnerColor]);

  // Favicon, iOS home-screen icon, browser theme colour. Re-runs on accent
  // change so all three follow it.
  //
  // Worth knowing: iOS reads apple-touch-icon at the moment someone taps "Add
  // to Home Screen" and caches it. An icon already on a home screen will not
  // repaint when the accent changes here - that only affects installs made
  // afterwards. theme-color, by contrast, does update live.
  useEffect(() => {
    const accent = accentColors.accent;

    // The fill is a parameter because the two icons need different treatment:
    // the favicon sits on a browser tab of unknown colour, while the touch icon
    // sits on an accent-filled square and has to contrast with it.
    // The artwork is not centred in its own viewBox: measured bounds are
    // x 200-1091, y 7-933, so its centre is (645.5, 470.4) against a viewBox
    // centre of (640, 640). It sat high with dead space underneath, which is
    // what made the icon read small. Re-centred explicitly rather than assumed.
    const FLAME_CX = 645.5;
    const FLAME_CY = 470.4;
    const FLAME_PATHS = `<path d="M7090 12669 c-1 -257 -76 -628 -175 -871 -149 -365 -354 -643 -825 -1123 -562 -572 -1053 -1165 -1415 -1710 -256 -385 -443 -729 -568 -1045 -164 -415 -213 -716 -189 -1167 7 -126 17 -257 22 -293 4 -36 11 -87 15 -115 3 -27 17 -108 31 -180 66 -339 167 -634 321 -937 181 -358 383 -630 707 -954 206 -206 336 -319 558 -486 130 -98 458 -322 462 -316 1 1 20 53 40 113 45 131 132 315 211 452 58 99 233 361 296 443 231 303 515 606 864 926 411 375 725 680 839 814 99 117 243 309 323 432 261 403 385 922 386 1623 0 207 -4 314 -17 410 -76 586 -230 1136 -500 1782 -358 860 -885 1741 -1298 2168 l-87 90 -1 -56z"/><path d="M9510 9493 c0 -5 9 -55 21 -113 89 -462 132 -1021 110 -1453 -13 -249 -39 -482 -67 -597 -109 -438 -605 -1140 -1299 -1835 -126 -127 -291 -284 -365 -350 -160 -142 -223 -206 -374 -380 -276 -318 -452 -600 -476 -761 -5 -38 -19 -133 -31 -211 -21 -141 -21 -189 2 -261 8 -25 15 -32 28 -26 73 31 289 101 416 134 203 54 418 97 820 164 894 149 1116 222 1550 511 387 257 676 553 814 833 98 197 195 572 233 892 19 165 16 597 -5 780 -104 913 -509 1833 -1058 2404 -105 109 -294 276 -312 276 -4 0 -7 -3 -7 -7z"/><path d="M3355 8046 c-199 -134 -336 -247 -523 -430 -189 -186 -290 -306 -418 -498 -270 -403 -415 -856 -401 -1261 8 -258 75 -514 202 -772 237 -481 641 -873 1170 -1135 358 -177 715 -283 1170 -349 153 -22 511 -54 546 -49 16 2 -12 23 -107 82 -709 437 -1164 850 -1434 1303 -118 197 -228 493 -244 653 -4 36 -11 92 -16 125 -5 33 -16 116 -25 185 -8 69 -20 163 -26 210 -6 47 -13 196 -16 332 -5 240 4 411 38 673 5 44 12 98 15 120 3 22 9 65 14 95 5 30 12 73 16 95 26 174 135 576 188 698 5 9 4 17 0 17 -5 0 -72 -43 -149 -94z"/>`;

    // scale is relative to the viewBox, so 1 keeps the original size. `ring`
    // draws an enclosing circle; its stroke reaches to about 8 units from the
    // canvas edge, so the icon fills the space a bare flame left empty.
    const flameSVG = (fill, { ring = null, scale = 1 } = {}) => {
      const circle = ring
        ? `<circle cx="640" cy="640" r="600" fill="none" stroke="${ring}" stroke-width="64"/>`
        : '';
      // Two nested transforms: the inner one is the artwork's own coordinate
      // mapping and must not change; the outer works in viewBox space to
      // centre and scale it.
      return `<svg version="1.0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1280 1280">`
        + circle
        + `<g transform="translate(640,640) scale(${scale}) translate(${-FLAME_CX},${-FLAME_CY})">`
        + `<g transform="translate(0,1280) scale(0.1,-0.1)" fill="${fill}">${FLAME_PATHS}</g>`
        + `</g></svg>`;
    };
    const toURI = (markup) => 'data:image/svg+xml,' + encodeURIComponent(markup);

    document.querySelectorAll("link[rel*='icon']").forEach(l => l.remove());
    const link = document.createElement('link');
    link.rel = 'icon';
    link.type = 'image/svg+xml';
    // Black flame in a black ring, matching the logo in the app header.
    // 0.85 keeps the flame clear of the ring: at full size its bounding
    // half-diagonal is 642 against an inner ring radius of 568.
    link.href = toURI(flameSVG('#000000', { ring: '#000000', scale: 0.85 }));
    document.head.appendChild(link);

    // iOS home-screen icon: cream flame on an accent square.
    const canvas = document.createElement('canvas');
    canvas.width = 180;
    canvas.height = 180;
    const ctx = canvas.getContext('2d');
    // This was `ctx.fillStyle = 'var(--accent)'`. A canvas has no CSS variable
    // resolution, and assigning an invalid colour to fillStyle is silently
    // ignored - the previous value stands, which is black by default. Combined
    // with the artwork's own black fill, the icon rendered as a black flame on
    // a black square. Canvas needs a resolved value, hence accentColors.
    ctx.fillStyle = accent;
    ctx.fillRect(0, 0, 180, 180);

    const img = new Image();
    img.onload = () => {
      const size = 140;
      const pos = (180 - size) / 2;
      ctx.drawImage(img, pos, pos, size, size);
      const appleTouchLink = document.createElement('link');
      appleTouchLink.rel = 'apple-touch-icon';
      appleTouchLink.href = canvas.toDataURL('image/png');
      document.head.appendChild(appleTouchLink);
    };
    img.src = toURI(flameSVG('var(--text)', { scale: 0.92 }));

    // Updated in place rather than appended - this effect re-runs on every
    // accent change, and the previous version created duplicate tags each time.
    const upsertMeta = (name, content) => {
      let meta = document.head.querySelector('meta[name="' + name + '"]');
      if (!meta) {
        meta = document.createElement('meta');
        meta.name = name;
        document.head.appendChild(meta);
      }
      meta.content = content;
    };
    upsertMeta('apple-mobile-web-app-capable', 'yes');
    upsertMeta('apple-mobile-web-app-status-bar-style', 'black-translucent');
    upsertMeta('apple-mobile-web-app-title', 'Little Fires');
    // Tints the browser toolbar and the app's card in the task switcher.
    upsertMeta('theme-color', accent);

    document.title = 'Little Fires';
  }, [accentColors.accent]);

  // In-app reduced motion toggle (the OS-level preference is handled in CSS)
  useEffect(() => {
    document.body.classList.toggle('reduce-motion', !!settings.reduceMotion);
    return () => document.body.classList.remove('reduce-motion');
  }, [settings.reduceMotion]);

  // Font. The variables are set on <html> alongside the theme tokens.
  //
  // Only the family in use is ever requested - loading all five upfront would
  // mean downloading four families nobody is using on every visit. The first
  // request happens in index.html's boot script, before first paint, because
  // doing it here meant a non-default family wasn't even asked for until
  // React had mounted: the app painted in the :root defaults, reflowed to the
  // fallback when these variables changed, then popped again when the real
  // font finally arrived. This effect now handles runtime switches, and finds
  // the boot script's link already in place on load.
  useEffect(() => {
    const choice = FONT_OPTIONS.find(f => f.id === settings.fontChoice) || FONT_OPTIONS[0];
    const root = document.documentElement;
    root.style.setProperty('--font-ui', choice.ui);
    root.style.setProperty('--font-body', choice.body);

    if (!choice.google) return;

    // Keyed by id so switching fonts twice doesn't stack duplicate <link>s -
    // and so the link the boot script in index.html already inserted for the
    // font in use is found here rather than requested again.
    //
    // 'default' is no longer special-cased. It used to be skipped because
    // index.html carried a static <link> for that pairing, but that link is
    // gone: it downloaded two families every visit for anyone using a
    // different font, competing with the one they actually wanted. The boot
    // script now requests whichever family is in use, and this branch covers
    // switching back to the default at runtime.
    const id = 'lf-font-' + choice.id;
    if (document.getElementById(id)) return;
    const link = document.createElement('link');
    link.id = id;
    link.rel = 'stylesheet';
    link.href = 'https://fonts.googleapis.com/css2?family=' + choice.google + '&display=swap';
    document.head.appendChild(link);
    // Deliberately not removed on cleanup: a font that has been swapped away
    // from is very likely to be swapped back to, and re-requesting it would
    // flash unstyled text again for no benefit.
  }, [settings.fontChoice]);

  // Theme. The class goes on <html> rather than <body> so the tokens are in
  // scope for anything portalled or rendered outside the app root, and so the
  // page background is right before React has mounted anything.
  //
  // "Before React has mounted" needs more than the class: the stylesheets are
  // React-rendered, so pre-bundle the class has no rules to trigger. An inline
  // script in index.html resolves the theme synchronously and sets the class
  // plus an inline background-color and color-scheme on <html> before first
  // paint. This effect then OWNS those two inline properties from mount on -
  // re-set on every apply, with the background read from the live --bg-1
  // token rather than hardcoded - so a runtime theme switch can never leave
  // the pre-paint background stale behind the container (it shows in
  // overscroll). If the resolution logic here changes, index.html's copy must
  // change with it: fresh install -> 'light', stored blob without a theme ->
  // 'system', parse failure -> 'light'.
  useEffect(() => {
    const root = document.documentElement;
    const apply = () => {
      const pref = settings.theme || 'system';
      const light = pref === 'light' || (
        pref === 'system' &&
        typeof window.matchMedia === 'function' &&
        window.matchMedia('(prefers-color-scheme: light)').matches
      );
      root.classList.toggle('theme-light', light);
      // Class first, then read: the token reflects the theme just applied.
      const bg = getComputedStyle(root).getPropertyValue('--bg-1').trim();
      if (bg) root.style.backgroundColor = bg;
      root.style.colorScheme = light ? 'light' : 'dark';
    };
    apply();
    // Only follow the OS while set to 'system' - otherwise an explicit choice
    // would be overridden the moment the phone switched at sunset.
    if ((settings.theme || 'system') !== 'system') return;
    const mq = window.matchMedia('(prefers-color-scheme: light)');
    if (mq.addEventListener) mq.addEventListener('change', apply);
    else mq.addListener(apply);
    return () => {
      if (mq.removeEventListener) mq.removeEventListener('change', apply);
      else mq.removeListener(apply);
    };
  }, [settings.theme]);

  useEffect(() => {
    document.body.classList.toggle('battery-saver', !!settings.batterySaver);
    return () => document.body.classList.remove('battery-saver');
  }, [settings.batterySaver]);

  // The CSS guards cover anything driven by a transition or keyframe, but not
  // motion started from JS - scrollIntoView({behavior:'smooth'}) ignores them
  // entirely. Checked here so both the OS setting and the in-app toggle apply.
  const prefersReducedMotion = () =>
    !!settings.reduceMotion ||
    (typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches);

  // Keep whatever you're typing in above the on-screen keyboard.
  //
  // iOS shrinks the *visual* viewport when the keyboard opens but leaves the
  // layout viewport alone, so the page has no idea the bottom half is covered.
  // Anything relying on layout coordinates - scrollIntoView included - happily
  // concludes the caret is visible while it sits behind the keys.
  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;

    // The caret, not the field: the details editor can be taller than the
    // visible band, and scrolling its bottom edge into view would overshoot
    // the line actually being typed on.
    const caretRect = () => {
      const sel = window.getSelection();
      if (sel && sel.rangeCount) {
        const r = sel.getRangeAt(0).getBoundingClientRect();
        if (r && (r.top || r.bottom)) return r;
      }
      return null;
    };

    // Whichever ancestor actually scrolls - on mobile that's .tasks-container,
    // not the window.
    const scrollableAncestor = (el) => {
      let node = el.parentElement;
      while (node && node !== document.body) {
        const style = window.getComputedStyle(node);
        if (/(auto|scroll)/.test(style.overflowY) && node.scrollHeight > node.clientHeight) {
          return node;
        }
        node = node.parentElement;
      }
      return null;
    };

    let frame = null;
    const reveal = () => {
      // Nothing is covering the caret unless the keyboard is up, and this runs
      // on every selectionchange - which is every keystroke. Both
      // getBoundingClientRect and getComputedStyle below force a synchronous
      // layout, so the cheap comparison goes first: with no keyboard the visual
      // viewport is the full height and there is nothing to do.
      if (vv.height >= window.innerHeight - 80) return;

      const el = document.activeElement;
      if (!el) return;
      // Only text entry moves the caret behind the keyboard. A checkbox has no
      // caret to keep visible, and it takes focus when tapped - so without this
      // the tap fired a selectionchange and scrolled the list under your finger.
      const textInput = el.tagName === 'INPUT' &&
        !['checkbox', 'radio', 'button', 'submit', 'range', 'color', 'file']
          .includes((el.type || '').toLowerCase());
      const editable = el.isContentEditable || el.tagName === 'TEXTAREA' || textInput;
      if (!editable) return;

      const rect = caretRect() || el.getBoundingClientRect();
      // Bottom of the area still visible above the keyboard, plus a little
      // breathing room so the caret isn't flush against it.
      const visibleBottom = vv.height + vv.offsetTop;
      const overlap = rect.bottom - visibleBottom + 16;
      if (overlap <= 0) return;

      const scroller = scrollableAncestor(el);
      if (scroller) scroller.scrollTop += overlap;
      else window.scrollBy(0, overlap);
    };

    // The viewport resizes as the keyboard animates in; wait for a frame so the
    // measurement is taken against its settled size.
    const onChange = () => {
      if (frame) cancelAnimationFrame(frame);
      frame = requestAnimationFrame(reveal);
    };

    vv.addEventListener('resize', onChange);
    document.addEventListener('selectionchange', onChange);
    return () => {
      vv.removeEventListener('resize', onChange);
      document.removeEventListener('selectionchange', onChange);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  // ---- Backup: export / import -------------------------------------------
  // The export is a plain, versioned JSON file. Versioning matters: without it
  // a backup taken today can't be safely interpreted after the data shape
  // changes, and old backups quietly become unrestorable.
  const BACKUP_SCHEMA_VERSION = 1;
  const [backupStatus, setBackupStatus] = useState(null); // { type, message }
  const importInputRef = React.useRef(null);

  const countKeyed = (obj) =>
    Object.values(obj || {}).reduce((n, arr) => n + (Array.isArray(arr) ? arr.length : 0), 0);

  const buildBackup = () => ({
    app: 'little-fires',
    schemaVersion: BACKUP_SCHEMA_VERSION,
    exportedAt: new Date().toISOString(),
    summary: {
      tasks: countKeyed(allLists),
      archivedTasks: countKeyed(archivedTasks),
      notes: (notes || []).length,
      projects: countKeyed(projects),
      goals: countKeyed(goals),
      timeLogs: (standaloneTimeLogs || []).length
    },
    data: {
      lists: allLists,
      archived: archivedTasks,
      notes: notes,
      projects: projects,
      goals: goals,
      timeLogs: standaloneTimeLogs,
      settings: settings
    }
  });

  const exportBackup = () => {
    try {
      const payload = buildBackup();
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const stamp = new Date().toISOString().slice(0, 10);
      const a = document.createElement('a');
      a.href = url;
      a.download = `little-fires-backup-${stamp}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      // Release the object URL so it isn't held in memory
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      const s = payload.summary;
      setBackupStatus({
        type: 'ok',
        message: `Exported ${s.tasks} tasks, ${s.archivedTasks} archived, ${s.notes} notes, ${s.projects} projects, ${s.goals} goals.`
      });
    } catch (err) {
      setBackupStatus({ type: 'error', message: 'Export failed: ' + err.message });
    }
  };

  // Merge helpers - dedupe by id so re-importing the same file is a no-op
  const mergeById = (existing, incoming) => {
    const base = Array.isArray(existing) ? existing : [];
    const seen = new Set(base.map(x => String(x && x.id)));
    const add = (Array.isArray(incoming) ? incoming : []).filter(x => x && !seen.has(String(x.id)));
    return { merged: [...base, ...add], added: add.length };
  };

  const mergeKeyed = (existing, incoming) => {
    const out = { ...(existing || {}) };
    let added = 0;
    Object.keys(incoming || {}).forEach(k => {
      const r = mergeById(out[k], incoming[k]);
      out[k] = r.merged;
      added += r.added;
    });
    return { merged: out, added };
  };

  // Rich text from an imported file is untrusted: the file may not have come
  // from this app at all. Cleaned once at the boundary so nothing downstream
  // has to remember to, and so the stored value is already safe.
  const cleanImportedRichText = (d) => {
    const cleanTasks = (byList) => {
      if (!byList || typeof byList !== 'object') return byList;
      const out = {};
      Object.keys(byList).forEach(k => {
        out[k] = Array.isArray(byList[k])
          ? byList[k].map(t => (t && t.details) ? { ...t, details: sanitizeRichText(t.details) } : t)
          : byList[k];
      });
      return out;
    };
    return {
      ...d,
      lists: cleanTasks(d.lists),
      archived: cleanTasks(d.archived),
      notes: Array.isArray(d.notes)
        ? d.notes.map(n => (n && n.content) ? { ...n, content: sanitizeRichText(n.content) } : n)
        : d.notes
    };
  };

  const applyBackup = (payload, mode) => {
    const d = cleanImportedRichText(payload.data || {});
    if (mode === 'replace') {
      if (d.lists) setAllLists(d.lists);
      if (d.archived) setArchivedTasks(d.archived);
      if (Array.isArray(d.notes)) setNotes(d.notes);
      if (d.projects) setProjects(d.projects);
      if (d.goals) setGoals(d.goals);
      if (Array.isArray(d.timeLogs)) setStandaloneTimeLogs(d.timeLogs);
      if (d.settings) setSettings(prev => ({ ...prev, ...d.settings }));
      const s = payload.summary || {};
      return `Replaced everything with the backup: ${s.tasks || 0} tasks, ${s.notes || 0} notes, ${s.projects || 0} projects.`;
    }
    // Merge - additive only, never overwrites or deletes what you already have.
    // Settings are deliberately left alone here; silently changing your theme
    // and list names during a data merge would be surprising.
    let counts = { tasks: 0, archived: 0, notes: 0, projects: 0, goals: 0, timeLogs: 0 };
    if (d.lists) { const r = mergeKeyed(allLists, d.lists); setAllLists(r.merged); counts.tasks = r.added; }
    if (d.archived) { const r = mergeKeyed(archivedTasks, d.archived); setArchivedTasks(r.merged); counts.archived = r.added; }
    if (d.projects) { const r = mergeKeyed(projects, d.projects); setProjects(r.merged); counts.projects = r.added; }
    if (d.goals) { const r = mergeKeyed(goals, d.goals); setGoals(r.merged); counts.goals = r.added; }
    if (Array.isArray(d.notes)) { const r = mergeById(notes, d.notes); setNotes(r.merged); counts.notes = r.added; }
    if (Array.isArray(d.timeLogs)) { const r = mergeById(standaloneTimeLogs, d.timeLogs); setStandaloneTimeLogs(r.merged); counts.timeLogs = r.added; }

    const parts = Object.entries(counts).filter(([, v]) => v > 0).map(([k, v]) => `${v} ${k}`);
    return parts.length
      ? `Added ${parts.join(', ')}. Existing items were left untouched.`
      : 'Nothing new to add — everything in that backup is already here.';
  };

  const handleImportFile = (file, mode) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const payload = JSON.parse(e.target.result);

        // Validate before touching anything
        if (!payload || payload.app !== 'little-fires') {
          setBackupStatus({ type: 'error', message: "That doesn't look like a Little Fires backup." });
          return;
        }
        if (Number(payload.schemaVersion) > BACKUP_SCHEMA_VERSION) {
          setBackupStatus({
            type: 'error',
            message: 'That backup was made by a newer version of the app. Update first, then import.'
          });
          return;
        }
        if (!payload.data || typeof payload.data !== 'object') {
          setBackupStatus({ type: 'error', message: 'That backup file looks incomplete.' });
          return;
        }

        // Snapshot current state first, so a bad import is recoverable
        try {
          safeSetItem('little_fires_pre_import_backup', JSON.stringify(buildBackup()));
        } catch (_) { /* storage full - proceed anyway */ }

        const message = applyBackup(payload, mode);
        setBackupStatus({ type: 'ok', message });
      } catch (err) {
        setBackupStatus({ type: 'error', message: 'Could not read that file: ' + err.message });
      }
    };
    reader.onerror = () => setBackupStatus({ type: 'error', message: 'Could not read that file.' });
    reader.readAsText(file);
  };

  // ---- CSV export ---------------------------------------------------------
  // Analysis format, not a backup format: a flat table can't round-trip the
  // nested detail HTML or the list structure, so JSON stays the restore path.

  // Task details are stored as HTML. Flatten to readable plain text, keeping
  // checkbox state as [1]/[0] so sub-items stay readable and countable.
  const htmlToPlainText = (html) => {
    if (!html) return '';
    let s = String(html);
    // Preserve checkbox state before tags are stripped
    s = s.replace(/<input[^>]*type=["']checkbox["'][^>]*checked[^>]*>/gi, '[1] ');
    s = s.replace(/<input[^>]*type=["']checkbox["'][^>]*>/gi, '[0] ');
    s = s.replace(/<li[^>]*>/gi, '• ');
    s = s.replace(/<br\s*\/?>/gi, '\n');
    s = s.replace(/<\/(div|p|li|tr|h[1-6])>/gi, '\n');
    s = s.replace(/<[^>]+>/g, '');           // remaining tags
    s = s.replace(/&nbsp;/gi, ' ')
         .replace(/&amp;/gi, '&')
         .replace(/&lt;/gi, '<')
         .replace(/&gt;/gi, '>')
         .replace(/&quot;/gi, '"')
         .replace(/&#39;/gi, "'");
    return s.replace(/\n{3,}/g, '\n\n').replace(/[ \t]+/g, ' ').trim();
  };

  // Count checkboxes inside a task's details, and how many are ticked, so
  // sub-item progress is available as numbers you can sum or pivot on.
  const countSubtasks = (html) => {
    if (!html) return { total: 0, done: 0 };
    const all = String(html).match(/<input[^>]*type=["']checkbox["'][^>]*>/gi) || [];
    const done = all.filter(tag => /\schecked/i.test(tag)).length;
    return { total: all.length, done };
  };

  // RFC 4180 escaping - matters here because details contain commas,
  // quotes and newlines, any of which would otherwise break the columns.
  const csvCell = (value) => {
    const s = value === null || value === undefined ? '' : String(value);
    return /[",\n\r]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
  };

  const toCsv = (headers, rows) =>
    [headers.map(csvCell).join(','), ...rows.map(r => r.map(csvCell).join(','))].join('\r\n');

  const downloadFile = (content, filename, mime) => {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const fmtDate = (v) => {
    if (!v) return '';
    const d = new Date(v);
    return isNaN(d) ? '' : d.toISOString().slice(0, 10);
  };

  const exportTasksCsv = () => {
    try {
      const headers = [
        'List', 'Task', 'Completed', 'Section', 'High Priority',
        'Subtasks', 'Subtasks Done',
        'Due Date', 'Due Time', 'Created', 'Completed Date', 'Archived', 'Archived Date',
        'Project', 'Details'
      ];
      const projectNameById = {};
      Object.values(projects || {}).forEach(arr =>
        (arr || []).forEach(p => { if (p && p.id != null) projectNameById[String(p.id)] = p.name; })
      );

      const rows = [];
      const push = (task, listKey, archived) => {
        if (!task) return;
        const detailText = htmlToPlainText(task.details);
        // Count from the source HTML, not the flattened text, so a literal
        // "[1]" typed into a note can't inflate the numbers
        const subs = countSubtasks(task.details);
        const subTotal = subs.total;
        const subDone = subs.done;
        rows.push([
          listLabel(listKey),
          task.text || '',
          task.completed ? 1 : 0,
          task.section === 'backlog' ? 'Backlog' : 'To Do',
          task.priority === 'high' ? 1 : 0,
          subTotal,
          subDone,
          fmtDate(task.dueDate),
          task.dueTime || '',
          fmtDate(task.createdAt),
          fmtDate(task.completedAt),
          archived ? 1 : 0,
          archived ? fmtDate(task.archivedAt) : '',
          task.projectId != null ? (projectNameById[String(task.projectId)] || '') : '',
          detailText
        ]);
      };

      TASK_LISTS.forEach(key => {
        (allLists[key] || []).forEach(t => push(t, key, false));
        (archivedTasks[key] || []).forEach(t => push(t, key, true));
      });

      if (rows.length === 0) {
        setBackupStatus({ type: 'error', message: 'No tasks to export yet.' });
        return;
      }

      // BOM so Excel opens UTF-8 correctly (accents, emoji) on Windows
      const csv = '\uFEFF' + toCsv(headers, rows);
      downloadFile(csv, `little-fires-tasks-${new Date().toISOString().slice(0, 10)}.csv`, 'text/csv;charset=utf-8;');
      setBackupStatus({ type: 'ok', message: `Exported ${rows.length} tasks to CSV.` });
    } catch (err) {
      setBackupStatus({ type: 'error', message: 'CSV export failed: ' + err.message });
    }
  };

  const exportTimeLogsCsv = () => {
    try {
      const headers = ['Date', 'Minutes', 'Focus', 'Description', 'Take Away', 'Source'];
      const rows = [];
      (standaloneTimeLogs || []).forEach(l => {
        if (!l) return;
        rows.push([fmtDate(l.date || l.createdAt), l.minutes ?? '', l.focus || '', l.description || '', l.takeAway || '', 'Standalone']);
      });
      Object.entries(goals || {}).forEach(([listKey, arr]) =>
        (arr || []).forEach(g => (g.timeLogs || []).forEach(l => {
          rows.push([fmtDate(l.date || l.createdAt), l.minutes ?? '', l.focus || '', l.description || '', l.takeAway || '', `Goal: ${g.name}`]);
        }))
      );

      if (rows.length === 0) {
        setBackupStatus({ type: 'error', message: 'No time logs to export yet.' });
        return;
      }
      const csv = '\uFEFF' + toCsv(headers, rows);
      downloadFile(csv, `little-fires-timelogs-${new Date().toISOString().slice(0, 10)}.csv`, 'text/csv;charset=utf-8;');
      setBackupStatus({ type: 'ok', message: `Exported ${rows.length} time logs to CSV.` });
    } catch (err) {
      setBackupStatus({ type: 'error', message: 'CSV export failed: ' + err.message });
    }
  };

  const updateSetting = (key, value) => {
    // Marks this as the user's own decision, so the auto-detection effect
    // never revisits it and the persistence effect is now allowed to save it -
    // both of which are otherwise deliberately withheld from a guessed value.
    if (key === 'batterySaver') batterySaverUserChoiceRef.current = true;
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  // Display label for a list. Falls back to the built-in name if unset/blank.
  const listLabel = (key) => {
    const override = settings.listLabels && settings.listLabels[key];
    if (override && String(override).trim()) return String(override).trim();
    if (DEFAULT_LIST_LABELS[key]) return DEFAULT_LIST_LABELS[key];
    const found = customLists.find(c => c && c.key === key);
    return (found && found.label) || key;
  };
  // The partner's display name. Derived once at component scope because both
  // the task card and the add-task row need it, and a blank setting has to fall
  // back rather than render an empty badge.
  const partnerDisplayName = (settings.partnerName || '').trim() || 'Partner';
  // Section heading used in All Tasks / Search ("Work Tasks")
  const listSectionLabel = (key) => `${listLabel(key)} Tasks`;
  const isListHidden = (key) => !!(settings.hiddenLists && settings.hiddenLists[key]);
  // Lists the user has switched on. Used for anything user-facing; data
  // operations (auto-archive, project cleanup) still walk TASK_LISTS.
  // The user's order, reconciled against the canonical list: unknown keys are
  // dropped and any list they've never seen is appended, so adding a new list
  // in future can't strand it or duplicate it.
  // Full set of task lists: the built-ins plus anything the user has added.
  const customLists = Array.isArray(settings.customLists) ? settings.customLists : [];

  // Deliberately ONE flat namespace of keys. Seventeen places walk TASK_LISTS -
  // archive, calendar, reports, search, project cleanup - and every one of them
  // just wants "every list that exists". Splitting it into two arrays would
  // mean updating all of them, and any one missed would silently drop shared
  // lists from that view. So the split lives in storage and in the UI, and the
  // rest of the app keeps asking the same question it always did.
  const personalListKeys = [
    ...BUILT_IN_PERSONAL_LISTS,
    ...customLists.filter(c => c && c.key && !c.shared).map(c => c.key)
  ];
  const sharedListKeys = [
    ...BUILT_IN_SHARED_LISTS,
    ...customLists.filter(c => c && c.key && c.shared).map(c => c.key)
  ];
  const TASK_LISTS = [...personalListKeys, ...sharedListKeys];
  const isSharedList = (key) => sharedListKeys.includes(key);

  // Colour for a list - built-ins are fixed, custom ones carry their own.
  const BUILT_IN_LIST_COLORS = {
    personal: '#6a9d5f', work: '#3b82f6', home: '#4a7a3a',
    travel: '#7dd3fc', kids: '#f472b6', partner: '#f59e0b'
  };
  const listColor = (key) => {
    if (BUILT_IN_LIST_COLORS[key]) return BUILT_IN_LIST_COLORS[key];
    const found = customLists.find(c => c && c.key === key);
    return (found && found.color) || '#a3a3a3';
  };

  const orderedTaskLists = (() => {
    const saved = Array.isArray(settings.listOrder) ? settings.listOrder : [];
    const known = saved.filter(k => TASK_LISTS.includes(k));
    const deduped = known.filter((k, i) => known.indexOf(k) === i);
    const missing = TASK_LISTS.filter(k => !deduped.includes(k));
    return [...deduped, ...missing];
  })();

  const visibleTaskLists = orderedTaskLists.filter(k => !isListHidden(k));

  // Keys are slugs generated once at creation and never changed - labels stay
  // editable, so the key can't be derived from the label at read time.
  const makeListKey = (label) => {
    const base = String(label || '').toLowerCase().replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '').slice(0, 20) || 'list';
    let key = base;
    let n = 2;
    while (TASK_LISTS.includes(key)) { key = `${base}_${n}`; n++; }
    return key;
  };

  const addCustomList = (label, shared = false) => {
    const name = String(label || '').trim();
    if (!name) return { ok: false, message: 'Give the list a name first.' };
    const set = shared ? sharedListKeys : personalListKeys;
    if (set.length >= MAX_LISTS_PER_SET) {
      return {
        ok: false,
        message: `You can have up to ${MAX_LISTS_PER_SET} ${shared ? 'shared' : 'personal'} lists.`
      };
    }
    // Name check spans BOTH sets: two lists called "Groceries", one personal
    // and one shared, would be indistinguishable everywhere they appear
    // together - All Tasks, search, reports.
    const taken = TASK_LISTS.some(k => listLabel(k).toLowerCase() === name.toLowerCase());
    if (taken) return { ok: false, message: 'A list with that name already exists.' };

    const key = makeListKey(name);
    const used = customLists.map(c => c && c.color);
    const color = LIST_COLOR_PALETTE.find(c => !used.includes(c)) || LIST_COLOR_PALETTE[0];

    // Create the storage buckets up front so nothing has to guard for a
    // missing key later
    setAllLists(prev => ({ ...prev, [key]: [] }));
    setArchivedTasks(prev => ({ ...prev, [key]: [] }));
    setSettings(prev => ({
      ...prev,
      customLists: [...(prev.customLists || []), { key, label: name, color, shared }],
      listOrder: [...orderedTaskLists, key]
    }));
    return { ok: true, message: `Added "${name}".` };
  };

  const deleteCustomList = async (key) => {
    const entry = customLists.find(c => c && c.key === key);
    if (!entry) return;
    const open = (allLists[key] || []).length;
    const archived = (archivedTasks[key] || []).length;
    const total = open + archived;
    const ok = await confirmAction(
      `Delete "${listLabel(key)}"?\n\n` +
      (total > 0
        ? `This permanently deletes ${total} task${total === 1 ? '' : 's'} (${open} active, ${archived} archived). This can't be undone.`
        : 'This list is empty.')
    );
    if (!ok) return;

    setAllLists(prev => { const next = { ...prev }; delete next[key]; return next; });
    setArchivedTasks(prev => { const next = { ...prev }; delete next[key]; return next; });
    setSettings(prev => {
      const labels = { ...(prev.listLabels || {}) };
      const hidden = { ...(prev.hiddenLists || {}) };
      delete labels[key];
      delete hidden[key];
      return {
        ...prev,
        customLists: (prev.customLists || []).filter(c => c && c.key !== key),
        listLabels: labels,
        hiddenLists: hidden,
        listOrder: (prev.listOrder || []).filter(k => k !== key)
      };
    });
    if (currentList === key) setCurrentList('master');
  };

  const moveList = (key, direction) => {
    const order = [...orderedTaskLists];
    const from = order.indexOf(key);
    const to = from + direction;
    if (from < 0 || to < 0 || to >= order.length) return;
    order.splice(to, 0, order.splice(from, 1)[0]);
    updateSetting('listOrder', order);
  };

  const reorderList = (fromKey, toKey) => {
    if (fromKey === toKey) return;
    const order = [...orderedTaskLists];
    const from = order.indexOf(fromKey);
    const to = order.indexOf(toKey);
    if (from < 0 || to < 0) return;
    order.splice(to, 0, order.splice(from, 1)[0]);
    updateSetting('listOrder', order);
  };

  // Optional sections. Off means hidden, never deleted - the data stays put
  // and reappears untouched when switched back on.
  const FEATURES = [
    { key: 'time',     label: 'Time',     note: 'Time logging and session history' },
    { key: 'goals',    label: 'Goals',    note: 'Long-term goals with time tracking' },
    { key: 'projects', label: 'Projects', note: 'Group tasks under a project' },
    { key: 'notes',    label: 'Notes',    note: 'Freeform notes and journaling' },
    { key: 'search',   label: 'Search',   note: 'Search across everything in the app' }
  ];
  const isFeatureOn = (key) => !(settings.hiddenFeatures && settings.hiddenFeatures[key]);
  const toggleFeature = (key) => {
    setSettings(prev => {
      const hidden = { ...(prev.hiddenFeatures || {}) };
      if (hidden[key]) delete hidden[key]; else hidden[key] = true;
      return { ...prev, hiddenFeatures: hidden };
    });
  };

  const toggleListVisibility = (key) => {
    setSettings(prev => {
      const hidden = { ...(prev.hiddenLists || {}) };
      if (hidden[key]) {
        delete hidden[key];
      } else {
        // Never let the user hide every list - the app would have nothing to show
        const remaining = TASK_LISTS.filter(k => k !== key && !hidden[k]);
        if (remaining.length === 0) return prev;
        hidden[key] = true;
      }
      return { ...prev, hiddenLists: hidden };
    });
  };

  // If the list you're viewing gets hidden, fall back to All Tasks
  useEffect(() => {
    if (currentList !== 'master' && isListHidden(currentList)) {
      setCurrentList('master');
    }
  }, [settings.hiddenLists, currentList]);

  // Same for whole sections - don't strand the user on a disabled screen
  useEffect(() => {
    if (['goals', 'projects', 'notes', 'time', 'search'].includes(appMode) && !isFeatureOn(appMode)) {
      setAppMode('tasks');
    }
  }, [settings.hiddenFeatures, appMode]);

  // Archive defaults back to Tasks if its current tab is switched off
  useEffect(() => {
    if ((archiveType === 'goals' || archiveType === 'projects') && !isFeatureOn(archiveType)) {
      setArchiveType('tasks');
    }
  }, [settings.hiddenFeatures, archiveType]);
  const [goalDropdownOpen, setGoalDropdownOpen] = useState(false);
  const [taskListDropdownOpen, setTaskListDropdownOpen] = useState(false);
  const [timeDurationDropdownOpen, setTimeDurationDropdownOpen] = useState(false);
  const [collapsedArchiveSections, setCollapsedArchiveSections] = useState({}); // Track which archive sections are collapsed
  const [selectedPriority, setSelectedPriority] = useState('low');
  // Who a task will be assigned to when it's created. Only meaningful on the
  // shared list; reset after each add so an assignment doesn't silently carry
  // over to the next task.
  const [selectedAssignee, setSelectedAssignee] = useState(null);
  const [selectedSection, setSelectedSection] = useState('todo');
  const [searchQuery, setSearchQuery] = useState('');
  const [taskInput, setTaskInput] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [expandedTaskId, setExpandedTaskId] = useState(null);

  // Standalone time logs state
  const [standaloneTimeLogs, setStandaloneTimeLogs] = useState(() => {
    const saved = localStorage.getItem('standaloneTimeLogs');
    return saved ? JSON.parse(saved) : [];
  });

  // Load Tesseract.js for OCR
  useEffect(() => {
    if (!window.Tesseract) {
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js';
      script.async = true;
      script.crossOrigin = 'anonymous';
      script.onload = () => {
        console.log('Tesseract.js loaded successfully');
      };
      script.onerror = () => {
        console.error('Failed to load Tesseract.js from CDN');
      };
      document.body.appendChild(script);
    }
  }, []);
  
  const [allLists, setAllLists] = useState(() => {
    const saved = localStorage.getItem('little_fires_lists');
    const parsed = saved ? JSON.parse(saved) : {
      personal: [],
      work: [],
      home: [],
      travel: [],
      kids: []
    };
    
    // Migration: Add travel list if it doesn't exist
    if (!parsed.travel) {
      parsed.travel = [];
    }
    
    // Migration: Add kids list if it doesn't exist
    if (!parsed.kids) {
      parsed.kids = [];
    }
    
    // Migration: Add partner list if it doesn't exist
    if (!parsed.partner) {
      parsed.partner = [];
    }
    
    // Recover any hide-time editor save that never made it through the normal
    // path (see EDITOR_DRAFT_KEY). Read-only, and applied only if strictly
    // newer than the stored task - the effect below is what consumes it.
    return applyEditorDraft(parsed);
  });

  // Clear the journal here rather than inside the initializer above: an
  // initializer must stay pure (StrictMode invokes it twice in development),
  // and by this point the draft has either been applied into state or been
  // judged stale. The persistence effect will write the applied result back
  // to storage on this same mount.
  useEffect(() => { clearEditorDraft(); }, []);

  // Deletion tombstones: { [taskId]: deletedAtISO }.
  //
  // Sync can't tell "this task was deleted" apart from "this device hasn't seen
  // this task yet" - both look like an id that's present on one side and absent
  // on the other. Without a record of the deletion, the next sync helpfully
  // restores everything you removed. Recording ids in a side table rather than
  // leaving dead rows in the lists themselves means nothing that renders,
  // filters, counts or exports has to learn to skip them.
  const TOMBSTONE_TTL_DAYS = 90;
  const [deletedTaskIds, setDeletedTaskIds] = useState(() => {
    try {
      const saved = localStorage.getItem('little_fires_deleted');
      const parsed = saved ? JSON.parse(saved) : {};
      // Prune on load. A tombstone only has to outlive the longest plausible
      // gap between a device deleting something and its partner syncing; kept
      // forever it would grow without limit.
      const cutoff = Date.now() - TOMBSTONE_TTL_DAYS * 24 * 60 * 60 * 1000;
      const pruned = {};
      Object.entries(parsed).forEach(([id, at]) => {
        const t = Date.parse(at);
        if (!Number.isNaN(t) && t >= cutoff) pruned[id] = at;
      });
      return pruned;
    } catch {
      return {};
    }
  });

  const recordDeletion = (taskId) => {
    if (taskId === undefined || taskId === null) return;
    setDeletedTaskIds(prev => ({ ...prev, [taskId]: new Date().toISOString() }));
  };

  const [archivedTasks, setArchivedTasks] = useState(() => {
    const saved = localStorage.getItem('little_fires_archived');
    const parsed = saved ? JSON.parse(saved) : {
      personal: [],
      work: [],
      home: [],
      travel: [],
      kids: []
    };
    
    // Migration: Add kids if it doesn't exist
    if (!parsed.kids) {
      parsed.kids = [];
    }
    
    // Migration: Add partner list if it doesn't exist
    if (!parsed.partner) {
      parsed.partner = [];
    }
    
    return parsed;
  });

  const [notes, setNotes] = useState(() => {
    const saved = localStorage.getItem('little_fires_notes');
    return saved ? JSON.parse(saved) : [];
  });

  const [projects, setProjects] = useState(() => {
    const saved = localStorage.getItem('little_fires_projects');
    const parsed = saved ? JSON.parse(saved) : {
      personal: [],
      work: [],
      home: [],
      travel: [],
      kids: []
    };
    
    // Migration: Add kids if it doesn't exist
    if (!parsed.kids) {
      parsed.kids = [];
    }
    
    return parsed;
  });

  const [goals, setGoals] = useState(() => {
    const saved = localStorage.getItem('little_fires_goals');
    const parsed = saved ? JSON.parse(saved) : {
      personal: [],
      work: [],
      home: [],
      travel: [],
      kids: []
    };
    
    // Migration: Add kids if it doesn't exist
    if (!parsed.kids) {
      parsed.kids = [];
    }
    
    return parsed;
  });

  const [selectedGoal, setSelectedGoal] = useState(null);
  const [timeLoggerContext, setTimeLoggerContext] = useState(null); // { type: 'goal' | 'note', id, listName? }
  const [currentGoalList, setCurrentGoalList] = useState('master');
  const [showGoalForm, setShowGoalForm] = useState(false);
  const [editingGoal, setEditingGoal] = useState(null);
  const [goalFormData, setGoalFormData] = useState({
    name: '',
    description: '',
    startDate: '',
    endDate: ''
  });
  const [goalToDelete, setGoalToDelete] = useState(null);
  const [draggedGoal, setDraggedGoal] = useState(null);
  const [dragOverGoal, setDragOverGoal] = useState(null);
  const [touchStartY, setTouchStartY] = useState(null);
  const [isTouchDragging, setIsTouchDragging] = useState(false);
  const [showTimeLogger, setShowTimeLogger] = useState(false);
  const [isLogging, setIsLogging] = useState(false);
  const [loggedMinutes, setLoggedMinutes] = useState(0);

  const [loggedSeconds, setLoggedSeconds] = useState(0); // Accumulated seconds while logging
  const [timerDuration, setTimerDuration] = useState(() => {
    try {
      const sv = localStorage.getItem('little_fires_settings');
      const d = sv ? JSON.parse(sv).defaultTimerDuration : '';
      return d === undefined || d === null ? '' : d;
    } catch { return ''; }
  }); // Duration in seconds for progress ring
  const [logStartTime, setLogStartTime] = useState(null);
  const [pausedTime, setPausedTime] = useState(0); // Track when pause started
  const [totalPausedTime, setTotalPausedTime] = useState(0); // Track cumulative pause duration in ms
  const [editingTimeLog, setEditingTimeLog] = useState(null);
  const [timeLogFocus, setTimeLogFocus] = useState('');
  const [timeLogDescription, setTimeLogDescription] = useState('');
  const [timeLogTakeAway, setTimeLogTakeAway] = useState('');
  // --- Pomodoro ---------------------------------------------------------
  // A layer on top of the existing timer rather than a replacement. Work
  // phases run the normal logger, so time still lands against whatever you
  // picked. Breaks are tracked separately and never touch loggedSeconds -
  // resting isn't work, and logging it would corrupt the reports.
  //
  // The break is stored as an END TIMESTAMP, not a countdown. Remaining time is
  // derived from the clock, so it stays correct through a backgrounded app,
  // a throttled tab or a device sleeping - and if the break finished while you
  // were away, that's visible on return rather than silently lost.
  const [pomodoroPhase, setPomodoroPhase] = useState('work'); // 'work' | 'short' | 'long'
  const [pomodoroCount, setPomodoroCount] = useState(0);      // completed work sessions this cycle
  const [breakEndsAt, setBreakEndsAt] = useState(null);
  const [breakRemaining, setBreakRemaining] = useState(0);
  const [pomodoroMessage, setPomodoroMessage] = useState(null);
  const audioCtxRef = React.useRef(null);

  // iOS will not let a page make sound until the user has interacted with it,
  // and a context created later stays suspended. So one context is created on
  // the first gesture and reused - resumed rather than recreated.
  const unlockAudio = React.useCallback(() => {
    try {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return null;
      if (!audioCtxRef.current) audioCtxRef.current = new Ctx();
      if (audioCtxRef.current.state === 'suspended') audioCtxRef.current.resume();
      return audioCtxRef.current;
    } catch (err) {
      return null;
    }
  }, []);

  // Synthesised rather than an audio file: nothing to load, nothing to ship,
  // and it works offline.
  const playChime = React.useCallback((tone = 880) => {
    const ctx = audioCtxRef.current;
    if (!ctx || ctx.state !== 'running') return;
    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.value = tone;
      // Ramped, not switched: an abrupt start or stop on a sine wave clicks.
      gain.gain.setValueAtTime(0.0001, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.25, ctx.currentTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.7);
      osc.start();
      osc.stop(ctx.currentTime + 0.75);
    } catch (err) {
      // Sound is a nicety; never let it break the phase change.
    }
  }, []);

  const notify = React.useCallback((title, body) => {
    try {
      if (typeof Notification === 'undefined') return;
      if (Notification.permission === 'granted') new Notification(title, { body, tag: 'little-fires-pomodoro' });
    } catch (err) {
      // Same: advisory only.
    }
  }, []);

  const signalPhase = React.useCallback((title, body, tone) => {
    playChime(tone);
    notify(title, body);
    setPomodoroMessage(body);
  }, [playChime, notify]);

  // Enabled in Settings makes the option available; choosing it in the Time
  // dropdown is what actually runs it. So the mode can be switched on and left
  // on without every timer becoming a Pomodoro.
  const durationOptions = settings.pomodoroEnabled
    ? [...DURATION_OPTIONS, { value: 'pomodoro', label: 'Pomodoro' }]
    : DURATION_OPTIONS;
  const durationLabel = (v) => {
    const found = durationOptions.find(o => o.value === v);
    return found ? found.label : 'Timer';
  };
  const pomodoroOn = timerDuration === 'pomodoro';
  const pomodoroInterval = Math.max(1, Number(settings.pomodoroInterval) || 4);
  const workTarget = Math.max(60, Number(settings.pomodoroWork) || 1500);

  // Work session reaches its target. Watched off loggedSeconds rather than run
  // on its own clock, so it inherits the main timer's timestamp accuracy.
  useEffect(() => {
    if (!pomodoroOn || pomodoroPhase !== 'work' || !isLogging) return;
    if (loggedSeconds < workTarget) return;

    setIsLogging(false);
    const done = pomodoroCount + 1;
    setPomodoroCount(done);
    const isLong = done % pomodoroInterval === 0;
    const breakLen = isLong
      ? Math.max(60, Number(settings.pomodoroLongBreak) || 900)
      : Math.max(60, Number(settings.pomodoroShortBreak) || 300);
    setPomodoroPhase(isLong ? 'long' : 'short');
    setBreakEndsAt(Date.now() + breakLen * 1000);
    setBreakRemaining(breakLen);
    signalPhase(
      'Session complete',
      `${isLong ? 'Long' : 'Short'} break — ${Math.round(breakLen / 60)} minutes.`,
      880
    );
  }, [loggedSeconds, isLogging, pomodoroOn, pomodoroPhase, workTarget,
      pomodoroCount, pomodoroInterval, settings.pomodoroLongBreak,
      settings.pomodoroShortBreak, signalPhase]);

  // Break countdown. Derived from the end timestamp on every tick, so a tab
  // that was throttled or asleep catches up rather than drifting.
  useEffect(() => {
    if (!breakEndsAt) return;

    const check = () => {
      const left = Math.max(0, Math.round((breakEndsAt - Date.now()) / 1000));
      setBreakRemaining(left);
      if (left > 0) return;

      const overdueBy = Math.round((Date.now() - breakEndsAt) / 1000);
      setBreakEndsAt(null);
      setPomodoroPhase('work');
      signalPhase(
        'Break over',
        overdueBy > 90
          ? `Break finished ${Math.round(overdueBy / 60)} minutes ago.`
          : 'Back to it.',
        660
      );
      if (settings.pomodoroAutoStart) setIsLogging(true);
    };

    check();
    const id = setInterval(check, 1000);
    // Recheck the moment the app comes back, rather than waiting for a tick
    // that iOS may have suspended entirely.
    const onVisible = () => { if (!document.hidden) check(); };
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      clearInterval(id);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [breakEndsAt, settings.pomodoroAutoStart, signalPhase]);

  const skipPomodoroPhase = () => {
    unlockAudio();
    if (breakEndsAt) {
      setBreakEndsAt(null);
      setPomodoroPhase('work');
      setPomodoroMessage(null);
      if (settings.pomodoroAutoStart) setIsLogging(true);
    } else {
      setBreakEndsAt(Date.now());
    }
  };

  const resetPomodoroCycle = () => {
    setPomodoroCount(0);
    setPomodoroPhase('work');
    setBreakEndsAt(null);
    setPomodoroMessage(null);
  };

  const [timeLogMinutes, setTimeLogMinutes] = useState('');
  const [expandedTimeLogId, setExpandedTimeLogId] = useState(null);

  const [selectedProject, setSelectedProject] = useState(null);
  const [currentProjectList, setCurrentProjectList] = useState('master');
  const [draggedProject, setDraggedProject] = useState(null);
  const [dragOverProject, setDragOverProject] = useState(null);
  const [showProjectForm, setShowProjectForm] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [editingProjectName, setEditingProjectName] = useState(false);
  const [editingGoalName, setEditingGoalName] = useState(false);
  const [editingTaskName, setEditingTaskName] = useState(null); // stores taskId when editing
  const [projectTaskInput, setProjectTaskInput] = useState('');
  const [projectTaskList, setProjectTaskList] = useState('personal');
  const [projectTaskSection, setProjectTaskSection] = useState('todo');
  const [showProjectCompletedTasks, setShowProjectCompletedTasks] = useState(false);
  const [projectTaskDueDate, setProjectTaskDueDate] = useState('');
  const [projectTaskPriority, setProjectTaskPriority] = useState('low');
  const [collapsedJournalSections, setCollapsedJournalSections] = useState({}); // Track which year/month sections are collapsed
  const [projectFormData, setProjectFormData] = useState({
    name: '',
    description: '',
    startDate: '',
    endDate: ''
  });

  const [noteSearchQuery, setNoteSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState(null);
  const [noteToDelete, setNoteToDelete] = useState(null);
  const [projectToDelete, setProjectToDelete] = useState(null);
  
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [selectedDay, setSelectedDay] = useState(null);
  const [expandedCalendarTaskId, setExpandedCalendarTaskId] = useState(null);
  const [expandedCalendarNoteId, setExpandedCalendarNoteId] = useState(null);
  const [expandedCalendarProjectId, setExpandedCalendarProjectId] = useState(null);
  const [showOpenTasks, setShowOpenTasks] = useState(true);
  const [showCompletedTasks, setShowCompletedTasks] = useState(false);
  const [showToDoSection, setShowToDoSection] = useState(true);
  const [showBacklogSection, setShowBacklogSection] = useState(true);
  // Which task lists are collapsed in the All Tasks view. Keyed by list key,
  // so custom lists behave like built-ins - this previously used six hardcoded
  // booleans, which meant any custom list could never expand and clicking its
  // header called undefined. Absent or false means expanded.
  //
  // Starts collapsed on every open, so the landing view is a short index of
  // lists and their counts rather than every task at once. Lazy initialiser:
  // it runs once on mount, by which point settings (and so visibleTaskLists)
  // have already been read from storage. Expanding is one tap on a header, or
  // the flame to open them all.
  const [collapsedLists, setCollapsedLists] = useState(
    () => Object.fromEntries(visibleTaskLists.map(k => [k, true]))
  );
  const toggleList = (key) =>
    setCollapsedLists(prev => ({ ...prev, [key]: !prev[key] }));
  // Collapse everything if anything is still open, otherwise reopen everything.
  // Clearing the object rather than writing false keeps expanded as the default.
  const toggleAllLists = () => {
    const anyOpen = visibleTaskLists.some(k => !collapsedLists[k]);
    setCollapsedLists(anyOpen
      ? Object.fromEntries(visibleTaskLists.map(k => [k, true]))
      : {});
  };
  const [showPersonalGoals, setShowPersonalGoals] = useState(true);
  const [showWorkGoals, setShowWorkGoals] = useState(true);
  const [showHomeGoals, setShowHomeGoals] = useState(true);
  const [showTravelGoals, setShowTravelGoals] = useState(true);
  const [showKidsGoals, setShowKidsGoals] = useState(true);
  const [showPersonalProjects, setShowPersonalProjects] = useState(true);
  const [showWorkProjects, setShowWorkProjects] = useState(true);
  const [showHomeProjects, setShowHomeProjects] = useState(true);
  const [showTravelProjects, setShowTravelProjects] = useState(true);
  const [showKidsProjects, setShowKidsProjects] = useState(true);
  const [showStandaloneTimeLogs, setShowStandaloneTimeLogs] = useState(true);
  const [showGoalTimeLogs, setShowGoalTimeLogs] = useState(true);
  const [showJournalTimeLogs, setShowJournalTimeLogs] = useState(true);
  const [showNotes, setShowNotes] = useState(true);
  const [showProjects, setShowProjects] = useState(true);
  
  const [lastArchiveCheck, setLastArchiveCheck] = useState(() => {
    const saved = localStorage.getItem('little_fires_last_archive_check');
    return saved || new Date().toISOString();
  });

  useEffect(() => {
    queueSetItem('little_fires_lists', () => JSON.stringify(allLists));
  }, [allLists, queueSetItem]);

  useEffect(() => {
    queueSetItem('little_fires_notes', () => JSON.stringify(notes));
  }, [notes, queueSetItem]);

  useEffect(() => {
    queueSetItem('little_fires_projects', () => JSON.stringify(projects));
  }, [projects, queueSetItem]);

  useEffect(() => {
    queueSetItem('little_fires_goals', () => JSON.stringify(goals));
  }, [goals, queueSetItem]);

  useEffect(() => {
    queueSetItem('standaloneTimeLogs', () => JSON.stringify(standaloneTimeLogs));
  }, [standaloneTimeLogs, queueSetItem]);

  // Keep the narrow-screen flag in sync (also fires on device rotation)
  useEffect(() => {
    // matchMedia rather than a resize listener reading innerWidth. resize fires
    // constantly on iOS - the address bar collapsing during scroll, the
    // keyboard opening - and each read of innerWidth forces a layout. A media
    // query listener fires only when the answer actually changes.
    const mq = window.matchMedia('(max-width: 700px)');
    const onChange = (e) => setIsMobile(e.matches);
    setIsMobile(mq.matches);
    // addEventListener on MediaQueryList is the modern form; addListener is the
    // fallback for older WebKit.
    if (mq.addEventListener) mq.addEventListener('change', onChange);
    else mq.addListener(onChange);
    return () => {
      if (mq.removeEventListener) mq.removeEventListener('change', onChange);
      else mq.removeListener(onChange);
    };
  }, []);

  // Which chart modes have already played their intro this session. Reports
  // animates the first time you open it, and again the first time you switch
  // to a mode you haven't seen yet - then snaps for every change after that.
  const animatedChartModes = React.useRef(new Set());
  const [chartAnimate, setChartAnimate] = useState(false);
  const [chartAnimToken, setChartAnimToken] = useState(0);

  useEffect(() => {
    if (appMode !== 'reports') return;
    const seen = animatedChartModes.current;
    if (!seen.has(reportChartType)) {
      seen.add(reportChartType);
      setChartAnimate(true);
      setChartAnimToken(t => t + 1); // remounts the series so the draw replays
    } else {
      setChartAnimate(false);
    }
  }, [appMode, reportChartType]);

  // Fire chart "rise": fills from 0 up to the real level after the chart has
  // drawn itself in. On a snap (any later filter change) it jumps straight to
  // the final value with no animation and no flicker loop.
  useEffect(() => {
    if (appMode !== 'reports') return;

    if (!chartAnimate) {
      setFireFillAnim(1); // already introduced - show the final state
      return;
    }

    let raf, flickRaf;
    const start = performance.now();
    const duration = FIRE_FILL_MS; // ms to rise to full
    // The flame goes first now. It's the headline of the page - the charts are
    // the supporting detail - and having them draw underneath it while it was
    // still empty read as the flame lagging behind rather than leading.
    const delay = 0;
    let fillDone = false;
    setFireFillAnim(0);

    const tick = (now) => {
      const elapsed = now - start - delay;
      if (elapsed < 0) {
        raf = requestAnimationFrame(tick); // still waiting on the chart
        return;
      }
      const t = Math.min(1, elapsed / duration);
      setFireFillAnim(1 - Math.pow(1 - t, 3)); // ease-out
      if (t < 1) {
        raf = requestAnimationFrame(tick);
      } else {
        fillDone = true; // this also ends the flicker loop below
      }
    };
    raf = requestAnimationFrame(tick);

    // Flame edge flicker. Two deliberate limits: it runs at ~15fps rather than
    // 60 (each tick re-renders the whole Reports view, and a rippling edge
    // doesn't need frame-perfect motion), and it stops entirely once the flame
    // is full rather than looping for as long as the page is open.
    const FLICKER_INTERVAL = 1000 / 15;
    const flickStart = performance.now();
    let lastFlick = 0;
    const flickTick = (now) => {
      if (fillDone) return; // stop once filled
      if (now - lastFlick >= FLICKER_INTERVAL) {
        setFireFlicker((now - flickStart) / 1000);
        lastFlick = now;
      }
      flickRaf = requestAnimationFrame(flickTick);
    };
    flickRaf = requestAnimationFrame(flickTick);

    return () => {
      if (raf) cancelAnimationFrame(raf);
      if (flickRaf) cancelAnimationFrame(flickRaf);
    };
  }, [appMode, chartAnimate, chartAnimToken, reportTimeframe, reportTaskStatus, reportHiddenLists]);

  // Timer for time logging - accumulator approach.
  // While isLogging is true, elapsed time is accumulated from real timestamps
  // rather than a fixed step per tick, so the total stays correct however often
  // (or rarely) the interval actually fires. When paused, the interval stops
  // and the value holds; resuming continues from where it left off.
  useEffect(() => {
    if (!isLogging) return;

    let lastTick = Date.now();
    let interval = null;

    // Fold the time since the last tick into the total. Because it measures
    // real elapsed time, one call after a long gap counts exactly as much as
    // many calls during it - which is what makes both the slow tick below and
    // the backgrounding behaviour safe.
    const accrue = () => {
      const now = Date.now();
      const delta = (now - lastTick) / 1000;
      lastTick = now;
      if (delta > 0) setLoggedSeconds(prev => prev + delta);
    };

    const start = () => {
      if (interval) return;
      lastTick = Date.now();
      // 1000ms, previously 50ms. Every tick sets state and re-renders, so the
      // old rate cost 20 renders a second for a readout in whole minutes and a
      // progress ring spanning 25 of them - at one second per tick the ring
      // advances well under a pixel, and accuracy is unchanged because the
      // maths is delta-based.
      interval = setInterval(accrue, 1000);
    };

    const stop = () => {
      if (!interval) return;
      clearInterval(interval);
      interval = null;
    };

    // Backgrounded, the app does no work at all. Time that passes while hidden
    // still counts - it's banked in a single catch-up call on return, from the
    // timestamp rather than from ticks that never happened.
    const onVisibilityChange = () => {
      accrue();
      if (document.hidden) stop();
      else start();
    };

    start();
    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => {
      // Bank the part-second since the last tick before shutting down. This
      // cleanup runs on pause, so without it every pause quietly discarded up
      // to a second - invisible once, but it compounds across a session of
      // stopping and starting.
      accrue();
      stop();
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, [isLogging]);

  // A chosen duration is a target, not just something for the ring to fill:
  // reaching it stops the timer. Pomodoro is excluded because it has its own
  // completion path - it starts a break rather than simply stopping.
  //
  // No clamping to the target. If the app was backgrounded and comes back past
  // the end, that time really did pass, and this is a time tracker before it is
  // a countdown - silently rewriting the total to look tidy would be the wrong
  // trade.
  useEffect(() => {
    if (pomodoroOn || !isLogging) return;
    const target = Number(timerDuration);
    if (!(target > 0) || loggedSeconds < target) return;

    setIsLogging(false);
    playChime(880);
    notify('Timer finished', `${Math.round(target / 60)} minute timer complete.`);
  }, [loggedSeconds, isLogging, timerDuration, pomodoroOn, playChime, notify]);

  // ---- Progress ring geometry ---------------------------------------------
  // The ring is fed by a once-a-second state update and a 1s linear transition,
  // so it has to be pointed at where the clock will be at the END of the
  // current second, not where it is right now. Without that lead the animation
  // only begins after the first tick, and then runs a full second behind for
  // the rest of the session - it always arrives somewhere just as the clock
  // leaves it. Projecting one tick ahead means the transition is travelling
  // through the second it represents, so the ring reads as live and starts
  // moving the instant you hit the button.
  const RING_CIRCUMFERENCE = 597;
  // 'pomodoro' isn't a number, so the ring has to be told its span explicitly -
  // otherwise Number('pomodoro') is NaN and it falls back to the 60-second
  // cycling ring, which would be wrong for a 25 minute session.
  const ringCapped = pomodoroOn || Number(timerDuration) > 0;
  const ringSpan = pomodoroOn
    ? workTarget
    : (Number(timerDuration) > 0 ? Number(timerDuration) : 60);
  const ringFraction = (secs) => ringCapped
    ? Math.min(1, secs / ringSpan)
    : (secs % ringSpan) / ringSpan;
  const ringNow = ringFraction(loggedSeconds);
  const ringNext = ringFraction(loggedSeconds + (isLogging ? 1 : 0));
  // With no duration set the ring cycles once a minute. On the roll-over the
  // projected fraction is smaller than the current one, and animating that
  // would sweep the ring backwards for a second - so that step snaps, as it
  // did before any of this.
  const ringWrapping = ringNext < ringNow;
  const ringOffset = RING_CIRCUMFERENCE - RING_CIRCUMFERENCE * ringNext;
  const ringTransition = (isLogging && !ringWrapping)
    ? 'stroke 0.3s ease, stroke-dashoffset 1s linear'
    : 'stroke 0.3s ease';

  // Derive whole minutes from accumulated seconds for display/logging.
  // Only while the live timer is active or has accumulated time, so editing
  // a saved log (which sets loggedMinutes directly) isn't clobbered.
  useEffect(() => {
    if (isLogging || loggedSeconds > 0) {
      setLoggedMinutes(Math.floor(loggedSeconds / 60));
    }
  }, [loggedSeconds, isLogging]);

  useEffect(() => {
    queueSetItem('little_fires_archived', () => JSON.stringify(archivedTasks));
  }, [archivedTasks, queueSetItem]);

  useEffect(() => {
    queueSetItem('little_fires_deleted', () => JSON.stringify(deletedTaskIds));
  }, [deletedTaskIds, queueSetItem]);

  // Auto-archive completed tasks from previous months on app load and daily.
  //
  // The check body lives in a ref that is refreshed every commit, and the
  // timers below call through it. With the timers' effect on [] deps, calling
  // checkAndArchive directly would freeze the closure at FIRST render - so a
  // midnight run would filter the app-launch snapshot of allLists. That was
  // not hypothetical: a last-month-completed task deleted (or manually
  // archived) during the day was still in that snapshot, and midnight would
  // re-add it to the archive - resurrecting the deleted one, duplicating the
  // archived one - while the identity-based removal filter matched nothing
  // and hid the evidence. The ref means whenever the timer fires, it sees the
  // lists and lastArchiveCheck of the latest render.
  const checkAndArchiveRef = React.useRef(() => {});
  useEffect(() => {
    checkAndArchiveRef.current = () => {
      const now = new Date();
      const lastCheck = new Date(lastArchiveCheck);
      
      // Check if we're in a new month since last check
      const isNewMonth = now.getMonth() !== lastCheck.getMonth() || 
                         now.getFullYear() !== lastCheck.getFullYear();
      
      if (isNewMonth) {
        autoArchiveCompletedTasks();
        const newCheckDate = now.toISOString();
        setLastArchiveCheck(newCheckDate);
        safeSetItem('little_fires_last_archive_check', newCheckDate);
      }
    };
  });

  useEffect(() => {
    const checkAndArchive = () => checkAndArchiveRef.current();
    
    // Check on initial load
    checkAndArchive();
    
    // Set up daily check at midnight
    const now = new Date();
    const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0);
    const msUntilMidnight = tomorrow.getTime() - now.getTime();
    
    // Declared at effect scope so the cleanup below can reach it. The
    // previous version returned the clearInterval from inside the setTimeout
    // callback, where a return value goes nowhere - once the app had been
    // open past midnight, the interval could never be cleaned up, and every
    // error-boundary remount stacked another immortal one.
    let dailyInterval = null;
    
    // Schedule first midnight check
    const midnightTimeout = setTimeout(() => {
      checkAndArchive();
      
      // Then check every 24 hours
      dailyInterval = setInterval(checkAndArchive, 24 * 60 * 60 * 1000);
    }, msUntilMidnight);
    
    return () => {
      clearTimeout(midnightTimeout);
      if (dailyInterval) clearInterval(dailyInterval);
    };
  }, []);

  // Close dropdowns when clicking outside
  // Tapping anywhere outside an open task closes it.
  //
  // The tap that closes is consumed: if it landed on another task, that task
  // does NOT open. Otherwise one tap would both close and open, which on a
  // phone reads as the app jumping to somewhere you didn't ask for - and if
  // you were mid-edit, the details you were writing would collapse and a
  // different card would expand in the same motion.
  const collapseGuardRef = React.useRef(false);
  const collapseGuardTimer = React.useRef(null);

  useEffect(() => {
    if (!expandedTaskId) return;

    // Is this event somewhere that should dismiss the open task at all?
    const isOutside = (t) => {
      if (!t || !t.closest) return false;
      // Inside the open card - its toolbar, date picker and details editor -
      // is not "outside".
      if (t.closest('.task.expanded')) return false;
      // Modals float above the list; dismissing one shouldn't also collapse
      // whatever is open behind it.
      if (t.closest('.modal-overlay, .modal-content')) return false;
      return true;
    };

    const collapse = () => {
      setExpandedTaskId(null);
      collapseGuardRef.current = true;
      if (collapseGuardTimer.current) clearTimeout(collapseGuardTimer.current);
      collapseGuardTimer.current = setTimeout(() => {
        collapseGuardRef.current = false;
      }, 400);
    };

    // Mouse: a press outside is unambiguous, so collapse immediately. Desktop
    // scrolling uses the wheel, not a drag, so there's no gesture to confuse
    // this with.
    const onMouseDown = (e) => { if (isOutside(e.target)) collapse(); };

    // Touch has to wait. Putting a finger down outside the card is how you
    // scroll, and collapsing on touchstart meant the details closed the moment
    // you tried to look further down the page. So the decision is deferred to
    // touchend and only made if the finger effectively stayed put - a tap is a
    // dismissal, a drag is a scroll.
    const touch = { x: 0, y: 0, pending: false };
    const MOVE_TOLERANCE = 10;

    const onTouchStart = (e) => {
      if (e.touches.length !== 1 || !isOutside(e.target)) {
        touch.pending = false;
        return;
      }
      const t = e.touches[0];
      touch.x = t.clientX;
      touch.y = t.clientY;
      touch.pending = true;
    };

    const onTouchMove = (e) => {
      if (!touch.pending) return;
      const t = e.touches[0];
      if (Math.abs(t.clientX - touch.x) > MOVE_TOLERANCE ||
          Math.abs(t.clientY - touch.y) > MOVE_TOLERANCE) {
        touch.pending = false; // this is a scroll, leave the task alone
      }
    };

    const onTouchEnd = () => {
      if (!touch.pending) return;
      touch.pending = false;
      collapse();
    };

    // Capture phase so this runs before the tapped card's own handler.
    document.addEventListener('mousedown', onMouseDown, true);
    document.addEventListener('touchstart', onTouchStart, true);
    document.addEventListener('touchmove', onTouchMove, true);
    document.addEventListener('touchend', onTouchEnd, true);
    document.addEventListener('touchcancel', onTouchEnd, true);
    return () => {
      document.removeEventListener('mousedown', onMouseDown, true);
      document.removeEventListener('touchstart', onTouchStart, true);
      document.removeEventListener('touchmove', onTouchMove, true);
      document.removeEventListener('touchend', onTouchEnd, true);
      document.removeEventListener('touchcancel', onTouchEnd, true);
    };
  }, [expandedTaskId]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (archiveDropdownOpen && !e.target.closest('[data-archive-dropdown]')) {
        setArchiveDropdownOpen(false);
      }
      if (goalDropdownOpen && !e.target.closest('[data-goal-dropdown]')) {
        setGoalDropdownOpen(false);
      }
      if (taskListDropdownOpen && !e.target.closest('[data-task-list-dropdown]')) {
        setTaskListDropdownOpen(false);
      }
      if (timeDurationDropdownOpen && !e.target.closest('[data-time-duration-dropdown]')) {
        setTimeDurationDropdownOpen(false);
      }
      if (reportTimeframeDropdownOpen && !e.target.closest('[data-report-timeframe-dropdown]')) {
        setReportTimeframeDropdownOpen(false);
      }
      if (reportStatusDropdownOpen && !e.target.closest('[data-report-status-dropdown]')) {
        setReportStatusDropdownOpen(false);
      }
    };

    if (archiveDropdownOpen || goalDropdownOpen || taskListDropdownOpen || timeDurationDropdownOpen || reportTimeframeDropdownOpen || reportStatusDropdownOpen) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [archiveDropdownOpen, goalDropdownOpen, taskListDropdownOpen, timeDurationDropdownOpen, reportTimeframeDropdownOpen, reportStatusDropdownOpen]);

  const getCurrentTasks = () => {
    if (currentList === 'master') {
      const masterTasks = [];
      visibleTaskLists.forEach(listName => {
        if (allLists[listName]) {
          allLists[listName].forEach((task, index) => {
            masterTasks.push({
              ...task,
              sourceList: listName,
              sourceIndex: index,
              isArchived: false
            });
          });
        }
        
        // If there's a search query, also include archived tasks
        if (searchQuery && archivedTasks[listName]) {
          archivedTasks[listName].forEach((task, index) => {
            masterTasks.push({
              ...task,
              sourceList: listName,
              sourceIndex: index,
              isArchived: true
            });
          });
        }
      });
      return masterTasks;
    }
    return allLists[currentList] || [];
  };

  const applyFilters = (tasks) => {
    let filtered = tasks;

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(t => 
        t.text.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    return filtered;
  };

  const addTask = () => {
    if (!taskInput.trim()) return;

    const newTask = {
      text: taskInput,
      completed: false,
      priority: selectedPriority,
      section: selectedSection,
      dueDate: dueDate || null,
      dueTime: null,
      details: '',
      id: makeId(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      projectId: null,
      // Only stamped on the shared list. Elsewhere these fields would be noise,
      // and their absence is what keeps a personal task rendering as one.
      ...(isSharedList(currentList)
        ? { createdBy: 'me', assignedTo: selectedAssignee }
        : {})
    };

    setAllLists(prev => ({
      ...prev,
      [currentList]: [newTask, ...prev[currentList]]
    }));

    setTaskInput('');
    setDueDate('');
    setSelectedPriority('low');
    setSelectedSection('todo');
    setSelectedAssignee(null);
  };

  // Tasks are addressed by id rather than by array position. A position is only
  // valid for the render that produced it: anything that reorders, filters or
  // removes an item invalidates it, and once two devices can write to the same
  // list a position means nothing at all. Every lookup goes through here so a
  // stale or missing id fails as a no-op instead of hitting the wrong task.
  const findTaskIndex = (list, taskId) => {
    if (taskId === undefined || taskId === null || !Array.isArray(list)) return -1;
    return list.findIndex(t => t && t.id === taskId);
  };
  const findTask = (list, taskId) => {
    const i = findTaskIndex(list, taskId);
    return i === -1 ? null : list[i];
  };

  // The single write path for editing a task in place.
  //
  // Every field mutator routes through here, which buys three things at once.
  // It replaces the task object rather than mutating it: the old code shallow
  // copied the outer map and then wrote through to the original task, so `prev`
  // and `next` shared the same object and there was no previous version left to
  // diff against - which is exactly what sync needs to decide what changed.
  // It stamps updatedAt, so no caller can forget. And it addresses by id, so a
  // stale reference fails as a no-op instead of hitting whatever now sits at
  // that position.
  //
  // `patch` may be an object or a function of the current task. A key set to
  // undefined clears that field - JSON.stringify drops undefined, so it doesn't
  // survive into storage.
  const updateTask = (listName, taskId, patch) => {
    setAllLists(prev => {
      const list = prev[listName] || [];
      const idx = findTaskIndex(list, taskId);
      if (idx === -1) return prev;
      const current = list[idx];
      const changes = typeof patch === 'function' ? patch(current) : patch;
      if (!changes) return prev;
      const nextList = [...list];
      nextList[idx] = { ...current, ...changes, updatedAt: new Date().toISOString() };
      return { ...prev, [listName]: nextList };
    });
  };

  const toggleTask = (listName, taskId) => {
    updateTask(listName, taskId, (task) => {
      const completed = !task.completed;
      return {
        completed,
        // undefined rather than delete: the task object is rebuilt by spread,
        // and JSON.stringify drops undefined, so the key doesn't persist.
        completedAt: completed ? new Date().toISOString() : undefined
      };
    });
  };

  // Collapse state for the calendar day panel. Unlike the archive equivalent
  // this defaults to EXPANDED - you clicked a date to see what's on it, so
  // hiding it by default would defeat the point. Keys are flat, not scoped per
  // date, so collapsing a section keeps it collapsed as you move between days.
  const [collapsedCalendarSections, setCollapsedCalendarSections] = useState({});

  const toggleCalendarSection = (sectionKey) => {
    setCollapsedCalendarSections(prev => ({
      ...prev,
      [sectionKey]: !prev[sectionKey]
    }));
  };

  const isCalendarSectionCollapsed = (sectionKey) => !!collapsedCalendarSections[sectionKey];

  const toggleArchiveSection = (sectionKey) => {
    setCollapsedArchiveSections(prev => ({
      ...prev,
      [sectionKey]: !prev[sectionKey]
    }));
  };

  const isArchiveSectionCollapsed = (sectionKey) => {
    // Default to collapsed (true) if not in state
    return collapsedArchiveSections[sectionKey] !== false;
  };

  // Removal without a tombstone. Archiving moves a task out of the active list
  // but it still exists, under the same id, in the archive - tombstoning it
  // would tell the other device to destroy a task that was only filed away.
  const removeTaskFromList = (listName, taskId) => {
    setAllLists(prev => {
      const idx = findTaskIndex(prev[listName], taskId);
      if (idx === -1) return prev;
      // Copy the ARRAY, not just the object. { ...prev } shares every list
      // array with prev, so splicing in place mutated the state React was
      // still holding - masked today, but any change detection that compares
      // old and new list references (exactly what sync's push layer will do)
      // would see removals as "nothing changed" and never propagate them.
      const nextList = [...prev[listName]];
      nextList.splice(idx, 1);
      return { ...prev, [listName]: nextList };
    });
  };

  // Actual deletion: gone, and recorded as gone.
  const deleteTask = (listName, taskId) => {
    removeTaskFromList(listName, taskId);
    recordDeletion(taskId);
  };

  const archiveTask = (listName, taskId) => {
    const task = findTask(allLists[listName], taskId);
    if (!task || !task.completed) return; // Only archive completed tasks

    // Add to archived tasks
    setArchivedTasks(prev => ({
      ...prev,
      // Archiving is a state change like any other, so it stamps too - without
      // it, two devices disagreeing about whether a task is archived have no
      // way to tell which opinion is newer.
      [listName]: [...(prev[listName] || []), {
        ...task,
        archivedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }]
    }));

    // Removed, not deleted - see removeTaskFromList.
    removeTaskFromList(listName, taskId);
  };

  const unarchiveTask = (listName, taskId) => {
    const task = findTask(archivedTasks[listName], taskId);
    if (!task) return;

    // Add back to active lists
    setAllLists(prev => ({
      ...prev,
      [listName]: [...prev[listName], {
        ...task,
        archivedAt: undefined,
        updatedAt: new Date().toISOString()
      }]
    }));

    // Remove from archived
    setArchivedTasks(prev => {
      const idx = findTaskIndex(prev[listName], taskId);
      if (idx === -1) return prev;
      // Copy the array, not just the object - see removeTaskFromList.
      const nextList = [...prev[listName]];
      nextList.splice(idx, 1);
      return { ...prev, [listName]: nextList };
    });
  };

  const deleteArchivedTask = (listName, taskId) => {
    setArchivedTasks(prev => {
      const idx = findTaskIndex(prev[listName], taskId);
      if (idx === -1) return prev;
      // Copy the array, not just the object - see removeTaskFromList.
      const nextList = [...prev[listName]];
      nextList.splice(idx, 1);
      return { ...prev, [listName]: nextList };
    });
    recordDeletion(taskId);
  };

  const updateTaskDetails = (listName, taskId, details) => {
    // Filtered on write as well as on render. Render-time is the guarantee -
    // it covers data that was already stored, or arrived from an import - but
    // cleaning at the boundary keeps what's persisted (and later, synced) free
    // of anything that would have to be stripped again.
    updateTask(listName, taskId, { details: sanitizeRichText(details) });
  };

  // Used by the inline rename field, which is a controlled input - so unlike
  // the mutate-in-place helpers around it, this replaces the task object.
  // Manual ordering within a list. No new field is needed: the display sort
  // returns 0 for equal priority and Array.prototype.sort is stable, so the
  // array's own order already decides what comes first within a band. Moving
  // the array element is the whole feature.
  //
  // Moves are refused across bands rather than clamped. Pinning to the top is
  // the flame's entire job, so letting an unflagged task sit above a flagged
  // one would quietly undo it - and silently relocating the task somewhere the
  // user didn't drop it is worse than simply not moving.
  const draggingTaskRef = React.useRef(null);

  const canReorderTogether = (a, b) =>
    a && b &&
    (a.priority === 'high') === (b.priority === 'high') &&
    a.section === b.section &&
    !!a.completed === !!b.completed;

  const reorderTask = (listName, fromId, toId) => {
    if (!fromId || fromId === toId) return;
    setAllLists(prev => {
      const list = prev[listName] || [];
      const from = findTaskIndex(list, fromId);
      const to = findTaskIndex(list, toId);
      if (from < 0 || to < 0) return prev;
      if (!canReorderTogether(list[from], list[to])) return prev;
      const next = [...list];
      next.splice(to, 0, next.splice(from, 1)[0]);
      return { ...prev, [listName]: next };
    });
  };

  const renameTask = (listName, taskId, text) => {
    updateTask(listName, taskId, { text });
  };

  const updateTaskDueDate = (listName, taskId, newDueDate) => {
    updateTask(listName, taskId, {
      dueDate: newDueDate || null,
      // No time picker in the UI, so a date implies midnight local. Stored
      // explicitly so reminders and calendar sync have a real timestamp to work
      // from later.
      dueTime: newDueDate ? '00:00' : null
    });
  };

  const updateTaskPriority = (listName, taskId, priority) => {
    updateTask(listName, taskId, { priority });
  };

  // --- Shared-task assignment (Partner sync groundwork) ---------------------
  // 'me' / 'partner' are placeholders for the real Firebase uids that will
  // exist once sync ships - swapping this over later is a string comparison
  // change, not a redesign. Cycle: unassigned -> me -> partner -> unassigned.
  const cycleAssignment = (listName, taskId) => {
    updateTask(listName, taskId, (task) => ({
      assignedTo: task.assignedTo === 'me' ? 'partner'
        : task.assignedTo === 'partner' ? null
        : 'me'
    }));
  };

  const moveTaskToSection = (listName, taskId, newSection) => {
    updateTask(listName, taskId, { section: newSection });
  };

  // Note management functions
  const addNote = () => {
    const newNote = {
      id: makeId(),
      date: new Date().toISOString(),
      content: '',
      tags: [],
      expanded: true,
      images: []
    };
    setNotes(prev => [newNote, ...prev]);
  };

  const updateNote = (id, content) => {
    setNotes(prev => prev.map(note => 
      note.id === id ? { ...note, content: sanitizeRichText(content) } : note
    ));
  };

  const deleteNote = (id) => {
    setNotes(prev => prev.filter(note => note.id !== id));
  };

  const toggleNoteExpanded = (id) => {
    setNotes(prev => prev.map(note =>
      note.id === id ? { ...note, expanded: !note.expanded } : note
    ));
  };

  const addImageToNote = async (noteId, file) => {
    if (!file || !file.type.startsWith('image/')) return;
    
    // Compress image before storing
    const compressImage = (file) => {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          const img = new Image();
          img.onload = () => {
            const canvas = document.createElement('canvas');
            let width = img.width;
            let height = img.height;
            
            // Max dimensions to reduce size
            const maxDimension = 1200;
            if (width > maxDimension || height > maxDimension) {
              if (width > height) {
                height = (height / width) * maxDimension;
                width = maxDimension;
              } else {
                width = (width / height) * maxDimension;
                height = maxDimension;
              }
            }
            
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, width, height);
            
            // Convert to compressed JPEG with 0.7 quality
            resolve(canvas.toDataURL('image/jpeg', 0.7));
          };
          img.src = e.target.result;
        };
        reader.readAsDataURL(file);
      });
    };
    
    try {
      const compressedImage = await compressImage(file);
      
      // Check if adding this image would exceed storage
      const currentSize = JSON.stringify(notes).length;
      const imageSize = compressedImage.length;
      
      // Rough localStorage limit is 5-10MB, warn at 4MB
      if (currentSize + imageSize > 4000000) {
        alert('Storage limit approaching! Consider removing old images or notes to free up space.');
        return;
      }
      
      const imageId = makeId();
      
      // Add image to note
      setNotes(prev => prev.map(note => {
        if (note.id === noteId) {
          const images = note.images || [];
          return { 
            ...note, 
            images: [...images, { 
              id: imageId, 
              data: compressedImage,
              extractedText: '',
              isProcessing: true
            }] 
          };
        }
        return note;
      }));

      // Perform OCR
      console.log('Starting OCR...');
      try {
        // Wait for Tesseract to load if needed (up to 15 seconds)
        let attempts = 0;
        while (!window.Tesseract && attempts < 30) {
          await new Promise(resolve => setTimeout(resolve, 500));
          attempts++;
        }
        
        if (window.Tesseract) {
          console.log('Tesseract loaded, creating worker...');
          const worker = await window.Tesseract.createWorker('eng');
          console.log('Worker created, recognizing...');
          const { data: { text } } = await worker.recognize(compressedImage);
          console.log('OCR complete, text:', text);
          await worker.terminate();
          
          // Update with extracted text
          setNotes(prev => prev.map(note => {
            if (note.id === noteId) {
              return {
                ...note,
                images: (note.images || []).map(img => 
                  img.id === imageId 
                    ? { ...img, extractedText: text.trim() || 'No text detected', isProcessing: false }
                    : img
                )
              };
            }
            return note;
          }));
        } else {
          console.error('Tesseract failed to load after waiting');
          // OCR library not loaded
          setNotes(prev => prev.map(note => {
            if (note.id === noteId) {
              return {
                ...note,
                images: (note.images || []).map(img => 
                  img.id === imageId 
                    ? { ...img, extractedText: 'OCR library failed to load. Try refreshing the page.', isProcessing: false }
                    : img
                )
              };
            }
            return note;
          }));
        }
      } catch (error) {
        console.error('OCR failed:', error);
        // Mark as failed
        setNotes(prev => prev.map(note => {
          if (note.id === noteId) {
            return {
              ...note,
              images: (note.images || []).map(img => 
                img.id === imageId 
                  ? { ...img, extractedText: `OCR error: ${error.message || 'Unknown error'}. Try refreshing the page.`, isProcessing: false }
                  : img
              )
            };
          }
          return note;
        }));
      }
    } catch (error) {
      console.error('Image compression failed:', error);
      alert('Failed to process image. Please try a smaller image.');
    }
  };

  const removeImageFromNote = (noteId, imageId) => {
    setNotes(prev => prev.map(note =>
      note.id === noteId 
        ? { ...note, images: (note.images || []).filter(img => img.id !== imageId) }
        : note
    ));
  };

  const addGalleryPhotoToNote = async (noteId, file) => {
    if (!file || !file.type.startsWith('image/')) return;
    
    // Compress image before storing
    const compressImage = (file) => {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          const img = new Image();
          img.onload = () => {
            const canvas = document.createElement('canvas');
            let width = img.width;
            let height = img.height;
            
            // Max dimensions to reduce size
            const maxDimension = 1200;
            if (width > maxDimension || height > maxDimension) {
              if (width > height) {
                height = (height / width) * maxDimension;
                width = maxDimension;
              } else {
                width = (width / height) * maxDimension;
                height = maxDimension;
              }
            }
            
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, width, height);
            
            // Convert to compressed JPEG with 0.7 quality
            resolve(canvas.toDataURL('image/jpeg', 0.7));
          };
          img.src = e.target.result;
        };
        reader.readAsDataURL(file);
      });
    };
    
    try {
      const compressedImage = await compressImage(file);
      
      // Check if adding this image would exceed storage
      const currentSize = JSON.stringify(notes).length;
      const imageSize = compressedImage.length;
      
      if (currentSize + imageSize > 4000000) {
        alert('Storage limit approaching! Consider removing old images or notes to free up space.');
        return;
      }
      
      const photoId = makeId();
      
      // Add photo to gallery (without OCR processing)
      setNotes(prev => prev.map(note => {
        if (note.id === noteId) {
          const gallery = note.gallery || [];
          return { 
            ...note, 
            gallery: [...gallery, { id: photoId, data: compressedImage }]
          };
        }
        return note;
      }));
    } catch (error) {
      console.error('Error adding gallery photo:', error);
    }
  };

  const removeGalleryPhotoFromNote = (noteId, photoId) => {
    setNotes(prev => prev.map(note =>
      note.id === noteId 
        ? { ...note, gallery: (note.gallery || []).filter(photo => photo.id !== photoId) }
        : note
    ));
  };

  const fetchLocationForNote = async (noteId) => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser');
      return;
    }

    // Set a temporary "loading" message
    setNotes(prev => prev.map(note =>
      note.id === noteId ? { ...note, location: 'Detecting location...' } : note
    ));

    try {
      const position = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          resolve, 
          reject,
          { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        );
      });

      const { latitude, longitude } = position.coords;

      // Reverse geocode using Nominatim (OpenStreetMap)
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=10`,
          {
            headers: {
              'User-Agent': 'LittleFiresApp/1.0'
            }
          }
        );
        const data = await response.json();

        // Extract city and state/country
        const address = data.address || {};
        const city = address.city || address.town || address.village || address.suburb || '';
        const state = address.state || '';
        const country = address.country || '';

        let locationString = '';
        if (city && state) {
          locationString = `${city}, ${state}`;
        } else if (city && country) {
          locationString = `${city}, ${country}`;
        } else if (state && country) {
          locationString = `${state}, ${country}`;
        } else {
          locationString = city || state || country || `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
        }

        // Update note with location
        setNotes(prev => prev.map(note =>
          note.id === noteId ? { ...note, location: locationString } : note
        ));
      } catch (geoError) {
        // If geocoding fails, just show coordinates
        console.error('Geocoding error:', geoError);
        setNotes(prev => prev.map(note =>
          note.id === noteId ? { ...note, location: `${latitude.toFixed(4)}, ${longitude.toFixed(4)}` } : note
        ));
      }
    } catch (error) {
      console.error('Error fetching location:', error);
      let errorMessage = 'Location unavailable';
      if (error.code === 1) {
        errorMessage = 'Location permission denied';
      } else if (error.code === 2) {
        errorMessage = 'Location unavailable';
      } else if (error.code === 3) {
        errorMessage = 'Location timeout';
      }
      setNotes(prev => prev.map(note =>
        note.id === noteId ? { ...note, location: errorMessage } : note
      ));
    }
  };

  const updateNoteLocation = (noteId, location) => {
    setNotes(prev => prev.map(note =>
      note.id === noteId ? { ...note, location } : note
    ));
  };

  const addTagToNote = (noteId, tag) => {
    if (!tag.trim()) return;
    setNotes(prev => prev.map(note => {
      if (note.id === noteId) {
        const tags = note.tags || [];
        if (!tags.includes(tag.trim())) {
          return { ...note, tags: [...tags, tag.trim()] };
        }
      }
      return note;
    }));
  };

  const removeTagFromNote = (noteId, tagToRemove) => {
    setNotes(prev => prev.map(note =>
      note.id === noteId 
        ? { ...note, tags: (note.tags || []).filter(tag => tag !== tagToRemove) }
        : note
    ));
  };

  const getAllTags = () => {
    const tagSet = new Set();
    notes.forEach(note => {
      (note.tags || []).forEach(tag => tagSet.add(tag));
    });
    return Array.from(tagSet).sort();
  };

  const filterNotes = () => {
    let filtered = notes;
    
    // Filter by search query
    if (noteSearchQuery) {
      filtered = filtered.filter(note => {
        const contentMatch = (note.content || '').toLowerCase().includes(noteSearchQuery.toLowerCase());
        const tagMatch = (note.tags || []).some(tag => tag.toLowerCase().includes(noteSearchQuery.toLowerCase()));
        const imageTextMatch = (note.images || []).some(img => 
          (img.extractedText || '').toLowerCase().includes(noteSearchQuery.toLowerCase())
        );
        return contentMatch || tagMatch || imageTextMatch;
      });
    }
    
    // Filter by selected tag
    if (selectedTag) {
      filtered = filtered.filter(note => (note.tags || []).includes(selectedTag));
    }
    
    return filtered;
  };

  // Group notes by year and month
  const groupNotesByYearAndMonth = () => {
    const filtered = filterNotes();
    const grouped = {};
    
    filtered.forEach(note => {
      const date = new Date(note.date);
      const year = date.getFullYear();
      const month = date.getMonth(); // 0-11
      
      if (!grouped[year]) {
        grouped[year] = {};
      }
      if (!grouped[year][month]) {
        grouped[year][month] = [];
      }
      grouped[year][month].push(note);
    });
    
    // Sort years descending, months descending
    const sortedYears = Object.keys(grouped).sort((a, b) => b - a);
    const result = {};
    sortedYears.forEach(year => {
      result[year] = {};
      const sortedMonths = Object.keys(grouped[year]).sort((a, b) => b - a);
      sortedMonths.forEach(month => {
        result[year][month] = grouped[year][month].sort((a, b) => 
          new Date(b.date) - new Date(a.date)
        );
      });
    });
    
    return result;
  };

  const toggleJournalSection = (key) => {
    setCollapsedJournalSections(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const isJournalSectionCollapsed = (key) => {
    return collapsedJournalSections[key] || false;
  };

  // Calendar helper functions
  const getDaysInMonth = (month, year) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (month, year) => {
    return new Date(year, month, 1).getDay();
  };

  const isSameDate = (date1, date2) => {
    return date1.getFullYear() === date2.getFullYear() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getDate() === date2.getDate();
  };

  // Helper function to parse date strings as local dates (not UTC)
  // Combine a date string with an optional "HH:MM". Absent time means the task
  // is due sometime that day - which mirrors how Google Calendar distinguishes
  // an all-day event (start.date) from a timed one (start.dateTime).
  const parseLocalDateTime = (dateString, timeString) => {
    if (!dateString) return null;
    const [year, month, day] = dateString.split('-').map(Number);
    if (!timeString) return new Date(year, month - 1, day); // all-day
    const [hh, mm] = String(timeString).split(':').map(Number);
    return new Date(year, month - 1, day, hh || 0, mm || 0);
  };

  const parseLocalDate = (dateString) => {
    if (!dateString) return null;
    // Split the date string and create date in local timezone
    const [year, month, day] = dateString.split('-').map(Number);
    return new Date(year, month - 1, day); // month is 0-indexed
  };

  const getItemsForDate = (date) => {
    const items = [];
    
    // Get tasks based on filters
    const allTaskLists = visibleTaskLists;
    allTaskLists.forEach(listName => {
      (allLists[listName] || []).forEach(task => {
        // One task, one place on the calendar, chosen by precedence:
        //   completed date  >  due date  >  created date
        // A finished task belongs on the day it was finished. An unfinished one
        // belongs on the day it's for, if it has one; otherwise on the day you
        // added it, so nothing is invisible just for lacking a due date.
        //
        // Note the two date shapes: dueDate is a plain date string and needs
        // parseLocalDate, while createdAt and completedAt are ISO timestamps.
        // Passing a date-only string to new Date() would read it as UTC and
        // land on the wrong day for anyone behind it.
        const anchorFor = (t) => {
          if (t.completed && t.completedAt) return new Date(t.completedAt);
          if (t.dueDate) return parseLocalDate(t.dueDate);
          if (t.createdAt) return new Date(t.createdAt);
          return null;
        };

        const show = task.completed ? showCompletedTasks : showOpenTasks;
        if (show) {
          const anchor = anchorFor(task);
          if (anchor && isSameDate(anchor, date)) {
            items.push({
              type: 'task',
              data: task,
              list: listName,
              status: task.completed ? 'completed' : 'open'
            });
          }
        }
      });
    });
    
    // Get notes written on this date
    if (showNotes && isFeatureOn('notes')) {
      notes.forEach(note => {
        const noteDate = new Date(note.date);
        if (isSameDate(noteDate, date)) {
          items.push({
            type: 'note',
            data: note
          });
        }
      });
    }
    
    // Get projects based on start or end date
    if (showProjects && isFeatureOn('projects')) {
      const allProjectLists = ['personal', 'work', 'home', 'travel', 'kids'];
      allProjectLists.forEach(listName => {
        (projects[listName] || []).forEach(project => {
          let shouldShow = false;
          let dateType = '';
          
          if (project.startDate) {
            const startDate = parseLocalDate(project.startDate);
            if (startDate && isSameDate(startDate, date)) {
              shouldShow = true;
              dateType = 'start';
            }
          }
          
          if (project.endDate) {
            const endDate = parseLocalDate(project.endDate);
            if (endDate && isSameDate(endDate, date)) {
              shouldShow = true;
              dateType = dateType === 'start' ? 'both' : 'end';
            }
          }
          
          if (shouldShow) {
            items.push({
              type: 'project',
              data: project,
              list: listName,
              dateType: dateType
            });
          }
        });
      });
    }
    
    return items;
  };

  const navigateMonth = (direction) => {
    let newMonth = currentMonth + direction;
    let newYear = currentYear;
    
    if (newMonth > 11) {
      newMonth = 0;
      newYear++;
    } else if (newMonth < 0) {
      newMonth = 11;
      newYear--;
    }
    
    setCurrentMonth(newMonth);
    setCurrentYear(newYear);
  };

  const getActiveProjectsForMonth = (month, year) => {
    if (!showProjects || !isFeatureOn('projects')) return [];
    
    const monthStart = new Date(year, month, 1);
    const monthEnd = new Date(year, month + 1, 0);
    const activeProjects = [];
    
    const allProjectLists = ['personal', 'work', 'home', 'travel', 'kids'];
    allProjectLists.forEach(listName => {
      (projects[listName] || []).forEach(project => {
        if (!project.startDate || !project.endDate) return;
        
        const projectStart = parseLocalDate(project.startDate);
        const projectEnd = parseLocalDate(project.endDate);
        
        if (!projectStart || !projectEnd) return;
        
        // Check if project overlaps with current month
        if (projectStart <= monthEnd && projectEnd >= monthStart) {
          activeProjects.push({
            ...project,
            listName,
            startDate: projectStart,
            endDate: projectEnd
          });
        }
      });
    });
    
    return activeProjects;
  };

  const autoArchiveCompletedTasks = () => {
    const now = new Date();
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    
    const allTaskLists = TASK_LISTS;
    
    allTaskLists.forEach(listName => {
      const tasksToArchive = (allLists[listName] || []).filter(task => {
        if (!task.completed || !task.completedAt) return false;
        
        const completedDate = new Date(task.completedAt);
        // Archive tasks completed before the current month
        return completedDate < currentMonthStart;
      });
      
      // Archive each task
      tasksToArchive.forEach(task => {
        const taskIndex = allLists[listName].findIndex(t => t === task);
        if (taskIndex !== -1) {
          // Add to archived tasks. Stamped like the manual archiveTask path:
          // archiving is a state change like any other, and without the stamp
          // two devices disagreeing about whether a task is archived have no
          // way to tell which opinion is newer.
          setArchivedTasks(prev => ({
            ...prev,
            [listName]: [...(prev[listName] || []), {
              ...task,
              archivedAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            }]
          }));
        }
      });
      
      // Remove from active lists
      if (tasksToArchive.length > 0) {
        setAllLists(prev => ({
          ...prev,
          [listName]: (prev[listName] || []).filter(task => 
            !tasksToArchive.some(archivedTask => archivedTask === task)
          )
        }));
      }
    });
  };

  // Project management functions
  const addProject = (listName, name, description, startDate, endDate) => {
    const newProject = {
      id: makeId(),
      name,
      description,
      challenge: '',
      outcome: '',
      startDate: startDate || null,
      endDate: endDate || null,
      createdAt: new Date().toISOString()
    };
    setProjects(prev => ({
      ...prev,
      [listName]: [newProject, ...(prev[listName] || [])]
    }));
    return newProject.id;
  };

  const submitProjectForm = () => {
    if (!projectFormData.name.trim()) return;
    
    if (editingProject) {
      // Edit existing project
      updateProject(editingProject.listName, editingProject.id, {
        name: projectFormData.name.trim(),
        description: projectFormData.description.trim(),
        startDate: projectFormData.startDate,
        endDate: projectFormData.endDate
      });
      setEditingProject(null);
    } else {
      // Create new project in current list
      addProject(
        currentProjectList,
        projectFormData.name.trim(),
        projectFormData.description.trim(),
        projectFormData.startDate,
        projectFormData.endDate
      );
    }
    
    setShowProjectForm(false);
    setProjectFormData({ name: '', description: '', startDate: '', endDate: '' });
  };

  const updateProject = (listName, id, updates) => {
    setProjects(prev => ({
      ...prev,
      [listName]: (prev[listName] || []).map(project =>
        project.id === id ? { ...project, ...updates } : project
      )
    }));
  };

  const addPhotoToProject = async (listName, projectId, file, photoType) => {
    if (!file || !file.type.startsWith('image/')) return;
    
    const compressImage = (file) => {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          const img = new Image();
          img.onload = () => {
            const canvas = document.createElement('canvas');
            let width = img.width;
            let height = img.height;
            
            const maxDimension = 1200;
            if (width > maxDimension || height > maxDimension) {
              if (width > height) {
                height = (height / width) * maxDimension;
                width = maxDimension;
              } else {
                width = (width / height) * maxDimension;
                height = maxDimension;
              }
            }
            
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, width, height);
            
            resolve(canvas.toDataURL('image/jpeg', 0.7));
          };
          img.src = e.target.result;
        };
        reader.readAsDataURL(file);
      });
    };
    
    try {
      const compressedImage = await compressImage(file);
      const photoId = makeId();
      
      setProjects(prev => ({
        ...prev,
        [listName]: (prev[listName] || []).map(project => {
          if (project.id === projectId) {
            const photoArray = project[photoType] || [];
            return { 
              ...project, 
              [photoType]: [...photoArray, { id: photoId, data: compressedImage }]
            };
          }
          return project;
        })
      }));
    } catch (error) {
      console.error('Error adding photo to project:', error);
    }
  };

  const removePhotoFromProject = (listName, projectId, photoId, photoType) => {
    setProjects(prev => ({
      ...prev,
      [listName]: (prev[listName] || []).map(project =>
        project.id === projectId 
          ? { ...project, [photoType]: (project[photoType] || []).filter(photo => photo.id !== photoId) }
          : project
      )
    }));
  };

  const deleteProject = (listName, id) => {
    // Also remove project assignment from all tasks
    const allTaskLists = TASK_LISTS;
    setAllLists(prev => {
      const newLists = { ...prev };
      allTaskLists.forEach(taskListName => {
        newLists[taskListName] = (newLists[taskListName] || []).map(task =>
          task.projectId == id ? { ...task, projectId: null } : task
        );
      });
      return newLists;
    });
    setProjects(prev => ({
      ...prev,
      [listName]: (prev[listName] || []).filter(project => project.id != id)
    }));
    setSelectedProject(null); // Close project detail view after deletion
  };

  const archiveProject = (listName, id) => {
    setProjects(prev => ({
      ...prev,
      [listName]: (prev[listName] || []).map(project =>
        project.id === id
          ? { ...project, archived: true, archivedAt: new Date().toISOString() }
          : project
      )
    }));
    setSelectedProject(null); // Close project detail view after archiving
  };

  const reorderProjects = (listName, fromIndex, toIndex) => {
    setProjects(prev => {
      const list = [...(prev[listName] || [])];
      const [removed] = list.splice(fromIndex, 1);
      list.splice(toIndex, 0, removed);
      return {
        ...prev,
        [listName]: list
      };
    });
  };

  // Goal Functions
  const addGoal = (listName, name, description, startDate, endDate) => {
    const newGoal = {
      id: makeId(),
      name,
      description: description || '',
      challenge: '',
      outcome: '',
      startDate: startDate || null,
      endDate: endDate || null,
      timeLogged: 0,
      timeLogs: [],
      createdAt: new Date().toISOString()
    };
    setGoals(prev => ({
      ...prev,
      [listName]: [newGoal, ...(prev[listName] || [])]
    }));
    return newGoal.id;
  };

  const updateGoal = (listName, id, updates) => {
    setGoals(prev => ({
      ...prev,
      [listName]: (prev[listName] || []).map(goal =>
        goal.id === id ? { ...goal, ...updates } : goal
      )
    }));
  };

  const addPhotoToGoal = async (listName, goalId, file, photoType) => {
    if (!file || !file.type.startsWith('image/')) return;
    
    const compressImage = (file) => {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          const img = new Image();
          img.onload = () => {
            const canvas = document.createElement('canvas');
            let width = img.width;
            let height = img.height;
            
            const maxDimension = 1200;
            if (width > maxDimension || height > maxDimension) {
              if (width > height) {
                height = (height / width) * maxDimension;
                width = maxDimension;
              } else {
                width = (width / height) * maxDimension;
                height = maxDimension;
              }
            }
            
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, width, height);
            
            resolve(canvas.toDataURL('image/jpeg', 0.7));
          };
          img.src = e.target.result;
        };
        reader.readAsDataURL(file);
      });
    };
    
    try {
      const compressedImage = await compressImage(file);
      const photoId = makeId();
      
      setGoals(prev => ({
        ...prev,
        [listName]: (prev[listName] || []).map(goal => {
          if (goal.id === goalId) {
            const photoArray = goal[photoType] || [];
            return { 
              ...goal, 
              [photoType]: [...photoArray, { id: photoId, data: compressedImage }]
            };
          }
          return goal;
        })
      }));
    } catch (error) {
      console.error('Error adding photo to goal:', error);
    }
  };

  const removePhotoFromGoal = (listName, goalId, photoId, photoType) => {
    setGoals(prev => ({
      ...prev,
      [listName]: (prev[listName] || []).map(goal =>
        goal.id === goalId 
          ? { ...goal, [photoType]: (goal[photoType] || []).filter(photo => photo.id !== photoId) }
          : goal
      )
    }));
  };

  const deleteGoal = (listName, id) => {
    // Remove goal assignment from all projects
    const allProjectLists = ['personal', 'work', 'home', 'travel', 'kids'];
    setProjects(prev => {
      const newProjects = { ...prev };
      allProjectLists.forEach(projectListName => {
        newProjects[projectListName] = (newProjects[projectListName] || []).map(project =>
          project.goalId == id ? { ...project, goalId: null } : project
        );
      });
      return newProjects;
    });
    setGoals(prev => ({
      ...prev,
      [listName]: (prev[listName] || []).filter(goal => goal.id != id)
    }));
    setSelectedGoal(null);
  };

  const archiveGoal = (listName, id) => {
    setGoals(prev => ({
      ...prev,
      [listName]: (prev[listName] || []).map(goal =>
        goal.id === id
          ? { ...goal, archived: true, archivedAt: new Date().toISOString() }
          : goal
      )
    }));
    setSelectedGoal(null); // Close goal detail view after archiving
  };

  const reorderGoals = (listName, fromIndex, toIndex) => {
    setGoals(prev => {
      const list = [...(prev[listName] || [])];
      const [removed] = list.splice(fromIndex, 1);
      list.splice(toIndex, 0, removed);
      return {
        ...prev,
        [listName]: list
      };
    });
  };

  // Touch handlers for mobile drag and drop
  const handleTouchStart = (e, item, index, listName, type) => {
    if (e.touches.length !== 1) return;
    setTouchStartY(e.touches[0].clientY);
    setIsTouchDragging(true);
    if (type === 'goal') {
      setDraggedGoal({ ...item, index, listName });
    } else if (type === 'project') {
      setDraggedProject({ ...item, index, listName });
    }
  };

  const handleTouchMove = (e, items, type) => {
    if (!isTouchDragging || e.touches.length !== 1) return;
    e.preventDefault();
    
    const touch = e.touches[0];
    const elementAtTouch = document.elementFromPoint(touch.clientX, touch.clientY);
    
    if (!elementAtTouch) return;
    
    const cardElement = elementAtTouch.closest(type === 'goal' ? '.goal-card' : '.project-card');
    if (!cardElement) return;
    
    // Find which item this card represents
    const cards = Array.from(document.querySelectorAll(type === 'goal' ? '.goal-card' : '.project-card'));
    const targetIndex = cards.indexOf(cardElement);
    
    if (targetIndex >= 0 && targetIndex < items.length) {
      if (type === 'goal') {
        setDragOverGoal({ ...items[targetIndex], index: targetIndex });
      } else if (type === 'project') {
        setDragOverProject({ ...items[targetIndex], index: targetIndex });
      }
    }
  };

  const handleTouchEnd = (e, listName, type) => {
    if (!isTouchDragging) return;
    
    if (type === 'goal' && draggedGoal && dragOverGoal && draggedGoal.id !== dragOverGoal.id) {
      reorderGoals(listName, draggedGoal.index, dragOverGoal.index);
    } else if (type === 'project' && draggedProject && dragOverProject && draggedProject.id !== dragOverProject.id) {
      reorderProjects(listName, draggedProject.index, dragOverProject.index);
    }
    
    setDraggedGoal(null);
    setDragOverGoal(null);
    setDraggedProject(null);
    setDragOverProject(null);
    setIsTouchDragging(false);
    setTouchStartY(null);
  };

  const getCurrentGoals = () => {
    if (currentGoalList === 'master') {
      const masterGoals = [];
      ['personal', 'work', 'home', 'travel', 'kids'].forEach(listName => {
        (goals[listName] || []).forEach(goal => {
          if (!goal.archived) {  // Filter out archived goals
            masterGoals.push({
              ...goal,
              listName
            });
          }
        });
      });
      return masterGoals;
    }
    return (goals[currentGoalList] || []).filter(g => !g.archived);  // Filter out archived
  };

  const addTaskToProject = (projectId, listName) => {
    if (!projectTaskInput.trim()) return;

    const newTask = {
      text: projectTaskInput,
      completed: false,
      priority: projectTaskPriority,
      section: projectTaskSection,
      dueDate: projectTaskDueDate || null,
      details: '',
      id: makeId(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      projectId: projectId
    };

    setAllLists(prev => ({
      ...prev,
      [listName]: [newTask, ...(prev[listName] || [])]
    }));

    setProjectTaskInput('');
    setProjectTaskSection('todo');
    setProjectTaskDueDate('');
    setProjectTaskPriority('low');
  };

  const getCurrentProjects = () => {
    if (currentProjectList === 'master') {
      const masterProjects = [];
      ['personal', 'work', 'home', 'travel'].forEach(listName => {
        if (projects[listName]) {
          projects[listName].forEach(project => {
            if (!project.archived) {  // Filter out archived projects
              masterProjects.push({
                ...project,
                sourceList: listName
              });
            }
          });
        }
      });
      return masterProjects;
    }
    return (projects[currentProjectList] || []).filter(p => !p.archived);  // Filter out archived
  };

  const getAllTimeLogs = () => {
    const allLogs = [];
    
    // Get time logs from all goals
    const allGoalLists = ['personal', 'work', 'home', 'travel', 'kids'];
    allGoalLists.forEach(listName => {
      (goals[listName] || []).forEach(goal => {
        if (goal.timeLogs && goal.timeLogs.length > 0) {
          goal.timeLogs.forEach(log => {
            allLogs.push({
              ...log,
              source: 'goal',
              sourceName: goal.name,
              sourceId: goal.id,
              listName
            });
          });
        }
      });
    });
    
    // Get time logs from all notes
    notes.forEach(note => {
      if (note.timeLogs && note.timeLogs.length > 0) {
        note.timeLogs.forEach(log => {
          allLogs.push({
            ...log,
            source: 'journal',
            sourceName: new Date(note.date).toLocaleDateString('en-US', { 
              weekday: 'long', 
              month: 'long', 
              day: 'numeric' 
            }),
            sourceId: note.id
          });
        });
      }
    });
    
    // Get standalone time logs
    standaloneTimeLogs.forEach(log => {
      allLogs.push({
        ...log,
        source: 'time',
        sourceName: 'Standalone Time Log'
      });
    });
    
    // Sort by date (newest first)
    return allLogs.sort((a, b) => new Date(b.date) - new Date(a.date));
  };

  const getProjectTasks = (projectId) => {
    const tasks = [];
    const allTaskLists = TASK_LISTS;
    
    allTaskLists.forEach(listName => {
      (allLists[listName] || []).forEach((task) => {
        // Use == to handle string/number comparison
        if (task.projectId == projectId && task.projectId !== null && task.projectId !== '') {
          // listName travels with the copy because the task's home list can't be
          // recovered from the task itself. A position deliberately does not:
          // these are copies, so any index attached here would be a promise
          // about an array this object is no longer part of.
          tasks.push({ ...task, listName });
        }
      });
    });
    
    return tasks;
  };

  const getAllProjects = () => {
    const allProjects = [];
    ['personal', 'work', 'home', 'travel', 'kids'].forEach(listName => {
      (projects[listName] || []).forEach(project => {
        allProjects.push({
          ...project,
          listName
        });
      });
    });
    return allProjects;
  };

  const assignTaskToProject = (listName, taskId, projectId) => {
    // Project ids are no longer guaranteed numeric: ones created before this
    // change are numbers, new ones are strings. The <select> always hands back
    // a string, so resolving it against the real project keeps the stored value
    // the same type as that project's own id - coercing blindly in either
    // direction breaks one of the two. Falls back to the raw value if nothing
    // matches.
    let canonical = null;
    if (projectId) {
      const match = getAllProjects().find(p => String(p.id) === String(projectId));
      canonical = match ? match.id : projectId;
    }
    updateTask(listName, taskId, { projectId: canonical });
  };

  

  const StackedLogs = () => (
    <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Bottom log */}
      <ellipse cx="32" cy="50" rx="20" ry="6" fill="#654321"/>
      <rect x="12" y="44" width="40" height="12" rx="2" fill="#8B4513"/>
      <ellipse cx="32" cy="44" rx="20" ry="6" fill="#A0522D"/>
      
      {/* Wood grain lines - bottom log */}
      <line x1="15" y1="46" x2="15" y2="54" stroke="#654321" strokeWidth="0.5" opacity="0.6"/>
      <line x1="20" y1="46" x2="20" y2="54" stroke="#654321" strokeWidth="0.5" opacity="0.6"/>
      <line x1="25" y1="46" x2="25" y2="54" stroke="#654321" strokeWidth="0.5" opacity="0.6"/>
      <line x1="30" y1="46" x2="30" y2="54" stroke="#654321" strokeWidth="0.5" opacity="0.6"/>
      <line x1="35" y1="46" x2="35" y2="54" stroke="#654321" strokeWidth="0.5" opacity="0.6"/>
      <line x1="40" y1="46" x2="40" y2="54" stroke="#654321" strokeWidth="0.5" opacity="0.6"/>
      <line x1="45" y1="46" x2="45" y2="54" stroke="#654321" strokeWidth="0.5" opacity="0.6"/>
      <line x1="49" y1="46" x2="49" y2="54" stroke="#654321" strokeWidth="0.5" opacity="0.6"/>
      
      {/* Middle log */}
      <ellipse cx="32" cy="36" rx="20" ry="6" fill="#654321"/>
      <rect x="12" y="30" width="40" height="12" rx="2" fill="#8B4513"/>
      <ellipse cx="32" cy="30" rx="20" ry="6" fill="#A0522D"/>
      
      {/* Wood grain lines - middle log */}
      <line x1="15" y1="32" x2="15" y2="40" stroke="#654321" strokeWidth="0.5" opacity="0.6"/>
      <line x1="20" y1="32" x2="20" y2="40" stroke="#654321" strokeWidth="0.5" opacity="0.6"/>
      <line x1="25" y1="32" x2="25" y2="40" stroke="#654321" strokeWidth="0.5" opacity="0.6"/>
      <line x1="30" y1="32" x2="30" y2="40" stroke="#654321" strokeWidth="0.5" opacity="0.6"/>
      <line x1="35" y1="32" x2="35" y2="40" stroke="#654321" strokeWidth="0.5" opacity="0.6"/>
      <line x1="40" y1="32" x2="40" y2="40" stroke="#654321" strokeWidth="0.5" opacity="0.6"/>
      <line x1="45" y1="32" x2="45" y2="40" stroke="#654321" strokeWidth="0.5" opacity="0.6"/>
      <line x1="49" y1="32" x2="49" y2="40" stroke="#654321" strokeWidth="0.5" opacity="0.6"/>
      
      {/* Top log */}
      <ellipse cx="32" cy="22" rx="20" ry="6" fill="#654321"/>
      <rect x="12" y="16" width="40" height="12" rx="2" fill="#8B4513"/>
      <ellipse cx="32" cy="16" rx="20" ry="6" fill="#A0522D"/>
      
      {/* Wood grain lines - top log */}
      <line x1="15" y1="18" x2="15" y2="26" stroke="#654321" strokeWidth="0.5" opacity="0.6"/>
      <line x1="20" y1="18" x2="20" y2="26" stroke="#654321" strokeWidth="0.5" opacity="0.6"/>
      <line x1="25" y1="18" x2="25" y2="26" stroke="#654321" strokeWidth="0.5" opacity="0.6"/>
      <line x1="30" y1="18" x2="30" y2="26" stroke="#654321" strokeWidth="0.5" opacity="0.6"/>
      <line x1="35" y1="18" x2="35" y2="26" stroke="#654321" strokeWidth="0.5" opacity="0.6"/>
      <line x1="40" y1="18" x2="40" y2="26" stroke="#654321" strokeWidth="0.5" opacity="0.6"/>
      <line x1="45" y1="18" x2="45" y2="26" stroke="#654321" strokeWidth="0.5" opacity="0.6"/>
      <line x1="49" y1="18" x2="49" y2="26" stroke="#654321" strokeWidth="0.5" opacity="0.6"/>
    </svg>
  );

  

  

  const UnlitTorch = () => (
    <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Torch handle */}
      <rect x="28" y="35" width="8" height="25" rx="1" fill="#8B4513"/>
      <rect x="28" y="35" width="8" height="25" rx="1" fill="#A0522D" opacity="0.6"/>
      
      {/* Torch head (unlit) */}
      <ellipse cx="32" cy="20" rx="10" ry="12" fill="#654321"/>
      <ellipse cx="32" cy="20" rx="8" ry="10" fill="#8B4513"/>
      
      {/* Wrapping texture */}
      <path d="M 28 32 L 28 36 L 36 36 L 36 32" stroke="#654321" strokeWidth="0.5" fill="none"/>
      <path d="M 28 38 L 28 42 L 36 42 L 36 38" stroke="#654321" strokeWidth="0.5" fill="none"/>
    </svg>
  );

  const LitTorch = () => (
    <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Torch handle */}
      <rect x="28" y="35" width="8" height="25" rx="1" fill="#8B4513"/>
      <rect x="28" y="35" width="8" height="25" rx="1" fill="#A0522D" opacity="0.6"/>
      
      {/* Torch head */}
      <ellipse cx="32" cy="22" rx="10" ry="12" fill="#654321"/>
      <ellipse cx="32" cy="22" rx="8" ry="10" fill="#8B4513"/>
      
      {/* Fire - outer flame */}
      <path d="M 32 8 Q 28 11 26 16 Q 24 21 26 26 Q 28 30 32 32 Q 36 30 38 26 Q 40 21 38 16 Q 36 11 32 8 Z" 
            fill="#FF6B35" opacity="0.8"/>
      
      {/* Fire - middle flame */}
      <path d="M 32 10 Q 30 13 29 17 Q 28 21 30 24 Q 31 26 32 27 Q 33 26 34 24 Q 36 21 35 17 Q 34 13 32 10 Z" 
            fill="#FFD93D"/>
      
      {/* Fire - inner flame */}
      <path d="M 32 13 Q 31 15 30.5 18 Q 30 20 31 22 Q 31.5 23 32 23.5 Q 32.5 23 33 22 Q 34 20 33.5 18 Q 33 15 32 13 Z" 
            fill="#FFF4CC"/>
      
      {/* Flickering sparks */}
      <circle cx="28" cy="10" r="1" fill="#FFD93D" opacity="0.8"/>
      <circle cx="36" cy="12" r="0.8" fill="#FFD93D" opacity="0.6"/>
      <circle cx="30" cy="7" r="0.8" fill="#FFF4CC" opacity="0.9"/>
      
      {/* Wrapping texture */}
      <path d="M 28 32 L 28 36 L 36 36 L 36 32" stroke="#654321" strokeWidth="0.5" fill="none"/>
      <path d="M 28 38 L 28 42 L 36 42 L 36 38" stroke="#654321" strokeWidth="0.5" fill="none"/>
    </svg>
  );

  // Clean black flame icon (same as header)
  const CleanFlame = () => (
    <svg version="1.0" xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 1280.000000 1280.000000"
      preserveAspectRatio="xMidYMid meet">
      <g transform="translate(0.000000,1280.000000) scale(0.100000,-0.100000)"
        fill="#000000" stroke="none" opacity="1">
        <path d="M7090 12669 c-1 -257 -76 -628 -175 -871 -149 -365 -354 -643 -825
        -1123 -562 -572 -1053 -1165 -1415 -1710 -256 -385 -443 -729 -568 -1045 -164
        -415 -213 -716 -189 -1167 7 -126 17 -257 22 -293 4 -36 11 -87 15 -115 3 -27
        17 -108 31 -180 66 -339 167 -634 321 -937 181 -358 383 -630 707 -954 206
        -206 336 -319 558 -486 130 -98 458 -322 462 -316 1 1 20 53 40 113 45 131
        132 315 211 452 58 99 233 361 296 443 231 303 515 606 864 926 411 375 725
        680 839 814 99 117 243 309 323 432 261 403 385 922 386 1623 0 207 -4 314
        -17 410 -76 586 -230 1136 -500 1782 -358 860 -885 1741 -1298 2168 l-87 90
        -1 -56z"/>
        <path d="M9510 9493 c0 -5 9 -55 21 -113 89 -462 132 -1021 110 -1453 -13
        -249 -39 -482 -67 -597 -109 -438 -605 -1140 -1299 -1835 -126 -127 -291 -284
        -365 -350 -160 -142 -223 -206 -374 -380 -276 -318 -452 -600 -476 -761 -5
        -38 -19 -133 -31 -211 -21 -141 -21 -189 2 -261 8 -25 15 -32 28 -26 73 31
        289 101 416 134 203 54 418 97 820 164 894 149 1116 222 1550 511 387 257 676
        553 814 833 98 197 195 572 233 892 19 165 16 597 -5 780 -104 913 -509 1833
        -1058 2404 -105 109 -294 276 -312 276 -4 0 -7 -3 -7 -7z"/>
        <path d="M3355 8046 c-199 -134 -336 -247 -523 -430 -189 -186 -290 -306 -418
        -498 -270 -403 -415 -856 -401 -1261 8 -258 75 -514 202 -772 237 -481 641
        -873 1170 -1135 358 -177 715 -283 1170 -349 153 -22 511 -54 546 -49 16 2
        -12 23 -107 82 -709 437 -1164 850 -1434 1303 -118 197 -228 493 -244 653 -4
        36 -11 92 -16 125 -5 33 -16 116 -25 185 -8 69 -20 163 -26 210 -6 47 -13 196
        -16 332 -5 240 4 411 38 673 5 44 12 98 15 120 3 22 9 65 14 95 5 30 12 73 16
        95 26 174 135 576 188 698 5 9 4 17 0 17 -5 0 -72 -43 -149 -94z"/>
      </g>
    </svg>
  );

  const BurningCampfire = () => (
    <svg version="1.0" xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 1280.000000 1280.000000"
      preserveAspectRatio="xMidYMid meet">
      <g transform="translate(0.000000,1280.000000) scale(0.100000,-0.100000)"
        fill="#3a3a4a" stroke="none">
        <path d="M7090 12669 c-1 -257 -76 -628 -175 -871 -149 -365 -354 -643 -825
        -1123 -562 -572 -1053 -1165 -1415 -1710 -256 -385 -443 -729 -568 -1045 -164
        -415 -213 -716 -189 -1167 7 -126 17 -257 22 -293 4 -36 11 -87 15 -115 3 -27
        17 -108 31 -180 66 -339 167 -634 321 -937 181 -358 383 -630 707 -954 206
        -206 336 -319 558 -486 130 -98 458 -322 462 -316 1 1 20 53 40 113 45 131
        132 315 211 452 58 99 233 361 296 443 231 303 515 606 864 926 411 375 725
        680 839 814 99 117 243 309 323 432 261 403 385 922 386 1623 0 207 -4 314
        -17 410 -76 586 -230 1136 -500 1782 -358 860 -885 1741 -1298 2168 l-87 90
        -1 -56z"/>
        <path d="M9510 9493 c0 -5 9 -55 21 -113 89 -462 132 -1021 110 -1453 -13
        -249 -39 -482 -67 -597 -109 -438 -605 -1140 -1299 -1835 -126 -127 -291 -284
        -365 -350 -160 -142 -223 -206 -374 -380 -276 -318 -452 -600 -476 -761 -5
        -38 -19 -133 -31 -211 -21 -141 -21 -189 2 -261 8 -25 15 -32 28 -26 73 31
        289 101 416 134 203 54 418 97 820 164 894 149 1116 222 1550 511 387 257 676
        553 814 833 98 197 195 572 233 892 19 165 16 597 -5 780 -104 913 -509 1833
        -1058 2404 -105 109 -294 276 -312 276 -4 0 -7 -3 -7 -7z"/>
        <path d="M3355 8046 c-199 -134 -336 -247 -523 -430 -189 -186 -290 -306 -418
        -498 -270 -403 -415 -856 -401 -1261 8 -258 75 -514 202 -772 237 -481 641
        -873 1170 -1135 358 -177 715 -283 1170 -349 153 -22 511 -54 546 -49 16 2
        -12 23 -107 82 -709 437 -1164 850 -1434 1303 -118 197 -228 493 -244 653 -4
        36 -11 92 -16 125 -5 33 -16 116 -25 185 -8 69 -20 163 -26 210 -6 47 -13 196
        -16 332 -5 240 4 411 38 673 5 44 12 98 15 120 3 22 9 65 14 95 5 30 12 73 16
        95 26 174 135 576 188 698 5 9 4 17 0 17 -5 0 -72 -43 -149 -94z"/>
        <path d="M9665 3254 c-346 -57 -781 -124 -965 -149 -677 -92 -1035 -163 -1440
        -284 -192 -58 -422 -143 -413 -152 11 -10 304 -98 529 -159 507 -136 1295
        -295 1634 -331 l105 -11 850 186 c468 102 857 190 865 195 22 12 59 123 66
        199 8 79 -12 168 -54 246 -38 72 -154 182 -249 238 -74 44 -269 129 -289 127
        -5 -1 -292 -48 -639 -105z"/>
        <path d="M2494 3104 c-79 -59 -212 -194 -265 -268 -55 -77 -101 -188 -119
        -290 -16 -84 -8 -247 17 -366 l18 -85 130 -12 c396 -37 672 -68 1166 -133 116
        -16 431 -69 590 -100 301 -59 610 -153 1009 -305 412 -157 617 -225 855 -284
        208 -51 314 -70 670 -115 349 -44 526 -68 582 -76 33 -6 94 -15 135 -20 40 -5
        181 -25 313 -45 432 -64 653 -95 833 -115 217 -26 319 -50 627 -151 360 -119
        665 -189 650 -151 -14 36 -55 193 -66 249 -18 97 -7 324 19 400 67 191 225
        344 447 434 83 33 90 38 93 66 l3 30 -113 7 c-98 5 -295 26 -528 56 -89 11
        -387 58 -485 75 -347 64 -588 110 -690 131 -66 13 -164 33 -217 44 -54 11
        -117 24 -140 30 -24 5 -97 21 -163 35 -613 132 -855 195 -1360 350 -269 82
        -575 163 -720 190 -104 20 -118 22 -450 69 -137 19 -297 42 -355 51 -159 23
        -408 57 -770 105 -124 16 -274 37 -335 45 -115 16 -409 55 -750 100 -274 36
        -547 75 -566 81 -9 2 -38 -11 -65 -32z"/>
        <path d="M3290 1695 c-41 -13 -194 -58 -340 -100 -146 -42 -291 -83 -322 -93
        -32 -9 -58 -20 -58 -24 0 -4 5 -8 10 -8 31 0 214 -124 293 -200 111 -104 175
        -199 213 -316 27 -82 29 -100 29 -239 -1 -154 -13 -239 -56 -388 -11 -38 -19
        -72 -17 -76 2 -4 515 197 1141 447 625 250 1135 457 1132 460 -11 11 -785 297
        -965 356 -367 121 -624 176 -925 200 -45 3 -79 -2 -135 -19z"/>
        <path d="M10462 1600 c-116 -31 -205 -84 -302 -180 -70 -69 -95 -101 -128
        -170 -55 -112 -73 -185 -73 -297 -1 -177 42 -294 140 -385 89 -83 151 -103
        321 -103 111 0 147 4 205 22 176 56 325 194 389 362 28 75 30 301 2 401 -42
        154 -134 281 -243 335 -78 39 -202 45 -311 15z"/>
        <path d="M2160 1293 c-261 -34 -422 -173 -485 -418 -19 -76 -20 -300 -1 -372
        48 -178 160 -296 343 -360 74 -26 88 -27 253 -27 162 0 180 2 248 26 134 48
        215 116 271 226 53 105 65 170 65 342 -1 139 -4 162 -27 227 -13 40 -36 92
        -51 116 -62 106 -191 192 -331 222 -76 16 -229 26 -285 18z"/>
      </g>
    </svg>
  );

  const CheckedBox = () => (
    <svg viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Rounded checkbox background */}
      <rect x="16" y="16" width="48" height="48" rx="12" ry="12" 
            fill="url(#checkboxGradient)" stroke="#6a8f76" strokeWidth="3"/>
      
      {/* Gradient definition */}
      <defs>
        <linearGradient id="checkboxGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#53745f"/>
          <stop offset="100%" stopColor="#6a8f76"/>
        </linearGradient>
      </defs>
      
      {/* Checkmark */}
      <path d="M 26 40 L 36 50 L 54 30" 
            stroke="#ffffff" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
    </svg>
  );

  const CutLog = () => (
    <svg viewBox="0 0 600 512" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <style>{`
          .log { fill: #c0c0c0; stroke: #808080; stroke-width: 8; }
          .ring { fill: #d0d0d0; stroke: #808080; stroke-width: 8; }
          .inner-ring { fill: none; stroke: #808080; stroke-width: 5; }
          .bark { stroke: #707070; stroke-width: 5; stroke-linecap: round; }
          .texture { stroke: #e0e0e0; stroke-width: 4; stroke-linecap: round; opacity: 0.25; }
        `}</style>
      </defs>
      {/* Bottom Left Log - Much Thicker */}
      <g>
        <rect x="120" y="300" rx="70" ry="70" width="340" height="140" className="log"/>
        <circle cx="120" cy="370" r="70" className="ring"/>
        <circle cx="120" cy="370" r="40" className="inner-ring"/>
        <line x1="220" y1="330" x2="310" y2="330" className="bark"/>
        <line x1="250" y1="380" x2="350" y2="380" className="bark"/>
        <line x1="260" y1="410" x2="330" y2="410" className="texture"/>
      </g>
      {/* Bottom Right Log - Much Thicker */}
      <g>
        <rect x="270" y="300" rx="70" ry="70" width="340" height="140" className="log"/>
        <circle cx="270" cy="370" r="70" className="ring"/>
        <circle cx="270" cy="370" r="40" className="inner-ring"/>
        <line x1="370" y1="330" x2="460" y2="330" className="bark"/>
        <line x1="400" y1="380" x2="500" y2="380" className="bark"/>
        <line x1="410" y1="410" x2="480" y2="410" className="texture"/>
      </g>
      {/* Top Center Log - Much Thicker */}
      <g>
        <rect x="195" y="160" rx="70" ry="70" width="340" height="140" className="log"/>
        <circle cx="195" cy="230" r="70" className="ring"/>
        <circle cx="195" cy="230" r="40" className="inner-ring"/>
        <line x1="295" y1="190" x2="385" y2="190" className="bark"/>
        <line x1="325" y1="240" x2="425" y2="240" className="bark"/>
        <line x1="335" y1="270" x2="405" y2="270" className="texture"/>
      </g>
    </svg>
  );

  const renderTasks = () => {
    if (currentList === 'master') {
      const listNames = visibleTaskLists;
      const listLabels = Object.fromEntries(TASK_LISTS.map(k => [k, listSectionLabel(k)]));

      let hasAnyTasks = false;
      const sections = listNames.map(listName => {
        if (!allLists[listName]) return null;
        const tasks = applyFilters(allLists[listName].filter(t => t.section === 'todo' && !t.completed))
          .sort((a, b) => {
            // Sort by priority first (high priority first)
            if (a.priority === 'high' && b.priority !== 'high') return -1;
            if (a.priority !== 'high' && b.priority === 'high') return 1;
            return 0;
          });
        if (tasks.length === 0) return null;
        hasAnyTasks = true;

        return (
          <div key={listName} className="list-section">
            <div 
              className="list-section-header"
              onClick={() => toggleList(listName)}
              style={{cursor: 'pointer'}}
            >
              <span>{listLabels[listName]}</span>
              <span className={`badge ${listName}`}>{tasks.length}</span>
            </div>
            {!collapsedLists[listName] && (
              <>
                {tasks.map((task) => {
                  return (
                    <div key={task.id} style={{position: 'relative'}}>
                      {task.isArchived && (
                        <div className="archived-indicator"><ArchiveIcon /> Archived</div>
                      )}
                      <Task
                        key={task.id}
                        task={task}
                        listName={listName}
                        showMoveButtons={true}
                      />
                    </div>
                  );
                })}
              </>
            )}
          </div>
        );
      });

      if (!hasAnyTasks) {
        return (
          <div className="empty-state" style={{display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '300px'}}>
            <div style={{
              width: '180px',
              height: '180px',
              position: 'relative',
              display: 'inline-block'
            }}>
              {/* Background circle */}
              <svg 
                style={{
                  position: 'absolute',
                  top: '-15px',
                  left: '-15px',
                  width: '210px',
                  height: '210px',
                  transform: 'rotate(-90deg)',
                  pointerEvents: 'none'
                }}
              >
                <circle
                  cx="105"
                  cy="105"
                  r="95"
                  fill="none"
                  stroke="rgba(var(--surface-alt-rgb), 0.3)"
                  strokeWidth="8"
                />
              </svg>
              
              {/* Dark Fire Icon */}
              <svg version="1.0" xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 1280.000000 1280.000000"
                preserveAspectRatio="xMidYMid meet"
                style={{
                  width: '100%',
                  height: '100%',
                  filter: 'drop-shadow(0 0 10px rgba(100, 100, 100, 0.3))'
                }}>
                <g transform="translate(0.000000,1280.000000) scale(0.100000,-0.100000)"
                  fill="#3a3a4a" stroke="none">
                  <path d="M7090 12669 c-1 -257 -76 -628 -175 -871 -149 -365 -354 -643 -825
                  -1123 -562 -572 -1053 -1165 -1415 -1710 -256 -385 -443 -729 -568 -1045 -164
                  -415 -213 -716 -189 -1167 7 -126 17 -257 22 -293 4 -36 11 -87 15 -115 3 -27
                  17 -108 31 -180 66 -339 167 -634 321 -937 181 -358 383 -630 707 -954 206
                  -206 336 -319 558 -486 130 -98 458 -322 462 -316 1 1 20 53 40 113 45 131
                  132 315 211 452 58 99 233 361 296 443 231 303 515 606 864 926 411 375 725
                  680 839 814 99 117 243 309 323 432 261 403 385 922 386 1623 0 207 -4 314
                  -17 410 -76 586 -230 1136 -500 1782 -358 860 -885 1741 -1298 2168 l-87 90
                  -1 -56z"/>
                  <path d="M9510 9493 c0 -5 9 -55 21 -113 89 -462 132 -1021 110 -1453 -13
                  -249 -39 -482 -67 -597 -109 -438 -605 -1140 -1299 -1835 -126 -127 -291 -284
                  -365 -350 -160 -142 -223 -206 -374 -380 -276 -318 -452 -600 -476 -761 -5
                  -38 -19 -133 -31 -211 -21 -141 -21 -189 2 -261 8 -25 15 -32 28 -26 73 31
                  289 101 416 134 203 54 418 97 820 164 894 149 1116 222 1550 511 387 257 676
                  553 814 833 98 197 195 572 233 892 19 165 16 597 -5 780 -104 913 -509 1833
                  -1058 2404 -105 109 -294 276 -312 276 -4 0 -7 -3 -7 -7z"/>
                  <path d="M3355 8046 c-199 -134 -336 -247 -523 -430 -189 -186 -290 -306 -418
                  -498 -270 -403 -415 -856 -401 -1261 8 -258 75 -514 202 -772 237 -481 641
                  -873 1170 -1135 358 -177 715 -283 1170 -349 153 -22 511 -54 546 -49 16 2
                  -12 23 -107 82 -709 437 -1164 850 -1434 1303 -118 197 -228 493 -244 653 -4
                  36 -11 92 -16 125 -5 33 -16 116 -25 185 -8 69 -20 163 -26 210 -6 47 -13 196
                  -16 332 -5 240 4 411 38 673 5 44 12 98 15 120 3 22 9 65 14 95 5 30 12 73 16
                  95 26 174 135 576 188 698 5 9 4 17 0 17 -5 0 -72 -43 -149 -94z"/>
                </g>
              </svg>
            </div>
          </div>
        );
      }

      return sections;
    } else {
      const allTasks = getCurrentTasks();
      const todoTasks = allTasks.filter(t => t.section === 'todo' && !t.completed).sort((a, b) => {
        // Pin high priority (fire flag) tasks to the top
        if (a.priority === 'high' && b.priority !== 'high') return -1;
        if (a.priority !== 'high' && b.priority === 'high') return 1;
        return 0;
      });
      const backlogTasks = allTasks.filter(t => t.section === 'backlog' && !t.completed).sort((a, b) => {
        // Pin high priority (fire flag) tasks to the top
        if (a.priority === 'high' && b.priority !== 'high') return -1;
        if (a.priority !== 'high' && b.priority === 'high') return 1;
        return 0;
      });
      const completedTasks = allTasks.filter(t => t.completed);

      return (
        <>
          <div className="list-section">
            <div 
              className="list-section-header"
              onClick={() => setShowToDoSection(!showToDoSection)}
              style={{cursor: 'pointer'}}
            >
              <span className="section-icon campfire-icon"><CleanFlame /></span>
              <span>To Do</span>
              <span className="badge work">{todoTasks.length}</span>
            </div>
            {showToDoSection && (
              <>
                {todoTasks.length === 0 ? (
                  <div style={{display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '200px'}}>
                    <div style={{
                      width: '120px',
                      height: '120px',
                      position: 'relative',
                      display: 'inline-block'
                    }}>
                      {/* Background circle */}
                      <svg 
                        style={{
                          position: 'absolute',
                          top: '-10px',
                          left: '-10px',
                          width: '140px',
                          height: '140px',
                          transform: 'rotate(-90deg)',
                          pointerEvents: 'none'
                        }}
                      >
                        <circle
                          cx="70"
                          cy="70"
                          r="63"
                          fill="none"
                          stroke="rgba(var(--surface-alt-rgb), 0.3)"
                          strokeWidth="6"
                        />
                      </svg>
                      
                      {/* Dark Fire Icon */}
                      <svg version="1.0" xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 1280.000000 1280.000000"
                        preserveAspectRatio="xMidYMid meet"
                        style={{
                          width: '100%',
                          height: '100%',
                          filter: 'drop-shadow(0 0 10px rgba(100, 100, 100, 0.3))'
                        }}>
                        <g transform="translate(0.000000,1280.000000) scale(0.100000,-0.100000)"
                          fill="#3a3a4a" stroke="none">
                          <path d="M7090 12669 c-1 -257 -76 -628 -175 -871 -149 -365 -354 -643 -825
                          -1123 -562 -572 -1053 -1165 -1415 -1710 -256 -385 -443 -729 -568 -1045 -164
                          -415 -213 -716 -189 -1167 7 -126 17 -257 22 -293 4 -36 11 -87 15 -115 3 -27
                          17 -108 31 -180 66 -339 167 -634 321 -937 181 -358 383 -630 707 -954 206
                          -206 336 -319 558 -486 130 -98 458 -322 462 -316 1 1 20 53 40 113 45 131
                          132 315 211 452 58 99 233 361 296 443 231 303 515 606 864 926 411 375 725
                          680 839 814 99 117 243 309 323 432 261 403 385 922 386 1623 0 207 -4 314
                          -17 410 -76 586 -230 1136 -500 1782 -358 860 -885 1741 -1298 2168 l-87 90
                          0 -151z"/>
                        </g>
                      </svg>
                    </div>
                  </div>
                ) : (
                  todoTasks.map((task) => (
                      <Task
                        key={task.id}
                        task={task}
                        listName={currentList}
                        showMoveButtons={true}
                      />
                    ))
                )}
              </>
            )}
          </div>

          <div className="list-section">
            <div 
              className="list-section-header"
              onClick={() => setShowBacklogSection(!showBacklogSection)}
              style={{cursor: 'pointer'}}
            >
              <span className="section-icon logs-icon"><CutLog /></span>
              <span>Backlog</span>
              <span className="badge personal">{backlogTasks.length}</span>
            </div>
            {showBacklogSection && (
              <>
                {backlogTasks.length === 0 ? (
                  <div style={{display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '200px'}}>
                    <div style={{
                      width: '120px',
                      height: '120px',
                      position: 'relative',
                      display: 'inline-block'
                    }}>
                      {/* Background circle */}
                      <svg 
                        style={{
                          position: 'absolute',
                          top: '-10px',
                          left: '-10px',
                          width: '140px',
                          height: '140px',
                          transform: 'rotate(-90deg)',
                          pointerEvents: 'none'
                        }}
                      >
                        <circle
                          cx="70"
                          cy="70"
                          r="63"
                          fill="none"
                          stroke="rgba(var(--surface-alt-rgb), 0.3)"
                          strokeWidth="6"
                        />
                      </svg>
                      
                      {/* Dark Fire Icon */}
                      <svg version="1.0" xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 1280.000000 1280.000000"
                        preserveAspectRatio="xMidYMid meet"
                        style={{
                          width: '100%',
                          height: '100%',
                          filter: 'drop-shadow(0 0 10px rgba(100, 100, 100, 0.3))'
                        }}>
                        <g transform="translate(0.000000,1280.000000) scale(0.100000,-0.100000)"
                          fill="#3a3a4a" stroke="none">
                          <path d="M7090 12669 c-1 -257 -76 -628 -175 -871 -149 -365 -354 -643 -825
                          -1123 -562 -572 -1053 -1165 -1415 -1710 -256 -385 -443 -729 -568 -1045 -164
                          -415 -213 -716 -189 -1167 7 -126 17 -257 22 -293 4 -36 11 -87 15 -115 3 -27
                          17 -108 31 -180 66 -339 167 -634 321 -937 181 -358 383 -630 707 -954 206
                          -206 336 -319 558 -486 130 -98 458 -322 462 -316 1 1 20 53 40 113 45 131
                          132 315 211 452 58 99 233 361 296 443 231 303 515 606 864 926 411 375 725
                          680 839 814 99 117 243 309 323 432 261 403 385 922 386 1623 0 207 -4 314
                          -17 410 -76 586 -230 1136 -500 1782 -358 860 -885 1741 -1298 2168 l-87 90
                          0 -151z"/>
                        </g>
                      </svg>
                    </div>
                  </div>
                ) : (
                  backlogTasks.map((task) => (
                      <Task
                        key={task.id}
                        task={task}
                        listName={currentList}
                        showMoveButtons={true}
                      />
                    ))
                )}
              </>
            )}
          </div>

          <div className="list-section">
            <div 
              className="list-section-header"
              onClick={() => setShowCompletedTasks(!showCompletedTasks)}
              style={{cursor: 'pointer'}}
            >
              <span className="section-icon checkbox-icon"><CheckedBox /></span>
              <span>Complete</span>
              <span className="badge home">{completedTasks.length}</span>
            </div>
            {showCompletedTasks && (
              <>
                {completedTasks.length === 0 ? (
                  <div style={{display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '200px'}}>
                    <div style={{
                      width: '120px',
                      height: '120px',
                      position: 'relative',
                      display: 'inline-block'
                    }}>
                      {/* Background circle */}
                      <svg 
                        style={{
                          position: 'absolute',
                          top: '-10px',
                          left: '-10px',
                          width: '140px',
                          height: '140px',
                          transform: 'rotate(-90deg)',
                          pointerEvents: 'none'
                        }}
                      >
                        <circle
                          cx="70"
                          cy="70"
                          r="63"
                          fill="none"
                          stroke="rgba(var(--surface-alt-rgb), 0.3)"
                          strokeWidth="6"
                        />
                      </svg>
                      
                      {/* Dark Fire Icon */}
                      <svg version="1.0" xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 1280.000000 1280.000000"
                        preserveAspectRatio="xMidYMid meet"
                        style={{
                          width: '100%',
                          height: '100%',
                          filter: 'drop-shadow(0 0 10px rgba(100, 100, 100, 0.3))'
                        }}>
                        <g transform="translate(0.000000,1280.000000) scale(0.100000,-0.100000)"
                          fill="#3a3a4a" stroke="none">
                          <path d="M7090 12669 c-1 -257 -76 -628 -175 -871 -149 -365 -354 -643 -825
                          -1123 -562 -572 -1053 -1165 -1415 -1710 -256 -385 -443 -729 -568 -1045 -164
                          -415 -213 -716 -189 -1167 7 -126 17 -257 22 -293 4 -36 11 -87 15 -115 3 -27
                          17 -108 31 -180 66 -339 167 -634 321 -937 181 -358 383 -630 707 -954 206
                          -206 336 -319 558 -486 130 -98 458 -322 462 -316 1 1 20 53 40 113 45 131
                          132 315 211 452 58 99 233 361 296 443 231 303 515 606 864 926 411 375 725
                          680 839 814 99 117 243 309 323 432 261 403 385 922 386 1623 0 207 -4 314
                          -17 410 -76 586 -230 1136 -500 1782 -358 860 -885 1741 -1298 2168 l-87 90
                          0 -151z"/>
                        </g>
                      </svg>
                    </div>
                  </div>
                ) : (
                  completedTasks.map((task) => (
                      <Task
                        key={task.id}
                        task={task}
                        listName={currentList}
                        showMoveButtons={true}
                      />
                    ))
                )}
              </>
            )}
          </div>
        </>
      );
    }
  };

  // Built here, at the end of the component, so every one of these is already
  // declared - the return is the only point where that is guaranteed.
  //
  // Deliberately not memoised. A new object each render means every Task
  // re-renders when the app does, which is exactly what happened before - the
  // difference is that they now re-render instead of remounting, so editor
  // state, focus, drags and the undo stack all survive.
  const taskContextValue = {
    allLists,
    archiveTask,
    assignTaskToProject,
    canReorderTogether,
    collapseGuardRef,
    cycleAssignment,
    deleteTask,
    draggingTaskRef,
    editingTaskName,
    expandedTaskId,
    findTask,
    getAllProjects,
    isFeatureOn,
    isSharedList,
    moveTaskToSection,
    parseLocalDateTime,
    partnerDisplayName,
    renameTask,
    reorderTask,
    setEditingTaskName,
    setExpandedTaskId,
    settings,
    toggleTask,
    updateTaskDetails,
    updateTaskDueDate,
    updateTaskPriority
  };

  return (
    <TaskContext.Provider value={taskContextValue}>
    <div className="little-fires-container">
      {/* Rendered at the container root so it sits above whatever triggered it,
          rather than inside a card that might be scrolled or clipped. */}
      {confirmRequest && (
        <div
          className="modal-overlay"
          onClick={() => settleConfirm(false)}
          style={{ zIndex: 4000 }}
        >
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{ width: '90%', maxWidth: '380px', padding: '20px' }}
          >
            <div style={{
              color: 'var(--text)', fontFamily: 'var(--font-ui)',
              fontSize: '0.95rem', lineHeight: 1.5, whiteSpace: 'pre-line',
              marginBottom: '18px'
            }}>
              {confirmRequest.message}
            </div>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
              <button className="cancel-project-btn" onClick={() => settleConfirm(false)}>
                Cancel
              </button>
              <button className="delete-project-btn" onClick={() => settleConfirm(true)}>
                {confirmRequest.confirmLabel}
              </button>
            </div>
          </div>
        </div>
      )}
      <style>{`
        /* The Google Fonts @import that used to sit here has moved to the
           <link> tags in index.html. An @import inside a style element that
           React renders can't be seen by the browser's preload scanner, so the
           fonts weren't even requested until the bundle had parsed and the app
           had mounted. Nunito 800 went with it - nothing referenced it. */

        /* Theme tokens. Everything accent-colored resolves through these, so
           changing them recolors the whole app. --accent-rgb is kept as a raw
           triplet so it can be composed into rgba() at any opacity. */
        :root {
          color-scheme: dark;
          --accent: #53745f;
          --accent-light: #6a8f76;
          --accent-rgb: 83, 116, 95;
          --accent-muted-rgb: 98, 111, 112;

          /* Surface and text tokens. Every hardcoded colour that defined the
             dark look now resolves through these - 422 occurrences - so a theme
             is a change of values here rather than a change everywhere.
             The rgba ones are raw triplets because they're composed at dozens
             of different opacities. */
          --font-ui: 'Quicksand', sans-serif;
          --font-body: 'Nunito', sans-serif;
          --text: #f4e8d8;
          --text-muted: #b8a99a;
          --text-soft: #d0c8c0;
          --surface-line: #3a3a4a;
          --surface-rgb: 42, 42, 62;
          --surface-raised-rgb: 52, 52, 72;
          /* One step brighter than a resting card - on dark that means lighter,
             on light it means very slightly darker. Only the direction differs,
             which is exactly why it needed a token rather than a fixed value. */
          --surface-hover-rgb: 62, 62, 82;
          --surface-alt-rgb: 58, 58, 74;
          --surface-deep-rgb: 30, 30, 46;
          --border-rgb: 100, 116, 139;
          /* Shadows are black on a dark ground, but pure black over warm ivory
             goes dead grey and flattens the paper effect back to screen. */
          --shadow-rgb: 0, 0, 0;
          /* Fibre. A flat fill is the giveaway that a surface is a screen -
             on dark it also breaks up the banding a large gradient produces.
             Generated, not an asset: nothing to download, and it tiles. */
          --grain: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='180' height='180'%3E%3Cfilter id='g'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' fill='none' filter='url(%23g)' opacity='0.07'/%3E%3C/svg%3E");
          --bg-1: #1a1a2e;
          --bg-2: #2d2d44;
          --bg-3: #3a3a52;
        }

        /* Light theme. Not an inversion - the dark theme layers translucent
           light surfaces over a dark ground, and simply flipping the numbers
           gives muddy grey. These are picked so the same opacities still read
           as raised panels against a pale ground.
           color-scheme also switches, so native controls, scrollbars and form
           widgets follow rather than staying dark. */
        .theme-light {
          color-scheme: light;
          /* Warm ivory rather than cool grey. The first pass derived these from
             the dark navy and came out blue-tinted, which sat oddly against an
             app whose dark theme uses cream text - the warmth is the through
             line between the two themes, not the hue. */
          --text: #37352f;
          --text-muted: #5f5b52;
          --text-soft: #4a473f;
          --surface-line: #e0dcd1;
          --surface-rgb: 255, 254, 251;
          --surface-raised-rgb: 252, 251, 246;
          /* Warm, and only a touch darker than the resting card. A hover should
             read as a nudge on paper, not as a highlighter. */
          --surface-hover-rgb: 240, 237, 227;
          --surface-alt-rgb: 246, 244, 236;
          --surface-deep-rgb: 255, 255, 253;
          --border-rgb: 176, 169, 152;
          --shadow-rgb: 92, 78, 54;
          /* Heavier on light: dark flecks on a pale ground are what actually
             read as paper, and light needs more of it than dark does before
             the texture registers at all. */
          --grain: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='180' height='180'%3E%3Cfilter id='g'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' fill='none' filter='url(%23g)' opacity='0.11'/%3E%3C/svg%3E");
          --bg-1: #faf9f5;
          --bg-2: #f0eee6;
          --bg-3: #e9e6da;
        }

        /* Respect the OS "reduce motion" setting, and the in-app toggle.
           This app animates a lot (flame fill, chart draw-in, dot pops). */
        @media (prefers-reduced-motion: reduce) {
          *, *::before, *::after {
            animation-duration: 0.001ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0.001ms !important;
          }
        }

        /* Backdrop blur re-computes the blurred region on every composite, which
           is one of the more expensive things a mobile GPU is asked to do. The
           surfaces underneath are near-opaque already, so dropping it costs
           very little visually. Universal selector because the blur is applied
           across a dozen separate rules. */
        .battery-saver *, .battery-saver *::before, .battery-saver *::after {
          backdrop-filter: none !important;
          -webkit-backdrop-filter: none !important;
        }

        /* The ambient glow layer: fixed, 200% x 200% - four screens of area -
           and three stacked radial gradients. Being fixed, the compositor holds
           that whole surface while you scroll. Hiding it is the single biggest
           saving in this mode; the background gradient underneath carries the
           look on its own. */
        .battery-saver .little-fires-container::before {
          display: none !important;
        }

        /* Grain is a full-screen tiled image composited under everything, so it
           goes with the rest of the decorative load. */
        .battery-saver .little-fires-container {
          background: linear-gradient(135deg, var(--bg-1) 0%, var(--bg-2) 50%, var(--bg-3) 100%) !important;
        }

        .reduce-motion *, .reduce-motion *::before, .reduce-motion *::after {
          animation-duration: 0.001ms !important;
          animation-iteration-count: 1 !important;
          transition-duration: 0.001ms !important;
        }

        /* The container clips its own overflow, but the document is a separate
           scroller - a transformed child can still widen the page itself. */
        html, body {
          overflow-x: hidden;
          overscroll-behavior-x: none;
        }

        .little-fires-container {
          font-family: var(--font-body);
          /* Grain first, gradient second - background layers paint front to
             back, so this puts the texture over the colour while both stay
             behind every element in the app. No overlay element, so nothing to
             get the stacking order wrong with. */
          background: var(--grain), linear-gradient(135deg, var(--bg-1) 0%, var(--bg-2) 50%, var(--bg-3) 100%);
          background-attachment: fixed, fixed;
          color: var(--text);
          min-height: 100vh;
          /* Plain values first, then the inset-aware versions. A browser
             without env() support treats the second set as invalid and keeps
             the first, so nothing is lost.
             These matter because the app declares black-translucent as its iOS
             status bar style: a home-screen install renders edge to edge, and
             without this the header sits under the clock and the footer under
             the home indicator. max() keeps the existing spacing on devices
             that have no insets at all. */
          padding: 40px 20px;
          padding-top: max(40px, env(safe-area-inset-top));
          padding-right: max(20px, env(safe-area-inset-right));
          padding-bottom: max(40px, env(safe-area-inset-bottom));
          padding-left: max(20px, env(safe-area-inset-left));
          position: relative;
          overflow-x: hidden;
        }

        .little-fires-container::before {
          content: '';
          position: fixed;
          top: -50%;
          left: -50%;
          width: 200%;
          height: 200%;
          background: 
            radial-gradient(circle at 20% 30%, rgba(var(--accent-rgb), 0.15) 0%, transparent 50%),
            radial-gradient(circle at 80% 70%, rgba(127, 176, 105, 0.1) 0%, transparent 50%),
            radial-gradient(circle at 50% 50%, rgba(168, 230, 207, 0.08) 0%, transparent 50%);
          pointer-events: none;
          z-index: 0;
        }


        @keyframes flameGlow {
          0% { 
            filter: drop-shadow(0 0 25px rgba(255, 69, 0, 0.8));
          }
          50% { 
            filter: drop-shadow(0 0 45px rgba(255, 69, 0, 1)) drop-shadow(0 0 60px rgba(255, 100, 0, 0.6));
          }
          100% { 
            filter: drop-shadow(0 0 25px rgba(255, 69, 0, 0.8));
          }
        }

        /* Report chart: draw the series left-to-right.
           Paths use pathLength="1" so the dash math is resolution-independent. */
        @keyframes drawLine {
          from { stroke-dashoffset: 1; }
          to   { stroke-dashoffset: 0; }
        }

        @keyframes growBar {
          from { transform: scaleY(0); }
          to   { transform: scaleY(1); }
        }

        @keyframes dotPop {
          0%   { opacity: 0; transform: scale(0.2); }
          70%  { opacity: 1; transform: scale(1.15); }
          100% { opacity: 1; transform: scale(1); }
        }

        @keyframes progressRing {
          0% {
            stroke-dashoffset: 597;
          }
          100% {
            stroke-dashoffset: 0;
          }
        }

        .container {
          max-width: 800px;
          margin: 0 auto;
          padding: 0 24px;
          position: relative;
          z-index: 1;
          box-sizing: border-box;
        }

        .hamburger-menu {
          position: absolute;
          top: 20px;
          left: 20px;
          cursor: pointer;
          z-index: 100;
        }

        .hamburger-icon {
          display: flex;
          flex-direction: column;
          gap: 6px;
          padding: 10px;
          background: rgba(var(--surface-rgb), 0.8);
          backdrop-filter: blur(10px);
          border-radius: 12px;
          border: 2px solid rgba(var(--border-rgb), 0.3);
          transition: all 0.3s ease;
        }

        .hamburger-icon:hover {
          border-color: rgba(var(--border-rgb), 0.6);
          transform: scale(1.05);
        }

        .hamburger-line {
          width: 28px;
          height: 3px;
          background: #B8B8B8;
          border-radius: 2px;
          transition: all 0.3s ease;
        }

        .menu-dropdown {
          position: absolute;
          top: 70px;
          left: 20px;
          background: rgba(var(--surface-rgb), 0.95);
          backdrop-filter: blur(10px);
          border-radius: 15px;
          border: 2px solid rgba(var(--border-rgb), 0.4);
          padding: 10px;
          box-shadow: 0 8px 25px rgba(var(--shadow-rgb), 0.4);
          z-index: 99;
        }

        .menu-item {
          padding: 12px 24px;
          cursor: pointer;
          border-radius: 10px;
          transition: all 0.3s ease;
          font-family: var(--font-ui);
          font-weight: 600;
          font-size: 1rem;
          color: var(--text);
        }

        .menu-item:hover {
          background: rgba(var(--border-rgb), 0.3);
        }

        .menu-item.active {
          background: rgba(var(--accent-rgb), 0.2);
          color: var(--accent);
        }

        .menu-divider {
          height: 1px;
          /* Was a hardcoded cream - the dark theme's own text colour - so on a
             pale menu it was near-white on white and the sections ran together.
             Borrowing the border token means it darkens with the theme. */
          background: rgba(var(--border-rgb), 0.35);
          margin: 8px 16px;
        }

        header {
          text-align: center;
          margin-bottom: 28px;
          padding-top: 8px;
          display: flex;
          flex-direction: column;
          align-items: center;
        }



        .subtitle {
          display: flex;
          justify-content: center;
          align-items: center;
        }

        .subtitle svg {
          /* Removed filter and animation for solid black appearance */
        }

        .tabs-container {
          margin-bottom: 20px;
        }

        .master-tab {
          width: 70%;
          margin: 0 auto 10px auto;
          display: block;
        }

        .master-tab.active {
          border: 3px solid rgba(255, 107, 53, 0.8);
          box-shadow: 0 0 12px rgba(255, 107, 53, 0.7), 0 0 20px rgba(255, 142, 83, 0.5), 0 0 30px rgba(255, 107, 53, 0.3);
        }

        .tabs {
          display: flex;
          gap: 10px;
          justify-content: center;
          flex-wrap: wrap;
        }

        .tab {
          background: rgba(var(--surface-rgb), 0.8);
          backdrop-filter: blur(10px);
          border: 2px solid rgba(var(--accent-rgb), 0.2);
          padding: 12px 24px;
          color: var(--text);
          font-family: var(--font-ui);
          font-weight: 600;
          font-size: 0.9rem;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
          border-radius: 30px;
          box-shadow: 0 4px 15px rgba(var(--shadow-rgb), 0.3);
        }

        .tab:hover {
          transform: translateY(-3px);
          box-shadow: 0 6px 20px rgba(var(--accent-rgb), 0.3);
          background: rgba(var(--surface-raised-rgb), 0.9);
          border-color: rgba(var(--accent-rgb), 0.4);
        }

        /* Inactive shared tab: tinted enough to read as a different kind of
           list at a glance, without competing with the active tab. */
        .tab.shared {
          border-color: rgba(var(--partner-rgb), 0.45);
          background: rgba(var(--partner-rgb), 0.12);
          color: var(--partner);
        }

        /* Active shared tab keeps the partner colour rather than reverting to
           the accent - otherwise selecting a shared list would make it look
           like every other list. */
        .tab.shared.active {
          background: linear-gradient(135deg, var(--partner), var(--partner));
          color: #fff;
          border-color: rgba(var(--partner-rgb), 0.7);
          box-shadow: 0 0 8px rgba(var(--partner-rgb), 0.5);
        }

        .tab.active {
          background: linear-gradient(135deg, var(--accent), var(--accent-light));
          color: #fff;
          box-shadow: 0 0 8px rgba(var(--accent-rgb), 0.6), 0 0 12px rgba(106, 143, 118, 0.4);
          transform: scale(1.05);
          border: 2px solid rgba(var(--accent-rgb), 0.5);
        }

        .search-filter-bar {
          display: flex;
          gap: 10px;
          margin-bottom: 20px;
          flex-wrap: wrap;
        }

        .search-filter-bar.hidden {
          display: none;
        }

        .search-box {
          flex: 1;
          background: rgba(var(--surface-rgb), 0.8);
          backdrop-filter: blur(10px);
          border: 2px solid rgba(var(--accent-rgb), 0.2);
          border-radius: 25px;
          padding: 12px 20px;
          color: var(--text);
          font-family: var(--font-body);
          font-size: 0.95rem;
          outline: none;
          transition: all 0.3s ease;
        }

        .search-box:focus {
          border-color: var(--accent);
          box-shadow: 0 0 20px rgba(var(--accent-rgb), 0.3);
        }

        .input-container {
          margin-bottom: 25px;
        }

        .input-container.hidden {
          display: none;
        }

        .task-input-wrapper {
          display: flex;
          gap: 8px;
          margin-bottom: 15px;
        }

        input[type="text"] {
          background: rgba(var(--surface-rgb), 0.8);
          backdrop-filter: blur(10px);
          border: 2px solid rgba(var(--accent-rgb), 0.2);
          border-radius: 25px;
          padding: 16px 24px;
          color: var(--text);
          font-family: var(--font-body);
          font-size: 1rem;
          outline: none;
          transition: all 0.3s ease;
          box-shadow: 0 4px 15px rgba(var(--shadow-rgb), 0.3);
          box-sizing: border-box;
          flex: 1;
          min-width: 120px;
        }

        input[type="time"],
        select {
          color-scheme: dark;
        }

        /* No native date inputs remain - every date field in the app now uses
           the React InlineDatePicker. The block of -webkit-calendar-picker /
           datetime-edit styling that used to live here went with them. */

        input[type="text"]:focus {
          border-color: var(--accent);
          box-shadow: 0 0 30px rgba(var(--accent-rgb), 0.4);
          transform: translateY(-2px);
        }

        input[type="text"]::placeholder {
          color: var(--text-muted);
          opacity: 0.6;
        }

        .project-selector {
          background: rgba(var(--surface-rgb), 0.8);
          border: 2px solid rgba(var(--accent-rgb), 0.3);
          border-radius: 20px;
          padding: 10px 14px;
          /* Body text colour, like every other field. Accent-coloured value
             text made this read as a link rather than a control, and it was
             the only input in the app doing that. */
          color: var(--text);
          font-family: var(--font-body);
          font-size: 0.9rem;
          cursor: pointer;
          transition: all 0.3s ease;
          outline: none;
          min-width: 150px;
          /* The mobile block sets width: 100% on this control. There is no
             global border-box reset in this stylesheet - it is declared per
             rule - so without this the 14px side padding and 2px border were
             added OUTSIDE that 100% and the field rendered 32px wider than its
             parent, spilling past the right edge of the task card. */
          box-sizing: border-box;
        }

        .project-selector:focus {
          border-color: var(--accent);
          box-shadow: 0 0 20px rgba(var(--accent-rgb), 0.3);
        }

        .task-options {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
          align-items: center;
        }

        .fire-flag-selector {
          display: flex;
          align-items: center;
          gap: 8px;
        }





        .fire-flag-icon {
          width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.3s ease;
          user-select: none;
        }

        .fire-flag-icon svg {
          width: 100%;
          height: 100%;
        }

        .fire-flag-icon.clickable {
          cursor: pointer;
          opacity: 1;
        }

        .fire-flag-icon.clickable:hover {
          opacity: 1;
          transform: scale(1.1);
        }

        .fire-flag-icon.clickable.active {
          opacity: 1;
        }

        .section-selector, .priority-selector {
          display: flex;
          gap: 8px;
          align-items: center;
        }

        .section-selector label, .priority-selector label {
          font-size: 0.85rem;
          color: var(--text-muted);
          font-weight: 600;
        }

        .section-btn {
          background: rgba(var(--surface-rgb), 0.8);
          border: 2px solid rgba(var(--accent-rgb), 0.2);
          padding: 8px 16px;
          color: var(--text);
          font-family: var(--font-ui);
          font-weight: 600;
          font-size: 0.8rem;
          cursor: pointer;
          transition: all 0.3s ease;
          border-radius: 15px;
        }

        .section-btn:hover {
          background: rgba(var(--surface-raised-rgb), 0.9);
          border-color: rgba(var(--accent-rgb), 0.4);
          transform: scale(1.05);
        }

        .section-btn.selected {
          background: linear-gradient(135deg, var(--accent), var(--accent-light));
          color: #ffffff;
          border-color: transparent;
        }

        .priority-btn {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          border: 2px solid transparent;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .priority-btn.high {
          background: #ff6b6b;
        }

        .priority-btn.medium {
          background: #ffd93d;
        }

        .priority-btn.low {
          background: #6bcf7f;
        }

        .priority-btn:hover {
          transform: scale(1.1);
        }

        .priority-btn.selected {
          border-color: var(--text);
          box-shadow: 0 0 15px currentColor;
        }

        button {
          background: linear-gradient(135deg, var(--accent), var(--accent-light));
          border: none;
          border-radius: 25px;
          padding: 16px 32px;
          color: #ffffff;
          font-family: var(--font-ui);
          font-weight: 700;
          font-size: 1rem;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
          box-shadow: 0 6px 20px rgba(var(--accent-rgb), 0.4);
          text-transform: uppercase;
          letter-spacing: 1px;
        }

        button:hover {
          transform: translateY(-3px);
          box-shadow: 0 8px 30px rgba(var(--accent-rgb), 0.6);
        }

        .add-task-btn {
          background: linear-gradient(135deg, var(--accent), var(--accent-light));
          color: #fff;
          box-shadow: 0 6px 20px rgba(45, 106, 79, 0.4);
          padding: 16px 20px;
          flex-shrink: 0;
          white-space: nowrap;
          font-size: 0.9rem;
        }

        .add-task-btn:hover {
          box-shadow: 0 8px 30px rgba(45, 106, 79, 0.6);
        }

        .fire-flag-btn {
          background: rgba(var(--surface-rgb), 0.8);
          border: 2px solid rgba(var(--border-rgb), 0.3);
          border-radius: 12px;
          padding: 12px 16px;
          font-size: 1.2rem;
          cursor: pointer;
          transition: all 0.3s ease;
          outline: none;
        }

        .fire-flag-btn:hover {
          border-color: rgba(255, 107, 107, 0.5);
          transform: scale(1.05);
        }

        .fire-flag-btn.active {
          background: linear-gradient(135deg, #ff6b6b, #ee5a6f);
          border-color: transparent;
          box-shadow: 0 4px 15px rgba(255, 107, 107, 0.4);
        }

        .tasks-container {
          background: rgba(var(--surface-deep-rgb), 0.5);
          backdrop-filter: blur(10px);
          border-radius: 20px;
          padding: 25px;
          box-shadow: 0 8px 32px rgba(var(--shadow-rgb), 0.4);
          border: 2px solid rgba(var(--accent-rgb), 0.1);
          max-height: 600px;
          overflow-y: auto;
        }

        .tasks-container::-webkit-scrollbar {
          width: 8px;
        }

        .tasks-container::-webkit-scrollbar-track {
          background: rgba(var(--accent-rgb), 0.1);
          border-radius: 10px;
        }

        .tasks-container::-webkit-scrollbar-thumb {
          background: var(--accent);
          border-radius: 10px;
        }

        .list-section {
          margin-bottom: 30px;
        }

        .list-section .goal-card,
        .list-section .project-card {
          margin-bottom: 20px;
        }

        .list-section .goal-card:last-child,
        .list-section .project-card:last-child {
          margin-bottom: 0;
        }

        .list-section-header {
          font-family: var(--font-ui);
          font-size: 1.3rem;
          font-weight: 700;
          color: var(--text);
          margin-bottom: 15px;
          padding-bottom: 10px;
          display: flex;
          align-items: center;
          gap: 10px;
          background: transparent;
          padding: 0;
          padding-bottom: 10px;
        }

        .section-icon {
          width: 3.2rem;
          height: 3.2rem;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .section-icon svg {
          width: 100%;
          height: 100%;
        }

        .campfire-icon svg {
          filter: drop-shadow(0 0 8px rgba(139, 35, 0, 0.6)) drop-shadow(0 0 12px rgba(205, 50, 0, 0.4));
        }

        .logs-icon {
          width: 4.5rem;
          height: 4.5rem;
        }

        .logs-icon svg {
          filter: drop-shadow(0 0 6px rgba(128, 128, 128, 0.5)) drop-shadow(0 0 10px rgba(160, 160, 160, 0.3));
        }

        .checkbox-icon svg {
          filter: drop-shadow(0 0 6px rgba(var(--accent-rgb), 0.5)) drop-shadow(0 0 10px rgba(168, 230, 207, 0.3));
        }

        .list-section-header .badge {
          font-size: 0.75rem;
          padding: 4px 12px;
          border-radius: 12px;
          font-weight: 600;
          margin-left: auto;
        }

        /* One rule for every list. This was previously five identical
           .badge.<list> rules covering only the original built-ins, so the
           Partner list - added later - fell through with no background and
           rendered as bare text. Any user-created list had the same problem.
           Keyed off .badge alone, nothing can be missed. */
        .badge {
          background: linear-gradient(135deg, var(--accent), var(--accent-light));
          /* Fixed white, not var(--text). The badge sits on the accent gradient
             in both themes, so its text has to contrast with that - not with
             the page. Inheriting from the header meant it followed the theme
             and turned dark-on-green in light mode. */
          color: #fff;
        }

        .task {
          background: rgba(var(--surface-raised-rgb), 0.6);
          backdrop-filter: blur(10px);
          border: 2px solid rgba(var(--accent-rgb), 0.15);
          border-radius: 15px;
          padding: 16px;
          margin-bottom: 12px;
          transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
          cursor: pointer;
          position: relative;
        }

        .task.expanded {
          cursor: default;
        }

        .task:not(.expanded):hover {
          background: rgba(var(--surface-hover-rgb), 0.8);
          border-color: rgba(var(--accent-rgb), 0.3);
          transform: translateX(5px);
          box-shadow: 0 4px 20px rgba(var(--accent-rgb), 0.2);
        }

        .task.completed {
          opacity: 0.6;
          background: rgba(var(--surface-rgb), 0.4);
        }

        .task.completed .task-text {
          opacity: 0.7;
        }

        .priority-indicator {
          width: 8px;
          height: 100%;
          position: absolute;
          left: 0;
          top: 0;
          border-radius: 15px 0 0 15px;
          display: none;
        }

        .priority-indicator.high {
          background: #ff6b6b;
        }

        .priority-indicator.medium {
          background: #ffd93d;
        }

        .priority-indicator.low {
          background: #6bcf7f;
        }

        .task-main {
          display: flex;
          align-items: center;
          gap: 15px;
        }

        .checkbox-wrapper input[type="checkbox"] {
          appearance: none;
          width: 24px;
          height: 24px;
          border: 2px solid var(--accent);
          border-radius: 8px;
          cursor: pointer;
          position: relative;
          transition: all 0.3s ease;
          background: transparent;
        }

        .checkbox-wrapper input[type="checkbox"]:checked {
          background: linear-gradient(135deg, var(--accent), var(--accent-light));
          border-color: var(--accent);
        }

        .checkbox-wrapper input[type="checkbox"]:checked::after {
          content: '✓';
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          color: #ffffff;
          font-weight: bold;
          font-size: 14px;
        }

        .task-content {
          flex: 1;
        }

        .task-text-label {
          cursor: text;
        }

        .task-text {
          color: var(--text);
          font-size: 1rem;
          /* 600 (semibold), not 700 - present enough to read as the primary
             thing on the card without going fully bold. Note the font import
             loads Nunito at 400/600/700/800 only: the previous 500 wasn't
             among them, so it was rendering as plain 400. */
          font-weight: 600;
          word-break: break-word;
        }

        .pinned-flame {
          display: inline-flex;
          align-items: center;
          vertical-align: middle;
        }

        .pinned-flame-right {
          display: flex;
          align-items: center;
          justify-content: center;
          margin-left: auto;
          flex-shrink: 0;
        }

        .task-meta {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
          align-items: center;
          font-size: 0.8rem;
          color: var(--text-muted);
          margin-top: 6px;
        }

        .task-priority-label {
          padding: 3px 10px;
          border-radius: 10px;
          font-size: 0.75rem;
          font-weight: 700;
          text-transform: uppercase;
          display: none;
        }

        .task.expanded .task-priority-label {
          display: inline-block;
        }

        .task-priority-label.high {
          background: rgba(255, 107, 107, 0.2);
          color: #ff6b6b;
        }

        .task-priority-label.medium {
          background: rgba(255, 217, 61, 0.2);
          color: #ffd93d;
        }

        .task-priority-label.low {
          background: rgba(107, 207, 127, 0.2);
          color: #6bcf7f;
        }

        .task-due-date {
          display: flex;
          align-items: center;
          gap: 4px;
        }

        /* Overdue dates use the same cream tone as any other date - the red
           read as an error state. Weight is the only remaining signal; drop
           the font-weight line to remove that too. The CalendarIcon strokes
           with currentColor, so it follows this automatically. */
        .task-due-date.overdue {
          color: var(--text-muted);
          font-weight: 600;
        }

        .shared-badge {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          /* Sits on the task's first line, pushed to the right edge. Was a
             fixed 20px circle holding one letter; now it holds a name, so it
             sizes to its text. align-self overrides .task-main's centring -
             without it the badge floats to the vertical middle of the card,
             which on a task with a due date reads as sitting below the title.
             The small margin-top optically centres it against the title's
             first line rather than aligning their box tops. */
          align-self: flex-start;
          margin-top: 2px;
          padding: 2px 10px;
          border-radius: 10px;
          margin-left: auto;
          font-size: 0.7rem;
          font-weight: 700;
          flex-shrink: 0;
        }

        .shared-badge.you {
          background: rgba(var(--accent-rgb), 0.25);
          color: var(--accent-light);
          border: 1px solid rgba(var(--accent-rgb), 0.5);
        }

        .shared-badge.partner {
          background: rgba(var(--partner-rgb), 0.2);
          color: var(--partner);
          border: 1px solid rgba(var(--partner-rgb), 0.45);
        }

        /* The Follow Up heading used to be styled entirely by inline styles set
           when it was created. The sanitiser strips style attributes, so the
           look lives here instead - which also covers headings already saved in
           existing task details, since they carry this class. */
        .follow-up-heading {
          display: block;
          font-weight: bold;
          border-bottom: 2px solid rgba(var(--accent-rgb), 0.55);
          padding-bottom: 6px;
          margin-bottom: 8px;
          margin-top: 18px;
        }

        .assign-field {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 12px;
        }

        .assign-pill {
          padding: 6px 12px;
          border-radius: 14px;
          font-size: 0.8rem;
          font-family: var(--font-ui);
          font-weight: 600;
          cursor: pointer;
          border: 1px solid rgba(var(--accent-rgb), 0.3);
          background: rgba(var(--surface-rgb), 0.8);
          color: var(--text-muted);
          /* The global button rule attaches an accent-coloured glow. This is a
             field control, not a call to action, so it opts out - including on
             hover, where that rule swaps in an even stronger one. The same rule
             uppercases and letter-spaces button text; this reads as a value
             beside its label, so it renders as written. */
          box-shadow: none;
          text-transform: none;
          letter-spacing: normal;
        }

        .assign-pill:hover {
          box-shadow: none;
        }

        .assign-pill.me {
          background: rgba(var(--accent-rgb), 0.25);
          color: var(--accent-light);
          border-color: rgba(var(--accent-rgb), 0.5);
        }

        .assign-pill.partner {
          background: rgba(var(--partner-rgb), 0.2);
          color: var(--partner);
          border-color: rgba(var(--partner-rgb), 0.45);
        }

        .task-details-section {
          margin-top: 15px;
          padding-top: 15px;
          border-top: 2px solid rgba(var(--accent-rgb), 0.2);
          animation: slideDown 0.3s ease-out;
        }

        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .details-label {
          font-size: 0.85rem;
          color: var(--text-muted);
          font-weight: 600;
          margin-bottom: 8px;
          display: block;
        }

        .details-textarea {
          width: 100%;
          background: rgba(var(--surface-deep-rgb), 0.6);
          border: 2px solid rgba(var(--accent-rgb), 0.2);
          border-radius: 12px;
          padding: 12px 16px;
          color: var(--text);
          font-family: var(--font-body);
          font-size: 0.95rem;
          outline: none;
          resize: vertical;
          /* Room to tap below the content. Tapping the empty space is now the
             main way into typing when a task is full of checkboxes, so there
             has to be some of it even when the text is short. */
          min-height: 120px;
          transition: all 0.3s ease;
          box-sizing: border-box;
          word-wrap: break-word;
          overflow-wrap: break-word;
        }

        .details-textarea:focus {
          border-color: var(--accent);
          box-shadow: 0 0 20px rgba(var(--accent-rgb), 0.3);
        }

        .details-richtext {
          width: 100%;
          background: rgba(var(--surface-deep-rgb), 0.6);
          border: 2px solid rgba(var(--accent-rgb), 0.2);
          border-radius: 12px;
          padding: 12px 16px;
          color: var(--text);
          font-family: var(--font-body);
          font-size: 0.95rem;
          outline: none;
          min-height: 100px;
          max-height: 300px;
          overflow-y: auto;
          overflow-x: hidden;
          transition: all 0.3s ease;
          box-sizing: border-box;
          word-wrap: break-word;
          overflow-wrap: break-word;
          white-space: pre-wrap;
        }

        .details-richtext:focus {
          border-color: var(--accent);
          box-shadow: 0 0 20px rgba(var(--accent-rgb), 0.3);
        }

        /* Driven by a class, not :empty. A contenteditable that has been typed
           in and then cleared almost always retains a stray <br>, so it stops
           matching :empty and the placeholder never returns - the field just
           looks permanently blank with no prompt. */
        .details-richtext.is-empty:before {
          content: 'Add details about this task...';
          color: var(--text-muted);
          opacity: 0.6;
          pointer-events: none;
        }

        .details-richtext ul,
        .details-richtext ol {
          margin: 10px 0;
          padding-left: 30px;
          color: var(--text) !important;
          list-style-position: outside;
        }

        .details-richtext ul {
          list-style-type: disc;
        }

        .details-richtext ol {
          list-style-type: decimal;
        }

        .details-richtext li {
          margin: 5px 0;
          color: var(--text) !important;
          display: list-item;
        }

        .details-richtext li::marker {
          color: var(--accent) !important;
          font-weight: bold;
        }

        .details-richtext .checkbox-line {
          /* Was an inline style on each line, which the sanitizer stripped on
             every save - so a saved checklist lost its layout. As a rule keyed
             off the class (which IS allowlisted) it can't be stripped. */
          display: flex;
          align-items: flex-start;
        }

        /* Same reasoning as the checkbox below: horizontal drags on a list item
           belong to indent, and a list never needs to pan sideways. */
        .details-richtext li {
          touch-action: pan-y;
        }

        .details-richtext .task-checkbox {
          appearance: none;
          /* Horizontal drags starting here belong to indent, not to the page.
             Declaring that in CSS is what actually stops the scroll - a
             preventDefault in JS arrives after the browser has already begun
             deciding, so the first few pixels leak through without this. */
          touch-action: pan-y;
          /* Not selectable: inside a contenteditable the box would otherwise be
             a caret position of its own, so a tap just left of it dropped the
             cursor between the line start and the box. */
          user-select: none;
          -webkit-user-select: none;
          margin-right: 8px;
          width: 20px;
          height: 20px;
          cursor: pointer;
          vertical-align: middle;
          background: rgba(var(--surface-rgb), 0.8);
          border: 2px solid rgba(var(--accent-rgb), 0.3);
          border-radius: 8px;
          /* Was "all 0.3s", which included background-image. Gradients aren't
             interpolable, so the checked fill snapped mid-transition while
             everything else eased - part of what read as a flash. */
          transition: border-color 0.2s ease, transform 0.2s ease;
          position: relative;
          flex-shrink: 0;
        }

        /* Hover-only devices. On touch, tapping latches :hover, so the box
           would scale up and settle back on every tap - that's the flash.
           A mouse still gets the effect. */
        @media (hover: hover) {
          .details-richtext .task-checkbox:hover {
            border-color: rgba(var(--accent-rgb), 0.5);
            transform: scale(1.1);
          }
        }

        .details-richtext .task-checkbox:checked {
          background: linear-gradient(135deg, var(--accent), var(--accent-light));
          border-color: var(--accent);
        }

        .details-richtext .task-checkbox:checked::after {
          content: '✓';
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          color: #ffffff;
          font-weight: bold;
          font-size: 14px;
        }

        .details-richtext .checkbox-line {
          display: flex !important;
          align-items: flex-start;
          margin: 5px 0;
          gap: 8px;
          clear: both;
          width: 100%;
        }

        .details-richtext .checkbox-line.has-children,
        .details-richtext .checkbox-line.has-children span,
        .note-content .checkbox-line.has-children,
        .note-content .checkbox-line.has-children span {
          font-weight: bold;
        }

        .details-richtext .checkbox-line.has-children,
        .note-content .checkbox-line.has-children {
          border-bottom: 2px solid rgba(var(--accent-rgb), 0.55);
          padding-bottom: 6px;
          margin-bottom: 8px;
        }

        /* Boundary line marking the end of a nested child list: a top-level
           item that follows indented children gets a matcha rule above it. */
        .details-richtext .checkbox-line.ends-list,
        .note-content .checkbox-line.ends-list {
          border-top: 2px solid rgba(var(--accent-rgb), 0.55);
          padding-top: 8px;
          margin-top: 8px;
        }

        .details-richtext .checkbox-line::before {
          content: '';
          display: block;
        }

        .details-richtext .checkbox-line::after {
          content: '';
          display: block;
          clear: both;
        }

        .details-richtext .checkbox-line span {
          flex: 1;
          color: var(--text);
        }

        .task-link {
          display: inline-block;
          color: #7ba386;
          background: rgba(var(--accent-rgb), 0.18);
          border: 1px solid rgba(var(--accent-rgb), 0.45);
          border-radius: 6px;
          padding: 1px 8px;
          margin: 0 2px;
          font-weight: 600;
          text-decoration: none;
          cursor: pointer;
          transition: all 0.2s ease;
          user-select: none;
        }

        .task-link:hover {
          background: rgba(var(--accent-rgb), 0.35);
          color: #a8e6cf;
          border-color: rgba(var(--accent-rgb), 0.7);
        }

        .details-richtext strong {
          font-weight: 700;
          color: #fff;
        }

        .details-richtext em {
          font-style: italic;
          color: #ffd93d;
        }

        .richtext-toolbar {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-bottom: 8px;
          padding: 5px;
          background: rgba(var(--surface-rgb), 0.5);
          border-radius: 8px;
        }

        .toolbar-btn {
          /* No glow. The global button rule hangs an accent shadow on every
             button; on a row of small controls attached to a text field that
             reads as each one floating rather than sitting in the toolbar. */
          box-shadow: none;
          /* Laid out as a row rather than as inline content. Now that one of
             these holds an SVG plus a label, inline layout gave the browser a
             break opportunity between them and the icon ended up stacked above
             the text. Flex items don't wrap against each other, so this is
             single-line by construction; the gap replaces the literal space
             that used to separate glyph from label. */
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 12px;
          background: rgba(var(--accent-rgb), 0.2);
          border: 1px solid rgba(var(--accent-rgb), 0.3);
          border-radius: 5px;
          color: var(--text);
          cursor: pointer;
          font-size: 0.85rem;
          font-weight: 600;
          transition: all 0.2s ease;
          flex-shrink: 0;
          white-space: nowrap;
        }

        .toolbar-btn:hover {
          background: rgba(var(--accent-rgb), 0.3);
          border-color: rgba(var(--accent-rgb), 0.5);
          box-shadow: none;
        }

        /* Genuinely engaged - filled rather than tinted, so it can't be
           confused with the momentary highlight of having just been tapped. */
        .toolbar-btn.format-on {
          background: linear-gradient(135deg, var(--accent), var(--accent-light));
          border-color: rgba(var(--accent-rgb), 0.7);
          color: #fff;
          box-shadow: none;
        }

        .toolbar-btn:active {
          transform: scale(0.95);
        }

        /* Icon-only variant. Square-ish and gapless, so the pair reads as one
           control next to the worded buttons rather than two undersized ones.
           Padding is tuned to match its neighbours' rendered height: those are
           6px + a 0.85rem line box, this is an SVG of a fixed size. */
        .toolbar-btn-icon {
          gap: 0;
          padding: 6px 9px;
          /* A 44px target is the accessibility floor for touch, and these are
             the smallest controls in the editor. The button stays visually
             small; the tappable area is grown around it. */
          min-width: 34px;
          justify-content: center;
        }

        .task-priority-selector {
          margin-top: 12px;
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 10px;
        }

        .task-priority-selector .priority-btn {
          width: 28px;
          height: 28px;
        }

        .due-date-display {
          margin-top: 12px;
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 8px;
          font-size: 0.9rem;
          color: var(--text-muted);
        }

        .date-project-row {
          display: flex;
          gap: 15px;
          flex-wrap: wrap;
          margin-top: 20px;
        }

        .date-project-row .due-date-display {
          margin-top: 0;
          flex: 1;
          min-width: 200px;
        }

        .date-field {
          margin-top: 12px;
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 8px;
          font-size: 0.85rem;
          color: var(--text-muted);
        }

        .date-field-value {
          color: var(--text);
          font-weight: 500;
        }

        .task-actions {
          display: flex;
          flex-wrap: wrap;
          gap: 15px;
          margin-top: 15px;
          justify-content: flex-end;
        }

        .delete-btn, .edit-btn {
          background: rgba(255, 107, 107, 0.2);
          border: 1px solid rgba(255, 107, 107, 0.3);
          border-radius: 10px;
          padding: 8px 14px;
          color: #ff6b6b;
          font-size: 0.8rem;
          cursor: pointer;
          transition: all 0.3s ease;
          font-weight: 600;
          text-transform: none;
          letter-spacing: 0;
          box-shadow: none;
        }

        .edit-btn {
          background: rgba(var(--accent-rgb), 0.2);
          border-color: rgba(var(--accent-rgb), 0.3);
          color: var(--accent);
        }

        /* Primary create/save action - matches the active task tab matcha */
        .edit-btn.primary-action {
          background: linear-gradient(135deg, var(--accent), var(--accent-light));
          border: 1px solid rgba(var(--accent-rgb), 0.5);
          color: #ffffff;
        }

        .edit-btn.primary-action:hover {
          background: linear-gradient(135deg, #5d8169, #76a084);
          box-shadow: 0 0 8px rgba(var(--accent-rgb), 0.5);
        }

        .delete-btn:hover {
          background: rgba(255, 107, 107, 0.3);
          transform: scale(1.05);
        }

        .edit-btn:hover {
          background: rgba(var(--accent-rgb), 0.3);
          transform: scale(1.05);
        }

        .note-images {
          display: flex;
          flex-direction: column;
          gap: 15px;
          margin-top: 15px;
        }

        .note-image-container {
          position: relative;
          background: rgba(var(--surface-deep-rgb), 0.6);
          border-radius: 12px;
          padding: 15px;
          border: 2px solid rgba(var(--border-rgb), 0.2);
        }

        .note-image {
          max-width: 100%;
          border-radius: 8px;
          display: block;
        }

        .remove-image-btn {
          position: absolute;
          top: 10px;
          right: 10px;
          background: rgba(220, 38, 38, 0.9);
          border: none;
          border-radius: 50%;
          width: 28px;
          height: 28px;
          color: white;
          font-size: 20px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
          opacity: 0;
        }

        .note-image-container:hover .remove-image-btn {
          opacity: 1;
        }

        .remove-image-btn:hover {
          background: rgba(220, 38, 38, 1);
          transform: scale(1.1);
        }

        .ocr-status {
          margin-top: 10px;
          padding: 8px 12px;
          background: rgba(var(--accent-rgb), 0.2);
          border-radius: 8px;
          color: var(--accent);
          font-size: 0.9rem;
          font-weight: 600;
          text-align: center;
        }

        .extracted-text {
          margin-top: 10px;
          padding: 12px;
          background: rgba(var(--surface-rgb), 0.6);
          border-radius: 8px;
          border-left: 4px solid var(--accent);
        }

        .extracted-text-label {
          color: var(--accent);
          font-size: 0.85rem;
          font-weight: 600;
          margin-bottom: 8px;
        }

        .extracted-text-content {
          color: var(--text);
          font-size: 0.9rem;
          line-height: 1.6;
          white-space: pre-wrap;
        }

        .empty-state {
          text-align: center;
          padding: 60px 20px;
        }

        .empty-state-icon {
          font-size: 4rem;
          margin-bottom: 15px;
          opacity: 0.7;
        }

        .empty-state-text {
          font-size: 1.2rem;
          color: var(--text-muted);
          font-weight: 600;
        }

        .archive-section {
          margin-top: 30px;
        }

        .archived-tasks-container {
          margin-top: 30px;
        }

        .archive-list-section {
          margin-bottom: 40px;
        }

        .archive-list-section .section-header {
          font-family: var(--font-ui);
          font-size: 1.3rem;
          font-weight: 700;
          color: var(--text);
          margin-bottom: 15px;
          padding-bottom: 10px;
          border-bottom: 4px solid rgba(var(--accent-rgb), 0.3);
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .archived-task {
          background: rgba(var(--surface-rgb), 0.4);
          border: 2px solid rgba(var(--border-rgb), 0.3);
          border-radius: 16px;
          padding: 20px;
          margin-bottom: 15px;
          transition: all 0.3s ease;
        }

        .archived-task:hover {
          border-color: rgba(var(--border-rgb), 0.5);
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(var(--shadow-rgb), 0.3);
        }

        .archived-task .task-text {
          color: var(--text);
          font-size: 1.1rem;
          margin-bottom: 10px;
          opacity: 0.7;
        }

        .archived-task .task-meta {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          gap: 4px;
          margin-bottom: 15px;
        }

        .completed-date {
          color: #6a9d5f;
          font-size: 0.85rem;
          font-weight: 600;
        }

        .archived-date {
          color: var(--accent);
          font-size: 0.85rem;
          font-weight: 600;
        }

        .archived-task-actions {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          justify-content: flex-end;
        }

        .notes-section {
          margin-top: 30px;
        }

        .projects-section {
          margin-top: 30px;
        }

        .goals-section {
          margin-top: 30px;
        }

        .goals-container {
          display: flex;
          flex-direction: column;
          gap: 20px;
          margin-top: 20px;
        }

        .goal-card {
          background: rgba(var(--surface-raised-rgb), 0.6);
          backdrop-filter: blur(10px);
          border-radius: 20px;
          padding: 20px;
          border: 2px solid rgba(var(--accent-rgb), 0.3);
          transition: all 0.3s ease;
          user-select: none;
          -webkit-user-select: none;
          -moz-user-select: none;
          -ms-user-select: none;
          touch-action: none;
        }

        .goal-card:hover {
          border-color: rgba(var(--accent-rgb), 0.5);
          transform: translateY(-2px);
        }

        .goal-header {
          cursor: pointer;
          margin-bottom: 15px;
        }

        .goal-header h3 {
          font-family: var(--font-ui);
          font-size: 1.4rem;
          color: var(--text);
          margin: 0 0 8px 0;
        }

        .goal-project-count {
          color: var(--accent);
          font-size: 0.9rem;
          font-weight: 600;
          background: rgba(var(--accent-rgb), 0.2);
          padding: 4px 12px;
          border-radius: 12px;
        }

        .goal-actions {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
        }

        .project-detail {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          justify-content: center;
          align-items: flex-start;
          overflow-y: auto;
          z-index: 1000;
          padding: 40px 20px;
        }

        .project-detail-content {
          max-width: 800px;
          width: 100%;
          /* 30px padding outside a 100% width overflowed the viewport by
             60px on a phone - same class of bug as .project-selector. */
          box-sizing: border-box;
          background: #1e1e2e;
          border-radius: 20px;
          padding: 30px;
          box-shadow: 0 10px 40px rgba(var(--shadow-rgb), 0.3);
        }

        .goal-detail {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          justify-content: center;
          align-items: flex-start;
          overflow-y: auto;
          z-index: 1000;
          padding: 40px 20px;
        }

        .goal-detail-content {
          max-width: 800px;
          width: 100%;
          /* 30px padding outside a 100% width overflowed the viewport by
             60px on a phone - same class of bug as .project-selector. */
          box-sizing: border-box;
          background: #1e1e2e;
          border-radius: 20px;
          padding: 30px;
          box-shadow: 0 10px 40px rgba(var(--shadow-rgb), 0.3);
        }

        .goal-projects-section {
          margin-top: 30px;
          padding: 20px;
          background: rgba(var(--surface-rgb), 0.4);
          border-radius: 15px;
          border: 2px solid rgba(var(--accent-rgb), 0.3);
        }

        .projects-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 30px;
        }

        .projects-header h2 {
          font-family: var(--font-ui);
          font-size: 2rem;
          color: var(--text);
          margin: 0;
        }

        .projects-list {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .project-card {
          background: rgba(var(--surface-raised-rgb), 0.6);
          backdrop-filter: blur(10px);
          border-radius: 20px;
          padding: 20px;
          border: 2px solid rgba(var(--border-rgb), 0.2);
          transition: all 0.3s ease;
          user-select: none;
          -webkit-user-select: none;
          -moz-user-select: none;
          -ms-user-select: none;
          touch-action: none;
        }

        .project-card:hover {
          border-color: rgba(var(--border-rgb), 0.4);
          transform: translateY(-2px);
        }

        .project-header {
          cursor: pointer;
          margin-bottom: 15px;
        }

        .project-header h3 {
          font-family: var(--font-ui);
          font-size: 1.4rem;
          color: var(--text);
          margin: 0 0 8px 0;
        }

        .project-description {
          color: var(--text-muted);
          font-size: 0.95rem;
          margin: 0;
          line-height: 1.5;
        }

        .project-meta {
          display: flex;
          gap: 15px;
          margin-top: 12px;
          flex-wrap: wrap;
        }

        .project-due-date {
          padding: 4px 12px;
          background: rgba(var(--accent-rgb), 0.2);
          border-radius: 12px;
          color: var(--accent);
          font-size: 0.85rem;
          font-weight: 600;
        }

        .project-task-count {
          padding: 4px 12px;
          background: rgba(var(--border-rgb), 0.3);
          border-radius: 12px;
          color: var(--text);
          font-size: 0.85rem;
          font-weight: 600;
        }

        .project-actions {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          justify-content: flex-end;
        }

        .project-detail-header {
          margin-bottom: 25px;
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .project-detail-header h2 {
          font-family: var(--font-ui);
          font-size: 2.5rem;
          font-weight: 700;
          color: var(--text);
          margin: 15px 0 0 0;
          text-align: center;
        }

        .project-detail-name {
          font-family: var(--font-ui);
        }

        .project-name-edit {
          font-family: var(--font-ui);
          font-size: 2.5rem;
          font-weight: 700;
          color: var(--text);
          background: rgba(var(--surface-rgb), 0.8);
          border: 2px solid rgba(var(--accent-rgb), 0.3);
          border-radius: 12px;
          padding: 10px 20px;
          text-align: center;
          outline: none;
          margin: 15px 0 0 0;
          min-width: 300px;
        }

        .project-name-edit:focus {
          border-color: var(--accent);
          box-shadow: 0 0 15px rgba(var(--accent-rgb), 0.3);
        }

        .project-dates-section {
          display: flex;
          flex-wrap: wrap;
          gap: 20px;
          margin: 20px 0;
          padding: 15px;
          background: rgba(var(--surface-rgb), 0.5);
          border-radius: 12px;
          border: 2px solid rgba(var(--border-rgb), 0.3);
        }

        .project-date-field {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 10px;
          flex: 1 1 auto;
          min-width: 180px;
          max-width: 100%;
        }

        .project-date-label {
          font-family: var(--font-ui);
          font-size: 0.95rem;
          font-weight: 600;
          color: var(--text-muted);
          white-space: nowrap;
        }

        .project-name-edit:focus {
          border-color: var(--accent);
          box-shadow: 0 0 15px rgba(var(--accent-rgb), 0.3);
        }

        .back-btn {
          background: rgba(var(--surface-rgb), 0.8);
          border: 2px solid rgba(var(--border-rgb), 0.3);
          border-radius: 12px;
          padding: 10px 20px;
          color: var(--text);
          font-size: 0.95rem;
          cursor: pointer;
          transition: all 0.3s ease;
          font-family: var(--font-body);
          font-weight: 600;
          align-self: flex-start;
        }

        .back-btn:hover {
          background: linear-gradient(135deg, var(--accent), var(--accent-light));
          border-color: transparent;
        }

        .project-task-input {
          background: rgba(var(--surface-raised-rgb), 0.6);
          border: 2px solid rgba(var(--border-rgb), 0.2);
          border-radius: 20px;
          padding: 25px;
          margin-bottom: 30px;
        }

        .project-detail-description {
          color: var(--text-muted);
          font-size: 1.05rem;
          line-height: 1.6;
          margin-bottom: 30px;
          padding: 15px;
          background: rgba(var(--surface-rgb), 0.4);
          border-radius: 12px;
        }

        .project-actions {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          margin-top: 40px;
          padding-top: 30px;
          border-top: 2px solid rgba(var(--border-rgb), 0.3);
          justify-content: flex-end;
        }

        .cancel-project-btn {
          padding: 8px 14px;
          background: rgba(var(--accent-rgb), 0.2);
          border: 1px solid rgba(var(--accent-rgb), 0.3);
          border-radius: 10px;
          color: var(--accent);
          font-family: var(--font-ui);
          font-size: 0.8rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          text-transform: none;
          letter-spacing: normal;
          box-shadow: none;
        }

        .cancel-project-btn:hover {
          background: rgba(var(--accent-rgb), 0.3);
          transform: scale(1.05);
        }

        .delete-project-btn {
          padding: 8px 16px;
          background: rgba(255, 107, 107, 0.2);
          border: 1px solid rgba(255, 107, 107, 0.3);
          border-radius: 10px;
          color: #ff6b6b;
          font-family: var(--font-ui);
          font-size: 0.9rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          text-transform: none;
          letter-spacing: normal;
          box-shadow: none;
        }

        .delete-project-btn:hover {
          background: rgba(255, 107, 107, 0.3);
          transform: scale(1.05);
        }

        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.7);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          backdrop-filter: blur(5px);
        }

        .modal-content {
          background: linear-gradient(135deg, #2a2a3e 0%, #1a1a2e 100%);
          border: 2px solid rgba(var(--border-rgb), 0.4);
          border-radius: 20px;
          padding: 15px;
          max-width: 500px;
          width: 88%;
          box-shadow: 0 10px 40px rgba(var(--shadow-rgb), 0.5);
          box-sizing: border-box;
        }

        .modal-content h3 {
          font-family: var(--font-ui);
          font-size: 1.8rem;
          color: var(--text);
          margin: 0 0 25px 0;
        }

        .form-field {
          margin-bottom: 20px;
        }

        .form-field label {
          display: block;
          color: var(--accent);
          font-size: 0.95rem;
          font-weight: 600;
          margin-bottom: 8px;
        }

        .form-field input[type="text"],
        .form-field textarea {
          width: 100%;
          max-width: 100%;
          background: rgba(var(--surface-rgb), 0.8);
          border: 2px solid rgba(var(--accent-rgb), 0.2);
          border-radius: 12px;
          padding: 12px 16px;
          color: var(--text);
          font-family: var(--font-body);
          font-size: 1rem;
          outline: none;
          transition: all 0.3s ease;
          box-sizing: border-box;
          min-width: 0;
        }

        .form-field textarea {
          resize: vertical;
          min-height: 80px;
        }

        .form-field input:focus,
        .form-field textarea:focus {
          border-color: var(--accent);
          box-shadow: 0 0 15px rgba(var(--accent-rgb), 0.3);
        }

        .modal-actions {
          display: flex;
          flex-wrap: wrap;
          gap: 15px;
          justify-content: flex-end;
          margin-top: 25px;
        }

        .notes-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 30px;
        }

        .notes-header h2 {
          font-family: var(--font-ui);
          font-size: 2rem;
          color: var(--text);
          margin: 0;
        }

        .notes-list {
          display: flex;
          flex-direction: column;
          gap: 20px;
          padding: 20px 0;
          min-height: 400px;
        }

        .note-entry {
          background: rgba(var(--surface-raised-rgb), 0.6);
          backdrop-filter: blur(10px);
          border-radius: 20px;
          padding: 20px;
          border: 2px solid rgba(var(--border-rgb), 0.2);
          transition: all 0.3s ease;
        }

        .note-entry:hover {
          border-color: rgba(var(--border-rgb), 0.4);
        }

        .note-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          cursor: pointer;
          padding-bottom: 10px;
          border-bottom: 1px solid rgba(var(--border-rgb), 0.2);
          margin-bottom: 15px;
        }

        .note-date {
          font-family: var(--font-ui);
          font-weight: 600;
          font-size: 1.1rem;
          color: var(--accent);
        }

        .note-toggle {
          font-size: 0.9rem;
          color: #999;
        }

        .note-content {
          background: rgba(var(--surface-deep-rgb), 0.6);
          border: 2px solid rgba(var(--accent-rgb), 0.2);
          border-radius: 12px;
          padding: 20px;
          color: var(--text);
          font-size: 1rem;
          line-height: 1.8;
          min-height: 150px;
          max-height: 500px;
          overflow-y: auto;
          transition: all 0.3s ease;
          font-family: var(--font-body);
        }

        .note-content:focus {
          outline: none;
          border-color: var(--accent);
          box-shadow: 0 0 15px rgba(var(--accent-rgb), 0.3);
        }

        .note-content:empty:before {
          content: 'Write your thoughts here...';
          color: #666;
        }

        .tag-filter-bar {
          display: flex;
          align-items: center;
          flex-wrap: wrap;
          gap: 8px;
          margin-bottom: 20px;
          padding: 15px;
          background: rgba(var(--surface-rgb), 0.6);
          border-radius: 15px;
        }

        .tag-pill {
          padding: 6px 14px;
          background: rgba(var(--border-rgb), 0.3);
          border: 2px solid rgba(var(--border-rgb), 0.4);
          border-radius: 20px;
          color: var(--text);
          font-size: 0.85rem;
          cursor: pointer;
          transition: all 0.3s ease;
          font-family: var(--font-body);
          font-weight: 600;
        }

        .tag-pill:hover {
          background: rgba(var(--border-rgb), 0.5);
          transform: scale(1.05);
        }

        .tag-pill.active {
          background: linear-gradient(135deg, #5a7a5f, var(--accent));
          border-color: transparent;
          color: #fff;
        }

        .note-tag {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 5px 12px;
          background: linear-gradient(135deg, #5a7a5f, var(--accent));
          border-radius: 15px;
          color: #fff;
          font-size: 0.85rem;
          font-weight: 600;
        }

        .tag-remove {
          background: rgba(255, 255, 255, 0.2);
          border: none;
          border-radius: 50%;
          width: 18px;
          height: 18px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          color: #fff;
          font-size: 16px;
          line-height: 1;
          transition: all 0.2s ease;
          padding: 0;
        }

        .tag-remove:hover {
          background: rgba(255, 255, 255, 0.3);
          transform: scale(1.1);
        }

        .tag-input {
          background: rgba(var(--surface-deep-rgb), 0.6);
          border: 2px solid rgba(var(--accent-rgb), 0.2);
          border-radius: 12px;
          padding: 8px 14px;
          color: var(--text);
          font-size: 0.9rem;
          outline: none;
          transition: all 0.3s ease;
          font-family: var(--font-body);
          width: 100%;
          /* width: 100% plus side padding and a border, with no global
             border-box reset - same overflow as .project-selector. */
          box-sizing: border-box;
        }

        .tag-input:focus {
          border-color: var(--accent);
          box-shadow: 0 0 10px rgba(var(--accent-rgb), 0.3);
        }

        .calendar-section {
          margin-top: 30px;
        }

        .calendar-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 30px;
        }

        .calendar-header h2 {
          font-family: var(--font-ui);
          font-size: 2rem;
          color: var(--text);
          margin: 0;
        }

        .calendar-controls {
          margin-bottom: 20px;
          display: flex;
          /* Wraps. Without this the four filter chips stayed on one line and,
             being centred, overflowed off both edges of a portrait screen -
             then got clipped by the container's overflow-x: hidden, so they
             couldn't even be scrolled to. */
          flex-wrap: wrap;
          gap: 20px;
          justify-content: center;
        }

        .calendar-checkbox {
          display: flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
          color: var(--text);
          font-size: 0.95rem;
          font-weight: 600;
          padding: 8px 16px;
          background: rgba(var(--surface-rgb), 0.6);
          border-radius: 12px;
          border: 2px solid rgba(var(--border-rgb), 0.3);
          transition: all 0.3s ease;
        }

        .calendar-checkbox:hover {
          border-color: rgba(var(--border-rgb), 0.6);
          background: rgba(var(--surface-raised-rgb), 0.8);
        }

        .calendar-checkbox input[type="checkbox"] {
          appearance: none;
          width: 18px;
          height: 18px;
          border: 2px solid rgba(var(--accent-rgb), 0.4);
          border-radius: 4px;
          cursor: pointer;
          position: relative;
          background: rgba(var(--surface-deep-rgb), 0.6);
          transition: all 0.3s ease;
        }

        .calendar-checkbox input[type="checkbox"]:checked {
          background: linear-gradient(135deg, var(--accent), var(--accent-light));
          border-color: var(--accent);
        }

        .calendar-checkbox input[type="checkbox"]:checked::after {
          content: '✓';
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          color: #fff;
          font-size: 12px;
          font-weight: bold;
        }

        .month-nav-btn {
          background: rgba(var(--surface-rgb), 0.8);
          border: 2px solid rgba(var(--border-rgb), 0.3);
          border-radius: 12px;
          padding: 10px 20px;
          color: var(--text);
          font-size: 1.5rem;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .month-nav-btn:hover {
          background: linear-gradient(135deg, var(--accent), var(--accent-light));
          border-color: transparent;
          transform: scale(1.1);
        }

        .calendar-container {
          position: relative;
        }

        .project-timelines {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          display: grid;
          /* Must mirror .calendar-grid exactly - this overlay sits on top of
             the day cells, so any difference in track sizing or gap shows up
             as timeline bars that don't line up with their days. */
          grid-template-columns: repeat(7, minmax(0, 1fr));
          gap: 8px;
          pointer-events: none;
          z-index: 1;
        }

        .project-timeline-bar {
          height: 6px;
          border-radius: 3px;
          margin-top: 30px;
          align-self: end;
          margin-bottom: 8px;
          position: relative;
          opacity: 0.85;
          transition: opacity 0.2s ease;
          pointer-events: auto;
          cursor: pointer;
        }

        .project-timeline-bar:hover {
          opacity: 1;
        }

        .project-timeline-label {
          position: absolute;
          left: 4px;
          top: -20px;
          font-size: 0.7rem;
          font-weight: 600;
          color: var(--text);
          white-space: nowrap;
          text-shadow: 0 1px 3px rgba(var(--shadow-rgb),0.8);
          pointer-events: none;
        }

        .calendar-grid {
          display: grid;
          /* minmax(0, 1fr), not 1fr. A plain 1fr is minmax(auto, 1fr), and that
             auto floor stops a column shrinking below its content - with seven
             of them plus gaps, the row got wider than the screen and the last
             column was clipped by the container's overflow-x: hidden. */
          grid-template-columns: repeat(7, minmax(0, 1fr));
          width: 100%;
          gap: 8px;
          margin-bottom: 30px;
          position: relative;
          z-index: 2;
        }

        .calendar-day-header {
          text-align: center;
          font-weight: 700;
          color: var(--accent);
          padding: 10px;
          font-size: 0.9rem;
        }

        .calendar-day {
          aspect-ratio: 1;
          /* border-box keeps the cell square: with the default content-box the
             aspect ratio applies to the content area and padding + border are
             added on top, so cells came out taller than wide. min-width:0
             removes the automatic minimum an aspect-ratio grid item otherwise
             gets, which is the other half of the overflow. */
          box-sizing: border-box;
          min-width: 0;
          background: rgba(var(--surface-raised-rgb), 0.6);
          border: 2px solid rgba(var(--border-rgb), 0.2);
          border-radius: 12px;
          padding: 8px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: flex-start;
          cursor: pointer;
          transition: all 0.3s ease;
          position: relative;
        }

        .calendar-day.empty {
          background: transparent;
          border: none;
          cursor: default;
        }

        .calendar-day:not(.empty):hover {
          border-color: rgba(var(--border-rgb), 0.6);
          transform: scale(1.05);
        }

        .calendar-day.today {
          border-color: var(--accent);
          background: rgba(var(--accent-rgb), 0.1);
        }

        .calendar-day.selected {
          background: linear-gradient(135deg, rgba(45, 106, 79, 0.3), rgba(64, 145, 108, 0.3));
          border-color: var(--accent-light);
        }

        .calendar-day.has-items {
          background: rgba(var(--surface-raised-rgb), 0.8);
        }

        .day-number {
          font-size: 1.1rem;
          font-weight: 600;
          color: var(--text);
          margin-bottom: 4px;
        }

        .day-indicators {
          display: flex;
          flex-direction: column;
          gap: 2px;
          margin-top: auto;
          align-items: center;
        }

        .indicator {
          font-size: 0.6rem;
        }

        .task-indicator {
          color: var(--accent);
        }

        .note-indicator {
          color: #1E3A8A;
        }

        .project-indicator {
          color: #9333EA;
        }

        .day-details {
          background: rgba(var(--surface-raised-rgb), 0.6);
          border: 2px solid rgba(var(--border-rgb), 0.3);
          border-radius: 20px;
          padding: 25px;
        }

        .day-details h3 {
          font-family: var(--font-ui);
          color: var(--accent);
          margin: 0 0 20px 0;
          font-size: 1.5rem;
        }

        .day-section {
          margin-bottom: 25px;
        }

        .day-section h4 {
          font-family: var(--font-ui);
          font-size: 1.3rem;
          font-weight: 700;
          color: var(--text);
          margin: 0 0 15px 0;
          padding-bottom: 10px;
          border-bottom: 4px solid rgba(var(--accent-rgb), 0.3);
        }

        /* Label left, count right - the count is data, not part of the title,
           so brackets were doing the job an aligned column does better. */
        .day-section-toggle {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          cursor: pointer;
          user-select: none;
          -webkit-user-select: none;
        }

        .day-section-count {
          color: var(--text-muted);
          font-weight: 600;
          flex-shrink: 0;
        }

        .day-list-group {
          margin-bottom: 18px;
        }

        /* Lighter than the All Tasks version: this one sits under the "Tasks"
           heading rather than at the top of a view, so it shouldn't compete
           with it. */
        .day-list-header {
          font-size: 1rem;
          margin-bottom: 10px;
          padding-bottom: 6px;
          border-bottom: 1px solid rgba(var(--accent-rgb), 0.15);
        }

        /* Status heading inside a list group. Deliberately quieter than the
           list heading above it - smaller, uppercase, no rule underneath - so
           the two read as a hierarchy rather than as two competing headers. */
        .day-status-header {
          display: flex;
          align-items: center;
          gap: 8px;
          margin: 4px 0 8px;
          font-size: 0.7rem;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: var(--text-soft);
        }

        .day-status-count {
          font-size: 0.7rem;
          font-weight: 600;
          color: var(--text-muted);
        }

        /* The first status group sits directly under the list heading, which
           already provides the separation. */
        .day-status-group + .day-status-group .day-status-header {
          margin-top: 14px;
        }

        /* Completed rows recede: the eye should land on what is still open.
           Opacity rather than a colour change, so it works in both themes. */
        .day-status-group.status-complete .calendar-item .item-text {
          opacity: 0.62;
        }

        .day-status-group.status-complete .calendar-item .item-text .task-dot {
          text-decoration: none;
        }

        .calendar-item {
          background: rgba(var(--surface-deep-rgb), 0.6);
          border-radius: 12px;
          padding: 15px;
          margin-bottom: 10px;
          border: 2px solid rgba(var(--border-rgb), 0.2);
          transition: all 0.3s ease;
        }

        .calendar-item:hover {
          border-color: rgba(var(--accent-rgb), 0.4);
          background: rgba(var(--surface-deep-rgb), 0.8);
        }

        .calendar-item.expanded {
          border-color: rgba(var(--accent-rgb), 0.6);
          background: rgba(var(--surface-deep-rgb), 0.9);
        }

        .calendar-task-details {
          margin-top: 15px;
          padding-top: 15px;
          border-top: 1px solid rgba(var(--border-rgb), 0.3);
        }

        .calendar-note-details, .calendar-project-details {
          margin-top: 15px;
          padding-top: 15px;
          border-top: 1px solid rgba(var(--border-rgb), 0.3);
        }

        .note-meta-info, .project-task-summary {
          display: flex;
          gap: 8px;
          margin-bottom: 10px;
          align-items: center;
        }

        .go-to-btn {
          margin-top: 15px;
          padding: 10px 20px;
          background: linear-gradient(135deg, var(--accent), var(--accent-light));
          color: #fff;
          border: none;
          border-radius: 10px;
          font-family: var(--font-ui);
          font-size: 0.9rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          box-shadow: 0 4px 15px rgba(45, 106, 79, 0.3);
          width: 100%;
          /* Same as .project-selector: 20px side padding outside a 100%
             width overflowed the card by 40px. */
          box-sizing: border-box;
        }

        .go-to-btn:hover {
          background: linear-gradient(135deg, var(--accent-light), #52b788);
          box-shadow: 0 6px 20px rgba(45, 106, 79, 0.5);
          transform: translateY(-2px);
        }

        .calendar-item.expanded {
          background: rgba(var(--surface-deep-rgb), 0.8);
          box-shadow: 0 8px 25px rgba(var(--shadow-rgb), 0.5);
        }

        .task-detail-section {
          display: flex;
          gap: 8px;
          margin-bottom: 10px;
          align-items: flex-start;
        }

        .task-details-text {
          color: var(--text);
          font-size: 0.95rem;
          line-height: 1.6;
          flex: 1;
        }

        .task-details-text ul, .task-details-text ol {
          margin-left: 20px;
        }

        /* No stripe at rest - the card alone. The 4px is still reserved as a
           transparent border so nothing shifts sideways when the stripe
           appears; animating border-color rather than border-width also keeps
           this off the layout path. */
        /* --- Swipe to complete -------------------------------------------
           The check sits behind the card and is revealed as it slides, rather
           than being a separate element that moves - so there is nothing to
           keep in sync with the card's position.
           --swipe-progress is written by the gesture handler and drives the
           fade, so the threshold is visible before you let go. */
        .task {
          position: relative;
          --swipe-progress: 0;
          --swipe-dx: 0px;
        }

        /* The swipe translates the card to the right, which widens the page and
           lets the browser pan horizontally to follow it - so the whole screen
           drifted sideways during the gesture.
           pan-y tells the browser this element only participates in vertical
           scrolling, so a horizontal drag is ours alone and never becomes a
           pan. It also removes the delay while the browser waits to decide
           which of the two the gesture is.
           Scoped to collapsed cards: an expanded one contains the details
           toolbar, which scrolls horizontally on purpose. */
        .task:not(.expanded) {
          touch-action: pan-y;
        }

        .task::before {
          content: '';
          position: absolute;
          inset: 0;
          border-radius: inherit;
          background: rgba(var(--accent-rgb), 0.28);
          opacity: var(--swipe-progress);
          /* Cancels the card's own translation, so this stays where the card
             started and is uncovered as the card slides off it. */
          transform: translateX(calc(-1 * var(--swipe-dx)));
          /* Behind the card's own background, and never intercepting taps. */
          z-index: -1;
          pointer-events: none;
        }

        .task::after {
          content: '✓';
          position: absolute;
          /* Full width, not a glyph-sized box pinned to the left. The counter-
             translate uses a percentage, and percentages in translateX resolve
             against the element's OWN width - so a glyph-sized box shifted back
             by its own 110% (about 20px) while the card slid a full card-width,
             and the checkmark rode off the screen with it. Matching the panel's
             box makes the two move as one. */
          inset: 0;
          display: flex;
          align-items: center;
          padding-left: 20px;
          box-sizing: border-box;
          transform: translateX(calc(-1 * var(--swipe-dx)));
          color: var(--accent-light);
          /* Grown via font-size rather than scale(), which would resize the
             whole box and reintroduce the same mismatch. */
          font-size: calc(1rem + (var(--swipe-progress) * 0.5rem));
          font-weight: 700;
          opacity: var(--swipe-progress);
          z-index: -1;
          pointer-events: none;
          transition: font-size ${COMPLETE_ANIM_MS}ms ease, opacity ${COMPLETE_ANIM_MS}ms ease;
        }

        /* The panel shrinks because its box shrinks - it's a background. Text
           doesn't work that way: the box collapsed around a glyph that stayed
           1.5rem and simply spilled out of it, which read as the checkmark
           refusing to leave. Driving font-size to zero over the same duration
           makes it close down with the panel instead. */
        .task.collapsing::after {
          font-size: 0;
          opacity: 0;
        }

        /* An already-complete task swipes the same way to un-complete, so the
           gesture is reversible and never destructive. */
        .task.completed::after {
          content: '↺';
        }

        /* Touch only. On a mouse the drag never starts, so the affordance
           would be dead weight in the paint. */
        @media (hover: hover) {
          .task::before, .task::after { display: none; }
        }

        .task-item {
          border-left: 4px solid transparent;
          transition: border-left-color 0.2s ease, border-color 0.3s ease,
                      background 0.3s ease;
        }

        /* Hover only. Wrapped because a tap latches :hover on touchscreens,
           which would leave the stripe stuck on after tapping a card - the same
           reason the app's other hover effects are guarded. */
        @media (hover: hover) {
          .task-item:hover {
            border-left-color: var(--accent);
          }
        }

        .note-item {
          border-left: 4px solid var(--accent);
        }

        .project-item {
          border-left: 4px solid #9333EA;
        }

        .project-date-badge {
          padding: 4px 10px;
          background: rgba(147, 51, 234, 0.2);
          border: 1px solid rgba(147, 51, 234, 0.4);
          border-radius: 12px;
          color: #a855f7;
          font-size: 0.75rem;
          font-weight: 600;
        }

        .project-description-preview {
          color: var(--text-muted);
          font-size: 0.85rem;
          margin-top: 6px;
          font-style: italic;
        }

        .project-dates-display {
          display: flex;
          gap: 15px;
          margin-top: 8px;
          flex-wrap: wrap;
        }

        .project-date-info {
          color: var(--accent);
          font-size: 0.8rem;
          font-weight: 600;
        }

        .item-header {
          display: flex;
          gap: 8px;
          align-items: center;
          margin-bottom: 8px;
        }

        .list-badge {
          padding: 3px 10px;
          border-radius: 10px;
          font-size: 0.75rem;
          font-weight: 600;
          text-transform: capitalize;
        }

        .list-badge.personal {
          background: linear-gradient(135deg, #7fb069, #6a9d5f);
          color: #fff;
        }

        .list-badge.work {
          background: linear-gradient(135deg, var(--accent), var(--accent-light));
          color: #ffffff;
        }

        .list-badge.home {
          background: linear-gradient(135deg, #5a8c4a, #4a7a3a);
          color: #fff;
        }

        .list-badge.travel {
          background: linear-gradient(135deg, #c19bf5, #a78bfa);
          color: #fff;
        }

        .list-badge.kids {
          background: linear-gradient(135deg, #f472b6, #ec4899);
          color: #fff;
        }

        .priority-badge {
          font-size: 1rem;
          /* Holds an SVG now rather than a text glyph, so it needs to align
             like a box instead of sitting on a text baseline. */
          display: inline-flex;
          align-items: center;
        }

        .project-badge {
          padding: 4px 10px;
          background: rgba(var(--accent-rgb), 0.2);
          border: 1px solid rgba(var(--accent-rgb), 0.4);
          border-radius: 12px;
          color: var(--accent);
          font-size: 0.75rem;
          font-weight: 600;
          text-transform: capitalize;
        }

        .item-text {
          color: var(--text);
          font-size: 1rem;
          line-height: 1.5;
        }

        .task-dot {
          color: var(--accent);
          font-size: 0.8rem;
          margin-right: 6px;
        }

        .completed-badge {
          display: inline-block;
          margin-top: 8px;
          padding: 3px 10px;
          background: rgba(var(--accent-rgb), 0.2);
          border-radius: 10px;
          color: var(--accent);
          font-size: 0.8rem;
          font-weight: 600;
        }

        .archived-indicator {
          position: absolute;
          top: 10px;
          right: 10px;
          padding: 4px 12px;
          background: rgba(147, 116, 99, 0.3);
          border: 1px solid rgba(147, 116, 99, 0.5);
          border-radius: 12px;
          color: #d4a574;
          font-size: 0.75rem;
          font-weight: 600;
          z-index: 10;
        }

        .item-preview {
          color: var(--text);
          font-size: 0.95rem;
          line-height: 1.6;
        }

        .item-tags {
          display: flex;
          gap: 6px;
          margin-top: 10px;
          flex-wrap: wrap;
        }

        .mini-tag {
          padding: 3px 8px;
          background: linear-gradient(135deg, var(--accent), var(--accent-light));
          border-radius: 10px;
          color: #fff;
          font-size: 0.75rem;
          font-weight: 600;
        }

        .note-content ul, .note-content ol {
          padding-left: 30px;
          margin: 8px 0;
        }

        .note-content ul li, .note-content ol li {
          color: var(--text);
          margin: 4px 0;
        }

        .note-content ul li::marker {
          color: var(--accent);
          font-weight: bold;
        }

        .note-content ol li::marker {
          color: var(--accent);
          font-weight: bold;
        }

        .note-content .checkbox-line {
          display: flex !important;
          align-items: flex-start;
          margin: 5px 0;
          gap: 8px;
          clear: both;
          width: 100%;
        }

        .note-content .checkbox-line span {
          flex: 1;
          color: var(--text);
        }

        .note-content .task-checkbox {
          appearance: none;
          width: 20px;
          height: 20px;
          border: 2px solid rgba(var(--accent-rgb), 0.3);
          border-radius: 8px;
          cursor: pointer;
          position: relative;
          transition: all 0.3s ease;
          background: rgba(var(--surface-rgb), 0.8);
          flex-shrink: 0;
          margin-top: 2px;
        }

        .note-content .task-checkbox:hover {
          border-color: rgba(var(--accent-rgb), 0.5);
          transform: scale(1.1);
        }

        .note-content .task-checkbox:checked {
          background: linear-gradient(135deg, var(--accent), var(--accent-light));
          border-color: var(--accent);
        }

        .note-content .task-checkbox:checked::after {
          content: '✓';
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          color: #ffffff;
          font-weight: bold;
          font-size: 12px;
        }

        .reports-section {
          padding: 20px 40px 40px;
        }

        @media (max-width: 600px) {

          .project-dates-section {
            flex-direction: column;
          }

          .project-date-field {
            min-width: 100%;
            flex-direction: column;
            align-items: flex-start;
          }
        }

        @media (max-width: 700px) {
          /* Reclaim horizontal space on phones */
          .container {
            padding: 0 12px;
          }

          .reports-section {
            padding: 12px 0 24px;
          }

          /* Reclaim nested padding: .tasks-container (25px) + .details-richtext
             (16px) were eating ~66px of horizontal space inside task cards. */
          .tasks-container {
            padding: 12px;
            border-radius: 14px;
            max-height: 68vh;
          }

          .details-richtext {
            padding: 10px 12px;
            /* No inner cap on mobile. The base rule caps this at 300px with its
               own scrollbar, but on mobile it sits inside .tasks-container,
               which is already a scroller at 68vh - so a swipe over the details
               moved one of two nested scrollers, more or less at random.
               Letting the card grow leaves a single scroller and reads as a
               much larger writing area without changing the font or padding.
               min-height is viewport-relative so it scales with the device
               rather than sitting at a fixed 100px. */
            max-height: none;
            min-height: 25vh;
          }

          /* Details toolbar (Box / Bullets / Follow Up): the global button rule
             applies uppercase + 1px letter-spacing, which makes these overflow
             onto a second row. Tighten them so they fit a single row. */
          .richtext-toolbar {
            gap: 5px;
            padding: 4px;
            flex-wrap: nowrap;
            overflow-x: auto;
            -webkit-overflow-scrolling: touch;
          }

          .richtext-toolbar::-webkit-scrollbar {
            display: none;
          }

          .toolbar-btn {
            padding: 7px 6px;
            font-size: 0.62rem;
            letter-spacing: 0;
            border-radius: 6px;
            /* Was flex-shrink: 0 from the base rule, which is what pushed the
               fourth button off the edge once Bold was added - the row could
               only scroll, never compress. Letting them share the width means
               adding a button shortens the others rather than hiding one.
               min-width: 0 is required as well: a flex item won't shrink below
               its content width without it, so the padding change alone
               wouldn't have been enough. */
            flex-shrink: 1;
            min-width: 0;
          }

          /* The icon must not be squeezed with the label - it has no text to
             give up, so shrinking it just distorts it. */
          .toolbar-btn svg {
            flex-shrink: 0;
          }

          /* --- Typography --- */

          /* --- iOS zoom prevention ---
             Safari auto-zooms when focusing any field under 16px. */
          input[type="text"],
          input[type="number"],
          input[type="search"],
          textarea,
          select {
            font-size: 16px;
          }

          /* --- List tabs: fit more per row --- */
          .tabs {
            gap: 6px;
          }

          .tab {
            padding: 10px 14px;
            font-size: 0.8rem;
            border-radius: 20px;
          }

          /* --- Task cards --- */
          .task {
            padding: 12px;
            margin-bottom: 10px;
          }

          .task-actions {
            gap: 10px;
            flex-wrap: wrap;
          }

          /* Due Date and Project stack instead of squeezing side by side */
          .date-project-row {
            flex-direction: column;
            gap: 8px;
          }

          .due-date-display {
            width: 100%;
            flex-wrap: wrap;
          }

          .project-selector {
            min-width: 0;
            flex: 1;
            width: 100%;
          }

          /* --- Buttons: meet ~44px touch target --- */
          .delete-btn, .edit-btn {
            padding: 11px 16px;
            font-size: 0.85rem;
            min-height: 42px;
          }

          .add-task-btn {
            padding: 14px 16px;
          }

          /* --- Calendar: 7 columns need every pixel --- */
          .calendar-controls {
            gap: 8px;
            margin-bottom: 14px;
          }

          .calendar-checkbox {
            font-size: 0.8rem;
            padding: 6px 10px;
            gap: 6px;
            border-width: 1px;
          }

          /* 2rem across three words plus two nav buttons doesn't fit portrait.
             min-width:0 lets the title shrink instead of pushing the buttons
             out of the row. */
          .calendar-header h2 {
            font-size: 1.3rem;
            min-width: 0;
          }

          .month-nav-btn {
            padding: 8px 14px;
            font-size: 1.1rem;
          }

          .calendar-grid {
            gap: 3px;
            margin-bottom: 18px;
          }

          /* Kept in step with .calendar-grid above - when only the grid gap was
             reduced, the timeline overlay stayed on 8px tracks and drifted out
             of alignment with the days underneath it. */
          .project-timelines {
            gap: 3px;
          }

          .day-number {
            font-size: 0.85rem;
            margin-bottom: 2px;
          }

          .calendar-day {
            padding: 2px;
            border-width: 1px;
            border-radius: 8px;
          }

          .calendar-day-header {
            padding: 4px 0;
            font-size: 0.7rem;
          }

          .calendar-header {
            margin-bottom: 16px;
          }

          /* --- Modals: keep reachable and scrollable --- */
          .modal-content {
            width: 94%;
            padding: 14px;
            max-height: 88vh;
            overflow-y: auto;
          }

          /* --- Notes / projects --- */
          .note-entry {
            padding: 14px;
            border-radius: 14px;
          }

          .project-dates-section {
            gap: 12px;
            padding: 12px;
            margin: 14px 0;
          }
        }

        /* --- Touch devices -------------------------------------------------
           A tap on a touchscreen latches :hover on the element until you tap
           somewhere else, so any hover rule that moves something makes it jump
           and stay moved. Neutralising the movement here rather than editing
           each rule keeps the hover effects intact for mouse users. This block
           must stay last: it wins on source order, not specificity, so no
           !important is needed.
           Not listed: .details-richtext .task-checkbox:hover, which is already
           wrapped in its own @media (hover: hover) guard. */
        @media (hover: none) {
          /* Toolbar buttons only. This was previously merged into the
             transform-reset selector list below, which handed the toolbar's own
             background and border to every one of those 22 selectors - tabs and
             all buttons included. A selected tab then got a pale green fill
             while keeping .tab.active's white text, which is what made the
             label vanish. Kept as its own rule so the values can't leak. */
          .toolbar-btn:hover {
            background: rgba(var(--accent-rgb), 0.2);
            border-color: rgba(var(--accent-rgb), 0.3);
          }

          /* :not(.active) is essential. This block is last in the stylesheet
             and .tab:hover carries the same specificity as .tab.active, so
             without the exclusion it won this tie on source order - resetting
             the selected tab's green background while .tab.active's white text
             survived, leaving the label invisible on a pale tab. */
          .tab:not(.active):hover {
            background: rgba(var(--surface-rgb), 0.8);
            border-color: rgba(var(--accent-rgb), 0.2);
          }

          .tab.shared:not(.active):hover {
            background: rgba(var(--partner-rgb), 0.12);
            border-color: rgba(var(--partner-rgb), 0.45);
          }

          /* Background and border too, not just transform. A tap latches
             :hover on touch, so the card stayed visibly highlighted after it
             was used to dismiss something - looking selected when nothing was
             selected. */
          .task:not(.expanded):hover {
            background: rgba(var(--surface-raised-rgb), 0.6);
            border-color: rgba(var(--accent-rgb), 0.15);
            box-shadow: none;
          }

          .hamburger-icon:hover,
          .tab:hover,
          .fire-flag-icon.clickable:hover,
          .section-btn:hover,
          .priority-btn:hover,
          button:hover,
          .fire-flag-btn:hover,
          .toolbar-btn:hover,
          .task:not(.expanded):hover,
          .delete-btn:hover,
          .edit-btn:hover,
          .remove-image-btn:hover,
          .archived-task:hover,
          .goal-card:hover,
          .project-card:hover,
          .cancel-project-btn:hover,
          .delete-project-btn:hover,
          .tag-pill:hover,
          .tag-remove:hover,
          .month-nav-btn:hover,
          .calendar-day:not(.empty):hover,
          .go-to-btn:hover,
          .note-content .task-checkbox:hover {
            transform: none;
          }
        }

        /* Settings is a form, not a dashboard. The global button rule hangs an
           accent-coloured glow on everything - the reorder arrows, the toggles,
           the add buttons - which on a dark ground reads as every control
           floating slightly off the page. Scoped by container so the rest of
           the app keeps its depth. */
        .settings-section button,
        .settings-section input,
        .settings-section select,
        .settings-section textarea {
          box-shadow: none;
        }

        .settings-section button:hover,
        .settings-section button:focus {
          box-shadow: none;
        }

        /* --- Touch feedback ------------------------------------------------
           iOS paints a translucent grey box over anything tappable and pops a
           text-selection callout on long press; both read as "web page" rather
           than "app". The property is inherited, so setting it on the container
           covers everything inside it.
           Removing those leaves nothing at all acknowledging a press, since the
           hover effects deliberately don't apply on touch - so :active supplies
           it instead. This block sits after the @media (hover: none) rules
           above on purpose: iOS latches :hover on tap, so both match at once
           and they carry equal specificity. Source order is what decides, and
           the press state has to win. */
        .little-fires-container {
          -webkit-tap-highlight-color: transparent;
        }

        /* Deliberately not applied to .details-richtext, .note-content, inputs
           or textareas - selecting and copying text there is wanted. */
        button,
        .tab,
        .hamburger-icon,
        .list-section-header,
        .calendar-day,
        .checkbox-wrapper,
        .assign-pill,
        .shared-badge,
        .fire-flag-icon {
          -webkit-touch-callout: none;
        }

        button:active,
        .tab:active,
        .assign-pill:active,
        .month-nav-btn:active,
        .list-section-header:active,
        .hamburger-icon:active,
        .calendar-day:not(.empty):active {
          transform: scale(0.97);
        }

        /* Gentler on a full-width row, where 0.97 reads as a lurch. */
        .task:not(.expanded):active {
          transform: scale(0.99);
        }
      `}</style>

      <div className="container">
        {/* Storage failures used to be silent - this makes them impossible to miss */}
        {storageError && (
          <div style={{
            background: 'rgba(255, 107, 107, 0.15)',
            border: '2px solid rgba(255, 107, 107, 0.5)',
            borderRadius: '10px', padding: '12px 14px', margin: '12px 0',
            display: 'flex', alignItems: 'flex-start', gap: '12px',
            fontFamily: 'var(--font-ui)'
          }}>
            <div style={{ flex: 1, color: '#ff8f8f', fontSize: '0.85rem', lineHeight: 1.5 }}>
              <strong>Changes aren't being saved.</strong> {storageError}
            </div>
            <button
              aria-label="Dismiss"
              onClick={() => setStorageError(null)}
              style={{
                background: 'transparent', border: 'none', color: '#ff8f8f',
                cursor: 'pointer', fontSize: '1.1rem', padding: '0 4px', lineHeight: 1
              }}
              title="Dismiss"
            >
              ×
            </button>
          </div>
        )}
        {/* Hamburger Menu */}
        <div className="hamburger-menu">
          <div
            className="hamburger-icon"
            // Same reasoning as the logo: clickable div, made focusable and
            // announced. aria-expanded lets a screen reader convey menu state.
            role="button"
            tabIndex={0}
            aria-label="Menu"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen(!menuOpen)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setMenuOpen(!menuOpen); }
            }}
          >
            <div className="hamburger-line"></div>
            <div className="hamburger-line"></div>
            <div className="hamburger-line"></div>
          </div>
          {menuOpen && (
            <>
              <div 
                style={{
                  position: 'fixed',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  zIndex: 98
                }}
                onClick={() => setMenuOpen(false)}
              />
              <div className="menu-dropdown">
                <div 
                  className={`menu-item ${appMode === 'tasks' ? 'active' : ''}`}
                  onClick={() => { setAppMode('tasks'); setMenuOpen(false); }}
                >
                  Tasks
                </div>
                {isFeatureOn('time') && (
                  <div 
                    className={`menu-item ${appMode === 'time' ? 'active' : ''}`}
                    onClick={() => { setAppMode('time'); setMenuOpen(false); }}
                  >
                    Time
                  </div>
                )}
                {/* Divider only renders if at least one of these sections is on,
                    otherwise we'd stack two dividers together */}
                {(isFeatureOn('goals') || isFeatureOn('projects') || isFeatureOn('notes')) && (
                  <div className="menu-divider"></div>
                )}
                {isFeatureOn('goals') && (
                  <div 
                    className={`menu-item ${appMode === 'goals' ? 'active' : ''}`}
                    onClick={() => { setAppMode('goals'); setMenuOpen(false); }}
                  >
                    Goals
                  </div>
                )}
                {isFeatureOn('projects') && (
                  <div 
                    className={`menu-item ${appMode === 'projects' ? 'active' : ''}`}
                    onClick={() => { setAppMode('projects'); setMenuOpen(false); }}
                  >
                    Projects
                  </div>
                )}
                {isFeatureOn('notes') && (
                  <div 
                    className={`menu-item ${appMode === 'notes' ? 'active' : ''}`}
                    onClick={() => { setAppMode('notes'); setMenuOpen(false); }}
                  >
                    Notes
                  </div>
                )}
                <div className="menu-divider"></div>
                <div 
                  className={`menu-item ${appMode === 'calendar' ? 'active' : ''}`}
                  onClick={() => { setAppMode('calendar'); setMenuOpen(false); }}
                >
                  Calendar
                </div>
                <div 
                  className={`menu-item ${appMode === 'reports' ? 'active' : ''}`}
                  onClick={() => { setAppMode('reports'); setMenuOpen(false); }}
                >
                  Reports
                </div>
                <div className="menu-divider"></div>
                {isFeatureOn('search') && (
                  <div 
                    className={`menu-item ${appMode === 'search' ? 'active' : ''}`}
                    onClick={() => { setAppMode('search'); setMenuOpen(false); }}
                  >
                    Search
                  </div>
                )}
                <div 
                  className={`menu-item ${appMode === 'archive' ? 'active' : ''}`}
                  onClick={() => { setAppMode('archive'); setMenuOpen(false); }}
                >
                  Archive
                </div>
                <div className="menu-divider"></div>
                <div 
                  className={`menu-item ${appMode === 'settings' ? 'active' : ''}`}
                  onClick={() => { setAppMode('settings'); setMenuOpen(false); }}
                >
                  Settings
                </div>
              </div>
            </>
          )}
        </div>

        <header>
          {/* The flame is the wordmark now - the title was removed to reclaim
              vertical space, and the icon already doubles as the home button. */}
          <div className="subtitle">
            {(() => {
              const logoSize = isMobile ? 104 : 132;
              const ringSize = logoSize + 12;
              const ringMid = ringSize / 2;
              const ringR = ringMid - 6;
              // Doubles as the home button and, once you're already on All
              // Tasks, as a collapse/expand-all control for the list sections.
              // Defined once here so the click handler, the keyboard handler
              // and the label can't drift apart.
              const onLogo = () => {
                if (appMode === 'tasks' && currentList === 'master') {
                  toggleAllLists();
                } else {
                  setAppMode('tasks');
                  setCurrentList('master');
                }
              };
              const logoLabel = appMode === 'tasks' && currentList === 'master'
                ? (visibleTaskLists.some(k => !collapsedLists[k])
                    ? 'Collapse all lists' : 'Expand all lists')
                : 'Go to All Tasks';
              return (
            <div
              // A div with onClick is invisible to keyboard and screen reader
              // users. These make it behave like the button it already is.
              role="button"
              tabIndex={0}
              aria-label={logoLabel}
              onClick={onLogo}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onLogo(); }
              }}
              title={logoLabel}
              style={{
                width: `${logoSize}px`,
                height: `${logoSize}px`,
                position: 'relative',
                display: 'inline-block',
                cursor: 'pointer'
              }}
            >
              {/* Circular Progress Ring */}
              <svg 
                style={{
                  position: 'absolute',
                  top: '-6px',
                  left: '-6px',
                  width: `${ringSize}px`,
                  height: `${ringSize}px`,
                  transform: 'rotate(-90deg)',
                  pointerEvents: 'none'
                }}
              >
                <circle
                  cx={ringMid}
                  cy={ringMid}
                  r={ringR}
                  fill="none"
                  strokeWidth="4"
                  style={{ stroke: 'rgba(var(--accent-muted-rgb), 0.55)' }}
                />
              </svg>
              
              {/* Fire Icon */}
              <div style={{
                width: '100%',
                height: '100%'
              }}>
                <svg version="1.0" xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 1280.000000 1280.000000"
                  preserveAspectRatio="xMidYMid meet"
                  style={{width: '100%', height: '100%'}}>
                  <g transform="translate(0.000000,1280.000000) scale(0.100000,-0.100000)"
                    fill="#000000" stroke="none" opacity="1">
                  <path d="M7090 12669 c-1 -257 -76 -628 -175 -871 -149 -365 -354 -643 -825
                  -1123 -562 -572 -1053 -1165 -1415 -1710 -256 -385 -443 -729 -568 -1045 -164
                  -415 -213 -716 -189 -1167 7 -126 17 -257 22 -293 4 -36 11 -87 15 -115 3 -27
                  17 -108 31 -180 66 -339 167 -634 321 -937 181 -358 383 -630 707 -954 206
                  -206 336 -319 558 -486 130 -98 458 -322 462 -316 1 1 20 53 40 113 45 131
                  132 315 211 452 58 99 233 361 296 443 231 303 515 606 864 926 411 375 725
                  680 839 814 99 117 243 309 323 432 261 403 385 922 386 1623 0 207 -4 314
                  -17 410 -76 586 -230 1136 -500 1782 -358 860 -885 1741 -1298 2168 l-87 90
                  -1 -56z"/>
                  <path d="M9510 9493 c0 -5 9 -55 21 -113 89 -462 132 -1021 110 -1453 -13
                  -249 -39 -482 -67 -597 -109 -438 -605 -1140 -1299 -1835 -126 -127 -291 -284
                  -365 -350 -160 -142 -223 -206 -374 -380 -276 -318 -452 -600 -476 -761 -5
                  -38 -19 -133 -31 -211 -21 -141 -21 -189 2 -261 8 -25 15 -32 28 -26 73 31
                  289 101 416 134 203 54 418 97 820 164 894 149 1116 222 1550 511 387 257 676
                  553 814 833 98 197 195 572 233 892 19 165 16 597 -5 780 -104 913 -509 1833
                  -1058 2404 -105 109 -294 276 -312 276 -4 0 -7 -3 -7 -7z"/>
                  <path d="M3355 8046 c-199 -134 -336 -247 -523 -430 -189 -186 -290 -306 -418
                  -498 -270 -403 -415 -856 -401 -1261 8 -258 75 -514 202 -772 237 -481 641
                  -873 1170 -1135 358 -177 715 -283 1170 -349 153 -22 511 -54 546 -49 16 2
                  -12 23 -107 82 -709 437 -1164 850 -1434 1303 -118 197 -228 493 -244 653 -4
                  36 -11 92 -16 125 -5 33 -16 116 -25 185 -8 69 -20 163 -26 210 -6 47 -13 196
                  -16 332 -5 240 4 411 38 673 5 44 12 98 15 120 3 22 9 65 14 95 5 30 12 73 16
                  95 26 174 135 576 188 698 5 9 4 17 0 17 -5 0 -72 -43 -149 -94z"/>
                </g>
              </svg>
              </div>
            </div>
              );
            })()}
          </div>
        </header>

        {appMode === 'tasks' && (
          <>
            <div className="tabs-container">
              <button
                className={`tab master-tab ${currentList === 'master' ? 'active' : ''}`}
                onClick={() => setCurrentList('master')}
              >
                All Tasks
              </button>
              <div className="tabs">
                {visibleTaskLists.map(key => (
                  <button
                    key={key}
                    // `shared` tints the tab in the partner colour wherever it
                    // appears. With shared lists free to sit anywhere in the
                    // order, colour is what makes them recognisable - grouping
                    // no longer does that job.
                    className={`tab ${isSharedList(key) ? 'shared' : ''} ${currentList === key ? 'active' : ''}`}
                    onClick={() => setCurrentList(key)}
                  >
                    {listLabel(key)}
                  </button>
                ))}
              </div>
            </div>

            <div className={`input-container ${currentList === 'master' ? 'hidden' : ''}`}>
              <div className="task-input-wrapper">
                <input
                  type="text"
                  placeholder="Task"
                  value={taskInput}
                  onChange={(e) => setTaskInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addTask()}
                />
                <button className="add-task-btn" onClick={addTask}>Add Task</button>
              </div>
              <div className="task-options">
                {/* Same swap as the expanded-task field - see the note there. */}
                <InlineDatePicker value={dueDate} onChange={setDueDate} />
                <div className="fire-flag-selector">
                  <span 
                    className={`fire-flag-icon clickable ${selectedPriority === 'high' ? 'active' : ''}`}
                    onClick={() => setSelectedPriority(selectedPriority === 'high' ? 'low' : 'high')}
                    title="Pin to top"
                  >
                    {selectedPriority === 'high' ? <LitFlame /> : <UnlitFlame />}
                  </span>
                </div>
                {/* Shared list only: set the assignee before the task exists,
                    rather than adding it and then expanding it to assign.
                    Same pill and same cycle as the one in the expanded task, so
                    there's nothing new to learn. */}
                {isSharedList(currentList) && (
                  <button
                    type="button"
                    className={`assign-pill ${selectedAssignee || 'unassigned'}`}
                    onClick={() => setSelectedAssignee(
                      selectedAssignee === 'me' ? 'partner'
                        : selectedAssignee === 'partner' ? null
                        : 'me'
                    )}
                    title="Tap to set who this is for"
                  >
                    {selectedAssignee === 'me' ? 'You'
                      : selectedAssignee === 'partner' ? partnerDisplayName
                      : 'Unassigned'}
                  </button>
                )}
              </div>
            </div>

            <div className="tasks-container">
              {renderTasks()}
            </div>
          </>
        )}

        {appMode === 'notes' && (
          <div 
            className="notes-section"
            onClick={(e) => {
              // Collapse expanded notes when clicking outside note entries
              const clickedNoteEntry = e.target.closest('.note-entry');
              if (!clickedNoteEntry) {
                // Check if we clicked on certain interactive elements that should NOT collapse
                const clickedButton = e.target.closest('button');
                const clickedInput = e.target.closest('input');
                const clickedSelect = e.target.closest('select');
                
                if (!clickedButton && !clickedInput && !clickedSelect) {
                  setNotes(notes.map(note => ({ ...note, expanded: false })));
                }
              }
            }}
          >
            <div className="notes-header" style={{display: 'block', textAlign: 'center'}}>
              <button className="add-task-btn" onClick={addNote} style={{width: '70%', display: 'inline-block'}}>New Note</button>
            </div>

            {/* Search bar */}
            <div className="search-filter-bar" style={{position: 'relative'}}>
              <div style={{
                position: 'absolute',
                left: '15px',
                top: '50%',
                transform: 'translateY(-50%)',
                width: '20px',
                height: '20px',
                pointerEvents: 'none',
                zIndex: 1
              }}>
                <svg version="1.0" xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 1280 1280"
                  preserveAspectRatio="xMidYMid meet"
                  style={{width: '100%', height: '100%'}}>
                  <g transform="translate(0,1280) scale(0.1,-0.1)"
                    fill="#6b7280" stroke="none" opacity="0.5">
                    <path d="M7090 12669 c-1 -257 -76 -628 -175 -871 -149 -365 -354 -643 -825 -1123 -562 -572 -1053 -1165 -1415 -1710 -256 -385 -443 -729 -568 -1045 -164 -415 -213 -716 -189 -1167 7 -126 17 -257 22 -293 4 -36 11 -87 15 -115 3 -27 17 -108 31 -180 66 -339 167 -634 321 -937 181 -358 383 -630 707 -954 206 -206 336 -319 558 -486 130 -98 458 -322 462 -316 1 1 20 53 40 113 45 131 132 315 211 452 58 99 233 361 296 443 231 303 515 606 864 926 411 375 725 680 839 814 99 117 243 309 323 432 261 403 385 922 386 1623 0 207 -4 314 -17 410 -76 586 -230 1136 -500 1782 -358 860 -885 1741 -1298 2168 l-87 90 -1 -56z"/>
                    <path d="M9510 9493 c0 -5 9 -55 21 -113 89 -462 132 -1021 110 -1453 -13 -249 -39 -482 -67 -597 -109 -438 -605 -1140 -1299 -1835 -126 -127 -291 -284 -365 -350 -160 -142 -223 -206 -374 -380 -276 -318 -452 -600 -476 -761 -5 -38 -19 -133 -31 -211 -21 -141 -21 -189 2 -261 8 -25 15 -32 28 -26 73 31 289 101 416 134 203 54 418 97 820 164 894 149 1116 222 1550 511 387 257 676 553 814 833 98 197 195 572 233 892 19 165 16 597 -5 780 -104 913 -509 1833 -1058 2404 -105 109 -294 276 -312 276 -4 0 -7 -3 -7 -7z"/>
                    <path d="M3355 8046 c-199 -134 -336 -247 -523 -430 -189 -186 -290 -306 -418 -498 -270 -403 -415 -856 -401 -1261 8 -258 75 -514 202 -772 237 -481 641 -873 1170 -1135 358 -177 715 -283 1170 -349 153 -22 511 -54 546 -49 16 2 -12 23 -107 82 -709 437 -1164 850 -1434 1303 -118 197 -228 493 -244 653 -4 36 -11 92 -16 125 -5 33 -16 116 -25 185 -8 69 -20 163 -26 210 -6 47 -13 196 -16 332 -5 240 4 411 38 673 5 44 12 98 15 120 3 22 9 65 14 95 5 30 12 73 16 95 26 174 135 576 188 698 5 9 4 17 0 17 -5 0 -72 -43 -149 -94z"/>
                  </g>
                </svg>
              </div>
              <input
                type="text"
                className="search-box"
                placeholder="Search notes..."
                value={noteSearchQuery}
                onChange={(e) => setNoteSearchQuery(e.target.value)}
                style={{paddingLeft: '45px'}}
              />
            </div>

            {/* Tag filter */}
            {getAllTags().length > 0 && (
              <div className="tag-filter-bar">
                <span style={{color: '#999', fontSize: '0.9rem', marginRight: '10px'}}>Filter by tag:</span>
                <button 
                  className={`tag-pill ${selectedTag === null ? 'active' : ''}`}
                  onClick={() => setSelectedTag(null)}
                >
                  All
                </button>
                {getAllTags().map(tag => (
                  <button
                    key={tag}
                    className={`tag-pill ${selectedTag === tag ? 'active' : ''}`}
                    onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            )}

            <div className="notes-list">
              {filterNotes().length === 0 ? (
                <div className="empty-state" style={{display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '300px'}}>
                  <div style={{
                    width: '180px',
                    height: '180px',
                    position: 'relative',
                    display: 'inline-block'
                  }}>
                    {/* Background circle */}
                    <svg 
                      style={{
                        position: 'absolute',
                        top: '-15px',
                        left: '-15px',
                        width: '210px',
                        height: '210px',
                        transform: 'rotate(-90deg)',
                        pointerEvents: 'none'
                      }}
                    >
                      <circle
                        cx="105"
                        cy="105"
                        r="95"
                        fill="none"
                        stroke="rgba(var(--surface-alt-rgb), 0.3)"
                        strokeWidth="8"
                      />
                    </svg>
                    
                    {/* Dark Fire Icon */}
                    <svg version="1.0" xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 1280.000000 1280.000000"
                      preserveAspectRatio="xMidYMid meet"
                      style={{
                        width: '100%',
                        height: '100%',
                        filter: 'drop-shadow(0 0 10px rgba(100, 100, 100, 0.3))'
                      }}>
                      <g transform="translate(0.000000,1280.000000) scale(0.100000,-0.100000)"
                        fill="#3a3a4a" stroke="none">
                        <path d="M7090 12669 c-1 -257 -76 -628 -175 -871 -149 -365 -354 -643 -825
                        -1123 -562 -572 -1053 -1165 -1415 -1710 -256 -385 -443 -729 -568 -1045 -164
                        -415 -213 -716 -189 -1167 7 -126 17 -257 22 -293 4 -36 11 -87 15 -115 3 -27
                        17 -108 31 -180 66 -339 167 -634 321 -937 181 -358 383 -630 707 -954 206
                        -206 336 -319 558 -486 130 -98 458 -322 462 -316 1 1 20 53 40 113 45 131
                        132 315 211 452 58 99 233 361 296 443 231 303 515 606 864 926 411 375 725
                        680 839 814 99 117 243 309 323 432 261 403 385 922 386 1623 0 207 -4 314
                        -17 410 -76 586 -230 1136 -500 1782 -358 860 -885 1741 -1298 2168 l-87 90
                        -1 -56z"/>
                        <path d="M9510 9493 c0 -5 9 -55 21 -113 89 -462 132 -1021 110 -1453 -13
                        -249 -39 -482 -67 -597 -109 -438 -605 -1140 -1299 -1835 -126 -127 -291 -284
                        -365 -350 -160 -142 -223 -206 -374 -380 -276 -318 -452 -600 -476 -761 -5
                        -38 -19 -133 -31 -211 -21 -141 -21 -189 2 -261 8 -25 15 -32 28 -26 73 31
                        289 101 416 134 203 54 418 97 820 164 894 149 1116 222 1550 511 387 257 676
                        553 814 833 98 197 195 572 233 892 19 165 16 597 -5 780 -104 913 -509 1833
                        -1058 2404 -105 109 -294 276 -312 276 -4 0 -7 -3 -7 -7z"/>
                        <path d="M3355 8046 c-199 -134 -336 -247 -523 -430 -189 -186 -290 -306 -418
                        -498 -270 -403 -415 -856 -401 -1261 8 -258 75 -514 202 -772 237 -481 641
                        -873 1170 -1135 358 -177 715 -283 1170 -349 153 -22 511 -54 546 -49 16 2
                        -12 23 -107 82 -709 437 -1164 850 -1434 1303 -118 197 -228 493 -244 653 -4
                        36 -11 92 -16 125 -5 33 -16 116 -25 185 -8 69 -20 163 -26 210 -6 47 -13 196
                        -16 332 -5 240 4 411 38 673 5 44 12 98 15 120 3 22 9 65 14 95 5 30 12 73 16
                        95 26 174 135 576 188 698 5 9 4 17 0 17 -5 0 -72 -43 -149 -94z"/>
                      </g>
                    </svg>
                  </div>
                </div>
              ) : (
                (() => {
                  const groupedNotes = groupNotesByYearAndMonth();
                  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                    'July', 'August', 'September', 'October', 'November', 'December'];
                  
                  return Object.keys(groupedNotes).map(year => (
                    <div key={year} style={{marginBottom: '30px'}}>
                      {/* Year Header */}
                      <div 
                        onClick={() => toggleJournalSection(`year-${year}`)}
                        style={{
                          fontFamily: 'var(--font-ui)',
                          fontSize: '1.5rem',
                          fontWeight: '700',
                          color: 'var(--accent)',
                          marginBottom: '15px',
                          paddingBottom: '10px',
                          borderBottom: '4px solid rgba(var(--accent-rgb), 0.3)',
                          cursor: 'pointer',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center'
                        }}
                      >
                        <span>{year}</span>
                        <span style={{fontSize: '1rem', opacity: 0.7}}>
                          {Object.values(groupedNotes[year]).flat().length} entries
                        </span>
                      </div>
                      
                      {!isJournalSectionCollapsed(`year-${year}`) && (
                        <div style={{marginLeft: '0'}}>
                          {Object.keys(groupedNotes[year]).map(month => (
                            <div key={`${year}-${month}`} style={{marginBottom: '20px'}}>
                              {/* Month Header */}
                              <div 
                                onClick={() => toggleJournalSection(`month-${year}-${month}`)}
                                style={{
                                  fontFamily: 'var(--font-ui)',
                                  fontSize: '1.2rem',
                                  fontWeight: '600',
                                  color: 'var(--text-muted)',
                                  marginBottom: '10px',
                                  paddingBottom: '8px',
                                  borderBottom: '2px solid rgba(184, 169, 154, 0.2)',
                                  cursor: 'pointer',
                                  display: 'flex',
                                  justifyContent: 'space-between',
                                  alignItems: 'center'
                                }}
                              >
                                <span>{monthNames[month]}</span>
                                <span style={{fontSize: '0.9rem', opacity: 0.7}}>
                                  {groupedNotes[year][month].length} entries
                                </span>
                              </div>
                              
                              {!isJournalSectionCollapsed(`month-${year}-${month}`) && (
                                <div>
                                  {groupedNotes[year][month].map(note => (
                  <div 
                    key={note.id} 
                    className="note-entry" 
                    data-note-id={note.id}
                    onClick={(e) => {
                      // If clicking directly on note-entry (padding area), collapse
                      if (e.target.classList.contains('note-entry') && e.target === e.currentTarget) {
                        setNotes(notes.map(n => ({ ...n, expanded: false })));
                      } else {
                        // Clicking on content - stop propagation to keep note open
                        e.stopPropagation();
                      }
                    }}
                  >
                    <div className="note-header" onClick={() => toggleNoteExpanded(note.id)}>
                      <span className="note-date">
                        {new Date(note.date).toLocaleDateString('en-US', { 
                          weekday: 'long', 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric' 
                        })}
                      </span>
                    </div>
                    {note.expanded && (
                      <>
                        {/* Note Section */}
                        <div style={{
                          marginBottom: '20px',
                          padding: '20px',
                          background: 'rgba(var(--surface-rgb), 0.8)',
                          borderRadius: '15px',
                          border: '2px solid rgba(var(--accent-rgb), 0.3)'
                        }}>
                          <div style={{
                            fontFamily: 'var(--font-ui)',
                            fontSize: '1.3rem',
                            fontWeight: '700',
                            color: 'var(--text)',
                            marginBottom: '15px',
                            marginTop: 0,
                            paddingBottom: '10px',
                            borderBottom: '4px solid rgba(var(--accent-rgb), 0.3)'
                          }}>
                            Note
                          </div>

                        <div className="richtext-toolbar" onClick={(e) => e.stopPropagation()}>
                          <button 
                            className="toolbar-btn"
                            onMouseDown={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              
                              const noteContent = e.target.closest('.note-entry').querySelector('.note-content');
                              noteContent.focus();
                              
                              const selection = window.getSelection();
                              if (!selection.rangeCount || !noteContent.contains(selection.anchorNode)) {
                                const range = document.createRange();
                                range.selectNodeContents(noteContent);
                                range.collapse(false);
                                selection.removeAllRanges();
                                selection.addRange(range);
                              } else {
                                const range = selection.getRangeAt(0);
                                
                                // Helper to build a fresh checkbox line
                                const buildCheckboxLine = () => {
                                  const checkbox = document.createElement('input');
                                  checkbox.type = 'checkbox';
                                  checkbox.className = 'task-checkbox';
                                  checkbox.onclick = (evt) => evt.stopPropagation();
                                  const line = document.createElement('div');
                                  line.className = 'checkbox-line';
                                  line.style.display = 'flex';
                                  const span = document.createElement('span');
                                  span.contentEditable = 'true';
                                  span.innerHTML = '&nbsp;';
                                  line.appendChild(checkbox);
                                  line.appendChild(span);
                                  return { line, span };
                                };
                                
                                // Find the current line/block the cursor is on
                                let currentNode = range.startContainer;
                                let currentLine = currentNode.nodeType === Node.ELEMENT_NODE ?
                                  currentNode : currentNode.parentElement;
                                
                                while (currentLine && currentLine.parentElement !== noteContent && currentLine !== noteContent) {
                                  currentLine = currentLine.parentElement;
                                }
                                
                                // If it's a checkbox line that still has a live checkbox, don't double-add.
                                // But if it's a leftover empty checkbox-line (checkbox was deleted),
                                // fall through and treat it as a normal empty line.
                                if (currentLine && currentLine.classList && currentLine.classList.contains('checkbox-line')) {
                                  const hasCheckbox = currentLine.querySelector('.task-checkbox');
                                  const lineText = (currentLine.textContent || '').replace(/\u00A0/g, '').trim();
                                  if (hasCheckbox && lineText !== '') {
                                    return;
                                  }
                                  if (hasCheckbox && lineText === '') {
                                    return;
                                  }
                                  // else: leftover markup with no checkbox - fall through to convert it
                                }
                                
                                const { line: checkboxLine, span: textSpan } = buildCheckboxLine();
                                
                                const isProperLine = currentLine && currentLine !== noteContent && currentLine.parentElement === noteContent;
                                const currentLineText = isProperLine ? (currentLine.textContent || '').replace(/\u00A0/g, '').trim() : '';
                                
                                if (isProperLine && currentLineText === '') {
                                  // Empty line (including leftover empty checkbox-line) - replace with checkbox line
                                  currentLine.parentElement.replaceChild(checkboxLine, currentLine);
                                } else if (isProperLine && currentLineText !== '') {
                                  // Line has text - add checkbox on the NEXT line
                                  currentLine.parentElement.insertBefore(checkboxLine, currentLine.nextSibling);
                                } else {
                                  const areaText = (noteContent.textContent || '').replace(/\u00A0/g, '').trim();
                                  if (areaText === '') {
                                    noteContent.appendChild(checkboxLine);
                                  } else {
                                    range.collapse(false);
                                    range.insertNode(checkboxLine);
                                  }
                                }
                                
                                const newRange = document.createRange();
                                newRange.setStart(textSpan, 0);
                                newRange.collapse(true);
                                selection.removeAllRanges();
                                selection.addRange(newRange);
                              }
                            }}
                            title="Insert Checkbox"
                          >
                            <CheckboxIcon />Box
                          </button>
                          <button 
                            className="toolbar-btn"
                            onMouseDown={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              
                              const noteContent = e.target.closest('.note-entry').querySelector('.note-content');
                              noteContent.focus();
                              
                              const selection = window.getSelection();
                              if (!selection.rangeCount || !noteContent.contains(selection.anchorNode)) {
                                const range = document.createRange();
                                range.selectNodeContents(noteContent);
                                range.collapse(false);
                                selection.removeAllRanges();
                                selection.addRange(range);
                              }
                              
                              document.execCommand('insertUnorderedList', false, null);
                            }}
                            title="Bullet List"
                          >
                            • Bullets
                          </button>
                          <button 
                            className="toolbar-btn"
                            onMouseDown={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              
                              const noteContent = e.target.closest('.note-entry').querySelector('.note-content');
                              noteContent.focus();
                              
                              document.execCommand('bold', false, null);
                            }}
                            title="Bold"
                          >
                            {/* 700, not 900: 900 isn't among the loaded weights,
                                so the browser was synthesising it. */}
                            <strong style={{fontWeight: 700}}>B</strong>
                          </button>
                          <button 
                            className="toolbar-btn"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              const input = document.createElement('input');
                              input.type = 'file';
                              input.accept = 'image/*';
                              input.onchange = (evt) => {
                                const file = evt.target.files[0];
                                if (file) {
                                  addImageToNote(note.id, file);
                                }
                              };
                              input.click();
                            }}
                            title="Upload Image"
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
                              <circle cx="12" cy="13" r="4"></circle>
                              <line x1="17" y1="3" x2="17" y2="6"></line>
                              <circle cx="17" cy="2" r="1"></circle>
                            </svg>
                          </button>
                        </div>

                        {/* Display uploaded images */}
                        {note.images && note.images.length > 0 && (
                          <div className="note-images">
                            {note.images.map(img => (
                              <div key={img.id} className="note-image-container">
                                <img src={img.data} alt="Note attachment" className="note-image" />
                                <button 
                                  aria-label="Remove image"
                                  className="remove-image-btn"
                                  onClick={() => removeImageFromNote(note.id, img.id)}
                                >
                                  ×
                                </button>
                                {img.isProcessing && (
                                  <div className="ocr-status">Extracting text...</div>
                                )}
                                {!img.isProcessing && img.extractedText && (
                                  <div className="extracted-text">
                                    <div className="extracted-text-label">Extracted Text:</div>
                                    <div className="extracted-text-content">
                                      {img.extractedText}
                                    </div>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}

                        <div 
                          className="note-content"
                          contentEditable
                          suppressContentEditableWarning
                          onInput={(e) => {
                            const area = e.currentTarget;
                            try {
                              const lines = Array.from(area.querySelectorAll('.checkbox-line'));
                              const gi = (l) => parseInt(l.style.marginLeft || '0') || 0;
                              lines.forEach(l => { l.classList.remove('has-children'); l.classList.remove('ends-list'); });
                              for (let i = 0; i < lines.length; i++) {
                                const ind = gi(lines[i]);
                                const nxt = i + 1 < lines.length ? gi(lines[i + 1]) : -1;
                                const prv = i > 0 ? gi(lines[i - 1]) : -1;
                                if (nxt > ind) {
                                  const txt = (lines[i].textContent || '').replace(/\u00A0/g, '').trim();
                                  if (txt) lines[i].classList.add('has-children');
                                }
                                if (ind === 0 && prv > 0) lines[i].classList.add('ends-list');
                              }
                            } catch (err) {}
                          }}
                          onBlur={(e) => updateNote(note.id, e.currentTarget.innerHTML)}
                          onClick={(e) => {
                            e.stopPropagation();
                            // Open pasted links in a new tab
                            const link = e.target && e.target.closest && e.target.closest('a.task-link');
                            if (link) {
                              e.preventDefault();
                              const href = link.getAttribute('href');
                              if (href) window.open(href, '_blank', 'noopener,noreferrer');
                            }
                          }}
                          onPaste={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            
                            const text = (e.clipboardData?.getData('text/plain') || '');
                            const trimmed = text.trim();
                            
                            const selection = window.getSelection();
                            if (!selection.rangeCount) return;
                            const range = selection.getRangeAt(0);
                            range.deleteContents();
                            
                            // A single pasted URL becomes a compact "Link" anchor
                            const isUrl = /^(https?:\/\/|www\.)\S+$/i.test(trimmed);
                            if (isUrl) {
                              const href = /^https?:\/\//i.test(trimmed) ? trimmed : 'https://' + trimmed;
                              const a = document.createElement('a');
                              a.href = href;
                              a.textContent = 'Link';
                              a.className = 'task-link';
                              a.target = '_blank';
                              a.rel = 'noopener noreferrer';
                              a.title = href;
                              a.contentEditable = 'false';
                              range.insertNode(a);
                              const after = document.createTextNode('\u00A0');
                              a.parentNode.insertBefore(after, a.nextSibling);
                              const newRange = document.createRange();
                              newRange.setStart(after, 1);
                              newRange.collapse(true);
                              selection.removeAllRanges();
                              selection.addRange(newRange);
                            } else {
                              const textNode = document.createTextNode(text);
                              range.insertNode(textNode);
                              selection.collapseToEnd();
                            }
                          }}
                          onKeyDown={(e) => {
                            e.stopPropagation();
                            
                            const selection = window.getSelection();
                            if (!selection.rangeCount) return;
                            
                            const range = selection.getRangeAt(0);
                            const currentNode = range.startContainer;
                            
                            let checkboxLine = currentNode.nodeType === Node.ELEMENT_NODE ? 
                              currentNode.closest('.checkbox-line') : 
                              currentNode.parentElement?.closest('.checkbox-line');
                            
                            // Handle Tab key - indent checkbox
                            if (e.key === 'Tab' && checkboxLine) {
                              e.preventDefault();
                              const currentIndent = parseInt(checkboxLine.style.marginLeft || '0') || 0;
                              const newIndent = currentIndent + 20;
                              checkboxLine.style.marginLeft = newIndent + 'px';
                              
                              // Auto-bold the parent line (nearest preceding sibling with smaller indent)
                              let prevLine = checkboxLine.previousElementSibling;
                              while (prevLine) {
                                const prevIndent = parseInt(prevLine.style.marginLeft || '0') || 0;
                                if (prevIndent < newIndent) {
                                  const lineTxt = (prevLine.textContent || '').replace(/\u00A0/g, '').trim();
                                  if (lineTxt) {
                                    prevLine.classList.add('has-children');
                                    prevLine.style.fontWeight = 'bold';
                                    const parentSpan = prevLine.querySelector('span');
                                    if (parentSpan) {
                                      parentSpan.style.fontWeight = 'bold';
                                    }
                                  }
                                  break;
                                }
                                prevLine = prevLine.previousElementSibling;
                              }
                            }
                            
                            // Handle Backspace at the start of a checkbox line
                            else if (e.key === 'Backspace' && checkboxLine && selection.isCollapsed) {
                              const textSpan = checkboxLine.querySelector('span');
                              let atStart = false;
                              const container = range.startContainer;
                              const offset = range.startOffset;
                              if (textSpan) {
                                if (offset === 0 && (container === textSpan || container === textSpan.firstChild)) {
                                  atStart = true;
                                }
                                const spanText = (textSpan.textContent || '').replace(/\u00A0/g, '');
                                if (spanText === '' && offset <= 1) atStart = true;
                              } else if (container === checkboxLine && offset === 0) {
                                atStart = true;
                              }
                              if (atStart) {
                                e.preventDefault();
                                const indent = parseInt(checkboxLine.style.marginLeft || '0') || 0;
                                if (indent > 0) {
                                  checkboxLine.style.marginLeft = Math.max(0, indent - 20) + 'px';
                                  const r = document.createRange();
                                  r.setStart(textSpan || checkboxLine, 0);
                                  r.collapse(true);
                                  selection.removeAllRanges();
                                  selection.addRange(r);
                                } else {
                                  const newLine = document.createElement('div');
                                  newLine.style.display = 'block';
                                  const newSpan = document.createElement('span');
                                  newSpan.contentEditable = 'true';
                                  newSpan.innerHTML = (textSpan && textSpan.innerHTML) ? textSpan.innerHTML : '&nbsp;';
                                  newLine.appendChild(newSpan);
                                  checkboxLine.parentNode.replaceChild(newLine, checkboxLine);
                                  const r = document.createRange();
                                  r.setStart(newSpan.firstChild || newSpan, 0);
                                  r.collapse(true);
                                  selection.removeAllRanges();
                                  selection.addRange(r);
                                }
                              }
                            }
                            
                            // Handle Enter key
                            else if (e.key === 'Enter' && checkboxLine) {
                              const checkbox = checkboxLine.querySelector('.task-checkbox');
                              // Read text from the entire line, excluding the checkbox input.
                              const lineText = (checkboxLine.textContent || '').replace(/\u00A0/g, ' ').trim();
                              const isEmpty = lineText === '';
                              const currentIndent = parseInt(checkboxLine.style.marginLeft || '0');
                              const textSpan = checkboxLine.querySelector('span') || checkboxLine;
                              
                              // Case 1: Empty checkbox with no indent - delete checkbox, create normal text line
                              if (isEmpty && currentIndent === 0) {
                                e.preventDefault();
                                
                                const newLine = document.createElement('div');
                                newLine.style.display = 'block';
                                const newTextSpan = document.createElement('span');
                                newTextSpan.innerHTML = '&nbsp;';
                                newTextSpan.contentEditable = 'true';
                                newLine.appendChild(newTextSpan);
                                
                                checkboxLine.parentNode.insertBefore(newLine, checkboxLine.nextSibling);
                                checkboxLine.remove();
                                
                                const newRange = document.createRange();
                                newRange.setStart(newTextSpan, 0);
                                newRange.collapse(true);
                                selection.removeAllRanges();
                                selection.addRange(newRange);
                              }
                              
                              // Case 2: Empty indented checkbox - outdent
                              else if (isEmpty && currentIndent > 0) {
                                e.preventDefault();
                                checkboxLine.style.marginLeft = Math.max(0, currentIndent - 20) + 'px';
                                const newRange = document.createRange();
                                newRange.setStart(textSpan, 0);
                                newRange.collapse(true);
                                selection.removeAllRanges();
                                selection.addRange(newRange);
                              }
                              
                              // Case 3: Checkbox with text - create new checkbox at same indent
                              else {
                                e.preventDefault();
                                
                                const newCheckboxLine = document.createElement('div');
                                newCheckboxLine.className = 'checkbox-line';
                                newCheckboxLine.style.display = 'flex';
                                newCheckboxLine.style.marginLeft = currentIndent + 'px';
                                
                                const newCheckbox = document.createElement('input');
                                newCheckbox.type = 'checkbox';
                                newCheckbox.className = 'task-checkbox';
                                newCheckbox.onclick = (evt) => evt.stopPropagation();
                                
                                const newTextSpan = document.createElement('span');
                                newTextSpan.innerHTML = '&nbsp;';
                                newTextSpan.contentEditable = 'true';
                                
                                newCheckboxLine.appendChild(newCheckbox);
                                newCheckboxLine.appendChild(newTextSpan);
                                
                                checkboxLine.parentNode.insertBefore(newCheckboxLine, checkboxLine.nextSibling);
                                
                                const newRange = document.createRange();
                                newRange.setStart(newTextSpan, 0);
                                newRange.collapse(true);
                                selection.removeAllRanges();
                                selection.addRange(newRange);
                              }
                            }
                            
                            // Refresh list markers after structural keys
                            if (e.key === 'Tab' || e.key === 'Enter' || e.key === 'Backspace') {
                              setTimeout(() => {
                                const area = e.target.closest('.note-content');
                                if (!area) return;
                                try {
                                  const lines = Array.from(area.querySelectorAll('.checkbox-line'));
                                  const gi = (l) => parseInt(l.style.marginLeft || '0') || 0;
                                  lines.forEach(l => { l.classList.remove('has-children'); l.classList.remove('ends-list'); });
                                  for (let i = 0; i < lines.length; i++) {
                                    const ind = gi(lines[i]);
                                    const nxt = i + 1 < lines.length ? gi(lines[i + 1]) : -1;
                                    const prv = i > 0 ? gi(lines[i - 1]) : -1;
                                    if (nxt > ind) {
                                      const txt = (lines[i].textContent || '').replace(/\u00A0/g, '').trim();
                                      if (txt) lines[i].classList.add('has-children');
                                    }
                                    if (ind === 0 && prv > 0) lines[i].classList.add('ends-list');
                                  }
                                } catch (err) {}
                              }, 0);
                            }
                          }}
                          dangerouslySetInnerHTML={{ __html: sanitizeRichText(note.content) }}
                        />

                        {/* Photo Gallery Section */}
                        <div style={{marginTop: '20px'}}>
                          <div style={{
                            display: 'flex',
                            flexWrap: 'wrap',
                            alignItems: 'center',
                            gap: '10px',
                            marginBottom: '10px'
                          }}>
                            <label style={{
                              color: 'var(--text-muted)',
                              fontSize: '0.9rem',
                              fontFamily: 'var(--font-ui)',
                              fontWeight: '600'
                            }}>
                              Photos:
                            </label>
                            <button
                              className="toolbar-btn"
                              onClick={() => {
                                const input = document.createElement('input');
                                input.type = 'file';
                                input.accept = 'image/*';
                                input.multiple = true;
                                input.onchange = (evt) => {
                                  const files = Array.from(evt.target.files);
                                  files.forEach(file => {
                                    if (file) {
                                      addGalleryPhotoToNote(note.id, file);
                                    }
                                  });
                                };
                                input.click();
                              }}
                              style={{
                                padding: '6px 12px',
                                fontSize: '0.85rem',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px'
                              }}
                            >
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
                                <circle cx="12" cy="13" r="4"></circle>
                                <line x1="17" y1="3" x2="17" y2="6"></line>
                                <circle cx="17" cy="2" r="1"></circle>
                              </svg>
                              Add Photos
                            </button>
                          </div>
                          
                          {/* Display gallery photos */}
                          {note.gallery && note.gallery.length > 0 && (
                            <div style={{
                              display: 'grid',
                              gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
                              gap: '10px',
                              marginTop: '10px'
                            }}>
                              {note.gallery.map(photo => (
                                <div 
                                  key={photo.id} 
                                  style={{
                                    position: 'relative',
                                    borderRadius: '8px',
                                    overflow: 'hidden',
                                    border: '2px solid rgba(var(--accent-rgb), 0.3)',
                                    aspectRatio: '1',
                                  }}
                                >
                                  <img 
                                    src={photo.data} 
                                    alt="Gallery" 
                                    style={{
                                      width: '100%',
                                      height: '100%',
                                      objectFit: 'cover',
                                      display: 'block'
                                    }}
                                  />
                                  <button 
                                    aria-label="Remove photo"
                                    onClick={() => removeGalleryPhotoFromNote(note.id, photo.id)}
                                    style={{
                                      position: 'absolute',
                                      top: '5px',
                                      right: '5px',
                                      background: 'rgba(0, 0, 0, 0.7)',
                                      color: '#fff',
                                      border: 'none',
                                      borderRadius: '50%',
                                      width: '24px',
                                      height: '24px',
                                      cursor: 'pointer',
                                      fontSize: '16px',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      padding: 0,
                                      lineHeight: 1
                                    }}
                                  >
                                    ×
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Location Field */}
                        <div style={{marginTop: '15px'}}>
                          <div style={{
                            display: 'flex',
                            flexWrap: 'wrap',
                            alignItems: 'center',
                            gap: '10px'
                          }}>
                            <label style={{
                              color: 'var(--text-muted)',
                              fontSize: '0.9rem',
                              fontFamily: 'var(--font-ui)',
                              fontWeight: '600',
                              minWidth: 'fit-content'
                            }}>
                              Location:
                            </label>
                            <input
                              type="text"
                              value={note.location || ''}
                              onChange={(e) => updateNoteLocation(note.id, e.target.value)}
                              onFocus={() => {
                                // Auto-fetch location if empty
                                if (!note.location || note.location === '') {
                                  fetchLocationForNote(note.id);
                                }
                              }}
                              placeholder="Click to auto-detect or type location..."
                              onClick={(e) => e.stopPropagation()}
                              style={{
                                width: '100%',
                                padding: '8px 12px',
                                background: 'rgba(var(--surface-rgb), 0.8)',
                                border: '2px solid rgba(var(--accent-rgb), 0.3)',
                                borderRadius: '8px',
                                color: 'var(--text)',
                                fontSize: '0.9rem',
                                fontFamily: 'var(--font-ui)',
                                boxSizing: 'border-box'
                              }}
                            />
                            {note.location && (
                              <button
                                aria-label="Clear location"
                                onClick={() => updateNoteLocation(note.id, '')}
                                style={{
                                  background: 'transparent',
                                  border: 'none',
                                  color: 'var(--text-muted)',
                                  cursor: 'pointer',
                                  fontSize: '1.2rem',
                                  padding: '4px 8px'
                                }}
                                title="Clear location"
                              >
                                ×
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Tags section */}
                        <div style={{marginTop: '15px'}}>
                          <div style={{display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '10px'}}>
                            {(note.tags || []).map(tag => (
                              <span key={tag} className="note-tag">
                                {tag}
                                <button 
                                  aria-label="Remove tag"
                                  className="tag-remove"
                                  onClick={() => removeTagFromNote(note.id, tag)}
                                >
                                  ×
                                </button>
                              </span>
                            ))}
                          </div>
                          
                          <input
                            type="text"
                            placeholder="Tags"
                            className="tag-input"
                            onKeyPress={(e) => {
                              if (e.key === 'Enter') {
                                addTagToNote(note.id, e.target.value);
                                e.target.value = '';
                              }
                            }}
                            onClick={(e) => e.stopPropagation()}
                          />
                        </div>
                        </div>

                        {/* Time Logged Section */}
                        <div style={{
                          marginTop: '20px',
                          padding: '20px',
                          background: 'rgba(var(--surface-rgb), 0.8)',
                          borderRadius: '15px',
                          border: '2px solid rgba(var(--accent-rgb), 0.3)'
                        }}>
                          <div style={{
                            fontFamily: 'var(--font-ui)',
                            fontSize: '1.3rem',
                            fontWeight: '700',
                            color: 'var(--text)',
                            marginBottom: '15px',
                            paddingBottom: '10px',
                            borderBottom: '4px solid rgba(var(--accent-rgb), 0.3)'
                          }}>
                            Time Logged
                          </div>
                          {(note.timeLogged || 0) > 0 && (
                            <div style={{
                              fontFamily: 'var(--font-ui)',
                              fontSize: '2rem',
                              fontWeight: '700',
                              color: 'var(--text)',
                              marginBottom: '15px',
                              textAlign: 'center'
                            }}>
                              {(() => {
                                const hours = Math.floor((note.timeLogged || 0) / 60);
                                const minutes = (note.timeLogged || 0) % 60;
                                if (hours > 0) {
                                  return `${hours}h ${minutes}m`;
                                } else {
                                  return `${minutes}m`;
                                }
                              })()}
                            </div>
                          )}
                          <div style={{textAlign: 'center'}}>
                            <button 
                              className="add-task-btn"
                              onClick={(e) => {
                                e.stopPropagation();
                                setTimeLoggerContext({ type: 'note', id: note.id });
                                setShowTimeLogger(true);
                                setLoggedMinutes(0);
                                setLoggedSeconds(0);
                                setIsLogging(false);
                                setLogStartTime(null);
                        setPausedTime(0);
                              }}
                              style={{width: 'auto', padding: '12px 30px'}}
                            >
                              Log Time
                            </button>
                          </div>
                        </div>

                        <div style={{display: 'flex', gap: '15px', marginTop: '10px', justifyContent: 'flex-end'}}>
                          <button 
                            className="edit-btn primary-action"
                            onClick={(e) => {
                              const noteContent = e.target.closest('.note-entry').querySelector('.note-content');
                              updateNote(note.id, noteContent.innerHTML);
                              // Collapse the note after saving
                              setNotes(prev => prev.map(n => 
                                n.id === note.id ? { ...n, expanded: false } : n
                              ));
                            }}
                          >
                            Save
                          </button>
                          <button 
                            className="delete-btn"
                            onClick={() => setNoteToDelete(note.id)}
                          >
                            Delete
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ));
                })()
              )}
            </div>

            {/* Delete Confirmation Modal */}
            {noteToDelete && (
              <div className="modal-overlay" onClick={() => setNoteToDelete(null)}>
                <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                  <h3>Delete Note?</h3>
                  <div className="modal-actions" style={{justifyContent: 'center'}}>
                    <button 
                      className="delete-btn" 
                      onClick={() => {
                        deleteNote(noteToDelete);
                        setNoteToDelete(null);
                      }}
                    >
                      Confirm Delete
                    </button>
                    <button 
                      className="edit-btn" 
                      onClick={() => setNoteToDelete(null)}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {appMode === 'projects' && (
          <div className="projects-section">
            {/* Project Tabs - Always visible */}
            <div className="tabs-container">
              <button
                className={`tab master-tab ${currentProjectList === 'master' ? 'active' : ''}`}
                onClick={() => {
                  setCurrentProjectList('master');
                  setSelectedProject(null);
                }}
              >
                All Projects
              </button>
              <div className="tabs">
                <button
                  className={`tab ${currentProjectList === 'personal' ? 'active' : ''}`}
                  onClick={() => {
                    setCurrentProjectList('personal');
                    setSelectedProject(null);
                  }}
                >
                  Personal
                </button>
                <button
                  className={`tab ${currentProjectList === 'work' ? 'active' : ''}`}
                  onClick={() => {
                    setCurrentProjectList('work');
                    setSelectedProject(null);
                  }}
                >
                  Work
                </button>
                <button
                  className={`tab ${currentProjectList === 'home' ? 'active' : ''}`}
                  onClick={() => {
                    setCurrentProjectList('home');
                    setSelectedProject(null);
                  }}
                >
                  Home
                </button>
                <button
                  className={`tab ${currentProjectList === 'travel' ? 'active' : ''}`}
                  onClick={() => {
                    setCurrentProjectList('travel');
                    setSelectedProject(null);
                  }}
                >
                  Travel
                </button>
                <button
                  className={`tab ${currentProjectList === 'kids' ? 'active' : ''}`}
                  onClick={() => {
                    setCurrentProjectList('kids');
                    setSelectedProject(null);
                  }}
                >
                  Kids
                </button>
              </div>
            </div>

            {!selectedProject ? (
              <>
                {currentProjectList !== 'master' && (
                  <div className="projects-header" style={{display: 'block', textAlign: 'center'}}>
                    <button 
                      className="add-task-btn" 
                      onClick={() => setShowProjectForm(true)}
                      style={{width: '70%', display: 'inline-block'}}
                    >
                      New Project
                    </button>
                  </div>
                )}

                {/* Project Form Modal */}
                {showProjectForm && (
                  <div className="modal-overlay" onClick={() => setShowProjectForm(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                      <h3>{editingProject ? 'Edit Project' : 'Create New Project'}</h3>
                      <div className="form-field">
                        <label>Project Name *</label>
                        <input
                          type="text"
                          value={projectFormData.name}
                          onChange={(e) => setProjectFormData(prev => ({ ...prev, name: e.target.value }))}
                          placeholder="Enter project name"
                          autoFocus
                        />
                      </div>
                      <div className="form-field">
                        <label>Description</label>
                        <textarea
                          value={projectFormData.description}
                          onChange={(e) => setProjectFormData(prev => ({ ...prev, description: e.target.value }))}
                          placeholder="Enter project description"
                          rows="3"
                        />
                      </div>
                      <div className="form-field" style={{width: '50%'}}>
                        <label>Start Date</label>
                        <InlineDatePicker
                          value={projectFormData.startDate}
                          onChange={(v) => setProjectFormData(prev => ({ ...prev, startDate: v }))}
                          style={{width: '100%'}}
                        />
                      </div>
                      <div className="form-field" style={{width: '50%'}}>
                        <label>End Date</label>
                        <InlineDatePicker
                          value={projectFormData.endDate}
                          onChange={(v) => setProjectFormData(prev => ({ ...prev, endDate: v }))}
                          style={{width: '100%'}}
                        />
                      </div>
                      <div className="modal-actions">
                        <button className="edit-btn primary-action" onClick={submitProjectForm}>
                          {editingProject ? 'Save Changes' : 'Create Project'}
                        </button>
                        <button className="delete-btn" onClick={() => {
                          setShowProjectForm(false);
                          setEditingProject(null);
                          setProjectFormData({ name: '', description: '', startDate: '', endDate: '' });
                        }}>
                          Cancel
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Projects List */}
                <div className="projects-list">
                  {getCurrentProjects().length === 0 ? (
                    <div className="empty-state" style={{display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '300px'}}>
                      <div style={{
                        width: '180px',
                        height: '180px',
                        position: 'relative',
                        display: 'inline-block'
                      }}>
                        {/* Background circle */}
                        <svg 
                          style={{
                            position: 'absolute',
                            top: '-15px',
                            left: '-15px',
                            width: '210px',
                            height: '210px',
                            transform: 'rotate(-90deg)',
                            pointerEvents: 'none'
                          }}
                        >
                          <circle
                            cx="105"
                            cy="105"
                            r="95"
                            fill="none"
                            stroke="rgba(var(--surface-alt-rgb), 0.3)"
                            strokeWidth="8"
                          />
                        </svg>
                        
                        {/* Dark Fire Icon */}
                        <svg version="1.0" xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 1280.000000 1280.000000"
                          preserveAspectRatio="xMidYMid meet"
                          style={{
                            width: '100%',
                            height: '100%',
                            filter: 'drop-shadow(0 0 10px rgba(100, 100, 100, 0.3))'
                          }}>
                          <g transform="translate(0.000000,1280.000000) scale(0.100000,-0.100000)"
                            fill="#3a3a4a" stroke="none">
                            <path d="M7090 12669 c-1 -257 -76 -628 -175 -871 -149 -365 -354 -643 -825
                            -1123 -562 -572 -1053 -1165 -1415 -1710 -256 -385 -443 -729 -568 -1045 -164
                            -415 -213 -716 -189 -1167 7 -126 17 -257 22 -293 4 -36 11 -87 15 -115 3 -27
                            17 -108 31 -180 66 -339 167 -634 321 -937 181 -358 383 -630 707 -954 206
                            -206 336 -319 558 -486 130 -98 458 -322 462 -316 1 1 20 53 40 113 45 131
                            132 315 211 452 58 99 233 361 296 443 231 303 515 606 864 926 411 375 725
                            680 839 814 99 117 243 309 323 432 261 403 385 922 386 1623 0 207 -4 314
                            -17 410 -76 586 -230 1136 -500 1782 -358 860 -885 1741 -1298 2168 l-87 90
                            -1 -56z"/>
                            <path d="M9510 9493 c0 -5 9 -55 21 -113 89 -462 132 -1021 110 -1453 -13
                            -249 -39 -482 -67 -597 -109 -438 -605 -1140 -1299 -1835 -126 -127 -291 -284
                            -365 -350 -160 -142 -223 -206 -374 -380 -276 -318 -452 -600 -476 -761 -5
                            -38 -19 -133 -31 -211 -21 -141 -21 -189 2 -261 8 -25 15 -32 28 -26 73 31
                            289 101 416 134 203 54 418 97 820 164 894 149 1116 222 1550 511 387 257 676
                            553 814 833 98 197 195 572 233 892 19 165 16 597 -5 780 -104 913 -509 1833
                            -1058 2404 -105 109 -294 276 -312 276 -4 0 -7 -3 -7 -7z"/>
                            <path d="M3355 8046 c-199 -134 -336 -247 -523 -430 -189 -186 -290 -306 -418
                            -498 -270 -403 -415 -856 -401 -1261 8 -258 75 -514 202 -772 237 -481 641
                            -873 1170 -1135 358 -177 715 -283 1170 -349 153 -22 511 -54 546 -49 16 2
                            -12 23 -107 82 -709 437 -1164 850 -1434 1303 -118 197 -228 493 -244 653 -4
                            36 -11 92 -16 125 -5 33 -16 116 -25 185 -8 69 -20 163 -26 210 -6 47 -13 196
                            -16 332 -5 240 4 411 38 673 5 44 12 98 15 120 3 22 9 65 14 95 5 30 12 73 16
                            95 26 174 135 576 188 698 5 9 4 17 0 17 -5 0 -72 -43 -149 -94z"/>
                          </g>
                        </svg>
                      </div>
                    </div>
                  ) : currentProjectList === 'master' ? (
                    // Master view - group by list
                    (() => {
                      const showStates = {
                        personal: showPersonalProjects,
                        work: showWorkProjects,
                        home: showHomeProjects,
                        travel: showTravelProjects,
                        kids: showKidsProjects
                      };
                      
                      const toggleStates = {
                        personal: setShowPersonalProjects,
                        work: setShowWorkProjects,
                        home: setShowHomeProjects,
                        travel: setShowTravelProjects,
                        kids: setShowKidsProjects
                      };
                      
                      return ['personal', 'work', 'home', 'travel', 'kids'].map(listName => {
                        const listProjects = projects[listName] || [];
                        if (listProjects.length === 0) return null;
                        
                        return (
                          <div key={listName} className="list-section">
                            <div 
                              className="list-section-header"
                              onClick={() => toggleStates[listName](!showStates[listName])}
                              style={{cursor: 'pointer'}}
                            >
                              <span style={{textTransform: 'capitalize'}}>{listName} Projects</span>
                              <span className={`badge ${listName}`}>{listProjects.length}</span>
                            </div>
                            {showStates[listName] && (
                              <>
                                {listProjects.map(project => {
                                  const projectTasks = getProjectTasks(project.id);
                                  const completedTasks = projectTasks.filter(t => t.completed).length;
                                  const totalTasks = projectTasks.length;
                                  
                                  return (
                                    <div key={project.id} className="project-card">
                                      <div className="project-header" onClick={() => setSelectedProject({ id: project.id, listName })}>
                                        <div>
                                          <h3>{project.name}</h3>
                                          {project.description && (
                                            <p className="project-description">{project.description}</p>
                                          )}
                                        </div>
                                        <div className="project-meta">
                                          {(project.startDate || project.endDate) && (
                                            <span className="project-due-date">
                                              <CalendarIcon /> {project.startDate && parseLocalDate(project.startDate)?.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                              {project.startDate && project.endDate && ' - '}
                                              {project.endDate && parseLocalDate(project.endDate)?.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                            </span>
                                          )}
                                          <span className="project-task-count">
                                            {completedTasks}/{totalTasks} tasks
                                          </span>
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })}
                              </>
                            )}
                          </div>
                        );
                      });
                    })()
                  ) : (
                    // Individual list view
                    getCurrentProjects().map((project, index) => {
                      const projectTasks = getProjectTasks(project.id);
                      const completedTasks = projectTasks.filter(t => t.completed).length;
                      const totalTasks = projectTasks.length;
                      const isDragging = draggedProject?.id === project.id;
                      const isDragOver = dragOverProject?.id === project.id;
                      
                      return (
                        <div 
                          key={project.id} 
                          className="project-card"
                          draggable={currentProjectList !== 'master'}
                          onDragStart={(e) => {
                            if (currentProjectList === 'master') return;
                            setDraggedProject({ ...project, index, listName: currentProjectList });
                            e.dataTransfer.effectAllowed = 'move';
                          }}
                          onDragEnd={() => {
                            setDraggedProject(null);
                            setDragOverProject(null);
                          }}
                          onDragOver={(e) => {
                            if (currentProjectList === 'master') return;
                            e.preventDefault();
                            e.dataTransfer.dropEffect = 'move';
                            if (draggedProject && draggedProject.id !== project.id) {
                              setDragOverProject({ ...project, index });
                            }
                          }}
                          onDragLeave={() => {
                            setDragOverProject(null);
                          }}
                          onDrop={(e) => {
                            if (currentProjectList === 'master') return;
                            e.preventDefault();
                            if (draggedProject && draggedProject.id !== project.id) {
                              reorderProjects(currentProjectList, draggedProject.index, index);
                            }
                            setDraggedProject(null);
                            setDragOverProject(null);
                          }}
                          onTouchStart={(e) => {
                            if (currentProjectList === 'master') return;
                            handleTouchStart(e, project, index, currentProjectList, 'project');
                          }}
                          onTouchMove={(e) => {
                            if (currentProjectList === 'master') return;
                            handleTouchMove(e, getCurrentProjects(), 'project');
                          }}
                          onTouchEnd={(e) => {
                            if (currentProjectList === 'master') return;
                            handleTouchEnd(e, currentProjectList, 'project');
                          }}
                          style={{
                            opacity: isDragging ? 0.5 : 1,
                            cursor: currentProjectList !== 'master' ? 'move' : 'default',
                            borderTop: isDragOver && draggedProject?.index > index ? '3px solid var(--accent)' : undefined,
                            borderBottom: isDragOver && draggedProject?.index < index ? '3px solid var(--accent)' : undefined,
                            transition: 'opacity 0.2s, border 0.2s'
                          }}
                        >
                          <div className="project-header" onClick={() => setSelectedProject({ id: project.id, listName: currentProjectList })}>
                            <div>
                              <h3>{project.name}</h3>
                              {project.description && (
                                <p className="project-description">{project.description}</p>
                              )}
                            </div>
                            <div className="project-meta">
                              {(project.startDate || project.endDate) && (
                                <span className="project-due-date">
                                  <CalendarIcon /> {project.startDate && parseLocalDate(project.startDate)?.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                  {project.startDate && project.endDate && ' - '}
                                  {project.endDate && parseLocalDate(project.endDate)?.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                </span>
                              )}
                              <span className="project-task-count">
                                {completedTasks}/{totalTasks} tasks
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </>
            ) : (
              <>
                {/* Project Detail View */}
                {(() => {
                  const project = projects[selectedProject.listName]?.find(p => p.id === selectedProject.id);
                  if (!project) return null;
                  
                  const tasks = getProjectTasks(selectedProject.id);
                  const todoTasks = tasks.filter(t => t.section === 'todo' && !t.completed);
                  const backlogTasks = tasks.filter(t => t.section === 'backlog' && !t.completed);
                  const completedTasks = tasks.filter(t => t.completed);
                  
                  return (
                    <div 
                      className="project-detail"
                      onClick={(e) => {
                        // Close if clicking on the background (not the detail content)
                        if (e.target.className === 'project-detail') {
                          setSelectedProject(null);
                        }
                      }}
                    >
                      <div className="project-detail-content">
                      {/* Project Section */}
                      <div style={{
                        marginBottom: '30px',
                        padding: '20px',
                        background: 'rgba(var(--surface-rgb), 0.8)',
                        borderRadius: '15px',
                        border: '2px solid rgba(var(--accent-rgb), 0.3)'
                      }}>
                        <div style={{
                          fontFamily: 'var(--font-ui)',
                          fontSize: '1.3rem',
                          fontWeight: '700',
                          color: 'var(--text)',
                          marginBottom: '15px',
                          marginTop: 0,
                          paddingBottom: '10px',
                          borderBottom: '4px solid rgba(var(--accent-rgb), 0.3)'
                        }}>
                          Project
                        </div>

                        <div className="project-detail-header">
                          {editingProjectName ? (
                            <input
                              type="text"
                              value={project.name}
                              onChange={(e) => {
                                updateProject(selectedProject.listName, selectedProject.id, { name: e.target.value });
                              }}
                              onBlur={() => setEditingProjectName(false)}
                              onKeyPress={(e) => {
                                if (e.key === 'Enter') setEditingProjectName(false);
                              }}
                              autoFocus
                              className="project-name-edit"
                            />
                          ) : (
                            <h2 onClick={() => setEditingProjectName(true)} style={{cursor: 'pointer'}} className="project-detail-name">
                              {project.name}
                            </h2>
                          )}
                        </div>

                        {/* Description Field */}
                        <div style={{marginTop: '20px', marginBottom: '20px'}}>
                          <label style={{
                            display: 'block',
                            color: 'var(--text-muted)',
                            fontSize: '0.9rem',
                            marginBottom: '8px',
                            fontFamily: 'var(--font-ui)'
                          }}>
                            Description:
                          </label>
                          <textarea
                            value={project.description || ''}
                            onChange={(e) => updateProject(selectedProject.listName, selectedProject.id, { description: e.target.value })}
                            placeholder="Add project description..."
                            style={{
                              width: '100%',
                              minHeight: '80px',
                              padding: '12px',
                              background: 'rgba(var(--surface-rgb), 0.8)',
                              border: '2px solid rgba(var(--accent-rgb), 0.3)',
                              borderRadius: '10px',
                              color: 'var(--text)',
                            fontSize: '0.95rem',
                            fontFamily: 'var(--font-ui)',
                            resize: 'vertical',
                            boxSizing: 'border-box'
                          }}
                        />
                      </div>

                      {/* Challenge Field */}
                      <div style={{marginBottom: '20px'}}>
                        <label style={{
                          display: 'block',
                          color: 'var(--text-muted)',
                          fontSize: '0.9rem',
                          marginBottom: '8px',
                          fontFamily: 'var(--font-ui)'
                        }}>
                          Challenge:
                        </label>
                        <textarea
                          value={project.challenge || ''}
                          onChange={(e) => updateProject(selectedProject.listName, selectedProject.id, { challenge: e.target.value })}
                          placeholder="Add a challenge..."
                          style={{
                            width: '100%',
                            minHeight: '80px',
                            padding: '12px',
                            background: 'rgba(var(--surface-rgb), 0.8)',
                            border: '2px solid rgba(var(--accent-rgb), 0.3)',
                            borderRadius: '10px',
                            color: 'var(--text)',
                            fontSize: '0.95rem',
                            fontFamily: 'var(--font-ui)',
                            resize: 'vertical',
                            boxSizing: 'border-box'
                          }}
                        />
                      </div>

                      {/* Outcome Field */}
                      <div style={{marginBottom: '20px'}}>
                        <label style={{
                          display: 'block',
                          color: 'var(--text-muted)',
                          fontSize: '0.9rem',
                          marginBottom: '8px',
                          fontFamily: 'var(--font-ui)'
                        }}>
                          Outcome:
                        </label>
                        <textarea
                          value={project.outcome || ''}
                          onChange={(e) => updateProject(selectedProject.listName, selectedProject.id, { outcome: e.target.value })}
                          placeholder="What does success look like for this project?"
                          style={{
                            width: '100%',
                            minHeight: '80px',
                            padding: '12px',
                            background: 'rgba(var(--surface-rgb), 0.8)',
                            border: '2px solid rgba(var(--accent-rgb), 0.3)',
                            borderRadius: '10px',
                            color: 'var(--text)',
                            fontSize: '0.95rem',
                            fontFamily: 'var(--font-ui)',
                            resize: 'vertical',
                            boxSizing: 'border-box'
                          }}
                        />
                      </div>

                      {/* Project Dates */}
                      <div className="project-dates-section" style={{marginBottom: '20px'}}>
                        <div className="project-date-field">
                          <label className="project-date-label">Start Date:</label>
                          <InlineDatePicker
                            value={project.startDate || ''}
                            onChange={(v) => updateProject(selectedProject.listName, selectedProject.id, { startDate: v })}
                            style={{flex: 1, minWidth: 0}}
                          />
                        </div>
                        <div className="project-date-field">
                          <label className="project-date-label">End Date:</label>
                          <InlineDatePicker
                            value={project.endDate || ''}
                            onChange={(v) => updateProject(selectedProject.listName, selectedProject.id, { endDate: v })}
                            style={{flex: 1, minWidth: 0}}
                          />
                        </div>
                      </div>

                      {/* Before Photos */}
                      <div style={{
                        marginBottom: '20px',
                        padding: '20px',
                        background: 'rgba(var(--surface-rgb), 0.8)',
                        borderRadius: '15px',
                        border: '2px solid rgba(var(--accent-rgb), 0.3)'
                      }}>
                        <div style={{
                          fontFamily: 'var(--font-ui)',
                          fontSize: '1.3rem',
                          fontWeight: '700',
                          color: 'var(--text)',
                          marginBottom: '15px',
                          marginTop: 0,
                          paddingBottom: '10px',
                          borderBottom: '4px solid rgba(var(--accent-rgb), 0.3)'
                        }}>
                          Before Photos
                        </div>

                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px',
                          marginBottom: '10px'
                        }}>
                          <button
                            className="toolbar-btn"
                            onClick={() => {
                              const input = document.createElement('input');
                              input.type = 'file';
                              input.accept = 'image/*';
                              input.multiple = true;
                              input.onchange = (evt) => {
                                const files = Array.from(evt.target.files);
                                files.forEach(file => {
                                  if (file) {
                                    addPhotoToProject(selectedProject.listName, selectedProject.id, file, 'beforePhotos');
                                  }
                                });
                              };
                              input.click();
                            }}
                            style={{
                              padding: '6px 12px',
                              fontSize: '0.85rem',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px'
                            }}
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
                              <circle cx="12" cy="13" r="4"></circle>
                              <line x1="17" y1="3" x2="17" y2="6"></line>
                              <circle cx="17" cy="2" r="1"></circle>
                            </svg>
                            Add Photos
                          </button>
                        </div>
                        
                        {project.beforePhotos && project.beforePhotos.length > 0 && (
                          <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
                            gap: '10px'
                          }}>
                            {project.beforePhotos.map(photo => (
                              <div 
                                key={photo.id} 
                                style={{
                                  position: 'relative',
                                  borderRadius: '8px',
                                  overflow: 'hidden',
                                  border: '2px solid rgba(var(--accent-rgb), 0.3)',
                                  aspectRatio: '1',
                                }}
                              >
                                <img 
                                  src={photo.data} 
                                  alt="Before" 
                                  style={{
                                    width: '100%',
                                    height: '100%',
                                    objectFit: 'cover',
                                    display: 'block'
                                  }}
                                />
                                <button 
                                  aria-label="Remove photo"
                                  onClick={() => removePhotoFromProject(selectedProject.listName, selectedProject.id, photo.id, 'beforePhotos')}
                                  style={{
                                    position: 'absolute',
                                    top: '5px',
                                    right: '5px',
                                    background: 'rgba(0, 0, 0, 0.7)',
                                    color: '#fff',
                                    border: 'none',
                                    borderRadius: '50%',
                                    width: '24px',
                                    height: '24px',
                                    cursor: 'pointer',
                                    fontSize: '16px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    padding: 0,
                                    lineHeight: 1
                                  }}
                                >
                                  ×
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* After Photos */}
                      <div style={{
                        marginBottom: '20px',
                        padding: '20px',
                        background: 'rgba(var(--surface-rgb), 0.8)',
                        borderRadius: '15px',
                        border: '2px solid rgba(var(--accent-rgb), 0.3)'
                      }}>
                        <div style={{
                          fontFamily: 'var(--font-ui)',
                          fontSize: '1.3rem',
                          fontWeight: '700',
                          color: 'var(--text)',
                          marginBottom: '15px',
                          marginTop: 0,
                          paddingBottom: '10px',
                          borderBottom: '4px solid rgba(var(--accent-rgb), 0.3)'
                        }}>
                          After Photos
                        </div>

                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px',
                          marginBottom: '10px'
                        }}>
                          <button
                            className="toolbar-btn"
                            onClick={() => {
                              const input = document.createElement('input');
                              input.type = 'file';
                              input.accept = 'image/*';
                              input.multiple = true;
                              input.onchange = (evt) => {
                                const files = Array.from(evt.target.files);
                                files.forEach(file => {
                                  if (file) {
                                    addPhotoToProject(selectedProject.listName, selectedProject.id, file, 'afterPhotos');
                                  }
                                });
                              };
                              input.click();
                            }}
                            style={{
                              padding: '6px 12px',
                              fontSize: '0.85rem',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px'
                            }}
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
                              <circle cx="12" cy="13" r="4"></circle>
                              <line x1="17" y1="3" x2="17" y2="6"></line>
                              <circle cx="17" cy="2" r="1"></circle>
                            </svg>
                            Add Photos
                          </button>
                        </div>
                        
                        {project.afterPhotos && project.afterPhotos.length > 0 && (
                          <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
                            gap: '10px'
                          }}>
                            {project.afterPhotos.map(photo => (
                              <div 
                                key={photo.id} 
                                style={{
                                  position: 'relative',
                                  borderRadius: '8px',
                                  overflow: 'hidden',
                                  border: '2px solid rgba(var(--accent-rgb), 0.3)',
                                  aspectRatio: '1',
                                }}
                              >
                                <img 
                                  src={photo.data} 
                                  alt="After" 
                                  style={{
                                    width: '100%',
                                    height: '100%',
                                    objectFit: 'cover',
                                    display: 'block'
                                  }}
                                />
                                <button 
                                  aria-label="Remove photo"
                                  onClick={() => removePhotoFromProject(selectedProject.listName, selectedProject.id, photo.id, 'afterPhotos')}
                                  style={{
                                    position: 'absolute',
                                    top: '5px',
                                    right: '5px',
                                    background: 'rgba(0, 0, 0, 0.7)',
                                    color: '#fff',
                                    border: 'none',
                                    borderRadius: '50%',
                                    width: '24px',
                                    height: '24px',
                                    cursor: 'pointer',
                                    fontSize: '16px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    padding: 0,
                                    lineHeight: 1
                                  }}
                                >
                                  ×
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                      </div>

                      {/* Goal Assignment */}
                      <div style={{
                        marginBottom: '30px',
                        padding: '20px',
                        background: 'rgba(var(--surface-rgb), 0.8)',
                        borderRadius: '15px',
                        border: '2px solid rgba(var(--accent-rgb), 0.3)'
                      }}>
                        <div style={{
                          fontFamily: 'var(--font-ui)',
                          fontSize: '1.3rem',
                          fontWeight: '700',
                          color: 'var(--text)',
                          marginBottom: '15px',
                          marginTop: 0,
                          paddingBottom: '10px',
                          borderBottom: '4px solid rgba(var(--accent-rgb), 0.3)'
                        }}>
                          Goal
                        </div>
                        <div className="project-date-field" data-goal-dropdown style={{width: '100%', position: 'relative'}}>
                          <div
                            onClick={() => setGoalDropdownOpen(!goalDropdownOpen)}
                            style={{
                              // Tighter in portrait. This is one field in a
                              // stack of cards, and at the desktop size it read
                              // as the main thing on the screen rather than a
                              // setting on the project.
                              padding: isMobile ? '8px 10px' : '10px',
                              background: 'rgba(var(--surface-rgb), 1)',
                              border: '2px solid rgba(var(--accent-rgb), 0.3)',
                              borderRadius: '10px',
                              color: 'var(--text)',
                              fontSize: isMobile ? '0.85rem' : '0.95rem',
                              cursor: 'pointer',
                              flex: 1,
                              width: '100%',
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center'
                            }}
                          >
                            <span>{project.goalId ? (goals[selectedProject.listName] || []).find(g => g.id === project.goalId)?.name || 'No Goal' : 'No Goal'}</span>
                            <span style={{
                              transform: goalDropdownOpen ? 'rotate(360deg)' : 'rotate(180deg)',
                              transition: 'transform 0.3s ease',
                              fontSize: '0.9rem',
                              display: 'inline-block'
                            }}>▼</span>
                          </div>

                          {/* Goal Dropdown Options */}
                          {goalDropdownOpen && (
                            <div style={{
                              position: 'absolute',
                              top: '100%',
                              left: '0',
                              right: '0',
                              marginTop: '-8px',
                              background: 'rgba(var(--surface-rgb), 1)',
                              border: '2px solid rgba(var(--accent-rgb), 0.3)',
                              borderRadius: '10px',
                              overflow: 'hidden',
                              zIndex: 1000,
                              boxShadow: '0 8px 24px rgba(var(--shadow-rgb), 0.4)'
                            }}>
                              <div
                                onClick={() => {
                                  updateProject(selectedProject.listName, selectedProject.id, { goalId: null });
                                  setGoalDropdownOpen(false);
                                }}
                                style={{
                                  padding: '10px',
                                  color: 'var(--text)',
                                  fontSize: '0.95rem',
                                  cursor: 'pointer',
                                  background: !project.goalId ? 'rgba(var(--accent-rgb), 0.4)' : 'transparent',
                                  borderBottom: '1px solid rgba(var(--accent-rgb), 0.2)',
                                  transition: 'background 0.2s ease'
                                }}
                                onMouseOver={(e) => e.currentTarget.style.background = 'rgba(var(--accent-rgb), 0.3)'}
                                onMouseOut={(e) => e.currentTarget.style.background = !project.goalId ? 'rgba(var(--accent-rgb), 0.4)' : 'transparent'}
                              >
                                No Goal
                              </div>
                              {(goals[selectedProject.listName] || []).map((goal, idx) => (
                                <div
                                  key={goal.id}
                                  onClick={() => {
                                    updateProject(selectedProject.listName, selectedProject.id, { goalId: goal.id });
                                    setGoalDropdownOpen(false);
                                  }}
                                  style={{
                                    padding: '10px',
                                    color: 'var(--text)',
                                    fontSize: '0.95rem',
                                    cursor: 'pointer',
                                    background: project.goalId === goal.id ? 'rgba(var(--accent-rgb), 0.4)' : 'transparent',
                                    borderBottom: idx < (goals[selectedProject.listName]?.length - 1 || 0) ? '1px solid rgba(var(--accent-rgb), 0.2)' : 'none',
                                    transition: 'background 0.2s ease'
                                  }}
                                  onMouseOver={(e) => e.currentTarget.style.background = 'rgba(var(--accent-rgb), 0.3)'}
                                  onMouseOut={(e) => e.currentTarget.style.background = project.goalId === goal.id ? 'rgba(var(--accent-rgb), 0.4)' : 'transparent'}
                                >
                                  {goal.name}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Tasks Section */}
                      <div style={{
                        marginBottom: '30px',
                        padding: '20px',
                        background: 'rgba(var(--surface-rgb), 0.8)',
                        borderRadius: '15px',
                        border: '2px solid rgba(var(--accent-rgb), 0.3)'
                      }}>
                        <div style={{
                          fontFamily: 'var(--font-ui)',
                          fontSize: '1.3rem',
                          fontWeight: '700',
                          color: 'var(--text)',
                          marginBottom: '15px',
                          marginTop: 0,
                          paddingBottom: '10px',
                          borderBottom: '4px solid rgba(var(--accent-rgb), 0.3)'
                        }}>
                          Tasks
                        </div>

                      {/* Add Task to Project */}
                      <div className="project-task-input">
                        <div className="task-input-wrapper" style={{flexDirection: 'column', alignItems: 'stretch'}}>
                          <div style={{marginBottom: '15px'}}>
                            <input
                              type="text"
                              placeholder="Task"
                              value={projectTaskInput}
                              onChange={(e) => setProjectTaskInput(e.target.value)}
                              onKeyPress={(e) => {
                                if (e.key === 'Enter') addTaskToProject(selectedProject.id, projectTaskList);
                              }}
                              style={{width: '100%'}}
                            />
                          </div>
                          <div style={{display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '15px'}}>
                            <div data-task-list-dropdown style={{flex: 1, position: 'relative'}}>
                              <div
                                onClick={() => setTaskListDropdownOpen(!taskListDropdownOpen)}
                                style={{
                                  // Matched to the Goal dropdown above it, so
                                  // the two controls in this view are the same
                                  // size rather than one being noticeably
                                  // chunkier than the other.
                                  padding: isMobile ? '8px 10px' : '10px',
                                  background: 'rgba(var(--surface-rgb), 1)',
                                  border: '2px solid rgba(var(--accent-rgb), 0.3)',
                                  borderRadius: '10px',
                                  color: 'var(--text)',
                                  fontSize: isMobile ? '0.85rem' : '0.95rem',
                                  cursor: 'pointer',
                                  width: '100%',
                                  display: 'flex',
                                  justifyContent: 'space-between',
                                  alignItems: 'center',
                                  fontFamily: 'var(--font-body)'
                                }}
                              >
                                <span>{listLabel(projectTaskList)}</span>
                                <span style={{
                                  transform: taskListDropdownOpen ? 'rotate(360deg)' : 'rotate(180deg)',
                                  transition: 'transform 0.3s ease',
                                  fontSize: '0.9rem',
                                  display: 'inline-block'
                                }}>▼</span>
                              </div>

                              {/* Task List Dropdown Options */}
                              {taskListDropdownOpen && (
                                <div style={{
                                  position: 'absolute',
                                  top: '100%',
                                  left: '0',
                                  right: '0',
                                  marginTop: '-8px',
                                  background: 'rgba(var(--surface-rgb), 1)',
                                  border: '2px solid rgba(var(--accent-rgb), 0.3)',
                                  borderRadius: '10px',
                                  overflow: 'hidden',
                                  zIndex: 1000,
                                  boxShadow: '0 8px 24px rgba(var(--shadow-rgb), 0.4)'
                                }}>
                                  {visibleTaskLists.map((list, idx) => (
                                    <div
                                      key={list}
                                      onClick={() => {
                                        setProjectTaskList(list);
                                        setTaskListDropdownOpen(false);
                                      }}
                                      style={{
                                        padding: '10px',
                                        color: 'var(--text)',
                                        fontSize: '0.95rem',
                                        cursor: 'pointer',
                                        background: projectTaskList === list ? 'rgba(var(--accent-rgb), 0.4)' : 'transparent',
                                        borderBottom: idx < 4 ? '1px solid rgba(var(--accent-rgb), 0.2)' : 'none',
                                        transition: 'background 0.2s ease',
                                        textTransform: 'capitalize',
                                        fontFamily: 'var(--font-body)'
                                      }}
                                      onMouseOver={(e) => e.currentTarget.style.background = 'rgba(var(--accent-rgb), 0.3)'}
                                      onMouseOut={(e) => e.currentTarget.style.background = projectTaskList === list ? 'rgba(var(--accent-rgb), 0.4)' : 'transparent'}
                                    >
                                      {listLabel(list)}
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                          <div style={{display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '15px'}}>
                            <InlineDatePicker
                              value={projectTaskDueDate}
                              onChange={(v) => setProjectTaskDueDate(v)}
                              style={{width: isMobile ? '100%' : '50%'}}
                            />
                            <span 
                              className={`fire-flag-icon clickable ${projectTaskPriority === 'high' ? 'active' : ''}`}
                              onClick={() => setProjectTaskPriority(projectTaskPriority === 'high' ? 'low' : 'high')}
                              title={projectTaskPriority === 'high' ? 'Remove priority' : 'Mark as high priority'}
                            >
                              {projectTaskPriority === 'high' ? <LitFlame /> : <UnlitFlame />}
                            </span>
                          </div>
                        </div>
                        <div className="section-btn-group" style={{marginBottom: '15px', display: 'flex', gap: '20px'}}>
                          <button
                            className={`section-btn ${projectTaskSection === 'todo' ? 'selected' : ''}`}
                            onClick={() => setProjectTaskSection('todo')}
                          >
                            To Do
                          </button>
                          <button
                            className={`section-btn ${projectTaskSection === 'backlog' ? 'selected' : ''}`}
                            onClick={() => setProjectTaskSection('backlog')}
                          >
                            Backlog
                          </button>
                        </div>
                        <button 
                          className="add-task-btn" 
                          onClick={() => addTaskToProject(selectedProject.id, projectTaskList)}
                          style={{width: '100%', padding: '14px', fontSize: '0.9rem'}}
                        >
                          Add Task
                        </button>
                      </div>

                      {/* Task Sections - Only show if tasks exist */}
                      {tasks.length > 0 && (
                        <>
                          {/* To Do Section */}
                          <div className="list-section">
                            <div className="list-section-header">
                              <span>To Do</span>
                              <span className="badge work">{todoTasks.length}</span>
                            </div>
                            {todoTasks.length === 0 ? (
                              <div style={{display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '200px'}}>
                                <div style={{
                                  width: '120px',
                                  height: '120px',
                                  position: 'relative',
                                  display: 'inline-block'
                                }}>
                                  {/* Background circle */}
                                  <svg 
                                    style={{
                                      position: 'absolute',
                                      top: '-10px',
                                      left: '-10px',
                                      width: '140px',
                                      height: '140px',
                                      transform: 'rotate(-90deg)',
                                      pointerEvents: 'none'
                                    }}
                                  >
                                    <circle
                                      cx="70"
                                      cy="70"
                                      r="63"
                                      fill="none"
                                      stroke="rgba(var(--surface-alt-rgb), 0.3)"
                                      strokeWidth="6"
                                    />
                                  </svg>
                                  
                                  {/* Dark Fire Icon */}
                                  <svg version="1.0" xmlns="http://www.w3.org/2000/svg"
                                    viewBox="0 0 1280.000000 1280.000000"
                                    preserveAspectRatio="xMidYMid meet"
                                    style={{
                                      width: '100%',
                                      height: '100%',
                                      filter: 'drop-shadow(0 0 10px rgba(100, 100, 100, 0.3))'
                                    }}>
                                    <g transform="translate(0.000000,1280.000000) scale(0.100000,-0.100000)"
                                      fill="#000000" stroke="none">
                                      <path d="M7090 12669 c-1 -257 -76 -628 -175 -871 -149 -365 -354 -643 -825
                      -1123 -562 -572 -1053 -1165 -1415 -1710 -256 -385 -443 -729 -568 -1045 -164
                      -415 -213 -716 -189 -1167 7 -126 17 -257 22 -293 4 -36 11 -87 15 -115 3 -27
                      17 -108 31 -180 66 -339 167 -634 321 -937 181 -358 383 -630 707 -954 206
                      -206 336 -319 558 -486 130 -98 458 -322 462 -316 1 1 20 53 40 113 45 131
                      132 315 211 452 58 99 233 361 296 443 231 303 515 606 864 926 411 375 725
                      680 839 814 99 117 243 309 323 432 261 403 385 922 386 1623 0 207 -4 314
                      -17 410 -76 586 -230 1136 -500 1782 -358 860 -885 1741 -1298 2168 l-87 90
                      -1 -56z"/>
                      <path d="M9510 9493 c0 -5 9 -55 21 -113 89 -462 132 -1021 110 -1453 -13
                      -249 -39 -482 -67 -597 -109 -438 -605 -1140 -1299 -1835 -126 -127 -291 -284
                      -365 -350 -160 -142 -223 -206 -374 -380 -276 -318 -452 -600 -476 -761 -5
                      -38 -19 -133 -31 -211 -21 -141 -21 -189 2 -261 8 -25 15 -32 28 -26 73 31
                      289 101 416 134 203 54 418 97 820 164 894 149 1116 222 1550 511 387 257 676
                      553 814 833 98 197 195 572 233 892 19 165 16 597 -5 780 -104 913 -509 1833
                      -1058 2404 -105 109 -294 276 -312 276 -4 0 -7 -3 -7 -7z"/>
                      <path d="M3355 8046 c-199 -134 -336 -247 -523 -430 -189 -186 -290 -306 -418
                      -498 -270 -403 -415 -856 -401 -1261 8 -258 75 -514 202 -772 237 -481 641
                      -873 1170 -1135 358 -177 715 -283 1170 -349 153 -22 511 -54 546 -49 16 2
                      -12 23 -107 82 -709 437 -1164 850 -1434 1303 -118 197 -228 493 -244 653 -4
                      36 -11 92 -16 125 -5 33 -16 116 -25 185 -8 69 -20 163 -26 210 -6 47 -13 196
                      -16 332 -5 240 4 411 38 673 5 44 12 98 15 120 3 22 9 65 14 95 5 30 12 73 16
                      95 26 174 135 576 188 698 5 9 4 17 0 17 -5 0 -72 -43 -149 -94z"/>
                    </g>
                                  </svg>
                                </div>
                              </div>
                            ) : (
                              todoTasks.map((task) => (
                                <Task
                                  key={task.id}
                                  task={task}
                                  listName={task.listName}
                                  showMoveButtons={true}
                                />
                              ))
                            )}
                          </div>

                          {/* Backlog Section */}
                          <div className="list-section">
                            <div className="list-section-header">
                              <span className="section-icon logs-icon"><CutLog /></span>
                              <span>Backlog</span>
                              <span className="badge personal">{backlogTasks.length}</span>
                            </div>
                            {backlogTasks.length === 0 ? (
                              <div style={{display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '200px'}}>
                                <div style={{
                                  width: '120px',
                                  height: '120px',
                                  position: 'relative',
                                  display: 'inline-block'
                                }}>
                                  {/* Background circle */}
                                  <svg 
                                    style={{
                                      position: 'absolute',
                                      top: '-10px',
                                      left: '-10px',
                                      width: '140px',
                                      height: '140px',
                                      transform: 'rotate(-90deg)',
                                      pointerEvents: 'none'
                                    }}
                                  >
                                    <circle
                                      cx="70"
                                      cy="70"
                                      r="63"
                                      fill="none"
                                      stroke="rgba(var(--surface-alt-rgb), 0.3)"
                                      strokeWidth="6"
                                    />
                                  </svg>
                                  
                                  {/* Dark Fire Icon */}
                                  <svg version="1.0" xmlns="http://www.w3.org/2000/svg"
                                    viewBox="0 0 1280.000000 1280.000000"
                                    preserveAspectRatio="xMidYMid meet"
                                    style={{
                                      width: '100%',
                                      height: '100%',
                                      filter: 'drop-shadow(0 0 10px rgba(100, 100, 100, 0.3))'
                                    }}>
                                    <g transform="translate(0.000000,1280.000000) scale(0.100000,-0.100000)"
                                      fill="#3a3a4a" stroke="none">
                                      <path d="M7090 12669 c-1 -257 -76 -628 -175 -871 -149 -365 -354 -643 -825
                      -1123 -562 -572 -1053 -1165 -1415 -1710 -256 -385 -443 -729 -568 -1045 -164
                      -415 -213 -716 -189 -1167 7 -126 17 -257 22 -293 4 -36 11 -87 15 -115 3 -27
                      17 -108 31 -180 66 -339 167 -634 321 -937 181 -358 383 -630 707 -954 206
                      -206 336 -319 558 -486 130 -98 458 -322 462 -316 1 1 20 53 40 113 45 131
                      132 315 211 452 58 99 233 361 296 443 231 303 515 606 864 926 411 375 725
                      680 839 814 99 117 243 309 323 432 261 403 385 922 386 1623 0 207 -4 314
                      -17 410 -76 586 -230 1136 -500 1782 -358 860 -885 1741 -1298 2168 l-87 90
                      -1 -56z"/>
                    </g>
                                  </svg>
                                </div>
                              </div>
                            ) : (
                              backlogTasks.map((task) => (
                                <Task
                                  key={task.id}
                                  task={task}
                                  listName={task.listName}
                                  showMoveButtons={true}
                                />
                              ))
                            )}
                          </div>

                          {/* Complete Section */}
                          <div className="list-section">
                            <div 
                              className="list-section-header"
                              onClick={() => setShowProjectCompletedTasks(!showProjectCompletedTasks)}
                              style={{cursor: 'pointer'}}
                            >
                              <span className="section-icon checkbox-icon"><CheckedBox /></span>
                              <span>Complete</span>
                              <span className="badge home">{completedTasks.length}</span>
                            </div>
                            {showProjectCompletedTasks && (
                              <>
                                {completedTasks.length === 0 ? (
                                  <div style={{display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '200px'}}>
                                    <div style={{
                                      width: '120px',
                                      height: '120px',
                                      position: 'relative',
                                      display: 'inline-block'
                                    }}>
                                      {/* Background circle */}
                                      <svg 
                                        style={{
                                          position: 'absolute',
                                          top: '-10px',
                                          left: '-10px',
                                          width: '140px',
                                          height: '140px',
                                          transform: 'rotate(-90deg)',
                                          pointerEvents: 'none'
                                        }}
                                      >
                                        <circle
                                          cx="70"
                                          cy="70"
                                          r="63"
                                          fill="none"
                                          stroke="rgba(var(--surface-alt-rgb), 0.3)"
                                          strokeWidth="6"
                                        />
                                      </svg>
                                      
                                      {/* Dark Fire Icon */}
                                      <svg version="1.0" xmlns="http://www.w3.org/2000/svg"
                                        viewBox="0 0 1280.000000 1280.000000"
                                        preserveAspectRatio="xMidYMid meet"
                                        style={{
                                          width: '100%',
                                          height: '100%',
                                          filter: 'drop-shadow(0 0 10px rgba(100, 100, 100, 0.3))'
                                        }}>
                                        <g transform="translate(0.000000,1280.000000) scale(0.100000,-0.100000)"
                                          fill="#3a3a4a" stroke="none">
                                          <path d="M7090 12669 c-1 -257 -76 -628 -175 -871 -149 -365 -354 -643 -825
                                          -1123 -562 -572 -1053 -1165 -1415 -1710 -256 -385 -443 -729 -568 -1045 -164
                                          -415 -213 -716 -189 -1167 7 -126 17 -257 22 -293 4 -36 11 -87 15 -115 3 -27
                                          17 -108 31 -180 66 -339 167 -634 321 -937 181 -358 383 -630 707 -954 206
                                          -206 336 -319 558 -486 130 -98 458 -322 462 -316 1 1 20 53 40 113 45 131
                                          132 315 211 452 58 99 233 361 296 443 231 303 515 606 864 926 411 375 725
                                          680 839 814 99 117 243 309 323 432 261 403 385 922 386 1623 0 207 -4 314
                                          -17 410 -76 586 -230 1136 -500 1782 -358 860 -885 1741 -1298 2168 l-87 90
                                          0 -151z"/>
                                        </g>
                                      </svg>
                                    </div>
                                  </div>
                                ) : (
                                  completedTasks.map((task) => (
                                    <Task
                                      key={task.id}
                                      task={task}
                                      listName={task.listName}
                                          showMoveButtons={true}
                                    />
                                  ))
                                )}
                              </>
                            )}
                          </div>
                        </>
                      )}
                      </div>

                      {/* Project Actions */}
                      <div className="project-actions" style={{display: 'flex', justifyContent: 'space-between', width: '100%'}}>
                        <button 
                          className="archive-btn"
                          onClick={() => {
                            archiveProject(selectedProject.listName, selectedProject.id);
                            setSelectedProject(null);
                          }}
                          style={{
                            padding: '10px 20px',
                            background: 'rgba(var(--accent-rgb), 0.2)',
                            border: '2px solid rgba(var(--accent-rgb), 0.4)',
                            borderRadius: '8px',
                            color: 'var(--accent)',
                            fontSize: '0.9rem',
                            fontWeight: '600',
                            fontFamily: 'var(--font-ui)',
                            cursor: 'pointer'
                          }}
                        >
                          Archive
                        </button>
                        <button 
                          className="delete-project-btn"
                          onClick={() => {
                            setProjectToDelete({
                              id: selectedProject.id,
                              listName: selectedProject.listName,
                              name: project.name
                            });
                          }}
                        >
                          Delete
                        </button>
                      </div>
                      </div>
                    </div>
                  );
                })()}
              </>
            )}

            {/* Project Delete Confirmation Modal */}
            {projectToDelete && (
              <div className="modal-overlay" onClick={() => setProjectToDelete(null)}>
                <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                  <h3>Delete Project?</h3>
                  <p style={{color: 'var(--text-muted)', marginBottom: '20px', textAlign: 'center'}}>
                    "{projectToDelete.name}"
                  </p>
                  <div className="modal-actions" style={{justifyContent: 'center'}}>
                    <button 
                      className="delete-btn" 
                      onClick={() => {
                        deleteProject(projectToDelete.listName, projectToDelete.id);
                        setProjectToDelete(null);
                      }}
                    >
                      Delete
                    </button>
                    <button 
                      className="edit-btn" 
                      onClick={() => setProjectToDelete(null)}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {appMode === 'calendar' && (
          <div className="calendar-section">
            <div className="calendar-header">
              <button className="month-nav-btn" aria-label="Previous month" onClick={() => navigateMonth(-1)}>←</button>
              <h2>
                {new Date(currentYear, currentMonth).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </h2>
              <button className="month-nav-btn" aria-label="Next month" onClick={() => navigateMonth(1)}>→</button>
            </div>

            <div className="calendar-controls">
              {isFeatureOn('projects') && (
                <label className="calendar-checkbox">
                  <input
                    type="checkbox"
                    checked={showProjects}
                    onChange={(e) => setShowProjects(e.target.checked)}
                  />
                  <span>Projects</span>
                </label>
              )}
              {isFeatureOn('notes') && (
                <label className="calendar-checkbox">
                  <input
                    type="checkbox"
                    checked={showNotes}
                    onChange={(e) => setShowNotes(e.target.checked)}
                  />
                  <span>Notes</span>
                </label>
              )}
              <label className="calendar-checkbox">
                <input
                  type="checkbox"
                  checked={showOpenTasks}
                  onChange={(e) => setShowOpenTasks(e.target.checked)}
                />
                <span>Tasks</span>
              </label>
              <label className="calendar-checkbox">
                <input
                  type="checkbox"
                  checked={showCompletedTasks}
                  onChange={(e) => setShowCompletedTasks(e.target.checked)}
                />
                <span>Completed Tasks</span>
              </label>
            </div>

            <div className="calendar-container">
              {/* Project timelines overlay */}
              {showProjects && (
                <div className="project-timelines">
                  {getActiveProjectsForMonth(currentMonth, currentYear).map((project, idx) => {
                    const firstDayOffset = getFirstDayOfMonth(currentMonth, currentYear);
                    const daysInMonth = getDaysInMonth(currentMonth, currentYear);
                    const monthStart = new Date(currentYear, currentMonth, 1);
                    const monthEnd = new Date(currentYear, currentMonth, daysInMonth);
                    
                    // Calculate start position
                    let startDay = 1;
                    if (project.startDate > monthStart) {
                      startDay = project.startDate.getDate();
                    }
                    
                    // Calculate end position
                    let endDay = daysInMonth;
                    if (project.endDate < monthEnd) {
                      endDay = project.endDate.getDate();
                    }
                    
                    // Calculate grid position
                    const startCol = (startDay - 1 + firstDayOffset) % 7 + 1;
                    const endCol = (endDay - 1 + firstDayOffset) % 7 + 1;
                    const startRow = Math.floor((startDay - 1 + firstDayOffset) / 7) + 2; // +2 for header row
                    const endRow = Math.floor((endDay - 1 + firstDayOffset) / 7) + 2;
                    
                    const colors = Object.fromEntries(TASK_LISTS.map(k => [k, listColor(k)]));
                    
                    // If project spans multiple weeks, create multiple segments
                    const segments = [];
                    for (let row = startRow; row <= endRow; row++) {
                      const segmentStartCol = row === startRow ? startCol : 1;
                      const segmentEndCol = row === endRow ? endCol : 7;
                      const span = segmentEndCol - segmentStartCol + 1;
                      
                      segments.push({
                        row,
                        startCol: segmentStartCol,
                        span
                      });
                    }
                    
                    return segments.map((segment, segIdx) => (
                      <div
                        key={`${project.id}-${segIdx}`}
                        className="project-timeline-bar"
                        style={{
                          gridRow: segment.row,
                          gridColumn: `${segment.startCol} / span ${segment.span}`,
                          background: `linear-gradient(90deg, ${colors[project.listName]}dd, ${colors[project.listName]}99)`,
                          borderLeft: segment.startCol === startCol && segment.row === startRow ? '3px solid ' + colors[project.listName] : 'none',
                          borderRight: segment.startCol + segment.span - 1 === endCol && segment.row === endRow ? '3px solid ' + colors[project.listName] : 'none'
                        }}
                        title={project.name}
                      >
                        {segment.row === startRow && segment.startCol === startCol && (
                          <span className="project-timeline-label">{project.name}</span>
                        )}
                      </div>
                    ));
                  })}
                </div>
              )}
              
              <div className="calendar-grid">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="calendar-day-header">{day}</div>
              ))}
              
              {Array.from({ length: getFirstDayOfMonth(currentMonth, currentYear) }).map((_, i) => (
                <div key={`empty-${i}`} className="calendar-day empty"></div>
              ))}
              
              {Array.from({ length: getDaysInMonth(currentMonth, currentYear) }).map((_, i) => {
                const dayNum = i + 1;
                const date = new Date(currentYear, currentMonth, dayNum);
                const items = getItemsForDate(date);
                const isToday = isSameDate(date, new Date());
                const isSelected = selectedDay && isSameDate(date, new Date(currentYear, currentMonth, selectedDay));
                
                return (
                  <div
                    key={dayNum}
                    className={`calendar-day ${isToday ? 'today' : ''} ${isSelected ? 'selected' : ''} ${items.length > 0 ? 'has-items' : ''}`}
                    onClick={() => setSelectedDay(selectedDay === dayNum ? null : dayNum)}
                  >
                    <div className="day-number">{dayNum}</div>
                    {items.length > 0 && (
                      <div className="day-indicators">
                        {items.filter(item => item.type === 'task').length > 0 && (
                          <span className="indicator task-indicator" title={`${items.filter(item => item.type === 'task').length} task(s)`}>
                            ●
                          </span>
                        )}
                        {items.filter(item => item.type === 'note').length > 0 && (
                          <span className="indicator note-indicator" title={`${items.filter(item => item.type === 'note').length} note(s)`}>
                            ●
                          </span>
                        )}
                        {items.filter(item => item.type === 'project').length > 0 && (
                          <span className="indicator project-indicator" title={`${items.filter(item => item.type === 'project').length} project(s)`}>
                            ●
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            </div>

            {selectedDay && (
              <div className="day-details">
                <h3>
                  {new Date(currentYear, currentMonth, selectedDay).toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    month: 'long', 
                    day: 'numeric',
                    year: 'numeric'
                  })}
                </h3>
                {(() => {
                  const items = getItemsForDate(new Date(currentYear, currentMonth, selectedDay));
                  if (items.length === 0) {
                    return <p style={{color: '#999', textAlign: 'center', padding: '20px'}}>No items for this day</p>;
                  }
                  
                  const tasks = items.filter(item => item.type === 'task');
                  const notes = items.filter(item => item.type === 'note');
                  const projectItems = items.filter(item => item.type === 'project');
                  
                  return (
                    <div className="day-items">
                      {tasks.length > 0 && (
                        <div className="day-section">
                          <h4
                            className="day-section-toggle"
                            onClick={() => toggleCalendarSection('tasks')}
                          >
                            <span>Tasks</span>
                            <span className="day-section-count">{tasks.length}</span>
                          </h4>
                          {!isCalendarSectionCollapsed('tasks') && (<>
                          {/* Grouped by list, in the order set in Settings, so this
                              reads like All Tasks. Driven off orderedTaskLists rather
                              than the order tasks happen to arrive in, and filtered to
                              lists that actually have something on this day so empty
                              headers never appear. Not grouped by status within a list
                              - a single day rarely has enough to need it. */}
                          {orderedTaskLists
                            .filter(listName => tasks.some(t => t.list === listName))
                            .map(listName => {
                          const listTasks = tasks.filter(t => t.list === listName);
                          return (
                            <div key={listName} className="day-list-group">
                              <div
                                className="list-section-header day-list-header day-section-toggle"
                                onClick={() => toggleCalendarSection(`list-${listName}`)}
                              >
                                <span>{listLabel(listName)}</span>
                                <span className={`badge ${listName}`}>{listTasks.length}</span>
                              </div>
                          {!isCalendarSectionCollapsed(`list-${listName}`) &&
                            groupTasksByStatus(listTasks, it => it.data).map(statusGroup => (
                            <div key={statusGroup.key} className={`day-status-group status-${statusGroup.key}`}>
                              <div className="day-status-header">
                                <span>{statusGroup.label}</span>
                                <span className="day-status-count">{statusGroup.items.length}</span>
                              </div>
                              {statusGroup.items.map((item, idx) => {
                            const project = item.data.projectId 
                              ? getAllProjects().find(p => p.id == item.data.projectId)
                              : null;
                            
                            const taskId = `calendar-${item.list}-${item.data.id}`;
                            const isExpanded = expandedCalendarTaskId === taskId;
                            
                            return (
                              <div 
                                key={taskId} 
                                className={`calendar-item task-item ${isExpanded ? 'expanded' : ''}`}
                                onClick={() => setExpandedCalendarTaskId(isExpanded ? null : taskId)}
                                style={{cursor: 'pointer'}}
                              >
                                {/* The list badge and the Completed badge are gone: the
                                    row now sits under a list heading and a status
                                    heading that say the same thing. Project and
                                    priority stay - neither is implied by where the row
                                    sits - and the header is dropped entirely when it
                                    would otherwise be an empty box above the text. */}
                                {(project || item.data.priority === 'high') && (
                                  <div className="item-header">
                                    {project && (
                                      <span className="project-badge">
                                        {project.name}
                                      </span>
                                    )}
                                    {item.data.priority === 'high' && <span className="priority-badge"><FlameIcon /></span>}
                                  </div>
                                )}
                                <div className="item-text">
                                  <span className="task-dot">●</span> {item.data.text}
                                </div>
                                
                                {isExpanded && (
                                  <div className="calendar-task-details" onClick={(e) => e.stopPropagation()}>
                                    {item.data.details && (
                                      <div className="task-detail-section">
                                        <div className="details-label">Details:</div>
                                        <div className="task-details-text" dangerouslySetInnerHTML={{ __html: sanitizeRichText(item.data.details) }} />
                                      </div>
                                    )}
                                    {item.data.dueDate && (
                                      <div className="task-detail-section">
                                        <span className="details-label">Due:</span>
                                        <span className="date-field-value">
                                          {parseLocalDate(item.data.dueDate)?.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                        </span>
                                      </div>
                                    )}
                                    {item.data.createdAt && (
                                      <div className="task-detail-section">
                                        <span className="details-label">Created:</span>
                                        <span className="date-field-value">
                                          {new Date(item.data.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                        </span>
                                      </div>
                                    )}
                                    {item.data.completedAt && (
                                      <div className="task-detail-section">
                                        <span className="details-label">Completed:</span>
                                        <span className="date-field-value">
                                          {new Date(item.data.completedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                        </span>
                                      </div>
                                    )}
                                    <button
                                      className="go-to-btn"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        const taskIndex = allLists[item.list]?.findIndex(t => t.id === item.data.id);
                                        if (taskIndex !== -1) {
                                          setAppMode('tasks');
                                          setCurrentList(item.list);
                                          setSelectedDay(null);
                                          setTimeout(() => {
                                            setExpandedTaskId(`${item.list}-${item.data.id}`);
                                          }, 100);
                                        }
                                      }}
                                    >
                                      Go to Task →
                                    </button>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                            </div>
                          ))}
                            </div>
                          );
                          })}
                          </>)}
                        </div>
                      )}
                      
                      {notes.length > 0 && (
                        <div className="day-section">
                          <h4
                            className="day-section-toggle"
                            onClick={() => toggleCalendarSection('notes')}
                          >
                            <span>Notes</span>
                            <span className="day-section-count">{notes.length}</span>
                          </h4>
                          {!isCalendarSectionCollapsed('notes') && (<>
                          {notes.map((item, idx) => {
                            const noteId = `calendar-note-${item.data.id}`;
                            const isExpanded = expandedCalendarNoteId === noteId;
                            
                            return (
                              <div 
                                key={idx} 
                                className={`calendar-item note-item ${isExpanded ? 'expanded' : ''}`}
                                onClick={() => setExpandedCalendarNoteId(isExpanded ? null : noteId)}
                                style={{cursor: 'pointer'}}
                              >
                                <div 
                                  className="item-preview"
                                  dangerouslySetInnerHTML={{
                                    // Sanitise first, then truncate. Truncating
                                    // raw HTML can also cut a tag in half and
                                    // leave the markup unbalanced.
                                    __html: sanitizeRichText(item.data.content || 'Empty note')
                                      .substring(0, isExpanded ? undefined : 150) + (isExpanded ? '' : '...')
                                  }}
                                />
                                {item.data.tags && item.data.tags.length > 0 && (
                                  <div className="item-tags">
                                    {item.data.tags.map(tag => (
                                      <span key={tag} className="mini-tag">{tag}</span>
                                    ))}
                                  </div>
                                )}
                                {isExpanded && (
                                  <div className="calendar-note-details" onClick={(e) => e.stopPropagation()}>
                                    <div className="note-meta-info">
                                      <span className="details-label">Written:</span>
                                      <span className="date-field-value">
                                        {new Date(item.data.date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                                      </span>
                                    </div>
                                    {item.data.images && item.data.images.length > 0 && (
                                      <div className="note-meta-info">
                                        <span className="details-label"><ImageIcon /> {item.data.images.length} image{item.data.images.length > 1 ? 's' : ''}</span>
                                      </div>
                                    )}
                                    <button
                                      className="go-to-btn"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setAppMode('notes');
                                        setSelectedDay(null);
                                        setTimeout(() => {
                                          const noteElement = document.querySelector(`[data-note-id="${item.data.id}"]`);
                                          if (noteElement) {
                                            noteElement.scrollIntoView({
                                              behavior: prefersReducedMotion() ? 'auto' : 'smooth',
                                              block: 'center'
                                            });
                                            // Expand the note
                                            const currentNote = notes.find(n => n.id === item.data.id);
                                            if (currentNote && !currentNote.expanded) {
                                              toggleNoteExpanded(item.data.id);
                                            }
                                          }
                                        }, 100);
                                      }}
                                    >
                                      Go to Note →
                                    </button>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                          </>)}
                        </div>
                      )}
                      
                      {projectItems.length > 0 && (
                        <div className="day-section">
                          <h4
                            className="day-section-toggle"
                            onClick={() => toggleCalendarSection('projects')}
                          >
                            <span>Projects</span>
                            <span className="day-section-count">{projectItems.length}</span>
                          </h4>
                          {!isCalendarSectionCollapsed('projects') && (<>
                          {projectItems.map((item, idx) => {
                            const projectId = `calendar-project-${item.data.id}`;
                            const isExpanded = expandedCalendarProjectId === projectId;
                            
                            return (
                              <div 
                                key={idx} 
                                className={`calendar-item project-item ${isExpanded ? 'expanded' : ''}`}
                                onClick={() => setExpandedCalendarProjectId(isExpanded ? null : projectId)}
                                style={{cursor: 'pointer'}}
                              >
                                <div className="item-header">
                                  <span className={`list-badge ${item.list}`}>{item.list}</span>
                                  <span className="project-date-badge">
                                    {item.dateType === 'start' && 'Start'}
                                    {item.dateType === 'end' && 'End'}
                                    {item.dateType === 'both' && 'Start & End'}
                                  </span>
                                </div>
                                <div className="item-text">
                                  {item.data.name}
                                </div>
                                {item.data.description && (
                                  <div className="project-description-preview">
                                    {item.data.description}
                                  </div>
                                )}
                                {isExpanded && (
                                  <div className="calendar-project-details" onClick={(e) => e.stopPropagation()}>
                                    <div className="project-dates-display">
                                      {item.data.startDate && (
                                        <span className="project-date-info">
                                          Start: {parseLocalDate(item.data.startDate)?.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                        </span>
                                      )}
                                      {item.data.endDate && (
                                        <span className="project-date-info">
                                          End: {parseLocalDate(item.data.endDate)?.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                        </span>
                                      )}
                                    </div>
                                    {(() => {
                                      const projectTasks = getProjectTasks(item.data.id);
                                      const totalTasks = projectTasks.length;
                                      const completedTasks = projectTasks.filter(t => t.completed).length;
                                      
                                      return totalTasks > 0 && (
                                        <div className="project-task-summary">
                                          <span className="details-label">Tasks:</span>
                                          <span className="date-field-value">
                                            {completedTasks}/{totalTasks} completed
                                          </span>
                                        </div>
                                      );
                                    })()}
                                    <button
                                      className="go-to-btn"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setAppMode('projects');
                                        setCurrentProjectList(item.list);
                                        setSelectedProject({ id: item.data.id, listName: item.list });
                                        setSelectedDay(null);
                                      }}
                                    >
                                      Go to Project →
                                    </button>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                          </>)}
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>
            )}
          </div>
        )}

        {appMode === 'goals' && (
          <div className="goals-section">
            
            <div className="tabs-container">
              <button
                className={`tab master-tab ${currentGoalList === 'master' ? 'active' : ''}`}
                onClick={() => {
                  setCurrentGoalList('master');
                  setSelectedGoal(null);
                }}
              >
                All Goals
              </button>
            </div>

            <div className="tabs">
              <button
                className={`tab ${currentGoalList === 'personal' ? 'active' : ''}`}
                onClick={() => {
                  setCurrentGoalList('personal');
                  setSelectedGoal(null);
                }}
              >
                Personal
              </button>
              <button
                className={`tab ${currentGoalList === 'work' ? 'active' : ''}`}
                onClick={() => {
                  setCurrentGoalList('work');
                  setSelectedGoal(null);
                }}
              >
                Work
              </button>
              <button
                className={`tab ${currentGoalList === 'home' ? 'active' : ''}`}
                onClick={() => {
                  setCurrentGoalList('home');
                  setSelectedGoal(null);
                }}
              >
                Home
              </button>
              <button
                className={`tab ${currentGoalList === 'travel' ? 'active' : ''}`}
                onClick={() => {
                  setCurrentGoalList('travel');
                  setSelectedGoal(null);
                }}
              >
                Travel
              </button>
              <button
                className={`tab ${currentGoalList === 'kids' ? 'active' : ''}`}
                onClick={() => {
                  setCurrentGoalList('kids');
                  setSelectedGoal(null);
                }}
              >
                Kids
              </button>
            </div>

            {currentGoalList !== 'master' && (
              <button 
                className="add-task-btn" 
                style={{marginTop: '20px', marginBottom: '20px', width: '70%', display: 'block', margin: '20px auto'}}
                onClick={() => {
                  setShowGoalForm(true);
                  setEditingGoal(null);
                  setGoalFormData({ name: '', description: '', startDate: '', endDate: '' });
                }}
              >
                New Goal
              </button>
            )}

            {!selectedGoal ? (
              <>
                {/* Goals List View */}
                <div className="goals-container">
                  {getCurrentGoals().length === 0 ? (
                    <div className="empty-state" style={{display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '300px'}}>
                      <div style={{
                        width: '180px',
                        height: '180px',
                        position: 'relative',
                        display: 'inline-block'
                      }}>
                        {/* Background circle */}
                        <svg 
                          style={{
                            position: 'absolute',
                            top: '-15px',
                            left: '-15px',
                            width: '210px',
                            height: '210px',
                            transform: 'rotate(-90deg)',
                            pointerEvents: 'none'
                          }}
                        >
                          <circle
                            cx="105"
                            cy="105"
                            r="95"
                            fill="none"
                            stroke="rgba(var(--surface-alt-rgb), 0.3)"
                            strokeWidth="8"
                          />
                        </svg>
                        
                        {/* Dark Fire Icon */}
                        <svg version="1.0" xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 1280.000000 1280.000000"
                          preserveAspectRatio="xMidYMid meet"
                          style={{
                            width: '100%',
                            height: '100%',
                            filter: 'drop-shadow(0 0 10px rgba(100, 100, 100, 0.3))'
                          }}>
                          <g transform="translate(0.000000,1280.000000) scale(0.100000,-0.100000)"
                            fill="#3a3a4a" stroke="none">
                            <path d="M7090 12669 c-1 -257 -76 -628 -175 -871 -149 -365 -354 -643 -825
                            -1123 -562 -572 -1053 -1165 -1415 -1710 -256 -385 -443 -729 -568 -1045 -164
                            -415 -213 -716 -189 -1167 7 -126 17 -257 22 -293 4 -36 11 -87 15 -115 3 -27
                            17 -108 31 -180 66 -339 167 -634 321 -937 181 -358 383 -630 707 -954 206
                            -206 336 -319 558 -486 130 -98 458 -322 462 -316 1 1 20 53 40 113 45 131
                            132 315 211 452 58 99 233 361 296 443 231 303 515 606 864 926 411 375 725
                            680 839 814 99 117 243 309 323 432 261 403 385 922 386 1623 0 207 -4 314
                            -17 410 -76 586 -230 1136 -500 1782 -358 860 -885 1741 -1298 2168 l-87 90
                            -1 -56z"/>
                            <path d="M9510 9493 c0 -5 9 -55 21 -113 89 -462 132 -1021 110 -1453 -13
                            -249 -39 -482 -67 -597 -109 -438 -605 -1140 -1299 -1835 -126 -127 -291 -284
                            -365 -350 -160 -142 -223 -206 -374 -380 -276 -318 -452 -600 -476 -761 -5
                            -38 -19 -133 -31 -211 -21 -141 -21 -189 2 -261 8 -25 15 -32 28 -26 73 31
                            289 101 416 134 203 54 418 97 820 164 894 149 1116 222 1550 511 387 257 676
                            553 814 833 98 197 195 572 233 892 19 165 16 597 -5 780 -104 913 -509 1833
                            -1058 2404 -105 109 -294 276 -312 276 -4 0 -7 -3 -7 -7z"/>
                            <path d="M3355 8046 c-199 -134 -336 -247 -523 -430 -189 -186 -290 -306 -418
                            -498 -270 -403 -415 -856 -401 -1261 8 -258 75 -514 202 -772 237 -481 641
                            -873 1170 -1135 358 -177 715 -283 1170 -349 153 -22 511 -54 546 -49 16 2
                            -12 23 -107 82 -709 437 -1164 850 -1434 1303 -118 197 -228 493 -244 653 -4
                            36 -11 92 -16 125 -5 33 -16 116 -25 185 -8 69 -20 163 -26 210 -6 47 -13 196
                            -16 332 -5 240 4 411 38 673 5 44 12 98 15 120 3 22 9 65 14 95 5 30 12 73 16
                            95 26 174 135 576 188 698 5 9 4 17 0 17 -5 0 -72 -43 -149 -94z"/>
                          </g>
                        </svg>
                      </div>
                    </div>
                  ) : currentGoalList === 'master' ? (
                    // Master view - group by list
                    (() => {
                      const showStates = {
                        personal: showPersonalGoals,
                        work: showWorkGoals,
                        home: showHomeGoals,
                        travel: showTravelGoals,
                        kids: showKidsGoals
                      };
                      
                      const toggleStates = {
                        personal: setShowPersonalGoals,
                        work: setShowWorkGoals,
                        home: setShowHomeGoals,
                        travel: setShowTravelGoals,
                        kids: setShowKidsGoals
                      };
                      
                      return ['personal', 'work', 'home', 'travel', 'kids'].map(listName => {
                        const listGoals = goals[listName] || [];
                        if (listGoals.length === 0) return null;
                        
                        return (
                          <div key={listName} className="list-section">
                            <div 
                              className="list-section-header"
                              onClick={() => toggleStates[listName](!showStates[listName])}
                              style={{cursor: 'pointer'}}
                            >
                              <span style={{textTransform: 'capitalize'}}>{listName} Goals</span>
                              <span className={`badge ${listName}`}>{listGoals.length}</span>
                            </div>
                            {showStates[listName] && (
                              <>
                                {listGoals.map((goal, index) => {
                                  const goalProjects = Object.values(projects).flat().filter(p => p.goalId == goal.id);
                                  const isDragging = draggedGoal?.id === goal.id;
                                  const isDragOver = dragOverGoal?.id === goal.id;
                                  
                                  return (
                                    <div 
                                      key={goal.id} 
                                      className="goal-card"
                                      draggable={true}
                                      onDragStart={(e) => {
                                        setDraggedGoal({ ...goal, index, listName });
                                        e.dataTransfer.effectAllowed = 'move';
                                      }}
                                      onDragEnd={() => {
                                        setDraggedGoal(null);
                                        setDragOverGoal(null);
                                      }}
                                      onDragOver={(e) => {
                                        e.preventDefault();
                                        e.dataTransfer.dropEffect = 'move';
                                        if (draggedGoal && draggedGoal.id !== goal.id && draggedGoal.listName === listName) {
                                          setDragOverGoal({ ...goal, index, listName });
                                        }
                                      }}
                                      onDragLeave={() => {
                                        setDragOverGoal(null);
                                      }}
                                      onDrop={(e) => {
                                        e.preventDefault();
                                        if (draggedGoal && draggedGoal.id !== goal.id && draggedGoal.listName === listName) {
                                          reorderGoals(listName, draggedGoal.index, index);
                                        }
                                        setDraggedGoal(null);
                                        setDragOverGoal(null);
                                      }}
                                      style={{
                                        opacity: isDragging ? 0.5 : 1,
                                        cursor: 'move',
                                        borderTop: isDragOver && draggedGoal?.index > index ? '3px solid var(--accent)' : undefined,
                                        borderBottom: isDragOver && draggedGoal?.index < index ? '3px solid var(--accent)' : undefined,
                                        transition: 'opacity 0.2s, border 0.2s'
                                      }}
                                    >
                                      <div 
                                        className="goal-header"
                                        onClick={() => setSelectedGoal({ id: goal.id, listName })}
                                        style={{cursor: 'pointer'}}
                                      >
                                        <div>
                                          <h3 style={{margin: '0 0 8px 0'}}>{goal.name}</h3>
                                          {goal.description && (
                                            <p className="project-description">{goal.description}</p>
                                          )}
                                        </div>
                                        <div className="project-meta">
                                          {(goal.startDate || goal.endDate) && (
                                            <span className="project-due-date">
                                              <CalendarIcon /> {goal.startDate && parseLocalDate(goal.startDate)?.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                              {goal.startDate && goal.endDate && ' - '}
                                              {goal.endDate && parseLocalDate(goal.endDate)?.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                            </span>
                                          )}
                                          <span className="goal-project-count">
                                            {goalProjects.length} project{goalProjects.length !== 1 ? 's' : ''}
                                          </span>
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })}
                              </>
                            )}
                          </div>
                        );
                      });
                    })()
                  ) : (
                    // Individual list view
                    getCurrentGoals().map((goal, index) => {
                      const listName = currentGoalList;
                      const goalProjects = Object.values(projects).flat().filter(p => p.goalId == goal.id);
                      const isDragging = draggedGoal?.id === goal.id;
                      const isDragOver = dragOverGoal?.id === goal.id;
                      
                      return (
                        <div 
                          key={goal.id} 
                          className="goal-card"
                          draggable={currentGoalList !== 'master'}
                          onDragStart={(e) => {
                            if (currentGoalList === 'master') return;
                            setDraggedGoal({ ...goal, index, listName });
                            e.dataTransfer.effectAllowed = 'move';
                          }}
                          onDragEnd={() => {
                            setDraggedGoal(null);
                            setDragOverGoal(null);
                          }}
                          onDragOver={(e) => {
                            if (currentGoalList === 'master') return;
                            e.preventDefault();
                            e.dataTransfer.dropEffect = 'move';
                            if (draggedGoal && draggedGoal.id !== goal.id) {
                              setDragOverGoal({ ...goal, index });
                            }
                          }}
                          onDragLeave={() => {
                            setDragOverGoal(null);
                          }}
                          onDrop={(e) => {
                            if (currentGoalList === 'master') return;
                            e.preventDefault();
                            if (draggedGoal && draggedGoal.id !== goal.id) {
                              reorderGoals(listName, draggedGoal.index, index);
                            }
                            setDraggedGoal(null);
                            setDragOverGoal(null);
                          }}
                          onTouchStart={(e) => {
                            if (currentGoalList === 'master') return;
                            handleTouchStart(e, goal, index, listName, 'goal');
                          }}
                          onTouchMove={(e) => {
                            if (currentGoalList === 'master') return;
                            handleTouchMove(e, getCurrentGoals(), 'goal');
                          }}
                          onTouchEnd={(e) => {
                            if (currentGoalList === 'master') return;
                            handleTouchEnd(e, listName, 'goal');
                          }}
                          style={{
                            opacity: isDragging ? 0.5 : 1,
                            cursor: currentGoalList !== 'master' ? 'move' : 'default',
                            borderTop: isDragOver && draggedGoal?.index > index ? '3px solid var(--accent)' : undefined,
                            borderBottom: isDragOver && draggedGoal?.index < index ? '3px solid var(--accent)' : undefined,
                            transition: 'opacity 0.2s, border 0.2s'
                          }}
                        >
                          <div 
                            className="goal-header"
                            onClick={() => setSelectedGoal({ id: goal.id, listName })}
                            style={{cursor: 'pointer'}}
                          >
                            <div>
                              <h3 style={{margin: '0 0 8px 0'}}>{goal.name}</h3>
                              {goal.description && (
                                <p className="project-description">{goal.description}</p>
                              )}
                            </div>
                            <div className="project-meta">
                              {(goal.startDate || goal.endDate) && (
                                <span className="project-due-date">
                                  <CalendarIcon /> {goal.startDate && parseLocalDate(goal.startDate)?.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                  {goal.startDate && goal.endDate && ' - '}
                                  {goal.endDate && parseLocalDate(goal.endDate)?.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                </span>
                              )}
                              <span className="goal-project-count">
                                {goalProjects.length} project{goalProjects.length !== 1 ? 's' : ''}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </>
            ) : (
              <>
                {/* Goal Detail View */}
                {(() => {
                  const goal = goals[selectedGoal.listName]?.find(g => g.id === selectedGoal.id);
                  if (!goal) return null;
                  
                  const goalProjects = Object.values(projects).flat().filter(p => p.goalId == goal.id);
                  
                  return (
                    <div 
                      className="goal-detail"
                      onClick={(e) => {
                        // Close if clicking on the background (not the detail content)
                        if (e.target.className === 'goal-detail') {
                          setSelectedGoal(null);
                        }
                      }}
                    >
                      <div className="goal-detail-content">
                      {/* Goal Section */}
                      <div style={{
                        marginBottom: '30px',
                        padding: '20px',
                        background: 'rgba(var(--surface-rgb), 0.8)',
                        borderRadius: '15px',
                        border: '2px solid rgba(var(--accent-rgb), 0.3)'
                      }}>
                        <div style={{
                          fontFamily: 'var(--font-ui)',
                          fontSize: '1.3rem',
                          fontWeight: '700',
                          color: 'var(--text)',
                          marginBottom: '15px',
                          marginTop: 0,
                          paddingBottom: '10px',
                          borderBottom: '4px solid rgba(var(--accent-rgb), 0.3)'
                        }}>
                          Goal
                        </div>

                        <div className="project-detail-header">
                          {editingGoalName ? (
                            <input
                              type="text"
                              value={goal.name}
                              onChange={(e) => {
                                updateGoal(selectedGoal.listName, selectedGoal.id, { name: e.target.value });
                              }}
                              onBlur={() => setEditingGoalName(false)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') setEditingGoalName(false);
                              }}
                              autoFocus
                              className="project-name-edit"
                            />
                          ) : (
                            <h2 onClick={() => setEditingGoalName(true)} style={{cursor: 'pointer'}} className="project-detail-name">
                              {goal.name}
                            </h2>
                          )}
                        </div>

                        {/* Description Field */}
                        <div style={{marginBottom: '20px'}}>
                          <label className="project-date-label" style={{display: 'block', marginBottom: '8px'}}>
                            Description:
                          </label>
                          <textarea
                            value={goal.description || ''}
                            onChange={(e) => updateGoal(selectedGoal.listName, selectedGoal.id, { description: e.target.value })}
                            placeholder="Add a description..."
                            style={{
                              width: '100%',
                              minHeight: '100px',
                              padding: '12px',
                              background: 'rgba(var(--surface-rgb), 0.8)',
                              border: '2px solid rgba(var(--accent-rgb), 0.3)',
                              borderRadius: '10px',
                              color: 'var(--text)',
                              fontSize: '0.95rem',
                              fontFamily: 'inherit',
                              resize: 'vertical',
                              boxSizing: 'border-box'
                            }}
                          />
                        </div>

                        {/* Challenge Field */}
                        <div style={{marginBottom: '20px'}}>
                          <label className="project-date-label" style={{display: 'block', marginBottom: '8px'}}>
                            Challenge:
                          </label>
                          <textarea
                            value={goal.challenge || ''}
                            onChange={(e) => updateGoal(selectedGoal.listName, selectedGoal.id, { challenge: e.target.value })}
                            placeholder="Add a challenge..."
                            style={{
                              width: '100%',
                              minHeight: '100px',
                              padding: '12px',
                              background: 'rgba(var(--surface-rgb), 0.8)',
                              border: '2px solid rgba(var(--accent-rgb), 0.3)',
                              borderRadius: '10px',
                              color: 'var(--text)',
                              fontSize: '0.95rem',
                              fontFamily: 'inherit',
                              resize: 'vertical',
                              boxSizing: 'border-box'
                            }}
                          />
                        </div>

                        {/* Outcome Field */}
                        <div style={{marginBottom: '20px'}}>
                          <label className="project-date-label" style={{display: 'block', marginBottom: '8px'}}>
                            Outcome:
                          </label>
                          <textarea
                            value={goal.outcome || ''}
                            onChange={(e) => updateGoal(selectedGoal.listName, selectedGoal.id, { outcome: e.target.value })}
                            placeholder="Add the desired outcome..."
                            style={{
                              width: '100%',
                              minHeight: '100px',
                              padding: '12px',
                              background: 'rgba(var(--surface-rgb), 0.8)',
                              border: '2px solid rgba(var(--accent-rgb), 0.3)',
                              borderRadius: '10px',
                              color: 'var(--text)',
                              fontSize: '0.95rem',
                              fontFamily: 'inherit',
                              resize: 'vertical',
                              boxSizing: 'border-box'
                            }}
                          />
                        </div>

                        {/* Goal Dates */}
                        <div className="project-dates-section">
                          <div className="project-date-field">
                            <label className="project-date-label">Start Date:</label>
                            <InlineDatePicker
                              value={goal.startDate || ''}
                              onChange={(v) => updateGoal(selectedGoal.listName, selectedGoal.id, { startDate: v })}
                              style={{flex: 1, minWidth: 0}}
                            />
                          </div>
                          <div className="project-date-field">
                            <label className="project-date-label">End Date:</label>
                            <InlineDatePicker
                              value={goal.endDate || ''}
                              onChange={(v) => updateGoal(selectedGoal.listName, selectedGoal.id, { endDate: v })}
                              style={{flex: 1, minWidth: 0}}
                            />
                          </div>
                        </div>

                        {/* Before Photos */}
                        <div style={{marginBottom: '20px'}}>
                          <div style={{
                            fontFamily: 'var(--font-ui)',
                            fontSize: '1.1rem',
                            fontWeight: '700',
                            color: 'var(--text)',
                            marginBottom: '10px',
                            paddingBottom: '8px',
                            borderBottom: '2px solid rgba(var(--accent-rgb), 0.2)'
                          }}>
                            Before Photos
                          </div>

                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            marginBottom: '10px'
                          }}>
                            <button
                              className="toolbar-btn"
                              onClick={() => {
                                const input = document.createElement('input');
                                input.type = 'file';
                                input.accept = 'image/*';
                                input.multiple = true;
                                input.onchange = (evt) => {
                                  const files = Array.from(evt.target.files);
                                  files.forEach(file => {
                                    if (file) {
                                      addPhotoToGoal(selectedGoal.listName, selectedGoal.id, file, 'beforePhotos');
                                    }
                                  });
                                };
                                input.click();
                              }}
                              style={{
                                padding: '6px 12px',
                                fontSize: '0.85rem',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px'
                              }}
                            >
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
                                <circle cx="12" cy="13" r="4"></circle>
                                <line x1="17" y1="3" x2="17" y2="6"></line>
                                <circle cx="17" cy="2" r="1"></circle>
                              </svg>
                              Add Photos
                            </button>
                          </div>
                          
                          {goal.beforePhotos && goal.beforePhotos.length > 0 && (
                            <div style={{
                              display: 'grid',
                              gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
                              gap: '10px'
                            }}>
                              {goal.beforePhotos.map(photo => (
                                <div 
                                  key={photo.id} 
                                  style={{
                                    position: 'relative',
                                    borderRadius: '8px',
                                    overflow: 'hidden',
                                    border: '2px solid rgba(var(--accent-rgb), 0.3)',
                                    aspectRatio: '1',
                                  }}
                                >
                                  <img 
                                    src={photo.data} 
                                    alt="Before" 
                                    style={{
                                      width: '100%',
                                      height: '100%',
                                      objectFit: 'cover',
                                      display: 'block'
                                    }}
                                  />
                                  <button 
                                    aria-label="Remove photo"
                                    onClick={() => removePhotoFromGoal(selectedGoal.listName, selectedGoal.id, photo.id, 'beforePhotos')}
                                    style={{
                                      position: 'absolute',
                                      top: '5px',
                                      right: '5px',
                                      background: 'rgba(0, 0, 0, 0.7)',
                                      color: '#fff',
                                      border: 'none',
                                      borderRadius: '50%',
                                      width: '24px',
                                      height: '24px',
                                      cursor: 'pointer',
                                      fontSize: '16px',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      padding: 0,
                                      lineHeight: 1
                                    }}
                                  >
                                    ×
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* After Photos */}
                        <div style={{marginBottom: '20px'}}>
                          <div style={{
                            fontFamily: 'var(--font-ui)',
                            fontSize: '1.1rem',
                            fontWeight: '700',
                            color: 'var(--text)',
                            marginBottom: '10px',
                            paddingBottom: '8px',
                            borderBottom: '2px solid rgba(var(--accent-rgb), 0.2)'
                          }}>
                            After Photos
                          </div>

                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            marginBottom: '10px'
                          }}>
                            <button
                              className="toolbar-btn"
                              onClick={() => {
                                const input = document.createElement('input');
                                input.type = 'file';
                                input.accept = 'image/*';
                                input.multiple = true;
                                input.onchange = (evt) => {
                                  const files = Array.from(evt.target.files);
                                  files.forEach(file => {
                                    if (file) {
                                      addPhotoToGoal(selectedGoal.listName, selectedGoal.id, file, 'afterPhotos');
                                    }
                                  });
                                };
                                input.click();
                              }}
                              style={{
                                padding: '6px 12px',
                                fontSize: '0.85rem',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px'
                              }}
                            >
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
                                <circle cx="12" cy="13" r="4"></circle>
                                <line x1="17" y1="3" x2="17" y2="6"></line>
                                <circle cx="17" cy="2" r="1"></circle>
                              </svg>
                              Add Photos
                            </button>
                          </div>
                          
                          {goal.afterPhotos && goal.afterPhotos.length > 0 && (
                            <div style={{
                              display: 'grid',
                              gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
                              gap: '10px'
                            }}>
                              {goal.afterPhotos.map(photo => (
                                <div 
                                  key={photo.id} 
                                  style={{
                                    position: 'relative',
                                    borderRadius: '8px',
                                    overflow: 'hidden',
                                    border: '2px solid rgba(var(--accent-rgb), 0.3)',
                                    aspectRatio: '1',
                                  }}
                                >
                                  <img 
                                    src={photo.data} 
                                    alt="After" 
                                    style={{
                                      width: '100%',
                                      height: '100%',
                                      objectFit: 'cover',
                                      display: 'block'
                                    }}
                                  />
                                  <button 
                                    aria-label="Remove photo"
                                    onClick={() => removePhotoFromGoal(selectedGoal.listName, selectedGoal.id, photo.id, 'afterPhotos')}
                                    style={{
                                      position: 'absolute',
                                      top: '5px',
                                      right: '5px',
                                      background: 'rgba(0, 0, 0, 0.7)',
                                      color: '#fff',
                                      border: 'none',
                                      borderRadius: '50%',
                                      width: '24px',
                                      height: '24px',
                                      cursor: 'pointer',
                                      fontSize: '16px',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      padding: 0,
                                      lineHeight: 1
                                    }}
                                  >
                                    ×
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Associated Projects */}
                      <div className="goal-projects-section">
                        <h3 style={{
                          fontFamily: 'var(--font-ui)',
                          fontSize: '1.3rem',
                          fontWeight: '700',
                          color: 'var(--text)',
                          marginBottom: '15px',
                          marginTop: 0,
                          paddingBottom: '10px',
                          borderBottom: '4px solid rgba(var(--accent-rgb), 0.3)'
                        }}>
                          Projects ({goalProjects.length})
                        </h3>
                        
                        {goalProjects.length === 0 ? (
                          <div style={{
                            color: 'var(--text-muted)',
                            fontSize: '0.95rem',
                            padding: '20px',
                            textAlign: 'center',
                            background: 'rgba(var(--surface-rgb), 0.4)',
                            borderRadius: '10px'
                          }}>
                            No projects associated with this goal yet
                          </div>
                        ) : (
                          <div style={{display: 'flex', flexDirection: 'column', gap: '15px'}}>
                            {goalProjects.map(project => {
                              const projectListName = ['personal', 'work', 'home', 'travel', 'kids'].find(
                                list => projects[list]?.some(p => p.id === project.id)
                              );
                              
                              return (
                                <div 
                                  key={project.id} 
                                  className="project-card"
                                  onClick={() => {
                                    setSelectedGoal(null);
                                    setSelectedProject({ id: project.id, listName: projectListName });
                                    setAppMode('projects');
                                  }}
                                  style={{cursor: 'pointer'}}
                                >
                                  <div className="project-header">
                                    <div style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
                                      <span className={`list-badge ${projectListName}`}>{projectListName}</span>
                                      <h3>{project.name}</h3>
                                    </div>
                                  </div>
                                  {project.description && (
                                    <p className="project-description">{project.description}</p>
                                  )}
                                  {(project.startDate || project.endDate) && (
                                    <div className="project-meta">
                                      {project.startDate && (
                                        <span className="project-meta-item">
                                          Start: {new Date(project.startDate).toLocaleDateString()}
                                        </span>
                                      )}
                                      {project.endDate && (
                                        <span className="project-meta-item">
                                          End: {new Date(project.endDate).toLocaleDateString()}
                                        </span>
                                      )}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>

                      {/* Time Logged */}
                      <div style={{
                        marginTop: '30px',
                        padding: '20px',
                        background: 'rgba(var(--surface-rgb), 0.8)',
                        borderRadius: '15px',
                        border: '2px solid rgba(var(--accent-rgb), 0.3)'
                      }}>
                        <div style={{
                          fontFamily: 'var(--font-ui)',
                          fontSize: '1.3rem',
                          fontWeight: '700',
                          color: 'var(--text)',
                          marginBottom: '15px',
                          paddingBottom: '10px',
                          borderBottom: '4px solid rgba(var(--accent-rgb), 0.3)'
                        }}>
                          Time Logged
                        </div>
                        {(goal.timeLogged || 0) > 0 && (
                          <div style={{
                            fontFamily: 'var(--font-ui)',
                            fontSize: '2.5rem',
                            fontWeight: '700',
                            color: 'var(--text)',
                            marginBottom: '15px',
                            textAlign: 'center'
                          }}>
                            {(() => {
                              const hours = Math.floor((goal.timeLogged || 0) / 60);
                              const minutes = (goal.timeLogged || 0) % 60;
                              if (hours > 0) {
                                return `${hours}h ${minutes}m`;
                              } else {
                                return `${minutes}m`;
                              }
                            })()}
                          </div>
                        )}
                        <div style={{textAlign: 'center'}}>
                          <button 
                            className="add-task-btn"
                            onClick={() => {
                              setTimeLoggerContext({ type: 'goal', id: selectedGoal.id, listName: selectedGoal.listName });
                              setShowTimeLogger(true);
                              setLoggedMinutes(0);
                                setLoggedSeconds(0);
                              setIsLogging(false);
                              setLogStartTime(null);
                        setPausedTime(0);
                            }}
                            style={{width: 'auto', padding: '12px 30px'}}
                          >
                            Log Time
                          </button>
                        </div>

                        {/* Time Log History */}
                        {(goal.timeLogs || []).length > 0 && (
                          <div style={{marginTop: '30px'}}>
                            <h3 style={{
                              fontFamily: 'var(--font-ui)',
                              fontSize: '1.1rem',
                              fontWeight: '700',
                              color: 'var(--text)',
                              marginBottom: '15px',
                              marginTop: 0,
                              paddingBottom: '10px',
                              borderBottom: '2px solid rgba(var(--accent-rgb), 0.2)'
                            }}>
                              History
                            </h3>
                            
                            {(goal.timeLogs || []).slice().reverse().map((log) => (
                              <div 
                                key={log.id}
                                onClick={() => {
                                  setEditingTimeLog(log);
                                  setLoggedMinutes(log.minutes);
                                  setTimeLogFocus(log.focus || '');
                                  setTimeLogDescription(log.description || '');
                                  setTimeLogTakeAway(log.takeAway || '');
                                }}
                                style={{
                                  padding: '15px',
                                  background: 'rgba(var(--surface-raised-rgb), 0.6)',
                                  borderRadius: '10px',
                                  marginBottom: '10px',
                                  border: '2px solid rgba(var(--accent-rgb), 0.3)',
                                  cursor: 'pointer',
                                  transition: 'all 0.2s ease'
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.background = 'rgba(var(--surface-raised-rgb), 0.8)';
                                  e.currentTarget.style.borderColor = 'rgba(var(--accent-rgb), 0.5)';
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.background = 'rgba(var(--surface-raised-rgb), 0.6)';
                                  e.currentTarget.style.borderColor = 'rgba(var(--accent-rgb), 0.3)';
                                }}
                              >
                                <div style={{
                                  display: 'flex',
                                  justifyContent: 'space-between',
                                  alignItems: 'center',
                                  marginBottom: '8px'
                                }}>
                                  <div style={{
                                    fontFamily: 'var(--font-ui)',
                                    fontSize: '1rem',
                                    fontWeight: '600',
                                    color: 'var(--text)'
                                  }}>
                                    {log.minutes} min
                                  </div>
                                  <div style={{
                                    fontSize: '0.85rem',
                                    color: 'var(--text-muted)'
                                  }}>
                                    {new Date(log.date).toLocaleDateString('en-US', { 
                                      month: 'short', 
                                      day: 'numeric',
                                      hour: 'numeric',
                                      minute: '2-digit'
                                    })}
                                  </div>
                                </div>
                                
                                {log.focus && (
                                  <div style={{
                                    fontSize: '0.95rem',
                                    color: 'var(--text)',
                                    marginBottom: '5px',
                                    fontWeight: '500'
                                  }}>
                                    {log.focus}
                                  </div>
                                )}
                                
                                {log.description && (
                                  <div style={{
                                    fontSize: '0.9rem',
                                    color: 'var(--text-muted)',
                                    lineHeight: '1.4',
                                    marginBottom: '8px'
                                  }}>
                                    {log.description}
                                  </div>
                                )}

                                {log.takeAway && (
                                  <div style={{
                                    fontSize: '0.95rem',
                                    color: 'var(--text)',
                                    lineHeight: '1.5',
                                    marginTop: '10px',
                                    padding: '12px',
                                    background: 'rgba(var(--accent-rgb), 0.1)',
                                    borderRadius: '8px',
                                    border: '1px solid rgba(var(--accent-rgb), 0.3)',
                                    fontWeight: '500'
                                  }}>
                                    <div style={{
                                      fontSize: '0.75rem',
                                      color: 'var(--accent)',
                                      marginBottom: '5px',
                                      textTransform: 'uppercase',
                                      letterSpacing: '0.5px',
                                      fontWeight: '600'
                                    }}>
                                      Take Away
                                    </div>
                                    {log.takeAway}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Goal Actions */}
                      <div className="project-actions" style={{display: 'flex', justifyContent: 'space-between', width: '100%'}}>
                        <button 
                          className="archive-btn"
                          onClick={() => {
                            archiveGoal(selectedGoal.listName, goal.id);
                            setSelectedGoal(null);
                          }}
                          style={{
                            padding: '10px 20px',
                            background: 'rgba(var(--accent-rgb), 0.2)',
                            border: '2px solid rgba(var(--accent-rgb), 0.4)',
                            borderRadius: '8px',
                            color: 'var(--accent)',
                            fontSize: '0.9rem',
                            fontWeight: '600',
                            fontFamily: 'var(--font-ui)',
                            cursor: 'pointer'
                          }}
                        >
                          Archive
                        </button>
                        <div style={{display: 'flex', gap: '10px'}}>
                          <button 
                            className="edit-btn"
                            onClick={() => setSelectedGoal(null)}
                          >
                            Close
                          </button>
                          <button 
                            className="delete-btn"
                            onClick={() => setGoalToDelete({ id: goal.id, listName: selectedGoal.listName, name: goal.name })}
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                      </div>
                    </div>
                  );
                })()}
              </>
            )}

            {/* Goal Form Modal */}
            {showGoalForm && (
              <div className="modal-overlay" onClick={() => setShowGoalForm(false)}>
                <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                  <h3>{editingGoal ? 'Edit Goal' : 'New Goal'}</h3>
                  <input
                    type="text"
                    placeholder="Goal name"
                    value={goalFormData.name}
                    onChange={(e) => setGoalFormData(prev => ({ ...prev, name: e.target.value }))}
                    style={{
                      width: '100%',
                      padding: '12px',
                      background: 'rgba(var(--surface-rgb), 0.8)',
                      border: '2px solid rgba(var(--accent-rgb), 0.3)',
                      borderRadius: '10px',
                      color: 'var(--text)',
                      fontSize: '1rem',
                      marginBottom: '15px',
                      boxSizing: 'border-box'
                    }}
                  />
                  <textarea
                    placeholder="Description"
                    value={goalFormData.description}
                    onChange={(e) => setGoalFormData(prev => ({ ...prev, description: e.target.value }))}
                    style={{
                      width: '100%',
                      padding: '12px',
                      background: 'rgba(var(--surface-rgb), 0.8)',
                      border: '2px solid rgba(var(--accent-rgb), 0.3)',
                      borderRadius: '10px',
                      color: 'var(--text)',
                      fontSize: '1rem',
                      marginBottom: '15px',
                      minHeight: '80px',
                      fontFamily: 'inherit',
                      resize: 'vertical',
                      boxSizing: 'border-box'
                    }}
                  />
                  <div style={{marginBottom: '20px'}}>
                    <label style={{display: 'block', color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '5px'}}>
                      Start Date
                    </label>
                    <InlineDatePicker
                      value={goalFormData.startDate}
                      onChange={(v) => setGoalFormData(prev => ({ ...prev, startDate: v }))}
                      style={{width: '50%', maxWidth: '50%'}}
                    />
                  </div>
                  <div style={{marginBottom: '20px'}}>
                    <label style={{display: 'block', color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '5px'}}>
                      End Date
                    </label>
                    <InlineDatePicker
                      value={goalFormData.endDate}
                      onChange={(v) => setGoalFormData(prev => ({ ...prev, endDate: v }))}
                      style={{width: '50%', maxWidth: '50%'}}
                    />
                  </div>
                  <div className="modal-actions">
                    <button 
                      className="edit-btn primary-action"
                      onClick={() => {
                        if (!goalFormData.name.trim()) return;
                        
                        if (editingGoal) {
                          updateGoal(editingGoal.listName, editingGoal.id, {
                            name: goalFormData.name.trim(),
                            description: goalFormData.description.trim(),
                            startDate: goalFormData.startDate,
                            endDate: goalFormData.endDate
                          });
                        } else {
                          addGoal(
                            currentGoalList,
                            goalFormData.name.trim(),
                            goalFormData.description.trim(),
                            goalFormData.startDate,
                            goalFormData.endDate
                          );
                        }
                        
                        setShowGoalForm(false);
                        setGoalFormData({ name: '', description: '', startDate: '', endDate: '' });
                        setEditingGoal(null);
                      }}
                    >
                      {editingGoal ? 'Save' : 'Create'}
                    </button>
                    <button 
                      className="delete-btn"
                      onClick={() => {
                        setShowGoalForm(false);
                        setGoalFormData({ name: '', description: '', startDate: '', endDate: '' });
                        setEditingGoal(null);
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Goal Delete Confirmation Modal */}
            {goalToDelete && (
              <div className="modal-overlay" onClick={() => setGoalToDelete(null)}>
                <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                  <h3>Delete Goal?</h3>
                  <p style={{color: 'var(--text-muted)', marginBottom: '20px', textAlign: 'center'}}>
                    "{goalToDelete.name}"
                  </p>
                  <p style={{color: 'var(--text-muted)', marginBottom: '20px', textAlign: 'center', fontSize: '0.9rem'}}>
                    This will remove the goal from all associated projects.
                  </p>
                  <div className="modal-actions" style={{justifyContent: 'center'}}>
                    <button 
                      className="delete-btn" 
                      onClick={() => {
                        deleteGoal(goalToDelete.listName, goalToDelete.id);
                        setGoalToDelete(null);
                      }}
                    >
                      Delete
                    </button>
                    <button 
                      className="edit-btn" 
                      onClick={() => setGoalToDelete(null)}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}

          </div>
        )}

            {/* Time Logger Modal */}
            {showTimeLogger && timeLoggerContext && (
              <div className="modal-overlay" onClick={() => {
                setShowTimeLogger(false);
                setIsLogging(false);
                setLoggedMinutes(0);
                                setLoggedSeconds(0);
                setLogStartTime(null);
                        setPausedTime(0);
                setPausedTime(0);
                setTimeLogFocus('');
                setTimeLogDescription('');
                setTimeLogTakeAway('');
                setTimeLoggerContext(null);
              }}>
                <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{
                  width: '90%',
                  maxWidth: '500px',
                  textAlign: 'center',
                  padding: '20px',
                  maxHeight: '90vh',
                  overflowY: 'auto'
                }}>
                  {/* Fire Logo */}
                  <div 
                    onClick={() => {
                      // Unlocking audio needs a user gesture, and this is the
                      // only reliable one before a session ends - so the chime
                      // is armed here, whether or not Pomodoro is on.
                      unlockAudio();
                      // Simply toggle logging on/off. loggedSeconds persists
                      // across pauses, so resuming continues from where it left off.
                      setIsLogging(prev => !prev);
                    }}
                    style={{
                      cursor: 'pointer',
                      marginTop: '40px',
                      marginBottom: '15px',
                      display: 'inline-block',
                      transition: 'transform 0.2s ease'
                    }}
                  >
                    <div style={{
                      width: '180px',
                      height: '180px',
                      position: 'relative',
                      display: 'inline-block'
                    }}>
                      {/* Circular Progress Ring */}
                      <svg 
                        style={{
                          position: 'absolute',
                          top: '-15px',
                          left: '-15px',
                          width: '210px',
                          height: '210px',
                          transform: 'rotate(-90deg)',
                          pointerEvents: 'none'
                        }}
                      >
                        {/* Background circle */}
                        <circle
                          cx="105"
                          cy="105"
                          r="95"
                          fill="none"
                          stroke="rgba(var(--surface-alt-rgb), 0.3)"
                          strokeWidth="8"
                        />
                        {/* Progress circle - driven by loggedSeconds so it
                            pauses and resumes in lockstep with the timer.
                            Offset goes from 597 (empty) to 0 (full ring) as
                            elapsed time approaches the selected duration. */}
                        {/* Always mounted, not conditional. A freshly mounted
                            element has no previous value to transition from, so
                            it would appear already at the one-second mark
                            instead of sweeping there. At full offset nothing is
                            drawn, so an idle ring is invisible anyway. */}
                        <circle
                          cx="105"
                          cy="105"
                          r="95"
                          fill="none"
                          strokeWidth="8"
                          strokeDasharray={RING_CIRCUMFERENCE}
                          strokeDashoffset={ringOffset}
                          strokeLinecap="round"
                          style={{
                            // var() only resolves as a CSS property, never as
                            // an SVG attribute - so stroke lives here
                            stroke: isLogging ? 'var(--accent)' : '#a0aec0',
                            // Interpolates between the once-a-second updates, on
                            // the compositor - far cheaper than re-rendering 20
                            // times a second, and smooth. linear rather than
                            // ease: easing would accelerate and settle inside
                            // every step, reading as a pulse once a second.
                            transition: ringTransition
                          }}
                        />
                      </svg>
                      
                      {/* Fire Icon */}
                      <div style={{
                        width: '100%',
                        height: '100%',
                        filter: isLogging ? 'drop-shadow(0 0 25px rgba(255, 69, 0, 0.8))' : 'drop-shadow(0 0 10px rgba(100, 100, 100, 0.3))',
                        // Desktop only: this animates drop-shadow (a paint
                        // property) with 45-60px blurs, so it repaints every
                        // frame for the whole session. Phones keep the static
                        // glow, which is computed once and cached.
                        animation: (isLogging && !isMobile) ? 'flameGlow 10s ease-in-out infinite' : 'none'
                      }}>
                        <svg version="1.0" xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 1280.000000 1280.000000"
                          preserveAspectRatio="xMidYMid meet"
                          style={{width: '100%', height: '100%'}}>
                          <g transform="translate(0.000000,1280.000000) scale(0.100000,-0.100000)"
                            fill={isLogging ? '#FF4500' : 'var(--surface-line)'} stroke="none">
                          <path d="M7090 12669 c-1 -257 -76 -628 -175 -871 -149 -365 -354 -643 -825
                          -1123 -562 -572 -1053 -1165 -1415 -1710 -256 -385 -443 -729 -568 -1045 -164
                          -415 -213 -716 -189 -1167 7 -126 17 -257 22 -293 4 -36 11 -87 15 -115 3 -27
                          17 -108 31 -180 66 -339 167 -634 321 -937 181 -358 383 -630 707 -954 206
                          -206 336 -319 558 -486 130 -98 458 -322 462 -316 1 1 20 53 40 113 45 131
                          132 315 211 452 58 99 233 361 296 443 231 303 515 606 864 926 411 375 725
                          680 839 814 99 117 243 309 323 432 261 403 385 922 386 1623 0 207 -4 314
                          -17 410 -76 586 -230 1136 -500 1782 -358 860 -885 1741 -1298 2168 l-87 90
                          -1 -56z"/>
                          <path d="M9510 9493 c0 -5 9 -55 21 -113 89 -462 132 -1021 110 -1453 -13
                          -249 -39 -482 -67 -597 -109 -438 -605 -1140 -1299 -1835 -126 -127 -291 -284
                          -365 -350 -160 -142 -223 -206 -374 -380 -276 -318 -452 -600 -476 -761 -5
                          -38 -19 -133 -31 -211 -21 -141 -21 -189 2 -261 8 -25 15 -32 28 -26 73 31
                          289 101 416 134 203 54 418 97 820 164 894 149 1116 222 1550 511 387 257 676
                          553 814 833 98 197 195 572 233 892 19 165 16 597 -5 780 -104 913 -509 1833
                          -1058 2404 -105 109 -294 276 -312 276 -4 0 -7 -3 -7 -7z"/>
                          <path d="M3355 8046 c-199 -134 -336 -247 -523 -430 -189 -186 -290 -306 -418
                          -498 -270 -403 -415 -856 -401 -1261 8 -258 75 -514 202 -772 237 -481 641
                          -873 1170 -1135 358 -177 715 -283 1170 -349 153 -22 511 -54 546 -49 16 2
                          -12 23 -107 82 -709 437 -1164 850 -1434 1303 -118 197 -228 493 -244 653 -4
                          36 -11 92 -16 125 -5 33 -16 116 -25 185 -8 69 -20 163 -26 210 -6 47 -13 196
                          -16 332 -5 240 4 411 38 673 5 44 12 98 15 120 3 22 9 65 14 95 5 30 12 73 16
                          95 26 174 135 576 188 698 5 9 4 17 0 17 -5 0 -72 -43 -149 -94z"/>
                        </g>
                      </svg>
                      </div>
                    </div>
                  </div>

                  {/* Timer Display */}
                  {loggedSeconds >= 60 && (
                    <div style={{
                      fontFamily: 'var(--font-ui)',
                      fontSize: '2rem',
                      fontWeight: '600',
                      color: isLogging ? 'var(--accent)' : '#a0aec0',
                      marginBottom: '15px',
                      letterSpacing: '0.05em'
                    }}>
                      {Math.floor(loggedSeconds / 60)} {Math.floor(loggedSeconds / 60) === 1 ? 'Min' : 'Mins'}
                    </div>
                  )}

                  {/* Timer Duration Selector */}
                  <div style={{textAlign: 'left', marginBottom: '20px'}}>
                    <label style={{
                      display: 'block',
                      color: 'var(--text-muted)',
                      fontSize: '0.9rem',
                      marginBottom: '5px',
                      fontFamily: 'var(--font-ui)'
                    }}>
                      Duration:
                    </label>
                    <div data-time-duration-dropdown style={{position: 'relative'}}>
                      <div
                        onClick={() => setTimeDurationDropdownOpen(!timeDurationDropdownOpen)}
                        style={{
                          width: '100%',
                          padding: '10px',
                          background: 'rgba(var(--surface-rgb), 1)',
                          border: '2px solid rgba(var(--accent-rgb), 0.3)',
                          borderRadius: '8px',
                          color: 'var(--text)',
                          fontSize: '1rem',
                          fontFamily: 'var(--font-ui)',
                          cursor: 'pointer',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center'
                        }}
                      >
                        <span>{durationLabel(timerDuration === 0 ? '' : timerDuration)}</span>
                        <span style={{
                          transform: timeDurationDropdownOpen ? 'rotate(360deg)' : 'rotate(180deg)',
                          transition: 'transform 0.3s ease',
                          fontSize: '0.9rem',
                          display: 'inline-block'
                        }}>▼</span>
                      </div>

                      {/* Duration Options */}
                      {timeDurationDropdownOpen && (
                        <div style={{
                          position: 'absolute',
                          top: '100%',
                          left: '0',
                          right: '0',
                          marginTop: '-8px',
                          background: 'rgba(var(--surface-rgb), 1)',
                          border: '2px solid rgba(var(--accent-rgb), 0.3)',
                          borderRadius: '8px',
                          overflow: 'hidden',
                          zIndex: 1000,
                          boxShadow: '0 8px 24px rgba(var(--shadow-rgb), 0.4)'
                        }}>
                          {durationOptions.map((option, idx) => (
                            <div
                              key={option.value}
                              onClick={() => {
                                setTimerDuration(option.value === '' ? '' : option.value);
                                setTimeDurationDropdownOpen(false);
                                if (option.value === 'pomodoro') {
                                  // This tap is the user gesture that lets the
                                  // page make sound later.
                                  unlockAudio();
                                  // Fresh cycle, but loggedSeconds is left alone
                                  // on purpose - it may hold time you haven't
                                  // saved yet, and silently discarding it would
                                  // be worse than starting mid-count.
                                  resetPomodoroCycle();
                                  setIsLogging(true);
                                }
                              }}
                              style={{
                                padding: '10px',
                                color: 'var(--text)',
                                fontSize: '1rem',
                                cursor: 'pointer',
                                background: timerDuration === option.value ? 'rgba(var(--accent-rgb), 0.4)' : 'transparent',
                                borderBottom: idx < durationOptions.length - 1 ? '1px solid rgba(var(--accent-rgb), 0.2)' : 'none',
                                transition: 'background 0.2s ease',
                                fontFamily: 'var(--font-ui)'
                              }}
                              onMouseOver={(e) => e.currentTarget.style.background = 'rgba(var(--accent-rgb), 0.3)'}
                              onMouseOut={(e) => e.currentTarget.style.background = timerDuration === option.value ? 'rgba(var(--accent-rgb), 0.4)' : 'transparent'}
                            >
                              {option.label}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Focus and Description Fields */}
                  <div style={{textAlign: 'left', marginBottom: '15px'}}>
                    <label style={{
                      display: 'block',
                      color: 'var(--text-muted)',
                      fontSize: '0.9rem',
                      marginBottom: '5px',
                      fontFamily: 'var(--font-ui)'
                    }}>
                      Focus:
                    </label>
                    <input
                      type="text"
                      value={timeLogFocus}
                      onChange={(e) => setTimeLogFocus(e.target.value)}
                      placeholder="What are you focusing on?"
                      style={{
                        width: '100%',
                        padding: '10px',
                        background: 'rgba(var(--surface-rgb), 0.8)',
                        border: '2px solid rgba(var(--accent-rgb), 0.3)',
                        borderRadius: '8px',
                        color: 'var(--text)',
                        fontSize: '0.95rem',
                        marginBottom: '15px'
                      }}
                    />
                    
                    <label style={{
                      display: 'block',
                      color: 'var(--text-muted)',
                      fontSize: '0.9rem',
                      marginBottom: '5px',
                      fontFamily: 'var(--font-ui)'
                    }}>
                      Description:
                    </label>
                    <textarea
                      value={timeLogDescription}
                      onChange={(e) => setTimeLogDescription(e.target.value)}
                      placeholder="Optional notes..."
                      style={{
                        width: '100%',
                        minHeight: '60px',
                        padding: '10px',
                        background: 'rgba(var(--surface-rgb), 0.8)',
                        border: '2px solid rgba(var(--accent-rgb), 0.3)',
                        borderRadius: '8px',
                        color: 'var(--text)',
                        fontSize: '0.95rem',
                        fontFamily: 'inherit',
                        resize: 'vertical'
                      }}
                    />
                  </div>

                  {/* Take Away Field */}
                  <div style={{textAlign: 'left', marginBottom: '15px'}}>
                    <label style={{
                      display: 'block',
                      color: 'var(--text-muted)',
                      fontSize: '0.9rem',
                      marginBottom: '5px',
                      fontFamily: 'var(--font-ui)'
                    }}>
                      Take Away:
                    </label>
                    <textarea
                      value={timeLogTakeAway}
                      onChange={(e) => setTimeLogTakeAway(e.target.value)}
                      placeholder="What did you learn or accomplish?"
                      style={{
                        width: '100%',
                        minHeight: '100px',
                        padding: '10px',
                        background: 'rgba(var(--surface-rgb), 0.8)',
                        border: '2px solid rgba(var(--accent-rgb), 0.3)',
                        borderRadius: '8px',
                        color: 'var(--text)',
                        fontSize: '0.95rem',
                        fontFamily: 'inherit',
                        resize: 'vertical'
                      }}
                    />
                  </div>

                  {/* Pomodoro */}
                  {pomodoroOn && (
                    <div style={{
                      background: 'rgba(var(--surface-rgb), 0.7)',
                      border: '2px solid rgba(var(--accent-rgb), 0.25)',
                      borderRadius: '14px', padding: '14px', marginBottom: '18px'
                    }}>
                      <div style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        gap: '10px', flexWrap: 'wrap'
                      }}>
                        <div style={{
                          color: 'var(--text)', fontFamily: 'var(--font-ui)',
                          fontWeight: 700, fontSize: '1rem'
                        }}>
                          {breakEndsAt
                            ? `${pomodoroPhase === 'long' ? 'Long' : 'Short'} break — ${Math.floor(breakRemaining / 60)}:${String(breakRemaining % 60).padStart(2, '0')}`
                            : `Focus — ${Math.max(0, Math.ceil((workTarget - loggedSeconds) / 60))} min left`}
                        </div>
                        {/* One dot per session toward the long break, so the
                            cycle position is readable at a glance. */}
                        <div style={{ display: 'flex', gap: '6px' }}>
                          {Array.from({ length: pomodoroInterval }).map((_, i) => (
                            <span key={i} style={{
                              width: '9px', height: '9px', borderRadius: '50%',
                              background: (pomodoroCount % pomodoroInterval) > i
                                || (pomodoroCount > 0 && pomodoroCount % pomodoroInterval === 0)
                                ? 'var(--accent)' : 'rgba(var(--accent-rgb), 0.25)'
                            }} />
                          ))}
                        </div>
                      </div>

                      {pomodoroMessage && (
                        <div style={{
                          color: 'var(--text-muted)', fontSize: '0.82rem',
                          fontFamily: 'var(--font-ui)', marginTop: '8px'
                        }}>
                          {pomodoroMessage}
                        </div>
                      )}

                      <div style={{ display: 'flex', gap: '8px', marginTop: '12px', flexWrap: 'wrap' }}>
                        <button className="edit-btn" onClick={skipPomodoroPhase}>
                          {breakEndsAt ? 'Skip break' : 'End session'}
                        </button>
                        <button className="edit-btn" onClick={resetPomodoroCycle}>
                          Reset cycle
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Instructions */}
                  <p style={{
                    color: 'var(--text-muted)',
                    fontSize: '0.9rem',
                    marginBottom: '20px'
                  }}>
                    {breakEndsAt
                      ? 'On a break — the timer resumes when it ends'
                      : (isLogging ? 'Click fire to stop timer' : 'Click fire to start logging')}
                  </p>

                  {/* Action Buttons */}
                  <div style={{display: 'flex', gap: '10px', justifyContent: 'center'}}>
                    <button 
                      className="edit-btn"
                      onClick={() => {
                        if (loggedMinutes > 0 && timeLoggerContext) {
                          const newTimeLog = {
                            id: makeId(),
                            minutes: loggedMinutes,
                            focus: timeLogFocus,
                            description: timeLogDescription,
                            takeAway: timeLogTakeAway,
                            date: new Date().toISOString()
                          };
                          
                          if (timeLoggerContext.type === 'note') {
                            // Update note
                            const note = notes.find(n => n.id === timeLoggerContext.id);
                            if (note) {
                              setNotes(prev => prev.map(n => 
                                n.id === timeLoggerContext.id 
                                  ? {
                                      ...n,
                                      timeLogged: (n.timeLogged || 0) + loggedMinutes,
                                      timeLogs: [...(n.timeLogs || []), newTimeLog]
                                    }
                                  : n
                              ));
                            }
                          } else if (timeLoggerContext.type === 'goal') {
                            // Update goal
                            const goal = goals[timeLoggerContext.listName]?.find(g => g.id === timeLoggerContext.id);
                            if (goal) {
                              updateGoal(timeLoggerContext.listName, timeLoggerContext.id, {
                                timeLogged: (goal.timeLogged || 0) + loggedMinutes,
                                timeLogs: [...(goal.timeLogs || []), newTimeLog]
                              });
                            }
                          }
                        }
                        setShowTimeLogger(false);
                        setIsLogging(false);
                        setLoggedMinutes(0);
                                setLoggedSeconds(0);
                        setLogStartTime(null);
                        setPausedTime(0);
                        setTimeLogFocus('');
                        setTimeLogDescription('');
                        setTimeLogTakeAway('');
                        setTimeLoggerContext(null);
                      }}
                      style={{width: 'auto', padding: '10px 30px'}}
                    >
                      Save
                    </button>
                    <button 
                      className="delete-btn"
                      onClick={() => {
                        setShowTimeLogger(false);
                        setIsLogging(false);
                        setLoggedMinutes(0);
                                setLoggedSeconds(0);
                        setLogStartTime(null);
                        setPausedTime(0);
                        setTimeLogFocus('');
                        setTimeLogDescription('');
                        setTimeLogTakeAway('');
                        setTimeLoggerContext(null);
                      }}
                      style={{width: 'auto', padding: '10px 30px'}}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Edit Time Log Modal */}
            {editingTimeLog && selectedGoal && (
              <div className="modal-overlay" onClick={() => {
                setEditingTimeLog(null);
                setLoggedMinutes(0);
                                setLoggedSeconds(0);
                setTimeLogFocus('');
                setTimeLogDescription('');
                setTimeLogTakeAway('');
              }}>
                <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{
                  width: '90%',
                  maxWidth: '500px',
                  padding: '20px'
                }}>
                  <h3 style={{marginTop: 0, marginBottom: '15px'}}>Edit Time Log</h3>
                  
                  {/* Minutes Input */}
                  <div style={{marginBottom: '20px'}}>
                    <label style={{
                      display: 'block',
                      color: 'var(--text-muted)',
                      fontSize: '0.9rem',
                      marginBottom: '8px',
                      fontFamily: 'var(--font-ui)'
                    }}>
                      Minutes:
                    </label>
                    <input
                      type="number"
                      value={loggedMinutes}
                      onChange={(e) => setLoggedMinutes(parseInt(e.target.value) || 0)}
                      min="0"
                      style={{
                        width: '100%',
                        padding: '10px',
                        background: 'rgba(var(--surface-rgb), 0.8)',
                        border: '2px solid rgba(var(--accent-rgb), 0.3)',
                        borderRadius: '8px',
                        color: 'var(--text)',
                        fontSize: '1.2rem',
                        fontWeight: '600'
                      }}
                    />
                  </div>

                  {/* Focus Input */}
                  <div style={{marginBottom: '20px'}}>
                    <label style={{
                      display: 'block',
                      color: 'var(--text-muted)',
                      fontSize: '0.9rem',
                      marginBottom: '8px',
                      fontFamily: 'var(--font-ui)'
                    }}>
                      Focus:
                    </label>
                    <input
                      type="text"
                      value={timeLogFocus}
                      onChange={(e) => setTimeLogFocus(e.target.value)}
                      placeholder="What were you focusing on?"
                      style={{
                        width: '100%',
                        padding: '10px',
                        background: 'rgba(var(--surface-rgb), 0.8)',
                        border: '2px solid rgba(var(--accent-rgb), 0.3)',
                        borderRadius: '8px',
                        color: 'var(--text)',
                        fontSize: '0.95rem'
                      }}
                    />
                  </div>

                  {/* Description Input */}
                  <div style={{marginBottom: '20px'}}>
                    <label style={{
                      display: 'block',
                      color: 'var(--text-muted)',
                      fontSize: '0.9rem',
                      marginBottom: '8px',
                      fontFamily: 'var(--font-ui)'
                    }}>
                      Description:
                    </label>
                    <textarea
                      value={timeLogDescription}
                      onChange={(e) => setTimeLogDescription(e.target.value)}
                      placeholder="Any notes about this session?"
                      style={{
                        width: '100%',
                        minHeight: '80px',
                        padding: '10px',
                        background: 'rgba(var(--surface-rgb), 0.8)',
                        border: '2px solid rgba(var(--accent-rgb), 0.3)',
                        borderRadius: '8px',
                        color: 'var(--text)',
                        fontSize: '0.95rem',
                        fontFamily: 'inherit',
                        resize: 'vertical'
                      }}
                    />
                  </div>

                  {/* Take Away Input */}
                  <div style={{marginBottom: '15px'}}>
                    <label style={{
                      display: 'block',
                      color: 'var(--text-muted)',
                      fontSize: '0.9rem',
                      marginBottom: '8px',
                      fontFamily: 'var(--font-ui)'
                    }}>
                      Take Away:
                    </label>
                    <textarea
                      value={timeLogTakeAway}
                      onChange={(e) => setTimeLogTakeAway(e.target.value)}
                      placeholder="What did you learn or accomplish?"
                      style={{
                        width: '100%',
                        minHeight: '120px',
                        padding: '10px',
                        background: 'rgba(var(--surface-rgb), 0.8)',
                        border: '2px solid rgba(var(--accent-rgb), 0.3)',
                        borderRadius: '8px',
                        color: 'var(--text)',
                        fontSize: '0.95rem',
                        fontFamily: 'inherit',
                        resize: 'vertical'
                      }}
                    />
                  </div>

                  {/* Action Buttons */}
                  <div className="modal-actions" style={{justifyContent: 'space-between'}}>
                    <button 
                      className="delete-btn"
                      onClick={() => {
                        const goal = goals[selectedGoal.listName]?.find(g => g.id === selectedGoal.id);
                        if (goal) {
                          const updatedLogs = (goal.timeLogs || []).filter(log => log.id !== editingTimeLog.id);
                          const minutesDiff = editingTimeLog.minutes;
                          
                          updateGoal(selectedGoal.listName, selectedGoal.id, {
                            timeLogs: updatedLogs,
                            timeLogged: Math.max(0, (goal.timeLogged || 0) - minutesDiff)
                          });
                        }
                        setEditingTimeLog(null);
                        setLoggedMinutes(0);
                                setLoggedSeconds(0);
                        setTimeLogFocus('');
                        setTimeLogDescription('');
                        setTimeLogTakeAway('');
                      }}
                      style={{marginRight: 'auto'}}
                    >
                      Delete
                    </button>
                    
                    <div style={{display: 'flex', gap: '10px'}}>
                      <button 
                        className="edit-btn"
                        onClick={() => {
                          const goal = goals[selectedGoal.listName]?.find(g => g.id === selectedGoal.id);
                          if (goal) {
                            const updatedLogs = (goal.timeLogs || []).map(log => 
                              log.id === editingTimeLog.id 
                                ? { 
                                    ...log, 
                                    minutes: loggedMinutes,
                                    focus: timeLogFocus,
                                    description: timeLogDescription,
                                    takeAway: timeLogTakeAway
                                  }
                                : log
                            );
                            
                            const minutesDiff = loggedMinutes - editingTimeLog.minutes;
                            
                            updateGoal(selectedGoal.listName, selectedGoal.id, {
                              timeLogs: updatedLogs,
                              timeLogged: (goal.timeLogged || 0) + minutesDiff
                            });
                          }
                          setEditingTimeLog(null);
                          setLoggedMinutes(0);
                                setLoggedSeconds(0);
                          setTimeLogFocus('');
                          setTimeLogDescription('');
                          setTimeLogTakeAway('');
                        }}
                      >
                        Save
                      </button>
                      
                      <button 
                        className="delete-btn"
                        onClick={() => {
                          setEditingTimeLog(null);
                          setLoggedMinutes(0);
                                setLoggedSeconds(0);
                          setTimeLogFocus('');
                          setTimeLogDescription('');
                          setTimeLogTakeAway('');
                        }}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}


        {appMode === 'time' && (
          <div className="time-section">
            {/* Log Time Button */}
            <div style={{display: 'block', textAlign: 'center', marginBottom: '30px'}}>
              <button 
                className="add-task-btn" 
                onClick={() => setShowTimeLogger(true)}
                style={{width: '70%', display: 'inline-block'}}
              >
                Log Time
              </button>
            </div>

            {/* Time Log Records */}
            <div style={{
              padding: '20px 40px',
              minHeight: '400px'
            }}>
              {(() => {
                const allTimeLogs = getAllTimeLogs();
                
                if (allTimeLogs.length === 0) {
                  return (
                    <div style={{display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '300px'}}>
                      <div style={{
                        width: '180px',
                        height: '180px',
                        position: 'relative',
                        display: 'inline-block'
                      }}>
                        <svg version="1.0" xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 1280.000000 1280.000000"
                          preserveAspectRatio="xMidYMid meet"
                          style={{
                            width: '100%',
                            height: '100%',
                            filter: 'drop-shadow(0 0 10px rgba(100, 100, 100, 0.3))'
                          }}>
                          <g transform="translate(0.000000,1280.000000) scale(0.100000,-0.100000)"
                            fill="#3a3a4a" stroke="none">
                            <path d="M7090 12669 c-1 -257 -76 -628 -175 -871 -149 -365 -354 -643 -825
                            -1123 -562 -572 -1053 -1165 -1415 -1710 -256 -385 -443 -729 -568 -1045 -164
                            -415 -213 -716 -189 -1167 7 -126 17 -257 22 -293 4 -36 11 -87 15 -115 3 -27
                            17 -108 31 -180 66 -339 167 -634 321 -937 181 -358 383 -630 707 -954 206
                            -206 336 -319 558 -486 130 -98 458 -322 462 -316 1 1 20 53 40 113 45 131
                            132 315 211 452 58 99 233 361 296 443 231 303 515 606 864 926 411 375 725
                            680 839 814 99 117 243 309 323 432 261 403 385 922 386 1623 0 207 -4 314
                            -17 410 -76 586 -230 1136 -500 1782 -358 860 -885 1741 -1298 2168 l-87 90
                            -1 -56z"/>
                            <path d="M9510 9493 c0 -5 9 -55 21 -113 89 -462 132 -1021 110 -1453 -13
                            -249 -39 -482 -67 -597 -109 -438 -605 -1140 -1299 -1835 -126 -127 -291 -284
                            -365 -350 -160 -142 -223 -206 -374 -380 -276 -318 -452 -600 -476 -761 -5
                            -38 -19 -133 -31 -211 -21 -141 -21 -189 2 -261 8 -25 15 -32 28 -26 73 31
                            289 101 416 134 203 54 418 97 820 164 894 149 1116 222 1550 511 387 257 676
                            553 814 833 98 197 195 572 233 892 19 165 16 597 -5 780 -104 913 -509 1833
                            -1058 2404 -105 109 -294 276 -312 276 -4 0 -7 -3 -7 -7z"/>
                            <path d="M3355 8046 c-199 -134 -336 -247 -523 -430 -189 -186 -290 -306 -418
                            -498 -270 -403 -415 -856 -401 -1261 8 -258 75 -514 202 -772 237 -481 641
                            -873 1170 -1135 358 -177 715 -283 1170 -349 153 -22 511 -54 546 -49 16 2
                            -12 23 -107 82 -709 437 -1164 850 -1434 1303 -118 197 -228 493 -244 653 -4
                            36 -11 92 -16 125 -5 33 -16 116 -25 185 -8 69 -20 163 -26 210 -6 47 -13 196
                            -16 332 -5 240 4 411 38 673 5 44 12 98 15 120 3 22 9 65 14 95 5 30 12 73 16
                            95 26 174 135 576 188 698 5 9 4 17 0 17 -5 0 -72 -43 -149 -94z"/>
                          </g>
                        </svg>
                      </div>
                    </div>
                  );
                }

                // Group time logs by source
                const groupedLogs = {
                  goal: allTimeLogs.filter(log => log.source === 'goal'),
                  journal: allTimeLogs.filter(log => log.source === 'journal'),
                  time: allTimeLogs.filter(log => log.source === 'time')
                };

                return (
                  <div style={{display: 'flex', flexDirection: 'column', gap: '30px'}}>
                    {/* Standalone Time Logs */}
                    {groupedLogs.time.length > 0 && (
                      <div>
                        <div 
                          onClick={() => setShowStandaloneTimeLogs(!showStandaloneTimeLogs)}
                          style={{
                            fontFamily: 'var(--font-ui)',
                            fontSize: '1.3rem',
                            fontWeight: '700',
                            color: 'var(--text)',
                            marginBottom: '15px',
                            paddingBottom: '10px',
                            borderBottom: '4px solid rgba(var(--accent-rgb), 0.3)',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            cursor: 'pointer'
                          }}>
                          <span>Time Logs</span>
                          <span style={{
                            color: 'var(--accent)',
                            fontSize: '1rem',
                            fontWeight: '700'
                          }}>
                            {groupedLogs.time.reduce((sum, log) => sum + log.minutes, 0)} min
                          </span>
                        </div>
                        {showStandaloneTimeLogs && (
                          <div style={{display: 'flex', flexDirection: 'column', gap: '10px'}}>
                            {groupedLogs.time.map((log, index) => {
                            const isExpanded = expandedTimeLogId === `time-${log.id}-${index}`;
                            return (
                              <div key={`time-${log.id}-${index}`} style={{
                                padding: '15px',
                                background: 'rgba(var(--surface-raised-rgb), 0.6)',
                                borderRadius: '15px',
                                border: '2px solid rgba(var(--accent-rgb), 0.15)',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease'
                              }}
                              onClick={() => setExpandedTimeLogId(isExpanded ? null : `time-${log.id}-${index}`)}
                              >
                                <div style={{
                                  display: 'flex',
                                  justifyContent: 'space-between',
                                  alignItems: 'center'
                                }}>
                                  <div style={{flex: 1}}>
                                    <div style={{
                                      color: '#999',
                                      fontSize: '0.85rem',
                                      fontFamily: 'var(--font-ui)'
                                    }}>
                                      {new Date(log.date).toLocaleDateString('en-US', { 
                                        month: 'short', 
                                        day: 'numeric',
                                        hour: 'numeric',
                                        minute: '2-digit'
                                      })}
                                    </div>
                                    {log.focus && (
                                      <div style={{
                                        color: 'var(--text)',
                                        fontSize: '0.9rem',
                                        fontFamily: 'var(--font-ui)',
                                        marginTop: '3px'
                                      }}>
                                        {log.focus}
                                      </div>
                                    )}
                                  </div>
                                  <div style={{
                                    color: 'var(--accent)',
                                    fontSize: '1rem',
                                    fontWeight: '700',
                                    fontFamily: 'var(--font-ui)'
                                  }}>
                                    {log.minutes} min
                                  </div>
                                </div>
                                
                                {isExpanded && (
                                  <div style={{marginTop: '15px', paddingTop: '15px', borderTop: '1px solid rgba(var(--accent-rgb), 0.2)'}}>
                                    {log.focus && (
                                      <div style={{marginBottom: '10px'}}>
                                        <div style={{
                                          color: 'var(--text-muted)',
                                          fontSize: '0.8rem',
                                          fontFamily: 'var(--font-ui)',
                                          marginBottom: '3px'
                                        }}>
                                          Focus:
                                        </div>
                                        <div style={{
                                          color: 'var(--text-soft)',
                                          fontSize: '0.9rem',
                                          fontFamily: 'var(--font-ui)'
                                        }}>
                                          {log.focus}
                                        </div>
                                      </div>
                                    )}
                                    {log.description && (
                                      <div style={{marginBottom: '10px'}}>
                                        <div style={{
                                          color: 'var(--text-muted)',
                                          fontSize: '0.8rem',
                                          fontFamily: 'var(--font-ui)',
                                          marginBottom: '3px'
                                        }}>
                                          Description:
                                        </div>
                                        <div style={{
                                          color: 'var(--text-soft)',
                                          fontSize: '0.9rem',
                                          fontFamily: 'var(--font-ui)'
                                        }}>
                                          {log.description}
                                        </div>
                                      </div>
                                    )}
                                    {log.takeAway && (
                                      <div style={{marginBottom: '15px'}}>
                                        <div style={{
                                          color: 'var(--text-muted)',
                                          fontSize: '0.8rem',
                                          fontFamily: 'var(--font-ui)',
                                          marginBottom: '3px'
                                        }}>
                                          Take Away:
                                        </div>
                                        <div style={{
                                          color: 'var(--text-soft)',
                                          fontSize: '0.9rem',
                                          fontFamily: 'var(--font-ui)',
                                          fontStyle: 'italic'
                                        }}>
                                          {log.takeAway}
                                        </div>
                                      </div>
                                    )}
                                    
                                    {/* Action Buttons */}
                                    <div style={{display: 'flex', gap: '10px'}}>
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setShowTimeLogger(true);
                                        }}
                                        style={{
                                          padding: '8px 16px',
                                          background: 'rgba(var(--accent-rgb), 0.2)',
                                          border: '1px solid rgba(var(--accent-rgb), 0.4)',
                                          borderRadius: '20px',
                                          color: 'var(--accent)',
                                          fontSize: '0.85rem',
                                          fontFamily: 'var(--font-ui)',
                                          cursor: 'pointer',
                                          transition: 'all 0.2s ease',
                                          fontWeight: '600'
                                        }}
                                      >
                                        Add Time
                                      </button>
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setStandaloneTimeLogs(prev => prev.filter(l => l.id !== log.id));
                                        }}
                                        style={{
                                          padding: '8px 16px',
                                          background: 'rgba(255, 75, 75, 0.2)',
                                          border: '1px solid rgba(255, 75, 75, 0.4)',
                                          borderRadius: '20px',
                                          color: '#ff6b6b',
                                          fontSize: '0.85rem',
                                          fontFamily: 'var(--font-ui)',
                                          cursor: 'pointer',
                                          transition: 'all 0.2s ease'
                                        }}
                                      >
                                        Delete
                                      </button>
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                        )}
                      </div>
                    )}

                    {/* Goal Time Logs */}
                    {groupedLogs.goal.length > 0 && (
                      <div>
                        <div 
                          onClick={() => setShowGoalTimeLogs(!showGoalTimeLogs)}
                          style={{
                            fontFamily: 'var(--font-ui)',
                            fontSize: '1.3rem',
                            fontWeight: '700',
                            color: 'var(--text)',
                            marginBottom: '15px',
                            paddingBottom: '10px',
                            borderBottom: '4px solid rgba(var(--accent-rgb), 0.3)',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            cursor: 'pointer'
                          }}>
                          <span>Goal Time Logs</span>
                          <span style={{
                            color: 'var(--accent)',
                            fontSize: '1rem',
                            fontWeight: '700'
                          }}>
                            {groupedLogs.goal.reduce((sum, log) => sum + log.minutes, 0)} min
                          </span>
                        </div>
                        {showGoalTimeLogs && (
                          <div style={{display: 'flex', flexDirection: 'column', gap: '10px'}}>
                          {groupedLogs.goal.map((log, index) => {
                            const isExpanded = expandedTimeLogId === `goal-${log.id}-${index}`;
                            return (
                              <div key={`goal-${log.id}-${index}`} style={{
                                padding: '15px',
                                background: 'rgba(var(--surface-raised-rgb), 0.6)',
                                borderRadius: '15px',
                                border: '2px solid rgba(var(--accent-rgb), 0.15)',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease'
                              }}
                              onClick={() => setExpandedTimeLogId(isExpanded ? null : `goal-${log.id}-${index}`)}
                              >
                                <div style={{
                                  display: 'flex',
                                  justifyContent: 'space-between',
                                  alignItems: 'center'
                                }}>
                                  <div style={{flex: 1}}>
                                    <div style={{
                                      color: '#999',
                                      fontSize: '0.85rem',
                                      fontFamily: 'var(--font-ui)'
                                    }}>
                                      {new Date(log.date).toLocaleDateString('en-US', { 
                                        month: 'short', 
                                        day: 'numeric',
                                        hour: 'numeric',
                                        minute: '2-digit'
                                      })}
                                    </div>
                                    <div style={{
                                      color: 'var(--text)',
                                      fontSize: '0.9rem',
                                      fontFamily: 'var(--font-ui)',
                                      marginTop: '3px'
                                    }}>
                                      {log.sourceName}
                                    </div>
                                  </div>
                                  <div style={{
                                    color: 'var(--accent)',
                                    fontSize: '1rem',
                                    fontWeight: '700',
                                    fontFamily: 'var(--font-ui)'
                                  }}>
                                    {log.minutes} min
                                  </div>
                                </div>
                                
                                {isExpanded && (
                                  <div style={{marginTop: '15px', paddingTop: '15px', borderTop: '1px solid rgba(var(--accent-rgb), 0.2)'}}>
                                    <div 
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setTimeLoggerContext({
                                          type: 'goal',
                                          id: log.sourceId,
                                          listName: log.listName
                                        });
                                        setShowTimeLogger(true);
                                      }}
                                      style={{cursor: 'pointer'}}
                                    >
                                      {log.focus && (
                                        <div style={{marginBottom: '10px'}}>
                                          <div style={{
                                            color: 'var(--text-muted)',
                                            fontSize: '0.8rem',
                                            fontFamily: 'var(--font-ui)',
                                            marginBottom: '3px'
                                          }}>
                                            Focus:
                                          </div>
                                          <div style={{
                                            color: 'var(--text-soft)',
                                            fontSize: '0.9rem',
                                            fontFamily: 'var(--font-ui)'
                                          }}>
                                            {log.focus}
                                          </div>
                                        </div>
                                      )}
                                      {log.description && (
                                        <div style={{marginBottom: '10px'}}>
                                          <div style={{
                                            color: 'var(--text-muted)',
                                            fontSize: '0.8rem',
                                            fontFamily: 'var(--font-ui)',
                                            marginBottom: '3px'
                                          }}>
                                            Description:
                                          </div>
                                          <div style={{
                                            color: 'var(--text-soft)',
                                            fontSize: '0.9rem',
                                            fontFamily: 'var(--font-ui)'
                                          }}>
                                            {log.description}
                                          </div>
                                        </div>
                                      )}
                                      {log.takeAway && (
                                        <div style={{marginBottom: '15px'}}>
                                          <div style={{
                                            color: 'var(--text-muted)',
                                            fontSize: '0.8rem',
                                            fontFamily: 'var(--font-ui)',
                                            marginBottom: '3px'
                                          }}>
                                            Take Away:
                                          </div>
                                          <div style={{
                                            color: 'var(--text-soft)',
                                            fontSize: '0.9rem',
                                            fontFamily: 'var(--font-ui)',
                                            fontStyle: 'italic'
                                          }}>
                                            {log.takeAway}
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                    
                                    {/* Add Time Button */}
                                    <div style={{display: 'flex', justifyContent: 'flex-end'}}>
                                      <button
                                        className="add-task-btn"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setTimeLoggerContext({
                                            type: 'goal',
                                            id: log.sourceId,
                                            listName: log.listName
                                          });
                                          setShowTimeLogger(true);
                                        }}
                                        style={{width: 'auto', padding: '12px 30px'}}
                                      >
                                        Add Time
                                      </button>
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                        )}
                      </div>
                    )}


                    {/* Journal Time Logs */}
                    {groupedLogs.journal.length > 0 && (
                      <div>
                        <div 
                          onClick={() => setShowJournalTimeLogs(!showJournalTimeLogs)}
                          style={{
                            fontFamily: 'var(--font-ui)',
                            fontSize: '1.3rem',
                            fontWeight: '700',
                            color: 'var(--text)',
                            marginBottom: '15px',
                            paddingBottom: '10px',
                            borderBottom: '4px solid rgba(var(--accent-rgb), 0.3)',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            cursor: 'pointer'
                          }}>
                          <span>Note Time Logs</span>
                          <span style={{
                            color: 'var(--accent)',
                            fontSize: '1rem',
                            fontWeight: '700'
                          }}>
                            {groupedLogs.journal.reduce((sum, log) => sum + log.minutes, 0)} min
                          </span>
                        </div>
                        {showJournalTimeLogs && (
                          <div style={{display: 'flex', flexDirection: 'column', gap: '10px'}}>
                            {groupedLogs.journal.map((log, index) => {
                            const isExpanded = expandedTimeLogId === `journal-${log.id}-${index}`;
                            return (
                              <div key={`journal-${log.id}-${index}`} style={{
                                padding: '15px',
                                background: 'rgba(var(--surface-raised-rgb), 0.6)',
                                borderRadius: '15px',
                                border: '2px solid rgba(var(--accent-rgb), 0.15)',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease'
                              }}
                              onClick={() => setExpandedTimeLogId(isExpanded ? null : `journal-${log.id}-${index}`)}
                              >
                                <div style={{
                                  display: 'flex',
                                  justifyContent: 'space-between',
                                  alignItems: 'center'
                                }}>
                                  <div style={{flex: 1}}>
                                    <div style={{
                                      color: '#999',
                                      fontSize: '0.85rem',
                                      fontFamily: 'var(--font-ui)'
                                    }}>
                                      {new Date(log.date).toLocaleDateString('en-US', { 
                                        month: 'short', 
                                        day: 'numeric',
                                        hour: 'numeric',
                                        minute: '2-digit'
                                      })}
                                    </div>
                                    <div style={{
                                      color: 'var(--text)',
                                      fontSize: '0.9rem',
                                      fontFamily: 'var(--font-ui)',
                                      marginTop: '3px'
                                    }}>
                                      {log.sourceName}
                                    </div>
                                  </div>
                                  <div style={{
                                    color: 'var(--accent)',
                                    fontSize: '1rem',
                                    fontWeight: '700',
                                    fontFamily: 'var(--font-ui)'
                                  }}>
                                    {log.minutes} min
                                  </div>
                                </div>
                                
                                {isExpanded && (
                                  <div style={{marginTop: '15px', paddingTop: '15px', borderTop: '1px solid rgba(var(--accent-rgb), 0.2)'}}>
                                    <div 
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setTimeLoggerContext({
                                          type: 'note',
                                          id: log.sourceId
                                        });
                                        setShowTimeLogger(true);
                                      }}
                                      style={{cursor: 'pointer'}}
                                    >
                                      {log.focus && (
                                        <div style={{marginBottom: '10px'}}>
                                          <div style={{
                                            color: 'var(--text-muted)',
                                            fontSize: '0.8rem',
                                            fontFamily: 'var(--font-ui)',
                                            marginBottom: '3px'
                                          }}>
                                            Focus:
                                          </div>
                                          <div style={{
                                            color: 'var(--text-soft)',
                                            fontSize: '0.9rem',
                                            fontFamily: 'var(--font-ui)'
                                          }}>
                                            {log.focus}
                                          </div>
                                        </div>
                                      )}
                                      {log.description && (
                                        <div style={{marginBottom: '10px'}}>
                                          <div style={{
                                            color: 'var(--text-muted)',
                                            fontSize: '0.8rem',
                                            fontFamily: 'var(--font-ui)',
                                            marginBottom: '3px'
                                          }}>
                                            Description:
                                          </div>
                                          <div style={{
                                            color: 'var(--text-soft)',
                                            fontSize: '0.9rem',
                                            fontFamily: 'var(--font-ui)'
                                          }}>
                                            {log.description}
                                          </div>
                                        </div>
                                      )}
                                      {log.takeAway && (
                                        <div style={{marginBottom: '15px'}}>
                                          <div style={{
                                            color: 'var(--text-muted)',
                                            fontSize: '0.8rem',
                                            fontFamily: 'var(--font-ui)',
                                            marginBottom: '3px'
                                          }}>
                                            Take Away:
                                          </div>
                                          <div style={{
                                            color: 'var(--text-soft)',
                                            fontSize: '0.9rem',
                                            fontFamily: 'var(--font-ui)',
                                            fontStyle: 'italic'
                                          }}>
                                            {log.takeAway}
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                    
                                    {/* Add Time Button */}
                                    <div style={{display: 'flex', justifyContent: 'flex-end'}}>
                                      <button
                                        className="add-task-btn"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setTimeLoggerContext({
                                            type: 'note',
                                            id: log.sourceId
                                          });
                                          setShowTimeLogger(true);
                                        }}
                                        style={{width: 'auto', padding: '12px 30px'}}
                                      >
                                        Add Time
                                      </button>
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                        )}
                      </div>
                    )}

                  </div>
                );
              })()}
            </div>

            {/* Time Logger Modal */}
            {showTimeLogger && (
              <div className="modal-overlay" onClick={() => {
                setShowTimeLogger(false);
                setIsLogging(false);
                setLoggedMinutes(0);
                                setLoggedSeconds(0);
                setLogStartTime(null);
                        setPausedTime(0);
                setTimeLogFocus('');
                setTimeLogDescription('');
                setTimeLogTakeAway('');
                setTimerDuration('');
              }}>
                <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{
                  width: '90%',
                  maxWidth: '500px',
                  textAlign: 'center',
                  padding: '20px',
                  maxHeight: '90vh',
                  overflowY: 'auto'
                }}>
                  {/* Fire Logo with Timer */}
                  <div 
                    onClick={() => {
                      // Toggle logging; loggedSeconds persists across pauses
                      setIsLogging(prev => !prev);
                    }}
                    style={{
                      cursor: 'pointer',
                      marginTop: '40px',
                      marginBottom: '15px',
                      display: 'inline-block',
                      transition: 'transform 0.2s ease'
                    }}
                  >
                    <div style={{
                      width: '180px',
                      height: '180px',
                      position: 'relative',
                      display: 'inline-block'
                    }}>
                      {/* Circular Progress Ring */}
                      <svg 
                        style={{
                          position: 'absolute',
                          top: '-15px',
                          left: '-15px',
                          width: '210px',
                          height: '210px',
                          transform: 'rotate(-90deg)',
                          pointerEvents: 'none'
                        }}
                      >
                        <circle
                          cx="105"
                          cy="105"
                          r="95"
                          fill="none"
                          stroke="rgba(var(--surface-alt-rgb), 0.3)"
                          strokeWidth="8"
                        />
                        {/* Always mounted, not conditional. A freshly mounted
                            element has no previous value to transition from, so
                            it would appear already at the one-second mark
                            instead of sweeping there. At full offset nothing is
                            drawn, so an idle ring is invisible anyway. */}
                        <circle
                          cx="105"
                          cy="105"
                          r="95"
                          fill="none"
                          strokeWidth="8"
                          strokeDasharray={RING_CIRCUMFERENCE}
                          strokeDashoffset={ringOffset}
                          strokeLinecap="round"
                          style={{
                            // var() only resolves as a CSS property, never as
                            // an SVG attribute - so stroke lives here
                            stroke: isLogging ? 'var(--accent)' : '#a0aec0',
                            // Interpolates between the once-a-second updates, on
                            // the compositor - far cheaper than re-rendering 20
                            // times a second, and smooth. linear rather than
                            // ease: easing would accelerate and settle inside
                            // every step, reading as a pulse once a second.
                            transition: ringTransition
                          }}
                        />
                      </svg>
                      
                      {/* Fire Icon */}
                      <div style={{
                        width: '100%',
                        height: '100%',
                        filter: isLogging ? 'drop-shadow(0 0 25px rgba(255, 69, 0, 0.8))' : 'drop-shadow(0 0 10px rgba(100, 100, 100, 0.3))',
                        // Desktop only: this animates drop-shadow (a paint
                        // property) with 45-60px blurs, so it repaints every
                        // frame for the whole session. Phones keep the static
                        // glow, which is computed once and cached.
                        animation: (isLogging && !isMobile) ? 'flameGlow 10s ease-in-out infinite' : 'none'
                      }}>
                        <svg version="1.0" xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 1280.000000 1280.000000"
                          preserveAspectRatio="xMidYMid meet"
                          style={{width: '100%', height: '100%'}}>
                          <g transform="translate(0.000000,1280.000000) scale(0.100000,-0.100000)"
                            fill={isLogging ? '#FF4500' : 'var(--surface-line)'} stroke="none">
                          <path d="M7090 12669 c-1 -257 -76 -628 -175 -871 -149 -365 -354 -643 -825
                          -1123 -562 -572 -1053 -1165 -1415 -1710 -256 -385 -443 -729 -568 -1045 -164
                          -415 -213 -716 -189 -1167 7 -126 17 -257 22 -293 4 -36 11 -87 15 -115 3 -27
                          17 -108 31 -180 66 -339 167 -634 321 -937 181 -358 383 -630 707 -954 206
                          -206 336 -319 558 -486 130 -98 458 -322 462 -316 1 1 20 53 40 113 45 131
                          132 315 211 452 58 99 233 361 296 443 231 303 515 606 864 926 411 375 725
                          680 839 814 99 117 243 309 323 432 261 403 385 922 386 1623 0 207 -4 314
                          -17 410 -76 586 -230 1136 -500 1782 -358 860 -885 1741 -1298 2168 l-87 90
                          -1 -56z"/>
                          <path d="M9510 9493 c0 -5 9 -55 21 -113 89 -462 132 -1021 110 -1453 -13
                          -249 -39 -482 -67 -597 -109 -438 -605 -1140 -1299 -1835 -126 -127 -291 -284
                          -365 -350 -160 -142 -223 -206 -374 -380 -276 -318 -452 -600 -476 -761 -5
                          -38 -19 -133 -31 -211 -21 -141 -21 -189 2 -261 8 -25 15 -32 28 -26 73 31
                          289 101 416 134 203 54 418 97 820 164 894 149 1116 222 1550 511 387 257 676
                          553 814 833 98 197 195 572 233 892 19 165 16 597 -5 780 -104 913 -509 1833
                          -1058 2404 -105 109 -294 276 -312 276 -4 0 -7 -3 -7 -7z"/>
                          <path d="M3355 8046 c-199 -134 -336 -247 -523 -430 -189 -186 -290 -306 -418
                          -498 -270 -403 -415 -856 -401 -1261 8 -258 75 -514 202 -772 237 -481 641
                          -873 1170 -1135 358 -177 715 -283 1170 -349 153 -22 511 -54 546 -49 16 2
                          -12 23 -107 82 -709 437 -1164 850 -1434 1303 -118 197 -228 493 -244 653 -4
                          36 -11 92 -16 125 -5 33 -16 116 -25 185 -8 69 -20 163 -26 210 -6 47 -13 196
                          -16 332 -5 240 4 411 38 673 5 44 12 98 15 120 3 22 9 65 14 95 5 30 12 73 16
                          95 26 174 135 576 188 698 5 9 4 17 0 17 -5 0 -72 -43 -149 -94z"/>
                        </g>
                      </svg>
                      </div>
                    </div>
                  </div>

                  {/* Timer Display */}
                  {loggedSeconds >= 60 && (
                    <div style={{
                      fontFamily: 'var(--font-ui)',
                      fontSize: '2rem',
                      fontWeight: '600',
                      color: isLogging ? 'var(--accent)' : '#a0aec0',
                      marginBottom: '15px',
                      letterSpacing: '0.05em'
                    }}>
                      {Math.floor(loggedSeconds / 60)} {Math.floor(loggedSeconds / 60) === 1 ? 'Min' : 'Mins'}
                    </div>
                  )}

                  {/* Timer Duration Selector */}
                  <div style={{textAlign: 'left', marginBottom: '20px'}}>
                    <label style={{
                      display: 'block',
                      color: 'var(--text-muted)',
                      fontSize: '0.9rem',
                      marginBottom: '5px',
                      fontFamily: 'var(--font-ui)'
                    }}>
                      Duration:
                    </label>
                    <div data-time-duration-dropdown style={{position: 'relative'}}>
                      <div
                        onClick={() => setTimeDurationDropdownOpen(!timeDurationDropdownOpen)}
                        style={{
                          width: '100%',
                          padding: '10px',
                          background: 'rgba(var(--surface-rgb), 1)',
                          border: '2px solid rgba(var(--accent-rgb), 0.3)',
                          borderRadius: '8px',
                          color: 'var(--text)',
                          fontSize: '1rem',
                          fontFamily: 'var(--font-ui)',
                          cursor: 'pointer',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          boxSizing: 'border-box'
                        }}
                      >
                        <span>{durationLabel(timerDuration === 0 ? '' : timerDuration)}</span>
                        <span style={{
                          transform: timeDurationDropdownOpen ? 'rotate(360deg)' : 'rotate(180deg)',
                          transition: 'transform 0.3s ease',
                          fontSize: '0.9rem',
                          display: 'inline-block'
                        }}>▼</span>
                      </div>

                      {/* Duration Options */}
                      {timeDurationDropdownOpen && (
                        <div style={{
                          position: 'absolute',
                          top: '100%',
                          left: '0',
                          right: '0',
                          marginTop: '-8px',
                          background: 'rgba(var(--surface-rgb), 1)',
                          border: '2px solid rgba(var(--accent-rgb), 0.3)',
                          borderRadius: '8px',
                          overflow: 'hidden',
                          zIndex: 1000,
                          boxShadow: '0 8px 24px rgba(var(--shadow-rgb), 0.4)'
                        }}>
                          {durationOptions.map((option, idx) => (
                            <div
                              key={option.value}
                              onClick={() => {
                                setTimerDuration(option.value === '' ? '' : option.value);
                                setTimeDurationDropdownOpen(false);
                                if (option.value === 'pomodoro') {
                                  // This tap is the user gesture that lets the
                                  // page make sound later.
                                  unlockAudio();
                                  // Fresh cycle, but loggedSeconds is left alone
                                  // on purpose - it may hold time you haven't
                                  // saved yet, and silently discarding it would
                                  // be worse than starting mid-count.
                                  resetPomodoroCycle();
                                  setIsLogging(true);
                                }
                              }}
                              style={{
                                padding: '10px',
                                color: 'var(--text)',
                                fontSize: '1rem',
                                cursor: 'pointer',
                                background: timerDuration === option.value ? 'rgba(var(--accent-rgb), 0.4)' : 'transparent',
                                borderBottom: idx < durationOptions.length - 1 ? '1px solid rgba(var(--accent-rgb), 0.2)' : 'none',
                                transition: 'background 0.2s ease',
                                fontFamily: 'var(--font-ui)'
                              }}
                              onMouseOver={(e) => e.currentTarget.style.background = 'rgba(var(--accent-rgb), 0.3)'}
                              onMouseOut={(e) => e.currentTarget.style.background = timerDuration === option.value ? 'rgba(var(--accent-rgb), 0.4)' : 'transparent'}
                            >
                              {option.label}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Focus Field */}
                  <div style={{textAlign: 'left', marginBottom: '15px'}}>
                    <label style={{
                      display: 'block',
                      color: 'var(--text-muted)',
                      fontSize: '0.9rem',
                      marginBottom: '5px',
                      fontFamily: 'var(--font-ui)'
                    }}>
                      Focus:
                    </label>
                    <input
                      type="text"
                      value={timeLogFocus}
                      onChange={(e) => setTimeLogFocus(e.target.value)}
                      placeholder="What are you focusing on?"
                      style={{
                        width: '100%',
                        padding: '10px',
                        background: 'rgba(var(--surface-rgb), 0.8)',
                        border: '2px solid rgba(var(--accent-rgb), 0.3)',
                        borderRadius: '8px',
                        color: 'var(--text)',
                        fontSize: '0.95rem',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>
                  
                  {/* Description Field */}
                  <div style={{textAlign: 'left', marginBottom: '15px'}}>
                    <label style={{
                      display: 'block',
                      color: 'var(--text-muted)',
                      fontSize: '0.9rem',
                      marginBottom: '5px',
                      fontFamily: 'var(--font-ui)'
                    }}>
                      Description:
                    </label>
                    <textarea
                      value={timeLogDescription}
                      onChange={(e) => setTimeLogDescription(e.target.value)}
                      placeholder="Optional notes..."
                      style={{
                        width: '100%',
                        minHeight: '60px',
                        padding: '10px',
                        background: 'rgba(var(--surface-rgb), 0.8)',
                        border: '2px solid rgba(var(--accent-rgb), 0.3)',
                        borderRadius: '8px',
                        color: 'var(--text)',
                        fontSize: '0.95rem',
                        fontFamily: 'inherit',
                        resize: 'vertical',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>

                  {/* Take Away Field */}
                  <div style={{textAlign: 'left', marginBottom: '15px'}}>
                    <label style={{
                      display: 'block',
                      color: 'var(--text-muted)',
                      fontSize: '0.9rem',
                      marginBottom: '5px',
                      fontFamily: 'var(--font-ui)'
                    }}>
                      Take Away:
                    </label>
                    <textarea
                      value={timeLogTakeAway}
                      onChange={(e) => setTimeLogTakeAway(e.target.value)}
                      placeholder="What did you learn or accomplish?"
                      style={{
                        width: '100%',
                        minHeight: '100px',
                        padding: '10px',
                        background: 'rgba(var(--surface-rgb), 0.8)',
                        border: '2px solid rgba(var(--accent-rgb), 0.3)',
                        borderRadius: '8px',
                        color: 'var(--text)',
                        fontSize: '0.95rem',
                        fontFamily: 'inherit',
                        resize: 'vertical',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>

                  {/* Instructions */}
                  <p style={{
                    color: 'var(--text-muted)',
                    fontSize: '0.9rem',
                    marginBottom: '20px'
                  }}>
                    {isLogging ? 'Click fire to stop timer' : 'Click fire to start logging'}
                  </p>

                  {/* Action Buttons */}
                  <div style={{display: 'flex', gap: '10px', justifyContent: 'center'}}>
                    <button 
                      className="edit-btn"
                      onClick={() => {
                        if (loggedMinutes > 0) {
                          const newTimeLog = {
                            id: makeId(),
                            minutes: loggedMinutes,
                            focus: timeLogFocus,
                            description: timeLogDescription,
                            takeAway: timeLogTakeAway,
                            date: new Date().toISOString()
                          };
                          
                          setStandaloneTimeLogs(prev => [newTimeLog, ...prev]);
                        }
                        
                        // Close modal and reset (always, even if 0 minutes)
                        setShowTimeLogger(false);
                        setIsLogging(false);
                        setLoggedMinutes(0);
                                setLoggedSeconds(0);
                        setLogStartTime(null);
                        setPausedTime(0);
                        setTimeLogFocus('');
                        setTimeLogDescription('');
                        setTimeLogTakeAway('');
                        setTimerDuration('');
                      }}
                      style={{width: 'auto', padding: '10px 30px'}}
                    >
                      Save
                    </button>
                    <button 
                      className="delete-btn"
                      onClick={() => {
                        setShowTimeLogger(false);
                        setIsLogging(false);
                        setLoggedMinutes(0);
                                setLoggedSeconds(0);
                        setLogStartTime(null);
                        setPausedTime(0);
                        setTimeLogFocus('');
                        setTimeLogDescription('');
                        setTimeLogTakeAway('');
                        setTimerDuration('');
                      }}
                      style={{width: 'auto', padding: '10px 30px'}}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {appMode === 'search' && (
          <div className="search-section">
            <h2>Search Tasks</h2>
            
            <div style={{ padding: '20px 40px' }}>
              <input
                type="text"
                className="search-box"
                placeholder="Search tasks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoFocus
                style={{
                  width: '100%',
                  padding: '12px',
                  marginBottom: '20px',
                  background: 'rgba(var(--surface-raised-rgb), 0.6)',
                  border: '2px solid rgba(var(--accent-rgb), 0.3)',
                  borderRadius: '10px',
                  color: 'var(--text)',
                  fontSize: '1rem',
                  fontFamily: 'var(--font-ui)',
                  boxSizing: 'border-box'
                }}
              />

              {!searchQuery ? (
                <div style={{display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '200px'}}>
                  <div style={{
                    width: '120px',
                    height: '120px',
                    position: 'relative',
                    display: 'inline-block'
                  }}>
                    {/* Background circle */}
                    <svg 
                      style={{
                        position: 'absolute',
                        top: '-10px',
                        left: '-10px',
                        width: '140px',
                        height: '140px',
                        transform: 'rotate(-90deg)',
                        pointerEvents: 'none'
                      }}
                    >
                      <circle
                        cx="70"
                        cy="70"
                        r="63"
                        fill="none"
                        stroke="rgba(var(--surface-alt-rgb), 0.3)"
                        strokeWidth="6"
                      />
                    </svg>
                    
                    {/* Dark Fire Icon */}
                    <svg version="1.0" xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 1280.000000 1280.000000"
                      preserveAspectRatio="xMidYMid meet"
                      style={{
                        width: '100%',
                        height: '100%',
                        filter: 'drop-shadow(0 0 10px rgba(100, 100, 100, 0.3))'
                      }}>
                      <g transform="translate(0.000000,1280.000000) scale(0.100000,-0.100000)"
                        fill="#3a3a4a" stroke="none">
                        <path d="M7090 12669 c-1 -257 -76 -628 -175 -871 -149 -365 -354 -643 -825
                        -1123 -562 -572 -1053 -1165 -1415 -1710 -256 -385 -443 -729 -568 -1045 -164
                        -415 -213 -716 -189 -1167 7 -126 17 -257 22 -293 4 -36 11 -87 15 -115 3 -27
                        17 -108 31 -180 66 -339 167 -634 321 -937 181 -358 383 -630 707 -954 206
                        -206 336 -319 558 -486 130 -98 458 -322 462 -316 1 1 20 53 40 113 45 131
                        132 315 211 452 58 99 233 361 296 443 231 303 515 606 864 926 411 375 725
                        680 839 814 99 117 243 309 323 432 261 403 385 922 386 1623 0 207 -4 314
                        -17 410 -76 586 -230 1136 -500 1782 -358 860 -885 1741 -1298 2168 l-87 90
                        -1 -56z"/>
                        <path d="M9510 9493 c0 -5 9 -55 21 -113 89 -462 132 -1021 110 -1453 -13
                        -249 -39 -482 -67 -597 -109 -438 -605 -1140 -1299 -1835 -126 -127 -291 -284
                        -365 -350 -160 -142 -223 -206 -374 -380 -276 -318 -452 -600 -476 -761 -5
                        -38 -19 -133 -31 -211 -21 -141 -21 -189 2 -261 8 -25 15 -32 28 -26 73 31
                        289 101 416 134 203 54 418 97 820 164 894 149 1116 222 1550 511 387 257 676
                        553 814 833 98 197 195 572 233 892 19 165 16 597 -5 780 -104 913 -509 1833
                        -1058 2404 -105 109 -294 276 -312 276 -4 0 -7 -3 -7 -7z"/>
                        <path d="M3355 8046 c-199 -134 -336 -247 -523 -430 -189 -186 -290 -306 -418
                        -498 -270 -403 -415 -856 -401 -1261 8 -258 75 -514 202 -772 237 -481 641
                        -873 1170 -1135 358 -177 715 -283 1170 -349 153 -22 511 -54 546 -49 16 2
                        -12 23 -107 82 -709 437 -1164 850 -1434 1303 -118 197 -228 493 -244 653 -4
                        36 -11 92 -16 125 -5 33 -16 116 -25 185 -8 69 -20 163 -26 210 -6 47 -13 196
                        -16 332 -5 240 4 411 38 673 5 44 12 98 15 120 3 22 9 65 14 95 5 30 12 73 16
                        95 26 174 135 576 188 698 5 9 4 17 0 17 -5 0 -72 -43 -149 -94z"/>
                      </g>
                    </svg>
                  </div>
                </div>
              ) : (
                <>
                  {(() => {
                    const searchResults = {
                      tasks: [],
                      projects: [],
                      goals: [],
                      notes: [],
                      timeLogs: []
                    };
                    
                    const query = searchQuery.toLowerCase();
                    
                    // Search Tasks
                    const listNames = visibleTaskLists;
                    const listLabels = Object.fromEntries(TASK_LISTS.map(k => [k, listSectionLabel(k)]));

                    listNames.forEach(listName => {
                      if (!allLists[listName]) return;
                      
                      const matchingTasks = allLists[listName].filter(task => 
                        task.text.toLowerCase().includes(query) ||
                        (task.details && task.details.toLowerCase().includes(query))
                      );

                      matchingTasks.forEach(task => {
                        searchResults.tasks.push({
                          item: task,
                          listName,
                          label: listLabels[listName]
                        });
                      });
                    });
                    
                    // Search Projects
                    if (isFeatureOn('projects')) Object.keys(projects).forEach(listName => {
                      if (!projects[listName] || !Array.isArray(projects[listName])) return;
                      
                      projects[listName].forEach(project => {
                        if (project.name.toLowerCase().includes(query) ||
                            (project.description && project.description.toLowerCase().includes(query))) {
                          searchResults.projects.push({
                            item: project,
                            listName,
                            label: listLabels[listName]
                          });
                        }
                      });
                    });
                    
                    // Search Goals
                    if (isFeatureOn('goals')) Object.keys(goals).forEach(listName => {
                      if (!goals[listName] || !Array.isArray(goals[listName])) return;
                      
                      goals[listName].forEach(goal => {
                        if (goal.name.toLowerCase().includes(query) ||
                            (goal.description && goal.description.toLowerCase().includes(query))) {
                          searchResults.goals.push({
                            item: goal,
                            listName,
                            label: listLabels[listName]
                          });
                        }
                      });
                    });
                    
                    // Search Notes
                    if (isFeatureOn('notes') && notes && notes.length > 0) {
                      notes.filter(note => note != null).forEach(note => {
                        if ((note.title && note.title.toLowerCase().includes(query)) ||
                            (note.content && note.content.toLowerCase().includes(query)) ||
                            (note.tags && note.tags.some(tag => tag && tag.toLowerCase().includes(query)))) {
                          searchResults.notes.push({
                            item: note
                          });
                        }
                      });
                    }
                    
                    // Search Time Logs
                    if (standaloneTimeLogs && standaloneTimeLogs.length > 0) {
                      standaloneTimeLogs.forEach(log => {
                        if (log.notes && log.notes.toLowerCase().includes(query)) {
                          searchResults.timeLogs.push({
                            item: log
                          });
                        }
                      });
                    }
                    
                    // Count total results
                    const totalResults = 
                      searchResults.tasks.length +
                      searchResults.projects.length +
                      searchResults.goals.length +
                      searchResults.notes.length +
                      searchResults.timeLogs.length;

                    if (totalResults === 0) {
                      return (
                        <div style={{
                          textAlign: 'center',
                          padding: '40px 20px',
                          color: 'var(--text-muted)',
                          fontSize: '1rem',
                          fontFamily: 'var(--font-ui)'
                        }}>
                          No results found for "{searchQuery}"
                        </div>
                      );
                    }

                    return (
                      <div>
                        {/* Tasks Results */}
                        {searchResults.tasks.length > 0 && (
                          <div style={{ marginBottom: '30px' }}>
                            <div className="list-section-header" style={{marginBottom: '15px'}}>
                              <span>Tasks</span>
                              <span className="badge work">{searchResults.tasks.length}</span>
                            </div>
                            {searchResults.tasks.map(result => (
                              <div key={result.item.id} style={{marginBottom: '15px'}}>
                                <div style={{fontSize: '0.85rem', color: '#7fb069', marginBottom: '5px', marginLeft: '10px'}}>
                                  {result.label}
                                </div>
                                <Task
                                  task={result.item}
                                  listName={result.listName}
                                  showMoveButtons={true}
                                />
                              </div>
                            ))}
                          </div>
                        )}
                        
                        {/* Projects Results */}
                        {searchResults.projects.length > 0 && (
                          <div style={{ marginBottom: '30px' }}>
                            <div className="list-section-header" style={{marginBottom: '15px'}}>
                              <span>Projects</span>
                              <span className="badge work">{searchResults.projects.length}</span>
                            </div>
                            {searchResults.projects.map(result => (
                              <div key={result.item.id} 
                                onClick={() => {
                                  setAppMode('projects');
                                  setCurrentList(result.listName);
                                }}
                                style={{
                                  background: 'rgba(var(--surface-raised-rgb), 0.6)',
                                  padding: '15px',
                                  borderRadius: '10px',
                                  marginBottom: '10px',
                                  cursor: 'pointer',
                                  border: '2px solid rgba(var(--accent-rgb), 0.3)',
                                  transition: 'all 0.2s'
                                }}
                                onMouseOver={(e) => e.currentTarget.style.borderColor = 'rgba(var(--accent-rgb), 0.6)'}
                                onMouseOut={(e) => e.currentTarget.style.borderColor = 'rgba(var(--accent-rgb), 0.3)'}
                              >
                                <div style={{fontSize: '0.85rem', color: '#7fb069', marginBottom: '5px'}}>
                                  {result.label}
                                </div>
                                <div style={{fontSize: '1.1rem', fontWeight: '600', color: 'var(--text)', marginBottom: '5px'}}>
                                  {result.item.name}
                                </div>
                                {result.item.description && (
                                  <div style={{fontSize: '0.9rem', color: 'var(--text-muted)'}}>
                                    {result.item.description}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                        
                        {/* Goals Results */}
                        {searchResults.goals.length > 0 && (
                          <div style={{ marginBottom: '30px' }}>
                            <div className="list-section-header" style={{marginBottom: '15px'}}>
                              <span>Goals</span>
                              <span className="badge work">{searchResults.goals.length}</span>
                            </div>
                            {searchResults.goals.map(result => (
                              <div key={result.item.id}
                                onClick={() => {
                                  setAppMode('goals');
                                  setCurrentList(result.listName);
                                }}
                                style={{
                                  background: 'rgba(var(--surface-raised-rgb), 0.6)',
                                  padding: '15px',
                                  borderRadius: '10px',
                                  marginBottom: '10px',
                                  cursor: 'pointer',
                                  border: '2px solid rgba(var(--accent-rgb), 0.3)',
                                  transition: 'all 0.2s'
                                }}
                                onMouseOver={(e) => e.currentTarget.style.borderColor = 'rgba(var(--accent-rgb), 0.6)'}
                                onMouseOut={(e) => e.currentTarget.style.borderColor = 'rgba(var(--accent-rgb), 0.3)'}
                              >
                                <div style={{fontSize: '0.85rem', color: '#7fb069', marginBottom: '5px'}}>
                                  {result.label}
                                </div>
                                <div style={{fontSize: '1.1rem', fontWeight: '600', color: 'var(--text)', marginBottom: '5px'}}>
                                  {result.item.name}
                                </div>
                                {result.item.description && (
                                  <div style={{fontSize: '0.9rem', color: 'var(--text-muted)'}}>
                                    {result.item.description}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                        
                        {/* Notes Results */}
                        {searchResults.notes.length > 0 && (
                          <div style={{ marginBottom: '30px' }}>
                            <div className="list-section-header" style={{marginBottom: '15px'}}>
                              <span>Notes</span>
                              <span className="badge work">{searchResults.notes.length}</span>
                            </div>
                            {searchResults.notes.map(result => (
                              <div key={result.item.id || Math.random()}
                                onClick={() => setAppMode('notes')}
                                style={{
                                  background: 'rgba(var(--surface-raised-rgb), 0.6)',
                                  padding: '15px',
                                  borderRadius: '10px',
                                  marginBottom: '10px',
                                  cursor: 'pointer',
                                  border: '2px solid rgba(var(--accent-rgb), 0.3)',
                                  transition: 'all 0.2s'
                                }}
                                onMouseOver={(e) => e.currentTarget.style.borderColor = 'rgba(var(--accent-rgb), 0.6)'}
                                onMouseOut={(e) => e.currentTarget.style.borderColor = 'rgba(var(--accent-rgb), 0.3)'}
                              >
                                <div style={{fontSize: '1.1rem', fontWeight: '600', color: 'var(--text)', marginBottom: '5px'}}>
                                  {result.item.title || 'Untitled Note'}
                                </div>
                                {result.item.content && (
                                  <div style={{fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '5px'}}>
                                    {result.item.content.substring(0, 100)}...
                                  </div>
                                )}
                                {result.item.tags && result.item.tags.length > 0 && (
                                  <div style={{display: 'flex', gap: '5px', flexWrap: 'wrap', marginTop: '8px'}}>
                                    {result.item.tags.map((tag, idx) => (
                                      <span key={tag || idx} style={{
                                        background: 'rgba(var(--accent-rgb), 0.3)',
                                        padding: '3px 8px',
                                        borderRadius: '12px',
                                        fontSize: '0.75rem',
                                        color: '#7fb069'
                                      }}>
                                        #{tag}
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                        
                        {/* Time Logs Results */}
                        {searchResults.timeLogs.length > 0 && (
                          <div style={{ marginBottom: '30px' }}>
                            <div className="list-section-header" style={{marginBottom: '15px'}}>
                              <span>Time Logs</span>
                              <span className="badge work">{searchResults.timeLogs.length}</span>
                            </div>
                            {searchResults.timeLogs.map(result => (
                              <div key={result.item.id}
                                onClick={() => setAppMode('time')}
                                style={{
                                  background: 'rgba(var(--surface-raised-rgb), 0.6)',
                                  padding: '15px',
                                  borderRadius: '10px',
                                  marginBottom: '10px',
                                  cursor: 'pointer',
                                  border: '2px solid rgba(var(--accent-rgb), 0.3)',
                                  transition: 'all 0.2s'
                                }}
                                onMouseOver={(e) => e.currentTarget.style.borderColor = 'rgba(var(--accent-rgb), 0.6)'}
                                onMouseOut={(e) => e.currentTarget.style.borderColor = 'rgba(var(--accent-rgb), 0.3)'}
                              >
                                <div style={{fontSize: '1rem', color: 'var(--text)', marginBottom: '5px'}}>
                                  {new Date(result.item.startTime).toLocaleString()}
                                </div>
                                <div style={{fontSize: '0.9rem', color: '#7fb069', marginBottom: '5px'}}>
                                  Duration: {result.item.duration}
                                </div>
                                {result.item.notes && (
                                  <div style={{fontSize: '0.9rem', color: 'var(--text-muted)'}}>
                                    {result.item.notes}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </>
              )}
            </div>
          </div>
        )}

        {appMode === 'archive' && (
          <div className="archive-section">
            <h2>Archive</h2>
            
            {/* Custom Dropdown for Archive Type */}
            <div 
              data-archive-dropdown
              style={{
                padding: '0 40px',
                marginBottom: '20px',
                position: 'relative'
              }}
            >
              <div
                onClick={() => setArchiveDropdownOpen(!archiveDropdownOpen)}
                style={{
                  width: '100%',
                  padding: '16px 24px',
                  background: 'rgba(var(--surface-rgb), 1)',
                  border: '2px solid rgba(var(--accent-rgb), 0.4)',
                  borderRadius: '50px',
                  color: 'var(--text)',
                  fontSize: '1rem',
                  fontWeight: 'normal',
                  fontFamily: 'var(--font-body)',
                  cursor: 'pointer',
                  boxSizing: 'border-box',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  transition: 'all 0.3s ease',
                  boxShadow: '0 4px 15px rgba(var(--shadow-rgb), 0.3)'
                }}
              >
                <span style={{ textTransform: 'capitalize' }}>{archiveType}</span>
                <span style={{
                  transform: archiveDropdownOpen ? 'rotate(360deg)' : 'rotate(180deg)',
                  transition: 'transform 0.3s ease',
                  fontSize: '1.2rem'
                }}>▼</span>
              </div>

              {/* Dropdown Options */}
              {archiveDropdownOpen && (
                <div style={{
                  position: 'absolute',
                  top: '100%',
                  left: '40px',
                  right: '40px',
                  marginTop: '-10px',
                  background: 'rgba(var(--surface-rgb), 1)',
                  border: '2px solid rgba(var(--accent-rgb), 0.4)',
                  borderRadius: '20px',
                  overflow: 'hidden',
                  zIndex: 1000,
                  boxShadow: '0 8px 24px rgba(var(--shadow-rgb), 0.4)'
                }}>
                  {['tasks', 'goals', 'projects'].filter(o => o === 'tasks' || isFeatureOn(o)).map((option, idx) => (
                    <div
                      key={option}
                      onClick={() => {
                        setArchiveType(option);
                        setArchiveDropdownOpen(false);
                      }}
                      style={{
                        padding: '16px 24px',
                        color: 'var(--text)',
                        fontSize: '1rem',
                        fontFamily: 'var(--font-body)',
                        cursor: 'pointer',
                        background: archiveType === option ? 'rgba(var(--accent-rgb), 0.4)' : 'transparent',
                        borderBottom: idx < 2 ? '1px solid rgba(var(--accent-rgb), 0.2)' : 'none',
                        transition: 'background 0.2s ease',
                        textTransform: 'capitalize'
                      }}
                      onMouseOver={(e) => e.currentTarget.style.background = 'rgba(var(--accent-rgb), 0.3)'}
                      onMouseOut={(e) => e.currentTarget.style.background = archiveType === option ? 'rgba(var(--accent-rgb), 0.4)' : 'transparent'}
                    >
                      {option}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Seafoam Divider */}
            <div style={{
              height: '2px',
              background: 'rgba(var(--accent-rgb), 0.3)',
              margin: '20px 40px',
              borderRadius: '2px'
            }} />
            
            {/* All Button - Full Width */}
            <div style={{
              padding: '0 40px',
              marginBottom: '15px'
            }}>
              <button 
                className={`tab ${currentList === 'master' ? 'active' : ''}`}
                onClick={() => setCurrentList('master')}
                style={{
                  width: '100%',
                  display: 'block'
                }}
              >
                All
              </button>
            </div>

            {/* Other List Buttons */}
            <div className="tabs">
              {visibleTaskLists.map(key => (
                <button
                  key={key}
                  className={`tab ${currentList === key ? 'active' : ''}`}
                  onClick={() => setCurrentList(key)}
                >
                  {listLabel(key)}
                </button>
              ))}
            </div>

            <div className="archived-tasks-container">
              {(() => {
                // Determine what to show based on archiveType
                if (archiveType === 'tasks') {
                  const tasksToShow = currentList === 'master' 
                    ? Object.entries(archivedTasks).flatMap(([listName, tasks]) => 
                        tasks.map(task => ({ ...task, listName }))
                      )
                    : archivedTasks[currentList] || [];

                  if (tasksToShow.length === 0) {
                    return (
                      <div className="empty-state" style={{display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '300px'}}>
                        <div style={{
                          width: '180px',
                          height: '180px',
                          position: 'relative',
                          display: 'inline-block'
                        }}>
                          {/* Background circle */}
                          <svg 
                            style={{
                              position: 'absolute',
                              top: '-15px',
                              left: '-15px',
                              width: '210px',
                              height: '210px',
                              transform: 'rotate(-90deg)',
                              pointerEvents: 'none'
                            }}
                          >
                            <circle
                              cx="105"
                              cy="105"
                              r="95"
                              fill="none"
                              stroke="rgba(var(--surface-alt-rgb), 0.3)"
                              strokeWidth="8"
                            />
                          </svg>
                          
                          {/* Dark Fire Icon */}
                          <svg version="1.0" xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 1280.000000 1280.000000"
                            preserveAspectRatio="xMidYMid meet"
                            style={{
                              width: '100%',
                              height: '100%',
                              filter: 'drop-shadow(0 0 10px rgba(100, 100, 100, 0.3))'
                            }}>
                          <g transform="translate(0.000000,1280.000000) scale(0.100000,-0.100000)"
                            fill="#3a3a4a" stroke="none">
                            <path d="M7090 12669 c-1 -257 -76 -628 -175 -871 -149 -365 -354 -643 -825
                            -1123 -562 -572 -1053 -1165 -1415 -1710 -256 -385 -443 -729 -568 -1045 -164
                            -415 -213 -716 -189 -1167 7 -126 17 -257 22 -293 4 -36 11 -87 15 -115 3 -27
                            17 -108 31 -180 66 -339 167 -634 321 -937 181 -358 383 -630 707 -954 206
                            -206 336 -319 558 -486 130 -98 458 -322 462 -316 1 1 20 53 40 113 45 131
                            132 315 211 452 58 99 233 361 296 443 231 303 515 606 864 926 411 375 725
                            680 839 814 99 117 243 309 323 432 261 403 385 922 386 1623 0 207 -4 314
                            -17 410 -76 586 -230 1136 -500 1782 -358 860 -885 1741 -1298 2168 l-87 90
                            -1 -56z"/>
                            <path d="M9510 9493 c0 -5 9 -55 21 -113 89 -462 132 -1021 110 -1453 -13
                            -249 -39 -482 -67 -597 -109 -438 -605 -1140 -1299 -1835 -126 -127 -291 -284
                            -365 -350 -160 -142 -223 -206 -374 -380 -276 -318 -452 -600 -476 -761 -5
                            -38 -19 -133 -31 -211 -21 -141 -21 -189 2 -261 8 -25 15 -32 28 -26 73 31
                            289 101 416 134 203 54 418 97 820 164 894 149 1116 222 1550 511 387 257 676
                            553 814 833 98 197 195 572 233 892 19 165 16 597 -5 780 -104 913 -509 1833
                            -1058 2404 -105 109 -294 276 -312 276 -4 0 -7 -3 -7 -7z"/>
                            <path d="M3355 8046 c-199 -134 -336 -247 -523 -430 -189 -186 -290 -306 -418
                            -498 -270 -403 -415 -856 -401 -1261 8 -258 75 -514 202 -772 237 -481 641
                            -873 1170 -1135 358 -177 715 -283 1170 -349 153 -22 511 -54 546 -49 16 2
                            -12 23 -107 82 -709 437 -1164 850 -1434 1303 -118 197 -228 493 -244 653 -4
                            36 -11 92 -16 125 -5 33 -16 116 -25 185 -8 69 -20 163 -26 210 -6 47 -13 196
                            -16 332 -5 240 4 411 38 673 5 44 12 98 15 120 3 22 9 65 14 95 5 30 12 73 16
                            95 26 174 135 576 188 698 5 9 4 17 0 17 -5 0 -72 -43 -149 -94z"/>
                          </g>
                        </svg>
                      </div>
                    </div>
                  );
                }

                if (currentList === 'master') {
                  const grouped = {};
                  tasksToShow.forEach(task => {
                    if (!grouped[task.listName]) grouped[task.listName] = [];
                    grouped[task.listName].push(task);
                  });

                  return Object.entries(grouped).map(([listName, tasks]) => (
                    <div key={listName} className="archive-list-section">
                      <div 
                        className="section-header archive-section-header" 
                        style={{
                          textTransform: 'capitalize', 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'space-between',
                          cursor: 'pointer'
                        }}
                        onClick={() => toggleArchiveSection(`archive-tasks-${listName}`)}
                      >
                        <span>{listName}</span>
                        <span className={`badge ${listName}`}>{tasks.length}</span>
                      </div>
                      {!isArchiveSectionCollapsed(`archive-tasks-${listName}`) && tasks.map((task, idx) => {
                        return (
                          <div key={task.id ?? idx} className="archived-task">
                            <div className="task-text">{task.text}</div>
                            <div className="task-meta">
                              {task.completedAt && (
                                <span className="completed-date">
                                  Completed {new Date(task.completedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                </span>
                              )}
                              {task.archivedAt && (
                                <span className="archived-date">
                                  Archived {new Date(task.archivedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                </span>
                              )}
                            </div>
                            <div className="archived-task-actions">
                              <button
                                className="edit-btn"
                                onClick={() => unarchiveTask(listName, task.id)}
                              >
                                Unarchive
                              </button>
                              <button
                                className="delete-btn"
                                onClick={() => deleteArchivedTask(listName, task.id)}
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ));
                } else {
                  return tasksToShow.map((task, idx) => (
                    <div key={idx} className="archived-task">
                      <div className="task-text">{task.text}</div>
                      <div className="task-meta">
                        {task.completedAt && (
                          <span className="completed-date">
                            Completed {new Date(task.completedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </span>
                        )}
                        {task.archivedAt && (
                          <span className="archived-date">
                            Archived {new Date(task.archivedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </span>
                        )}
                      </div>
                      <div className="archived-task-actions">
                        <button
                          className="edit-btn"
                          onClick={() => unarchiveTask(currentList, idx)}
                        >
                          Unarchive
                        </button>
                        <button
                          className="delete-btn"
                          onClick={() => deleteArchivedTask(currentList, idx)}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ));
                }
                }
                
                // GOALS ARCHIVE
                else if (archiveType === 'goals') {
                  const goalsToShow = currentList === 'master'
                    ? Object.entries(goals).flatMap(([listName, goalList]) =>
                        (Array.isArray(goalList) ? goalList : []).filter(g => g.archived).map(goal => ({ ...goal, listName }))
                      )
                    : (goals[currentList] || []).filter(g => g.archived);

                  if (goalsToShow.length === 0) {
                    return (
                      <div className="empty-state" style={{display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '300px'}}>
                        <div style={{
                          width: '180px',
                          height: '180px',
                          position: 'relative',
                          display: 'inline-block'
                        }}>
                          {/* Background circle */}
                          <svg 
                            style={{
                              position: 'absolute',
                              top: '-15px',
                              left: '-15px',
                              width: '210px',
                              height: '210px',
                              transform: 'rotate(-90deg)',
                              pointerEvents: 'none'
                            }}
                          >
                            <circle
                              cx="105"
                              cy="105"
                              r="95"
                              fill="none"
                              stroke="rgba(var(--surface-alt-rgb), 0.3)"
                              strokeWidth="8"
                            />
                          </svg>
                          
                          {/* Dark Fire Icon */}
                          <svg version="1.0" xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 1280.000000 1280.000000"
                            preserveAspectRatio="xMidYMid meet"
                            style={{
                              width: '100%',
                              height: '100%',
                              filter: 'drop-shadow(0 0 10px rgba(100, 100, 100, 0.3))'
                            }}>
                          <g transform="translate(0.000000,1280.000000) scale(0.100000,-0.100000)"
                            fill="#3a3a4a" stroke="none">
                            <path d="M7090 12669 c-1 -257 -76 -628 -175 -871 -149 -365 -354 -643 -825
                            -1123 -562 -572 -1053 -1165 -1415 -1710 -256 -385 -443 -729 -568 -1045 -164
                            -415 -213 -716 -189 -1167 7 -126 17 -257 22 -293 4 -36 11 -87 15 -115 3 -27
                            17 -108 31 -180 66 -339 167 -634 321 -937 181 -358 383 -630 707 -954 206
                            -206 336 -319 558 -486 130 -98 458 -322 462 -316 1 1 20 53 40 113 45 131
                            132 315 211 452 58 99 233 361 296 443 231 303 515 606 864 926 411 375 725
                            680 839 814 99 117 243 309 323 432 261 403 385 922 386 1623 0 207 -4 314
                            -17 410 -76 586 -230 1136 -500 1782 -358 860 -885 1741 -1298 2168 l-87 90
                            -1 -56z"/>
                            <path d="M9510 9493 c0 -5 9 -55 21 -113 89 -462 132 -1021 110 -1453 -13
                            -249 -39 -482 -67 -597 -109 -438 -605 -1140 -1299 -1835 -126 -127 -291 -284
                            -365 -350 -160 -142 -223 -206 -374 -380 -276 -318 -452 -600 -476 -761 -5
                            -38 -19 -133 -31 -211 -21 -141 -21 -189 2 -261 8 -25 15 -32 28 -26 73 31
                            289 101 416 134 203 54 418 97 820 164 894 149 1116 222 1550 511 387 257 676
                            553 814 833 98 197 195 572 233 892 19 165 16 597 -5 780 -104 913 -509 1833
                            -1058 2404 -105 109 -294 276 -312 276 -4 0 -7 -3 -7 -7z"/>
                            <path d="M3355 8046 c-199 -134 -336 -247 -523 -430 -189 -186 -290 -306 -418
                            -498 -270 -403 -415 -856 -401 -1261 8 -258 75 -514 202 -772 237 -481 641
                            -873 1170 -1135 358 -177 715 -283 1170 -349 153 -22 511 -54 546 -49 16 2
                            -12 23 -107 82 -709 437 -1164 850 -1434 1303 -118 197 -228 493 -244 653 -4
                            36 -11 92 -16 125 -5 33 -16 116 -25 185 -8 69 -20 163 -26 210 -6 47 -13 196
                            -16 332 -5 240 4 411 38 673 5 44 12 98 15 120 3 22 9 65 14 95 5 30 12 73 16
                            95 26 174 135 576 188 698 5 9 4 17 0 17 -5 0 -72 -43 -149 -94z"/>
                          </g>
                        </svg>
                      </div>
                    </div>
                    );
                  }

                  if (currentList === 'master') {
                    const grouped = {};
                    goalsToShow.forEach(goal => {
                      if (!grouped[goal.listName]) grouped[goal.listName] = [];
                      grouped[goal.listName].push(goal);
                    });

                    return Object.entries(grouped).map(([listName, goalsList]) => (
                      <div key={listName} className="archive-list-section">
                        <div 
                          className="section-header archive-section-header" 
                          style={{
                            textTransform: 'capitalize', 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'space-between',
                            cursor: 'pointer'
                          }}
                          onClick={() => toggleArchiveSection(`archive-goals-${listName}`)}
                        >
                          <span>{listName}</span>
                          <span className={`badge ${listName}`}>{goalsList.length}</span>
                        </div>
                        {!isArchiveSectionCollapsed(`archive-goals-${listName}`) && goalsList.map((goal, idx) => (
                          <div key={goal.id} className="archived-task">
                            <div className="task-text" style={{fontWeight: '600'}}>{goal.name.replace(/[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu, '').trim()}</div>
                            {goal.description && (
                              <div style={{color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '5px'}}>
                                {goal.description}
                              </div>
                            )}
                            <div className="task-meta">
                              {goal.startDate && goal.endDate && (
                                <span style={{color: 'var(--accent)', fontSize: '0.85rem', marginRight: '15px'}}>
                                  {new Date(goal.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {new Date(goal.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                </span>
                              )}
                              {goal.archivedAt && (
                                <span className="archived-date">
                                  Archived {new Date(goal.archivedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                </span>
                              )}
                            </div>
                            <div className="archived-task-actions">
                              <button
                                className="edit-btn"
                                onClick={() => {
                                  setGoals(prev => ({
                                    ...prev,
                                    [listName]: prev[listName].map(g =>
                                      g.id === goal.id ? { ...g, archived: false, archivedAt: null } : g
                                    )
                                  }));
                                }}
                              >
                                Unarchive
                              </button>
                              <button
                                className="delete-btn"
                                onClick={async () => {
                                  if (await confirmAction(`Delete goal "${goal.name}"?`)) {
                                    deleteGoal(listName, goal.id);
                                  }
                                }}
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ));
                  } else {
                    return goalsToShow.map((goal, idx) => (
                      <div key={goal.id} className="archived-task">
                        <div className="task-text" style={{fontWeight: '600'}}>{goal.name.replace(/[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu, '').trim()}</div>
                        {goal.description && (
                          <div style={{color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '5px'}}>
                            {goal.description}
                          </div>
                        )}
                        <div className="task-meta">
                          {goal.startDate && goal.endDate && (
                            <span style={{color: 'var(--accent)', fontSize: '0.85rem', marginRight: '15px'}}>
                              {new Date(goal.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {new Date(goal.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                            </span>
                          )}
                          {goal.archivedAt && (
                            <span className="archived-date">
                              Archived {new Date(goal.archivedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                            </span>
                          )}
                        </div>
                        <div className="archived-task-actions">
                          <button
                            className="edit-btn"
                            onClick={() => {
                              setGoals(prev => ({
                                ...prev,
                                [currentList]: prev[currentList].map(g =>
                                  g.id === goal.id ? { ...g, archived: false, archivedAt: null } : g
                                )
                              }));
                            }}
                          >
                            Unarchive
                          </button>
                          <button
                            className="delete-btn"
                            onClick={async () => {
                              if (await confirmAction(`Delete goal "${goal.name}"?`)) {
                                deleteGoal(currentList, goal.id);
                              }
                            }}
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    ));
                  }
                }
                
                // PROJECTS ARCHIVE
                else if (archiveType === 'projects') {
                  const projectsToShow = currentList === 'master'
                    ? Object.entries(projects).flatMap(([listName, projectList]) =>
                        (Array.isArray(projectList) ? projectList : []).filter(p => p.archived).map(project => ({ ...project, listName }))
                      )
                    : (projects[currentList] || []).filter(p => p.archived);

                  if (projectsToShow.length === 0) {
                    return (
                      <div className="empty-state" style={{display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '300px'}}>
                        <div style={{
                          width: '180px',
                          height: '180px',
                          position: 'relative',
                          display: 'inline-block'
                        }}>
                          {/* Background circle */}
                          <svg 
                            style={{
                              position: 'absolute',
                              top: '-15px',
                              left: '-15px',
                              width: '210px',
                              height: '210px',
                              transform: 'rotate(-90deg)',
                              pointerEvents: 'none'
                            }}
                          >
                            <circle
                              cx="105"
                              cy="105"
                              r="95"
                              fill="none"
                              stroke="rgba(var(--surface-alt-rgb), 0.3)"
                              strokeWidth="8"
                            />
                          </svg>
                          
                          {/* Dark Fire Icon */}
                          <svg version="1.0" xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 1280.000000 1280.000000"
                            preserveAspectRatio="xMidYMid meet"
                            style={{
                              width: '100%',
                              height: '100%',
                              filter: 'drop-shadow(0 0 10px rgba(100, 100, 100, 0.3))'
                            }}>
                          <g transform="translate(0.000000,1280.000000) scale(0.100000,-0.100000)"
                            fill="#3a3a4a" stroke="none">
                            <path d="M7090 12669 c-1 -257 -76 -628 -175 -871 -149 -365 -354 -643 -825
                            -1123 -562 -572 -1053 -1165 -1415 -1710 -256 -385 -443 -729 -568 -1045 -164
                            -415 -213 -716 -189 -1167 7 -126 17 -257 22 -293 4 -36 11 -87 15 -115 3 -27
                            17 -108 31 -180 66 -339 167 -634 321 -937 181 -358 383 -630 707 -954 206
                            -206 336 -319 558 -486 130 -98 458 -322 462 -316 1 1 20 53 40 113 45 131
                            132 315 211 452 58 99 233 361 296 443 231 303 515 606 864 926 411 375 725
                            680 839 814 99 117 243 309 323 432 261 403 385 922 386 1623 0 207 -4 314
                            -17 410 -76 586 -230 1136 -500 1782 -358 860 -885 1741 -1298 2168 l-87 90
                            -1 -56z"/>
                            <path d="M9510 9493 c0 -5 9 -55 21 -113 89 -462 132 -1021 110 -1453 -13
                            -249 -39 -482 -67 -597 -109 -438 -605 -1140 -1299 -1835 -126 -127 -291 -284
                            -365 -350 -160 -142 -223 -206 -374 -380 -276 -318 -452 -600 -476 -761 -5
                            -38 -19 -133 -31 -211 -21 -141 -21 -189 2 -261 8 -25 15 -32 28 -26 73 31
                            289 101 416 134 203 54 418 97 820 164 894 149 1116 222 1550 511 387 257 676
                            553 814 833 98 197 195 572 233 892 19 165 16 597 -5 780 -104 913 -509 1833
                            -1058 2404 -105 109 -294 276 -312 276 -4 0 -7 -3 -7 -7z"/>
                            <path d="M3355 8046 c-199 -134 -336 -247 -523 -430 -189 -186 -290 -306 -418
                            -498 -270 -403 -415 -856 -401 -1261 8 -258 75 -514 202 -772 237 -481 641
                            -873 1170 -1135 358 -177 715 -283 1170 -349 153 -22 511 -54 546 -49 16 2
                            -12 23 -107 82 -709 437 -1164 850 -1434 1303 -118 197 -228 493 -244 653 -4
                            36 -11 92 -16 125 -5 33 -16 116 -25 185 -8 69 -20 163 -26 210 -6 47 -13 196
                            -16 332 -5 240 4 411 38 673 5 44 12 98 15 120 3 22 9 65 14 95 5 30 12 73 16
                            95 26 174 135 576 188 698 5 9 4 17 0 17 -5 0 -72 -43 -149 -94z"/>
                          </g>
                        </svg>
                      </div>
                    </div>
                    );
                  }

                  if (currentList === 'master') {
                    const grouped = {};
                    projectsToShow.forEach(project => {
                      if (!grouped[project.listName]) grouped[project.listName] = [];
                      grouped[project.listName].push(project);
                    });

                    return Object.entries(grouped).map(([listName, projectsList]) => (
                      <div key={listName} className="archive-list-section">
                        <div 
                          className="section-header archive-section-header" 
                          style={{
                            textTransform: 'capitalize', 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'space-between',
                            cursor: 'pointer'
                          }}
                          onClick={() => toggleArchiveSection(`archive-projects-${listName}`)}
                        >
                          <span>{listName}</span>
                          <span className={`badge ${listName}`}>{projectsList.length}</span>
                        </div>
                        {!isArchiveSectionCollapsed(`archive-projects-${listName}`) && projectsList.map((project, idx) => (
                          <div key={project.id} className="archived-task">
                            <div className="task-text" style={{fontWeight: '600'}}><ProjectIcon size={14} /> {project.name}</div>
                            {project.description && (
                              <div style={{color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '5px'}}>
                                {project.description}
                              </div>
                            )}
                            <div className="task-meta">
                              {project.startDate && project.endDate && (
                                <span style={{color: 'var(--accent)', fontSize: '0.85rem', marginRight: '15px'}}>
                                  {new Date(project.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {new Date(project.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                </span>
                              )}
                              {project.archivedAt && (
                                <span className="archived-date">
                                  Archived {new Date(project.archivedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                </span>
                              )}
                            </div>
                            <div className="archived-task-actions">
                              <button
                                className="edit-btn"
                                onClick={() => {
                                  setProjects(prev => ({
                                    ...prev,
                                    [listName]: prev[listName].map(p =>
                                      p.id === project.id ? { ...p, archived: false, archivedAt: null } : p
                                    )
                                  }));
                                }}
                              >
                                Unarchive
                              </button>
                              <button
                                className="delete-btn"
                                onClick={async () => {
                                  if (await confirmAction(`Delete project "${project.name}"?`)) {
                                    deleteProject(listName, project.id);
                                  }
                                }}
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ));
                  } else {
                    return projectsToShow.map((project, idx) => (
                      <div key={project.id} className="archived-task">
                        <div className="task-text" style={{fontWeight: '600'}}><ProjectIcon size={14} /> {project.name}</div>
                        {project.description && (
                          <div style={{color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '5px'}}>
                            {project.description}
                          </div>
                        )}
                        <div className="task-meta">
                          {project.startDate && project.endDate && (
                            <span style={{color: 'var(--accent)', fontSize: '0.85rem', marginRight: '15px'}}>
                              {new Date(project.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {new Date(project.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                            </span>
                          )}
                          {project.archivedAt && (
                            <span className="archived-date">
                              Archived {new Date(project.archivedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                            </span>
                          )}
                        </div>
                        <div className="archived-task-actions">
                          <button
                            className="edit-btn"
                            onClick={() => {
                              setProjects(prev => ({
                                ...prev,
                                [currentList]: prev[currentList].map(p =>
                                  p.id === project.id ? { ...p, archived: false, archivedAt: null } : p
                                )
                              }));
                            }}
                          >
                            Unarchive
                          </button>
                          <button
                            className="delete-btn"
                            onClick={async () => {
                              if (await confirmAction(`Delete project "${project.name}"?`)) {
                                deleteProject(currentList, project.id);
                              }
                            }}
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    ));
                  }
                }
              })()}
            </div>
          </div>
        )}

        {appMode === 'settings' && (
          <div className="settings-section" style={{ padding: isMobile ? '12px 0 32px' : '20px 40px 40px' }}>
            {(() => {
              const card = {
                background: 'rgba(var(--surface-raised-rgb), 0.4)',
                border: '2px solid rgba(var(--accent-rgb), 0.2)',
                borderRadius: '12px',
                padding: isMobile ? '16px' : '20px 24px',
                marginBottom: '18px'
              };
              const heading = {
                color: 'var(--text)', fontSize: '1.05rem', fontWeight: '700',
                fontFamily: 'var(--font-ui)', marginBottom: '4px'
              };
              const sub = {
                color: 'var(--text-muted)', fontSize: '0.82rem',
                fontFamily: 'var(--font-ui)', marginBottom: '16px', lineHeight: 1.45
              };
              // For grouping within a card: lighter than `heading` so the card
              // still reads as one thing, heavier than `label` so it doesn't
              // look like a field name.
              const subheading = {
                color: 'var(--text)', fontSize: '0.92rem', fontWeight: '700',
                fontFamily: 'var(--font-ui)', marginBottom: '4px'
              };
              const divider = {
                borderTop: '1px solid rgba(var(--accent-rgb), 0.15)',
                margin: '20px 0 16px'
              };

              // One row renderer, used by both the personal and shared groups.
              // The row is 120+ lines of drag handlers, rename field, hide
              // toggle and delete - duplicating it per group would guarantee
              // the two drift apart.
              const renderListRow = (key, idx) => {
        const hidden = isListHidden(key);
        const isDragging = draggingList === key;
        const isDragTarget = dragOverList === key && draggingList && draggingList !== key;
        return (
          <div
            key={key}
            draggable
            onDragStart={(e) => {
              setDraggingList(key);
              e.dataTransfer.effectAllowed = 'move';
              // Firefox needs data set or the drag never starts
              e.dataTransfer.setData('text/plain', key);
            }}
            onDragOver={(e) => { e.preventDefault(); setDragOverList(key); }}
            onDragLeave={() => setDragOverList(prev => (prev === key ? null : prev))}
            onDrop={(e) => {
              e.preventDefault();
              if (draggingList) reorderList(draggingList, key);
              setDraggingList(null);
              setDragOverList(null);
            }}
            onDragEnd={() => { setDraggingList(null); setDragOverList(null); }}
            style={{
              display: 'flex', alignItems: 'center', gap: '10px',
              padding: '10px 0', flexWrap: 'wrap',
              borderBottom: '1px solid rgba(var(--border-rgb), 0.18)',
              borderTop: isDragTarget ? '2px solid rgba(var(--accent-rgb), 0.9)' : '2px solid transparent',
              opacity: isDragging ? 0.4 : (hidden ? 0.55 : 1),
              transition: 'opacity 0.2s ease'
            }}
          >
            <span
              title="Drag to reorder"
              style={{
                cursor: 'grab', color: 'var(--text-muted)', fontSize: '1rem',
                lineHeight: 1, userSelect: 'none', flexShrink: 0
              }}
            >
              ⠿
            </span>

            <input
              type="text"
              value={(settings.listLabels && settings.listLabels[key]) ?? DEFAULT_LIST_LABELS[key]}
              onChange={(e) => updateSetting('listLabels', {
                ...(settings.listLabels || {}),
                [key]: e.target.value
              })}
              placeholder={DEFAULT_LIST_LABELS[key]}
              maxLength={18}
              // Dragging the row shouldn't start from the text field
              draggable={false}
              onMouseDown={(e) => e.stopPropagation()}
              style={{
                flex: 1, minWidth: '110px', padding: '9px 10px',
                background: 'rgba(var(--surface-rgb), 1)',
                border: '2px solid rgba(var(--accent-rgb), 0.3)',
                borderRadius: '8px', color: 'var(--text)', fontSize: '0.92rem',
                fontFamily: 'var(--font-ui)', boxSizing: 'border-box'
              }}
            />

            {/* This slot is fixed width whether or not it holds anything, so
                the arrows and toggle line up down the column. The badge sat
                after them before, which pushed every shared row's controls out
                of alignment with the rest. */}
            <span style={{
              minWidth: '62px', display: 'flex', justifyContent: 'flex-start', flexShrink: 0
            }}>
              {isSharedList(key) && (
                <span style={{
                  fontSize: '0.62rem', fontWeight: 700, letterSpacing: '0.5px',
                  textTransform: 'uppercase', padding: '3px 8px', borderRadius: '8px',
                  background: 'rgba(var(--partner-rgb), 0.18)',
                  border: '1px solid rgba(var(--partner-rgb), 0.45)',
                  color: 'var(--partner)', whiteSpace: 'nowrap'
                }}>
                  Shared
                </span>
              )}
            </span>

            {/* Arrows aren't decoration: HTML5 drag doesn't work on
                touch devices at all, and dragging is unusable with a
                keyboard. These are the accessible path. */}
            <span style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
              <button
                onClick={() => moveList(key, -1)}
                disabled={idx === 0}
                title="Move up"
                style={{
                  width: '30px', height: '30px', borderRadius: '7px',
                  background: 'rgba(var(--surface-rgb), 1)',
                  border: '2px solid rgba(var(--accent-rgb), 0.3)',
                  color: idx === 0 ? '#55556a' : 'var(--text)',
                  cursor: idx === 0 ? 'default' : 'pointer',
                  fontSize: '0.7rem', padding: 0, lineHeight: 1
                }}
              >
                ▲
              </button>
              <button
                onClick={() => moveList(key, 1)}
                disabled={idx === orderedTaskLists.length - 1}
                title="Move down"
                style={{
                  width: '30px', height: '30px', borderRadius: '7px',
                  background: 'rgba(var(--surface-rgb), 1)',
                  border: '2px solid rgba(var(--accent-rgb), 0.3)',
                  color: idx === orderedTaskLists.length - 1 ? '#55556a' : 'var(--text)',
                  cursor: idx === orderedTaskLists.length - 1 ? 'default' : 'pointer',
                  fontSize: '0.7rem', padding: 0, lineHeight: 1
                }}
              >
                ▼
              </button>
            </span>

            <Toggle on={!hidden} onChange={() => toggleListVisibility(key)} />

            {/* Built-ins can be hidden but not deleted - removing
                them would orphan the colour and label defaults. */}
            {customLists.some(c => c && c.key === key) && (
              <button
                aria-label="Delete list"
                onClick={() => deleteCustomList(key)}
                title="Delete this list and its tasks"
                style={{
                  width: '30px', height: '30px', borderRadius: '7px',
                  background: 'rgba(var(--surface-rgb), 1)',
                  border: '2px solid rgba(255, 107, 107, 0.35)',
                  color: '#ff8f8f', cursor: 'pointer',
                  fontSize: '0.9rem', padding: 0, lineHeight: 1, flexShrink: 0
                }}
              >
                ×
              </button>
            )}
          </div>
        );
              };

              const row = {
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                gap: '14px', flexWrap: 'wrap', marginBottom: '14px'
              };
              const label = {
                color: 'var(--text)', fontSize: '0.92rem', fontFamily: 'var(--font-ui)'
              };
              const hint = {
                color: 'var(--text-muted)', fontSize: '0.76rem',
                fontFamily: 'var(--font-ui)', marginTop: '2px'
              };
              const numInput = {
                width: '90px', padding: '9px 10px', background: 'rgba(var(--surface-rgb), 1)',
                border: '2px solid rgba(var(--accent-rgb), 0.3)', borderRadius: '8px',
                color: 'var(--text)', fontSize: '0.95rem', fontFamily: 'var(--font-ui)',
                textAlign: 'center', boxSizing: 'border-box'
              };

              // Simple pill toggle
              const Toggle = ({ on, onChange }) => (
                <div
                  onClick={() => onChange(!on)}
                  style={{
                    width: '52px', height: '30px', borderRadius: '15px', cursor: 'pointer',
                    background: on ? 'linear-gradient(135deg, var(--accent), var(--accent-light))' : 'rgba(var(--surface-rgb), 1)',
                    border: '2px solid rgba(var(--accent-rgb), 0.4)', position: 'relative',
                    transition: 'background 0.25s ease', flexShrink: 0
                  }}
                >
                  <div style={{
                    width: '20px', height: '20px', borderRadius: '50%', background: 'var(--text)',
                    position: 'absolute', top: '3px', left: on ? '25px' : '3px',
                    transition: 'left 0.25s ease'
                  }} />
                </div>
              );

              return (
                <div>
                  {/* ---- Appearance ---- */}
                  <div style={card}>
                    <div style={heading}>Appearance</div>
                    <div style={sub}>
                      How the app looks. Accent colour applies everywhere the app
                      highlights something.
                    </div>

                    <div style={row}>
                      <div style={{ flex: 1, minWidth: '160px' }}>
                        <div style={label}>Theme</div>
                        <div style={hint}>
                          System follows your phone's light/dark setting.
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                        {['system', 'dark', 'light'].map(mode => {
                          const on = (settings.theme || 'system') === mode;
                          return (
                            <button
                              key={mode}
                              onClick={() => updateSetting('theme', mode)}
                              style={{
                                padding: '8px 14px', borderRadius: '8px', cursor: 'pointer',
                                textTransform: 'capitalize', fontSize: '0.82rem', fontWeight: 600,
                                fontFamily: 'var(--font-ui)',
                                background: on
                                  ? 'linear-gradient(135deg, var(--accent), var(--accent-light))'
                                  : 'rgba(var(--surface-rgb), 1)',
                                border: on
                                  ? '2px solid rgba(var(--accent-rgb), 0.6)'
                                  : '2px solid rgba(var(--accent-rgb), 0.25)',
                                color: on ? '#fff' : 'var(--text-muted)'
                              }}
                            >
                              {mode}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div style={subheading}>Accent Color</div>
                    <div style={sub}>
                      Recolors buttons, highlights, and the app's accents. Backgrounds stay dark.
                    </div>

                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: isMobile ? 'repeat(3, 1fr)' : 'repeat(6, 1fr)',
                      gap: '10px', marginBottom: '18px'
                    }}>
                      {ACCENT_PRESETS.map(preset => {
                        const active = settings.accentId === preset.id;
                        return (
                          <div
                            key={preset.id}
                            onClick={() => updateSetting('accentId', preset.id)}
                            style={{
                              cursor: 'pointer', textAlign: 'center',
                              padding: '10px 4px', borderRadius: '10px',
                              border: active ? '2px solid var(--text)' : '2px solid rgba(var(--border-rgb), 0.25)',
                              background: active ? 'rgba(var(--border-rgb), 0.12)' : 'transparent',
                              transition: 'all 0.2s ease'
                            }}
                          >
                            <div style={{
                              width: '34px', height: '34px', borderRadius: '50%', margin: '0 auto 7px',
                              background: `linear-gradient(135deg, ${preset.accent}, ${preset.light})`,
                              boxShadow: active ? '0 0 10px rgba(255,255,255,0.25)' : 'none'
                            }} />
                            <div style={{
                              color: active ? 'var(--text)' : 'var(--text-muted)',
                              fontSize: '0.72rem', fontFamily: 'var(--font-ui)'
                            }}>
                              {preset.name}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <div style={{ ...row, marginBottom: 0 }}>
                      <div style={{ flex: 1, minWidth: '160px' }}>
                        <div style={label}>Custom color</div>
                        <div style={hint}>
                          Pick your own. Very light colors may reduce text contrast on buttons.
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <input
                          type="color"
                          value={settings.customAccent}
                          onChange={(e) => {
                            updateSetting('customAccent', e.target.value);
                            updateSetting('accentId', 'custom');
                          }}
                          style={{
                            width: '46px', height: '38px', padding: '2px', cursor: 'pointer',
                            background: 'rgba(var(--surface-rgb), 1)',
                            border: settings.accentId === 'custom'
                              ? '2px solid var(--text)'
                              : '2px solid rgba(var(--accent-rgb), 0.3)',
                            borderRadius: '8px'
                          }}
                        />
                        <button
                          onClick={() => updateSetting('accentId', 'matcha')}
                          style={{
                            padding: '9px 14px', borderRadius: '8px', cursor: 'pointer',
                            background: 'rgba(var(--surface-rgb), 1)',
                            border: '2px solid rgba(var(--accent-rgb), 0.3)',
                            color: 'var(--text-muted)', fontSize: '0.8rem',
                            fontFamily: 'var(--font-ui)'
                          }}
                        >
                          Reset
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* ---- Font ---- */}
                  <div style={card}>
                    <div style={heading}>Font</div>
                    <div style={sub}>
                      Each option previews in its own face. Headings and body text
                      are chosen together as a pair.
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {FONT_OPTIONS.map(font => {
                        const on = (settings.fontChoice || 'default') === font.id;
                        return (
                          <button
                            key={font.id}
                            onClick={() => updateSetting('fontChoice', font.id)}
                            style={{
                              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                              gap: '10px', textAlign: 'left', width: '100%',
                              padding: '10px 14px', borderRadius: '10px', cursor: 'pointer',
                              boxShadow: 'none',
                              background: on
                                ? 'rgba(var(--accent-rgb), 0.18)'
                                : 'rgba(var(--surface-rgb), 1)',
                              border: on
                                ? '2px solid rgba(var(--accent-rgb), 0.6)'
                                : '2px solid rgba(var(--border-rgb), 0.25)',
                              textTransform: 'none', letterSpacing: 'normal'
                            }}
                          >
                            <span style={{ minWidth: 0 }}>
                              {/* Rendered in the font it selects, so the choice
                                  can be judged by looking rather than by name.
                                  These are literal stacks, not the variables -
                                  the variables describe what's active now. */}
                              <span style={{
                                display: 'block', fontFamily: font.ui,
                                color: 'var(--text)', fontSize: '0.95rem', fontWeight: 600
                              }}>
                                {font.label}
                              </span>
                              <span style={{
                                display: 'block', fontFamily: font.body,
                                color: 'var(--text-muted)', fontSize: '0.78rem', marginTop: '2px'
                              }}>
                                {font.note}
                              </span>
                            </span>
                            {on && (
                              <span style={{ color: 'var(--accent-light)', fontSize: '1rem', flexShrink: 0 }}>
                                ✓
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>

                  </div>

                  {/* ---- Lists ---- */}
                  <div style={card}>
                    <div style={heading}>Lists</div>
                    <div style={sub}>
                      Reorder, rename, or switch off your lists. Hidden lists are removed
                      from the tabs and excluded from the All Tasks roll-up — their tasks
                      are kept, not deleted.
                    </div>

                    {/* Live tab preview, and the surface you reorder on.
                        Dragging a chip calls the same reorderList the rows
                        below use, so the two can't disagree - and this is the
                        actual artifact being ordered rather than a proxy for
                        it. HTML5 drag doesn't fire on touch, so on a phone this
                        is read-only feedback and the arrows below do the work. */}
                    <div style={{ ...hint, marginTop: 0, marginBottom: '8px' }}>
                      Your tabs, in order. Drag to rearrange.
                    </div>
                    <div style={{
                      display: 'flex', flexWrap: 'wrap', gap: '6px',
                      padding: '12px', marginBottom: '18px',
                      background: 'rgba(var(--surface-deep-rgb), 0.5)',
                      border: '2px solid rgba(var(--border-rgb), 0.2)',
                      borderRadius: '14px'
                    }}>
                      {visibleTaskLists.length === 0 && (
                        <span style={{ ...hint, margin: 0 }}>Every list is switched off.</span>
                      )}
                      {visibleTaskLists.map(key => {
                        const shared = isSharedList(key);
                        const over = dragOverList === key;
                        return (
                          <span
                            key={key}
                            draggable
                            onDragStart={() => setDraggingList(key)}
                            onDragOver={(e) => { e.preventDefault(); setDragOverList(key); }}
                            onDragLeave={() => setDragOverList(prev => (prev === key ? null : prev))}
                            onDrop={(e) => {
                              e.preventDefault();
                              if (draggingList) reorderList(draggingList, key);
                              setDraggingList(null);
                              setDragOverList(null);
                            }}
                            onDragEnd={() => { setDraggingList(null); setDragOverList(null); }}
                            style={{
                              padding: '7px 14px', borderRadius: '20px', cursor: 'grab',
                              fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.5px',
                              textTransform: 'uppercase', fontFamily: 'var(--font-ui)',
                              // Shared tabs carry the partner colour wherever they
                              // appear, so "this one is shared" is a thing you
                              // recognise rather than a label you have to read.
                              background: shared
                                ? 'rgba(var(--partner-rgb), 0.18)'
                                : 'rgba(var(--surface-rgb), 0.9)',
                              border: shared
                                ? '1px solid rgba(var(--partner-rgb), 0.5)'
                                : '1px solid rgba(var(--border-rgb), 0.3)',
                              color: shared ? 'var(--partner)' : 'var(--text-muted)',
                              outline: over ? '2px solid var(--accent)' : 'none'
                            }}
                          >
                            {listLabel(key)}
                          </span>
                        );
                      })}
                    </div>

                    {/* One flat list, in true tab order. Previously two filtered
                        groups - which quietly made cross-group reordering
                        impossible, because a shared list had no personal list to
                        be dropped onto. */}
                    {orderedTaskLists.map(renderListRow)}

                    <div style={divider} />

                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'stretch' }}>
                      <div style={{ flex: 1, minWidth: '150px' }}>
                        <button
                          onClick={() => addListQuick(false)}
                          disabled={personalListKeys.length >= MAX_LISTS_PER_SET}
                          style={{
                            width: '100%', padding: '12px 16px', borderRadius: '10px',
                            cursor: personalListKeys.length >= MAX_LISTS_PER_SET ? 'default' : 'pointer',
                            background: 'rgba(var(--surface-rgb), 1)',
                            border: '2px solid rgba(var(--border-rgb), 0.35)',
                            color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 600,
                            fontFamily: 'var(--font-ui)',
                            opacity: personalListKeys.length >= MAX_LISTS_PER_SET ? 0.5 : 1
                          }}
                        >
                          + Personal List
                        </button>
                        <div style={{ ...hint, marginTop: '6px', textAlign: 'center' }}>
                          {personalListKeys.length} of {MAX_LISTS_PER_SET}
                        </div>
                      </div>

                      <div style={{ flex: 1, minWidth: '150px' }}>
                        {/* Deliberately the louder of the two. A shared list is
                            the thing that involves another person, so adding one
                            should read as a decision, not a twin of the button
                            beside it. */}
                        <button
                          onClick={() => addListQuick(true)}
                          disabled={sharedListKeys.length >= MAX_LISTS_PER_SET}
                          style={{
                            width: '100%', padding: '12px 16px', borderRadius: '10px',
                            cursor: sharedListKeys.length >= MAX_LISTS_PER_SET ? 'default' : 'pointer',
                            background: 'rgba(var(--partner-rgb), 0.18)',
                            border: '2px solid rgba(var(--partner-rgb), 0.55)',
                            color: 'var(--partner)', fontSize: '0.85rem', fontWeight: 700,
                            fontFamily: 'var(--font-ui)',
                            opacity: sharedListKeys.length >= MAX_LISTS_PER_SET ? 0.5 : 1
                          }}
                        >
                          + Shared List
                        </button>
                        <div style={{ ...hint, marginTop: '6px', textAlign: 'center' }}>
                          {sharedListKeys.length} of {MAX_LISTS_PER_SET} · seen by your partner
                        </div>
                      </div>
                    </div>

                    {listMessage && (
                      <div style={{
                        marginTop: '10px', fontSize: '0.8rem',
                        fontFamily: 'var(--font-ui)',
                        color: listMessage.ok ? 'var(--text)' : '#ff8f8f'
                      }}>
                        {listMessage.message}
                      </div>
                    )}

                    <div style={{ ...hint, marginTop: '12px' }}>
                      Drag the handle to reorder, or use the arrows. The order applies to
                      the tabs, All Tasks, and Reports. Leave a name blank to restore its
                      default. At least one list must stay on.
                    </div>
                  </div>

                  {/* ---- Partner ---- */}
                  <div style={card}>
                    <div style={heading}>Partner</div>
                    <div style={sub}>
                      Applies to every shared list, where tasks show who they're
                      assigned to.
                    </div>

                    <div style={row}>
                      <div style={{ flex: 1, minWidth: '180px' }}>
                        <div style={label}>Name</div>
                        <div style={hint}>
                          Shown on shared tasks instead of "Partner". Renaming the list
                          itself is separate, under Lists.
                        </div>
                      </div>
                      <input
                        type="text"
                        value={settings.partnerName}
                        onChange={(e) => updateSetting('partnerName', e.target.value)}
                        placeholder="Partner"
                        maxLength={18}
                        style={{
                          width: '150px', padding: '9px 10px',
                          background: 'rgba(var(--surface-rgb), 1)',
                          border: '2px solid rgba(var(--accent-rgb), 0.3)',
                          borderRadius: '8px', color: 'var(--text)', fontSize: '0.92rem',
                          fontFamily: 'var(--font-ui)', boxSizing: 'border-box'
                        }}
                      />
                    </div>

                    <div style={row}>
                      <div style={{ flex: 1, minWidth: '180px' }}>
                        <div style={label}>Color</div>
                        <div style={hint}>
                          Used for their badge and the Assigned pill, so it reads apart
                          from your own tasks at a glance.
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        {/* Live preview - the same classes the task card uses, so
                            this can't drift from the real thing. */}
                        <span className="shared-badge partner" style={{ margin: 0 }}>
                          {(settings.partnerName || '').trim() || 'Partner'}
                        </span>
                        <input
                          type="color"
                          value={settings.partnerColor}
                          onChange={(e) => updateSetting('partnerColor', e.target.value)}
                          style={{
                            width: '46px', height: '38px', padding: '2px', cursor: 'pointer',
                            background: 'rgba(var(--surface-rgb), 1)',
                            border: '2px solid rgba(var(--accent-rgb), 0.3)',
                            borderRadius: '8px'
                          }}
                        />
                        <button
                          onClick={() => updateSetting('partnerColor', DEFAULT_SETTINGS.partnerColor)}
                          style={{
                            padding: '9px 14px', borderRadius: '8px', cursor: 'pointer',
                            background: 'rgba(var(--surface-rgb), 1)',
                            border: '2px solid rgba(var(--accent-rgb), 0.3)',
                            color: 'var(--text-muted)', fontSize: '0.8rem',
                            fontFamily: 'var(--font-ui)'
                          }}
                        >
                          Reset
                        </button>
                      </div>
                    </div>

                    <div style={{ ...row, marginBottom: 0 }}>
                      <div style={{ flex: 1, minWidth: '180px' }}>
                        <div style={label}>Linked account</div>
                        <div style={hint}>
                          Saved for when shared lists start syncing between devices.
                          Nothing is sent anywhere yet, and this list stays on this
                          device only.
                        </div>
                      </div>
                      <input
                        type="email"
                        inputMode="email"
                        autoComplete="off"
                        value={settings.partnerAccountEmail}
                        onChange={(e) => updateSetting('partnerAccountEmail', e.target.value)}
                        placeholder="name@example.com"
                        style={{
                          width: '210px', maxWidth: '100%', padding: '9px 10px',
                          background: 'rgba(var(--surface-rgb), 1)',
                          border: '2px solid rgba(var(--accent-rgb), 0.3)',
                          borderRadius: '8px', color: 'var(--text)', fontSize: '0.92rem',
                          fontFamily: 'var(--font-ui)', boxSizing: 'border-box'
                        }}
                      />
                    </div>

                    <div style={{
                      marginTop: '14px', paddingTop: '12px',
                      borderTop: '1px solid rgba(var(--accent-rgb), 0.15)',
                      display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap'
                    }}>
                      <span style={{
                        width: '8px', height: '8px', borderRadius: '50%',
                        background: 'var(--text-muted)', flexShrink: 0
                      }} />
                      <span style={{ ...hint, marginTop: 0 }}>
                        Not linked — syncing isn't available yet.
                      </span>
                    </div>
                  </div>

                  {/* ---- Menu Sections ---- */}
                  <div style={card}>
                    <div style={heading}>Menu Sections</div>
                    <div style={sub}>
                      Switch off parts of the app you don't use. Hidden sections disappear
                      from the menu, calendar, and search — nothing is deleted, and turning
                      one back on restores it exactly as it was.
                    </div>

                    {FEATURES.map((f, i) => {
                      const on = isFeatureOn(f.key);
                      const counts = {
                        time: (standaloneTimeLogs || []).length +
                              Object.values(goals || {}).reduce((n, arr) =>
                                n + (arr || []).reduce((m, g) => m + ((g.timeLogs || []).length), 0), 0),
                        goals: countKeyed(goals),
                        projects: countKeyed(projects),
                        notes: (notes || []).length,
                        search: null   // a lens, not a store - no count to show
                      };
                      return (
                        <div
                          key={f.key}
                          style={{
                            display: 'flex', alignItems: 'center', gap: '12px',
                            padding: '12px 0', flexWrap: 'wrap',
                            borderBottom: i < FEATURES.length - 1 ? '1px solid rgba(var(--border-rgb), 0.18)' : 'none',
                            opacity: on ? 1 : 0.55, transition: 'opacity 0.2s ease'
                          }}
                        >
                          <div style={{ flex: 1, minWidth: '170px' }}>
                            <div style={label}>{f.label}</div>
                            <div style={hint}>{f.note}</div>
                          </div>
                          <span style={{
                            color: 'var(--text-muted)', fontSize: '0.75rem',
                            fontFamily: 'var(--font-ui)', minWidth: '58px'
                          }}>
                            {counts[f.key] === null ? '' : `${counts[f.key]} saved`}
                          </span>
                          <Toggle on={on} onChange={() => toggleFeature(f.key)} />
                        </div>
                      );
                    })}

                    <div style={{ ...hint, marginTop: '12px' }}>
                      Turning Projects off also hides the Project field on tasks. Any task
                      already assigned keeps its project, ready for if you switch it back on.
                      With Goals off but Time on, time logged against goals stays visible
                      under Time.
                    </div>
                  </div>

                  {/* ---- Report Settings ---- */}
                  <div style={card}>
                    <div style={heading}>Report Settings</div>
                    <div style={sub}>
                      Goals and starting views for the Reports page.
                    </div>

                    <div style={subheading}>Fire Goal</div>
                    <div style={sub}>
                      How many completed tasks fully light the flame on the Reports page.
                    </div>

                    <div style={row}>
                      <div>
                        <div style={label}>Per week</div>
                        <div style={hint}>Used by the This Week view</div>
                      </div>
                      <input
                        type="number" min="1" max="500"
                        value={settings.weeklyFireGoal}
                        onChange={(e) => updateSetting('weeklyFireGoal', e.target.value === '' ? '' : Math.max(1, parseInt(e.target.value) || 1))}
                        style={numInput}
                      />
                    </div>

                    <div style={{ ...row, marginBottom: 0 }}>
                      <div>
                        <div style={label}>Per month</div>
                        <div style={hint}>Longer ranges scale from this</div>
                      </div>
                      <input
                        type="number" min="1" max="2000"
                        value={settings.monthlyFireGoal}
                        onChange={(e) => updateSetting('monthlyFireGoal', e.target.value === '' ? '' : Math.max(1, parseInt(e.target.value) || 1))}
                        style={numInput}
                      />
                    </div>

                    <div style={divider} />

                    <div style={subheading}>Report Defaults</div>
                    <div style={sub}>What the app starts on each time you open it.</div>

                    <div style={row}>
                      <div style={label}>Reports timeframe</div>
                      <select
                        value={settings.defaultReportTimeframe}
                        onChange={(e) => updateSetting('defaultReportTimeframe', e.target.value)}
                        style={{ ...numInput, width: 'auto', minWidth: '150px', textAlign: 'left' }}
                      >
                        <option value="thisWeek">This Week</option>
                        <option value="thisMonth">This Month</option>
                        <option value="lastMonth">Last Month</option>
                        <option value="last3">Last 3 Months</option>
                        <option value="last6">Last 6 Months</option>
                        <option value="allTime">All Time</option>
                      </select>
                    </div>

                    <div style={{ ...row, marginBottom: 0 }}>
                      <div style={label}>Timer duration</div>
                      <select
                        value={settings.defaultTimerDuration}
                        onChange={(e) => updateSetting('defaultTimerDuration', e.target.value === '' ? '' : parseInt(e.target.value))}
                        style={{ ...numInput, width: 'auto', minWidth: '150px', textAlign: 'left' }}
                      >
                        <option value="">Timer (open-ended)</option>
                        <option value="300">5 Minutes</option>
                        <option value="420">7 Minutes</option>
                        <option value="600">10 Minutes</option>
                        <option value="900">15 Minutes</option>
                        <option value="1800">30 Minutes</option>
                        <option value="3600">60 Minutes</option>
                      </select>
                    </div>
                  </div>

                  {/* ---- Pomodoro ---- */}
                  <div style={card}>
                    <div style={heading}>Pomodoro</div>
                    <div style={sub}>
                      Splits Time into focus sessions with breaks between them. Work
                      is logged as normal; breaks are not.
                    </div>

                    <div style={row}>
                      <div style={{ flex: 1, minWidth: '180px' }}>
                        <div style={label}>Pomodoro mode</div>
                        <div style={hint}>
                          A chime and a notification mark the end of each session.
                          Notifications only arrive while the app is open — iOS stops
                          web apps running in the background.
                        </div>
                      </div>
                      <Toggle
                        on={settings.pomodoroEnabled}
                        onChange={(v) => {
                          updateSetting('pomodoroEnabled', v);
                          // Permission must be asked for from a user gesture, and
                          // this toggle is the only one guaranteed to be one.
                          if (v && typeof Notification !== 'undefined'
                              && Notification.permission === 'default') {
                            Notification.requestPermission();
                          }
                        }}
                      />
                    </div>

                    <div style={row}>
                      <div style={label}>Focus length</div>
                      <select
                        value={settings.pomodoroWork}
                        onChange={(e) => updateSetting('pomodoroWork', Number(e.target.value))}
                        style={{ ...numInput, width: 'auto', minWidth: '130px', textAlign: 'left' }}
                      >
                        <option value={900}>15 minutes</option>
                        <option value={1500}>25 minutes</option>
                        <option value={1800}>30 minutes</option>
                        <option value={2700}>45 minutes</option>
                        <option value={3000}>50 minutes</option>
                      </select>
                    </div>

                    <div style={row}>
                      <div style={label}>Short break</div>
                      <select
                        value={settings.pomodoroShortBreak}
                        onChange={(e) => updateSetting('pomodoroShortBreak', Number(e.target.value))}
                        style={{ ...numInput, width: 'auto', minWidth: '130px', textAlign: 'left' }}
                      >
                        <option value={180}>3 minutes</option>
                        <option value={300}>5 minutes</option>
                        <option value={600}>10 minutes</option>
                      </select>
                    </div>

                    <div style={row}>
                      <div style={label}>Long break</div>
                      <select
                        value={settings.pomodoroLongBreak}
                        onChange={(e) => updateSetting('pomodoroLongBreak', Number(e.target.value))}
                        style={{ ...numInput, width: 'auto', minWidth: '130px', textAlign: 'left' }}
                      >
                        <option value={600}>10 minutes</option>
                        <option value={900}>15 minutes</option>
                        <option value={1800}>30 minutes</option>
                      </select>
                    </div>

                    <div style={row}>
                      <div style={{ flex: 1, minWidth: '180px' }}>
                        <div style={label}>Long break after</div>
                        <div style={hint}>How many focus sessions before the long break.</div>
                      </div>
                      <input
                        type="number"
                        min="2"
                        max="8"
                        value={settings.pomodoroInterval}
                        onChange={(e) => updateSetting('pomodoroInterval',
                          Math.min(8, Math.max(2, parseInt(e.target.value) || 4)))}
                        style={numInput}
                      />
                    </div>

                    <div style={{ ...row, marginBottom: 0 }}>
                      <div style={{ flex: 1, minWidth: '180px' }}>
                        <div style={label}>Auto-start next session</div>
                        <div style={hint}>
                          Starts the next focus session as soon as a break ends. Off
                          means the break simply finishes and waits for you.
                        </div>
                      </div>
                      <Toggle
                        on={settings.pomodoroAutoStart}
                        onChange={(v) => updateSetting('pomodoroAutoStart', v)}
                      />
                    </div>
                  </div>

                  {/* ---- App Behavior ---- */}
                  <div style={card}>
                    <div style={heading}>App Behavior</div>
                    <div style={sub}>How the app responds as you work.</div>

                    <div style={row}>
                      <div style={{ flex: 1, minWidth: '180px' }}>
                        <div style={label}>Pause on completion</div>
                        <div style={hint}>
                          Hold a task briefly so you see the checkmark before it moves to Complete
                        </div>
                      </div>
                      <Toggle
                        on={settings.completionDelay}
                        onChange={(v) => updateSetting('completionDelay', v)}
                      />
                    </div>

                    <div style={row}>
                      <div style={{ flex: 1, minWidth: '180px' }}>
                        <div style={label}>Reduce motion</div>
                        <div style={hint}>
                          Turns off the flame fill, chart draw-in, and other animations.
                          Your device's system setting is honored automatically.
                        </div>
                      </div>
                      <Toggle
                        on={settings.reduceMotion}
                        onChange={(v) => updateSetting('reduceMotion', v)}
                      />
                    </div>

                    <div style={{ ...row, marginBottom: 0 }}>
                      <div style={{ flex: 1, minWidth: '180px' }}>
                        <div style={label}>Battery saver</div>
                        <div style={hint}>
                          Drops the frosted-glass blur and the ambient glow layer.
                          The app looks slightly flatter and asks much less of the
                          GPU, especially while scrolling. On by default on phones
                          and tablets, and on a laptop running on battery power
                          where that can be detected. Your own choice here always
                          wins over any of that.
                        </div>
                      </div>
                      <Toggle
                        on={settings.batterySaver}
                        onChange={(v) => updateSetting('batterySaver', v)}
                      />
                    </div>
                  </div>

                  {/* ---- Backup ---- */}
                  <div style={card}>
                    <div style={heading}>Backup &amp; Restore</div>
                    <div style={sub}>
                      Everything lives in this browser's storage. Clearing site data or losing
                      the device loses it all — so export a copy somewhere safe.
                    </div>

                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '16px' }}>
                      <button
                        onClick={exportBackup}
                        style={{
                          padding: '12px 18px', borderRadius: '8px', cursor: 'pointer',
                          background: 'linear-gradient(135deg, var(--accent), var(--accent-light))',
                          border: '1px solid rgba(var(--accent-rgb), 0.5)',
                          color: '#ffffff', fontSize: '0.85rem', fontWeight: '600',
                          fontFamily: 'var(--font-ui)'
                        }}
                      >
                        Export Backup
                      </button>

                      <button
                        onClick={() => { importInputRef.current.dataset.mode = 'merge'; importInputRef.current.click(); }}
                        style={{
                          padding: '12px 18px', borderRadius: '8px', cursor: 'pointer',
                          background: 'rgba(var(--surface-rgb), 1)',
                          border: '2px solid rgba(var(--accent-rgb), 0.4)',
                          color: 'var(--text)', fontSize: '0.85rem', fontWeight: '600',
                          fontFamily: 'var(--font-ui)'
                        }}
                      >
                        Import &amp; Merge
                      </button>

                      <button
                        onClick={async () => {
                          const ok = await confirmAction(
                            'Replace ALL current data with the backup?\n\n' +
                            'Everything currently in the app will be overwritten. ' +
                            'If you only want to add missing items, cancel and use "Import & Merge" instead.'
                          );
                          if (!ok) return;
                          importInputRef.current.dataset.mode = 'replace';
                          importInputRef.current.click();
                        }}
                        style={{
                          padding: '12px 18px', borderRadius: '8px', cursor: 'pointer',
                          background: 'rgba(var(--surface-rgb), 1)',
                          border: '2px solid rgba(255, 107, 107, 0.4)',
                          color: '#ff8f8f', fontSize: '0.85rem', fontWeight: '600',
                          fontFamily: 'var(--font-ui)'
                        }}
                      >
                        Import &amp; Replace
                      </button>
                    </div>

                    <input
                      ref={importInputRef}
                      type="file"
                      accept="application/json,.json"
                      style={{ display: 'none' }}
                      onChange={(e) => {
                        const mode = e.target.dataset.mode || 'merge';
                        handleImportFile(e.target.files && e.target.files[0], mode);
                        e.target.value = ''; // allow re-importing the same file
                      }}
                    />

                    {backupStatus && (
                      <div style={{
                        padding: '11px 14px', borderRadius: '8px', marginBottom: '14px',
                        background: backupStatus.type === 'error'
                          ? 'rgba(255, 107, 107, 0.12)'
                          : 'rgba(var(--accent-rgb), 0.15)',
                        border: `1px solid ${backupStatus.type === 'error'
                          ? 'rgba(255, 107, 107, 0.4)'
                          : 'rgba(var(--accent-rgb), 0.4)'}`,
                        color: backupStatus.type === 'error' ? '#ff8f8f' : 'var(--text)',
                        fontSize: '0.82rem', fontFamily: 'var(--font-ui)', lineHeight: 1.5
                      }}>
                        {backupStatus.message}
                      </div>
                    )}

                    <div style={hint}>
                      <strong style={{ color: 'var(--text)' }}>Merge</strong> only adds what's missing —
                      it never overwrites or deletes, and re-importing the same file does nothing.
                      <strong style={{ color: 'var(--text)' }}> Replace</strong> wipes everything first.
                      Either way, a snapshot of your current data is saved beforehand as a fallback.
                    </div>
                  </div>

                  {/* ---- Spreadsheet export ---- */}
                  <div style={card}>
                    <div style={heading}>Export to Spreadsheet</div>
                    <div style={sub}>
                      CSV files for analysis in Excel, Sheets, or Numbers. These are for reading
                      and reporting — they can't be imported back, so use the JSON backup above
                      if what you want is a restore point.
                    </div>

                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '14px' }}>
                      <button
                        onClick={exportTasksCsv}
                        style={{
                          padding: '12px 18px', borderRadius: '8px', cursor: 'pointer',
                          background: 'rgba(var(--surface-rgb), 1)',
                          border: '2px solid rgba(var(--accent-rgb), 0.4)',
                          color: 'var(--text)', fontSize: '0.85rem', fontWeight: '600',
                          fontFamily: 'var(--font-ui)'
                        }}
                      >
                        Tasks (.csv)
                      </button>
                      <button
                        onClick={exportTimeLogsCsv}
                        style={{
                          padding: '12px 18px', borderRadius: '8px', cursor: 'pointer',
                          background: 'rgba(var(--surface-rgb), 1)',
                          border: '2px solid rgba(var(--accent-rgb), 0.4)',
                          color: 'var(--text)', fontSize: '0.85rem', fontWeight: '600',
                          fontFamily: 'var(--font-ui)'
                        }}
                      >
                        Time Logs (.csv)
                      </button>
                    </div>

                    <div style={hint}>
                      Tasks export includes every list, active and archived, with due dates,
                      priority, project, and details flattened to plain text.
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        )}

        {appMode === 'reports' && (
          <div className="reports-section">

            {(() => {
              const listKeys = visibleTaskLists;
              const listLabels = {
                ...Object.fromEntries(TASK_LISTS.map(k => [k, listLabel(k)]))
              };
              const listColors = {
                ...Object.fromEntries(TASK_LISTS.map(k => [k, listColor(k)]))
              };

              // --- Determine date range and bucketing for the selected timeframe ---
              const now = new Date();
              const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

              // Weeks run Monday -> Sunday
              const startOfWeek = (d) => {
                const x = new Date(d.getFullYear(), d.getMonth(), d.getDate());
                x.setDate(x.getDate() - ((x.getDay() + 6) % 7)); // Monday start
                return x;
              };

              let rangeStart, rangeEnd, bucketUnit; // bucketUnit: 'day' | 'week' | 'month'
              rangeEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

              if (reportTimeframe === 'thisWeek') {
                rangeStart = startOfWeek(now);
                // Show the full Mon-Sun week so upcoming days appear as empty slots
                rangeEnd = new Date(rangeStart.getFullYear(), rangeStart.getMonth(), rangeStart.getDate() + 6, 23, 59, 59, 999);
                bucketUnit = 'day';
              } else if (reportTimeframe === 'thisMonth') {
                rangeStart = new Date(now.getFullYear(), now.getMonth(), 1);
                // Weekly reads better than ~30 daily points on any screen size
                bucketUnit = 'week';
              } else if (reportTimeframe === 'lastMonth') {
                rangeStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
                rangeEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
                bucketUnit = 'week';
              } else if (reportTimeframe === 'last3') {
                rangeStart = new Date(now.getFullYear(), now.getMonth() - 2, 1);
                bucketUnit = 'week';
              } else if (reportTimeframe === 'last6') {
                rangeStart = new Date(now.getFullYear(), now.getMonth() - 5, 1);
                // ~26 weekly points is too dense on a phone
                bucketUnit = isMobile ? 'month' : 'week';
              } else { // allTime
                bucketUnit = 'month';
                rangeStart = null; // computed after scanning tasks
              }

              // --- Gather tasks to plot based on the selected status filter ---
              // 'complete' => completed tasks bucketed by completedAt
              // 'open'     => open (non-completed, non-backlog) tasks by createdAt
              // 'both'     => union of the two
              const includeComplete = reportTaskStatus === 'complete' || reportTaskStatus === 'both';
              const includeOpen = reportTaskStatus === 'open' || reportTaskStatus === 'both';
              const completed = []; // { list, date } - tasks to plot
              listKeys.forEach(key => {
                const scan = (arr, fromArchive) => {
                  (Array.isArray(arr) ? arr : []).forEach(t => {
                    if (!t) return;
                    if (t.completed) {
                      if (includeComplete && t.completedAt) {
                        const d = new Date(t.completedAt);
                        if (!isNaN(d)) completed.push({ list: key, date: d });
                      }
                    } else {
                      // Open tasks: only from active lists, exclude backlog
                      if (includeOpen && !fromArchive && t.section !== 'backlog' && t.createdAt) {
                        const d = new Date(t.createdAt);
                        if (!isNaN(d)) completed.push({ list: key, date: d });
                      }
                    }
                  });
                };
                scan(allLists[key], false);
                scan(archivedTasks[key], true);
              });

              // --- Count current open and backlog tasks (active lists only) ---
              // These are point-in-time counts, independent of the timeframe.
              let openTasksCount = 0;
              let backlogTasksCount = 0;
              listKeys.forEach(key => {
                (Array.isArray(allLists[key]) ? allLists[key] : []).forEach(t => {
                  if (!t || t.completed) return;
                  if (t.section === 'backlog') backlogTasksCount += 1;
                  else openTasksCount += 1; // 'todo' or any non-backlog section
                });
              });

              // For all-time, set rangeStart to earliest completion (or this month if none)
              if (reportTimeframe === 'allTime') {
                if (completed.length > 0) {
                  const earliest = completed.reduce((min, c) => c.date < min ? c.date : min, completed[0].date);
                  rangeStart = new Date(earliest.getFullYear(), earliest.getMonth(), 1);
                } else {
                  rangeStart = new Date(now.getFullYear(), now.getMonth(), 1);
                }
              }

              // --- Build buckets ---
              const buckets = []; // { label, start, end }
              const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

              if (bucketUnit === 'day') {
                let cur = new Date(rangeStart.getFullYear(), rangeStart.getMonth(), rangeStart.getDate());
                while (cur <= rangeEnd) {
                  const start = new Date(cur);
                  const end = new Date(cur.getFullYear(), cur.getMonth(), cur.getDate(), 23, 59, 59, 999);
                  buckets.push({
                    label: dayNames[start.getDay()],
                    start, end
                  });
                  cur.setDate(cur.getDate() + 1);
                }
              } else if (bucketUnit === 'week') {
                let cur = startOfWeek(rangeStart);
                while (cur <= rangeEnd) {
                  const start = new Date(cur);
                  const end = new Date(cur.getFullYear(), cur.getMonth(), cur.getDate() + 6, 23, 59, 59, 999);
                  buckets.push({
                    label: `${start.getMonth() + 1}/${start.getDate()}`,
                    start, end
                  });
                  cur.setDate(cur.getDate() + 7);
                }
              } else { // month
                let cur = new Date(rangeStart.getFullYear(), rangeStart.getMonth(), 1);
                const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
                while (cur <= rangeEnd) {
                  const start = new Date(cur.getFullYear(), cur.getMonth(), 1);
                  const end = new Date(cur.getFullYear(), cur.getMonth() + 1, 0, 23, 59, 59, 999);
                  buckets.push({
                    label: monthNames[start.getMonth()] + (bucketUnit === 'month' && (reportTimeframe === 'allTime') ? ` '${String(start.getFullYear()).slice(2)}` : ''),
                    start, end
                  });
                  cur.setMonth(cur.getMonth() + 1);
                }
              }

              // --- Tally counts per list per bucket ---
              // series[listKey] = array of counts aligned with buckets
              const series = {};
              listKeys.forEach(k => series[k] = new Array(buckets.length).fill(0));
              const totals = {};
              listKeys.forEach(k => totals[k] = 0);

              completed.forEach(c => {
                if (c.date < buckets[0]?.start || c.date > rangeEnd) return;
                for (let i = 0; i < buckets.length; i++) {
                  if (c.date >= buckets[i].start && c.date <= buckets[i].end) {
                    series[c.list][i] += 1;
                    totals[c.list] += 1;
                    break;
                  }
                }
              });

              // Lists currently visible (not toggled off in the legend)
              const visibleKeys = listKeys.filter(k => !reportHiddenLists[k]);

              const grandTotal = visibleKeys.reduce((s, k) => s + totals[k], 0);
              const maxCount = Math.max(1, ...visibleKeys.flatMap(k => series[k]), ...(visibleKeys.length === 0 ? [1] : []));

              // --- Chart dimensions ---
              const chartW = 720, chartH = 340;
              const padL = 40, padR = 20, padT = 20, padB = 50;
              const plotW = chartW - padL - padR;
              const plotH = chartH - padT - padB;
              const n = buckets.length;
              const xFor = (i) => n <= 1 ? padL + plotW / 2 : padL + (plotW * i) / (n - 1);
              const yFor = (v) => padT + plotH - (plotH * v) / maxCount;

              // Build a smooth cubic-bezier path through the points (Catmull-Rom).
              // Control-point Y values are clamped to each segment's own range so
              // the curve can never overshoot below 0 or above a peak - important
              // here because task counts can't be negative.
              const smoothPath = (pts) => {
                if (pts.length === 0) return '';
                if (pts.length < 3) return pts.map((p, i) => `${i ? 'L' : 'M'} ${p.x} ${p.y}`).join(' ');
                let d = `M ${pts[0].x} ${pts[0].y}`;
                for (let i = 0; i < pts.length - 1; i++) {
                  const p0 = pts[i - 1] || pts[i];
                  const p1 = pts[i];
                  const p2 = pts[i + 1];
                  const p3 = pts[i + 2] || pts[i + 1];
                  const loY = Math.min(p1.y, p2.y);
                  const hiY = Math.max(p1.y, p2.y);
                  const clamp = (y) => Math.max(loY, Math.min(hiY, y));
                  const c1x = p1.x + (p2.x - p0.x) / 6;
                  const c1y = clamp(p1.y + (p2.y - p0.y) / 6);
                  const c2x = p2.x - (p3.x - p1.x) / 6;
                  const c2y = clamp(p2.y - (p3.y - p1.y) / 6);
                  d += ` C ${c1x} ${c1y}, ${c2x} ${c2y}, ${p2.x} ${p2.y}`;
                }
                return d;
              };

              // Y-axis ticks (integer, up to 5)
              const tickCount = Math.min(5, maxCount);
              const yTicks = [];
              for (let t = 0; t <= tickCount; t++) {
                yTicks.push(Math.round((maxCount * t) / tickCount));
              }
              const uniqueTicks = [...new Set(yTicks)];

              // Bar layout (grouped) - width based on how many lists are visible
              const groupWidth = n > 0 ? plotW / n : plotW;
              const barGroupInner = groupWidth * 0.7;
              const barWidth = barGroupInner / Math.max(1, visibleKeys.length);

              // Label thinning to avoid crowding
              const maxLabels = 14;
              const labelStep = Math.ceil(n / maxLabels);

              // Changing this string remounts the series so the draw-in animation
              // replays. Deliberately excludes hover state and the fire flicker,
              // which change constantly and would restart the animation.
              // Only changes when an intro should actually replay, so routine
              // filter changes re-render without remounting the series.
              const chartAnimKey = `${reportChartType}|${chartAnimToken}`;

              return (
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  {/* Controls */}
                  <div style={{
                    order: 1,
                    display: 'flex', flexWrap: 'wrap', gap: '15px', alignItems: 'flex-end',
                    marginBottom: '25px', marginTop: '25px'
                  }}>
                    {/* Task Status dropdown */}
                    <div style={{ minWidth: isMobile ? '100%' : '200px', flex: isMobile ? '1 1 100%' : '0 1 auto' }}>
                      <label style={{ display: 'block', color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '5px', fontFamily: 'var(--font-ui)' }}>
                        Task Status:
                      </label>
                      <div data-report-status-dropdown style={{ position: 'relative' }}>
                        <div
                          onClick={() => setReportStatusDropdownOpen(!reportStatusDropdownOpen)}
                          style={{
                            width: '100%', padding: '10px', background: 'rgba(var(--surface-rgb), 1)',
                            border: '2px solid rgba(var(--accent-rgb), 0.3)', borderRadius: '8px',
                            color: 'var(--text)', fontSize: '1rem', fontFamily: 'var(--font-ui)',
                            cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxSizing: 'border-box'
                          }}
                        >
                          <span>{({ complete: 'Complete', open: 'Open', both: 'Open + Complete' })[reportTaskStatus]}</span>
                          <span style={{ transform: reportStatusDropdownOpen ? 'rotate(360deg)' : 'rotate(180deg)', transition: 'transform 0.3s ease', fontSize: '0.9rem', display: 'inline-block' }}>▼</span>
                        </div>
                        {reportStatusDropdownOpen && (
                          <div style={{
                            position: 'absolute', top: '100%', left: 0, right: 0, marginTop: '-8px',
                            background: 'rgba(var(--surface-rgb), 1)', border: '2px solid rgba(var(--accent-rgb), 0.3)',
                            borderRadius: '8px', overflow: 'hidden', zIndex: 1000, boxShadow: '0 8px 24px rgba(var(--shadow-rgb),0.4)'
                          }}>
                            {[
                              { value: 'complete', label: 'Complete' },
                              { value: 'open', label: 'Open' },
                              { value: 'both', label: 'Open + Complete' }
                            ].map((opt, idx, arr) => (
                              <div
                                key={opt.value}
                                onClick={() => { setReportTaskStatus(opt.value); setReportStatusDropdownOpen(false); }}
                                style={{
                                  padding: '10px', color: 'var(--text)', fontSize: '1rem', cursor: 'pointer',
                                  background: reportTaskStatus === opt.value ? 'rgba(var(--accent-rgb), 0.4)' : 'transparent',
                                  borderBottom: idx < arr.length - 1 ? '1px solid rgba(var(--accent-rgb), 0.2)' : 'none',
                                  transition: 'background 0.2s ease', fontFamily: 'var(--font-ui)'
                                }}
                                onMouseOver={(e) => e.currentTarget.style.background = 'rgba(var(--accent-rgb), 0.3)'}
                                onMouseOut={(e) => e.currentTarget.style.background = reportTaskStatus === opt.value ? 'rgba(var(--accent-rgb), 0.4)' : 'transparent'}
                              >
                                {opt.label}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Timeframe dropdown */}
                    <div style={{ minWidth: isMobile ? '100%' : '200px', flex: isMobile ? '1 1 100%' : '0 1 auto' }}>
                      <label style={{ display: 'block', color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '5px', fontFamily: 'var(--font-ui)' }}>
                        Timeframe:
                      </label>
                      <div data-report-timeframe-dropdown style={{ position: 'relative' }}>
                        <div
                          onClick={() => setReportTimeframeDropdownOpen(!reportTimeframeDropdownOpen)}
                          style={{
                            width: '100%', padding: '10px', background: 'rgba(var(--surface-rgb), 1)',
                            border: '2px solid rgba(var(--accent-rgb), 0.3)', borderRadius: '8px',
                            color: 'var(--text)', fontSize: '1rem', fontFamily: 'var(--font-ui)',
                            cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxSizing: 'border-box'
                          }}
                        >
                          <span>{({ thisWeek: 'This Week', thisMonth: 'This Month', lastMonth: 'Last Month', last3: 'Last 3 Months', last6: 'Last 6 Months', allTime: 'All Time' })[reportTimeframe]}</span>
                          <span style={{ transform: reportTimeframeDropdownOpen ? 'rotate(360deg)' : 'rotate(180deg)', transition: 'transform 0.3s ease', fontSize: '0.9rem', display: 'inline-block' }}>▼</span>
                        </div>
                        {reportTimeframeDropdownOpen && (
                          <div style={{
                            position: 'absolute', top: '100%', left: 0, right: 0, marginTop: '-8px',
                            background: 'rgba(var(--surface-rgb), 1)', border: '2px solid rgba(var(--accent-rgb), 0.3)',
                            borderRadius: '8px', overflow: 'hidden', zIndex: 1000, boxShadow: '0 8px 24px rgba(var(--shadow-rgb),0.4)'
                          }}>
                            {[
                              { value: 'thisWeek', label: 'This Week' },
                              { value: 'thisMonth', label: 'This Month' },
                              { value: 'lastMonth', label: 'Last Month' },
                              { value: 'last3', label: 'Last 3 Months' },
                              { value: 'last6', label: 'Last 6 Months' },
                              { value: 'allTime', label: 'All Time' }
                            ].map((opt, idx, arr) => (
                              <div
                                key={opt.value}
                                onClick={() => { setReportTimeframe(opt.value); setReportTimeframeDropdownOpen(false); }}
                                style={{
                                  padding: '10px', color: 'var(--text)', fontSize: '1rem', cursor: 'pointer',
                                  background: reportTimeframe === opt.value ? 'rgba(var(--accent-rgb), 0.4)' : 'transparent',
                                  borderBottom: idx < arr.length - 1 ? '1px solid rgba(var(--accent-rgb), 0.2)' : 'none',
                                  transition: 'background 0.2s ease', fontFamily: 'var(--font-ui)'
                                }}
                                onMouseOver={(e) => e.currentTarget.style.background = 'rgba(var(--accent-rgb), 0.3)'}
                                onMouseOut={(e) => e.currentTarget.style.background = reportTimeframe === opt.value ? 'rgba(var(--accent-rgb), 0.4)' : 'transparent'}
                              >
                                {opt.label}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Chart type toggle */}
                    <div>
                      <label style={{ display: 'block', color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '5px', fontFamily: 'var(--font-ui)' }}>
                        Chart:
                      </label>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        {['line', 'bar'].map(type => (
                          <button
                            key={type}
                            onClick={() => setReportChartType(type)}
                            style={{
                              padding: '10px 20px', borderRadius: '8px', cursor: 'pointer',
                              fontFamily: 'var(--font-ui)', fontSize: '0.95rem', textTransform: 'capitalize',
                              border: reportChartType === type ? '2px solid var(--accent)' : '2px solid rgba(var(--accent-rgb), 0.3)',
                              background: reportChartType === type ? 'linear-gradient(135deg, var(--accent), var(--accent-light))' : 'rgba(var(--surface-rgb), 1)',
                              color: reportChartType === type ? '#fff' : 'var(--text-muted)',
                              transition: 'all 0.2s ease'
                            }}
                          >
                            {type}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Summary stats */}
                  <div style={{
                    order: 3,
                    display: 'flex', flexWrap: 'wrap', gap: isMobile ? '8px' : '15px', marginBottom: '20px'
                  }}>
                    <div style={{
                      background: 'rgba(var(--surface-raised-rgb), 0.4)', border: '2px solid rgba(var(--accent-rgb), 0.2)',
                      borderRadius: '12px', padding: isMobile ? '14px 12px' : '18px 22px', minWidth: isMobile ? '0' : '150px', flex: isMobile ? '1 1 0' : '0 1 auto', textAlign: isMobile ? 'center' : 'left'
                    }}>
                      <div style={{ color: 'var(--text-muted)', fontSize: isMobile ? '0.7rem' : '0.85rem', fontFamily: 'var(--font-ui)', marginBottom: '4px', lineHeight: 1.25 }}>
                        {({ complete: 'Tasks Completed', open: 'Tasks Opened', both: 'Open + Complete' })[reportTaskStatus]}
                      </div>
                      <div style={{ color: 'var(--text)', fontSize: isMobile ? '1.5rem' : '2rem', fontWeight: '700', fontFamily: 'var(--font-ui)' }}>
                        {grandTotal}
                      </div>
                    </div>

                    <div style={{
                      background: 'rgba(var(--surface-raised-rgb), 0.4)', border: '2px solid rgba(var(--accent-rgb), 0.2)',
                      borderRadius: '12px', padding: isMobile ? '14px 12px' : '18px 22px', minWidth: isMobile ? '0' : '150px', flex: isMobile ? '1 1 0' : '0 1 auto', textAlign: isMobile ? 'center' : 'left'
                    }}>
                      <div style={{ color: 'var(--text-muted)', fontSize: isMobile ? '0.7rem' : '0.85rem', fontFamily: 'var(--font-ui)', marginBottom: '4px', lineHeight: 1.25 }}>
                        Open Tasks
                      </div>
                      <div style={{ color: 'var(--text)', fontSize: isMobile ? '1.5rem' : '2rem', fontWeight: '700', fontFamily: 'var(--font-ui)' }}>
                        {openTasksCount}
                      </div>
                    </div>

                    <div style={{
                      background: 'rgba(var(--surface-raised-rgb), 0.4)', border: '2px solid rgba(var(--accent-rgb), 0.2)',
                      borderRadius: '12px', padding: isMobile ? '14px 12px' : '18px 22px', minWidth: isMobile ? '0' : '150px', flex: isMobile ? '1 1 0' : '0 1 auto', textAlign: isMobile ? 'center' : 'left'
                    }}>
                      <div style={{ color: 'var(--text-muted)', fontSize: isMobile ? '0.7rem' : '0.85rem', fontFamily: 'var(--font-ui)', marginBottom: '4px', lineHeight: 1.25 }}>
                        Backlog
                      </div>
                      <div style={{ color: 'var(--text)', fontSize: isMobile ? '1.5rem' : '2rem', fontWeight: '700', fontFamily: 'var(--font-ui)' }}>
                        {backlogTasksCount}
                      </div>
                    </div>
                  </div>

                  {/* Fire chart - orange fills the flame silhouette by completion */}
                  <div style={{
                    order: 0,
                    background: 'rgba(var(--surface-raised-rgb), 0.4)', border: '2px solid rgba(var(--accent-rgb), 0.2)',
                    borderRadius: '12px', padding: '18px 22px', marginBottom: '20px',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'
                  }}>
                    {(() => {
                      const count = grandTotal;
                      // Fill target scales at 30 completed tasks per month of the range.
                      // Fill target: ~30 completed tasks per month of the range
                      // (This Week is scaled to 7, i.e. one a day).
                      const wk = Number(settings.weeklyFireGoal) || 7;
                      const mo = Number(settings.monthlyFireGoal) || 30;
                      const target = ({
                        thisWeek: wk, thisMonth: mo, lastMonth: mo,
                        last3: mo * 3, last6: mo * 6, allTime: mo * 12
                      })[reportTimeframe] || mo;
                      const fillRatio = Math.max(0, Math.min(1, count / target));
                      // Apply the load "rise" animation multiplier
                      const animatedFill = fillRatio * fireFillAnim;

                      // The flame occupies viewBox y ~[40..1240] in the 1280 space.
                      // Convert fill ratio to a y-level (top of the orange). Higher
                      // fill => smaller y (orange reaches higher up the flame).
                      const flameTopY = 60;
                      const flameBottomY = 1240;
                      const span = flameBottomY - flameTopY;
                      const levelY = flameBottomY - span * animatedFill;
                      const uid = 'firefill'; // single instance on the page

                      // Build a spiky, fire-like top edge whose spikes oscillate
                      // smoothly over time. Uses quadratic curves between spike tips
                      // so the flames flow rather than snap.
                      const makeFlameEdge = (base, t) => {
                        const peaks = 8;
                        const step = 1280 / peaks;
                        // Compute each spike tip, its height driven by an individual
                        // sine wave (different speed/phase per spike) for a lively flame.
                        const tips = [];
                        for (let i = 0; i <= peaks; i++) {
                          const x = i * step;
                          // Base spike height alternates tall/short
                          const baseAmp = (i % 2 === 0) ? 95 : 45;
                          // Each spike bobs on its own sine wave
                          const osc = Math.sin(t * 3 + i * 1.7) * 22 + Math.sin(t * 5.5 + i * 0.9) * 10;
                          const peakY = base - baseAmp + osc;
                          tips.push({ x, y: peakY });
                        }
                        // Build the path: start bottom-left, curve through spike tips
                        // with valleys dipping between them.
                        let d = `M 0 1280 L 0 ${base + 10} L ${tips[0].x} ${tips[0].y}`;
                        for (let i = 1; i < tips.length; i++) {
                          const prev = tips[i - 1];
                          const cur = tips[i];
                          const valleyX = (prev.x + cur.x) / 2;
                          const valleyY = base + 12 + Math.sin(t * 4 + i * 2.1) * 8;
                          // Quadratic down into the valley, then quadratic up to the next tip
                          d += ` Q ${(prev.x + valleyX) / 2} ${base - 10}, ${valleyX} ${valleyY}`;
                          d += ` Q ${(valleyX + cur.x) / 2} ${cur.y - 8}, ${cur.x} ${cur.y}`;
                        }
                        d += ` L 1280 ${base + 10} L 1280 1280 Z`;
                        return d;
                      };
                      const flameEdge = makeFlameEdge(levelY, fireFlicker);

                      const glow = count <= 0
                        ? 'rgba(120,120,140,0.12)'
                        : `rgba(255, 140, 40, ${0.18 + animatedFill * 0.4})`;

                      return (
                        <>
                          <svg
                            width={isMobile ? 170 : 220}
                            height={isMobile ? 170 : 220}
                            viewBox="0 0 1280 1280"
                            preserveAspectRatio="xMidYMid meet"
                            style={{ filter: `drop-shadow(0 0 ${8 + animatedFill * 26}px ${glow})` }}
                          >
                            <defs>
                              {/* Flame silhouette used as a clip for the orange fill.
                                  Transform is applied directly on each path so the clip
                                  maps reliably into the 0..1280 viewBox space. */}
                              <clipPath id={`${uid}-clip`} clipPathUnits="userSpaceOnUse">
                                <path transform="translate(0,1280) scale(0.1,-0.1)" d="M7090 12669 c-1 -257 -76 -628 -175 -871 -149 -365 -354 -643 -825 -1123 -562 -572 -1053 -1165 -1415 -1710 -256 -385 -443 -729 -568 -1045 -164 -415 -213 -716 -189 -1167 7 -126 17 -257 22 -293 4 -36 11 -87 15 -115 3 -27 17 -108 31 -180 66 -339 167 -634 321 -937 181 -358 383 -630 707 -954 206 -206 336 -319 558 -486 130 -98 458 -322 462 -316 1 1 20 53 40 113 45 131 132 315 211 452 58 99 233 361 296 443 231 303 515 606 864 926 411 375 725 680 839 814 99 117 243 309 323 432 261 403 385 922 386 1623 0 207 -4 314 -17 410 -76 586 -230 1136 -500 1782 -358 860 -885 1741 -1298 2168 l-87 90 -1 -56z"/>
                                <path transform="translate(0,1280) scale(0.1,-0.1)" d="M9510 9493 c0 -5 9 -55 21 -113 89 -462 132 -1021 110 -1453 -13 -249 -39 -482 -67 -597 -109 -438 -605 -1140 -1299 -1835 -126 -127 -291 -284 -365 -350 -160 -142 -223 -206 -374 -380 -276 -318 -452 -600 -476 -761 -5 -38 -19 -133 -31 -211 -21 -141 -21 -189 2 -261 8 -25 15 -32 28 -26 73 31 289 101 416 134 203 54 418 97 820 164 894 149 1116 222 1550 511 387 257 676 553 814 833 98 197 195 572 233 892 19 165 16 597 -5 780 -104 913 -509 1833 -1058 2404 -105 109 -294 276 -312 276 -4 0 -7 -3 -7 -7z"/>
                                <path transform="translate(0,1280) scale(0.1,-0.1)" d="M3355 8046 c-199 -134 -336 -247 -523 -430 -189 -186 -290 -306 -418 -498 -270 -403 -415 -856 -401 -1261 8 -258 75 -514 202 -772 237 -481 641 -873 1170 -1135 358 -177 715 -283 1170 -349 153 -22 511 -54 546 -49 16 2 -12 23 -107 82 -709 437 -1164 850 -1434 1303 -118 197 -228 493 -244 653 -4 36 -11 92 -16 125 -5 33 -16 116 -25 185 -8 69 -20 163 -26 210 -6 47 -13 196 -16 332 -5 240 4 411 38 673 5 44 12 98 15 120 3 22 9 65 14 95 5 30 12 73 16 95 26 174 135 576 188 698 5 9 4 17 0 17 -5 0 -72 -43 -149 -94z"/>
                              </clipPath>
                              {/* Vertical gradient: deep red-orange at bottom -> bright yellow-orange at top */}
                              <linearGradient id={`${uid}-grad`} x1="0" y1="1" x2="0" y2="0">
                                <stop offset="0%" stopColor="#c1440e" />
                                <stop offset="45%" stopColor="#f2600f" />
                                <stop offset="80%" stopColor="#ff9d2f" />
                                <stop offset="100%" stopColor="#ffd76a" />
                              </linearGradient>
                            </defs>

                            {/* Everything below is clipped to the flame silhouette. */}
                            <g clipPath={`url(#${uid}-clip)`}>
                              {/* Dark base fills the whole flame (the "unlit" portion) */}
                              <rect x="0" y="0" width="1280" height="1280" fill="#15141d" />
                              {/* Orange fill rising from the bottom with a smoothly
                                  oscillating spiky flame edge (React-driven, no SMIL). */}
                              {animatedFill > 0.001 && (
                                <path fill={`url(#${uid}-grad)`} d={flameEdge} />
                              )}
                            </g>
                          </svg>
                          <div style={{
                            marginTop: '8px', textAlign: 'center', fontFamily: 'var(--font-ui)'
                          }}>
                            <div style={{ color: 'var(--text)', fontSize: '1.8rem', fontWeight: '700', lineHeight: 1 }}>
                              {count}
                            </div>
                            <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '4px' }}>
                              {/* The flame that used to mark a hit goal sat here.
                                  It's directly beneath the large flame this card
                                  is built around, so it read as a stray mark
                                  rather than a badge - the big one already shows
                                  a full fire when the goal is met. */}
                              {count === 0 ? 'No tasks yet' : ({ complete: 'Tasks Completed', open: 'Tasks Opened', both: 'Open + Complete' })[reportTaskStatus]}
                            </div>
                          </div>
                        </>
                      );
                    })()}
                  </div>

                  {/* Chart card */}
                  <div style={{
                    order: 2,
                    background: 'rgba(var(--surface-raised-rgb), 0.4)', border: '2px solid rgba(var(--accent-rgb), 0.2)',
                    borderRadius: '12px', padding: isMobile ? '12px 8px' : '20px', overflowX: 'auto'
                  }}>
                    <div style={{ position: 'relative' }}>
                    <svg viewBox={`0 0 ${chartW} ${chartH}`} style={{ width: '100%', minWidth: (!isMobile && n > 20) ? '900px' : '100%', height: 'auto', display: 'block' }}>
                      {/* Y gridlines + labels */}
                      {uniqueTicks.map((tick, i) => (
                        <g key={'y' + i}>
                          {/* style, not a stroke attribute: var() does not
                              resolve in SVG presentation attributes. */}
                          <line x1={padL} y1={yFor(tick)} x2={chartW - padR} y2={yFor(tick)}
                            style={{ stroke: 'rgba(var(--border-rgb), 0.22)' }} strokeWidth="1" />
                          <text x={padL - 8} y={yFor(tick) + 4} textAnchor="end" style={{ fill: 'var(--text-muted)' }} fontSize="12" fontFamily="Quicksand, sans-serif">{tick}</text>
                        </g>
                      ))}

                      {/* X axis labels */}
                      {buckets.map((b, i) => (
                        (i % labelStep === 0 || i === n - 1) && (
                          <text key={'x' + i} x={reportChartType === 'bar' ? padL + groupWidth * i + groupWidth / 2 : xFor(i)} y={chartH - padB + 18}
                            textAnchor="middle" style={{ fill: 'var(--text-muted)' }} fontSize="11" fontFamily="Quicksand, sans-serif">
                            {b.label}
                          </text>
                        )
                      ))}

                      {/* Hover vertical guide line */}
                      {reportHoverIndex !== null && buckets[reportHoverIndex] && (
                        <line
                          x1={reportChartType === 'bar' ? padL + groupWidth * reportHoverIndex + groupWidth / 2 : xFor(reportHoverIndex)}
                          y1={padT}
                          x2={reportChartType === 'bar' ? padL + groupWidth * reportHoverIndex + groupWidth / 2 : xFor(reportHoverIndex)}
                          y2={padT + plotH}
                          stroke="rgba(255,255,255,0.25)" strokeWidth="1" strokeDasharray="4 4"
                        />
                      )}

                      {/* Data: bars or lines */}
                      {reportChartType === 'bar' ? (
                        buckets.map((b, i) => (
                          <g key={'bar' + i + '-' + chartAnimKey}>
                            {visibleKeys.map((k, ki) => {
                              const v = series[k][i];
                              const x = padL + groupWidth * i + (groupWidth - barGroupInner) / 2 + ki * barWidth;
                              const h = (plotH * v) / maxCount;
                              const baselineY = padT + plotH;
                              // Stagger across buckets so bars rise left to right
                              const delayMs = n <= 1 ? 0 : Math.round((i / (n - 1)) * CHART_DRAW_MS * 0.6);
                              return v > 0 ? (
                                <rect key={k} x={x} y={baselineY - h} width={Math.max(1, barWidth - 2)} height={h}
                                  fill={listColors[k]} rx="2" opacity={reportHoverIndex === null || reportHoverIndex === i ? 0.9 : 0.35}
                                  style={chartAnimate ? {
                                    transition: 'opacity 0.15s ease',
                                    transformOrigin: `${x}px ${baselineY}px`,
                                    // 'both' holds scaleY(0) during the stagger delay,
                                    // otherwise the bar would flash full-height first
                                    animation: `growBar ${Math.round(CHART_DRAW_MS * 0.5)}ms ease-out ${CHART_START_DELAY_MS + delayMs}ms both`
                                  } : { transition: 'opacity 0.15s ease' }} />
                              ) : null;
                            })}
                          </g>
                        ))
                      ) : (
                        visibleKeys.map(k => {
                          const vals = series[k];
                          // Index of the last bucket that actually has data. Anything
                          // after this is trailing zeros, which just drag a flat line
                          // along the axis - so we stop the line there.
                          const lastIdx = vals.reduce((last, v, i) => (v > 0 ? i : last), -1);
                          if (lastIdx < 0) return null; // nothing in range at all

                          const pts = vals.slice(0, lastIdx + 1).map((v, i) => ({ x: xFor(i), y: yFor(v) }));
                          let pathD = smoothPath(pts);
                          // If the series opens with a value, rise from the baseline so
                          // the line visibly draws up from zero instead of starting mid-air.
                          if (vals[0] > 0) {
                            pathD = `M ${xFor(0)} ${yFor(0)} L ` + pathD.slice(2);
                          }
                          const drawMs = CHART_DRAW_MS;
                          return (
                            <g key={'line' + k + '-' + chartAnimKey}>
                              <path d={pathD} fill="none" stroke={listColors[k]} strokeWidth="4"
                                strokeLinejoin="round" strokeLinecap="round" opacity="0.95"
                                pathLength="1"
                                strokeDasharray="1"
                                style={chartAnimate
                                  ? { animation: `drawLine ${drawMs}ms ease-out ${CHART_START_DELAY_MS}ms forwards` }
                                  : undefined} />
                              {vals.map((v, i) => (
                                // Only mark buckets that have data
                                v > 0 ? (
                                  <circle key={i} cx={xFor(i)} cy={yFor(v)}
                                    r={reportHoverIndex === i ? 6 : 4}
                                    fill={listColors[k]}
                                    stroke={reportHoverIndex === i ? '#fff' : 'none'}
                                    strokeWidth={reportHoverIndex === i ? 2 : 0}
                                    style={chartAnimate ? {
                                      transition: 'r 0.1s ease',
                                      transformOrigin: `${xFor(i)}px ${yFor(v)}px`,
                                      opacity: 0,
                                      animation: `dotPop 260ms ease-out forwards`,
                                      // stagger each dot so it appears as the line reaches it,
                                      // offset by the same wait the line itself takes
                                      animationDelay: `${CHART_START_DELAY_MS + (n <= 1 ? 0 : Math.round((i / (n - 1)) * drawMs))}ms`
                                    } : { transition: 'r 0.1s ease', opacity: 1 }} />
                                ) : null
                              ))}
                            </g>
                          );
                        })
                      )}

                      {/* Invisible hover-catcher columns */}
                      {buckets.map((b, i) => {
                        const colCenter = reportChartType === 'bar' ? padL + groupWidth * i + groupWidth / 2 : xFor(i);
                        const colW = n <= 1 ? plotW : plotW / n;
                        return (
                          <rect key={'hit' + i}
                            x={colCenter - colW / 2} y={padT} width={colW} height={plotH}
                            fill="transparent"
                            onMouseEnter={() => setReportHoverIndex(i)}
                            onMouseLeave={() => setReportHoverIndex(null)}
                            onTouchStart={() => setReportHoverIndex(i)}
                            style={{ cursor: 'pointer' }}
                          />
                        );
                      })}
                    </svg>

                    {/* Tooltip */}
                    {reportHoverIndex !== null && buckets[reportHoverIndex] && (() => {
                      const b = buckets[reportHoverIndex];
                      const bucketTotal = visibleKeys.reduce((s, k) => s + series[k][reportHoverIndex], 0);
                      // Position as a percentage across the plot area
                      const centerX = reportChartType === 'bar' ? padL + groupWidth * reportHoverIndex + groupWidth / 2 : xFor(reportHoverIndex);
                      const leftPct = (centerX / chartW) * 100;
                      const onRightHalf = leftPct > 55;
                      // Build a readable date range label
                      const fmt = (d) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: bucketUnit === 'month' ? 'numeric' : undefined });
                      let rangeLabel;
                      if (bucketUnit === 'day') rangeLabel = fmt(b.start);
                      else if (bucketUnit === 'week') rangeLabel = `${fmt(b.start)} – ${fmt(b.end)}`;
                      else rangeLabel = b.start.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
                      return (
                        <div style={{
                          position: 'absolute',
                          left: `${leftPct}%`,
                          top: '8px',
                          transform: onRightHalf ? 'translateX(-105%)' : 'translateX(5%)',
                          background: 'rgba(var(--surface-deep-rgb), 0.97)',
                          border: '1px solid rgba(var(--accent-rgb), 0.5)',
                          borderRadius: '10px',
                          padding: isMobile ? '8px 10px' : '10px 14px',
                          pointerEvents: 'none',
                          minWidth: isMobile ? '110px' : '150px',
                          fontSize: isMobile ? '0.9em' : '1em',
                          boxShadow: '0 8px 24px rgba(var(--shadow-rgb),0.5)',
                          zIndex: 10,
                          fontFamily: 'var(--font-ui)'
                        }}>
                          <div style={{ color: 'var(--text)', fontSize: '0.85rem', fontWeight: '700', marginBottom: '8px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '6px' }}>
                            {rangeLabel}
                          </div>
                          {visibleKeys.map(k => (
                            <div key={k} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', marginBottom: '3px' }}>
                              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <span style={{ width: '10px', height: '10px', borderRadius: '3px', background: listColors[k], display: 'inline-block' }}></span>
                                <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{listLabels[k]}</span>
                              </span>
                              <span style={{ color: 'var(--text)', fontSize: '0.85rem', fontWeight: '600' }}>{series[k][reportHoverIndex]}</span>
                            </div>
                          ))}
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', marginTop: '7px', paddingTop: '6px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                            <span style={{ color: 'var(--text)', fontSize: '0.8rem', fontWeight: '700' }}>Total</span>
                            <span style={{ color: 'var(--text)', fontSize: '0.85rem', fontWeight: '700' }}>{bucketTotal}</span>
                          </div>
                        </div>
                      );
                    })()}
                    </div>

                    {/* Legend - click to toggle a list on/off in the chart */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '18px', marginTop: '15px', justifyContent: 'center' }}>
                      {listKeys.map(k => {
                        const hidden = !!reportHiddenLists[k];
                        return (
                          <div
                            key={k}
                            onClick={() => setReportHiddenLists(prev => ({ ...prev, [k]: !prev[k] }))}
                            style={{
                              display: 'flex', alignItems: 'center', gap: '7px', cursor: 'pointer',
                              opacity: hidden ? 0.4 : 1, transition: 'opacity 0.2s ease', userSelect: 'none'
                            }}
                            title={hidden ? `Show ${listLabels[k]}` : `Hide ${listLabels[k]}`}
                          >
                            <span style={{
                              width: '14px', height: '14px', borderRadius: '4px',
                              background: hidden ? 'transparent' : listColors[k],
                              border: `2px solid ${listColors[k]}`,
                              display: 'inline-block', boxSizing: 'border-box'
                            }}></span>
                            <span style={{
                              color: 'var(--text)', fontSize: '0.9rem', fontFamily: 'var(--font-ui)',
                              textDecoration: hidden ? 'line-through' : 'none'
                            }}>
                              {listLabels[k]} <span style={{ color: 'var(--text-muted)' }}>({totals[k]})</span>
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {grandTotal === 0 && (
                    <div style={{ order: 4, textAlign: 'center', color: 'var(--text-muted)', fontFamily: 'var(--font-ui)', marginTop: '20px', fontSize: '0.95rem' }}>
                      No completed tasks in this timeframe.
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        )}
      </div>
    </div>
    </TaskContext.Provider>
  );
}

// ---- Error boundary --------------------------------------------------------
// Without this, one render exception white-screens the app with no way back.
// Worse: because state is rehydrated from localStorage, a single bad value can
// throw on every reload - an unrecoverable loop. This gives you your data back.
class LittleFiresErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null, confirmingReset: false };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error('Little Fires crashed:', error, info);
  }

  // Read storage directly rather than app state - app state is what broke.
  downloadRawData = () => {
    try {
      const keys = ['little_fires_lists', 'little_fires_archived', 'little_fires_notes',
        'little_fires_projects', 'little_fires_goals', 'standaloneTimeLogs',
        'little_fires_settings', 'little_fires_pre_import_backup'];
      const dump = { app: 'little-fires', schemaVersion: 1, recoveredAt: new Date().toISOString(), data: {} };
      keys.forEach(k => {
        const raw = localStorage.getItem(k);
        if (raw === null) return;
        try { dump.data[k] = JSON.parse(raw); } catch { dump.data[k] = raw; }
      });
      const blob = new Blob([JSON.stringify(dump, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `little-fires-recovery-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (err) {
      window.alert('Could not export: ' + err.message);
    }
  };

  // Last resort for a reload loop caused by one corrupted value.
  // Two taps rather than window.confirm. This is the error screen, so it is
  // exactly where a silently-blocked dialog does the most damage: the button
  // that was meant to be the last resort would appear dead. A sandboxed iframe
  // suppresses confirm entirely, and this class can't use the app's own dialog.
  clearAndReload = () => {
    if (!this.state.confirmingReset) {
      this.setState({ confirmingReset: true });
      return;
    }
    try {
      Object.keys(localStorage)
        .filter(k => k.startsWith('little_fires') || k === 'standaloneTimeLogs')
        .forEach(k => localStorage.removeItem(k));
    } catch (_) {}
    window.location.reload();
  };

  render() {
    if (!this.state.error) return this.props.children;

    const btn = {
      padding: '12px 18px', borderRadius: '8px', cursor: 'pointer',
      fontFamily: 'var(--font-ui)', fontSize: '0.9rem', fontWeight: 600
    };

    return (
      <div style={{
        minHeight: '100vh', background: 'linear-gradient(135deg, #1a1a2e 0%, #2d2d44 100%)',
        color: 'var(--text)', fontFamily: 'var(--font-ui)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px'
      }}>
        <div style={{
          maxWidth: '520px', background: 'rgba(var(--surface-raised-rgb), 0.5)',
          border: '2px solid rgba(255, 107, 107, 0.4)', borderRadius: '14px', padding: '26px'
        }}>
          <h2 style={{ margin: '0 0 10px', fontSize: '1.35rem' }}>Something broke</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: 1.6, margin: '0 0 18px' }}>
            The app hit an error it couldn't recover from. Your data is still in this
            browser and untouched. Download a copy before anything else — then try
            reloading.
          </p>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '18px' }}>
            <button onClick={this.downloadRawData} style={{
              ...btn, background: 'linear-gradient(135deg, #53745f, #6a8f76)',
              border: '1px solid rgba(83, 116, 95, 0.5)', color: '#fff'
            }}>
              Download My Data
            </button>
            <button onClick={() => window.location.reload()} style={{
              ...btn, background: 'rgba(var(--surface-rgb), 1)',
              border: '2px solid rgba(83, 116, 95, 0.4)', color: 'var(--text)'
            }}>
              Reload
            </button>
            <button onClick={this.clearAndReload} style={{
              ...btn, background: 'rgba(var(--surface-rgb), 1)',
              border: '2px solid rgba(255, 107, 107, 0.4)', color: '#ff8f8f'
            }}>
                {this.state.confirmingReset ? 'Tap again to erase' : 'Reset App'}
            </button>
          </div>

          <details style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>
            <summary style={{ cursor: 'pointer', marginBottom: '8px' }}>Error details</summary>
            <pre style={{
              whiteSpace: 'pre-wrap', wordBreak: 'break-word', margin: 0,
              padding: '10px', background: 'rgba(0,0,0,0.3)', borderRadius: '8px',
              fontSize: '0.72rem', maxHeight: '180px', overflow: 'auto'
            }}>
              {String(this.state.error && (this.state.error.stack || this.state.error.message || this.state.error))}
            </pre>
          </details>

          <p style={{ color: '#8a8a9a', fontSize: '0.75rem', margin: '16px 0 0', lineHeight: 1.5 }}>
            "Reset App" erases everything stored here. Only use it if reloading keeps
            failing, and download your data first.
          </p>
        </div>
      </div>
    );
  }
}

export default function LittleFires() {
  return (
    <LittleFiresErrorBoundary>
      <LittleFiresApp />
    </LittleFiresErrorBoundary>
  );
}
