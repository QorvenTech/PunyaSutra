import { initializeApp } from 'https://www.gstatic.com/firebasejs/12.0.0/firebase-app.js';
import { getAuth, onAuthStateChanged, signOut } from 'https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js';
import { addDoc, collection, doc, getDocs, getFirestore, initializeFirestore, query, setDoc } from 'https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js';

const RAZORPAY_KEY_ID = 'rzp_test_SymVGhugpvGj9D';
const DEFAULT_PUJA_TIME = '9:00 AM';

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
  kamakhya: 'https://images.unsplash.com/photo-1598091383021-15ddea10925d?auto=format&fit=crop&w=1200&q=86',
  kedarnath: 'https://images.unsplash.com/photo-1626621331169-5f34be280ed9?auto=format&fit=crop&w=1200&q=86',
  trimbakeshwar: 'https://images.unsplash.com/photo-1609947017136-9daf32a5eb16?auto=format&fit=crop&w=1200&q=86',
  ram: 'https://images.unsplash.com/photo-1609766418204-94aae0ecf8e3?auto=format&fit=crop&w=1200&q=86',
  kashi: 'https://images.unsplash.com/photo-1561361513-2d000a50f0dc?auto=format&fit=crop&w=1200&q=86',
  vaishno: 'https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?auto=format&fit=crop&w=1200&q=86',
  ganesh: 'https://images.unsplash.com/photo-1604076913837-52ab5629fba9?auto=format&fit=crop&w=1200&q=86',
  vishnu: 'https://images.unsplash.com/photo-1577083753695-e010191bacb5?auto=format&fit=crop&w=1200&q=86',
  navgraha: 'https://images.unsplash.com/photo-1624461084896-cc7d24a163fc?auto=format&fit=crop&w=1200&q=86',
  gaya: 'https://images.unsplash.com/photo-1598091383021-15ddea10925d?auto=format&fit=crop&w=1200&q=86',
  tirupati: 'https://images.unsplash.com/photo-1609947017136-9daf32a5eb16?auto=format&fit=crop&w=1200&q=86',
  baglamukhi: 'https://images.unsplash.com/photo-1577083753695-e010191bacb5?auto=format&fit=crop&w=1200&q=86',
  hanuman: 'https://images.unsplash.com/photo-1604076913837-52ab5629fba9?auto=format&fit=crop&w=1200&q=86',
  mangal: 'https://images.unsplash.com/photo-1624461084896-cc7d24a163fc?auto=format&fit=crop&w=1200&q=86',
  durga: 'https://images.unsplash.com/photo-1598091383021-15ddea10925d?auto=format&fit=crop&w=1200&q=86',
  lakshmi: 'https://images.unsplash.com/photo-1577083753695-e010191bacb5?auto=format&fit=crop&w=1200&q=86',
  somnath: 'https://images.unsplash.com/photo-1561361513-2d000a50f0dc?auto=format&fit=crop&w=1200&q=86',
  pushkar: 'https://images.unsplash.com/photo-1626621331169-5f34be280ed9?auto=format&fit=crop&w=1200&q=86',
  krishna: 'https://images.unsplash.com/photo-1577083753695-e010191bacb5?auto=format&fit=crop&w=1200&q=86',
  default: 'https://images.unsplash.com/photo-1609947017136-9daf32a5eb16?auto=format&fit=crop&w=1200&q=86',
};

