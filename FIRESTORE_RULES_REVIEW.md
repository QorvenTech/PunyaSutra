# Firestore security rules review

This is a review-only draft. It has not been deployed.

| Collection | Devotee (`user`) | Operations roles | Owner | Public |
| --- | --- | --- | --- | --- |
| `users` | Read/update only own profile; cannot change role | No access | Full read, role management through Admin SDK/Console | No access |
| `managedPujas` | Read | Read | Create/update/delete | Read |
| `pujaAvailability` | Read | Read | Create/update/delete | Read |
| `bookings` | Create/read only own **pending** request | No access | Read/update/delete all | No access |
| `bookingOpsShares` | Create own limited share | Read name/gotra only | Read/update/delete | No access |
| `notifications` | Create/read only own user notification | No access | Read/update/delete all | No access |
| `adminNotifications` | No access | No access | Read/update/delete | No access |
| `appSettings` | No access | No access | Read/write | No access |

## Required companion code changes before deployment

1. Website booking-share writes must include `userId` (the draft rule deliberately requires this).
2. The public `track.html?orderId=...` lookup must require login and only fetch a booking for its owner. Anonymous order-ID lookup cannot remain without exposing customer information.
3. Owner and operations roles must be assigned through Firebase Console/Admin SDK, never by the public signup page.
4. Move creation of admin notifications and payment confirmation to Cloud Functions before enabling a live Razorpay key. Browser clients can only create a pending request; they cannot mark a payment paid or confirmed.

## Razorpay webhook review

The proposed `functions/razorpayWebhook` endpoint:

1. Verifies `X-Razorpay-Signature` with an HMAC-SHA256 of the **raw** request body and the Firebase Secret Manager value `RAZORPAY_WEBHOOK_SECRET`.
2. Records `x-razorpay-event-id` in `razorpayWebhookEvents` inside the same Firestore transaction, making duplicate delivery idempotent.
3. Requires the browser to create the pending booking before opening Checkout. It matches Razorpay’s `internal_order_id` note to that booking.
4. On `payment.captured`, verifies the booked amount and INR currency before marking the booking `Confirmed`, then creates both user and owner notifications using the Admin SDK.
5. On `payment.failed`, marks the pending booking `Payment Failed`. Out-of-order failures never overwrite an already paid booking.
6. Puts amount/currency mismatches or unhandled events into `Payment Review` and creates an owner notification instead of confirming a booking.

Before deployment, set the secret with `firebase functions:secrets:set RAZORPAY_WEBHOOK_SECRET`, deploy the function, and configure its HTTPS URL in the Razorpay Dashboard for **payment.captured** and **payment.failed** events. Use test-mode webhooks first.
