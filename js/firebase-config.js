/* ═══════════════════════════════════════════════════════════════
   firebase-config.js
   Replace the placeholder values below with your actual
   Firebase project credentials from:
   https://console.firebase.google.com → Project Settings → Your apps
═══════════════════════════════════════════════════════════════ */

const FIREBASE_CONFIG = {
  apiKey:            "YOUR_API_KEY",
  authDomain:        "YOUR_PROJECT_ID.firebaseapp.com",
  projectId:         "YOUR_PROJECT_ID",
  storageBucket:     "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId:             "YOUR_APP_ID"
};

// ── Initialize Firebase ──────────────────────────────────────
let db = null;
let storage = null;
let firebaseReady = false;

(function initFirebase() {
  try {
    // Skip init if config is still placeholder
    if (FIREBASE_CONFIG.apiKey === "YOUR_API_KEY") {
      console.warn("[Firebase] Using offline/localStorage mode. Configure firebase-config.js to enable cloud sync.");
      updateFirebaseStatus(false);
      return;
    }

    firebase.initializeApp(FIREBASE_CONFIG);
    db      = firebase.firestore();
    storage = firebase.storage();

    // Test connectivity
    db.collection("_ping").limit(1).get()
      .then(() => {
        firebaseReady = true;
        updateFirebaseStatus(true);
        console.info("[Firebase] Connected successfully.");
      })
      .catch(() => {
        updateFirebaseStatus(false);
      });

  } catch (err) {
    console.error("[Firebase] Init error:", err);
    updateFirebaseStatus(false);
  }
})();

function updateFirebaseStatus(online) {
  const dot   = document.getElementById("firebase-dot");
  const label = document.getElementById("firebase-label");
  if (!dot || !label) return;
  if (online) {
    dot.className   = "status-dot online";
    label.textContent = "Firebase: Online";
  } else {
    dot.className   = "status-dot offline";
    label.textContent = "Offline Mode";
  }
}

/* ── Firestore Helpers ──────────────────────────────────────── */

/**
 * Save a document to a Firestore collection (with auto-generated ID).
 * Falls back to localStorage if Firebase is not configured.
 * @param {string} collection - Firestore collection name
 * @param {object} data       - Document data
 * @returns {Promise<string>} - Document ID
 */
async function dbSave(collection, data) {
  if (firebaseReady && db) {
    const ref = await db.collection(collection).add({
      ...data,
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    return ref.id;
  }
  // LocalStorage fallback
  return localSave(collection, data);
}

/**
 * Update an existing document by ID.
 */
async function dbUpdate(collection, docId, data) {
  if (firebaseReady && db) {
    await db.collection(collection).doc(docId).update({
      ...data,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    return;
  }
  localUpdate(collection, docId, data);
}

/**
 * Delete a document by ID.
 */
async function dbDelete(collection, docId) {
  if (firebaseReady && db) {
    await db.collection(collection).doc(docId).delete();
    return;
  }
  localDelete(collection, docId);
}

/**
 * Fetch all documents from a collection.
 * @returns {Promise<Array>} - Array of documents with `.id` property
 */
async function dbGetAll(collection) {
  if (firebaseReady && db) {
    const snap = await db.collection(collection).orderBy("createdAt", "desc").get();
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  }
  return localGetAll(collection);
}

/* ── LocalStorage Fallback ──────────────────────────────────── */

function localSave(collection, data) {
  const all = localGetAll(collection);
  const id  = "local_" + Date.now() + "_" + Math.random().toString(36).slice(2, 7);
  all.unshift({ id, ...data, createdAt: new Date().toISOString() });
  localStorage.setItem("smb_" + collection, JSON.stringify(all));
  return id;
}

function localUpdate(collection, docId, data) {
  const all     = localGetAll(collection);
  const idx     = all.findIndex(d => d.id === docId);
  if (idx !== -1) {
    all[idx] = { ...all[idx], ...data, updatedAt: new Date().toISOString() };
    localStorage.setItem("smb_" + collection, JSON.stringify(all));
  }
}

function localDelete(collection, docId) {
  const all = localGetAll(collection).filter(d => d.id !== docId);
  localStorage.setItem("smb_" + collection, JSON.stringify(all));
}

function localGetAll(collection) {
  try {
    return JSON.parse(localStorage.getItem("smb_" + collection) || "[]");
  } catch {
    return [];
  }
}
