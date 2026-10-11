'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  Scissors,
  ShoppingBag,
  CreditCard,
  User,
  Search,
  Plus,
  Minus,
  Trash2,
  RefreshCw,
  LogOut,
  Sparkles,
  Layers,
  MapPin,
  Check,
  AlertCircle,
  Receipt,
  Phone,
  Clock,
  ShieldCheck,
  X,
  CheckCircle,
} from 'lucide-react';
import { ReceiptModal } from '@/app/components/receipt-modal';

interface ServiceItem {
  id: string;
  name: string;
  description: string;
  duration_minutes: number;
  price: number;
}

interface ProductVariant {
  id: string;
  name: string;
  sku: string;
  price: number;
  stock_quantity: number;
}

interface ProductItem {
  id: string;
  name?: string;
  title: string;
  description: string;
  base_price: number;
  is_preorder?: boolean;
  preorder_message?: string | null;
  variants: ProductVariant[];
}

interface StaffMember {
  id: string;
  display_name: string;
  bio?: string;
  avatar_url?: string;
}

interface CartItem {
  cartId: string;
  type: 'service' | 'product';
  id: string; // serviceId or productId
  variant_id?: string;
  name: string;
  price: number;
  quantity: number;
  availableStock?: number;
}

export default function PosRegisterPage() {
  const router = useRouter();

  // Data states
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [staffList, setStaffList] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [operatorEmail, setOperatorEmail] = useState('Staff Operator');

  // Filter & Search states
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'services' | 'apparel' | 'care'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedVariants, setSelectedVariants] = useState<Record<string, string>>({});

  // Active Ticket / Cart states
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedStaffId, setSelectedStaffId] = useState<string>('');
  const [customerName, setCustomerName] = useState('Walk-In Client');
  const [customerPhone, setCustomerPhone] = useState('');
  const [isEditingCustomer, setIsEditingCustomer] = useState(false);

  // Checkout Modal states
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'card_machine' | 'cash' | 'qr'>('card_machine');
  const [slipReference, setSlipReference] = useState('');
  const [submittingCheckout, setSubmittingCheckout] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  // Receipt Modal state
  const [completedReceipt, setCompletedReceipt] = useState<any | null>(null);

  // Pre-Order Collection Modal states
  const [showPreorderModal, setShowPreorderModal] = useState(false);
  const [preorderSearchTerm, setPreorderSearchTerm] = useState('');
  const [preorderOrders, setPreorderOrders] = useState<any[]>([]);
  const [loadingPreorders, setLoadingPreorders] = useState(false);
  const [selectedPreorder, setSelectedPreorder] = useState<any | null>(null);
  const [preorderPaymentMethod, setPreorderPaymentMethod] = useState<'pos_card' | 'pos_cash'>('pos_card');
  const [preorderSettling, setPreorderSettling] = useState(false);
  const [preorderSuccessMsg, setPreorderSuccessMsg] = useState<string | null>(null);
  const [preorderErrorMsg, setPreorderErrorMsg] = useState<string | null>(null);

  // Founder Pass Modal states
  const [showFounderModal, setShowFounderModal] = useState(false);
  const [founderSearchTerm, setFounderSearchTerm] = useState('');
  const [founderPasses, setFounderPasses] = useState<any[]>([]);
  const [loadingFounderPasses, setLoadingFounderPasses] = useState(false);
  const [selectedFounderPass, setSelectedFounderPass] = useState<any | null>(null);
  const [founderActionSuccess, setFounderActionSuccess] = useState<string | null>(null);
  const [founderActionError, setFounderActionError] = useState<string | null>(null);
  const [redeemingCut, setRedeemingCut] = useState(false);

  // Issue pass at POS counter states
  const [founderTab, setFounderTab] = useState<'redeem' | 'issue'>('redeem');
  const [issueName, setIssueName] = useState('');
  const [issueEmail, setIssueEmail] = useState('');
  const [issuePhone, setIssuePhone] = useState('');
  const [issuePaymentMethod, setIssuePaymentMethod] = useState<'pos_card' | 'pos_cash'>('pos_card');
  const [issuingPass, setIssuingPass] = useState(false);

  // Read operator from cookie & enforce staff/admin auth guard
  useEffect(() => {
    const cookies = document.cookie.split(';');
    let operator = '';
    let token = '';
    for (const c of cookies) {
      const [k, v] = c.trim().split('=');
      if (k === 'dissafyt_pos_operator' || k === 'dissafyt_admin_email') {
        operator = decodeURIComponent(v || '');
      }
      if (k === 'dissafyt_pos_token' || k === 'dissafyt_admin_token') {
        token = decodeURIComponent(v || '');
      }
    }

    if (!token && !operator) {
      router.push('/pos/login');
      return;
    }

    setOperatorEmail(operator || 'Staff Operator');
    loadCatalog();
  }, [router]);

  async function loadCatalog() {
    setLoading(true);
    try {
      const res = await fetch('/api/catalog');
      const data = await res.json();
      if (data.success) {
        setServices(data.services || []);
        setProducts(data.products || []);
        setStaffList(data.staff || []);

        if (data.staff && data.staff.length > 0 && !selectedStaffId) {
          setSelectedStaffId(data.staff[0].id);
        }

        // Initialize variant selection with first available in-stock variant
        const initialVariants: Record<string, string> = {};
        for (const p of data.products || []) {
          if (p.variants && p.variants.length > 0) {
            const firstInStock = p.variants.find((v: ProductVariant) => v.stock_quantity > 0) || p.variants[0];
            initialVariants[p.id] = firstInStock.id;
          }
        }
        setSelectedVariants(initialVariants);
      }
    } catch (e) {
      console.error('Error loading catalog:', e);
    } finally {
      setLoading(false);
    }
  }

  // Cart operations
  function addServiceToCart(service: ServiceItem) {
    const cartId = `service-${service.id}`;
    setCart((prev) => {
      const existing = prev.find((item) => item.cartId === cartId);
      if (existing) {
        return prev.map((item) =>
          item.cartId === cartId ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [
        ...prev,
        {
          cartId,
          type: 'service',
          id: service.id,
          name: service.name,
          price: Number(service.price),
          quantity: 1,
        },
      ];
    });
  }

  function addProductToCart(product: ProductItem) {
    const selectedVariantId = selectedVariants[product.id];
    const variant = product.variants.find((v) => v.id === selectedVariantId) || product.variants[0];

    if (!variant) return;
    if (!product.is_preorder && variant.stock_quantity <= 0) return;

    const cartId = `product-${variant.id}`;
    setCart((prev) => {
      const existing = prev.find((item) => item.cartId === cartId);
      if (existing) {
        if (!product.is_preorder && existing.quantity >= variant.stock_quantity) return prev; // Do not exceed live stock
        return prev.map((item) =>
          item.cartId === cartId ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [
        ...prev,
        {
          cartId,
          type: 'product',
          id: product.id,
          variant_id: variant.id,
          name: `${product.title || product.name} (${variant.name})${product.is_preorder ? ' [PRE-ORDER]' : ''}`,
          price: Number(variant.price),
          quantity: 1,
          availableStock: product.is_preorder ? 999 : variant.stock_quantity,
        },
      ];
    });
  }

  function updateQuantity(cartId: string, delta: number) {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.cartId !== cartId) return item;
          const newQty = item.quantity + delta;
          if (item.type === 'product' && item.availableStock && newQty > item.availableStock) {
            return item;
          }
          return { ...item, quantity: newQty };
        })
        .filter((item) => item.quantity > 0)
    );
  }

  function removeItem(cartId: string) {
    setCart((prev) => prev.filter((item) => item.cartId !== cartId));
  }

  function clearCart() {
    setCart([]);
    setCustomerName('Walk-In Client');
    setCustomerPhone('');
    setSlipReference('');
  }

  // Calculate totals
  const totalAmount = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  }, [cart]);

  const totalItemsCount = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.quantity, 0);
  }, [cart]);

  // Checkout submission
  async function handleCompleteSale() {
    setSubmittingCheckout(true);
    setCheckoutError(null);

    try {
      const payload = {
        items: cart.map((item) => ({
          type: item.type,
          id: item.id,
          variant_id: item.variant_id,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
        })),
        customer_name: customerName,
        customer_phone: customerPhone || undefined,
        staff_id: selectedStaffId || null,
        payment_method: paymentMethod,
        slip_reference: slipReference.trim() || undefined,
      };

      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Checkout failed');
      }

      // Build receipt data
      const activeBarber = staffList.find((s) => s.id === selectedStaffId);
      setCompletedReceipt({
        ticket_number: data.ticket_number,
        total: totalAmount,
        items: [...cart],
        payment_reference: data.payment_reference,
        payment_method: paymentMethod,
        barber_name: activeBarber?.display_name,
        operator: operatorEmail,
        customer_name: customerName,
        timestamp: data.timestamp,
      });

      // Clear register ticket and refresh inventory counts
      clearCart();
      setShowCheckoutModal(false);
      loadCatalog();
    } catch (err: any) {
      setCheckoutError(err.message || 'Error executing checkout');
    } finally {
      setSubmittingCheckout(false);
    }
  }

  function handleSignOut() {
    document.cookie = 'dissafyt_pos_token=; path=/; max-age=0';
    document.cookie = 'dissafyt_pos_operator=; path=/; max-age=0';
    document.cookie = 'dissafyt_pos_role=; path=/; max-age=0';
    router.push('/pos/login');
  }

  async function searchPreorderOrders(query?: string) {
    setLoadingPreorders(true);
    setPreorderErrorMsg(null);
    try {
      const res = await fetch('/api/orders?scope=admin');
      if (!res.ok) {
        throw new Error('Failed to load orders');
      }
      const data = await res.json();
      const allOrders: any[] = Array.isArray(data) ? data : [];
      const filtered = allOrders.filter((o) => {
        const hasBalance = Number(o.balance_due || 0) > 0 || o.deposit_status === 'deposit_paid';
        if (!hasBalance) return false;
        if (!query || query.trim() === '') return true;
        const q = query.toLowerCase().trim();
        const num = (o.order_number || '').toLowerCase();
        const name = (o.customer_name || o.shipping_address?.recipient_name || '').toLowerCase();
        const phone = (o.customer_phone || o.shipping_address?.recipient_phone || '').toLowerCase();
        const email = (o.customer_email || o.shipping_address?.recipient_email || '').toLowerCase();
        return num.includes(q) || name.includes(q) || phone.includes(q) || email.includes(q);
      });
      setPreorderOrders(filtered);
    } catch (e: any) {
      setPreorderErrorMsg(e.message || 'Error loading pre-orders');
    } finally {
      setLoadingPreorders(false);
    }
  }

  async function handleSettlePreorderBalance() {
    if (!selectedPreorder) return;
    setPreorderSettling(true);
    setPreorderErrorMsg(null);
    setPreorderSuccessMsg(null);

    try {
      const res = await fetch(`/api/orders/${selectedPreorder.id}/settle`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amountPaid: Number(selectedPreorder.balance_due),
          paymentMethod: preorderPaymentMethod,
          notes: `Settled at Dissafyt Studio POS counter by ${operatorEmail}`,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to settle balance');
      }

      setPreorderSuccessMsg(`Order #${selectedPreorder.order_number} successfully settled! R${Number(selectedPreorder.balance_due).toFixed(2)} received.`);
      setSelectedPreorder(null);
      searchPreorderOrders(preorderSearchTerm);
    } catch (err: any) {
      setPreorderErrorMsg(err.message || 'Error settling balance');
    } finally {
      setPreorderSettling(false);
    }
  }

  async function searchFounderPasses(query?: string) {
    setLoadingFounderPasses(true);
    setFounderActionError(null);
    try {
      const q = query !== undefined ? query : founderSearchTerm;
      const res = await fetch(`/api/founders-pass/lookup?query=${encodeURIComponent(q || '')}`);
      if (!res.ok) throw new Error('Failed to lookup founder passes');
      const data = await res.json();
      setFounderPasses(data.passes || []);
    } catch (e: any) {
      setFounderActionError(e.message || 'Error looking up founder passes');
    } finally {
      setLoadingFounderPasses(false);
    }
  }

  async function handleRedeemFounderCut() {
    if (!selectedFounderPass) return;
    setRedeemingCut(true);
    setFounderActionError(null);
    setFounderActionSuccess(null);
    try {
      const barber = staffList.find((s) => s.id === selectedStaffId)?.display_name || 'Ace Barber';
      const res = await fetch('/api/founders-pass/redeem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          passId: selectedFounderPass.id,
          barberName: barber,
          notes: `Walk-in cut at Studio Register (Operator: ${operatorEmail})`,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to redeem cut');
      }

      setFounderActionSuccess(`Cut #${data.cutNumber} successfully redeemed! ${data.cutsRemaining} cuts remaining on pass.`);
      setSelectedFounderPass((prev: any) =>
        prev
          ? {
              ...prev,
              cuts_used: data.cutNumber,
              cuts_remaining: data.cutsRemaining,
              status: data.cutsRemaining <= 0 ? 'exhausted' : 'active',
            }
          : null
      );
      searchFounderPasses(founderSearchTerm);
    } catch (err: any) {
      setFounderActionError(err.message || 'Error redeeming cut');
    } finally {
      setRedeemingCut(false);
    }
  }

  async function handleIssueFounderPass(e: React.FormEvent) {
    e.preventDefault();
    if (!issueName.trim() || !issueEmail.trim() || !issuePhone.trim()) {
      setFounderActionError('Name, email, and phone number are required.');
      return;
    }

    setIssuingPass(true);
    setFounderActionError(null);
    setFounderActionSuccess(null);
    try {
      const adminRes = await fetch('/api/founders-pass', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: issueName.trim(),
          email: issueEmail.trim(),
          phone: issuePhone.trim(),
          pledgeType: 'pay_now',
          notes: `Purchased at Studio Register (${issuePaymentMethod})`,
        }),
      });

      const data = await adminRes.json();
      if (!adminRes.ok || !data.pass) {
        throw new Error(data.error || 'Failed to issue Founder Pass');
      }

      setFounderActionSuccess(`Founder Pass #${data.pass.pass_number} successfully issued! R1,200 collected. 12 cuts activated.`);
      setIssueName('');
      setIssueEmail('');
      setIssuePhone('');
      searchFounderPasses(data.pass.pass_number);
      setFounderTab('redeem');
    } catch (err: any) {
      setFounderActionError(err.message || 'Error issuing Founder Pass');
    } finally {
      setIssuingPass(false);
    }
  }

  // Filter items
  const filteredServices = useMemo(() => {
    if (selectedCategory === 'apparel' || selectedCategory === 'care') return [];
    return services.filter((s) =>
      s.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [services, selectedCategory, searchQuery]);

  const filteredProducts = useMemo(() => {
    if (selectedCategory === 'services') return [];
    return products.filter((p) => {
      const matchesSearch =
        p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.variants.some((v) => v.sku.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesSearch;
    });
  }, [products, selectedCategory, searchQuery]);

  return (
    <div className="h-screen w-screen flex flex-col bg-zinc-950 text-white overflow-hidden select-none">
      {/* 1. TOP HEADER BAR */}
      <header className="h-14 border-b border-zinc-800 bg-zinc-900/90 px-4 flex items-center justify-between shrink-0">
        <div className="flex items-center space-x-3">
          <div className="h-9 w-9 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Scissors className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-bold text-sm text-white tracking-wide font-serif">DISSAFYT POS</span>
              <span className="text-[10px] bg-amber-500/10 text-amber-400 px-2 py-0.5 rounded font-mono border border-amber-500/20">
                Studio Register
              </span>
            </div>
            <div className="text-[10px] text-zinc-400 flex items-center gap-1">
              <MapPin className="h-2.5 w-2.5 text-amber-500" />
              <span>Dissafyt Studio - Bernie</span>
            </div>
          </div>
        </div>

        {/* Right Operator info & controls */}
        <div className="flex items-center space-x-3 text-xs">
          <div className="hidden sm:flex items-center space-x-2 bg-zinc-950 px-3 py-1.5 rounded-lg border border-zinc-800 text-zinc-300">
            <User className="h-3.5 w-3.5 text-amber-500" />
            <span className="font-medium truncate max-w-[150px]">{operatorEmail}</span>
          </div>

          <button
            onClick={() => {
              setShowPreorderModal(true);
              searchPreorderOrders();
            }}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 transition-all font-semibold cursor-pointer"
            title="Look up pre-order drops and collect balances"
          >
            <Clock className="h-3.5 w-3.5 text-amber-400" />
            <span className="hidden sm:inline">Pre-Order Collections</span>
          </button>

          <button
            onClick={() => {
              setShowFounderModal(true);
              searchFounderPasses();
            }}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-[#ff5500]/10 hover:bg-[#ff5500]/20 text-[#ff5500] border border-[#ff5500]/40 transition-all font-semibold cursor-pointer"
            title="Look up Founder Passes and redeem cuts"
          >
            <Sparkles className="h-3.5 w-3.5 text-[#ff5500]" />
            <span className="hidden sm:inline">Founder Passes (12 Cuts)</span>
          </button>

          <button
            onClick={() => loadCatalog()}
            disabled={loading}
            className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors cursor-pointer"
            title="Refresh Inventory"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin text-amber-400' : ''}`} />
          </button>

          <button
            onClick={handleSignOut}
            className="p-2 rounded-lg bg-zinc-800 hover:bg-rose-950 hover:text-rose-400 text-zinc-300 transition-colors cursor-pointer"
            title="Sign Out"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </header>

      {/* 2. MAIN REGISTER SPLIT VIEW */}
      <div className="flex-1 flex overflow-hidden">
        {/* LEFT COLUMN: CATALOG BROWSER (65%) */}
        <div className="flex-1 flex flex-col border-r border-zinc-800 overflow-hidden bg-zinc-950">
          {/* Filter Bar & Search */}
          <div className="p-3 border-b border-zinc-800 bg-zinc-900/40 flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
            {/* Category Tabs */}
            <div className="flex space-x-1.5 overflow-x-auto scrollbar-none">
              <button
                onClick={() => setSelectedCategory('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  selectedCategory === 'all'
                    ? 'bg-amber-500 text-black font-bold shadow'
                    : 'bg-zinc-800/80 hover:bg-zinc-800 text-zinc-300'
                }`}
              >
                All Items
              </button>
              <button
                onClick={() => setSelectedCategory('services')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                  selectedCategory === 'services'
                    ? 'bg-amber-500 text-black font-bold shadow'
                    : 'bg-zinc-800/80 hover:bg-zinc-800 text-zinc-300'
                }`}
              >
                <Scissors className="h-3 w-3" />
                Grooming Cuts
              </button>
              <button
                onClick={() => setSelectedCategory('apparel')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                  selectedCategory === 'apparel'
                    ? 'bg-amber-500 text-black font-bold shadow'
                    : 'bg-zinc-800/80 hover:bg-zinc-800 text-zinc-300'
                }`}
              >
                <ShoppingBag className="h-3 w-3" />
                Apparel & Merch
              </button>
            </div>

            {/* Search Input */}
            <div className="relative flex-1 sm:max-w-xs">
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-zinc-500" />
              <input
                type="text"
                placeholder="Search cuts or retail..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          {/* Catalog Grid Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-6">
            {/* SERVICES SECTION */}
            {filteredServices.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center space-x-2 text-xs font-bold text-amber-400 uppercase tracking-wider">
                  <Scissors className="h-3.5 w-3.5" />
                  <span>Grooming Services</span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {filteredServices.map((service) => (
                    <button
                      key={service.id}
                      onClick={() => addServiceToCart(service)}
                      className="group p-3.5 rounded-xl border border-zinc-800 bg-zinc-900/60 hover:border-amber-500/60 hover:bg-zinc-900 transition-all text-left flex flex-col justify-between h-28 relative overflow-hidden active:scale-[0.98] cursor-pointer"
                    >
                      <div className="space-y-1">
                        <div className="font-semibold text-xs text-white group-hover:text-amber-300 line-clamp-1">
                          {service.name}
                        </div>
                        <div className="text-[10px] text-zinc-400 line-clamp-2 leading-relaxed">
                          {service.description || 'Master haircut treatment.'}
                        </div>
                      </div>
                      <div className="flex items-center justify-between pt-2 border-t border-zinc-800/80">
                        <span className="text-[10px] text-zinc-500 flex items-center">
                          <Clock className="w-2.5 h-2.5 mr-1 text-zinc-500" />
                          {service.duration_minutes}m
                        </span>
                        <span className="font-bold text-xs text-amber-400 font-mono">
                          R {Number(service.price).toFixed(2)}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* PRODUCTS & MERCHANDISE SECTION */}
            {filteredProducts.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center space-x-2 text-xs font-bold text-amber-400 uppercase tracking-wider">
                  <ShoppingBag className="h-3.5 w-3.5" />
                  <span>Physical Apparel & Retail Merchandise</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {filteredProducts.map((product) => {
                    const currentVariantId = selectedVariants[product.id];
                    const activeVariant =
                      product.variants.find((v) => v.id === currentVariantId) || product.variants[0];
                    const isOutOfStock = !activeVariant || activeVariant.stock_quantity <= 0;

                    return (
                      <div
                        key={product.id}
                        className="p-3.5 rounded-xl border border-zinc-800 bg-zinc-900/60 flex flex-col justify-between space-y-3"
                      >
                        <div className="space-y-1.5">
                          <div className="flex justify-between items-start gap-2">
                            <h3 className="font-semibold text-xs text-white line-clamp-1">{product.title}</h3>
                            <span className="font-mono font-bold text-xs text-white shrink-0">
                              R {Number(activeVariant?.price || product.base_price).toFixed(2)}
                            </span>
                          </div>

                          {/* Variant Selector */}
                          {product.variants.length > 1 && (
                            <div className="flex flex-wrap gap-1.5 pt-1">
                              {product.variants.map((v) => {
                                const isSelected = v.id === currentVariantId;
                                const out = v.stock_quantity <= 0;
                                return (
                                  <button
                                    key={v.id}
                                    disabled={out}
                                    onClick={() =>
                                      setSelectedVariants((prev) => ({ ...prev, [product.id]: v.id }))
                                    }
                                    className={`px-2 py-1 rounded text-[10px] font-medium border transition-all ${
                                      out
                                        ? 'border-zinc-800/60 bg-zinc-950/40 text-zinc-600 line-through cursor-not-allowed'
                                        : isSelected
                                        ? 'border-amber-500 bg-amber-500 text-black font-bold'
                                        : 'border-zinc-800 bg-zinc-900 text-zinc-300 hover:border-zinc-700'
                                    }`}
                                  >
                                    {v.name}
                                  </button>
                                );
                              })}
                            </div>
                          )}
                        </div>

                        {/* Stock & Add Action */}
                        <div className="flex items-center justify-between pt-2 border-t border-zinc-800/80">
                          <div>
                            {product.is_preorder ? (
                              <span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
                                Pre-order Drop
                              </span>
                            ) : isOutOfStock ? (
                              <span className="text-[10px] font-bold text-rose-400 bg-rose-500/10 px-1.5 py-0.5 rounded border border-rose-500/20">
                                Sold Out
                              </span>
                            ) : activeVariant.stock_quantity <= 2 ? (
                              <span className="text-[10px] font-semibold text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
                                {activeVariant.stock_quantity} left (Low)
                              </span>
                            ) : (
                              <span className="text-[10px] font-medium text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                                {activeVariant.stock_quantity} in stock
                              </span>
                            )}
                          </div>

                          <button
                            disabled={!product.is_preorder && isOutOfStock}
                            onClick={() => addProductToCart(product)}
                            className="py-1.5 px-3 rounded-lg bg-amber-500 hover:bg-amber-400 disabled:bg-zinc-800 disabled:text-zinc-600 text-black font-bold text-xs transition-all active:scale-95 cursor-pointer disabled:cursor-not-allowed flex items-center gap-1"
                          >
                            <Plus className="w-3 h-3" />
                            <span>{product.is_preorder ? 'Pre-order' : 'Add'}</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {filteredServices.length === 0 && filteredProducts.length === 0 && (
              <div className="py-16 text-center text-zinc-500 text-xs">
                No services or merchandise found matching "{searchQuery}".
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: ACTIVE TICKET & CART (35%) */}
        <div className="w-80 sm:w-96 flex flex-col bg-zinc-900/90 border-l border-zinc-800 shrink-0">
          {/* Customer & Barber Header */}
          <div className="p-3.5 border-b border-zinc-800 bg-zinc-950/60 space-y-3">
            {/* Client Info */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="h-7 w-7 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-300">
                  <User className="h-3.5 w-3.5" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white leading-none">{customerName}</div>
                  {customerPhone && <div className="text-[10px] text-zinc-500 font-mono mt-0.5">{customerPhone}</div>}
                </div>
              </div>

              <button
                onClick={() => setIsEditingCustomer(!isEditingCustomer)}
                className="text-[10px] text-amber-400 hover:underline cursor-pointer"
              >
                {isEditingCustomer ? 'Done' : 'Edit'}
              </button>
            </div>

            {isEditingCustomer && (
              <div className="space-y-1.5 pt-1 animate-in fade-in duration-150">
                <input
                  type="text"
                  placeholder="Client Name (e.g. John Doe)"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded px-2.5 py-1 text-xs text-white"
                />
                <input
                  type="tel"
                  placeholder="Phone Number (for digital slip)"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded px-2.5 py-1 text-xs text-white font-mono"
                />
              </div>
            )}

            {/* Master Barber Attribution */}
            <div className="space-y-1">
              <label className="text-[10px] text-zinc-400 font-semibold uppercase tracking-wider flex items-center gap-1">
                <Scissors className="w-2.5 h-2.5 text-amber-500" />
                <span>Assigned Barber:</span>
              </label>
              <select
                value={selectedStaffId}
                onChange={(e) => setSelectedStaffId(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-amber-300 font-medium focus:outline-none focus:border-amber-500"
              >
                {staffList.map((barber) => (
                  <option key={barber.id} value={barber.id}>
                    {barber.display_name} (Master Barber)
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-zinc-600 space-y-2">
                <Receipt className="w-10 h-10 stroke-[1.2]" />
                <p className="text-xs font-medium">Ticket is empty</p>
                <p className="text-[10px] max-w-[180px]">
                  Select a haircut service or tap apparel to start a walk-in sale.
                </p>
              </div>
            ) : (
              cart.map((item) => (
                <div
                  key={item.cartId}
                  className="p-2.5 rounded-xl border border-zinc-800 bg-zinc-950/80 flex items-center justify-between text-xs group"
                >
                  <div className="flex-1 pr-2">
                    <div className="font-semibold text-white truncate max-w-[150px]">{item.name}</div>
                    <div className="text-[10px] text-zinc-500 font-mono">
                      R {item.price.toFixed(2)} each
                    </div>
                  </div>

                  {/* Quantity Stepper */}
                  <div className="flex items-center space-x-1.5 bg-zinc-900 border border-zinc-800 rounded-lg p-0.5">
                    <button
                      onClick={() => updateQuantity(item.cartId, -1)}
                      className="h-6 w-6 rounded bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center text-zinc-300 cursor-pointer"
                    >
                      <Minus className="h-3 w-3" />
                    </button>
                    <span className="w-5 text-center font-bold text-xs font-mono">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.cartId, 1)}
                      className="h-6 w-6 rounded bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center text-zinc-300 cursor-pointer"
                    >
                      <Plus className="h-3 w-3" />
                    </button>
                  </div>

                  {/* Item Total & Delete */}
                  <div className="pl-3 text-right">
                    <div className="font-bold text-white font-mono">
                      R {(item.price * item.quantity).toFixed(2)}
                    </div>
                    <button
                      onClick={() => removeItem(item.cartId)}
                      className="text-[10px] text-zinc-600 hover:text-rose-400 transition-colors mt-0.5 cursor-pointer"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Cart Footer & Charge Button */}
          <div className="p-4 border-t border-zinc-800 bg-zinc-950 space-y-3 shrink-0">
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between text-zinc-400">
                <span>Items Count:</span>
                <span className="font-mono text-zinc-200">{totalItemsCount}</span>
              </div>
              <div className="flex justify-between items-baseline pt-1 border-t border-zinc-800">
                <span className="font-bold text-sm text-white">TOTAL DUE:</span>
                <span className="font-mono font-bold text-xl text-amber-400">
                  R {totalAmount.toFixed(2)}
                </span>
              </div>
            </div>

            <button
              disabled={cart.length === 0}
              onClick={() => setShowCheckoutModal(true)}
              className="w-full py-4 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 disabled:opacity-40 disabled:cursor-not-allowed text-black font-bold text-sm shadow-lg shadow-amber-500/10 flex items-center justify-center space-x-2 transition-all cursor-pointer"
            >
              <CreditCard className="w-4 h-4" />
              <span>Charge R {totalAmount.toFixed(2)} (PayFast POS)</span>
            </button>
          </div>
        </div>
      </div>

      {/* 3. PAYFAST CARD MACHINE CHECKOUT MODAL */}
      {showCheckoutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-2xl space-y-5">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[10px] font-mono text-amber-400 uppercase tracking-wider bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                  Step 2 of 2: In-Store Payment
                </span>
                <h2 className="text-xl font-bold text-white font-serif mt-1">
                  Charge via PayFast Card Machine
                </h2>
              </div>
              <button
                onClick={() => setShowCheckoutModal(false)}
                className="text-zinc-500 hover:text-white p-1"
              >
                ✕
              </button>
            </div>

            {/* Total Callout */}
            <div className="p-4 rounded-xl bg-zinc-950 border border-amber-500/30 text-center space-y-1">
              <div className="text-xs text-zinc-400">Present Amount on Terminal:</div>
              <div className="text-3xl font-extrabold text-amber-400 font-mono">
                R {totalAmount.toFixed(2)}
              </div>
              <div className="text-[10px] text-zinc-500">
                Swipe / Chip & PIN / Contactless Tap
              </div>
            </div>

            {/* Terminal Instructions */}
            <div className="space-y-2 text-xs text-zinc-300 bg-zinc-950/60 p-3.5 rounded-xl border border-zinc-800">
              <div className="font-semibold text-white flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>PayFast by Network POS Terminal</span>
              </div>
              <ol className="list-decimal list-inside space-y-1 text-[11px] text-zinc-400">
                <li>Key <strong>R {totalAmount.toFixed(2)}</strong> into your PayFast card machine.</li>
                <li>Customer taps Visa / Mastercard / Apple Pay.</li>
                <li>Once the terminal prints <strong>APPROVED</strong>, note the slip auth code below.</li>
              </ol>
            </div>

            {/* Slip Reference Input */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-300 flex justify-between">
                <span>Card Machine Slip Reference / Auth Code</span>
                <span className="text-[10px] text-zinc-500 font-mono">(Optional for Audit)</span>
              </label>
              <input
                type="text"
                placeholder="e.g. #104928 or last 4 digits"
                value={slipReference}
                onChange={(e) => setSlipReference(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white font-mono placeholder-zinc-600 focus:outline-none focus:border-amber-500"
              />
            </div>

            {checkoutError && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-xs text-rose-400 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{checkoutError}</span>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowCheckoutModal(false)}
                className="flex-1 py-3 rounded-xl border border-zinc-800 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={submittingCheckout}
                onClick={handleCompleteSale}
                className="flex-1 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold shadow-lg shadow-amber-500/20 transition-all cursor-pointer disabled:opacity-50"
              >
                {submittingCheckout ? 'Deducting Stock & Saving...' : 'Confirm Card Approved'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. COMPLETED RECEIPT MODAL */}
      {completedReceipt && (
        <ReceiptModal
          receipt={completedReceipt}
          onClose={() => setCompletedReceipt(null)}
        />
      )}

      {/* 5. PRE-ORDER COLLECTIONS & BALANCE SETTLEMENT MODAL */}
      {showPreorderModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-4xl bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="p-5 border-b border-zinc-800 bg-zinc-950/80 flex items-center justify-between">
              <div>
                <div className="flex items-center space-x-2">
                  <span className="text-[10px] font-mono text-amber-400 uppercase tracking-wider bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                    Studio Pickup & Balance Settlement
                  </span>
                  <span className="text-[10px] text-zinc-400 font-mono">1 Norwalk Way</span>
                </div>
                <h2 className="text-xl font-bold text-white font-serif mt-1">
                  Pre-Order Milestone Collections
                </h2>
                <p className="text-xs text-zinc-400">
                  Search pre-order drop orders, inspect blanks & DTF garments, and collect remaining milestone balances.
                </p>
              </div>
              <button
                onClick={() => {
                  setShowPreorderModal(false);
                  setSelectedPreorder(null);
                  setPreorderSuccessMsg(null);
                  setPreorderErrorMsg(null);
                }}
                className="text-zinc-500 hover:text-white p-2 rounded-lg bg-zinc-800/50 hover:bg-zinc-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Search Bar */}
            <div className="p-4 border-b border-zinc-800 bg-zinc-900/60 flex gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3 top-3 text-zinc-400" />
                <input
                  type="text"
                  placeholder="Search by Order #, Customer Name, Phone, or Email..."
                  value={preorderSearchTerm}
                  onChange={(e) => setPreorderSearchTerm(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') searchPreorderOrders(preorderSearchTerm);
                  }}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-9 pr-4 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500"
                />
              </div>
              <button
                onClick={() => searchPreorderOrders(preorderSearchTerm)}
                disabled={loadingPreorders}
                className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
              >
                {loadingPreorders ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
                <span>Find Orders</span>
              </button>
            </div>

            {/* Content Area: Split View */}
            <div className="flex-1 flex flex-col md:flex-row overflow-hidden divide-y md:divide-y-0 md:divide-x divide-zinc-800">
              {/* Order List Column */}
              <div className="w-full md:w-1/2 overflow-y-auto p-4 space-y-2.5">
                {preorderSuccessMsg && (
                  <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-xs text-emerald-400 flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 shrink-0" />
                    <span>{preorderSuccessMsg}</span>
                  </div>
                )}
                {preorderErrorMsg && (
                  <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-xs text-rose-400 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{preorderErrorMsg}</span>
                  </div>
                )}

                {loadingPreorders ? (
                  <div className="py-12 text-center text-zinc-500 text-xs flex flex-col items-center gap-2">
                    <RefreshCw className="w-5 h-5 animate-spin text-amber-400" />
                    <span>Scanning active pre-orders...</span>
                  </div>
                ) : preorderOrders.length === 0 ? (
                  <div className="py-12 text-center text-zinc-500 text-xs">
                    No orders with outstanding balances found. Try a different search query.
                  </div>
                ) : (
                  preorderOrders.map((order) => {
                    const isSelected = selectedPreorder?.id === order.id;
                    const balance = Number(order.balance_due || 0);
                    return (
                      <div
                        key={order.id}
                        onClick={() => {
                          setSelectedPreorder(order);
                          setPreorderSuccessMsg(null);
                          setPreorderErrorMsg(null);
                        }}
                        className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                          isSelected
                            ? 'border-amber-500 bg-amber-500/10 shadow-lg shadow-amber-500/5'
                            : 'border-zinc-800 bg-zinc-950/60 hover:border-zinc-700 hover:bg-zinc-950'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="font-mono font-bold text-xs text-white">
                              #{order.order_number || order.id.slice(0, 8)}
                            </div>
                            <div className="text-xs text-zinc-300 font-medium mt-0.5">
                              {order.customer_name || order.shipping_address?.recipient_name || 'Customer'}
                            </div>
                            <div className="text-[10px] text-zinc-500 font-mono mt-0.5">
                              {order.customer_phone || order.shipping_address?.recipient_phone || order.customer_email || 'No contact'}
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded font-bold border border-zinc-700 bg-zinc-800 text-zinc-300">
                              {order.fulfillment_choice === 'studio_collection' ? 'Studio Pickup' : 'Courier'}
                            </span>
                            <div className="font-mono font-bold text-xs text-amber-400 mt-1.5">
                              Due: R {balance.toFixed(2)}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Order Detail & Balance Settlement Column */}
              <div className="w-full md:w-1/2 overflow-y-auto p-5 bg-zinc-950/50 flex flex-col justify-between">
                {selectedPreorder ? (
                  <div className="space-y-4">
                    <div>
                      <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400">
                        Selected Order
                      </span>
                      <h3 className="font-bold text-base text-white font-mono">
                        #{selectedPreorder.order_number || selectedPreorder.id.slice(0, 8)}
                      </h3>
                      <div className="text-xs text-zinc-400 mt-1">
                        Client: <strong className="text-zinc-200">{selectedPreorder.customer_name || selectedPreorder.shipping_address?.recipient_name}</strong>
                      </div>
                      <div className="text-xs text-zinc-400">
                        Phone: <span className="font-mono text-zinc-200">{selectedPreorder.customer_phone || selectedPreorder.shipping_address?.recipient_phone || 'None'}</span>
                      </div>
                    </div>

                    {/* Financial Summary */}
                    <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 space-y-2">
                      <div className="flex justify-between text-xs text-zinc-400">
                        <span>Total Garment Value:</span>
                        <span className="font-mono text-zinc-200">R {Number(selectedPreorder.total || 0).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-xs text-emerald-400">
                        <span>Milestone Deposit Paid:</span>
                        <span className="font-mono font-bold">R {Number(selectedPreorder.deposit_paid || 0).toFixed(2)}</span>
                      </div>
                      <div className="pt-2 border-t border-zinc-800 flex justify-between items-baseline">
                        <span className="text-xs font-bold text-white uppercase tracking-wider">Remaining Balance Due:</span>
                        <span className="font-mono font-extrabold text-lg text-amber-400">
                          R {Number(selectedPreorder.balance_due || 0).toFixed(2)}
                        </span>
                      </div>
                    </div>

                    {/* Settlement Controls */}
                    {Number(selectedPreorder.balance_due || 0) > 0 ? (
                      <div className="space-y-3 pt-2">
                        <label className="text-xs font-semibold text-zinc-300 block">
                          Settlement Payment Method:
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => setPreorderPaymentMethod('pos_card')}
                            className={`py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                              preorderPaymentMethod === 'pos_card'
                                ? 'border-amber-500 bg-amber-500/10 text-amber-400'
                                : 'border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-zinc-200'
                            }`}
                          >
                            <CreditCard className="w-3.5 h-3.5" />
                            <span>Card Machine</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setPreorderPaymentMethod('pos_cash')}
                            className={`py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                              preorderPaymentMethod === 'pos_cash'
                                ? 'border-amber-500 bg-amber-500/10 text-amber-400'
                                : 'border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-zinc-200'
                            }`}
                          >
                            <Receipt className="w-3.5 h-3.5" />
                            <span>Studio Cash</span>
                          </button>
                        </div>

                        <button
                          type="button"
                          disabled={preorderSettling}
                          onClick={handleSettlePreorderBalance}
                          className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-black font-bold text-xs shadow-lg shadow-amber-500/20 transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                          {preorderSettling ? (
                            <>
                              <RefreshCw className="w-4 h-4 animate-spin" />
                              <span>Settling & Confirming...</span>
                            </>
                          ) : (
                            <>
                              <CheckCircle className="w-4 h-4" />
                              <span>Collect R {Number(selectedPreorder.balance_due || 0).toFixed(2)} & Handover</span>
                            </>
                          )}
                        </button>
                      </div>
                    ) : (
                      <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-xs text-emerald-400 flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 shrink-0" />
                        <span>Order is fully settled. Garment is cleared for customer handover!</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-center p-6 text-zinc-600 space-y-2">
                    <ShoppingBag className="w-10 h-10 stroke-[1.2]" />
                    <p className="text-xs font-medium text-zinc-400">No Pre-Order Selected</p>
                    <p className="text-[11px] max-w-[220px]">
                      Select an order from the list on the left to inspect customer details and collect remaining balance.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 5. FOUNDER PASS LOOKUP & REDEMPTION MODAL */}
      {showFounderModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-950 border-2 border-[#ff5500]/50 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Header with Tabs */}
            <div className="p-4 border-b border-zinc-800 bg-zinc-900/90 flex items-center justify-between shrink-0">
              <div className="flex items-center space-x-3">
                <div className="h-9 w-9 rounded-xl bg-[#ff5500]/20 border border-[#ff5500]/40 flex items-center justify-center text-[#ff5500]">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-white uppercase tracking-wider font-display">
                    Founder's Circle &bull; 12 Master Cuts Pass
                  </h2>
                  <p className="text-[11px] text-zinc-400">
                    Physical Barbershop Buildout Entitlement &bull; 1 Norwalk Way Counter
                  </p>
                </div>
              </div>

              {/* Tab Selector */}
              <div className="flex items-center space-x-2">
                <div className="flex bg-zinc-950 p-1 rounded-xl border border-zinc-800 text-xs">
                  <button
                    type="button"
                    onClick={() => {
                      setFounderTab('redeem');
                      setFounderActionError(null);
                      setFounderActionSuccess(null);
                    }}
                    className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                      founderTab === 'redeem'
                        ? 'bg-[#ff5500] text-black shadow-sm shadow-[#ff5500]/20'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    Look Up & Redeem
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setFounderTab('issue');
                      setFounderActionError(null);
                      setFounderActionSuccess(null);
                    }}
                    className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                      founderTab === 'issue'
                        ? 'bg-[#ff5500] text-black shadow-sm shadow-[#ff5500]/20'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    + Issue Pass (R1,200)
                  </button>
                </div>

                <button
                  onClick={() => {
                    setShowFounderModal(false);
                    setSelectedFounderPass(null);
                    setFounderActionError(null);
                    setFounderActionSuccess(null);
                  }}
                  className="p-1.5 rounded-lg text-zinc-400 hover:text-white bg-zinc-800/60 hover:bg-zinc-800 cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Content Body */}
            {founderTab === 'redeem' ? (
              <div className="flex-1 overflow-hidden grid grid-cols-1 md:grid-cols-12 divide-y md:divide-y-0 md:divide-x divide-zinc-800">
                {/* Left: Search & Pass List */}
                <div className="md:col-span-5 flex flex-col p-4 space-y-3 overflow-hidden bg-zinc-950">
                  <div className="relative">
                    <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-zinc-500" />
                    <input
                      type="text"
                      placeholder="Pass # (e.g. FP-0029), phone, name, email..."
                      value={founderSearchTerm}
                      onChange={(e) => {
                        setFounderSearchTerm(e.target.value);
                        searchFounderPasses(e.target.value);
                      }}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#ff5500]"
                    />
                  </div>

                  <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                    {loadingFounderPasses ? (
                      <div className="py-8 text-center text-xs text-zinc-500 flex items-center justify-center gap-2">
                        <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#ff5500]" />
                        <span>Searching passes...</span>
                      </div>
                    ) : founderPasses.length === 0 ? (
                      <div className="py-8 text-center text-xs text-zinc-500 space-y-1">
                        <p>No active Founder Passes match search.</p>
                        <p className="text-[10px] text-zinc-600">Type customer phone or click "+ Issue Pass" to register one.</p>
                      </div>
                    ) : (
                      founderPasses.map((p) => {
                        const isSelected = selectedFounderPass?.id === p.id;
                        return (
                          <div
                            key={p.id}
                            onClick={() => {
                              setSelectedFounderPass(p);
                              setFounderActionError(null);
                              setFounderActionSuccess(null);
                            }}
                            className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                              isSelected
                                ? 'border-[#ff5500] bg-[#ff5500]/10'
                                : 'border-zinc-800/80 bg-zinc-900/60 hover:border-zinc-700'
                            }`}
                          >
                            <div className="flex items-center justify-between text-xs font-mono">
                              <span className="font-bold text-[#ff5500]">{p.pass_number}</span>
                              <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                                p.cuts_remaining > 0 ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-zinc-800 text-zinc-500'
                              }`}>
                                {p.cuts_remaining} of 12 Cuts Left
                              </span>
                            </div>
                            <div className="text-xs font-semibold text-white mt-1 truncate">{p.customer_name}</div>
                            <div className="text-[10px] font-mono text-zinc-400 mt-0.5">{p.customer_phone}</div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* Right: Selected Pass Card & Punch Card Redemption */}
                <div className="md:col-span-7 flex flex-col p-6 space-y-4 overflow-y-auto bg-zinc-900/40">
                  {founderActionSuccess && (
                    <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-xs text-emerald-400 flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 shrink-0" />
                      <span>{founderActionSuccess}</span>
                    </div>
                  )}

                  {founderActionError && (
                    <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-xs text-rose-400 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{founderActionError}</span>
                    </div>
                  )}

                  {selectedFounderPass ? (
                    <div className="space-y-4">
                      {/* Pass Header Card */}
                      <div className="rounded-2xl border border-[#ff5500]/40 bg-gradient-to-br from-zinc-950 via-[#181512] to-zinc-950 p-5 space-y-3 shadow-xl">
                        <div className="flex justify-between items-center border-b border-zinc-800 pb-2.5">
                          <div>
                            <span className="text-[10px] font-mono uppercase tracking-widest text-[#ff5500] font-bold">
                              FOUNDER'S PASS &bull; PATRON ENTITLEMENT
                            </span>
                            <h3 className="text-base font-bold text-white mt-0.5">
                              {selectedFounderPass.customer_name}
                            </h3>
                          </div>
                          <span className="font-mono text-sm font-bold bg-zinc-900 border border-zinc-700 px-3 py-1 rounded-lg text-white">
                            {selectedFounderPass.pass_number}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-xs font-mono text-zinc-300">
                          <div>
                            <span className="text-zinc-500 text-[10px] block">Contact:</span>
                            <span>{selectedFounderPass.customer_phone}</span>
                          </div>
                          <div>
                            <span className="text-zinc-500 text-[10px] block">Status:</span>
                            <span className="text-emerald-400 font-bold uppercase">{selectedFounderPass.status}</span>
                          </div>
                        </div>

                        {/* Punch Card Matrix */}
                        <div className="pt-2 border-t border-zinc-800/80">
                          <div className="flex justify-between items-center text-xs font-mono mb-2">
                            <span className="text-zinc-400">12 Cuts Punch Card</span>
                            <span className="text-[#ff5500] font-bold">
                              {selectedFounderPass.cuts_remaining} of 12 Cuts Remaining
                            </span>
                          </div>
                          <div className="grid grid-cols-6 gap-2">
                            {Array.from({ length: 12 }).map((_, i) => {
                              const isUsed = i < (selectedFounderPass.cuts_used || 0);
                              return (
                                <div
                                  key={i}
                                  className={`h-9 rounded-lg border flex flex-col items-center justify-center font-mono text-[10px] ${
                                    isUsed
                                      ? 'border-zinc-800 bg-zinc-900/60 text-zinc-600 line-through'
                                      : 'border-[#ff5500]/60 bg-[#ff5500]/10 text-white font-bold shadow-sm shadow-[#ff5500]/10'
                                  }`}
                                >
                                  <span>#{i + 1}</span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>

                      {/* Action to Redeem */}
                      {selectedFounderPass.cuts_remaining > 0 ? (
                        <div className="space-y-2 pt-2">
                          <button
                            type="button"
                            disabled={redeemingCut}
                            onClick={handleRedeemFounderCut}
                            className="w-full py-4 px-6 rounded-xl bg-gradient-to-r from-[#ff5500] via-amber-500 to-[#ff7700] hover:brightness-110 text-black font-extrabold text-xs uppercase tracking-wider transition-all shadow-xl shadow-[#ff5500]/25 cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
                          >
                            {redeemingCut ? (
                              <>
                                <RefreshCw className="w-4 h-4 animate-spin text-black" />
                                <span>Redeeming Cut #{selectedFounderPass.cuts_used + 1}...</span>
                              </>
                            ) : (
                              <>
                                <Scissors className="w-4 h-4 text-black" />
                                <span>Redeem Haircut (Cut #{selectedFounderPass.cuts_used + 1} of 12) &bull; R0.00</span>
                              </>
                            )}
                          </button>
                          <p className="text-[10px] text-center text-zinc-500 font-mono">
                            Redeeming will immediately decrement the punch card balance and log the transaction.
                          </p>
                        </div>
                      ) : (
                        <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 text-center text-xs text-zinc-500">
                          All 12 cuts on this Founder Pass have been redeemed!
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center text-center p-6 text-zinc-600 space-y-2">
                      <Sparkles className="w-10 h-10 stroke-[1.2] text-zinc-700" />
                      <p className="text-xs font-medium text-zinc-400">No Founder Pass Selected</p>
                      <p className="text-[11px] max-w-[240px]">
                        Select a pass from the left or search by customer name/phone to inspect available cut punch-card balance.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              /* Tab 2: Issue / Sell Founder Pass at Counter */
              <form onSubmit={handleIssueFounderPass} className="p-6 space-y-4 max-w-lg mx-auto w-full">
                <div className="text-center space-y-1 mb-2">
                  <h3 className="font-display text-lg font-bold text-white uppercase">
                    Issue Founder Pass at Register
                  </h3>
                  <p className="text-xs text-zinc-400">
                    Collect R1,200 for 12 prepaid haircuts and credit to the physical buildout capital pool.
                  </p>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-semibold text-zinc-300 block mb-1">Patron Full Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Jason Adams"
                      value={issueName}
                      onChange={(e) => setIssueName(e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-[#ff5500]"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-semibold text-zinc-300 block mb-1">Email Address</label>
                      <input
                        type="email"
                        required
                        placeholder="patron@gmail.com"
                        value={issueEmail}
                        onChange={(e) => setIssueEmail(e.target.value)}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-[#ff5500]"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-zinc-300 block mb-1">WhatsApp / Phone</label>
                      <input
                        type="tel"
                        required
                        placeholder="082 123 4567"
                        value={issuePhone}
                        onChange={(e) => setIssuePhone(e.target.value)}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder-zinc-600 font-mono focus:outline-none focus:border-[#ff5500]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-zinc-300 block mb-1">Payment Method</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setIssuePaymentMethod('pos_card')}
                        className={`p-3 rounded-xl border text-center font-bold text-xs transition-all cursor-pointer ${
                          issuePaymentMethod === 'pos_card'
                            ? 'border-[#ff5500] bg-[#ff5500]/10 text-white'
                            : 'border-zinc-800 bg-zinc-900 text-zinc-400'
                        }`}
                      >
                        Card Terminal (PayFast)
                      </button>
                      <button
                        type="button"
                        onClick={() => setIssuePaymentMethod('pos_cash')}
                        className={`p-3 rounded-xl border text-center font-bold text-xs transition-all cursor-pointer ${
                          issuePaymentMethod === 'pos_cash'
                            ? 'border-[#ff5500] bg-[#ff5500]/10 text-white'
                            : 'border-zinc-800 bg-zinc-900 text-zinc-400'
                        }`}
                      >
                        Studio Cash (R1,200)
                      </button>
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={issuingPass}
                  className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#ff5500] to-amber-500 hover:brightness-110 text-black font-extrabold text-xs uppercase tracking-wider transition-all shadow-lg shadow-[#ff5500]/25 cursor-pointer disabled:opacity-50 mt-2"
                >
                  {issuingPass ? 'Issuing & Crediting Capital...' : 'Collect R1,200 & Activate 12 Cuts Pass'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
