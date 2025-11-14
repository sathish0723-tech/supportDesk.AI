#!/usr/bin/env node

/**
 * Script to verify Clerk keys are correctly set
 * Run: node verify-clerk-keys.js
 */

const fs = require('fs');
const path = require('path');

// Read .env.local file
const envPath = path.join(__dirname, '.env.local');
let envContent = '';

try {
  envContent = fs.readFileSync(envPath, 'utf8');
} catch (error) {
  console.error('❌ Could not read .env.local file');
  process.exit(1);
}

// Parse environment variables
const envVars = {};
envContent.split('\n').forEach(line => {
  const trimmed = line.trim();
  if (trimmed && !trimmed.startsWith('#')) {
    const [key, ...valueParts] = trimmed.split('=');
    if (key && valueParts.length > 0) {
      envVars[key.trim()] = valueParts.join('=').trim();
    }
  }
});

const publishableKey = envVars.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
const secretKey = envVars.CLERK_SECRET_KEY;

console.log('\n🔍 Clerk Keys Verification\n');
console.log('=' .repeat(50));

// Check if keys exist
if (!publishableKey) {
  console.error('❌ NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY is not set');
  process.exit(1);
}

if (!secretKey) {
  console.error('❌ CLERK_SECRET_KEY is not set');
  process.exit(1);
}

// Check key formats
const pkPattern = /^pk_(test|live)_/;
const skPattern = /^sk_(test|live)_/;

if (!pkPattern.test(publishableKey)) {
  console.error('❌ Publishable Key format is invalid. Should start with pk_test_ or pk_live_');
  process.exit(1);
}

if (!skPattern.test(secretKey)) {
  console.error('❌ Secret Key format is invalid. Should start with sk_test_ or sk_live_');
  process.exit(1);
}

// Check if keys are from same environment
const pkEnv = publishableKey.match(/^pk_(test|live)_/)[1];
const skEnv = secretKey.match(/^sk_(test|live)_/)[1];

if (pkEnv !== skEnv) {
  console.error(`❌ Environment mismatch! Publishable key is ${pkEnv}, Secret key is ${skEnv}`);
  console.error('   Both keys must be from the same environment (test or live)');
  process.exit(1);
}

// Display keys (partially masked)
const maskedPk = publishableKey.substring(0, 20) + '...' + publishableKey.substring(publishableKey.length - 10);
const maskedSk = secretKey.substring(0, 20) + '...' + secretKey.substring(secretKey.length - 10);

console.log('✅ Publishable Key:', maskedPk);
console.log('✅ Secret Key:', maskedSk);
console.log('✅ Environment:', pkEnv);
console.log('\n' + '='.repeat(50));
console.log('\n⚠️  IMPORTANT: This script only verifies format and environment match.');
console.log('   It CANNOT verify if the keys are a matching pair from Clerk.');
console.log('\n📋 Next Steps:');
console.log('   1. Go to https://dashboard.clerk.com/last-active?path=api-keys');
console.log('   2. Verify both keys are from the SAME Clerk application');
console.log('   3. If they don\'t match, copy the correct matching pair');
console.log('   4. Update .env.local with the matching keys');
console.log('   5. Restart your dev server completely (Ctrl+C, then npm run dev)\n');

