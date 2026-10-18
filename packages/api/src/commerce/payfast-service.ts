import crypto from 'crypto';
import { getSupabaseAdminClient, Payment } from '@dissafyt/database';
import { OrderService, GUEST_USER_ID } from './order-service';
import { AuditService } from '../audit/audit-service';

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

export const PAYFAST_CANONICAL_ORDER = [
  // Merchant details
  'merchant_id',
  'merchant_key',
  'return_url',
  'cancel_url',
  'notify_url',
  'fica_idnumber',

  // Customer details
  'name_first',
  'name_last',
  'email_address',
  'cell_number',

  // Transaction details
  'm_payment_id',
  'amount',
  'item_name',
  'item_description',
  'custom_int1',
  'custom_int2',
  'custom_int3',
  'custom_int4',
  'custom_int5',
  'custom_str1',
  'custom_str2',
  'custom_str3',
  'custom_str4',
  'custom_str5',

  // Transaction options
  'email_confirmation',
  'confirmation_address',

  // Payment methods
  'payment_method',

  // Recurring billing / Subscriptions
  'subscription_type',
  'billing_date',
  'recurring_amount',
  'frequency',
  'cycles',
  'subscription_notify_email',

  // Tokenization
  'token',
  'return',
] as const;

/**
 * PHP urlencode implementation (RFC 1738 compliant).
 * Matches PHP urlencode() used by PayFast servers:
 * spaces encoded as '+', and characters ! ' ( ) * ~ encoded.
 */
