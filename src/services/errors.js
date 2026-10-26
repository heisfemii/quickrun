// Turns Firebase / Cloud Functions errors into messages a person can act on.
const BY_CODE = {
  // Authentication
  'auth/invalid-credential': 'Incorrect email or password.',
  'auth/wrong-password': 'Incorrect email or password.',
  'auth/user-not-found': 'No account exists for that email.',
  'auth/invalid-email': 'That email address is not valid.',
  'auth/email-already-in-use': 'An account with this email already exists. Try logging in instead.',
  'auth/weak-password': 'Choose a stronger password (at least 6 characters).',
  'auth/too-many-requests': 'Too many attempts. Wait a few minutes and try again.',
  'auth/network-request-failed': 'Network error. Check your internet connection and try again.',
  'auth/popup-blocked': 'Your browser blocked the Google sign-in popup. Allow popups for this site and try again.',
  'auth/unauthorized-domain': 'This domain is not authorised for sign-in. Add it in Firebase → Authentication → Settings → Authorized domains.',
  'auth/operation-not-allowed': 'This sign-in method is not enabled. Enable it in Firebase → Authentication → Sign-in method.',
  'auth/requires-recent-login': 'Please sign in again to do that.',
  // Firestore / Storage
  'permission-denied': 'You do not have permission to do that. If this looks wrong, deploy the rules: firebase deploy --only firestore:rules,storage',
  'unavailable': 'Cannot reach the server. Check your internet connection and try again.',
  'failed-precondition': 'Firestore needs a setup step (often a missing index or a disabled database). Check the browser console for details.',
  'storage/unauthorized': 'Not allowed to upload that file. Images must be under 5 MB, and Storage rules must be deployed (firebase deploy --only storage).',
  'storage/bucket-not-found': 'Firebase Storage is not enabled for this project. Enable it in the Firebase console.',
  'storage/canceled': 'The upload was cancelled.',
  // Cloud Functions
  'functions/not-found': 'That server function is not deployed yet. Run: firebase deploy --only functions',
  'functions/unavailable': 'Cannot reach the server functions. Check your connection, or that functions are deployed.',
  'functions/unauthenticated': 'Please sign in again and retry.',
  'functions/deadline-exceeded': 'The server took too long to respond. Try again.',
}

export function errorMessage(err, fallback = 'Something went wrong. Please try again.') {
  if (!err) return fallback
  const code = String(err.code || '')
  const msg = String(err.message || '').trim()

  // Cloud Functions: HttpsError messages written by our own functions are already accurate.
  if (code.startsWith('functions/')) {
    if (code === 'functions/internal' && (!msg || /^internal$/i.test(msg))) {
      return 'The server failed without saying why. Run `firebase functions:log` to see the cause, and make sure the latest functions are deployed.'
    }
    if (BY_CODE[code] && (!msg || msg === code.replace('functions/', '').toUpperCase().replace(/-/g, '_'))) return BY_CODE[code]
    return msg || BY_CODE[code] || fallback
  }
  if (BY_CODE[code]) return BY_CODE[code]
  if (BY_CODE[code.replace(/^firestore\//, '')]) return BY_CODE[code.replace(/^firestore\//, '')]

  // Strip "Firebase: " noise and show the code when we have nothing better.
  const cleaned = msg.replace(/^Firebase:\s*/i, '').replace(/\s*\((auth|storage)\/[^)]+\)\.?$/, '').trim()
  if (cleaned && cleaned !== msg) return `${cleaned}${code ? ` (${code})` : ''}`
  return msg || (code ? `${fallback} (${code})` : fallback)
}
