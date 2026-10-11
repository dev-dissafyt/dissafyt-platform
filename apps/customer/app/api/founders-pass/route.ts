import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdminClient } from '@dissafyt/database';
import { FounderPassService, PayfastService, AuditService, getCanonicalSiteUrl } from '@dissafyt/api';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * GET /api/founders-pass
 * Returns live buildout capital pool telemetry, active pass sales, and funding progress.
 */
export async function GET() {
  try {
    const stats = await FounderPassService.getBuildoutStats();
    return NextResponse.json({
      success: true,
      stats,
    });
  } catch (err: any) {
    console.error('Error fetching founder pass stats:', err);
    return NextResponse.json(
      {
        success: false,
        error: err.message || 'Failed to fetch buildout stats',
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/founders-pass
 * Issues or activates Founder Passes for the Barbershop Buildout Capital pool (12 Cuts for R1,200).
 * Handles immediate PayFast transaction generation ('pay_now') or interest spot reservation ('pledge_waitlist').
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const name = typeof body.name === 'string' ? body.name.trim() : 'Founding Patron';
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
    const phone = typeof body.phone === 'string' ? body.phone.trim() : '';
    const pledgeType = body.pledgeType === 'pay_now' ? 'pay_now' : 'pledge_waitlist';
    const notes = typeof body.notes === 'string' ? body.notes.trim() : '';

    if (!email || !EMAIL_REGEX.test(email)) {
      return NextResponse.json(
        { success: false, error: 'Please provide a valid email address.' },
        { status: 400 }
      );
    }

    if (!phone) {
      return NextResponse.json(
        { success: false, error: 'Please provide a WhatsApp or contact number.' },
        { status: 400 }
      );
    }

    const admin = getSupabaseAdminClient();

    // 1. Create or issue pass record
    const result = await FounderPassService.createPass({
      name,
      email,
      phone,
      paymentMethod: pledgeType === 'pay_now' ? 'payfast' : 'pledge_waitlist',
      isPaid: false,
      notes,
    });

    if (!result.success || !result.pass) {
      return NextResponse.json(
        { success: false, error: result.error || 'Failed to initialize Founder Pass' },
        { status: 500 }
      );
    }

    const pass = result.pass;

    // 2. Track in newsletter table for milestone notifications
    await admin
      .from('newsletter_subscribers')
      .upsert(
        {
          email,
          source: `founder_pass_12cuts_${pledgeType}`,
          status: 'subscribed',
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'email' }
      );

    // 3. Handle PayFast Live Payment payload if customer selected 'pay_now'
    if (pledgeType === 'pay_now') {
      const siteUrl = getCanonicalSiteUrl();

      const merchantId = process.env.PAYFAST_MERCHANT_ID || '10000100';
      const merchantKey = process.env.PAYFAST_MERCHANT_KEY || '46f0cd694581a';

      const nameParts = name.trim().split(' ');
      const firstName = nameParts[0] || 'Founding';
      const lastName = nameParts.slice(1).join(' ') || 'Patron';

      const payfastData: Record<string, string> = {
        merchant_id: merchantId,
        merchant_key: merchantKey,
        return_url: `${siteUrl}/checkout/success?type=founder_pass&pass_id=${pass.id}&pass_number=${pass.pass_number}`,
        cancel_url: `${siteUrl}/?cancelled=founder_pass`,
        notify_url: `${siteUrl}/api/payments/payfast-notify`,
        name_first: firstName,
        ...(lastName ? { name_last: lastName } : {}),
        email_address: email,
        cell_number: phone,
        m_payment_id: `founder-${pass.id}`,
        amount: '1200.00',
        item_name: `Dissafyt Founder Pass #${pass.pass_number} (12 Cuts / Year)`,
        item_description: 'Prepaid 12 Master Cuts Entitlement to fund 1 Norwalk Way Barbershop Buildout',
        custom_str1: pass.id,
        custom_str2: pass.user_id || email,
        custom_str3: 'founder_pass',
      };

      const transaction = PayfastService.createTransactionPayload(payfastData);

      return NextResponse.json({
        success: true,
        mode: 'pay_now',
        message: 'Founder Pass generated. Redirecting to PayFast secure payment gateway...',
        pass,
        payfast: transaction,
      });
    }

    // 4. Default pledge waitlist response
    return NextResponse.json({
      success: true,
      mode: 'pledge_waitlist',
      message: 'Founder Patron spot secured! We will notify you upon shop buildout commencement.',
      pass,
    });
  } catch (err: any) {
    console.error('Founder pass creation failed:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
