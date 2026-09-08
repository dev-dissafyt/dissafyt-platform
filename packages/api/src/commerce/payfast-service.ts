import crypto from 'crypto';
import { getSupabaseAdminClient, Payment } from '@dissafyt/database';

export interface PayfastNotifyPayload {
  m_payment_id?: string;
  pf_payment_id?: string;
  payment_status?: string;
  item_name?: string;
  item_description?: string;
  amount_gross?: string;
  amount_fee?: string;
  amount_net?: string;
  custom_str1?: string; // e.g. Dissafyt order_id
  custom_str2?: string; // e.g. user_id
  custom_str3?: string;
  email_address?: string;
  signature?: string;
  [key: string]: string | undefined;
}

export class PayfastService {
  private static get merchantId(): string {
    return process.env.PAYFAST_MERCHANT_ID || process.env.NEXT_PUBLIC_PAYFAST_MERCHANT_ID || '17675995';
  }

  private static get passphrase(): string {
    return process.env.PAYFAST_PASSPHRASE || 'Diss_fyt_Wat07081';
  }

  private static get host(): string {
    return process.env.PAYFAST_ENVIRONMENT || 'https://payment.payfast.io/eng/process';
  }

  /**
   * Generates MD5 signature for PayFast transactions.
   */
  static generateSignature(data: Record<string, string | number | undefined>, passphrase = this.passphrase): string {
    let pfOutput = '';
    for (const key of Object.keys(data)) {
      const val = data[key];
      if (val !== undefined && val !== null && String(val).trim() !== '' && key !== 'signature') {
        pfOutput += `${key.trim()}=${encodeURIComponent(String(val).trim()).replace(/%20/g, '+')}&`;
      }
    }

    let getString = pfOutput.slice(0, -1);
    if (passphrase) {
      getString += `&passphrase=${encodeURIComponent(passphrase.trim()).replace(/%20/g, '+')}`;
    }

    return crypto.createHash('md5').update(getString).digest('hex');
  }

  /**
   * Validates incoming PayFast ITN callback.
   */
  static validateSignature(payload: PayfastNotifyPayload, passphrase = this.passphrase): boolean {
    if (!payload.signature) return false;
    const calculatedSignature = this.generateSignature(payload, passphrase);
    return calculatedSignature.toLowerCase() === payload.signature.toLowerCase();
  }

  /**
   * Processes verified ITN webhook notification, updating payment and order records in PostgreSQL.
   */
  static async handleWebhook(payload: PayfastNotifyPayload): Promise<{ success: boolean; message: string; payment?: Payment }> {
    // 1. Verify signature
    const isValid = this.validateSignature(payload);
    if (!isValid) {
      return { success: false, message: 'Invalid PayFast signature' };
    }

    const admin = getSupabaseAdminClient();
    const orderId = payload.custom_str1 || payload.m_payment_id;
    const userId = payload.custom_str2;
    const paymentStatus = payload.payment_status?.toUpperCase();
    const amount = parseFloat(payload.amount_gross || '0');
    const isSubscription = Boolean(payload.token || payload.subscription_type);
    const relatedType = isSubscription ? 'subscription' : 'order';
    const relatedId = orderId || payload.token || payload.pf_payment_id || 'unassigned';

    if (!orderId && !isSubscription && !payload.pf_payment_id) {
      return { success: false, message: 'Missing transaction reference (m_payment_id, custom_str1, or token)' };
    }

    try {
      // 2. Insert or update record in payments table
      const isPaid = paymentStatus === 'COMPLETE';
      const status = isPaid ? 'paid' : paymentStatus === 'FAILED' ? 'failed' : 'pending';

      const { data: payment, error: payErr } = await admin
        .from('payments')
        .insert({
          user_id: userId || '00000000-0000-0000-0000-000000000000',
          provider: 'payfast',
          provider_reference: payload.pf_payment_id || null,
          amount,
          currency: 'ZAR',
          status,
          related_type: relatedType,
          related_id: relatedId,
        })
        .select()
        .single();

      if (payErr) {
        console.error('Failed to insert payment record:', payErr);
      }

      // 3. Update order state if COMPLETE
      if (isPaid) {
        await admin
          .from('orders')
          .update({
            status: 'paid',
            updated_at: new Date().toISOString(),
          })
          .eq('id', orderId);
      }

      return {
        success: true,
        message: `Payment processed as ${status}`,
        payment: payment as Payment,
      };
    } catch (err: any) {
      return { success: false, message: err.message };
    }
  }
}
