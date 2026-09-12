import { NextRequest, NextResponse } from 'next/server';
import { FlowCrypto, BarbershopService, PayfastService, WhatsAppService, AuditService, WHATSAPP_FLOW_ID } from '@dissafyt/api';
import { getSupabaseAdminClient } from '@dissafyt/database';

const GUEST_USER_ID = '00000000-0000-0000-0000-000000000001';
const CURTIS_PHONE = process.env.ADMIN_ALERT_PHONE || '27818082570';

/**
 * GET /api/whatsapp/flow-endpoint
 * Informational endpoint status check.
 */
export async function GET() {
  const privateKey = FlowCrypto.getPrivateKey();
  return NextResponse.json({
    status: 'online',
    description: 'Dissafyt WhatsApp Flow 3.0 Encrypted Endpoint',
    flow_id: WHATSAPP_FLOW_ID,
    encryption_ready: Boolean(privateKey && privateKey.length > 0),
    timestamp: new Date().toISOString(),
  });
}

// ---------------------------------------------------------------------------
// IN-MEMORY CACHED APPOINTMENT CATALOG (Zero latency on INIT requests)
// ---------------------------------------------------------------------------
interface CachedAppointmentData {
  services: { id: string; title: string }[];
  barbers: { id: string; title: string }[];
  timestamp: number;
}
let CACHED_APPOINTMENT_DATA: CachedAppointmentData | null = null;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

async function getCachedOrFetchAppointmentData() {
  if (CACHED_APPOINTMENT_DATA && Date.now() - CACHED_APPOINTMENT_DATA.timestamp < CACHE_TTL_MS) {
    return CACHED_APPOINTMENT_DATA;
  }

  try {
    const [services, staffList] = await Promise.all([
      BarbershopService.listServices(),
      BarbershopService.listActiveStaff(),
    ]);

    const activeServices = services
      .filter((s) => s.is_active && !s.is_subscription)
      .map((s) => ({
        id: s.name,
        title: `${s.name} (R${s.price})`,
      }));

    const activeBarbers = staffList.map((st) => ({
      id: st.display_name,
      title: st.bio ? `${st.display_name} (${st.bio})` : `${st.display_name} (Barber)`,
    }));

    CACHED_APPOINTMENT_DATA = {
      services: activeServices.length > 0 ? activeServices : [
        { id: 'Classic Haircut', title: 'Classic Haircut (R120)' },
        { id: 'Signature Haircut & Beard', title: 'Haircut & Beard (R160)' },
      ],
      barbers: activeBarbers.length > 0 ? activeBarbers : [
        { id: 'Curtis Lee', title: 'Curtis Lee (Master Barber)' },
        { id: 'First Available Barber', title: 'First Available Barber' },
      ],
      timestamp: Date.now(),
    };
  } catch (err) {
    console.warn('[Flow Endpoint] Could not refresh appointment cache:', err);
    if (!CACHED_APPOINTMENT_DATA) {
      CACHED_APPOINTMENT_DATA = {
        services: [
          { id: 'Classic Haircut', title: 'Classic Haircut (R120)' },
          { id: 'Signature Haircut & Beard', title: 'Haircut & Beard (R160)' },
        ],
        barbers: [
          { id: 'Curtis Lee', title: 'Curtis Lee (Master Barber)' },
          { id: 'First Available Barber', title: 'First Available Barber' },
        ],
        timestamp: Date.now(),
      };
    }
  }

  return CACHED_APPOINTMENT_DATA;
}

/**
 * POST /api/whatsapp/flow-endpoint
 * Handles Meta Flow encrypted data exchange: health check (ping), INIT, and screen data exchange.
 */