export function phpUrlEncode(str: string): string {
  return encodeURIComponent(str)
    .replace(/%20/g, '+')
    .replace(/!/g, '%21')
    .replace(/'/g, '%27')
    .replace(/\(/g, '%28')
    .replace(/\)/g, '%29')
    .replace(/\*/g, '%2A')
    .replace(/~/g, '%7E');
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
   * Sorts and sanitizes PayFast transaction attributes into the strict canonical
   * sequence required by the PayFast payment processor.
   */
  static formatPaymentPayload(data: Record<string, string | number | undefined>): Record<string, string> {
    const clean: Record<string, string> = {};
    for (const [key, val] of Object.entries(data)) {
      if (val !== undefined && val !== null && String(val).trim() !== '' && key !== 'signature') {
        clean[key.trim()] = String(val).trim();
      }
    }

    const sortedKeys = Object.keys(clean).sort((a, b) => {
      const idxA = (PAYFAST_CANONICAL_ORDER as readonly string[]).indexOf(a);
      const idxB = (PAYFAST_CANONICAL_ORDER as readonly string[]).indexOf(b);
      if (idxA !== -1 && idxB !== -1) return idxA - idxB;
      if (idxA !== -1) return -1;
      if (idxB !== -1) return 1;
      return a.localeCompare(b);
    });

    const ordered: Record<string, string> = {};
    for (const k of sortedKeys) {
      ordered[k] = clean[k];
    }
    return ordered;
  }

  /**
   * Generates MD5 signature for PayFast transactions.
   * If sortCanonical is true (default), keys are ordered strictly according to PayFast's official sequence.
   */
  static generateSignature(
    data: Record<string, string | number | undefined>,
    passphrase = this.passphrase,
    sortCanonical = true
  ): string {
    const fields = sortCanonical ? this.formatPaymentPayload(data) : data;
    let pfOutput = '';
    for (const key of Object.keys(fields)) {
      const val = fields[key];
      if (val !== undefined && val !== null && String(val).trim() !== '' && key !== 'signature') {
        pfOutput += `${key.trim()}=${phpUrlEncode(String(val).trim())}&`;
      }
    }

    let getString = pfOutput.slice(0, -1);
    if (passphrase && passphrase.trim() !== '') {
      getString += `&passphrase=${phpUrlEncode(passphrase.trim())}`;
    }

    return crypto.createHash('md5').update(getString).digest('hex');
  }

  /**
   * Generates a fully formatted, canonically ordered PayFast transaction payload
   * ready for form submission with matching MD5 signature.
   */
  static createTransactionPayload(
    data: Record<string, string | number | undefined>,
    passphrase = this.passphrase
  ): { action: string; fields: Record<string, string> } {
    const orderedFields = this.formatPaymentPayload(data);
    const signature = this.generateSignature(orderedFields, passphrase, false);
    return {
      action: this.host,
      fields: {
        ...orderedFields,
        signature,
      },
    };
  }

  /**
   * Validates incoming PayFast ITN callback.
   * Checks received parameter order (per PayFast ITN specification) with fallback to canonical.
   */
  static validateSignature(payload: PayfastNotifyPayload, passphrase = this.passphrase): boolean {
    if (!payload.signature) return false;
    const targetSig = payload.signature.toLowerCase();

    // 1. Check in received order with configured passphrase
    const sigReceivedWithPass = this.generateSignature(payload, passphrase, false);
    if (sigReceivedWithPass.toLowerCase() === targetSig) return true;

    // 2. Check in canonical order with configured passphrase
    const sigCanonicalWithPass = this.generateSignature(payload, passphrase, true);
    if (sigCanonicalWithPass.toLowerCase() === targetSig) return true;

    return false;
  }

  /**
   * Performs a server-to-server query validation against PayFast's /eng/query/validate endpoint.
   * Serves as an authoritative verification fallback if local MD5 calculation encounters
   * URL encoding or parameter ordering discrepancies.
   */
  static async validateServerConfirmation(payload: PayfastNotifyPayload): Promise<boolean> {
    try {
      const isSandbox = (process.env.PAYFAST_ENVIRONMENT || '').includes('sandbox');
      const validateHost = isSandbox ? 'https://sandbox.payfast.co.za' : 'https://www.payfast.co.za';
      const url = `${validateHost}/eng/query/validate`;

      const params = new URLSearchParams();
      for (const [key, value] of Object.entries(payload)) {
        if (value !== undefined && value !== null && key !== 'signature') {
          params.append(key, String(value));
        }
      }

      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: params.toString(),
      });

      if (!res.ok) {
        return false;
      }

      const text = await res.text();
      return text.trim() === 'VALID';
    } catch (err) {
      console.warn('PayFast server query validation error:', err);
      return false;
    }
  }

  /**
   * Processes verified ITN webhook notification, updating payment and order records in PostgreSQL.
   */
  static async handleWebhook(payload: PayfastNotifyPayload): Promise<{ success: boolean; message: string; payment?: Payment }> {
    // 1. Strictly verify signature with configured secret passphrase, with server confirmation fallback
    let isValid = this.validateSignature(payload, this.passphrase);
    if (!isValid) {
      console.warn('Local PayFast ITN signature check failed; attempting server confirmation query...');
      isValid = await this.validateServerConfirmation(payload);
    }

    if (!isValid) {
      console.warn('PayFast ITN signature mismatch and server validation rejected payload:', payload);
      return { success: false, message: 'Invalid PayFast signature' };
    }

    const admin = getSupabaseAdminClient();
    const orderId = payload.custom_str1 || payload.m_payment_id;
    let userId = payload.custom_str2;
    const paymentStatus = payload.payment_status?.toUpperCase();
    const amount = parseFloat(payload.amount_gross || '0');
    const isSubscription = Boolean(payload.token || payload.subscription_type);
    const isBooking = payload.custom_str3 === 'booking';
    const relatedType = isSubscription ? 'subscription' : isBooking ? 'booking' : 'order';

    let resolvedSub: any = null;

    // Multi-vector subscription identification
    if (isSubscription) {
      // Vector A: Match by payfast_token
      if (payload.token) {
        const { data: subByToken } = await admin
          .from('subscriptions')
          .select('*')
          .eq('payfast_token', payload.token)
          .maybeSingle();

        if (subByToken) {
          resolvedSub = subByToken;
          userId = subByToken.user_id;
        }
      }

      // Vector B: Match by user_id if valid
      if (!resolvedSub && userId && userId !== '00000000-0000-0000-0000-000000000000' && userId !== 'guest-user') {
        const { data: subByUser } = await admin
          .from('subscriptions')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (subByUser) {
          resolvedSub = subByUser;
        }
      }

      // Vector C: Match by customer email address
      if (!resolvedSub && payload.email_address) {
        const { data: profile } = await admin
          .from('profiles')
          .select('id')
          .eq('email', payload.email_address)
          .maybeSingle();

        if (profile?.id) {
          userId = profile.id;
          const { data: subByEmail } = await admin
            .from('subscriptions')
            .select('*')
            .eq('user_id', profile.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

          if (subByEmail) {
            resolvedSub = subByEmail;
          }
        }
      }
    }

    // If userId not provided, lookup profile by email_address or fallback to resolved subscription's user_id
    if ((!userId || userId === '00000000-0000-0000-0000-000000000000' || userId === 'guest-user') && resolvedSub?.user_id) {
      userId = resolvedSub.user_id;
    }
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

      // 3. Update order, booking or subscription state authoritatively if COMPLETE
      if (isPaid) {
        if (orderId && !isSubscription) {
          if (isBooking) {
            // Verify booking amount authoritatively
            const { data: existingBooking } = await admin
              .from('bookings')
              .select('id, total_amount, status')
              .eq('id', orderId)
              .maybeSingle();

            const expectedBookingAmount = Number(existingBooking?.total_amount || 0);
            if (expectedBookingAmount > 0 && amount < expectedBookingAmount) {
              console.error(`[PayFast Webhook] Security Alert: Booking ${orderId} expected R${expectedBookingAmount} but received R${amount}. Payment not marked complete.`);
            } else {
              // Confirm the barbershop appointment
              const { data: updatedBooking, error: bkErr } = await admin
                .from('bookings')
                .update({
                  status: 'confirmed',
                  payment_status: 'paid_online',
                  payment_id: paymentRecord?.id || null,
                  updated_at: new Date().toISOString(),
                })
                .eq('id', orderId)
                .select('*, service:services(name), customer:profiles(email, full_name)')
                .single();

              if (bkErr) {
                console.error(`Booking payment confirmation failed for ${orderId}:`, bkErr);
              } else {
                console.log(`Booking ${orderId} successfully confirmed via PayFast payment.`);
                try {
                  await AuditService.recordLog({
                    actor_email: payload.email_address || updatedBooking?.customer?.email || 'payfast-webhook@dissafyt.com',
                    actor_role: 'system',
                    action: 'booking.payment_received',
                    entity_type: 'booking',
                    entity_id: orderId,
                    entity_name: `Booking ${orderId} (${updatedBooking?.service?.name || 'Haircut'})`,
                    changes: {
                      status: 'confirmed',
                      payment_status: 'paid_online',
                      amount,
                      pf_payment_id: payload.pf_payment_id,
                    },
                  });
                } catch (auditErr) {
                  console.warn('Booking payment audit log warning:', auditErr);
                }
              }
            }
          } else {
            const confirmResult = await OrderService.confirmOrderPayment(orderId, amount, payload.pf_payment_id);
            if (!confirmResult.success) {
              console.warn(`Order payment confirmation failed for ${orderId}:`, confirmResult.error);
            }
          }
        }

        // 4. Activate or renew barbershop subscription if subscription payment
        if (isSubscription) {
          const rawPlan = payload.custom_str1 || resolvedSub?.plan_code || 'twice';
          const planCode = rawPlan;
          const basePlanCode = rawPlan.startsWith('father-son') ? 'father-son' : rawPlan;
          const planNames: Record<string, string> = {
            solo: 'The Solo Membership',
            twice: 'The Regular Membership',
            executive: 'The Executive Membership',
            'father-son': 'Father & Son Membership',
          };
          const planMinPrices: Record<string, number> = {
            solo: 100,
            twice: 190,
            executive: 350,
            'father-son': 190,
          };
          const planName = payload.item_name || planNames[basePlanCode] || resolvedSub?.plan_name || 'Barbershop Membership';
          const expectedMinPrice = planMinPrices[basePlanCode] || 100;

          if (amount < expectedMinPrice) {
            console.error(`[PayFast Webhook] Security Alert: Subscription ${planCode} expected R${expectedMinPrice} but received R${amount}. Subscription not activated.`);
          } else {
            const startDate = new Date();
            const endDate = new Date(startDate.getTime() + 30 * 24 * 60 * 60 * 1000);

            try {
              if (resolvedSub) {
                await admin
                  .from('subscriptions')
                  .update({
                    plan_code: planCode,
                    plan_name: planName,
                    price: amount || resolvedSub.price,
                    status: 'active',
                    current_period_start: startDate.toISOString(),
                    current_period_end: endDate.toISOString(),
                    payfast_token: payload.token || resolvedSub.payfast_token || payload.pf_payment_id || null,
                    updated_at: new Date().toISOString(),
                  })
                  .eq('id', resolvedSub.id);

                if (paymentRecord?.id) {
                  await admin
                    .from('payments')
                    .update({ related_id: resolvedSub.id, user_id: resolvedSub.user_id })
                    .eq('id', paymentRecord.id);
                }

                console.log(`Successfully renewed subscription ${resolvedSub.id} for user ${resolvedSub.user_id} through ${endDate.toISOString()}`);
              } else if (userId && userId !== GUEST_USER_ID) {
                const { data: createdSub } = await admin.from('subscriptions').insert({
                  user_id: userId,
                  plan_code: planCode,
                  plan_name: planName,
                  price: amount,
                  status: 'active',
                  current_period_start: startDate.toISOString(),
                  current_period_end: endDate.toISOString(),
                  payfast_token: payload.token || payload.pf_payment_id || null,
                }).select().single();

                if (paymentRecord?.id && createdSub?.id) {
                  await admin
                    .from('payments')
                    .update({ related_id: createdSub.id })
                    .eq('id', paymentRecord.id);
                }

                console.log(`Successfully created new subscription for user ${userId}`);
              }
            } catch (subErr) {
              console.error('Failed to create/update subscription in table:', subErr);
            }
          }
        }

        // 5. Activate Founder Pass if this was a founder pass payment
        const isFounderPass = payload.custom_str3 === 'founder_pass' || payload.m_payment_id?.startsWith('founder-');
        if (isFounderPass) {
          const passId = payload.custom_str1 || payload.m_payment_id?.replace('founder-', '');
          if (passId) {
            if (amount < 1200.00) {
              console.error(`[PayFast Webhook] Security Alert: Founder Pass expected R1200.00 but received R${amount}. Pass not activated.`);
            } else {
              try {
                const { FounderPassService } = await import('../barbershop/founder-pass-service');
                await FounderPassService.activatePass(passId, payload.pf_payment_id || `PF_${Date.now()}`);
              } catch (fpErr) {
                console.error('Failed to activate founder pass from PayFast webhook:', fpErr);
              }
            }
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
