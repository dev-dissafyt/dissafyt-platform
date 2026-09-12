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
  title: string;
  description: string;
  base_price: number;
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

  // Read operator from cookie
  useEffect(() => {
    const cookies = document.cookie.split(';');
    for (const c of cookies) {
      const [k, v] = c.trim().split('=');
      if (k === 'dissafyt_pos_operator' || k === 'dissafyt_admin_email') {
        setOperatorEmail(decodeURIComponent(v || 'Staff Operator'));
        break;
      }
    }
    loadCatalog();
  }, []);

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
    if (variant.stock_quantity <= 0) return;

    const cartId = `product-${variant.id}`;
    setCart((prev) => {
      const existing = prev.find((item) => item.cartId === cartId);
      if (existing) {
        if (existing.quantity >= variant.stock_quantity) return prev; // Do not exceed live stock
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
          name: `${product.title} (${variant.name})`,
          price: Number(variant.price),
          quantity: 1,
          availableStock: variant.stock_quantity,
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
    router.push('/login');
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
              <span>Cape Town Flagship Studio</span>
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
                            {isOutOfStock ? (
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
                            disabled={isOutOfStock}
                            onClick={() => addProductToCart(product)}
                            className="py-1.5 px-3 rounded-lg bg-amber-500 hover:bg-amber-400 disabled:bg-zinc-800 disabled:text-zinc-600 text-black font-bold text-xs transition-all active:scale-95 cursor-pointer disabled:cursor-not-allowed flex items-center gap-1"
                          >
                            <Plus className="w-3 h-3" />
                            <span>Add</span>
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
    </div>
  );
}
