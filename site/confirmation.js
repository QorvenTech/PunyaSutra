import { onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js';
import { doc, getDoc } from 'https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js';
import { auth, db } from './firebaseClient.js';

const $ = (id) => document.getElementById(id);
const safeText = (value) => String(value || '').replace(/[&<>'"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[char]));
const tx = (source) => window.PunyaI18n?.t(source) || source;
const fmt = (source, values) => window.PunyaI18n?.format(source, values) || source.replace(/\{(\w+)\}/g, (match, key) => values?.[key] ?? match);
const applyI18n = () => window.PunyaI18n?.apply(document);
let lastBooking = null;
let currentUser = null;
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
  lastBooking = booking;
  const orderId = booking.orderId || booking.id;
  $('confirmMessage').textContent = fmt('We have received order {orderId} and will perform your puja with devotion.', { orderId });
  $('confirmationPanel').innerHTML = `
    <section class="panel confirmationStatus">
      <div class="successSeal"><span>OK</span></div>
      <p class="eyebrow">${safeText(tx('Booking Reference ID'))}</p>
      <h2>${safeText(orderId)}</h2>
      <p class="muted">${safeText(dateText(booking.createdAt))}</p>
      <p>${safeText(tx('A confirmation email and status updates will be connected to your registered account.'))}</p>
      <div class="actions stackedActions"><a class="primary wide" href="./track.html?orderId=${encodeURIComponent(orderId)}">${safeText(tx('Track Request'))}</a><a class="secondary wide" href="./#pujas">${safeText(tx('Browse More Pujas'))}</a></div>
    </section>
    <section class="panel confirmationDetails">
      <div class="confirmationColumns">
        <article>
          <h3>${safeText(tx('Puja Summary'))}</h3>
          <div class="summaryMini"><img src="${safeText(imageForBooking(booking))}" alt="${safeText(tx(booking.pujaName || 'Puja Booking'))}"><div><strong>${safeText(tx(booking.pujaName || 'Puja Booking'))}</strong><span>${safeText(tx(booking.temple || 'Verified Temple'))}</span><b>Rs ${Number(booking.amount || 0).toLocaleString('en-IN')}</b><small>${safeText(tx('Inclusive of all taxes'))}</small></div></div>
        </article>
        <article>
          <h3>${safeText(tx('Devotee Details'))}</h3>
          <div class="detailRows"><span>${safeText(tx('Name'))}</span><strong>${safeText(booking.userName || booking.devotee?.name || '')}</strong><span>${safeText(tx('Gotra'))}</span><strong>${safeText(booking.devotee?.gotra || tx('Not provided'))}</strong><span>${safeText(tx('Phone'))}</span><strong>${safeText(booking.userPhone || booking.devotee?.phone || '')}</strong><span>${safeText(tx('Email'))}</span><strong>${safeText(booking.userEmail || booking.devotee?.email || '')}</strong></div>
        </article>
      </div>
      <div class="whatsNext"><h3>${safeText(tx("What's Next?"))}</h3><ul><li>${safeText(tx('Our team will verify your details.'))}</li><li>${safeText(tx('Pandit will be assigned for your puja.'))}</li><li>${safeText(tx('We will notify you before the puja begins.'))}</li><li>${safeText(tx('Receive updates, photos, and video after completion.'))}</li></ul></div>
    </section>
  `;
  applyI18n();
}

async function load() {
  if (!currentUser) {
    $('confirmMessage').textContent = tx('Please login to view this booking confirmation.');
    return;
  }
  const orderId = new URLSearchParams(location.search).get('orderId');
  let booking = null;
  if (orderId) {
    const snap = await getDoc(doc(db, 'bookings', orderId));
    if (snap.exists()) booking = { id: snap.id, ...snap.data() };
  }
  if (!booking) {
    try {
      const cached = JSON.parse(sessionStorage.getItem('lastConfirmedBooking') || 'null');
      booking = cached?.userId === currentUser.uid ? cached : null;
    } catch (error) { booking = null; }
  }
  if (!booking) {
    $('confirmMessage').textContent = tx('Booking details were not found. Please check My Bookings.');
    $('confirmationPanel').innerHTML = `<a class="primary" href="./bookings.html">${safeText(tx('Open My Bookings'))}</a>`;
    return;
  }
  render(booking);
}

onAuthStateChanged(auth, (user) => {
  currentUser = user;
  if (!user) {
    $('confirmMessage').textContent = tx('Please login to view this booking confirmation.');
    $('confirmMessage').classList.add('error');
    return;
  }
  load().catch((error) => {
    $('confirmMessage').textContent = error.message || tx('Could not load confirmation.');
    $('confirmMessage').classList.add('error');
  });
});

window.addEventListener('punyasutra:langchange', () => {
  if (lastBooking) render(lastBooking);
});
