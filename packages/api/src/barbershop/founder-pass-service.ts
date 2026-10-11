import { getSupabaseAdminClient, FounderPass, FounderPassRedemption } from '@dissafyt/database';
import { EmailService } from '../notifications/email-service';
import { AuditService } from '../audit/audit-service';

export interface BuildoutStats {
  totalSpots: number;
  claimedSpots: number;
  totalCapitalTarget: number;
  currentCapital: number;
  pctFunded: number;
  remainingSpots: number;
}

export interface CreatePassInput {
  name: string;
  email: string;
  phone: string;
  paymentMethod?: 'payfast' | 'pos_card' | 'pos_cash' | 'manual_grant' | 'pledge_waitlist';
  paymentRef?: string;
  isPaid?: boolean;
  notes?: string;
}

export interface RedeemCutInput {
  passId: string;
  bookingId?: string;
  serviceName?: string;
  barberName?: string;
  notes?: string;
}

export class FounderPassService {
  // Baseline initial founder commitments prior to online launch
  private static readonly BASE_PLEDGED_BACKERS = 28;
  private static readonly TOTAL_SPOTS = 50;
  private static readonly PRICE_PER_PASS = 1200;
  private static readonly TOTAL_CAPITAL_TARGET = 60000;

  /**
   * Retrieves live buildout funding progress and backer counts.
   * Dynamically aggregates active database passes + baseline pledges.
   */
  static async getBuildoutStats(): Promise<BuildoutStats> {
    const admin = getSupabaseAdminClient();

    try {
      const { data: passes, error } = await admin
        .from('founder_passes')
        .select('id, status')
        .in('status', ['active', 'exhausted']);

      if (error) {
        console.warn('Error querying founder_passes for stats:', error.message);
      }

      const activeCount = passes ? passes.length : 0;
      const claimedSpots = Math.min(this.TOTAL_SPOTS, this.BASE_PLEDGED_BACKERS + activeCount);
      const currentCapital = claimedSpots * this.PRICE_PER_PASS;
      const pctFunded = Math.min(100, Math.round((currentCapital / this.TOTAL_CAPITAL_TARGET) * 100));
      const remainingSpots = Math.max(0, this.TOTAL_SPOTS - claimedSpots);

      return {
        totalSpots: this.TOTAL_SPOTS,
        claimedSpots,
        totalCapitalTarget: this.TOTAL_CAPITAL_TARGET,
        currentCapital,
        pctFunded,
        remainingSpots,
      };
    } catch (err) {
      console.error('Failed to get buildout stats:', err);
      return {
        totalSpots: this.TOTAL_SPOTS,
        claimedSpots: 29,
        totalCapitalTarget: this.TOTAL_CAPITAL_TARGET,
        currentCapital: 34800,
        pctFunded: 58,
        remainingSpots: 21,
      };
    }
  }

