import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
} from 'firebase/auth'
import { auth, firebaseReady } from '../services/firebaseClient'

const AuthContext = createContext({
  user: null,
  loading: true,
  firebaseReady: false,
})

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!auth) {
      setLoading(false)
      setUser(null)
      return () => {}
    }

    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser)
      setLoading(false)
    })

    return unsubscribe
  }, [])

  const value = useMemo(
    () => ({
      user,
      loading,
      firebaseReady,
      signIn: (email, password) => {
        if (!auth) {
          return Promise.reject(
            new Error(
              'Firebase is not configured yet. Add the VITE_FIREBASE_* env vars to enable auth.',
            ),
          )
        }
        return signInWithEmailAndPassword(auth, email, password)
      },
      register: (email, password) => {
        if (!auth) {
          return Promise.reject(
            new Error(
              'Firebase is not configured yet. Add the VITE_FIREBASE_* env vars to enable auth.',
            ),
          )
        }
        return createUserWithEmailAndPassword(auth, email, password)
      },
      signOut: () => {
        if (!auth) {
          return Promise.resolve()
        }
        return firebaseSignOut(auth)
      },
    }),
    [user, loading],
  )

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
