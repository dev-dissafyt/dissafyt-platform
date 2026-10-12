import crypto from 'crypto';

const ENCRYPTION_PREFIX = 'enc:v1:';
const PIN_HASH_PREFIX = 'pin:v1:';

function getVaultKey(): Buffer {
  const rawSecret =
    process.env.STAFF_VAULT_SECRET ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.PAYFAST_PASSPHRASE ||
    'dissafyt-sovereign-staff-vault-key-2026';
  return crypto.scryptSync(rawSecret, 'dissafyt-staff-vault-salt-v1', 32);
}

/**
 * Cryptographic vault for Barbers, Nail Technicians, and Beauticians.
 * Protects banking details, payout identifiers, and station PINs using
 * AES-256-GCM authenticated encryption, SHA-256 integrity hashing, and salted scrypt PIN hashing.
 */
export class StaffVaultService {
  /**
   * Encrypts a sensitive string (e.g., bank account number, branch code, PayFast ID)
   * using AES-256-GCM if not already encrypted.
   */
  static encryptField(plaintext?: string | null): string | null {
    if (!plaintext) return null;
    const clean = plaintext.trim();
    if (!clean) return null;
    if (clean.startsWith(ENCRYPTION_PREFIX)) return clean;

    const key = getVaultKey();
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
    const encrypted = Buffer.concat([cipher.update(clean, 'utf8'), cipher.final()]);
    const authTag = cipher.getAuthTag();

    return `${ENCRYPTION_PREFIX}${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted.toString('hex')}`;
  }

  /**
   * Decrypts an AES-256-GCM encrypted field, or returns the original value if stored before encryption.
   */
  static decryptField(stored?: string | null): string | null {
    if (!stored) return null;
    const clean = stored.trim();
    if (!clean) return null;
    if (!clean.startsWith(ENCRYPTION_PREFIX)) return clean;

    try {
      const payload = clean.slice(ENCRYPTION_PREFIX.length);
      const [ivHex, authTagHex, cipherHex] = payload.split(':');
      if (!ivHex || !authTagHex || !cipherHex) return null;

      const key = getVaultKey();
      const decipher = crypto.createDecipheriv(
        'aes-256-gcm',
        key,
        Buffer.from(ivHex, 'hex')
      );
      decipher.setAuthTag(Buffer.from(authTagHex, 'hex'));
      const decrypted = Buffer.concat([
        decipher.update(Buffer.from(cipherHex, 'hex')),
        decipher.final(),
      ]);
      return decrypted.toString('utf8');
    } catch {
      return null;
    }
  }

  /**
   * Generates a deterministic HMAC-SHA256 fingerprint of a specialist's bank account number
   * for audit verification without exposing the raw account number.
   */
  static hashBankAccount(accountNumber?: string | null): string | null {
    if (!accountNumber) return null;
    const decrypted = this.decryptField(accountNumber) || accountNumber;
    const digitsOnly = decrypted.replace(/\s+/g, '');
    if (!digitsOnly || digitsOnly.includes('•') || digitsOnly.includes('*')) return null;

    const key = getVaultKey();
    return crypto
      .createHmac('sha256', key)
      .update(`bank_acct:${digitsOnly}`)
      .digest('hex')
      .slice(0, 16);
  }

  /**
   * Masks a bank account number to only reveal the last 4 digits (e.g., ••••4821).
   */
  static maskBankAccount(accountNumber?: string | null): string | null {
    const plain = this.decryptField(accountNumber);
    if (!plain) return null;
    const clean = plain.trim();
    if (!clean) return null;
    if (clean.length <= 4) return `••••${clean}`;
    return `••••${clean.slice(-4)}`;
  }

  /**
   * Checks whether a user-submitted value is a masked placeholder (e.g., ••••1234)
   * so we don't overwrite the encrypted value in the database with bullets.
   */
  static isMaskedValue(val?: string | null): boolean {
    if (!val) return false;
    return val.includes('•') || /^\*+\d{0,4}$/.test(val.trim());
  }

  /**
   * Hashes a 4-8 digit specialist Station PIN using salted scrypt.
   */
  static hashStationPin(pin: string): string {
    const clean = pin.trim();
    const salt = crypto.randomBytes(16).toString('hex');
    const derived = crypto.scryptSync(clean, salt, 32).toString('hex');
    return `${PIN_HASH_PREFIX}${salt}:${derived}`;
  }

  /**
   * Verifies a candidate Station PIN against a stored scrypt hash using constant-time comparison.
   */
  static verifyStationPin(candidatePin?: string | null, storedHash?: string | null): boolean {
    if (!storedHash) return true;
    if (!candidatePin) return false;
    if (!storedHash.startsWith(PIN_HASH_PREFIX)) return false;

    try {
      const payload = storedHash.slice(PIN_HASH_PREFIX.length);
      const [salt, keyHex] = payload.split(':');
      if (!salt || !keyHex) return false;

      const candidateBuf = crypto.scryptSync(candidatePin.trim(), salt, 32);
      const targetBuf = Buffer.from(keyHex, 'hex');
      if (candidateBuf.length !== targetBuf.length) return false;
      return crypto.timingSafeEqual(candidateBuf, targetBuf);
    } catch {
      return false;
    }
  }

  /**
   * Strips all sensitive financial, banking, commission, phone, and POS terminal fields
   * before returning a specialist record to public storefront booking endpoints.
   */
  static sanitizePublicStaff<T extends Record<string, any>>(staff: T): Partial<T> {
    return {
      id: staff.id,
      display_name: staff.display_name,
      specialty: staff.specialty || 'barber',
      bio: staff.bio || '',
      avatar_url: staff.avatar_url || null,
      working_hours: staff.working_hours || null,
      location_id: staff.location_id || 'loc-cpt-flagship',
      location: staff.location || null,
      is_active: Boolean(staff.is_active),
      created_at: staff.created_at,
    } as unknown as Partial<T>;
  }

  /**
   * Prepares a specialist record for authenticated admin or specialist station view:
   * decrypts and masks the bank account number, attaches the SHA-256 integrity hash,
   * and strips raw password/PIN hashes.
   */
  static formatStaffForAuthorizedView<T extends Record<string, any>>(staff: T): T & {
    bank_account_masked?: string | null;
    has_station_pin?: boolean;
  } {
    const maskedAccount = this.maskBankAccount(staff.bank_account_number);
    const decryptedBranch = this.decryptField(staff.bank_branch_code);
    const decryptedPayfast = this.decryptField(staff.payfast_merchant_id);
    const accountHash =
      staff.bank_account_hash || this.hashBankAccount(staff.bank_account_number) || null;
    const hasPin = Boolean(staff.station_pin_hash);

    const clone: any = {
      ...staff,
      specialty: staff.specialty || 'barber',
      bank_account_number: maskedAccount,
      bank_account_masked: maskedAccount,
      bank_branch_code: decryptedBranch,
      payfast_merchant_id: decryptedPayfast,
      bank_account_hash: accountHash,
      has_station_pin: hasPin,
    };
    delete clone.station_pin_hash;
    return clone;
  }
}
