# QuickRun
Errand-running marketplace with a live map and English / Yorùbá / Hausa / Igbo support.

## Local setup
1. `npm install`
2. Copy `.env.example` to `.env` and fill in your Firebase web-app values.
3. `cp .firebaserc.example .firebaserc` and set your Firebase project id.
4. `npm run dev` (restart it after any `.env` change).

### Firebase console
- Authentication → enable **Email/Password** and **Google**; add your local and production domains under Authorized domains.
- Enable **Firestore** and **Storage** (profile photos).

### Maps
Maps use Leaflet with OpenStreetMap tiles, and Nominatim for place search and address lookup. It is free and needs no API key or billing. Both services have fair-use limits (about 1 search per second, and light tile usage), which is fine for development and early traffic. For heavy production traffic, switch the tile URL and search endpoint in `src/components/MapView.jsx` to a paid provider (MapTiler, Stadia, LocationIQ, etc.).

## Payments (Paystack)
Never put the Paystack **secret** key in a `VITE_` variable.

1. `firebase functions:secrets:set PAYSTACK_SECRET_KEY` and paste your `sk_test_…` key.
2. `cd functions && npm install && cd ..`
3. `firebase deploy --only functions,firestore:rules,storage`
4. Make sure the Paystack account currency is NGN, and test in test mode first.

Flow: poster creates a task (`unpaid`) → Paystack checkout → on return `verifyPayment` confirms the amount and the task becomes `open` (visible to runners) → runner accepts → poster generates a 6-digit completion code and gives it to the runner on delivery → `confirmTaskCompletion` marks the task `done` and the payout `pending_manual_release`.

Checkout total = order cost + 10% runner fee + transport + ₦300 QuickRun fee + estimated Paystack fee (a configurable estimate: check it against current Paystack pricing).

### Not implemented yet
- **Automatic payouts and refunds.** Collection is verified, but money is released manually. Runners save a verified bank account on `/payouts` (stored in the server-only `payoutAccounts` collection). Do not advertise automatic payouts until a transfer workflow is built and audited.
- **Cancelling a paid task** (there is no refund path, so the UI only allows cancelling unpaid tasks).
- A Paystack **webhook**. If someone pays but closes the tab before returning, the *Pay / check payment* button on their task re-verifies it.

## Notes
- Have native speakers review the yo/ha/ig strings in `src/services/i18n.js`, `landing.js` and the post-task form.
- Several screens (dashboard, profile, login) still have English-only copy.
- Errors from Firebase and Cloud Functions are translated by `src/services/errors.js`. If a function ever fails unexpectedly, the real cause is shown in the app and logged: `firebase functions:log`.
- Task lists are sorted in the browser, so no composite Firestore indexes are required.
