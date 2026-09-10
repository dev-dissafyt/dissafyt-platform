import crypto from 'crypto';
import { getSupabaseAdminClient, Payment } from '@dissafyt/database';
import { OrderService, GUEST_USER_ID } from './order-service';

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
    // 1. Strictly verify signature with configured secret passphrase (no empty-passphrase bypass)
    const isValid = this.validateSignature(payload, this.passphrase);

    if (!isValid) {
      console.warn('PayFast ITN signature mismatch for payload:', payload);
      return { success: false, message: 'Invalid PayFast signature' };
    }

    const admin = getSupabaseAdminClient();
    const orderId = payload.custom_str1 || payload.m_payment_id;
    let userId = payload.custom_str2;
    const paymentStatus = payload.payment_status?.toUpperCase();
    const amount = parseFloat(payload.amount_gross || '0');
    const isSubscription = Boolean(payload.token || payload.subscription_type);
    const relatedType = isSubscription ? 'subscription' : 'order';

    // If userId not provided in custom_str2, lookup profile by email_address or fallback to official guest
    if ((!userId || userId === '00000000-0000-0000-0000-000000000000' || userId === 'guest-user') && payload.email_address) {
      try {
        const { data: profile } = await admin
          .from('profiles')
          .select('id')
          .eq('email', payload.email_address)
          .limit(1)
          .maybeSingle();

        if (profile?.id) {
          userId = profile.id;
        }
      } catch (err) {
        console.error('Failed to resolve profile from email:', err);
      }
    }

    if (!userId || userId === '00000000-0000-0000-0000-000000000000' || userId === 'guest-user') {
      userId = GUEST_USER_ID;
    }

    const isUuid = (val?: string): boolean =>
      Boolean(val && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val));

    const validRelatedId = isUuid(orderId)
      ? orderId!
      : isUuid(userId)
      ? userId!
      : GUEST_USER_ID;

    const validUserId = isUuid(userId) ? userId! : GUEST_USER_ID;

    try {
      // 2. Idempotent insert or update in payments table
      const isPaid = paymentStatus === 'COMPLETE';
      const status = isPaid ? 'paid' : paymentStatus === 'FAILED' ? 'failed' : 'pending';
      let paymentRecord: any = null;

      if (payload.pf_payment_id) {
        const { data: existingPay } = await admin
          .from('payments')
          .select('*')
          .eq('provider', 'payfast')
          .eq('provider_reference', payload.pf_payment_id)
          .maybeSingle();

        if (existingPay) {
          const { data: updPay } = await admin
            .from('payments')
            .update({
              status,
              amount: amount || existingPay.amount,
              updated_at: new Date().toISOString(),
            })
            .eq('id', existingPay.id)
            .select()
            .single();
          paymentRecord = updPay || existingPay;
        }
      }

      if (!paymentRecord) {
        const { data: newPay, error: payErr } = await admin
          .from('payments')
          .insert({
            user_id: validUserId,
            provider: 'payfast',
            provider_reference: payload.pf_payment_id || null,
            amount,
            currency: 'ZAR',
            status,
            related_type: relatedType,
            related_id: validRelatedId,
            is_test: false,
          })
          .select()
          .single();

        if (payErr) {
          console.error('Failed to insert payment record:', payErr);
        }
        paymentRecord = newPay;
      }

      // 3. Update order or subscription state authoritatively if COMPLETE
      if (isPaid) {
        if (orderId && !isSubscription) {
          const confirmResult = await OrderService.confirmOrderPayment(orderId, amount, payload.pf_payment_id);
          if (!confirmResult.success) {
            console.warn(`Order payment confirmation failed for ${orderId}:`, confirmResult.error);
          }
        }

        // 4. Activate or renew barbershop subscription if subscription payment
        if (isSubscription && userId && userId !== GUEST_USER_ID) {
          const planCode = payload.custom_str1 || 'twice';
          const planNames: Record<string, string> = {
            solo: 'The Solo Membership',
            twice: 'The Regular Membership',
            executive: 'The Executive Membership',
            'father-son': 'The Executive Membership',
          };
          const planName = planNames[planCode] || payload.item_name || 'Barbershop Membership';

          const startDate = new Date();
          const endDate = new Date(startDate.getTime() + 30 * 24 * 60 * 60 * 1000);

          try {
            // Check for existing active subscription to update rather than creating duplicates
            const { data: existingSub } = await admin
              .from('subscriptions')
              .select('id')
              .eq('user_id', userId)
              .maybeSingle();

            if (existingSub) {
              await admin
                .from('subscriptions')
                .update({
                  plan_code: planCode,
                  plan_name: planName,
                  price: amount,
                  status: 'active',
                  current_period_start: startDate.toISOString(),
                  current_period_end: endDate.toISOString(),
                  payfast_token: payload.token || payload.pf_payment_id || null,
                  updated_at: new Date().toISOString(),
                })
                .eq('id', existingSub.id);
            } else {
              await admin.from('subscriptions').insert({
                user_id: userId,
                plan_code: planCode,
                plan_name: planName,
                price: amount,
                status: 'active',
                current_period_start: startDate.toISOString(),
                current_period_end: endDate.toISOString(),
                payfast_token: payload.token || payload.pf_payment_id || null,
              });
            }
          } catch (subErr) {
            console.error('Failed to create/update subscription in table:', subErr);
          }
        }
      } else if (paymentStatus === 'FAILED') {
        if (orderId && !isSubscription) {
          await admin
            .from('orders')
            .update({
              status: 'failed',
              updated_at: new Date().toISOString(),
            })
            .eq('id', orderId);
        }
      }

      return {
        success: true,
        message: `Payment processed as ${status}`,
        payment: paymentRecord as Payment,
      };
    } catch (err: any) {
      return { success: false, message: err.message };
    }
  }
}
