import { addDoc, collection, doc, getDoc, onSnapshot, query, serverTimestamp, updateDoc, where } from 'firebase/firestore'
import { db } from './firebase'

const col = collection(db, 'tasks')
const toList = (snap) => snap.docs.map((d) => ({ id: d.id, ...d.data() }))
// Sorted in the browser so no composite Firestore index is needed.
const newestFirst = (items) => items.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0))

export const createTask = (d, user) => addDoc(col, {
  title: d.title.trim(),
  description: d.description.trim(),
  category: d.category,
  budget: Number(d.budget),
  transportCost: Number(d.transportCost || 0),
  pickupAddress: d.pickupAddress,
  pickupLocation: d.pickupLocation,
  deliveryAddress: d.deliveryAddress || '',
  deliveryLocation: d.deliveryLocation || null,
  // `address` / `location` mirror the pickup point; TaskCard and the Browse map markers use them.
  address: d.pickupAddress,
  location: d.pickupLocation,
  status: 'unpaid',
  paymentStatus: 'unpaid',
  posterId: user.uid,
  posterName: user.displayName || user.email,
  runnerId: null,
  runnerName: null,
  createdAt: serverTimestamp(),
})

export const getTask = async (id) => {
  const s = await getDoc(doc(db, 'tasks', id))
  return s.exists() ? { id: s.id, ...s.data() } : null
}

export const watchOpenTasks = (cb, onError) =>
  onSnapshot(query(col, where('status', '==', 'open')), (s) => cb(newestFirst(toList(s))), onError)

// Every task the user posted or is running, merged and de-duplicated.
export const watchMyTasks = (uid, cb, onError) => {
  let posted = [], running = []
  const emit = () => cb(newestFirst([...new Map([...posted, ...running].map((t) => [t.id, t])).values()]))
  const stopPosted = onSnapshot(query(col, where('posterId', '==', uid)), (s) => { posted = toList(s); emit() }, onError)
  const stopRunning = onSnapshot(query(col, where('runnerId', '==', uid)), (s) => { running = toList(s); emit() }, onError)
  return () => { stopPosted(); stopRunning() }
}

export const acceptTask = (id, user) => updateDoc(doc(db, 'tasks', id), {
  status: 'assigned', runnerId: user.uid, runnerName: user.displayName || user.email, acceptedAt: serverTimestamp(),
})

export const cancelTask = (id) => updateDoc(doc(db, 'tasks', id), { status: 'cancelled', updatedAt: serverTimestamp() })
