import { doc, getDoc } from 'https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js';
import { db } from './firebaseClient.js';

const $ = (id) => document.getElementById(id);
const safeText = (value) => String(value || '').replace(/[&<>'"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[char]));
const dateText = (value) => {
  if (!value) return '-';
  const date = value.toDate ? value.toDate() : new Date(value);
  return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
};

function imageForBooking(booking) {
  const text = `${booking.pujaName || ''} ${booking.temple || ''}`.toLowerCase();
  const matches = [
    ['kashi', './assets/pujas/kashi-vishwanath.svg'], ['somnath', './assets/pujas/somnath-temple.svg'], ['mahakal', './assets/pujas/mahakal-abhishek.svg'], ['kamakhya', './assets/pujas/kamakhya-devi.svg'], ['trimbakeshwar', './assets/pujas/kaal-sarp-trimbakeshwar.svg'], ['ram', './assets/pujas/ram-mandir.svg'], ['vaishno', './assets/pujas/vaishno-devi.svg'], ['durga', './assets/pujas/durga-saptashati.svg'], ['baglamukhi', './assets/pujas/baglamukhi.svg'], ['ganesh', './assets/pujas/ganesh-abhishek.svg'], ['satyanarayan', './assets/pujas/satyanarayan-katha.svg'], ['pitru', './assets/pujas/pitru-shanti.svg'], ['hanuman', './assets/pujas/hanuman-abhishek.svg'], ['sundarkand', './assets/pujas/sundarkand-path.svg'], ['laxmi', './assets/pujas/laxmi-puja.svg'], ['navgraha', './assets/pujas/navgraha-shanti.svg'], ['mangal', './assets/pujas/mangal-dosh.svg'], ['kedarnath', './assets/pujas/maha-rudrabhishek-kedarnath.webp'],
  ];
  return booking.pujaImageUrl || booking.imageUrl || matches.find(([key]) => text.includes(key))?.[1] || './assets/pujas/mahakal-abhishek.svg';
}

function render(booking) {
  const orderId = booking.orderId || booking.id;
  $('confirmMessage').textContent = `We have received order ${orderId} and will perform your puja with devotion.`;
  $('confirmationPanel').innerHTML = `
    <section class="panel confirmationStatus">
      <div class="successSeal"><span>OK</span></div>
      <p class="eyebrow">Booking Reference ID</p>
      <h2>${safeText(orderId)}</h2>
      <p class="muted">${safeText(dateText(booking.createdAt))}</p>
      <p>A confirmation email and status updates will be connected to your registered account.</p>
      <div class="actions stackedActions"><a class="primary wide" href="./track.html?orderId=${encodeURIComponent(orderId)}">Track Request</a><a class="secondary wide" href="./#pujas">Browse More Pujas</a></div>
    </section>
    <section class="panel confirmationDetails">
      <div class="confirmationColumns">
        <article>
          <h3>Puja Summary</h3>
          <div class="summaryMini"><img src="${safeText(imageForBooking(booking))}" alt="${safeText(booking.pujaName || 'Puja booking')}"><div><strong>${safeText(booking.pujaName || 'Puja Booking')}</strong><span>${safeText(booking.temple || 'Verified Temple')}</span><b>Rs ${Number(booking.amount || 0).toLocaleString('en-IN')}</b><small>Inclusive of all taxes</small></div></div>
        </article>
        <article>
          <h3>Devotee Details</h3>
          <div class="detailRows"><span>Name</span><strong>${safeText(booking.userName || booking.devotee?.name || '')}</strong><span>Gotra</span><strong>${safeText(booking.devotee?.gotra || 'Not provided')}</strong><span>Phone</span><strong>${safeText(booking.userPhone || booking.devotee?.phone || '')}</strong><span>Email</span><strong>${safeText(booking.userEmail || booking.devotee?.email || '')}</strong></div>
        </article>
      </div>
      <div class="whatsNext"><h3>What's Next?</h3><ul><li>Our team will verify your details.</li><li>Pandit will be assigned for your puja.</li><li>We will notify you before the puja begins.</li><li>Receive updates, photos, and video after completion.</li></ul></div>
    </section>
  `;
}

async function load() {
  const orderId = new URLSearchParams(location.search).get('orderId');
  let booking = null;
  if (orderId) {
    const snap = await getDoc(doc(db, 'bookings', orderId));
    if (snap.exists()) booking = { id: snap.id, ...snap.data() };
  }
  if (!booking) {
    try { booking = JSON.parse(sessionStorage.getItem('lastConfirmedBooking') || 'null'); } catch (error) { booking = null; }
  }
  if (!booking) {
    $('confirmMessage').textContent = 'Booking details were not found. Please check My Bookings.';
    $('confirmationPanel').innerHTML = '<a class="primary" href="./bookings.html">Open My Bookings</a>';
    return;
  }
  render(booking);
}

load().catch((error) => {
  $('confirmMessage').textContent = error.message || 'Could not load confirmation.';
  $('confirmMessage').classList.add('error');
});