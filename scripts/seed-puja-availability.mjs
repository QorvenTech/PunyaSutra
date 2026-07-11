import { readFileSync } from 'node:fs';

const PLACEHOLDER_IDS = Array.from({ length: 21 }, (_, index) => String(index + 1));
const apply = process.argv.includes('--apply');
const firebaseClient = readFileSync(new URL('../site/firebaseClient.js', import.meta.url), 'utf8');
const apiKey = firebaseClient.match(/apiKey:\s*'([^']+)'/)?.[1];
const projectId = firebaseClient.match(/projectId:\s*'([^']+)'/)?.[1];

if (!apiKey || !projectId) throw new Error('Could not read the Firebase project configuration.');

if (!apply) {
  console.log(`Dry run: would set bookingEnabled=false for pujaAvailability/{${PLACEHOLDER_IDS.join(', ')}}.`);
  console.log('Run with --apply only immediately before deploying firestore.rules.');
  process.exit(0);
}

const now = new Date().toISOString();
for (const pujaId of PLACEHOLDER_IDS) {
  const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/pujaAvailability/${pujaId}?key=${apiKey}`;
  const response = await fetch(url, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      fields: {
        bookingEnabled: { booleanValue: false },
        bookingStatusMessage: { stringValue: 'Bookings opening soon' },
        updatedAt: { timestampValue: now },
      },
    }),
  });
  if (!response.ok) throw new Error(`Could not seed pujaAvailability/${pujaId}: ${await response.text()}`);
}

console.log(`Seeded ${PLACEHOLDER_IDS.length} disabled puja availability records.`);
