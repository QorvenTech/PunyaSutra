const PUJA_ASSETS = [
  { keys: ['kamakhya', 'baglamukhi', 'durga', 'vindhyachal'], src: './assets/pujas/02-kamakhya.svg' },
  { keys: ['mahakal', 'mahakaleshwar', 'somnath', 'shiva', 'rudra', 'mangal', 'navgraha', 'kaal sarp', 'trimbakeshwar', 'pushkar', 'brahma', 'ganesh', 'hanuman', 'laxmi', 'lakshmi', 'satyanarayan', 'vishnu', 'vaishno', 'ram', 'kashi', 'kedarnath'], src: './assets/pujas/01-mahakal.svg' },
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
