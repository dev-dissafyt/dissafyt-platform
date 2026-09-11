import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

export interface DecryptedFlowRequest<T = Record<string, any>> {
  decryptedBody: {
    version: string;
    action: 'ping' | 'INIT' | 'BACK' | 'data_exchange';
    screen?: string;
    data?: T;
    flow_token?: string;
  };
  aesKey: Buffer;
  initialVector: Buffer;
}

export class FlowCrypto {
  /**
   * Resolves the RSA Private Key from ENV or local key file.
   */
  static getPrivateKey(): string {
    const fromEnv = process.env.WHATSAPP_FLOW_PRIVATE_KEY || process.env.FLOW_PRIVATE_KEY;
    if (fromEnv) {
      let cleaned = fromEnv.trim();
      if (cleaned.startsWith('"') && cleaned.endsWith('"')) {
        cleaned = cleaned.slice(1, -1);
      }
      return cleaned.replace(/\\n/g, '\n');
    }

    // Try reading local key file if present
    try {
      const keyPath = path.join(__dirname, 'keys', 'flow_private_key.pem');
      if (fs.existsSync(keyPath)) {
        return fs.readFileSync(keyPath, 'utf8');
      }
    } catch {
      // Ignore in bundled production environments if fs is restricted
    }

    return '';
  }

  /**
   * Decrypts an incoming WhatsApp Flow request.
   */
  static decryptRequest(
    body: {
      encrypted_aes_key: string;
      encrypted_flow_data: string;
      initial_vector: string;
    },
    privateKeyPem?: string
  ): DecryptedFlowRequest {
    const key = privateKeyPem || this.getPrivateKey();
    if (!key) {
      throw new Error('Flow Private Key not configured. Set WHATSAPP_FLOW_PRIVATE_KEY in environment.');
    }

    const { encrypted_aes_key, encrypted_flow_data, initial_vector } = body;

    // 1. Decrypt 128-bit AES key using RSA-OAEP with SHA-256
    const decryptedAesKey = crypto.privateDecrypt(
      {
        key: crypto.createPrivateKey(key),
        padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
        oaepHash: 'sha256',
      },
      Buffer.from(encrypted_aes_key, 'base64')
    );

    // 2. Decrypt Flow Data using AES-128-GCM
    const flowDataBuffer = Buffer.from(encrypted_flow_data, 'base64');
    const initialVectorBuffer = Buffer.from(initial_vector, 'base64');

    const TAG_LENGTH = 16;
    const encrypted_flow_data_body = flowDataBuffer.subarray(0, -TAG_LENGTH);
    const encrypted_flow_data_tag = flowDataBuffer.subarray(-TAG_LENGTH);

    const decipher = crypto.createDecipheriv(
      'aes-128-gcm',
      decryptedAesKey,
      initialVectorBuffer
    );
    decipher.setAuthTag(encrypted_flow_data_tag);

    const decryptedJSONString = Buffer.concat([
      decipher.update(encrypted_flow_data_body),
      decipher.final(),
    ]).toString('utf-8');

    return {
      decryptedBody: JSON.parse(decryptedJSONString),
      aesKey: decryptedAesKey,
      initialVector: initialVectorBuffer,
    };
  }

  /**
   * Encrypts the response payload to return to WhatsApp client.
   */
  static encryptResponse(
    responsePayload: any,
    aesKey: Buffer,
    initialVector: Buffer
  ): string {
    // Invert all bits of the initialization vector (XOR each byte with 0xFF)
    const flippedIv = Buffer.alloc(initialVector.length);
    for (let i = 0; i < initialVector.length; i++) {
      flippedIv[i] = initialVector[i] ^ 0xFF;
    }

    const cipher = crypto.createCipheriv('aes-128-gcm', aesKey, flippedIv);
    return Buffer.concat([
      cipher.update(JSON.stringify(responsePayload), 'utf-8'),
      cipher.final(),
      cipher.getAuthTag(),
    ]).toString('base64');
  }

  /**
   * Validates Meta request signature (X-Hub-Signature-256) using App Secret.
   */
  static validateSignature(
    rawBody: string,
    signatureHeader: string | null,
    appSecret?: string
  ): boolean {
    const secret = appSecret || process.env.META_APP_SECRET || process.env.APP_SECRET;
    if (!signatureHeader || !secret) return true; // bypass if secret not configured

    const cleanSig = signatureHeader.replace(/^sha256=/, '');
    const computed = crypto.createHmac('sha256', secret).update(rawBody, 'utf8').digest('hex');
    try {
      return crypto.timingSafeEqual(Buffer.from(cleanSig, 'hex'), Buffer.from(computed, 'hex'));
    } catch {
      return false;
    }
  }
}
