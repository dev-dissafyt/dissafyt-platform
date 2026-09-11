#!/usr/bin/env node
/**
 * Script to upload Dissafyt WhatsApp Flow Public Key to Meta Graph API.
 * Usage:
 *   node scripts/upload-flow-public-key.js <PHONE_NUMBER_ID> <ACCESS_TOKEN>
 */

const fs = require('fs');
const path = require('path');

const phoneId = process.argv[2] || process.env.WHATSAPP_PHONE_NUMBER_ID;
const accessToken = process.argv[3] || process.env.WHATSAPP_ACCESS_TOKEN;

if (!phoneId || !accessToken) {
  console.error('\n❌ Usage:');
  console.error('   node scripts/upload-flow-public-key.js <PHONE_NUMBER_ID> <ACCESS_TOKEN>\n');
  console.error('Example:');
  console.error('   node scripts/upload-flow-public-key.js 105234857283921 EAAI...\n');
  process.exit(1);
}

// 1. Read the generated public key
const keyPath = path.join(__dirname, '..', 'packages', 'api', 'src', 'whatsapp', 'keys', 'flow_public_key.pem');
if (!fs.existsSync(keyPath)) {
  console.error('❌ Public key file not found at:', keyPath);
  process.exit(1);
}

const publicKey = fs.readFileSync(keyPath, 'utf8').trim();
console.log('🔑 Loaded Public Key:');
console.log(publicKey);
console.log('\n🚀 Uploading to Meta Graph API for Phone Number ID:', phoneId);

const url = `https://graph.facebook.com/v20.0/${phoneId}/whatsapp_business_encryption`;

const params = new URLSearchParams();
params.append('business_public_key', publicKey);

fetch(url, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${accessToken}`,
    'Content-Type': 'application/x-www-form-urlencoded',
  },
  body: params.toString(),
})
  .then(async (res) => {
    const json = await res.json();
    if (res.ok && json.success) {
      console.log('\n✅ SUCCESS! Meta has registered and signed your Public Key.');
      console.log('Response:', JSON.stringify(json, null, 2));
      console.log('\nNext steps:');
      console.log('1. Go back to Meta WhatsApp Manager -> Flows');
      console.log('2. Set Endpoint URL to: https://dissafyt.com/api/whatsapp/flow-endpoint');
      console.log('3. Run the Health Check Validator - it will pass with status ACTIVE!');
    } else {
      console.error('\n❌ Meta API Error (Status ' + res.status + '):');
      console.error(JSON.stringify(json, null, 2));
      if (json.error?.message?.includes('expired')) {
        console.error('\n⚠️ Your Access Token is expired. Generate a fresh one in Meta Developer Dashboard -> WhatsApp -> API Setup.');
      }
    }
  })
  .catch((err) => {
    console.error('\n❌ Request failed:', err.message);
  });
