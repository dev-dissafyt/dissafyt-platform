import { getSupabaseAdminClient, Payment } from '@dissafyt/database';

export interface FounderPassPatronRecord {
  id: string;
  passNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  status: string;
  cutsUsed: number;
  totalCuts: number;
  amountPaid: number;
  paymentMethod?: string;
  createdAt: string;
}

export interface FounderPassMetrics {
  totalTarget: number;
  totalCapitalTarget: number;
  totalPasses: number;
  activePaidPasses: number;
  pendingPledges: number;
  currentCapitalRaised: number;
  pctFunded: number;
  spotsRemaining: number;
  totalCutsRedeemed: number;
  recentPatrons: FounderPassPatronRecord[];
}

export interface OperationalMetrics {
  overview: {
    totalRevenue: number;
    commerceRevenue: number;
    preorderRevenue: number;
    inStockCommerceRevenue: number;
    barbershopRevenue: number;
    subscriptionRevenue: number;
    walkInRevenue: number;
    founderPassRevenue?: number;
    serviceValueDelivered: number;
    totalCustomers: number;
    totalOrders: number;
    totalBookings: number;
    preorderOrdersCount: number;
    preorderUnitsCount: number;
  };
  founderPass: FounderPassMetrics;
  orders: {
    total: number;
    pending: number;
    paid: number;
    processing: number;
    shipped: number;
    delivered: number;
    cancelled: number;
    preorderCount: number;
  };
  bookings: {
    total: number;
    confirmed: number;
    completed: number;
    cancelled: number;
    noShow: number;
    todayCount: number;
    upcomingCount: number;
  };
  barberPerformance: {
    staffId: string;
    displayName: string;
    completedCuts: number;
    upcomingCuts: number;
  }[];
  recentActivity: {
    id: string;
    type: 'order' | 'booking' | 'founder_pass';
    title: string;
    subtitle: string;
    amount: number;
    status: string;
    timestamp: string;
    isPreorder?: boolean;
  }[];
}

export interface PaymentAuditRecord extends Payment {
  customer_name?: string | null;
  customer_email?: string | null;
}

