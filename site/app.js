import { initializeApp } from 'https://www.gstatic.com/firebasejs/12.0.0/firebase-app.js';
import { createUserWithEmailAndPassword, getAuth, onAuthStateChanged, signOut, updateProfile } from 'https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js';
import { addDoc, collection, doc, getDocs, getFirestore, initializeFirestore, query, setDoc } from 'https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js';

const RAZORPAY_KEY_ID = 'rzp_test_SymVGhugpvGj9D';
const DEFAULT_PUJA_TIME = '9:00 AM';
const SITE_BASE = 'https://qorventech.github.io/BhaktiSetu/';

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

const fallbackImages = {
  mahakal: 'https://images.unsplash.com/photo-1609947017136-9daf32a5eb16?auto=format&fit=crop&w=1200&q=86',
  rudra: 'https://images.unsplash.com/photo-1626621331169-5f34be280ed9?auto=format&fit=crop&w=1200&q=86',
  kaal: 'https://images.unsplash.com/photo-1598091383021-15ddea10925d?auto=format&fit=crop&w=1200&q=86',
  shanti: 'https://images.unsplash.com/photo-1624461084896-cc7d24a163fc?auto=format&fit=crop&w=1200&q=86',
  default: 'https://images.unsplash.com/photo-1577083753695-e010191bacb5?auto=format&fit=crop&w=1200&q=86',
};

const fallbackPujas = [
  { id: 'mahakal-abhishek', name: 'Mahakal Abhishek', temple: 'Shri Mahakaleshwar Temple, Ujjain', price: 1101, category: 'Shiva', tag: 'Most Popular', imageUrl: fallbackImages.mahakal, description: 'Rudrabhishek sankalp for peace, health, protection, and spiritual strength.' },
  { id: 'maha-rudrabhishek', name: 'Maha Rudrabhishek', temple: 'Kashi Vishwanath Temple, Varanasi', price: 2501, category: 'Shiva', tag: 'Jyotirlinga', imageUrl: fallbackImages.rudra, description: 'Vedic chanting and sacred abhishek with experienced pandit coordination.' },
  { id: 'kaal-sarp-dosh', name: 'Kaal Sarp Dosh Nivaran', temple: 'Trimbakeshwar Temple, Nashik', price: 2301, category: 'Dosh Nivaran', tag: 'Dosh Nivaran', imageUrl: fallbackImages.kaal, description: 'Special sankalp for obstacles, dosha nivaran, and family peace.' },
  { id: 'grah-shanti-puja', name: 'Grah Shanti Puja', temple: 'Navagraha Shani Temple, Ujjain', price: 1451, category: 'Grah Shanti', tag: 'Navagraha', imageUrl: fallbackImages.shanti, description: 'Navagraha shanti sankalp for balance, stability, and smoother life events.' },
];

let pujas = [...fallbackPujas];
let selectedPuja = pujas[0];
let activeFilter = 'all';
let currentUser = null;
let lastBookingDraft = null;