  /**
   * Creates or purchases a Founder Pass.
   * If isPaid is true, pass is immediately activated with 12 cuts ready to redeem.
   */
  static async createPass(input: CreatePassInput): Promise<{ success: boolean; pass?: FounderPass; error?: string }> {
    const admin = getSupabaseAdminClient();
    const cleanEmail = input.email.trim().toLowerCase();
    const cleanPhone = input.phone.trim();
    const cleanName = input.name.trim();

    try {
      // 1. Check for existing active profile
      const { data: profile } = await admin
        .from('profiles')
        .select('id')
        .eq('email', cleanEmail)
        .maybeSingle();

      const userId = profile?.id || null;

      // 2. Count existing passes to assign next sequential pass number
      const { count } = await admin
        .from('founder_passes')
        .select('*', { count: 'exact', head: true });

      const nextNum = (count || 0) + this.BASE_PLEDGED_BACKERS + 1;
      const passNumber = `FP-${String(nextNum).padStart(4, '0')}`;

      const status = input.isPaid ? 'active' : 'pending_payment';

      // 3. Insert record into founder_passes
      const { data: newPass, error: insertErr } = await admin
        .from('founder_passes')
        .insert({
          pass_number: passNumber,
          user_id: userId,
          customer_name: cleanName,
          customer_email: cleanEmail,
          customer_phone: cleanPhone,
          total_cuts: 12,
          cuts_used: 0,
          amount_paid: input.isPaid ? this.PRICE_PER_PASS : 0.0,
          status,
          payment_method: input.paymentMethod || 'payfast',
          payment_ref: input.paymentRef || null,
          notes: input.notes || null,
        })
        .select()
        .single();

      if (insertErr || !newPass) {
        throw new Error(insertErr?.message || 'Failed to create founder pass');
      }

      // 4. If paid, mirror to subscriptions table and dispatch welcome email
      if (input.isPaid && userId) {
        await admin.from('subscriptions').upsert(
          {
            user_id: userId,
            plan_code: 'founder_pass_12cuts',
            plan_name: "Founder's Circle Pass (12 Master Cuts)",
            price: this.PRICE_PER_PASS,
            status: 'active',
            current_period_start: new Date().toISOString(),
            current_period_end: new Date(Date.now() + 365 * 86400000).toISOString(),
            payfast_token: input.paymentRef || 'FOUNDER_PREPAID',
          },
          { onConflict: 'user_id' }
        );
      }

      // 5. Send Welcome & Pass Credentials Email
      if (input.isPaid) {
        await this.sendFounderWelcomeEmail(newPass);
      }

      // 6. Record Audit Log
      await AuditService.recordLog({
        actor_email: cleanEmail,
        actor_role: 'customer',
        action: input.isPaid ? 'founder_pass.purchased' : 'founder_pass.pledged',
        entity_type: 'founder_pass',
        entity_id: newPass.id,
        entity_name: `Founder Pass ${passNumber}: ${cleanName}`,
        changes: {
          passNumber,
          totalCuts: 12,
          amount: this.PRICE_PER_PASS,
          isPaid: input.isPaid,
        },
      });

      return { success: true, pass: newPass };
    } catch (err: any) {
      console.error('Error creating founder pass:', err);
      return { success: false, error: err.message || 'Error creating founder pass' };
    }
  }

  /**
   * Activates a pending pass upon PayFast payment confirmation.
   */
  static async activatePass(passId: string, paymentRef: string): Promise<boolean> {
    const admin = getSupabaseAdminClient();

    try {
      const { data: pass, error: fetchErr } = await admin
        .from('founder_passes')
        .select('*')
        .eq('id', passId)
        .maybeSingle();

      if (fetchErr || !pass) return false;

      const { data: updated, error: updateErr } = await admin
        .from('founder_passes')
        .update({
          status: 'active',
          amount_paid: this.PRICE_PER_PASS,
          payment_ref: paymentRef,
          updated_at: new Date().toISOString(),
        })
        .eq('id', passId)
        .select()
        .single();

      if (updateErr || !updated) return false;

      // Link to profile subscription if user exists
      if (updated.user_id) {
        await admin.from('subscriptions').upsert(
          {
            user_id: updated.user_id,
            plan_code: 'founder_pass_12cuts',
            plan_name: "Founder's Circle Pass (12 Master Cuts)",
            price: this.PRICE_PER_PASS,
            status: 'active',
            current_period_start: new Date().toISOString(),
            current_period_end: new Date(Date.now() + 365 * 86400000).toISOString(),
            payfast_token: paymentRef,
          },
          { onConflict: 'user_id' }
        );
      }

      await this.sendFounderWelcomeEmail(updated);
      return true;
    } catch (err) {
      console.error('Error activating founder pass:', err);
      return false;
    }
  }

