const crypto = require('node:crypto');
const admin = require('firebase-admin');
const { onRequest } = require('firebase-functions/v2/https');
const { defineSecret } = require('firebase-functions/params');
const logger = require('firebase-functions/logger');

admin.initializeApp();

const db = admin.firestore();
const RAZORPAY_WEBHOOK_SECRET = defineSecret('RAZORPAY_WEBHOOK_SECRET');
const DEFAULT_PUJA_TIME = '9:00 AM';

const trackingSteps = (date) => [
  { key: 'booking_confirmed', label: 'Booking Confirmed', status: 'done', mode: 'auto', message: 'Your booking and payment are confirmed.' },
  { key: 'payment_received', label: 'Payment Received', status: 'done', mode: 'auto', message: 'Payment has been received successfully.' },
  { key: 'puja_scheduled', label: 'Puja Scheduled', status: 'done', mode: 'auto', message: `Puja is scheduled for ${date || 'your selected date'} at ${DEFAULT_PUJA_TIME}.` },
  { key: 'puja_completed', label: 'Puja Performed', status: 'pending', mode: 'manual', message: 'Team will update after puja completion.' },
  { key: 'video_sent', label: 'Video Sent', status: 'pending', mode: 'manual', message: 'Video or confirmation will be sent when available.' },
];

const rawRequestBody = (request) => {
  if (Buffer.isBuffer(request.rawBody)) return request.rawBody;
  return null;
};

const signatureIsValid = (rawBody, signature, secret) => {
  if (!rawBody || !signature || !secret) return false;
  const expected = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
  const received = Buffer.from(signature, 'utf8');
  const expectedBuffer = Buffer.from(expected, 'utf8');
  return received.length === expectedBuffer.length && crypto.timingSafeEqual(received, expectedBuffer);
};

const paymentEntity = (event) => event?.payload?.payment?.entity || {};
const orderEntity = (event) => event?.payload?.order?.entity || {};
const bookingIdFromEvent = (event) => {
  const payment = paymentEntity(event);
  const order = orderEntity(event);
  return String(payment.notes?.internal_order_id || order.notes?.internal_order_id || '').trim();
};

