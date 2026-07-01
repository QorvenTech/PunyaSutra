import { initializeApp } from 'https://www.gstatic.com/firebasejs/12.0.0/firebase-app.js';
import { addDoc, collection, doc, getFirestore, initializeFirestore, setDoc } from 'https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js';

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

const pujas = [
  { id: 'mahakal-abhishek', name: 'Mahakal Abhishek', temple: 'Mahakaleshwar Temple, Ujjain', price: 1499, category: 'Health', tag: 'Most Popular', image: 'https://images.unsplash.com/photo-1621246025224-8b7052f574e8?auto=format&fit=crop&w=1200&q=80', description: 'Sacred Rudrabhishek and Sankalp performed with Panchamrit and Bilva Patra offerings.' },
  { id: 'kamakhya-devi-puja', name: 'Kamakhya Devi Puja', temple: 'Kamakhya Temple, Guwahati', price: 1899, category: 'Protection', tag: 'Shakti Peeth', image: 'https://images.unsplash.com/photo-1598091383021-15ddea10925d?auto=format&fit=crop&w=1200&q=80', description: 'Devi archana and sankalp for protection, prosperity, and removal of negative energy.' },
  { id: 'maha-rudrabhishek', name: 'Maha Rudrabhishek', temple: 'Kedarnath Temple, Uttarakhand', price: 1299, category: 'Peace', tag: 'Jyotirlinga', image: 'https://images.unsplash.com/photo-1626621331169-5f34be280ed9?auto=format&fit=crop&w=1200&q=80', description: 'Vedic Rudra puja with sankalp for peace, health, and spiritual strength.' },
  { id: 'kaal-sarp-dosh', name: 'Kaal Sarp Dosh Nivaran', temple: 'Trimbakeshwar Temple, Nashik', price: 2199, category: 'Dosha Nivaran', tag: 'Dosh Nivaran', image: 'https://images.unsplash.com/photo-1609947017136-9daf32a5eb16?auto=format&fit=crop&w=1200&q=80', description: 'Special ritual for dosha nivaran, career obstacles, and family peace.' },
];

let selectedPuja = pujas[0];

const $ = (id) => document.getElementById(id);

function renderPujas(items = pujas) {
  $('pujaGrid').innerHTML = items.map((puja) => `
    <article class="card">
      <img src="${puja.image}" alt="${puja.name}">
      <div class="cardBody">
        <div class="tagRow"><span>${puja.tag}</span><strong>Rs ${puja.price.toLocaleString()}</strong></div>
        <h3>${puja.name}</h3>
        <p class="muted">${puja.temple}</p>
        <p>${puja.description}</p>
        <button class="cardBtn" data-book="${puja.id}">Book / Enquire</button>
      </div>
    </article>
  `).join('');

  document.querySelectorAll('[data-book]').forEach((button) => {
    button.addEventListener('click', () => {
      selectedPuja = pujas.find((puja) => puja.id === button.dataset.book) || pujas[0];
      updateSelectedPuja();
      location.hash = '#book';
    });
  });
}

function updateSelectedPuja() {
  $('selectedPujaTitle').textContent = selectedPuja.name;
  $('selectedPujaTemple').textContent = selectedPuja.temple;
  $('selectedPujaPrice').textContent = `Rs ${selectedPuja.price.toLocaleString()}`;
}

async function submitBooking(event) {
  event.preventDefault();
  const form = new FormData(event.currentTarget);
  const name = String(form.get('name') || '').trim();
  const gotra = String(form.get('gotra') || '').trim();
  if (!name) {
    $('bookingMessage').textContent = 'Please enter devotee name.';
    return;
  }
  const orderId = `WEB${Date.now().toString().slice(-8)}`;
  try {
    await setDoc(doc(db, 'bookings', orderId), {
      orderId,
      channel: 'website',
      pujaId: selectedPuja.id,
      pujaName: selectedPuja.name,
      temple: selectedPuja.temple,
      amount: selectedPuja.price,
      userName: name,
      userPhone: String(form.get('phone') || '').trim(),
      userEmail: String(form.get('email') || '').trim(),
      date: String(form.get('date') || ''),
      devotee: { name, gotra, phone: String(form.get('phone') || '').trim(), purpose: String(form.get('purpose') || '').trim() },
      status: 'Website Request',
      paymentStatus: 'test_mode_not_collected',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    await setDoc(doc(db, 'bookingOpsShares', orderId), { devoteeName: name, gotra });
    await addDoc(collection(db, 'adminNotifications'), {
      audience: 'admin',
      orderId,
      title: 'New website booking request',
      message: `${selectedPuja.name} requested by ${name}. Payment is not collected on website yet.`,
      unread: true,
      createdAt: new Date().toISOString(),
    });
    event.currentTarget.reset();
    $('bookingMessage').textContent = `Request saved. Reference: ${orderId}`;
  } catch (error) {
    $('bookingMessage').textContent = error.message || 'Could not save request.';
  }
}

$('search').addEventListener('input', (event) => {
  const value = event.target.value.trim().toLowerCase();
  renderPujas(pujas.filter((puja) => `${puja.name} ${puja.temple} ${puja.category}`.toLowerCase().includes(value)));
});
$('bookingForm').addEventListener('submit', submitBooking);

renderPujas();
updateSelectedPuja();