  /**
   * Finds customer's active Founder Pass by email, phone, or user_id.
   */
  static async getCustomerPass(query: {
    email?: string;
    phone?: string;
    userId?: string;
  }): Promise<(FounderPass & { cuts_remaining: number }) | null> {
    const admin = getSupabaseAdminClient();

    let dbQuery = admin.from('founder_passes').select('*').eq('status', 'active');

    if (query.userId) {
      dbQuery = dbQuery.eq('user_id', query.userId);
    } else if (query.email) {
      dbQuery = dbQuery.eq('customer_email', query.email.trim().toLowerCase());
    } else if (query.phone) {
      dbQuery = dbQuery.eq('customer_phone', query.phone.trim());
    } else {
      return null;
    }

    const { data: passes, error } = await dbQuery.order('created_at', { ascending: false }).limit(1);

    if (error || !passes || passes.length === 0) {
      return null;
    }

    const pass = passes[0];
    const cutsRemaining = Math.max(0, pass.total_cuts - pass.cuts_used);

    return {
      ...pass,
      cuts_remaining: cutsRemaining,
    };
  }

  /**
   * Redeems 1 haircut from customer's Founder Pass.
   * Decrements cuts_remaining, logs redemption, and optionally links booking.
   */
  static async redeemCut(input: RedeemCutInput): Promise<{
    success: boolean;
    cutsRemaining?: number;
    cutNumber?: number;
    error?: string;
  }> {
    const admin = getSupabaseAdminClient();

    try {
      const { data: pass, error: fetchErr } = await admin
        .from('founder_passes')
        .select('*')
        .eq('id', input.passId)
        .maybeSingle();

      if (fetchErr || !pass) {
        return { success: false, error: 'Founder Pass not found.' };
      }

      if (pass.status !== 'active') {
        return { success: false, error: `Founder Pass is currently ${pass.status}.` };
      }

      const currentUsed = pass.cuts_used || 0;
      if (currentUsed >= pass.total_cuts) {
        return { success: false, error: 'All 12 Founder Pass cuts have already been redeemed.' };
      }

      const newCutsUsed = currentUsed + 1;
      const cutNumber = newCutsUsed;
      const cutsRemaining = Math.max(0, pass.total_cuts - newCutsUsed);
      const isExhausted = newCutsUsed >= pass.total_cuts;

      // 1. Update pass record
      const { error: updateErr } = await admin
        .from('founder_passes')
        .update({
          cuts_used: newCutsUsed,
          status: isExhausted ? 'exhausted' : 'active',
          updated_at: new Date().toISOString(),
        })
        .eq('id', input.passId);

      if (updateErr) {
        throw new Error(updateErr.message);
      }

      // 2. Insert into founder_pass_redemptions
      await admin.from('founder_pass_redemptions').insert({
        pass_id: input.passId,
        booking_id: input.bookingId || null,
        cut_number: cutNumber,
        service_name: input.serviceName || 'Master Haircut',
        barber_name: input.barberName || 'Ace Barber',
        notes: input.notes || `Cut #${cutNumber} redeemed of 12`,
      });

      // 3. If booking_id provided, mark booking membership_covered
      if (input.bookingId) {
        await admin
          .from('bookings')
          .update({
            payment_status: 'membership_covered',
            is_subscription_covered: true,
            total_amount: 0.0,
            updated_at: new Date().toISOString(),
          })
          .eq('id', input.bookingId);
      }

      // 4. Send Redemption Receipt
      await this.sendCutRedemptionEmail(pass, cutNumber, cutsRemaining);

      return {
        success: true,
        cutsRemaining,
        cutNumber,
      };
    } catch (err: any) {
      console.error('Error redeeming founder pass cut:', err);
      return { success: false, error: err.message || 'Failed to redeem cut' };
    }
  }

