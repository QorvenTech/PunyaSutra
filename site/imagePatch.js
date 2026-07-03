const PUJA_ASSETS = [
  { keys: ['kashi vishwanath'], src: './assets/pujas/kashi-vishwanath.svg' },
  { keys: ['somnath'], src: './assets/pujas/somnath-temple.svg' },
  { keys: ['mahakal', 'mahakaleshwar'], src: './assets/pujas/mahakal-abhishek.svg' },
  { keys: ['kamakhya'], src: './assets/pujas/kamakhya-devi.svg' },
  { keys: ['kaal sarp', 'trimbakeshwar'], src: './assets/pujas/kaal-sarp-trimbakeshwar.svg' },
  { keys: ['ram lalla', 'ram mandir', 'ayodhya'], src: './assets/pujas/ram-mandir.svg' },
  { keys: ['vaishno'], src: './assets/pujas/vaishno-devi.svg' },
  { keys: ['durga saptashati', 'vindhyachal'], src: './assets/pujas/durga-saptashati.svg' },
  { keys: ['baglamukhi'], src: './assets/pujas/baglamukhi.svg' },
  { keys: ['ganesh', 'siddhivinayak'], src: './assets/pujas/ganesh-abhishek.svg' },
  { keys: ['satyanarayan', 'iskcon', 'vrindavan'], src: './assets/pujas/satyanarayan-katha.svg' },
  { keys: ['pitru', 'gaya', 'vishnupad'], src: './assets/pujas/pitru-shanti.svg' },
  { keys: ['sudarshan', 'tirupati'], src: './assets/pujas/sudarshan-shanti.svg' },
  { keys: ['hanuman abhishek', 'salassar'], src: './assets/pujas/hanuman-abhishek.svg' },
  { keys: ['sundarkand'], src: './assets/pujas/sundarkand-path.svg' },
  { keys: ['laxmi', 'lakshmi', 'kalighat'], src: './assets/pujas/laxmi-puja.svg' },
  { keys: ['pushkar', 'brahma'], src: './assets/pujas/pushkar-brahma.svg' },
  { keys: ['navgraha', 'navagraha'], src: './assets/pujas/navgraha-shanti.svg' },
  { keys: ['mangal dosh', 'mangalnath'], src: './assets/pujas/mangal-dosh.svg' },
  { keys: ['maha rudra', 'kedarnath', 'rudrabhishek'], src: './assets/pujas/maha-rudrabhishek-kedarnath.webp' },
];

const DEFAULT_APP_IMAGE = './assets/pujas/mahakal-abhishek.svg';

function imageForCardText(text = '') {
  const normalized = String(text).toLowerCase();
  return PUJA_ASSETS.find((entry) => entry.keys.some((key) => normalized.includes(key)))?.src || DEFAULT_APP_IMAGE;
}

function contextTextForImage(img) {
  const card = img.closest('.card, .summaryCard');
  return `${img.alt || ''} ${card?.innerText || ''}`;
}

function applyAppPujaImages() {
  document.querySelectorAll('.card img, #selectedPujaImage').forEach((img) => {
    const src = imageForCardText(contextTextForImage(img));
    if (img.dataset.appImageFixed === src && img.getAttribute('src') === src) return;
    img.dataset.appImageFixed = src;
    img.loading = 'eager';
    img.decoding = 'async';
    img.style.objectFit = 'cover';
    img.style.objectPosition = 'center';
    img.onerror = () => {
      img.onerror = null;
      img.src = DEFAULT_APP_IMAGE;
    };
    img.src = src;
  });
}

applyAppPujaImages();
new MutationObserver(applyAppPujaImages).observe(document.body, { childList: true, subtree: true });
window.addEventListener('hashchange', () => setTimeout(applyAppPujaImages, 50));
