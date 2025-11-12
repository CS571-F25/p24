import { getApps, initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

const firebaseReady = Object.values(firebaseConfig).every(Boolean)

let app = null

if (firebaseReady) {
  const apps = getApps()
  app = apps.length ? apps[0] : initializeApp(firebaseConfig)
} else if (import.meta.env.DEV) {
  console.warn(
    '[firebase] missing config — add VITE_FIREBASE_* env vars to enable auth/records',
  )
}

const auth = app ? getAuth(app) : null
const db = app ? getFirestore(app) : null

export { app, auth, db, firebaseReady }
