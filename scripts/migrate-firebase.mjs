/**
 * Migrate all Firestore data from one Firebase project to another.
 *
 * Collections migrated (from src/lib/*):
 *   users, user_investments, investment_plans, user_stakes, staking_plans,
 *   userReferralCodes, sbag_positions, sell_delegations, nodePurchases,
 *   referrals, nodes, referral_activities, notices, ad_images,
 *   user_performance_overrides
 *
 * Usage (from project root):
 *   node scripts/migrate-firebase.mjs
 *   # Or: npm run migrate-firebase
 *
 * 1. Edit DEST_CONFIG below with your new Firebase project config, or
 * 2. Set env: FIREBASE_SOURCE_CONFIG and FIREBASE_DEST_CONFIG (JSON strings).
 */

import { initializeApp, getApps } from "firebase/app";
import {
  getFirestore,
  collection,
  doc,
  getDocs,
  writeBatch,
  Timestamp,
} from "firebase/firestore";

// ---------------------------------------------------------------------------
// CONFIG: Replace with your source and destination Firebase configs
// Get config from Firebase Console > Project Settings > Your apps > SDK setup
// ---------------------------------------------------------------------------

// Default configs are placeholders; real configs should be provided via env:
// FIREBASE_SOURCE_CONFIG and FIREBASE_DEST_CONFIG (JSON strings).
const SOURCE_CONFIG = {
  apiKey: "YOUR_SOURCE_FIREBASE_API_KEY",
  authDomain: "your-source-project.firebaseapp.com",
  projectId: "your-source-project-id",
  storageBucket: "your-source-project.appspot.com",
  messagingSenderId: "YOUR_SOURCE_MESSAGING_SENDER_ID",
  appId: "YOUR_SOURCE_APP_ID",
};

const DEST_CONFIG = {
  apiKey: "YOUR_DEST_FIREBASE_API_KEY",
  authDomain: "your-dest-project.firebaseapp.com",
  projectId: "your-dest-project-id",
  storageBucket: "your-dest-project.appspot.com",
  messagingSenderId: "YOUR_DEST_MESSAGING_SENDER_ID",
  appId: "YOUR_DEST_APP_ID",
  measurementId: "YOUR_DEST_MEASUREMENT_ID",
};

const COLLECTIONS = [
  "users",
  "user_investments",
  "investment_plans",
  "user_stakes",
  "staking_plans",
  "userReferralCodes",
  "sbag_positions",
  "sell_delegations",
  "nodePurchases",
  "referrals",
  "nodes",
  "referral_activities",
  "notices",
  "ad_images",
  "user_performance_overrides",
];

const BATCH_SIZE = 500;

function getSourceDb() {
  const config = process.env.FIREBASE_SOURCE_CONFIG
    ? JSON.parse(process.env.FIREBASE_SOURCE_CONFIG)
    : SOURCE_CONFIG;
  let app = getApps().find((a) => a.name === "firebase-migrate-source");
  if (!app) app = initializeApp(config, "firebase-migrate-source");
  return getFirestore(app);
}

function getDestDb() {
  const config = process.env.FIREBASE_DEST_CONFIG
    ? JSON.parse(process.env.FIREBASE_DEST_CONFIG)
    : DEST_CONFIG;
  let app = getApps().find((a) => a.name === "firebase-migrate-dest");
  if (!app) app = initializeApp(config, "firebase-migrate-dest");
  return getFirestore(app);
}

function getSourceConfig() {
  return process.env.FIREBASE_SOURCE_CONFIG
    ? JSON.parse(process.env.FIREBASE_SOURCE_CONFIG)
    : SOURCE_CONFIG;
}

function serializeForWrite(data) {
  if (data == null) return data;
  if (data instanceof Timestamp) return data;
  if (data instanceof Date) return Timestamp.fromDate(data);
  if (Array.isArray(data)) return data.map(serializeForWrite);
  if (typeof data === "object" && data.constructor === Object) {
    const out = {};
    for (const [k, v] of Object.entries(data)) out[k] = serializeForWrite(v);
    return out;
  }
  return data;
}

async function migrateCollection(collectionName, dbSource, dbDest) {
  const snapshot = await getDocs(collection(dbSource, collectionName));
  const docs = snapshot.docs;
  const total = docs.length;

  if (total === 0) {
    console.log(`  [${collectionName}] 0 documents (skip)`);
    return { collection: collectionName, count: 0 };
  }

  let written = 0;
  for (let i = 0; i < docs.length; i += BATCH_SIZE) {
    const batch = writeBatch(dbDest);
    const chunk = docs.slice(i, i + BATCH_SIZE);
    for (const d of chunk) {
      batch.set(
        doc(dbDest, collectionName, d.id),
        serializeForWrite(d.data())
      );
      written += 1;
    }
    await batch.commit();
    console.log(`  [${collectionName}] ${written}/${total} documents written`);
  }
  return { collection: collectionName, count: written };
}

async function main() {
  const destConfig = process.env.FIREBASE_DEST_CONFIG
    ? JSON.parse(process.env.FIREBASE_DEST_CONFIG)
    : DEST_CONFIG;
  if (!destConfig.projectId || destConfig.projectId === "YOUR_DEST_PROJECT") {
    console.error(
      "Set destination Firebase config: edit DEST_CONFIG in scripts/migrate-firebase.mjs or set FIREBASE_DEST_CONFIG env."
    );
    process.exit(1);
  }

  console.log("Firebase migration: source → destination");
  console.log("Source:", getSourceConfig().projectId);
  console.log("Dest:  ", destConfig.projectId);
  console.log("");

  const dbSource = getSourceDb();
  const dbDest = getDestDb();

  const results = [];
  for (const name of COLLECTIONS) {
    try {
      results.push(await migrateCollection(name, dbSource, dbDest));
    } catch (err) {
      console.error(`  [${name}] ERROR:`, err.message);
      results.push({ collection: name, count: -1, error: err.message });
    }
  }

  console.log("");
  console.log("Summary:");
  let total = 0;
  for (const r of results) {
    const count = r.count >= 0 ? r.count : 0;
    total += count;
    console.log(`  ${r.collection}: ${r.error ? `ERROR: ${r.error}` : r.count + " docs"}`);
  }
  console.log(`  Total: ${total} documents`);
}

main().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
