import { onAuthStateChanged, signOut } from 'https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js';
import { collection, getDocs, query, where } from 'https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js';
import { auth, db } from './firebaseClient.js';

const $ = (id) => document.getElementById(id);
const safeText = (value) => String(value || '').replace(/[&<>'"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[char]));
const toMillis = (value) => value ? new Date(value).getTime() || 0 : 0;
const tx = (source) => window.PunyaI18n?.t(source) || source;
const fmt = (source, values) => window.PunyaI18n?.format(source, values) || source.replace(/\{(\w+)\}/g, (match, key) => values?.[key] ?? match);
const applyI18n = () => window.PunyaI18n?.apply(document);
let lastRows = [];
let lastUser = null;

function renderBookings(rows) {
  lastRows = rows;
  $('bookingsList').innerHTML = rows.length ? rows.map((booking) => `
    <article class="bookingCard">
      <span class="badge">${safeText(tx(booking.status || 'Confirmed'))}</span>
      <h3>${safeText(tx(booking.pujaName || 'Puja Booking'))}</h3>
      <p class="muted">${safeText(tx(booking.temple || 'Verified Temple'))}</p>
      <div class="bookingMeta">
        <span>${safeText(fmt('Order: {orderId}', { orderId: booking.orderId || booking.id }))}</span>
        <span>${safeText(fmt('Date: {date}', { date: booking.date || tx('To be scheduled') }))}</span>
        <span>${safeText(fmt('Devotee: {name}', { name: booking.userName || booking.devotee?.name || '' }))}</span>
        <span>${safeText(fmt('Amount: Rs {amount}', { amount: Number(booking.amount || 0).toLocaleString('en-IN') }))}</span>
      </div>
      <div class="bookingActions"><a class="secondary" href="./confirmation.html?orderId=${encodeURIComponent(booking.orderId || booking.id)}">${safeText(tx('View Details'))}</a><a class="primary" href="./track.html?orderId=${encodeURIComponent(booking.orderId || booking.id)}">${safeText(tx('Track Puja'))}</a></div>
    </article>
  `).join('') : `<p class="muted">${safeText(tx('No bookings found yet.'))}</p>`;
  applyI18n();
}

function renderLoginPrompt() {
  $('authLink').textContent = tx('Login');
  $('authLink').href = './auth.html';
  $('bookingsList').innerHTML = `<a class="primary" href="./auth.html">${safeText(tx('Login to View Bookings'))}</a>`;
}

async function loadBookings(user) {
  lastUser = user;
  $('bookingsMessage').textContent = fmt('Showing bookings for {email}.', { email: user.email });
  const snap = await getDocs(query(collection(db, 'bookings'), where('userId', '==', user.uid)));
  const rows = snap.docs.map((item) => ({ id: item.id, ...item.data() })).sort((a, b) => toMillis(b.createdAt) - toMillis(a.createdAt));
  renderBookings(rows);
}

$('authLink').addEventListener('click', async (event) => {
  if ($('authLink').textContent !== 'Logout') return;
  event.preventDefault();
  await signOut(auth);
});

onAuthStateChanged(auth, (user) => {
  if (!user) {
    lastUser = null;
    renderLoginPrompt();
    return;
  }
  $('authLink').textContent = tx('Logout');
  $('authLink').href = '#';
  loadBookings(user).catch((error) => {
    $('bookingsMessage').textContent = error.message || tx('Could not load bookings.');
    $('bookingsMessage').classList.add('error');
  });
});

window.addEventListener('punyasutra:langchange', () => {
  if (!lastUser) {
    renderLoginPrompt();
    return;
  }
  if (lastUser) $('bookingsMessage').textContent = fmt('Showing bookings for {email}.', { email: lastUser.email });
  renderBookings(lastRows);
});
