import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdminClient } from '@dissafyt/database';
import { EmailService, AuditService } from '@dissafyt/api';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * POST /api/founders-pass
 * Captures pledges & interest for the Physical Barbershop Buildout Founder Pass (12 Cuts for R1,200/year).
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

    // 1. Record lead in newsletter_subscribers with custom source
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

    // 2. Record audit log entry for founder capital tracking
    await AuditService.recordLog({
      actor_email: email,
      actor_role: 'customer',
      action: 'founder_pass.pledge',
      entity_type: 'founder_pass',
      entity_id: `founder-${Date.now()}`,
      entity_name: `Founder Pass Pledge: ${name}`,
      changes: {
        name,
        email,
        phone,
        pledge_amount: 1200,
        cuts_included: 12,
        pledge_type: pledgeType,
        notes,
        timestamp: new Date().toISOString(),
      },
    });

    // 3. Dispatch confirmation & welcome email via EmailService
    try {
      const emailContent = `
        <div style="text-align:center;margin-bottom:20px;">
          <span style="background-color:rgba(255,85,0,0.15);color:#ff5500;border:1px solid rgba(255,85,0,0.3);font-family:monospace;font-size:11px;font-weight:700;letter-spacing:1px;text-transform:uppercase;padding:4px 12px;border-radius:9999px;display:inline-block;">
            Founder Patron Circle &bull; Cape Town Studio
          </span>
        </div>

        <div style="text-align:center;margin-bottom:24px;">
          <h2 style="color:#ffffff;font-size:22px;font-weight:900;text-transform:uppercase;margin:0 0 8px 0;letter-spacing:0.5px;">
            Thank You for Backing the Barbershop Buildout!
          </h2>
          <p style="color:#a1a1aa;font-size:14px;margin:0;line-height:1.5;">
            Hey <strong>${name}</strong>, your pledge for the <strong>Dissafyt Founder Pass (12 Master Cuts for R1,200)</strong> has been logged.
          </p>
        </div>

        <div style="background-color:#18181b;border:1px solid #27272a;border-radius:10px;padding:24px;margin-bottom:24px;">
          <div style="font-size:11px;font-weight:800;letter-spacing:1px;color:#a1a1aa;text-transform:uppercase;margin-bottom:14px;">
            Founder Patron Terms & Allocation
          </div>
          <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="font-size:13px;line-height:1.8;">
            <tr>
              <td style="color:#71717a;">Pass Allocation:</td>
              <td align="right" style="color:#ffffff;font-weight:700;">12 Master Haircuts (Valid 1 Full Year)</td>
            </tr>
            <tr>
              <td style="color:#71717a;">Effective Rate:</td>
              <td align="right" style="color:#22c55e;font-family:monospace;font-weight:800;">R100 / Cut (Save up to 45%)</td>
            </tr>
            <tr>
              <td style="color:#71717a;">Studio Destination:</td>
              <td align="right" style="color:#d4d4d8;">1 Norwalk Way, Bernadino Heights, CPT</td>
            </tr>
            <tr style="border-top:1px solid #27272a;">
              <td style="padding-top:8px;color:#ff5500;font-weight:700;">Investment Pledge:</td>
              <td align="right" style="padding-top:8px;color:#ff5500;font-family:monospace;font-weight:900;font-size:16px;">R 1,200.00</td>
            </tr>
          </table>
        </div>

        <div style="background-color:#0c0a09;border:1px solid #1f1f23;border-radius:8px;padding:16px 20px;margin-bottom:24px;text-align:left;">
          <div style="color:#ffffff;font-size:13px;font-weight:700;margin-bottom:4px;">
            🧱 How Your Investment Builds the Shop:
          </div>
          <p style="color:#a1a1aa;font-size:12px;margin:0;line-height:1.6;">
            Every cent raised from our 50 Founder Passes directly funds the physical buildout: Belmont reclining chairs, custom mirrors, architectural lighting, and our streetwear display lab in Bernadino Heights. We will message you on WhatsApp (<strong>${phone}</strong>) with milestone construction updates!
          </p>
        </div>

        <div style="text-align:center;">
          <a href="https://dissafyt.com" style="background-color:#ff5500;color:#09090b;text-decoration:none;padding:14px 28px;border-radius:6px;font-weight:800;font-size:13px;letter-spacing:1px;text-transform:uppercase;display:inline-block;">
            Visit Flagship Platform
          </a>
        </div>
      `;

      await EmailService.send({
        to: email,
        subject: `Founder Patron Pledge Confirmed: 12 Cuts for R1,200 • Dissafyt Barbershop Buildout`,
        html: EmailService['renderShell'](emailContent, `Founder Patron pass pledged for ${name}. 12 cuts for R1,200.`),
        tags: [{ name: 'category', value: 'founders_pass_pledge' }],
      });
    } catch (mailErr) {
      console.warn('Failed to dispatch founder pass confirmation email:', mailErr);
    }

    return NextResponse.json({
      success: true,
      message: 'Founder Patron Pass pledge secured! Thank you for backing the buildout.',
      pledge: {
        name,
        email,
        phone,
        pledgeType,
        amount: 1200,
        cuts: 12,
      },
    });
  } catch (err: any) {
    console.error('Founder pass pledge error:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
