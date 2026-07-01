const PUJA_ASSETS = [
  { keys: ['ganesh', 'siddhivinayak'], src: './assets/pujas/ganesha-generated.svg' },
  { keys: ['ram lalla', 'ram mandir', 'ayodhya'], src: './assets/pujas/05-ram-mandir.svg' },
  { keys: ['kaal sarp', 'trimbakeshwar'], src: './assets/pujas/04-trimbakeshwar.svg' },
  { keys: ['navgraha', 'navagraha', 'mangal dosh', 'mangalnath'], src: './assets/pujas/04-trimbakeshwar.svg' },
  { keys: ['durga', 'vindhyachal', 'vaishno'], src: './assets/pujas/07-vaishno.jpg' },
  { keys: ['kamakhya', 'baglamukhi'], src: './assets/pujas/02-kamakhya.svg' },
  { keys: ['kedarnath', 'maha rudra', 'rudrabhishek'], src: './assets/pujas/03-kedarnath.svg' },
  { keys: ['mahakal', 'mahakaleshwar', 'kashi', 'vishwanath', 'somnath', 'shiva'], src: './assets/pujas/01-mahakal.svg' },
  { keys: ['hanuman', 'sundarkand'], src: './assets/pujas/ganesha-generated.svg' },
  { keys: ['laxmi', 'lakshmi', 'satyanarayan', 'vishnu', 'pitru', 'sudarshan', 'pushkar', 'brahma'], src: './assets/pujas/02-kamakhya.svg' },
];

const DEFAULT_APP_IMAGE = './assets/pujas/01-mahakal.svg';

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