const fallbackPujas = [
  { id: '1', name: 'Mahakal Abhishek', temple: 'Mahakaleshwar Temple, Ujjain', price: 1499, category: 'Health', deity: 'Shiva', tag: 'Most Popular', duration: '90 mins', type: 'Vedic', description: 'Bhasma Aarti and Abhishek with Panchamrit done by temple pandits.' },
  { id: '2', name: 'Kamakhya Devi Puja', temple: 'Kamakhya Temple, Guwahati, Assam', price: 1899, category: 'Dosha Nivaran', deity: 'Durga', tag: 'Shakti Peeth', duration: '120 mins', type: 'Tantrik', description: 'Tantrik puja for protection, prosperity, and removing negativity.' },
  { id: '3', name: 'Maha Rudrabhishek', temple: 'Kedarnath Temple, Uttarakhand', price: 1299, category: 'Health', deity: 'Shiva', tag: 'Jyotirlinga', duration: '90 mins', type: 'Vedic', description: 'Rudrabhishek performed by Vedic pandits for peace and spiritual strength.' },
  { id: '4', name: 'Kaal Sarp Dosh Nivaran', temple: 'Trimbakeshwar Temple, Nashik', price: 2199, category: 'Dosha Nivaran', deity: 'Shiva', tag: 'Dosh Nivaran', duration: '150 mins', type: 'Vedic', description: 'Certified temple pandit ritual for Kaal Sarp Dosh and obstacle removal.' },
  { id: '5', name: 'Ram Lalla Abhishek', temple: 'Ram Mandir, Ayodhya', price: 1099, category: 'Wealth', deity: 'Ram', tag: 'New Temple', duration: '60 mins', type: 'Vedic', description: 'Ram Lalla Abhishek with Ram Naam Jaap and sankalp in your name.' },
  { id: '6', name: 'Kashi Vishwanath Rudrabhishek', temple: 'Kashi Vishwanath Temple, Varanasi', price: 1399, category: 'Health', deity: 'Shiva', tag: 'Jyotirlinga', duration: '90 mins', type: 'Vedic', description: 'Rudrabhishek with Gangajal and Bel Patra Archana at Kashi Vishwanath.' },
  { id: '7', name: 'Vaishno Devi Chandi Havan', temple: 'Vaishno Devi Temple, Katra, J&K', price: 1499, category: 'Dosha Nivaran', deity: 'Durga', tag: 'Shakti Peeth', duration: '120 mins', type: 'Tantrik', description: 'Chandi Path and Havan for protection and fulfillment of wishes.' },
  { id: '8', name: 'Ganesh Abhishek', temple: 'Siddhivinayak Temple, Mumbai', price: 999, category: 'Wealth', deity: 'Ganesh', tag: 'Trending', duration: '60 mins', type: 'Vedic', description: 'Ganesh Abhishek for new beginnings, success, and removal of obstacles.' },
  { id: '9', name: 'Satyanarayan Katha', temple: 'ISKCON Temple, Vrindavan', price: 799, category: 'Wealth', deity: 'Vishnu', tag: 'Family Puja', duration: '90 mins', type: 'Vedic', description: 'Satyanarayan Katha for family prosperity, peace, and wish fulfillment.' },
  { id: '10', name: 'Navgraha Shanti Puja', temple: 'Mahakaleshwar Temple, Ujjain', price: 1699, category: 'Dosha Nivaran', deity: 'Navgraha', tag: 'Graha Dosh', duration: '120 mins', type: 'Vedic', description: 'All nine graha rituals by Jyotish pandits for balance and peace.' },
  { id: '11', name: 'Pitru Shanti Puja', temple: 'Vishnupad Temple, Gaya, Bihar', price: 899, category: 'Dosha Nivaran', deity: 'Vishnu', tag: 'Pitra Paksha', duration: '75 mins', type: 'Vedic', description: 'Pitru Tarpan and Pind Daan support at Vishnupad Temple, Gaya.' },
  { id: '12', name: 'Sudarshan Shanti Puja', temple: 'Tirumala Tirupati Temple, AP', price: 1199, category: 'Wealth', deity: 'Vishnu', tag: 'Trending', duration: '60 mins', type: 'Vedic', description: 'Sudarshan Puja for protection, wealth, and spiritual strength.' },
  { id: '13', name: 'Baglamukhi Puja', temple: 'Baglamukhi Temple, Datia, MP', price: 2499, category: 'Dosha Nivaran', deity: 'Durga', tag: 'Powerful', duration: '180 mins', type: 'Tantrik', description: 'Baglamukhi Mata puja for court cases, enemies, and black magic removal.' },
  { id: '14', name: 'Hanuman Abhishek', temple: 'Salassar Balaji Temple, Rajasthan', price: 799, category: 'Health', deity: 'Hanuman', tag: 'Jai Bajrangbali', duration: '60 mins', type: 'Vedic', description: 'Hanuman Abhishek with Sindoor and Hanuman Chalisa for strength.' },
  { id: '15', name: 'Mangal Dosh Nivaran', temple: 'Mangalnath Temple, Ujjain', price: 1599, category: 'Marriage', deity: 'Mangal', tag: 'Vivah Dosh', duration: '120 mins', type: 'Vedic', description: 'Mangal Grah Puja for Manglik dosh and marriage harmony.' },
  { id: '16', name: 'Durga Saptashati Path', temple: 'Vindhyachal Temple, Mirzapur, UP', price: 1299, category: 'Dosha Nivaran', deity: 'Durga', tag: 'Navratri Special', duration: '150 mins', type: 'Vedic', description: 'Durga Saptashati Path and Kumari Puja for strength and protection.' },
  { id: '17', name: 'Laxmi Puja', temple: 'Kalighat Temple, Kolkata', price: 999, category: 'Wealth', deity: 'Lakshmi', tag: 'Dhanteras Special', duration: '75 mins', type: 'Vedic', description: 'Laxmi Puja for wealth, prosperity, and business success.' },
  { id: '18', name: 'Sundarkand Path', temple: 'Ram Janmabhoomi, Ayodhya', price: 699, category: 'Health', deity: 'Hanuman', tag: 'Tuesday Special', duration: '90 mins', type: 'Vedic', description: 'Sundarkand Path for protection, peace, and wish fulfillment.' },
  { id: '19', name: 'Somnath Abhishek', temple: 'Somnath Temple, Gujarat', price: 1599, category: 'Health', deity: 'Shiva', tag: 'Jyotirlinga', duration: '90 mins', type: 'Vedic', description: 'Rudrabhishek at Somnath for longevity, health, and spiritual growth.' },
  { id: '20', name: 'Pushkar Brahma Puja', temple: 'Brahma Temple, Pushkar, Rajasthan', price: 1099, category: 'Wealth', deity: 'Brahma', tag: 'Rare & Unique', duration: '75 mins', type: 'Vedic', description: 'Brahma Puja for education, career growth, and new beginnings.' },
];

