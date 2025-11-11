const admin = require('firebase-admin')
const fs = require('fs')
const path = require('path')

const loadServiceAccount = () => {
  console.log('[firebase] init service account loader')
  if (process.env.FIREBASE_SERVICE_ACCOUNT_BASE64) {
    try {
      console.log('[firebase] using base64 service account')
      const decoded = Buffer.from(
        process.env.FIREBASE_SERVICE_ACCOUNT_BASE64,
        'base64',
      ).toString('utf-8')
      return JSON.parse(decoded)
    } catch (error) {
      console.error('Failed to parse FIREBASE_SERVICE_ACCOUNT_BASE64', error)
      return null
    }
  }

  const credentialPath =
    process.env.FIREBASE_SERVICE_ACCOUNT_PATH ||
    process.env.GOOGLE_APPLICATION_CREDENTIALS

  if (!credentialPath) {
    console.warn(
      '[firebase] No FIREBASE_SERVICE_ACCOUNT_PATH or GOOGLE_APPLICATION_CREDENTIALS set. Falling back to in-memory storage.',
    )
    return null
  }

  const resolvedPath = path.isAbsolute(credentialPath)
    ? credentialPath
    : path.join(process.cwd(), credentialPath)
  console.log('[firebase] looking for credentials at', resolvedPath)

  console.log('[firebase] looking for credentials at', resolvedPath)

  if (!fs.existsSync(resolvedPath)) {
    console.warn(
      `Firebase credential file not found at ${resolvedPath}. Falling back to in-memory storage.`,
    )
    return null
  }

  try {
    // eslint-disable-next-line import/no-dynamic-require, global-require
    return require(resolvedPath)
  } catch (error) {
    console.error(
      `Failed to load Firebase credential file at ${resolvedPath}`,
      error,
    )
    return null
  }
}

const serviceAccount = loadServiceAccount()

if (serviceAccount) {
  console.log('[firebase] initializing admin SDK')
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: serviceAccount.project_id,
  })
}

const db = admin.apps.length > 0 ? admin.firestore() : null
if (db) {
  console.log('[firebase] Firestore ready')
} else {
  console.warn('[firebase] running without Firestore (fallback mode)')
}

module.exports = {
  admin,
  db,
}