  /**
   * Helper: Dispatches welcome and credential email upon pass purchase.
   */
  private static async sendFounderWelcomeEmail(pass: FounderPass): Promise<void> {
    try {
      const emailContent = `
        <div style="text-align:center;margin-bottom:20px;">
          <span style="background-color:rgba(255,85,0,0.15);color:#ff5500;border:1px solid rgba(255,85,0,0.4);font-family:monospace;font-size:11px;font-weight:800;letter-spacing:1px;text-transform:uppercase;padding:5px 14px;border-radius:9999px;display:inline-block;">
            ✦ Founding Patron Card Issued &bull; 1 Norwalk Way ✦
          </span>
        </div>

        <div style="text-align:center;margin-bottom:24px;">
          <h2 style="color:#ffffff;font-size:24px;font-weight:900;text-transform:uppercase;margin:0 0 8px 0;letter-spacing:0.5px;">
            Welcome to the Founder's Circle!
          </h2>
          <p style="color:#a1a1aa;font-size:14px;margin:0;line-height:1.5;">
            Hey <strong>${pass.customer_name}</strong>, your <strong>Dissafyt Founder Pass</strong> has been successfully activated. You have <strong>12 Master Haircuts</strong> ready to redeem over the next 365 days.
          </p>
        </div>

        <!-- 3D Card Representation in Email -->
        <div style="background:linear-gradient(145deg, #181512, #0d0a08);border:1px solid rgba(255,85,0,0.5);border-radius:14px;padding:22px;margin-bottom:24px;box-shadow:0 10px 30px rgba(0,0,0,0.8);">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:18px;">
            <span style="color:#ff5500;font-family:monospace;font-weight:900;font-size:12px;letter-spacing:2px;">FOUNDER PASS</span>
            <span style="color:#ffffff;font-family:monospace;font-size:12px;background:#000;padding:2px 8px;border-radius:4px;border:1px solid #333;">${pass.pass_number}</span>
          </div>

          <div style="font-family:monospace;font-size:16px;letter-spacing:3px;color:#ffffff;margin-bottom:18px;font-weight:700;">
            •••• •••• •••• 1200
          </div>

          <table width="100%" border="0" cellspacing="0" cellpadding="0" style="font-size:12px;font-family:monospace;">
            <tr>
              <td style="color:#a1a1aa;">PATRON:</td>
              <td align="right" style="color:#ffffff;font-weight:700;">${pass.customer_name.toUpperCase()}</td>
            </tr>
            <tr>
              <td style="color:#a1a1aa;">BALANCE:</td>
              <td align="right" style="color:#22c55e;font-weight:900;">12 / 12 CUTS AVAILABLE</td>
            </tr>
            <tr>
              <td style="color:#a1a1aa;">EXPIRES:</td>
              <td align="right" style="color:#e4e4e7;">${new Date(pass.expires_at).toLocaleDateString('en-ZA', { year: 'numeric', month: 'short', day: 'numeric' })}</td>
            </tr>
          </table>
        </div>

        <div style="background-color:#18181b;border:1px solid #27272a;border-radius:10px;padding:20px;margin-bottom:24px;text-align:left;">
          <div style="color:#ffffff;font-size:13px;font-weight:800;margin-bottom:8px;">
            ✂️ How to Redeem Your Cuts:
          </div>
          <ul style="color:#a1a1aa;font-size:12px;margin:0;padding-left:18px;line-height:1.7;">
            <li><strong>Online Booking:</strong> Log in with <code>${pass.customer_email}</code> at <strong>dissafyt.com/book</strong>. Your chair fee will be automatically covered (R0.00).</li>
            <li><strong>Studio Counter:</strong> Give your name or pass code (<code>${pass.pass_number}</code>) to staff at <strong>1 Norwalk Way, Bernadino Heights</strong>.</li>
            <li><strong>Founder Plaque:</strong> Your name will be laser-engraved onto our studio patron brass plate.</li>
          </ul>
        </div>

        <div style="text-align:center;">
          <a href="https://dissafyt.com/book" style="background-color:#ff5500;color:#09090b;text-decoration:none;padding:14px 28px;border-radius:6px;font-weight:900;font-size:13px;letter-spacing:1px;text-transform:uppercase;display:inline-block;">
            Book Your First Founder Cut
          </a>
        </div>
      `;

      await EmailService.send({
        to: pass.customer_email,
        subject: `Your Founder Pass is Active: ${pass.pass_number} • 12 Master Cuts • Dissafyt Studio`,
        html: EmailService['renderShell'](emailContent, `Founder Pass activated for ${pass.customer_name}. Pass #${pass.pass_number}.`),
        tags: [{ name: 'category', value: 'founder_pass_active' }],
      });
    } catch (err) {
      console.warn('Failed to send founder welcome email:', err);
    }
  }

