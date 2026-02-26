#!/usr/bin/env node
/**
 * fix-walletconnect.js
 * Removes ALL nested (outdated) @walletconnect packages from every
 * sub-node_modules directory after `npm install`.
 *
 * Root cause:
 *   npm overrides do NOT always deduplicate packages that have their own
 *   nested node_modules. Packages like @wagmi/connectors, @walletconnect/
 *   ethereum-provider and @walletconnect/sign-client ship with their own
 *   node_modules containing older @walletconnect/* versions that lack
 *   exports such as TRANSPORT_TYPES, isTypeTwoEnvelope, getBundleId, etc.
 *
 * This script:
 *   1. Walks every nested node_modules/@walletconnect folder one level deep.
 *   2. Compares the installed version against the REQUIRED_VERSION constant.
 *   3. Removes the folder if it is outdated, so the root-level 2.18.1 version
 *      is used instead (hoisted by Node.js module resolution).
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const NM = path.join(ROOT, 'node_modules');
const REQUIRED_VERSION = '2.18.1';

// Packages known to ship nested @walletconnect sub-trees
const SUSPECT_PACKAGES = [
  '@wagmi/connectors',
  '@walletconnect/ethereum-provider',
  '@walletconnect/sign-client',
  '@walletconnect/universal-provider',
  '@web3modal/base',
  '@web3modal/wagmi',
];

function getVersion(pkgJsonPath) {
  try {
    const data = JSON.parse(fs.readFileSync(pkgJsonPath, 'utf8'));
    return data.version || null;
  } catch {
    return null;
  }
}

function isOlderVersion(ver, required) {
  if (!ver) return false;
  const parse = (v) => v.split('.').map(Number);
  const [ma, mi, pa] = parse(ver);
  const [rma, rmi, rpa] = parse(required);
  if (ma !== rma) return ma < rma;
  if (mi !== rmi) return mi < rmi;
  return pa < rpa;
}

function removeDir(dirPath) {
  if (fs.existsSync(dirPath)) {
    fs.rmSync(dirPath, { recursive: true, force: true });
    console.log(`[fix-wc] Removed nested: ${dirPath.replace(ROOT + '/', '')}`);
    return true;
  }
  return false;
}

let removedCount = 0;

// Strategy 1: remove entire @walletconnect folder inside known suspect packages
for (const pkg of SUSPECT_PACKAGES) {
  const wcNested = path.join(NM, pkg, 'node_modules', '@walletconnect');
  if (removeDir(wcNested)) removedCount++;
}

// Strategy 2: scan ALL packages' node_modules for individual outdated @walletconnect/* packages
function scanForNestedWC(startDir) {
  let entries;
  try {
    entries = fs.readdirSync(startDir);
  } catch {
    return;
  }

  for (const entry of entries) {
    const pkgNM = path.join(startDir, entry, 'node_modules', '@walletconnect');
    if (!fs.existsSync(pkgNM)) continue;

    // Check each sub-package
    let subEntries;
    try {
      subEntries = fs.readdirSync(pkgNM);
    } catch {
      continue;
    }

    for (const sub of subEntries) {
      const subPkgJson = path.join(pkgNM, sub, 'package.json');
      const ver = getVersion(subPkgJson);
      if (ver && isOlderVersion(ver, REQUIRED_VERSION)) {
        const subDir = path.join(pkgNM, sub);
        if (removeDir(subDir)) removedCount++;
      }
    }

    // If the @walletconnect folder is now empty, remove it too
    try {
      const remaining = fs.readdirSync(pkgNM);
      if (remaining.length === 0) {
        removeDir(pkgNM);
      }
    } catch {
      // ignore
    }
  }
}

// Scan top-level node_modules
scanForNestedWC(NM);

// Scan scoped packages (@wagmi, @walletconnect, @web3modal)
const scoped = ['@wagmi', '@walletconnect', '@web3modal'];
for (const scope of scoped) {
  const scopeDir = path.join(NM, scope);
  scanForNestedWC(scopeDir);
}

if (removedCount === 0) {
  console.log('[fix-wc] No outdated nested @walletconnect packages found. ✅');
} else {
  console.log(`[fix-wc] Removed ${removedCount} nested @walletconnect director${removedCount === 1 ? 'y' : 'ies'}. ✅`);
}
