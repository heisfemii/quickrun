import { createContext, useContext, useEffect, useState } from 'react'
import {
  createUserWithEmailAndPassword, GoogleAuthProvider, onAuthStateChanged,
  signInWithEmailAndPassword, signInWithPopup, signOut, updateProfile,
} from 'firebase/auth'
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore'
import { auth, db } from '../services/firebase'

const Ctx = createContext(null)
export const useAuth = () => useContext(Ctx)

const newProfile = (name, email, role = 'tasker') => ({
  name, email, role, avatarUrl: '', avatarColor: '#D4AF37', bio: '', phone: '', services: [], minimumPrice: 0,
})

async function loadProfile(uid) {
  try {
    const snap = await getDoc(doc(db, 'users', uid))
    return snap.exists() ? snap.data() : null
  } catch {
    return null
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => onAuthStateChanged(auth, async (u) => {
    setUser(u)
    setProfile(u ? (await loadProfile(u.uid)) || newProfile(u.displayName || '', u.email || '') : null)
    setLoading(false)
  }), [])

  const signup = async (name, email, password, role = 'tasker') => {
    const { user: u } = await createUserWithEmailAndPassword(auth, email, password)
    await updateProfile(u, { displayName: name })
    await setDoc(doc(db, 'users', u.uid), { ...newProfile(name, email, role), createdAt: serverTimestamp() })
    setProfile(await loadProfile(u.uid))
  }

  const login = (email, password) => signInWithEmailAndPassword(auth, email, password)

  const loginWithGoogle = async (role = 'tasker') => {
    const provider = new GoogleAuthProvider()
    provider.setCustomParameters({ prompt: 'select_account' })
    const result = await signInWithPopup(auth, provider)
    const u = result.user
    const ref = doc(db, 'users', u.uid)
    // Only create the profile the first time; never overwrite an existing role/avatar on login.
    if ((await getDoc(ref)).exists()) await setDoc(ref, { lastLoginAt: serverTimestamp() }, { merge: true })
    else await setDoc(ref, { ...newProfile(u.displayName || '', u.email || '', role), createdAt: serverTimestamp() })
    setProfile(await loadProfile(u.uid))
    return result
  }

  const updateUserProfile = async (patch) => {
    if (!auth.currentUser) throw new Error('Please sign in again.')
    await setDoc(doc(db, 'users', auth.currentUser.uid), { ...patch, updatedAt: serverTimestamp() }, { merge: true })
    setProfile(await loadProfile(auth.currentUser.uid))
  }

  const logout = () => signOut(auth)

  return <Ctx.Provider value={{ user, profile, loading, signup, login, loginWithGoogle, logout, updateUserProfile }}>{children}</Ctx.Provider>
}