export async function POST(request: NextRequest) {
  let rawBodyText = '';
  let aesKey: Buffer | null = null;
  let iv: Buffer | null = null;

  try {
    rawBodyText = await request.text();
    let body: any;
    try {
      body = JSON.parse(rawBodyText);
    } catch {
      return new Response('Invalid JSON payload', { status: 400 });
    }

    // 1. Validate X-Hub-Signature-256 if Meta App Secret is configured
    const hubSignature = request.headers.get('x-hub-signature-256');
    if (!FlowCrypto.validateSignature(rawBodyText, hubSignature)) {
      console.warn('[Flow Endpoint] Signature mismatch on X-Hub-Signature-256');
      return new Response('Unauthorized: Signature mismatch', { status: 401 });
    }

    // 2. Decrypt incoming payload (RSA-OAEP SHA-256 + AES-128-GCM)
    const decrypted = FlowCrypto.decryptRequest(body);
    aesKey = decrypted.aesKey;
    iv = decrypted.initialVector;

    const { action, screen, data, flow_token, version } = decrypted.decryptedBody;
    const targetFlow = request.nextUrl.searchParams.get('flow')?.toLowerCase() || '';
    console.log(`[Flow Endpoint Action] action=${action}, screen=${screen}, token=${flow_token}, flow=${targetFlow}, version=${version}`);

    let responsePayload: Record<string, any> = {};

    // -------------------------------------------------------------------------
    // ACTION 1: PING / HEALTH CHECK
    // -------------------------------------------------------------------------
    if (action === 'ping') {
      responsePayload = {
        data: {
          status: 'active',
        },
      };
    }
    // -------------------------------------------------------------------------
    // ACTION 2: INIT (Flow Opened)
    // -------------------------------------------------------------------------
    else if (action === 'INIT') {
      const isAuthFlow =
        targetFlow === 'signup' ||
        targetFlow === 'auth' ||
        targetFlow === 'login' ||
        screen === 'SIGN_IN' ||
        screen === 'SIGN_UP' ||
        flow_token?.toLowerCase().includes('auth') ||
        flow_token?.toLowerCase().includes('sign');

      const isFeedbackFlow =
        targetFlow === 'feedback' ||
        targetFlow === 'review' ||
        screen === 'FEEDBACK' ||
        flow_token?.toLowerCase().includes('rev') ||
        flow_token?.toLowerCase().includes('feed');

      const isSupportFlow =
        targetFlow === 'support' ||
        targetFlow === 'help' ||
        screen === 'SUPPORT_TICKET' ||
        flow_token?.toLowerCase().includes('sup') ||
        flow_token?.toLowerCase().includes('ticket');

      if (isAuthFlow) {
        responsePayload = {
          screen: 'SIGN_IN',
          data: {},
        };
      } else if (isFeedbackFlow) {
        responsePayload = {
          screen: 'FEEDBACK',
          data: {},
        };
      } else if (isSupportFlow) {
        responsePayload = {
          screen: 'SUPPORT_TICKET',
          data: {},
        };
      } else {
        const apptData = await getCachedOrFetchAppointmentData();
        responsePayload = {
          screen: 'APPOINTMENT_SELECTION',
          data: {
            services: apptData.services,
            barbers: apptData.barbers,
          },
        };
      }
    }
    // -------------------------------------------------------------------------
    // ACTION 3: DATA EXCHANGE (Screen Submitted)
    // -------------------------------------------------------------------------
    else if (action === 'data_exchange') {
      const flowData = data || {};
      const actionType = flowData.action_type || '';

      // -----------------------------------------------------------------------
      // FLOW WORKFLOW 1: MEMBER SIGN-UP
      // -----------------------------------------------------------------------
      if (actionType === 'sign_up' || flowData.first_name || flowData.confirm_password || screen === 'SIGN_UP') {
        const firstName = (flowData.first_name || '').trim();
        const lastName = (flowData.last_name || '').trim();
        const email = (flowData.email || '').trim().toLowerCase();
        const fullName = `${firstName} ${lastName}`.trim() || 'New Member';
        const password = flowData.password || 'DissafytCapeTown2026!';

        let userId = '';

        if (email) {
          try {
            const admin = getSupabaseAdminClient();
            // Fast direct creation with 2.5s timeout safeguard
            const createPromise = admin.auth.admin.createUser({
              email,
              password,
              email_confirm: true,
              user_metadata: { full_name: fullName },
            });
            const timeoutPromise = new Promise<{ data: any; error: any }>((_, reject) =>
              setTimeout(() => reject(new Error('Auth timeout')), 2500)
            );
            const { data: created, error: createErr } = (await Promise.race([
              createPromise,
              timeoutPromise,
            ])) as any;

            if (created?.user) {
              userId = created.user.id;
            } else if (createErr?.message?.includes('already registered') || createErr?.status === 422) {
              userId = 'existing_user';
            }
          } catch (authErr) {
            console.warn('[Flow Endpoint] Auth user creation note:', authErr);
          }
        }

        // Fire-and-forget audit log so response to Meta is not delayed
        void AuditService.recordLog({
          actor_email: email || 'whatsapp:guest',
          actor_role: 'customer',
          action: 'whatsapp.client_registered',
          entity_type: 'profile',
          entity_id: userId || 'registered',
          changes: { firstName, lastName, email, offers: flowData.offers_acceptance },
        }).catch((err) => console.warn('Audit record note:', err));

        responsePayload = {
          screen: 'SUCCESS',
          data: {
            extension_message_response: {
              params: {
                flow_token: flow_token || `auth_${Date.now()}`,
                status: 'registered',
                name: fullName,
                email,
              },
            },
          },
        };
      }
      // -----------------------------------------------------------------------
      // FLOW WORKFLOW 2: MEMBER SIGN-IN
      // -----------------------------------------------------------------------
      else if (actionType === 'sign_in' || (flowData.email && flowData.password && !flowData.service)) {
        const email = (flowData.email || '').trim().toLowerCase();

        // Fire-and-forget audit log
        void AuditService.recordLog({
          actor_email: email || 'whatsapp:client',
          actor_role: 'customer',
          action: 'whatsapp.client_sign_in_attempt',
          entity_type: 'profile',
          entity_id: 'signin_attempt',
          changes: { email },
        }).catch((err) => console.warn('Audit record note:', err));

        responsePayload = {
          screen: 'SUCCESS',
          data: {
            extension_message_response: {
              params: {
                flow_token: flow_token || `auth_${Date.now()}`,
                status: 'signed_in',
                email,
              },
            },
          },
        };
      }
      // -----------------------------------------------------------------------
      // FLOW WORKFLOW 3: FORGOT PASSWORD
      // -----------------------------------------------------------------------
      else if (actionType === 'forgot_password' || screen === 'FORGOT_PASSWORD') {
        const email = (flowData.email || '').trim().toLowerCase();
        if (email) {
          const admin = getSupabaseAdminClient();
          try {
            await admin.auth.resetPasswordForEmail(email);
          } catch (resetErr) {
            console.warn('[Flow Endpoint] Password reset request:', resetErr);
          }
        }

        responsePayload = {
          screen: 'SUCCESS',
          data: {
            extension_message_response: {
              params: {
                flow_token: flow_token || `auth_${Date.now()}`,
                status: 'reset_link_sent',
                email,
              },
            },
          },
        };
      }
      // -----------------------------------------------------------------------
      // FLOW WORKFLOW 4: POST-HAIRCUT FEEDBACK & REVIEWS
      // -----------------------------------------------------------------------
      else if (actionType === 'feedback' || flowData.rating || screen === 'FEEDBACK') {
        const rating = Number(flowData.rating) || 5;
        const barber = flowData.barber || 'Curtis Lee';
        const comments = flowData.comments || '';
        const highlights = flowData.highlights || [];

        // Asynchronously record audit log & alert Curtis without blocking HTTP response
        void (async () => {
          try {
            await AuditService.recordLog({
              actor_email: 'whatsapp:client',
              actor_role: 'customer',
              action: 'whatsapp.review_submitted',
              entity_type: 'customer_review',
              entity_id: `rev_${Date.now()}`,
              changes: { rating, barber, highlights, comments },
            });

            if (rating <= 3) {
              await WhatsAppService.sendTextMessage(
                CURTIS_PHONE,
                `🚨 *CRITICAL CLIENT FEEDBACK ALERT*\n\n` +
                `• *Rating:* ${rating}/5 Stars ⚠️\n` +
                `• *Barber:* ${barber}\n` +
                `• *Comments:* "${comments || 'No comment provided'}"\n\n` +
                `_Customer requires personal follow-up from Curtis._`
              );
            }
          } catch (err) {
            console.warn('[Flow Endpoint] Review alert note:', err);
          }
        })();

        responsePayload = {
          screen: 'SUCCESS',
          data: {
            extension_message_response: {
              params: {
                flow_token: flow_token || `rev_${Date.now()}`,
                status: 'feedback_received',
                rating: String(rating),
                barber,
              },
            },
          },
        };
      }
      // -----------------------------------------------------------------------
      // FLOW WORKFLOW 5: SUPPORT & APPOINTMENT HELP TICKET
      // -----------------------------------------------------------------------
      else if (actionType === 'support' || flowData.topic || screen === 'SUPPORT_TICKET') {
        const topic = flowData.topic || 'General Support';
        const bookingRef = flowData.booking_ref || 'N/A';
        const details = flowData.details || '';

        // Asynchronously record support ticket & notify Curtis
        void (async () => {
          try {
            await AuditService.recordLog({
              actor_email: 'whatsapp:client',
              actor_role: 'customer',
              action: 'whatsapp.support_inquiry',
              entity_type: 'support_ticket',
              entity_id: `sup_${Date.now()}`,
              changes: { topic, bookingRef, details },
            });

            await WhatsAppService.sendTextMessage(
              CURTIS_PHONE,
              `🆘 *NEW STUDIO SUPPORT INQUIRY*\n\n` +
              `• *Topic:* ${topic}\n` +
              `• *Booking Ref:* ${bookingRef}\n` +
              `• *Message:* "${details || 'No details provided'}"\n\n` +
              `_Customer submitted support request via WhatsApp Flow._`
            );
          } catch (err) {
            console.warn('[Flow Endpoint] Support notify note:', err);
          }
        })();

        responsePayload = {
          screen: 'SUCCESS',
          data: {
            extension_message_response: {
              params: {
                flow_token: flow_token || `sup_${Date.now()}`,
                status: 'ticket_created',
                topic,
              },
            },
          },
        };
      }
      // -----------------------------------------------------------------------
      // FLOW WORKFLOW 6: HAIRCUT APPOINTMENT BOOKING (DEFAULT)
      // -----------------------------------------------------------------------
      else {
        const serviceName = flowData.service || 'Classic Haircut';
        const barberName = flowData.barber || 'Curtis Lee';
        const dateStr = flowData.date;
        const timeStr = flowData.time || '14:00';

        // 1. Resolve appointment date
        let appointmentDate = new Date();
        if (dateStr && timeStr) {
          appointmentDate = new Date(`${dateStr}T${timeStr}:00+02:00`);
        } else {
          appointmentDate.setDate(appointmentDate.getDate() + 1);
          appointmentDate.setHours(14, 0, 0, 0);
        }

        if (isNaN(appointmentDate.getTime()) || appointmentDate <= new Date()) {
          appointmentDate = new Date(Date.now() + 24 * 3600 * 1000);
          appointmentDate.setHours(14, 0, 0, 0);
        }

        // 2. Resolve Service & Staff in Database
        const services = await BarbershopService.listServices();
        const activeServices = services.filter((s) => s.is_active && !s.is_subscription);
        const selectedService = activeServices.find(
          (s) => s.name.toLowerCase() === serviceName.toLowerCase()
        ) || activeServices[0];

        const activeStaff = await BarbershopService.listActiveStaff();
        const selectedBarber = activeStaff.find(
          (b) => b.display_name.toLowerCase().includes(barberName.toLowerCase())
        ) || activeStaff[0];

        // 3. Create Booking Record
        const bookingResult = await BarbershopService.createBooking({
          customer_id: GUEST_USER_ID,
          service_id: selectedService ? selectedService.id : activeServices[0]?.id,
          staff_id: selectedBarber ? selectedBarber.id : null,
          start_time: appointmentDate.toISOString(),
          location_id: 'loc-cpt-flagship',
          notes: `Booked via WhatsApp Flow Endpoint [Flow_ID: ${WHATSAPP_FLOW_ID}] - Barber: ${barberName}`,
          payment_choice: 'payfast',
        });

        const bookingId = bookingResult.booking?.id || `bk_${Date.now()}`;
        const amount = Number(bookingResult.booking?.total_amount || selectedService?.price || 120);

        // 4. Generate PayFast Pay-Me Link
        const payUrl = WhatsAppService.generatePayMeLink({
          bookingId,
          amount,
          itemName: selectedService?.name || serviceName,
          customerName: 'WhatsApp Client',
        });

        // 5. Notify Curtis immediately on his studio WhatsApp
        try {
          const formattedDate = appointmentDate.toLocaleString('en-ZA', {
            timeZone: 'Africa/Johannesburg',
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false,
          });

          await WhatsAppService.sendTextMessage(
            CURTIS_PHONE,
            `💈 *NEW WHATSAPP FLOW BOOKING*\n\n` +
            `• *Booking Ref:* \`${bookingId.slice(0, 8)}\`\n` +
            `• *Service:* ${selectedService?.name || serviceName} (R${amount})\n` +
            `• *Barber:* ${selectedBarber?.display_name || barberName}\n` +
            `• *Time:* ${formattedDate}\n` +
            `• *Payment Link:* ${payUrl}\n\n` +
            `_Client booked natively inside WhatsApp Flow._`
          );
        } catch (notifyErr) {
          console.warn('[Flow Endpoint] Could not alert Curtis:', notifyErr);
        }

        // 6. Complete Flow and return SUCCESS screen as required by Meta Flow protocol
        responsePayload = {
          screen: 'SUCCESS',
          data: {
            extension_message_response: {
              params: {
                flow_token: flow_token || `bk_${Date.now()}`,
                booking_id: bookingId,
                payment_url: payUrl,
                amount: String(amount),
                service: selectedService?.name || serviceName,
                barber: selectedBarber?.display_name || barberName,
              },
            },
          },
        };
      }
    }
    // -------------------------------------------------------------------------
    // ACTION 4: BACK / FALLBACK
    // -------------------------------------------------------------------------
    else {
      responsePayload = {
        screen: 'APPOINTMENT_SELECTION',
        data: {},
      };
    }

    // 3. Encrypt response and return as Base64 text/plain
    const encryptedResponse = FlowCrypto.encryptResponse(responsePayload, aesKey!, iv!);

    return new Response(encryptedResponse, {
      status: 200,
      headers: {
        'Content-Type': 'text/plain',
      },
    });
  } catch (err: any) {
    console.error('[Flow Endpoint Error]', err);

    // If decryption error occurred, return HTTP 421 as mandated by Meta spec
    if (
      err.message?.includes('decryption') ||
      err.message?.includes('OAEP') ||
      err.message?.includes('GCM') ||
      err.code === 'ERR_OSSL_RSA_PADDING_CHECK_FAILED'
    ) {
      return new Response('Decryption failed', { status: 421 });
    }

    return new Response(`Processing error: ${err.message}`, { status: 500 });
  }
}