export class ReportingService {
  /**
   * Aggregates live operational metrics across both Commerce and Barbershop modules.
   */
  static async getOperationalMetrics(): Promise<OperationalMetrics> {
    const admin = getSupabaseAdminClient();

    // 1. Fetch profiles count
    const { count: customerCount } = await admin
      .from('profiles')
      .select('*', { count: 'exact', head: true });

    // 2. Fetch authoritative settled payments (Ledger-based Single Source of Truth)
    const { data: payments } = await admin
      .from('payments')
      .select('*')
      .order('created_at', { ascending: false });

    const paymentList = payments || [];
    // Only count genuine settled payments (exclude mock/test records)
    const livePaid = paymentList.filter(
      (p) => (p.status === 'paid' || p.status === 'completed') && p.is_test !== true
    );

    let subscriptionRevenue = 0;
    let commerceRevenue = 0;
    let walkInRevenue = 0;
    let founderPassRevenueFromPayments = 0;

    for (const p of livePaid) {
      const amt = Number(p.amount) || 0;
      if (p.related_type === 'subscription') {
        subscriptionRevenue += amt;
      } else if (p.related_type === 'order') {
        commerceRevenue += amt;
      } else if (p.related_type === 'booking') {
        walkInRevenue += amt;
      } else if (p.related_type === 'founder_pass' || (p.item_name && p.item_name.toLowerCase().includes('founder'))) {
        founderPassRevenueFromPayments += amt;
      }
    }

    // 2b. Fetch Founder Passes (Buildout Capital Single Source of Truth)
    const { data: founderPasses } = await admin
      .from('founder_passes')
      .select('*')
      .order('created_at', { ascending: false });

    const fpList = founderPasses || [];
    const activePaidPasses = fpList.filter((p) => p.status === 'active' || p.status === 'exhausted');
    const pendingPledges = fpList.filter((p) => p.status === 'pending_payment');
    const capitalFromPasses = activePaidPasses.reduce((acc, p) => acc + (Number(p.amount_paid) || 1200), 0);
    const currentCapitalRaised = Math.max(capitalFromPasses, founderPassRevenueFromPayments);
    const totalCutsRedeemed = fpList.reduce((acc, p) => acc + (Number(p.cuts_used) || 0), 0);
    const pctFunded = Math.min(100, Math.round((currentCapitalRaised / 60000) * 100));
    const spotsRemaining = Math.max(0, 50 - activePaidPasses.length);

    const founderPass: FounderPassMetrics = {
      totalTarget: 50,
      totalCapitalTarget: 60000,
      totalPasses: fpList.length,
      activePaidPasses: activePaidPasses.length,
      pendingPledges: pendingPledges.length,
      currentCapitalRaised,
      pctFunded,
      spotsRemaining,
      totalCutsRedeemed,
      recentPatrons: fpList.slice(0, 10).map((p) => ({
        id: p.id,
        passNumber: p.pass_number,
        customerName: p.customer_name,
        customerEmail: p.customer_email,
        customerPhone: p.customer_phone,
        status: p.status,
        cutsUsed: p.cuts_used || 0,
        totalCuts: p.total_cuts || 12,
        amountPaid: Number(p.amount_paid) || 0,
        paymentMethod: p.payment_method || 'payfast',
        createdAt: p.created_at,
      })),
    };

    const totalRevenue = subscriptionRevenue + commerceRevenue + walkInRevenue + currentCapitalRaised;
    const barbershopRevenue = subscriptionRevenue + walkInRevenue + currentCapitalRaised;

    // 3. Fetch all orders with items to inspect preorders
    const { data: orders } = await admin
      .from('orders')
      .select('id, order_number, user_id, status, total, created_at, order_items(id, unit_price, quantity, total_price, is_preorder)')
      .order('created_at', { ascending: false });

    const orderList = orders || [];
    const orderStatusCounts = {
      pending: 0,
      paid: 0,
      processing: 0,
      shipped: 0,
      delivered: 0,
      cancelled: 0,
    };

    let preorderOrdersCount = 0;
    let preorderUnitsCount = 0;
    let preorderRevenue = 0;

    for (const ord of orderList) {
      const st = ord.status.toLowerCase();
      if (st in orderStatusCounts) {
        orderStatusCounts[st as keyof typeof orderStatusCounts]++;
      } else if (st === 'pending_payment') {
        orderStatusCounts.pending++;
      }

      const items = (ord as any).order_items || [];
      const hasPreorder = items.some((i: any) => i.is_preorder === true);

      if (hasPreorder) {
        preorderOrdersCount++;
        for (const i of items) {
          if (i.is_preorder) {
            preorderUnitsCount += Number(i.quantity) || 0;
            if (['paid', 'processing', 'shipped', 'delivered', 'completed'].includes(st)) {
              preorderRevenue += Number(i.total_price) || 0;
            }
          }
        }
      }
    }

    const inStockCommerceRevenue = Math.max(0, commerceRevenue - preorderRevenue);

    // 4. Fetch all bookings with staff & services
    const { data: bookings } = await admin
      .from('bookings')
      .select(`
        id, customer_id, staff_id, start_time, status, total_amount, created_at,
        service:services(name, price),
        staff:staff(id, display_name)
      `)
      .order('created_at', { ascending: false });

    const bookingList = bookings || [];
    let serviceValueDelivered = 0;
    const bookingStatusCounts = {
      confirmed: 0,
      completed: 0,
      cancelled: 0,
      noShow: 0,
      todayCount: 0,
      upcomingCount: 0,
    };

    const now = new Date();
    const todayStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0)).toISOString();
    const todayEnd = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 23, 59, 59)).toISOString();

    for (const bk of bookingList) {
      const svcVal = Number((bk as any).service?.price || bk.total_amount) || 0;
      const st = bk.status.toLowerCase();
      if (st === 'confirmed' || st === 'completed') {
        serviceValueDelivered += svcVal;
      }
      if (st === 'confirmed') bookingStatusCounts.confirmed++;
      else if (st === 'completed') bookingStatusCounts.completed++;
      else if (st === 'cancelled') bookingStatusCounts.cancelled++;
      else if (st === 'no_show') bookingStatusCounts.noShow++;

      if (st !== 'cancelled') {
        if (bk.start_time >= todayStart && bk.start_time <= todayEnd) {
          bookingStatusCounts.todayCount++;
        }
        if (bk.start_time >= todayStart) {
          bookingStatusCounts.upcomingCount++;
        }
      }
    }

    // 5. Barber Performance
    const { data: staffList } = await admin
      .from('staff')
      .select('id, display_name')
      .eq('is_active', true);

    const barberPerformance = (staffList || []).map((barber) => {
      const barberBookings = bookingList.filter((b) => b.staff_id === barber.id);
      const completed = barberBookings.filter((b) => b.status === 'completed').length;
      const upcoming = barberBookings.filter(
        (b) => (b.status === 'confirmed' || b.status === 'pending') && b.start_time >= todayStart
      ).length;
      return {
        staffId: barber.id,
        displayName: barber.display_name,
        completedCuts: completed,
        upcomingCuts: upcoming,
      };
    });

    // 6. Interleaved Recent Activity Stream
    const activityFeed: OperationalMetrics['recentActivity'] = [];

    // Add recent orders
    for (const ord of orderList.slice(0, 10)) {
      const items = (ord as any).order_items || [];
      const isPreorder = items.some((i: any) => i.is_preorder === true);

      activityFeed.push({
        id: ord.id,
        type: 'order',
        title: `Order #${ord.order_number}`,
        subtitle: isPreorder
          ? `Pre-order batch drop (${ord.status})`
          : `In-stock commerce order (${ord.status})`,
        amount: Number(ord.total) || 0,
        status: ord.status,
        timestamp: ord.created_at,
        isPreorder,
      });
    }

    // Add recent bookings
    for (const bk of bookingList.slice(0, 10)) {
      const svcName = (bk as any).service?.name || 'Haircut & Grooming';
      const barberName = (bk as any).staff?.display_name || 'Master Barber';
      activityFeed.push({
        id: bk.id,
        type: 'booking',
        title: `${svcName} - ${barberName}`,
        subtitle: `Booked for ${new Date(bk.start_time).toLocaleString('en-ZA', {
          timeZone: 'Africa/Johannesburg',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
        })}`,
        amount: Number(bk.total_amount) || 0,
        status: bk.status,
        timestamp: bk.created_at,
      });
    }

    // Add recent founder passes to activity stream
    for (const fp of fpList.slice(0, 10)) {
      const isPaid = fp.status === 'active' || fp.status === 'exhausted';
      activityFeed.push({
        id: fp.id,
        type: 'founder_pass',
        title: `Founder Pass #${fp.pass_number} • ${fp.customer_name}`,
        subtitle: isPaid ? '12 Cuts VIP Pass Active' : 'Pledge Reserved • Awaiting Payment',
        amount: Number(fp.amount_paid) || (isPaid ? 1200 : 0),
        status: fp.status,
        timestamp: fp.created_at,
      });
    }

    // Sort combined feed by timestamp descending
    activityFeed.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    return {
      overview: {
        totalRevenue,
        commerceRevenue,
        preorderRevenue,
        inStockCommerceRevenue,
        barbershopRevenue,
        subscriptionRevenue,
        walkInRevenue,
        founderPassRevenue: currentCapitalRaised,
        serviceValueDelivered,
        totalCustomers: customerCount || 0,
        totalOrders: orderList.length,
        totalBookings: bookingList.length,
        preorderOrdersCount,
        preorderUnitsCount,
      },
      founderPass,
      orders: {
        total: orderList.length,
        ...orderStatusCounts,
        preorderCount: preorderOrdersCount,
      },
      bookings: {
        total: bookingList.length,
        ...bookingStatusCounts,
      },
      barberPerformance,
      recentActivity: activityFeed.slice(0, 10),
    };
  }

  /**
   * Retrieves unified payment audit history with customer and target details.
   */
  static async getPaymentAuditLog(): Promise<PaymentAuditRecord[]> {
    const admin = getSupabaseAdminClient();

    const { data: payments, error } = await admin
      .from('payments')
      .select('*')
      .order('created_at', { ascending: false });

    if (error || !payments) {
      console.error('Error fetching payments:', error);
      return [];
    }

    // Enrich with user profile details
    const userIds = [...new Set(payments.map((p) => p.user_id).filter(Boolean))];
    let profileMap = new Map<string, { full_name?: string | null; email?: string }>();

    if (userIds.length > 0) {
      const { data: profiles } = await admin
        .from('profiles')
        .select('id, full_name, email')
        .in('id', userIds);

      if (profiles) {
        profiles.forEach((p) => profileMap.set(p.id, p));
      }
    }

    return payments.map((pay) => {
      const prof = profileMap.get(pay.user_id);
      return {
        ...pay,
        customer_name: prof?.full_name || null,
        customer_email: prof?.email || null,
      };
    });
  }
}
