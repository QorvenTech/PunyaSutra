const REAL_PUJA_IMAGES = [
  { keys: ['mahakal', 'mahakaleshwar', 'somnath'], url: 'https://images.unsplash.com/photo-1609947017136-9daf32a5eb16?auto=format&fit=crop&w=1100&q=82' },
  { keys: ['kamakhya', 'baglamukhi', 'durga', 'vindhyachal'], url: 'https://images.unsplash.com/photo-1598091383021-15ddea10925d?auto=format&fit=crop&w=1100&q=82' },
  { keys: ['kedarnath', 'rudrabhishek', 'maha rudra'], url: 'https://images.unsplash.com/photo-1626621331169-5f34be280ed9?auto=format&fit=crop&w=1100&q=82' },
  { keys: ['kaal sarp', 'trimbakeshwar'], url: 'https://images.unsplash.com/photo-1561361513-2d000a50f0dc?auto=format&fit=crop&w=1100&q=82' },
  { keys: ['ram lalla', 'ram mandir', 'ayodhya', 'sundarkand'], url: 'https://images.unsplash.com/photo-1609766418204-94aae0ecf8e3?auto=format&fit=crop&w=1100&q=82' },
  { keys: ['kashi', 'vishwanath', 'varanasi'], url: 'https://images.unsplash.com/photo-1561361513-2d000a50f0dc?auto=format&fit=crop&w=1100&q=82' },
  { keys: ['vaishno', 'chandi havan'], url: 'https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?auto=format&fit=crop&w=1100&q=82' },
  { keys: ['ganesh', 'siddhivinayak'], url: 'https://images.unsplash.com/photo-1604076913837-52ab5629fba9?auto=format&fit=crop&w=1100&q=82' },
  { keys: ['satyanarayan', 'vishnu', 'tirupati', 'sudarshan', 'pitru', 'gaya', 'krishna', 'iskcon', 'vrindavan'], url: 'https://images.unsplash.com/photo-1577083753695-e010191bacb5?auto=format&fit=crop&w=1100&q=82' },
  { keys: ['navgraha', 'navagraha', 'grah', 'mangal', 'mangalnath'], url: 'https://images.unsplash.com/photo-1624461084896-cc7d24a163fc?auto=format&fit=crop&w=1100&q=82' },
  { keys: ['hanuman', 'salassar'], url: 'https://images.unsplash.com/photo-1604076913837-52ab5629fba9?auto=format&fit=crop&w=1100&q=82' },
  { keys: ['laxmi', 'lakshmi', 'kalighat'], url: 'https://images.unsplash.com/photo-1577083753695-e010191bacb5?auto=format&fit=crop&w=1100&q=82' },
  { keys: ['pushkar', 'brahma'], url: 'https://images.unsplash.com/photo-1626621331169-5f34be280ed9?auto=format&fit=crop&w=1100&q=82' },
];

const DEFAULT_REAL_IMAGE = REAL_PUJA_IMAGES[0].url;
const generatedImagePattern = /data:image\/svg\+xml|Pujan%20Sutra|Pujan Sutra/i;

function realImageForText(text = '') {
  const normalized = String(text).toLowerCase();
  return REAL_PUJA_IMAGES.find((entry) => entry.keys.some((key) => normalized.includes(key)))?.url || DEFAULT_REAL_IMAGE;
}

function contextTextForImage(img) {
  const card = img.closest('.card, .summaryCard');
  return `${img.alt || ''} ${card?.innerText || ''}`;
}

function applyRealPujaImages() {
  document.querySelectorAll('.card img, #selectedPujaImage').forEach((img) => {
    const targetUrl = realImageForText(contextTextForImage(img));
    const current = img.getAttribute('src') || '';
    if (img.dataset.realPujaImage === targetUrl && current === targetUrl) return;
    if (!current || generatedImagePattern.test(current) || current.startsWith('data:') || img.closest('.card')) {
      img.dataset.realPujaImage = targetUrl;
      img.onerror = () => {
        img.onerror = null;
        img.src = DEFAULT_REAL_IMAGE;
      };
      img.src = targetUrl;
    }
  });
}

applyRealPujaImages();
new MutationObserver(applyRealPujaImages).observe(document.body, { childList: true, subtree: true });
window.addEventListener('hashchange', () => setTimeout(applyRealPujaImages, 50));