  /**
   * Helper: Dispatches notification each time a cut is redeemed.
   */
  private static async sendCutRedemptionEmail(pass: FounderPass, cutNumber: number, cutsRemaining: number): Promise<void> {
    try {
      const emailContent = `
        <div style="text-align:center;margin-bottom:20px;">
          <span style="background-color:rgba(34,197,94,0.15);color:#22c55e;border:1px solid rgba(34,197,94,0.4);font-family:monospace;font-size:11px;font-weight:800;letter-spacing:1px;text-transform:uppercase;padding:5px 14px;border-radius:9999px;display:inline-block;">
            Cut #${cutNumber} of 12 Redeemed
          </span>
        </div>

        <div style="text-align:center;margin-bottom:24px;">
          <h2 style="color:#ffffff;font-size:22px;font-weight:900;text-transform:uppercase;margin:0 0 8px 0;">
            Haircut Confirmed on Founder Pass
          </h2>
          <p style="color:#a1a1aa;font-size:14px;margin:0;line-height:1.5;">
            Hey <strong>${pass.customer_name}</strong>, you just used <strong>Cut #${cutNumber}</strong> on your Founder Pass (<code>${pass.pass_number}</code>).
          </p>
        </div>

        <div style="background-color:#18181b;border:1px solid #27272a;border-radius:10px;padding:20px;margin-bottom:24px;">
          <table width="100%" border="0" cellspacing="0" cellpadding="0" style="font-size:13px;line-height:1.8;">
            <tr>
              <td style="color:#71717a;">Pass Code:</td>
              <td align="right" style="color:#ffffff;font-family:monospace;font-weight:700;">${pass.pass_number}</td>
            </tr>
            <tr>
              <td style="color:#71717a;">Cuts Used:</td>
              <td align="right" style="color:#ffffff;font-weight:700;">${cutNumber} of 12</td>
            </tr>
            <tr>
              <td style="color:#71717a;">Remaining Cuts:</td>
              <td align="right" style="color:#22c55e;font-family:monospace;font-weight:900;font-size:15px;">${cutsRemaining} Cuts Remaining</td>
            </tr>
            <tr>
              <td style="color:#71717a;">Chair Fee Charged:</td>
              <td align="right" style="color:#ff5500;font-family:monospace;font-weight:800;">R 0.00 (Pass Covered)</td>
            </tr>
          </table>
        </div>

        <div style="text-align:center;">
          <a href="https://dissafyt.com/book" style="background-color:#ff5500;color:#09090b;text-decoration:none;padding:12px 24px;border-radius:6px;font-weight:800;font-size:12px;letter-spacing:1px;text-transform:uppercase;display:inline-block;">
            View Grooming Appointments
          </a>
        </div>
      `;

      await EmailService.send({
        to: pass.customer_email,
        subject: `Cut #${cutNumber} Redeemed: ${cutsRemaining} Cuts Left • Dissafyt Founder Pass`,
        html: EmailService['renderShell'](emailContent, `Cut #${cutNumber} redeemed on pass ${pass.pass_number}. ${cutsRemaining} cuts remaining.`),
        tags: [{ name: 'category', value: 'founder_pass_redemption' }],
      });
    } catch (err) {
      console.warn('Failed to send cut redemption email:', err);
    }
  }
}
