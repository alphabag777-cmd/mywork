/**
 * Script to import referral data from CSV file to Firebase
 * 
 * CSV Format (from screenshot):
 * - Column A: id
 * - Column B: user address (the person who joined)
 * - Column C: superior address (the referrer who referred them)
 * 
 * Usage:
 *   From scripts directory:
 *     cd scripts && npm run import-referrals <path-to-csv-file>
 *   
 *   Or directly with node:
 *     node scripts/import-referrals.js <path-to-csv-file>
 * 
 * Example:
 *   cd scripts && npm run import-referrals ../referrals.csv
 *   or
 *   node scripts/import-referrals.js referrals.csv
 */

import fs from 'fs';
import path from 'path';
import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, collection, doc, setDoc, query, where, getDocs, Timestamp } from 'firebase/firestore';

// Firebase configuration (from src/lib/firebase.ts)
// Use environment variables or replace these placeholders locally; do not commit real keys.
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY || "YOUR_FIREBASE_API_KEY",
  authDomain: process.env.FIREBASE_AUTH_DOMAIN || "your-project.firebaseapp.com",
  projectId: process.env.FIREBASE_PROJECT_ID || "your-project-id",
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET || "your-project.appspot.com",
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || "YOUR_MESSAGING_SENDER_ID",
  appId: process.env.FIREBASE_APP_ID || "YOUR_APP_ID",
};

// Initialize Firebase
function initializeFirebase() {
  let app;
  if (getApps().length === 0) {
    app = initializeApp(firebaseConfig);
  } else {
    app = getApps()[0];
  }
  return getFirestore(app);
}

/**
 * Generate a 6-digit referral code
 */
function generateReferralCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Validate Ethereum address
 */
function isValidAddress(address) {
  if (!address || typeof address !== 'string') return false;
  const trimmed = address.trim();
  return /^0x[a-fA-F0-9]{40}$/.test(trimmed);
}

/**
 * Normalize address to lowercase
 */
function normalizeAddress(address) {
  return address.trim().toLowerCase();
}

/**
 * Parse CSV file
 * Handles CSV with columns: id, user address, superior address
 */
function parseCSV(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n').filter(line => line.trim());
    
    if (lines.length < 2) {
      throw new Error('CSV file must have at least a header row and one data row');
    }

    // Parse header
    const headerLine = lines[0];
    const headers = headerLine.split(',').map(h => h.trim().toLowerCase());
    
    // Find column indices
    const idIndex = headers.findIndex(h => h === 'id' || h === 'id');
    const userAddressIndex = headers.findIndex(h => 
      h.includes('user') && h.includes('address')
    );
    const superiorAddressIndex = headers.findIndex(h => 
      h.includes('superior') && h.includes('address')
    );

    if (userAddressIndex === -1) {
      throw new Error('Could not find "user address" column in CSV');
    }
    if (superiorAddressIndex === -1) {
      throw new Error('Could not find "superior address" column in CSV');
    }

    // Parse data rows
    const rows = [];
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      // Split by comma, handling quoted values
      const values = [];
      let current = '';
      let inQuotes = false;
      
      for (let j = 0; j < line.length; j++) {
        const char = line[j];
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          values.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      values.push(current.trim());

      const id = idIndex >= 0 ? values[idIndex]?.trim() : '';
      const userAddress = values[userAddressIndex]?.trim() || '';
      const superiorAddress = values[superiorAddressIndex]?.trim() || '';

      if (userAddress && superiorAddress) {
        rows.push({
          id: id || `row_${i}`,
          userAddress,
          superiorAddress
        });
      }
    }

    return rows;
  } catch (error) {
    console.error('Error parsing CSV:', error.message);
    throw error;
  }
}

/**
 * Check if referral already exists
 */
async function referralExists(db, referrerWallet, referredWallet) {
  try {
    const referralsRef = collection(db, 'referrals');
    const q = query(
      referralsRef,
      where('referrerWallet', '==', referrerWallet.toLowerCase()),
      where('referredWallet', '==', referredWallet.toLowerCase())
    );
    const snapshot = await getDocs(q);
    return !snapshot.empty;
  } catch (error) {
    console.error('Error checking referral existence:', error);
    return false;
  }
}

/**
 * Save referral to Firestore
 */
async function saveReferral(db, referrerWallet, referredWallet, referrerCode) {
  try {
    const normalizedReferrer = normalizeAddress(referrerWallet);
    const normalizedReferred = normalizeAddress(referredWallet);

    // Check if already exists
    const exists = await referralExists(db, normalizedReferrer, normalizedReferred);
    if (exists) {
      return { success: false, message: 'Already exists' };
    }

    // Create referral ID
    const referralId = `${normalizedReferrer}_${normalizedReferred}_${Date.now()}`;
    
    // Create referral document
    const referralData = {
      referrerWallet: normalizedReferrer,
      referredWallet: normalizedReferred,
      referrerCode: referrerCode,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };

    const referralRef = doc(collection(db, 'referrals'), referralId);
    await setDoc(referralRef, referralData);

    return { success: true, referralId };
  } catch (error) {
    console.error('Error saving referral:', error);
    return { success: false, message: error.message };
  }
}

