import {
  addDoc,
  collection,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  where,
} from 'firebase/firestore'
import { db } from './firebaseClient'

const COLLECTION_NAME = 'userRecords'

const ensureDb = () => {
  if (!db) {
    throw new Error(
      'Firebase is not configured. Add the VITE_FIREBASE_* env vars and reload.',
    )
  }
  return db
}

export async function saveRouteRecord({
  userId,
  route,
  note,
  preference,
  tripRequest,
}) {
  if (!userId) {
    throw new Error('Please log in to save a record.')
  }
  if (!route) {
    throw new Error('Select a route to save before submitting.')
  }

  const payload = {
    userId,
    routeId: route.id ?? null,
    routeName: route.name ?? 'Unnamed route',
    preference: preference ?? 'safest',
    note: note?.trim() ?? '',
    createdAt: serverTimestamp(),
    tripOrigin: tripRequest?.origin ?? null,
    tripDestination: tripRequest?.destination ?? null,
    estimatedDuration: route.estimatedDuration ?? null,
    distanceMiles:
      route.distanceMiles ?? route.estimatedDistance ?? null,
    metrics: route.metrics ?? null,
  }

  await addDoc(collection(ensureDb(), COLLECTION_NAME), payload)
  return payload
}

export function subscribeToUserRecords(userId, onUpdate, onError) {
  if (!db || !userId) {
    if (typeof onUpdate === 'function') {
      onUpdate([])
    }
    return () => {}
  }

  const recordsQuery = query(
    collection(db, COLLECTION_NAME),
    where('userId', '==', userId),
    orderBy('createdAt', 'desc'),
  )

  return onSnapshot(
    recordsQuery,
    (snapshot) => {
      const records = snapshot.docs.map((doc) => {
        const data = doc.data()
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate
            ? data.createdAt.toDate()
            : null,
        }
      })
      if (typeof onUpdate === 'function') {
        onUpdate(records)
      }
    },
    (error) => {
      console.error('Failed to load saved records', error)
      if (typeof onError === 'function') {
        onError(error)
      }
    },
  )
}
