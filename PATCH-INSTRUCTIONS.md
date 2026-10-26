# QuickRun targeted fixes (no npm install)

This is a **partial file patch**, not a replacement project. Back up your current files first, then copy the files in this patch over the same paths in your existing `quickrun` folder. Do not replace your `.env`, `node_modules`, or `package-lock.json`.

## Google Maps setup (required)
1. In Google Cloud Console, enable **Maps JavaScript API** and **Places API** for your Google Cloud project and attach billing as required by Google.
2. Create a browser API key restricted to your local development origin and your production domain. Do not use a server secret as a browser key.
3. Add this line to your existing `.env` file (keep your current Firebase values):

   `VITE_GOOGLE_MAPS_API_KEY=your_restricted_browser_key`

4. Restart `npm run dev` after changing `.env`.

The post-task form now has one map, one search box, and a Pickup/Delivery switch. Search and select a Google Maps suggestion (for example, Shoprite, Tanke Junction, or Peace Street), or click the map to pin the selected location. The Google Maps key is required; without it, the map will show a setup error instead of a blank panel.

## Firebase setup
- Deploy the updated Firestore rules and Storage rules: `firebase deploy --only firestore:rules,storage`
- Profile photos are uploaded from the user's device to Firebase Storage. Storage must be enabled in the Firebase console. The new `storage.rules` restrict uploads to the signed-in user's own folder and limits image size to 5 MB.
- If you changed `functions/index.js`, deploy Cloud Functions separately with `firebase deploy --only functions`.

## Errands disappearing
- Task lists no longer require composite `orderBy` indexes for their basic snapshots; results are sorted in the browser, and the browse/my-tasks screens show Firestore errors instead of silently appearing empty.
- Tasks are intentionally **not visible to runners until payment is verified**. They appear in Browse after the Paystack verification function marks them `status: open`. Check Firebase Functions logs and Firestore if a paid task does not appear.

## Important limitations
- Language selection remains stored in `localStorage` and is retained when navigating between pages. This patch adds translations to the post-task flow and shared navigation labels, but some existing page copy is still hard-coded in English. It is **not yet a 100% complete Hausa/Yoruba/Igbo translation of every page**; that needs a full screen-by-screen translation pass.
- The production build could not be verified in this environment because the archived `node_modules` is missing Rollup's Linux optional binary. The changed JavaScript/JSX files passed a parser syntax check. This patch does not require installing dependencies.
