// firebase.js — Session 1 of SYNC-PLAN.md. Init only; nothing syncs yet.
//
// Two decisions live here and are easy to undo by accident, so they are
// written down where they sit:
//
// 1. authDomain is the SERVING domain, not the firebaseapp.com default.
//    Redirect sign-in stores its result under authDomain's origin. When that
//    origin differs from the app's, Safari's third-party-storage blocking
//    (which governs the installed home-screen app) silently discards it: the
//    redirect completes, Google succeeds, and you come back signed out.
//    Keeping authDomain on our own origin removes the cross-origin access
//    entirely. It only works because vercel.json transparently proxies
//    /__/auth/* to little-fires.firebaseapp.com — the two files are a pair.
//    If the app ever moves to a custom domain, change BOTH.
//
// 2. Redirect, not popup. Popup sign-in is unreliable inside an iOS
//    home-screen web app. The redirect navigates away and back; unsaved
//    editor state survives via the hide-time save + crash journal that
//    already exist for PWA kills.
//
// The config is not secret — Firebase web config is public by design and
// ships in every browser. Security comes entirely from Firestore rules.
// (measurementId is omitted on purpose: analytics is linked but unused.)

import { initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithRedirect,
  getRedirectResult,
  onAuthStateChanged,
  signOut
} from 'firebase/auth';
// Firestore deliberately not imported yet — see note below.

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
// db comes in Session 3, when something first reads or writes it.

// Provider-agnostic on purpose (App Store Guideline 4.8 groundwork): the app
// calls startGoogleSignIn today, but everything downstream reads only
// auth.currentUser / the user handed to onAuthStateChanged — never a
// Google-specific field. Adding Apple later is a second function here and a
// second button in Settings, nothing else.
export function startGoogleSignIn() {
  return signInWithRedirect(auth, new GoogleAuthProvider());
}

export function endSignIn() {
  return signOut(auth);
}

export { onAuthStateChanged, getRedirectResult };

// Human-readable auth errors. Firebase codes are stable strings; anything
// unrecognised falls through with its code visible, because "something went
// wrong" with no code is undebuggable from a phone.
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
