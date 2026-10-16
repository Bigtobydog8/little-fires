// firebase.js — Sessions 1 + 3 of SYNC-PLAN.md.
//
// Session 1 decisions (see comments at each):
//   1. authDomain is the SERVING domain, paired with vercel.json's /__/auth/*
//      proxy. If the app ever moves to a custom domain, change BOTH.
//   2. Redirect, not popup — reliable inside the iOS home-screen app.
//
// Session 3 adds Firestore. This is where the ~92 KB gzipped lands, deferred
// until now on purpose. Offline persistence is on, so writes made in airplane
// mode queue locally and land on reconnect.
//
// The config is not secret — Firebase web config is public by design and
// ships in every browser. Security comes entirely from Firestore rules.

import { initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithRedirect,
  getRedirectResult,
  onAuthStateChanged,
  signOut
} from 'firebase/auth';
import {
  initializeFirestore,
  persistentLocalCache,
  doc,
  writeBatch,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  arrayUnion,
  query,
  where,
  limit,
  onSnapshot,
  collection
} from 'firebase/firestore';

const firebaseConfig = {
  apiKey: 'AIzaSyCe9iy0avKz9rwwi5fuk_gQsFrieEot3so',
  authDomain: 'little-fires.vercel.app',
  projectId: 'little-fires',
  storageBucket: 'little-fires.firebasestorage.app',
  messagingSenderId: '751852393812',
  appId: '1:751852393812:web:e72c9a1bdcbe54276664c1'
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);

// Offline persistence: a write made with no connection is queued in IndexedDB
// and sent on reconnect. This is what makes airplane-mode edits eventually
// land without any code in the app caring.
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache()
});

// The Gmail scope is RESTRICTED by Google: fine for the project owner and
// named test users with no verification, but publishing it to strangers needs
// full OAuth verification plus the annual CASA security assessment.
export const GMAIL_READONLY_SCOPE = 'https://www.googleapis.com/auth/gmail.readonly';

// Takes an options object so an ordinary sign-in never drags a mail-permission
// screen in front of someone who only wanted their tasks to sync. The scope is
// requested INCREMENTALLY - at the moment the email feature is switched on.
export function startGoogleSignIn(options) {
  const provider = new GoogleAuthProvider();
  if (options && options.gmail) {
    provider.addScope(GMAIL_READONLY_SCOPE);
    // Without this, a user who already has a Google session is signed straight
    // back in with the scopes they granted last time - no consent screen, and
    // no Gmail access, with nothing to indicate why.
    provider.setCustomParameters({ prompt: 'consent' });
  }
  return signInWithRedirect(auth, provider);
}

// The Google OAuth access token - NOT the Firebase ID token, and not on the
// user object. It is the only credential the Gmail REST API accepts, it exists
// solely on the redirect result, and it lasts about an hour with no refresh
// token available to the browser. Hence: scanning is a button, never a
// background job.
export function googleAccessTokenFrom(result) {
  try {
    const cred = GoogleAuthProvider.credentialFromResult(result);
    return (cred && cred.accessToken) || null;
  } catch (err) {
    return null;
  }
}

export function endSignIn() {
  return signOut(auth);
}

export {
  onAuthStateChanged, getRedirectResult, onSnapshot, collection, doc,
  // Session 2 (pairing): direct reads/writes for the invite handshake, which
  // is request/response rather than mirror-shaped, so pushDocs is wrong for it.
  getDoc, setDoc, updateDoc, deleteDoc, arrayUnion, query, where, limit
};

// The one write primitive the mirror uses. Takes [{ path, data }] and commits
// them as batches of up to 450 (Firestore's limit is 500; headroom is cheap).
// setDoc semantics with merge:false — the local record IS the truth in a
// one-way push, so the cloud copy is replaced, not patched.
//
// Serialised through a single in-flight promise so two rapid flushes cannot
// interleave their batches.
let pushChain = Promise.resolve();
export function pushDocs(ops) {
  if (!ops || !ops.length) return pushChain;
  pushChain = pushChain.then(async () => {
    for (let i = 0; i < ops.length; i += 450) {
      const slice = ops.slice(i, i + 450);
      const batch = writeBatch(db);
      slice.forEach(({ path, data }) => {
        batch.set(doc(db, path), data);
      });
      await batch.commit();
    }
  });
  return pushChain;
}

export function describeAuthError(err) {
  const code = (err && err.code) || '';
  switch (code) {
    case 'auth/network-request-failed':
      return 'No connection. Sign-in needs the network; the rest of the app works offline.';
    case 'auth/unauthorized-domain':
      return 'This domain is not authorized for sign-in. (Firebase Console → Authentication → Settings → Authorized domains.)';
    case 'auth/user-disabled':
      return 'This account has been disabled.';
    case 'auth/operation-not-allowed':
      return 'Google sign-in is not enabled for this project.';
    case 'auth/too-many-requests':
      return 'Too many attempts. Wait a moment and try again.';
    default:
      return 'Sign-in failed' + (code ? ' (' + code + ')' : '') + '. Try again.';
  }
}
