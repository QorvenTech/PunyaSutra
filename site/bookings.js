import { onAuthStateChanged, signOut } from 'https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js';
import { collection, getDocs, query, where } from 'https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js';
import { auth, db } from './firebaseClient.js';

const $ = (id) => document.getElementById(id);
const safeText = (value) => String(value || '').replace(/[&<>'"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[char]));
const toMillis = (value) => value ? new Date(value).getTime() || 0 : 0;

function renderBookings(rows) {
  $('bookingsList').innerHTML = rows.length ? rows.map((booking) => `
    <article class="bookingCard">
      <span class="badge">${safeText(booking.status || 'Confirmed')}</span>
      <h3>${safeText(booking.pujaName || 'Puja Booking')}</h3>
      <p class="muted">${safeText(booking.temple || 'Verified Temple')}</p>
      <div class="bookingMeta">
        <span>Order: ${safeText(booking.orderId || booking.id)}</span>
        <span>Date: ${safeText(booking.date || 'To be scheduled')}</span>
        <span>Devotee: ${safeText(booking.userName || booking.devotee?.name || '')}</span>
        <span>Amount: Rs ${Number(booking.amount || 0).toLocaleString('en-IN')}</span>
      </div>
      <div class="bookingActions"><a class="secondary" href="./confirmation.html?orderId=${encodeURIComponent(booking.orderId || booking.id)}">View Details</a><a class="primary" href="./track.html?orderId=${encodeURIComponent(booking.orderId || booking.id)}">Track Puja</a></div>
    </article>
  `).join('') : '<p class="muted">No bookings found yet.</p>';
}

async function loadBookings(user) {
  $('bookingsMessage').textContent = `Showing bookings for ${user.email}.`;
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
    $('authLink').textContent = 'Login';
    $('authLink').href = './auth.html';
    $('bookingsList').innerHTML = '<a class="primary" href="./auth.html">Login to View Bookings</a>';
    return;
  }
  $('authLink').textContent = 'Logout';
  $('authLink').href = '#';
  loadBookings(user).catch((error) => {
    $('bookingsMessage').textContent = error.message || 'Could not load bookings.';
    $('bookingsMessage').classList.add('error');
  });
});