/**
 * Main import function
 */
async function importReferrals(csvFilePath) {
  console.log('🚀 Starting referral import...\n');
  console.log(`📁 Reading CSV file: ${csvFilePath}\n`);

  // Parse CSV
  let rows;
  try {
    rows = parseCSV(csvFilePath);
    console.log(`📊 Found ${rows.length} rows in CSV\n`);
  } catch (error) {
    console.error(`❌ Error reading CSV: ${error.message}\n`);
    process.exit(1);
  }

  if (rows.length === 0) {
    console.log('⚠️  No data found in CSV file');
    return;
  }

  // Initialize Firebase
  console.log('🔥 Initializing Firebase...');
  const db = initializeFirebase();
  console.log('✅ Firebase initialized\n');

  // Statistics
  let successCount = 0;
  let skipCount = 0;
  let errorCount = 0;
  const errors = [];

  // Process each row
  console.log('📝 Processing referrals...\n');
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const rowNum = i + 2; // +2 for header and 0-index

    try {
      const { userAddress, superiorAddress, id } = row;

      // Validate addresses
      if (!isValidAddress(userAddress)) {
        const error = `Invalid user address: ${userAddress}`;
        console.log(`  ❌ Row ${rowNum} (ID: ${id}): ${error}`);
        errors.push({ row: rowNum, id, error });
        errorCount++;
        continue;
      }

      if (!isValidAddress(superiorAddress)) {
        const error = `Invalid superior address: ${superiorAddress}`;
        console.log(`  ❌ Row ${rowNum} (ID: ${id}): ${error}`);
        errors.push({ row: rowNum, id, error });
        errorCount++;
        continue;
      }

      // Check addresses are different
      if (normalizeAddress(userAddress) === normalizeAddress(superiorAddress)) {
        const error = `User and superior addresses are the same`;
        console.log(`  ❌ Row ${rowNum} (ID: ${id}): ${error}`);
        errors.push({ row: rowNum, id, error });
        errorCount++;
        continue;
      }

      // Generate referral code
      const referrerCode = generateReferralCode();

      // Save referral
      // superiorAddress = referrer (the one who referred)
      // userAddress = referred (the one who joined)
      console.log(`  📝 Row ${rowNum} (ID: ${id}): Processing...`);
      const result = await saveReferral(
        db,
        superiorAddress,  // referrerWallet
        userAddress,      // referredWallet
        referrerCode
      );

      if (result.success) {
        successCount++;
        console.log(`  ✅ Row ${rowNum} (ID: ${id}): Saved successfully (Code: ${referrerCode})`);
      } else {
        if (result.message === 'Already exists') {
          skipCount++;
          console.log(`  ⚠️  Row ${rowNum} (ID: ${id}): Already exists, skipped`);
        } else {
          errorCount++;
          errors.push({ row: rowNum, id, error: result.message });
          console.log(`  ❌ Row ${rowNum} (ID: ${id}): ${result.message}`);
        }
      }

      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 200));
    } catch (error) {
      const errorMsg = error.message || 'Unknown error';
      console.log(`  ❌ Row ${rowNum} (ID: ${row.id}): ${errorMsg}`);
      errors.push({ row: rowNum, id: row.id, error: errorMsg });
      errorCount++;
    }
  }

  // Print summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 Import Summary');
  console.log('='.repeat(60));
  console.log(`✅ Successfully imported: ${successCount}`);
  console.log(`⚠️  Skipped (already exists): ${skipCount}`);
  console.log(`❌ Errors: ${errorCount}`);
  console.log(`📝 Total processed: ${rows.length}`);
  console.log('='.repeat(60) + '\n');

  if (errors.length > 0) {
    console.log('❌ Errors encountered:');
    errors.forEach(({ row, id, error }) => {
      console.log(`  Row ${row} (ID: ${id}): ${error}`);
    });
    console.log('');
  }

  if (successCount > 0) {
    console.log('✅ Import completed successfully!');
  }
}

// Get CSV file path from command line
const csvFilePath = process.argv[2];

if (!csvFilePath) {
  console.error('❌ Error: Please provide a CSV file path\n');
  console.error('Usage:');
  console.error('  From scripts directory:');
  console.error('    cd scripts && npm run import-referrals <path-to-csv-file>\n');
  console.error('  Or directly with node:');
  console.error('    node scripts/import-referrals.js <path-to-csv-file>\n');
  console.error('Example:');
  console.error('  cd scripts && npm run import-referrals ../referrals.csv');
  console.error('  or');
  console.error('  node scripts/import-referrals.js referrals.csv\n');
  console.error('CSV Format:');
  console.error('  id,user address,superior address');
  console.error('  1,0x123...,0x456...');
  process.exit(1);
}

if (!fs.existsSync(csvFilePath)) {
  console.error(`❌ Error: CSV file not found: ${csvFilePath}`);
  process.exit(1);
}

// Run import
importReferrals(csvFilePath)
  .then(() => {
    console.log('✨ Script completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  });

