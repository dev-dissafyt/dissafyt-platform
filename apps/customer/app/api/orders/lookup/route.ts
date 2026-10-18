import { NextRequest, NextResponse } from 'next/server';
import { AuthService, OrderService } from '@dissafyt/api';
import { getClientIp, checkRateLimit } from '@/lib/rate-limiter';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

function maskEmail(email?: string | null): string | undefined {
  if (!email) return undefined;
  const [local, domain] = email.split('@');
  if (!domain) return '***';
  const safeLocal = local.length <= 2 ? `${local[0] || '*'}*` : `${local.slice(0, 2)}***`;
  return `${safeLocal}@${domain}`;
}

function maskPhone(phone?: string | null): string | undefined {
  if (!phone) return undefined;
  const clean = phone.trim();
  if (clean.length <= 4) return '****';
  return `${'*'.repeat(Math.max(4, clean.length - 4))}${clean.slice(-4)}`;
}

/**
 * GET /api/orders/lookup?orderNumber=DIS-2026-XXXX
 * Public order lookup endpoint for post-checkout confirmation.
 * Redacts full street address, phone, and email unless authenticated as the order owner or platform admin.
 */
export async function GET(request: NextRequest) {
  const ip = getClientIp(request);
  const rateCheck = checkRateLimit(ip, 'order_lookup', {
    windowMs: 5 * 60 * 1000, // 5 minutes
    maxRequests: 25,         // max 25 lookups per 5 minutes per IP
  });

  if (!rateCheck.allowed) {
    return NextResponse.json(
      { error: `Too many lookup requests. Please wait ${rateCheck.waitSeconds} seconds.` },
      { status: 429 }
    );
  }

  const { searchParams } = new URL(request.url);
  const orderNumber = searchParams.get('orderNumber');

  if (!orderNumber) {
    return NextResponse.json({ error: 'orderNumber parameter is required' }, { status: 400 });
  }

  const order = await OrderService.getOrderByNumber(orderNumber);
  if (!order) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 });
  }

  // Check if caller is authenticated as the order owner or an admin
  let isAuthorizedOwnerOrAdmin = false;
  const authHeader = request.headers.get('Authorization');
  const token =
    (authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null) ||
    request.cookies.get('dissafyt_admin_token')?.value ||
    null;

  if (token) {
    const authCtx = await AuthService.verifyToken(token);
    if (authCtx) {
      const userEmail = (authCtx.email || '').toLowerCase();
      const isAdmin =
        userEmail === 'curtislee@dissafyt.com' ||
        userEmail === 'dissafyt@gmail.com' ||
        (authCtx.roles || []).includes('admin') ||
        (authCtx.roles || []).includes('staff');
      const isOwner =
        Boolean(order.user_id && authCtx.userId === order.user_id) ||
        Boolean(order.customer_email && userEmail && order.customer_email.toLowerCase() === userEmail);
      isAuthorizedOwnerOrAdmin = isAdmin || isOwner;
    }
  }

  const rawShipping = (order.shipping_address || {}) as Record<string, any>;
  const safeShippingAddress = isAuthorizedOwnerOrAdmin
    ? order.shipping_address
    : order.shipping_address
    ? {
        recipient_name: rawShipping.recipient_name ? String(rawShipping.recipient_name).split(' ')[0] : undefined,
        recipient_phone: maskPhone(rawShipping.recipient_phone),
        recipient_email: maskEmail(rawShipping.recipient_email),
        suburb: rawShipping.suburb,
        city: rawShipping.city,
        province: rawShipping.province,
        postal_code: rawShipping.postal_code,
      }
    : null;

  return NextResponse.json({
    id: order.id,
    order_number: order.order_number,
    status: order.status,
    subtotal: order.subtotal,
    total: order.total,
    deposit_paid: order.deposit_paid,
    balance_due: order.balance_due,
    deposit_status: order.deposit_status,
    fulfillment_choice: order.fulfillment_choice,
    collection_location_id: order.collection_location_id,
    created_at: order.created_at,
    shipping_address: safeShippingAddress,
    customer_name: isAuthorizedOwnerOrAdmin
      ? order.customer_name
      : order.customer_name
      ? String(order.customer_name).split(' ')[0]
      : undefined,
    customer_email: isAuthorizedOwnerOrAdmin ? order.customer_email : maskEmail(order.customer_email),
    order_items: (order as any).order_items || [],
  });
}
