import { GoogleAuthProvider, createUserWithEmailAndPassword, onAuthStateChanged, signInWithEmailAndPassword, signInWithPopup, updateProfile } from 'https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js';
import { doc, setDoc } from 'https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js';
import { auth, db } from './firebaseClient.js';

let mode = 'login';
const $ = (id) => document.getElementById(id);
const params = new URLSearchParams(location.search);
const next = params.get('next');
const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

function setMode(nextMode) {
  mode = nextMode;
  $('loginTab').classList.toggle('active', mode === 'login');
  $('signupTab').classList.toggle('active', mode === 'signup');
  $('nameLabel').classList.toggle('hidden', mode !== 'signup');
  $('authButton').textContent = mode === 'signup' ? 'Create Account' : 'Login';
  $('authMessage').classList.remove('error');
  $('authMessage').textContent = '';
}

function goNext() {
  window.location.href = next === 'book' ? './#book' : './bookings.html';
}

async function saveUserProfile(user, extra = {}) {
  await setDoc(doc(db, 'users', user.uid), {
    uid: user.uid,
    email: user.email || '',
    name: user.displayName || extra.name || '',
    photoURL: user.photoURL || '',
    role: 'user',
    authProvider: extra.authProvider || 'email',
    updatedAt: new Date().toISOString(),
    ...extra,
  }, { merge: true });
}

function showAuthError(error) {
  $('authMessage').classList.add('error');
  if (error?.code === 'auth/unauthorized-domain') {
    $('authMessage').textContent = 'Google login needs this website domain added in Firebase Auth authorized domains.';
    return;
  }
  if (error?.code === 'auth/popup-closed-by-user') {
    $('authMessage').textContent = 'Google login was closed before completion.';
    return;
  }
  $('authMessage').textContent = error.message || 'Could not continue.';
}

$('loginTab').addEventListener('click', () => setMode('login'));
$('signupTab').addEventListener('click', () => setMode('signup'));
$('googleButton').addEventListener('click', async () => {
  $('authMessage').classList.remove('error');
  $('authMessage').textContent = 'Opening Google login...';
  try {
    const result = await signInWithPopup(auth, googleProvider);
    await saveUserProfile(result.user, { authProvider: 'google' });
    goNext();
  } catch (error) {
    showAuthError(error);
  }
});
$('authForm').addEventListener('submit', async (event) => {
  event.preventDefault();
  $('authMessage').classList.remove('error');
  $('authMessage').textContent = 'Please wait...';
  const form = new FormData(event.currentTarget);
  const email = String(form.get('email') || '').trim();
  const password = String(form.get('password') || '');
  const name = String(form.get('name') || '').trim();
  try {
    if (mode === 'signup') {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      if (name) await updateProfile(result.user, { displayName: name });
      await saveUserProfile(result.user, { name, authProvider: 'email', createdAt: new Date().toISOString() });
    } else {
      const result = await signInWithEmailAndPassword(auth, email, password);
      await saveUserProfile(result.user, { authProvider: 'email' });
    }
    goNext();
  } catch (error) {
    showAuthError(error);
  }
});

onAuthStateChanged(auth, (user) => {
  if (user && !params.get('stay')) goNext();
});