import { doc, getDoc } from 'https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js';
import { db } from './firebaseClient.js';

const $ = (id) => document.getElementById(id);
const params = new URLSearchParams(location.search);
const safeText = (value) => String(value || '').replace(/[&<>'"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[char]));
const tx = (source) => window.PunyaI18n?.t(source) || source;
const fmt = (source, values) => window.PunyaI18n?.format(source, values) || source.replace(/\{(\w+)\}/g, (match, key) => values?.[key] ?? match);
const applyI18n = () => window.PunyaI18n?.apply(document);
let lastBooking = null;
const dateText = (value) => {
  if (!value) return '-';
  const date = value.toDate ? value.toDate() : new Date(value);
  return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
};

function imageForBooking(booking) {
  const text = `${booking.pujaName || ''} ${booking.temple || ''}`.toLowerCase();
  const matches = [
    ['kashi', './assets/pujas/kashi-vishwanath.svg'],
    ['somnath', './assets/pujas/somnath-temple.svg'],
    ['mahakal', './assets/pujas/mahakal-abhishek.svg'],
    ['kamakhya', './assets/pujas/kamakhya-devi.svg'],
    ['trimbakeshwar', './assets/pujas/kaal-sarp-trimbakeshwar.svg'],
    ['ram', './assets/pujas/ram-mandir.svg'],
    ['vaishno', './assets/pujas/vaishno-devi.svg'],
    ['durga', './assets/pujas/durga-saptashati.svg'],
    ['baglamukhi', './assets/pujas/baglamukhi.svg'],
    ['ganesh', './assets/pujas/ganesh-abhishek.svg'],
    ['satyanarayan', './assets/pujas/satyanarayan-katha.svg'],
    ['pitru', './assets/pujas/pitru-shanti.svg'],
    ['hanuman', './assets/pujas/hanuman-abhishek.svg'],
    ['sundarkand', './assets/pujas/sundarkand-path.svg'],
    ['laxmi', './assets/pujas/laxmi-puja.svg'],
    ['navgraha', './assets/pujas/navgraha-shanti.svg'],
    ['mangal', './assets/pujas/mangal-dosh.svg'],
    ['kedarnath', './assets/pujas/maha-rudrabhishek-kedarnath.webp'],
  ];
  return booking.pujaImageUrl || booking.imageUrl || matches.find(([key]) => text.includes(key))?.[1] || './assets/pujas/mahakal-abhishek.svg';
}

function normalizeSteps(booking) {
  const fallback = [
    { key: 'request_received', label: 'Request Received', status: 'done', message: 'We have received your booking request.' },
    { key: 'pandit_assigned', label: 'Pandit Assigned', status: booking.status ? 'done' : 'pending', message: 'A verified pandit will be assigned for your puja.' },
    { key: 'puja_scheduled', label: 'Puja Scheduled', status: booking.date ? 'active' : 'pending', message: booking.date ? fmt('Puja is scheduled for {date}.', { date: booking.date }) : 'Puja schedule will be updated soon.' },
    { key: 'puja_completed', label: 'Puja Completed', status: 'pending', message: 'Puja will be completed and updates will be shared.' },
  ];
  const steps = Array.isArray(booking.trackingSteps) && booking.trackingSteps.length ? booking.trackingSteps : fallback;
  let activeUsed = false;
  return steps.map((step) => {
    const rawStatus = String(step.status || '').toLowerCase();
    let status = ['done', 'completed', 'complete', 'success'].includes(rawStatus) ? 'done' : rawStatus;
    if (!status || status === 'in_progress') status = 'active';
    if (status !== 'done' && !activeUsed) {
      activeUsed = true;
      status = status === 'pending' ? 'active' : status;
    }
    return { ...step, status };
  });
}

function renderTracking(booking) {
  lastBooking = booking;
  const orderId = booking.orderId || booking.id;
  const steps = normalizeSteps(booking);
  const doneCount = steps.filter((step) => step.status === 'done').length;
  $('trackResult').classList.remove('hidden');
  $('trackResult').innerHTML = `
    <section class="panel trackTimelineCard">
      <div class="trackHeader"><div><p class="eyebrow">${safeText(tx('Booking Reference ID'))}</p><h2>${safeText(orderId)}</h2></div><span class="badge">${safeText(tx(booking.status || 'In Progress'))}</span></div>
      <div class="trackProgress"><span style="width:${Math.max(12, Math.round((doneCount / Math.max(steps.length, 1)) * 100))}%"></span></div>
      <div class="timeline">
        ${steps.map((step, index) => `
          <article class="timelineStep ${safeText(step.status)}">
            <span>${step.status === 'done' ? '&#10003;' : index + 1}</span>
            <div><strong>${safeText(tx(step.label || step.title || 'Tracking Update'))}</strong><p>${safeText(tx(step.message || step.description || 'Update will be shared soon.'))}</p>${step.updatedAt || step.time ? `<small>${safeText(dateText(step.updatedAt || step.time))}</small>` : ''}</div>
          </article>
        `).join('')}
      </div>
      <div class="trackNote">${safeText(tx('You will receive photos and video after the puja is completed.'))}</div>
    </section>
    <aside class="panel trackSummary">
      <h3>${safeText(tx('Puja Summary'))}</h3>
      <img src="${safeText(imageForBooking(booking))}" alt="${safeText(tx(booking.pujaName || 'Puja Booking'))}">
      <h4>${safeText(tx(booking.pujaName || 'Puja Booking'))}</h4>
      <p class="muted">${safeText(tx(booking.temple || 'Verified Temple'))}</p>
      <div class="summaryRows"><span>${safeText(tx('Date'))}</span><strong>${safeText(booking.date || tx('To be scheduled'))}</strong><span>${safeText(tx('Devotee'))}</span><strong>${safeText(booking.userName || booking.devotee?.name || '')}</strong><span>${safeText(tx('Amount'))}</span><strong>Rs ${Number(booking.amount || 0).toLocaleString('en-IN')}</strong></div>
      <a class="secondary wide" href="./confirmation.html?orderId=${encodeURIComponent(orderId)}">${safeText(tx('View Details'))}</a>
    </aside>
  `;
  applyI18n();
}

async function loadBooking(orderId) {
  const cleanOrderId = String(orderId || '').trim();
  if (!cleanOrderId) {
    $('trackMessage').classList.add('error');
    $('trackMessage').textContent = tx('Please enter your booking reference ID.');
    return;
  }
  $('trackMessage').classList.remove('error');
  $('trackMessage').textContent = tx('Loading tracking details...');
  const snap = await getDoc(doc(db, 'bookings', cleanOrderId));
  if (!snap.exists()) {
    $('trackResult').classList.add('hidden');
    $('trackMessage').classList.add('error');
    $('trackMessage').textContent = tx('No booking found for this reference ID.');
    return;
  }
  $('trackMessage').textContent = '';
  renderTracking({ id: snap.id, ...snap.data() });
}

$('trackForm').addEventListener('submit', (event) => {
  event.preventDefault();
  const orderId = $('orderInput').value;
  history.replaceState(null, '', `./track.html?orderId=${encodeURIComponent(orderId)}`);
  loadBooking(orderId).catch((error) => {
    $('trackMessage').classList.add('error');
    $('trackMessage').textContent = error.message || tx('Could not load tracking details.');
  });
});

const initialOrderId = params.get('orderId');
if (initialOrderId) {
  $('orderInput').value = initialOrderId;
  loadBooking(initialOrderId).catch((error) => {
    $('trackMessage').classList.add('error');
    $('trackMessage').textContent = error.message || tx('Could not load tracking details.');
  });
}

window.addEventListener('punyasutra:langchange', () => {
  if (lastBooking) renderTracking(lastBooking);
});