let pujas = [];
let selectedPuja = null;
let activeFilter = 'all';
let currentUser = null;
let lastBookingDraft = null;

const $ = (id) => document.getElementById(id);
const safeText = (value) => String(value || '').replace(/[&<>'"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[char]));
const validUrl = (value) => /^https:\/\//i.test(String(value || '').trim());
const slug = (value) => String(value || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

function fallbackImageFor(puja = {}) {
  const searchable = `${puja.name || ''} ${puja.temple || ''} ${puja.deity || ''} ${puja.category || ''}`.toLowerCase();
  const entries = [
    ['mahakal', fallbackImages.mahakal], ['kamakhya', fallbackImages.kamakhya], ['kedarnath', fallbackImages.kedarnath], ['rudra', fallbackImages.kedarnath],
    ['trimbakeshwar', fallbackImages.trimbakeshwar], ['kaal', fallbackImages.trimbakeshwar], ['ram', fallbackImages.ram], ['ayodhya', fallbackImages.ram],
    ['kashi', fallbackImages.kashi], ['varanasi', fallbackImages.kashi], ['vaishno', fallbackImages.vaishno], ['ganesh', fallbackImages.ganesh],
    ['siddhivinayak', fallbackImages.ganesh], ['satyanarayan', fallbackImages.vishnu], ['vishnu', fallbackImages.vishnu], ['krishna', fallbackImages.krishna],
    ['iskcon', fallbackImages.krishna], ['navgraha', fallbackImages.navgraha], ['navagraha', fallbackImages.navgraha], ['grah', fallbackImages.navgraha],
    ['gaya', fallbackImages.gaya], ['pitru', fallbackImages.gaya], ['tirupati', fallbackImages.tirupati], ['tirumala', fallbackImages.tirupati],
    ['baglamukhi', fallbackImages.baglamukhi], ['hanuman', fallbackImages.hanuman], ['salassar', fallbackImages.hanuman], ['mangal', fallbackImages.mangal],
    ['durga', fallbackImages.durga], ['vindhyachal', fallbackImages.durga], ['laxmi', fallbackImages.lakshmi], ['lakshmi', fallbackImages.lakshmi],
    ['sundarkand', fallbackImages.hanuman], ['somnath', fallbackImages.somnath], ['pushkar', fallbackImages.pushkar], ['brahma', fallbackImages.pushkar],
  ];
  return entries.find(([keyword]) => searchable.includes(keyword))?.[1] || fallbackImages.default;
}

function imageForPuja(puja) {
  const image = String(puja.imageUrl || puja.image || '').trim();
  return validUrl(image) ? image : fallbackImageFor(puja);
}

function normalizePuja(row) {
  const price = Number(row.price || row.amount || 0) || 0;
  const base = {
    ...row,
    id: String(row.id || row.pujaId || slug(row.name) || Date.now()),
    name: row.name || 'Puja',
    temple: row.temple || row.location || 'Verified Temple',
    price,
    category: row.category || row.deity || 'General',
    deity: row.deity || '',
    tag: row.tag || row.type || 'Verified',
    description: row.description || 'Verified puja with sankalp, pandit coordination, and digital confirmation.',
  };
  return { ...base, fallbackImageUrl: fallbackImageFor(base), imageUrl: imageForPuja(base) };
}

function mergePujas(managedRows) {
  const map = new Map();
  [...managedRows, ...fallbackPujas.map(normalizePuja)].forEach((puja) => {
    const key = slug(`${puja.name}-${puja.temple}`);
    if (!map.has(key)) map.set(key, puja);
  });
  return [...map.values()];
}

async function loadManagedPujas() {
  try {
    const snap = await getDocs(query(collection(db, 'managedPujas')));
    const managedRows = snap.docs.map((item) => normalizePuja({ id: item.id, ...item.data() }));
    pujas = mergePujas(managedRows);
  } catch (error) {
    console.log('Using fallback pujas:', error.message);
    pujas = fallbackPujas.map(normalizePuja);
  }
  selectedPuja = pujas[0] || normalizePuja(fallbackPujas[0]);
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
      <img src="${safeText(imageForPuja(puja))}" alt="${safeText(puja.name)}" loading="lazy" onerror="this.onerror=null;this.src='${safeText(puja.fallbackImageUrl || fallbackImages.default)}';">
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
  $('selectedPujaImage').onerror = () => { $('selectedPujaImage').src = selectedPuja.fallbackImageUrl || fallbackImages.default; };
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