const $ = (id) => document.getElementById(id);
const safeText = (value) => String(value || '').replace(/[&<>'"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[char]));
const validUrl = (value) => /^https:\/\//i.test(String(value || '').trim());

function imageForPuja(puja) {
  const image = puja.imageUrl || puja.image;
  if (validUrl(image)) return image;
  const haystack = `${puja.name || ''} ${puja.temple || ''} ${puja.category || ''}`.toLowerCase();
  if (haystack.includes('mahakal') || haystack.includes('ujjain')) return fallbackImages.mahakal;
  if (haystack.includes('rudra') || haystack.includes('kashi')) return fallbackImages.rudra;
  if (haystack.includes('kaal') || haystack.includes('dosh')) return fallbackImages.kaal;
  if (haystack.includes('grah') || haystack.includes('navagraha')) return fallbackImages.shanti;
  return fallbackImages.default;
}

function normalizePuja(row) {
  const price = Number(row.price || row.amount || 0) || 0;
  return {
    ...row,
    id: row.id || row.pujaId || row.name?.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
    name: row.name || 'Puja',
    temple: row.temple || row.location || 'Verified Temple',
    price,
    category: row.category || row.deity || 'General',
    tag: row.tag || row.type || 'Verified',
    description: row.description || 'Verified puja with sankalp, pandit coordination, and digital confirmation.',
    imageUrl: imageForPuja(row),
  };
}

async function loadManagedPujas() {
  try {
    const snap = await getDocs(query(collection(db, 'managedPujas')));
    const rows = snap.docs.map((item) => normalizePuja({ id: item.id, ...item.data() }));
    if (rows.length) pujas = rows;
  } catch (error) {
    console.log('Using fallback pujas:', error.message);
  }
  selectedPuja = pujas[0] || fallbackPujas[0];
  renderCategories();
  renderPujas();
  updateSelectedPuja();
}

function renderPromo() {
  const promo = { enabled: true, label: 'Rath Yatra Special', text: 'Book selected pujas with sankalp details and test checkout confirmation.' };
  if (!promo.enabled) return;
  $('promoStrip').classList.remove('hidden');
  $('promoStrip').innerHTML = `<strong>${safeText(promo.label)}</strong><span>${safeText(promo.text)}</span>`;
}

function renderCategories() {
  const categories = [...new Set(pujas.map((puja) => puja.category).filter(Boolean))];
  $('categoryChips').innerHTML = [
    '<button class="chip active" type="button" data-filter="all">All Pujas</button>',
    ...categories.map((category) => `<button class="chip" type="button" data-filter="${safeText(category)}">${safeText(category)}</button>`),
  ].join('');
  document.querySelectorAll('[data-filter]').forEach((button) => {
    button.addEventListener('click', () => {
      activeFilter = button.dataset.filter;
      document.querySelectorAll('[data-filter]').forEach((item) => item.classList.remove('active'));
      button.classList.add('active');
      renderPujas();
    });
  });
}

function getVisiblePujas() {
  const value = $('search').value.trim().toLowerCase();
  return pujas.filter((puja) => {
    const matchesFilter = activeFilter === 'all' || puja.category === activeFilter;
    const matchesSearch = `${puja.name} ${puja.temple} ${puja.category} ${puja.description}`.toLowerCase().includes(value);
    return matchesFilter && matchesSearch;
  });
}

function renderPujas(items = getVisiblePujas()) {
  $('pujaGrid').innerHTML = items.length ? items.map((puja) => `
    <article class="card">
      <img src="${safeText(imageForPuja(puja))}" alt="${safeText(puja.name)}">
      <div class="cardBody">
        <div class="tagRow"><span>${safeText(puja.tag)}</span><strong>Rs ${Number(puja.price || 0).toLocaleString('en-IN')}</strong></div>
        <h3>${safeText(puja.name)}</h3>
        <p class="muted">${safeText(puja.temple)}</p>
        <p>${safeText(puja.description)}</p>
        <button class="cardBtn" data-book="${safeText(puja.id)}">Book</button>
      </div>
    </article>
  `).join('') : '<p class="muted">No pujas found. Try another search.</p>';

  document.querySelectorAll('[data-book]').forEach((button) => {
    button.addEventListener('click', () => {
      selectedPuja = pujas.find((puja) => String(puja.id) === button.dataset.book) || pujas[0];
      updateSelectedPuja();
      location.hash = '#book';
    });
  });
}

function updateSelectedPuja() {
  $('selectedPujaTitle').textContent = selectedPuja.name;
  $('selectedPujaTemple').textContent = selectedPuja.temple;
  $('selectedPujaPrice').textContent = `Rs ${Number(selectedPuja.price || 0).toLocaleString('en-IN')}`;
  $('selectedPujaImage').src = imageForPuja(selectedPuja);
}

function updateAuthUi(user) {
  currentUser = user;
  $('accountLink').textContent = user ? 'Logout' : 'Login';
  $('accountLink').href = user ? '#' : './auth.html';
  $('authStateText').textContent = user
    ? `Logged in as ${user.email}. Razorpay is running in TEST mode and will not charge real money.`
    : 'Login or signup with email to continue. Razorpay is running in TEST mode and will not charge real money.';
  $('inlineAuth').classList.toggle('hidden', Boolean(user));
  const emailInput = document.querySelector('[name="email"]');
  if (user?.email && emailInput && !emailInput.value) emailInput.value = user.email;
}

function buildTrackingSteps(date) {
  return [
    { key: 'booking_confirmed', label: 'Booking Confirmed', status: 'done', mode: 'auto', message: 'Your booking and payment are confirmed.' },
    { key: 'payment_received', label: 'Payment Received', status: 'done', mode: 'auto', message: 'Payment has been received successfully.' },
    { key: 'puja_scheduled', label: 'Puja Scheduled', status: 'done', mode: 'auto', message: `Puja is scheduled for ${date || 'your selected date'} at ${DEFAULT_PUJA_TIME}.` },
    { key: 'puja_completed', label: 'Puja Performed', status: 'pending', mode: 'manual', message: 'Team will update after puja completion.' },
    { key: 'video_sent', label: 'Video Sent', status: 'pending', mode: 'manual', message: 'Video or confirmation will be sent when available.' },
    { key: 'prasad_delivery', label: 'Prasad Dispatched', status: 'pending', mode: 'manual', message: 'Delivery details will be updated after dispatch.' },
    { key: 'certificate_emailed', label: 'Certificate Emailed', status: 'pending', mode: 'manual', message: 'Certificate will be emailed after completion.' },
  ];
}

function bookingFromForm(form) {
  const name = String(form.get('name') || '').trim();
  const gotra = String(form.get('gotra') || '').trim();
  const phone = String(form.get('phone') || '').trim();
  const email = String(form.get('email') || currentUser?.email || '').trim();
  const date = String(form.get('date') || '').trim();
  const purpose = String(form.get('purpose') || '').trim();
  const orderId = `WEB${Date.now().toString().slice(-8)}`;
  return { orderId, name, gotra, phone, email, date, purpose };
}

function openRazorpay(draft) {
  if (!window.Razorpay) {
    $('bookingMessage').textContent = 'Razorpay could not load. Please refresh and try again.';
    $('retryButton').classList.remove('hidden');
    return;
  }
  const amount = Number(selectedPuja.price || 0);
  const options = {
    key: RAZORPAY_KEY_ID,
    amount: amount * 100,
    currency: 'INR',
    name: 'Pujan Sutra',
    description: selectedPuja.name,
    image: '',
    prefill: { name: draft.name, email: draft.email, contact: draft.phone },
    notes: { internal_order_id: draft.orderId, puja_id: selectedPuja.id, gotra: draft.gotra },
    theme: { color: '#aa2109' },
    handler: async (response) => saveConfirmedBooking(draft, response),
    modal: { ondismiss: () => showPaymentRetry('Payment window closed. You can retry payment.') },
  };
  const checkout = new window.Razorpay(options);
  checkout.on('payment.failed', (response) => showPaymentRetry(response?.error?.description || 'Payment failed. Please retry.'));
  checkout.open();
}

function showPaymentRetry(message) {
  $('bookingMessage').textContent = message;
  $('bookingMessage').classList.add('error');
  $('retryButton').classList.remove('hidden');
}

async function saveConfirmedBooking(draft, paymentResponse = {}) {
  $('bookingMessage').classList.remove('error');
  $('bookingMessage').textContent = 'Payment successful. Saving confirmed booking...';
  const now = new Date().toISOString();
  const amount = Number(selectedPuja.price || 0);
  const payload = {
    orderId: draft.orderId,
    razorpayPaymentId: paymentResponse.razorpay_payment_id || '',
    razorpayOrderId: paymentResponse.razorpay_order_id || '',
    razorpaySignature: paymentResponse.razorpay_signature || '',
    paymentId: paymentResponse.razorpay_payment_id || '',
    paymentStatus: 'paid_test_mode',
    paymentGateway: 'razorpay_checkout_js',
    channel: 'website',
    userId: currentUser.uid,
    userEmail: draft.email || currentUser.email || '',
    userName: draft.name,
    userPhone: draft.phone,
    adminPhone: '',
    pujaId: selectedPuja.id,
    pujaName: selectedPuja.name,
    temple: selectedPuja.temple,
    date: draft.date,
    time: DEFAULT_PUJA_TIME,
    pkg: 'Website Booking',
    amount,
    devotee: { name: draft.name, gotra: draft.gotra, phone: draft.phone, email: draft.email, purpose: draft.purpose },
    status: 'Confirmed',
    trackingSteps: buildTrackingSteps(draft.date),
    notificationStatus: { inAppUser: true, inAppAdmin: true, whatsapp: 'pending_provider_setup', sms: 'pending_provider_setup' },
    createdAt: now,
    updatedAt: now,
  };
  await setDoc(doc(db, 'bookings', draft.orderId), payload);
  await setDoc(doc(db, 'bookingOpsShares', draft.orderId), { devoteeName: draft.name, gotra: draft.gotra });
  await Promise.all([
    addDoc(collection(db, 'notifications'), {
      audience: 'user', userId: currentUser.uid, orderId: draft.orderId, title: 'Puja booking confirmed',
      message: `${selectedPuja.name} is booked for ${draft.date || 'your selected date'} at ${DEFAULT_PUJA_TIME}.`, unread: true,
      pushStatus: 'pending', pushChannel: 'web', createdAt: now,
    }),
    addDoc(collection(db, 'adminNotifications'), {
      audience: 'admin', orderId: draft.orderId, title: 'New website booking received',
      message: `${selectedPuja.name} booked by ${draft.name}. Amount: Rs ${amount}.`, unread: true,
      pushStatus: 'pending', pushChannel: 'web', createdAt: now,
    }),
  ]);
  sessionStorage.setItem('lastConfirmedBooking', JSON.stringify(payload));
  window.location.href = `./confirmation.html?orderId=${encodeURIComponent(draft.orderId)}`;
}

async function submitBooking(event) {
  event.preventDefault();
  $('bookingMessage').classList.remove('error');
  $('retryButton').classList.add('hidden');
  if (!currentUser) {
    $('bookingMessage').textContent = 'Please login or signup first.';
    $('bookingMessage').classList.add('error');
    window.location.href = './auth.html?next=book';
    return;
  }
  const draft = bookingFromForm(new FormData(event.currentTarget));
  if (!draft.name || !draft.phone || !draft.email || !draft.date) {
    $('bookingMessage').textContent = 'Please fill name, phone, email, and preferred date.';
    $('bookingMessage').classList.add('error');
    return;
  }
  lastBookingDraft = draft;
  openRazorpay(draft);
}

$('search').addEventListener('input', () => renderPujas());
$('bookingForm').addEventListener('submit', submitBooking);
$('retryButton').addEventListener('click', () => lastBookingDraft && openRazorpay(lastBookingDraft));
$('accountLink').addEventListener('click', async (event) => {
  if (!currentUser) return;
  event.preventDefault();
  await signOut(auth);
});

onAuthStateChanged(auth, updateAuthUi);
renderPromo();
loadManagedPujas();
