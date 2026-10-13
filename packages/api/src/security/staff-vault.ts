import crypto from 'crypto';

const ENCRYPTION_PREFIX = 'enc:v1:';
const PIN_HASH_PREFIX = 'pin:v1:';
const DEFAULT_WORKING_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function deriveKey(rawSecret: string): Buffer {
  return crypto.scryptSync(rawSecret, 'dissafyt-staff-vault-salt-v1', 32);
}

function getCandidateVaultKeys(): Buffer[] {
  const candidates = [
    process.env.STAFF_VAULT_SECRET,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    process.env.PAYFAST_PASSPHRASE,
    'dissafyt-sovereign-staff-vault-key-2026',
  ].filter((s): s is string => Boolean(s && s.trim()));

  const unique = Array.from(new Set(candidates));
  return unique.map(deriveKey);
}

function getPrimaryVaultKey(): Buffer {
  return getCandidateVaultKeys()[0];
}

/**
 * Cryptographic vault for Barbers, Nail Technicians, and Beauticians.
 * Protects banking details, payout identifiers, station PINs, and studio client lists
 * using AES-256-GCM authenticated encryption, SHA-256 integrity hashing, salted scrypt PIN hashing,
 * and POPIA-compliant anti-poaching client PII masking.
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

    const key = getPrimaryVaultKey();
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
    const encrypted = Buffer.concat([cipher.update(clean, 'utf8'), cipher.final()]);
    const authTag = cipher.getAuthTag();

    return `${ENCRYPTION_PREFIX}${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted.toString('hex')}`;
  }

  /**
   * Decrypts an AES-256-GCM encrypted field using primary + fallback vault keys
   * so rotating keys never bricks previously encrypted specialist records.
   */
  static decryptField(stored?: string | null): string | null {
    if (!stored) return null;
    const clean = stored.trim();
    if (!clean) return null;
    if (!clean.startsWith(ENCRYPTION_PREFIX)) return clean;

    const payload = clean.slice(ENCRYPTION_PREFIX.length);
    const [ivHex, authTagHex, cipherHex] = payload.split(':');
    if (!ivHex || !authTagHex || !cipherHex) return null;

    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    const ciphertext = Buffer.from(cipherHex, 'hex');

    for (const key of getCandidateVaultKeys()) {
      try {
        const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
        decipher.setAuthTag(authTag);
        const decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
        return decrypted.toString('utf8');
      } catch {
        // Try next candidate key in rotation chain
      }
    }
    return null;
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

    const key = getPrimaryVaultKey();
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
   * Anti-poaching protection: masks a client's phone number for specialist views
   * (e.g., "+27 82 ••• 4567" or "082 ••• ••67") so specialists cannot export your client book.
   */
  static maskClientPhone(phone?: string | null): string | null {
    if (!phone) return null;
    const clean = phone.trim();
    if (clean.length <= 4) return '••••';
    const prefix = clean.slice(0, Math.min(4, Math.max(2, clean.length - 4)));
    const suffix = clean.slice(-2);
    return `${prefix} ••• ••${suffix}`;
  }

  /**
   * Anti-poaching protection: masks a client's email address for specialist views.
   */
  static maskClientEmail(email?: string | null): string | null {
    if (!email || !email.includes('@')) return null;
    const [local, domain] = email.trim().split('@');
    if (!local || !domain) return null;
    return `${local.charAt(0)}•••@${domain}`;
  }

  /**
   * Formats a client's name for specialist station views (First Name + Last Initial for past/completed sessions).
   */
  static formatClientNameForSpecialist(fullName?: string | null, isPastAppointment?: boolean): string {
    const raw = (fullName || 'Walk-in Client').trim();
    if (!isPastAppointment) return raw;
    const parts = raw.split(/\s+/);
    if (parts.length <= 1) return raw;
    const first = parts[0];
    const lastInitial = parts[parts.length - 1].charAt(0).toUpperCase();
    return `${first} ${lastInitial}.`;
  }

  /**
   * Masks customer contact information in a booking record for specialist station views
   * to enforce POPIA compliance and prevent client list poaching.
   */
  static maskCustomerContactForSpecialist<T extends Record<string, any>>(booking: T): T {
    const clone: any = { ...booking };
    if (clone.customer_phone) {
      clone.customer_phone = this.maskClientPhone(clone.customer_phone);
    }
    if (clone.client_phone) {
      clone.client_phone = this.maskClientPhone(clone.client_phone);
    }
    if (clone.customer_email) {
      clone.customer_email = this.maskClientEmail(clone.customer_email);
    }
    if (clone.client_email) {
      clone.client_email = this.maskClientEmail(clone.client_email);
    }
    if (clone.customer && typeof clone.customer === 'object') {
      clone.customer = {
        ...clone.customer,
        phone_number: this.maskClientPhone(clone.customer.phone_number),
        email: this.maskClientEmail(clone.customer.email),
      };
    }
    return clone;
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
      working_days: Array.isArray(staff.working_days) && staff.working_days.length > 0
        ? staff.working_days
        : DEFAULT_WORKING_DAYS,
      work_start_hour: typeof staff.work_start_hour === 'number' ? staff.work_start_hour : 9,
      work_end_hour: typeof staff.work_end_hour === 'number' ? staff.work_end_hour : 18,
      blocked_dates: Array.isArray(staff.blocked_dates) ? staff.blocked_dates : [],
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
      working_days: Array.isArray(staff.working_days) && staff.working_days.length > 0
        ? staff.working_days
        : DEFAULT_WORKING_DAYS,
      work_start_hour: typeof staff.work_start_hour === 'number' ? staff.work_start_hour : 9,
      work_end_hour: typeof staff.work_end_hour === 'number' ? staff.work_end_hour : 18,
      blocked_dates: Array.isArray(staff.blocked_dates) ? staff.blocked_dates : [],
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
