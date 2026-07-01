import { createUserWithEmailAndPassword, onAuthStateChanged, signInWithEmailAndPassword, updateProfile } from 'https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js';
import { doc, setDoc } from 'https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js';
import { auth, db } from './firebaseClient.js';

let mode = 'login';
const $ = (id) => document.getElementById(id);
const params = new URLSearchParams(location.search);
const next = params.get('next');

function setMode(nextMode) {
  mode = nextMode;
  $('loginTab').classList.toggle('active', mode === 'login');
  $('signupTab').classList.toggle('active', mode === 'signup');
  $('nameLabel').classList.toggle('hidden', mode !== 'signup');
  $('authButton').textContent = mode === 'signup' ? 'Create Account' : 'Login';
  $('authMessage').textContent = '';
}

function goNext() {
  window.location.href = next === 'book' ? './#book' : './bookings.html';
}

$('loginTab').addEventListener('click', () => setMode('login'));
$('signupTab').addEventListener('click', () => setMode('signup'));
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
      await setDoc(doc(db, 'users', result.user.uid), {
        uid: result.user.uid,
        email,
        name,
        role: 'user',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }, { merge: true });
    } else {
      await signInWithEmailAndPassword(auth, email, password);
    }
    goNext();
  } catch (error) {
    $('authMessage').classList.add('error');
    $('authMessage').textContent = error.message || 'Could not continue.';
  }
});

onAuthStateChanged(auth, (user) => {
  if (user && !params.get('stay')) goNext();
});