exports.razorpayWebhook = onRequest(
  { region: 'asia-south1', secrets: [RAZORPAY_WEBHOOK_SECRET] },
  async (request, response) => {
    if (request.method !== 'POST') {
      response.set('Allow', 'POST').status(405).send('Method Not Allowed');
      return;
    }

    const rawBody = rawRequestBody(request);
    const signature = request.get('x-razorpay-signature');
    if (!signatureIsValid(rawBody, signature, RAZORPAY_WEBHOOK_SECRET.value())) {
      logger.warn('Rejected Razorpay webhook with invalid signature');
      response.status(400).send('Invalid signature');
      return;
    }

    let event;
    try {
      event = JSON.parse(rawBody.toString('utf8'));
    } catch (error) {
      response.status(400).send('Invalid JSON');
      return;
    }

    const eventId = String(request.get('x-razorpay-event-id') || event.id || '').trim();
    const bookingId = bookingIdFromEvent(event);
    const eventName = String(event.event || 'unknown');
    if (!eventId || !bookingId) {
      logger.warn('Ignoring Razorpay webhook without event or internal booking ID', { eventName });
      response.status(200).send('Ignored');
      return;
    }

    const payment = paymentEntity(event);
    const bookingRef = db.collection('bookings').doc(bookingId);
    const webhookRef = db.collection('razorpayWebhookEvents').doc(eventId);
    const now = admin.firestore.FieldValue.serverTimestamp();

    try {
      const outcome = await db.runTransaction(async (transaction) => {
        const [processedEvent, booking] = await Promise.all([
          transaction.get(webhookRef),
          transaction.get(bookingRef),
        ]);
        if (processedEvent.exists) return { duplicate: true };
        if (!booking.exists) throw new Error(`Unknown booking ${bookingId}`);

        const bookingData = booking.data();
        if (bookingData.paymentStatus === 'paid' && eventName !== 'payment.captured') {
          transaction.set(webhookRef, { eventName, bookingId, processedAt: now, outcome: 'ignored_after_payment_confirmation' });
          return { duplicate: false, outcome: 'ignored_after_payment_confirmation' };
        }
        const expectedAmount = Math.round(Number(bookingData.amount || 0) * 100);
        const actualAmount = Number(payment.amount || 0);
        const validAmount = expectedAmount > 0 && actualAmount === expectedAmount;
        const currency = String(payment.currency || '').toUpperCase();
        const paymentId = String(payment.id || '');

        let patch;
        let notification;
        let adminNotification;

        if (eventName === 'payment.captured' && validAmount && currency === 'INR') {
          patch = {
            status: 'Confirmed',
            paymentStatus: 'paid',
            paymentGateway: 'razorpay_webhook',
            paymentId,
            razorpayPaymentId: paymentId,
            razorpayOrderId: String(payment.order_id || ''),
            paidAmount: actualAmount / 100,
            paidCurrency: currency,
            paymentCapturedAt: now,
            trackingSteps: trackingSteps(bookingData.date),
            updatedAt: now,
          };
          notification = {
            audience: 'user', userId: bookingData.userId, orderId: bookingId,
            title: 'Puja booking confirmed',
            message: `${bookingData.pujaName || 'Your puja'} is booked for ${bookingData.date || 'your selected date'} at ${DEFAULT_PUJA_TIME}.`,
            unread: true, pushStatus: 'pending', pushChannel: 'web', createdAt: now,
          };
          adminNotification = {
            audience: 'admin', orderId: bookingId,
            title: 'New puja booking received',
            message: `${bookingData.pujaName || 'Puja'} booked by ${bookingData.userName || 'a devotee'}. Amount: Rs ${(actualAmount / 100).toLocaleString('en-IN')}.`,
            unread: true, pushStatus: 'pending', pushChannel: 'web', createdAt: now,
          };
        } else if (eventName === 'payment.failed') {
          patch = {
            status: 'Payment Failed',
            paymentStatus: 'failed',
            paymentGateway: 'razorpay_webhook',
            paymentId,
            razorpayPaymentId: paymentId,
            paymentFailureCode: String(payment.error_code || ''),
            paymentFailureDescription: String(payment.error_description || ''),
            updatedAt: now,
          };
        } else {
          patch = {
            status: 'Payment Review',
            paymentStatus: 'review_required',
            paymentGateway: 'razorpay_webhook',
            paymentId,
            razorpayPaymentId: paymentId,
            paymentReviewReason: eventName === 'payment.captured' ? 'Amount or currency mismatch' : `Unhandled webhook event: ${eventName}`,
            updatedAt: now,
          };
          adminNotification = {
            audience: 'admin', orderId: bookingId,
            title: 'Payment needs review',
            message: `${bookingData.pujaName || 'Puja'} payment requires review (${eventName}).`,
            unread: true, pushStatus: 'pending', pushChannel: 'web', createdAt: now,
          };
        }

        transaction.update(bookingRef, patch);
        transaction.set(webhookRef, { eventName, bookingId, paymentId, processedAt: now, outcome: patch.paymentStatus });
        if (notification) transaction.set(db.collection('notifications').doc(`${bookingId}_payment_confirmed`), notification, { merge: true });
        if (adminNotification) transaction.set(db.collection('adminNotifications').doc(`${bookingId}_${patch.paymentStatus}`), adminNotification, { merge: true });
        return { duplicate: false, outcome: patch.paymentStatus };
      });

      logger.info('Processed Razorpay webhook', { eventId, bookingId, eventName, ...outcome });
      response.status(200).send('OK');
    } catch (error) {
      // A non-2xx response asks Razorpay to retry transient failures, such as
      // a webhook arriving before the pending booking has been written.
      logger.error('Razorpay webhook processing failed', { eventId, bookingId, eventName, error: error.message });
      response.status(500).send('Retry later');
    }
  }
);
