import { initializeApp } from 'https://www.gstatic.com/firebasejs/12.0.0/firebase-app.js';
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js';
import { collection, doc, getDoc, getDocs, getFirestore, initializeFirestore, orderBy, query } from 'https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js';

const firebaseConfig = {
  apiKey: 'AIzaSyBKLoZ1QkuM2TGzwsaOp-GVQ5CKlCS3lu8',
  authDomain: 'bhaktisetu-e0e1a.firebaseapp.com',
  projectId: 'bhaktisetu-e0e1a',
  storageBucket: 'bhaktisetu-e0e1a.firebasestorage.app',
  messagingSenderId: '415010856816',
  appId: '1:415010856816:web:replace-with-web-app-id',
};

const app = initializeApp(firebaseConfig);
let db;
try {
  db = initializeFirestore(app, {}, 'default');
} catch (error) {
  db = getFirestore(app, 'default');
}
const auth = getAuth(app);

const OWNER_ROLE = 'owner';
const LIMITED_TEAM_ROLES = ['operations', 'ops', 'priest', 'pandit', 'team'];
let currentAccess = { canOpenAdmin: false, canManageAllData: false };

const $ = (id) => document.getElementById(id);

function accessFromProfile(profile) {
  const role = String(profile?.role || '').toLowerCase();
  const isOwner = role === OWNER_ROLE;
  const isLimited = LIMITED_TEAM_ROLES.includes(role);
  return { role: role || 'none', canOpenAdmin: isOwner || isLimited, canManageAllData: isOwner };
}

async function login(event) {
  event.preventDefault();
  const form = new FormData(event.currentTarget);
  $('loginMessage').textContent = '';
  try {
    await signInWithEmailAndPassword(auth, String(form.get('email')).trim(), String(form.get('password')));
  } catch (error) {
    $('loginMessage').textContent = error.message || 'Login failed.';
  }
}

async function loadDashboard() {
  const opsSnap = await getDocs(collection(db, 'bookingOpsShares'));
  const opsRows = opsSnap.docs.map((row) => ({ id: row.id, ...row.data() }));
  renderOps(opsRows);

  if (currentAccess.canManageAllData) {
    const bookingsSnap = await getDocs(query(collection(db, 'bookings'), orderBy('createdAt', 'desc')));
    renderBookings(bookingsSnap.docs.map((row) => ({ id: row.id, ...row.data() })));
  }
}

function renderTabs() {
  const tabs = currentAccess.canManageAllData ? ['Ops View', 'Bookings'] : ['Ops View'];
  $('tabs').innerHTML = tabs.map((tab, index) => `<button class="${index === 0 ? 'active' : ''}" data-tab="${tab}">${tab}</button>`).join('');
  document.querySelectorAll('[data-tab]').forEach((button) => {
    button.addEventListener('click', () => {
      document.querySelectorAll('[data-tab]').forEach((item) => item.classList.remove('active'));
      button.classList.add('active');
      $('opsView').classList.toggle('hidden', button.dataset.tab !== 'Ops View');
      $('bookingsView').classList.toggle('hidden', button.dataset.tab !== 'Bookings');
    });
  });
}

function renderOps(rows) {
  $('opsView').innerHTML = rows.length ? rows.map((row) => `
    <article class="opsCard">
      <h3>${row.devoteeName || 'Devotee'}</h3>
      <p>Gotra: ${row.gotra || 'Not provided'}</p>
      <button class="cardBtn" data-share-name="${row.devoteeName || 'Devotee'}" data-share-gotra="${row.gotra || 'Not provided'}">Forward Name & Gotra</button>
    </article>
  `).join('') : '<p class="muted">No ops records found.</p>';

  document.querySelectorAll('[data-share-name]').forEach((button) => {
    button.addEventListener('click', async () => {
      const text = `Name: ${button.dataset.shareName}\nGotra: ${button.dataset.shareGotra}`;
      if (navigator.share) await navigator.share({ text });
      else await navigator.clipboard.writeText(text);
    });
  });
}

function renderBookings(rows) {
  $('bookingsBody').innerHTML = rows.map((row) => `
    <tr>
      <td>${row.orderId || row.id}</td>
      <td>${row.pujaName || ''}</td>
      <td>${row.userName || ''}</td>
      <td>${row.userPhone || ''}</td>
      <td>Rs ${Number(row.amount || 0).toLocaleString()}</td>
      <td>${row.status || ''}</td>
    </tr>
  `).join('');
}

$('loginForm').addEventListener('submit', login);
$('logoutBtn').addEventListener('click', () => signOut(auth));

onAuthStateChanged(auth, async (user) => {
  $('dashboard').classList.add('hidden');
  $('loginForm').classList.remove('hidden');
  if (!user) return;
  const profileSnap = await getDoc(doc(db, 'users', user.uid));
  currentAccess = accessFromProfile(profileSnap.exists() ? profileSnap.data() : null);
  if (!currentAccess.canOpenAdmin) {
    $('loginMessage').textContent = 'Access restricted for this account.';
    return;
  }
  $('loginForm').classList.add('hidden');
  $('dashboard').classList.remove('hidden');
  $('roleLabel').textContent = currentAccess.canManageAllData ? 'Owner dashboard' : 'Ops only dashboard';
  renderTabs();
  await loadDashboard();
});
