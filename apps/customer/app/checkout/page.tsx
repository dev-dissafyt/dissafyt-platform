'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, Button, Input, Label } from '@dissafyt/ui';
import { ShoppingBag, ArrowLeft, Trash2, ShieldCheck, Truck, Lock, Plus, Minus, Store, PackageCheck, Clock } from 'lucide-react';
import { getSupabaseBrowserClient } from '@dissafyt/database';
import { useCart } from '../context/cart-context';

const SA_PROVINCES = [
  'Gauteng',
  'Western Cape',
  'KwaZulu-Natal',
  'Eastern Cape',
  'Free State',
  'Limpopo',
  'Mpumalanga',
  'North West',
  'Northern Cape',
];

export default function CheckoutPage() {
  const { items: cart, subtotal, updateQuantity, removeItem, clearCart, isHydrated } = useCart();
  const [profileLoading, setProfileLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [fulfillmentChoice, setFulfillmentChoice] = useState<'courier' | 'studio_collection'>('courier');

  // Shipping Address State (Courier Guy spec)
  const [recipientName, setRecipientName] = useState('');
  const [recipientPhone, setRecipientPhone] = useState('');
  const [recipientEmail, setRecipientEmail] = useState('');
  const [streetAddress, setStreetAddress] = useState('');
  const [suburb, setSuburb] = useState('');
  const [city, setCity] = useState('');
  const [province, setProvince] = useState('Western Cape');
  const [postalCode, setPostalCode] = useState('');

  // Milestone Deposit Calculations
  const hasPreorderItems = cart.some((i) => i.isPreorder);
  const depositDueToday = cart.reduce((acc, item) => {
    if (item.isPreorder) {
      const pct = item.preorderDepositPct ? Math.min(Math.max(item.preorderDepositPct, 10), 100) : 50;
      return acc + (item.price * item.quantity * (pct / 100));
    }
    return acc + (item.price * item.quantity);
  }, 0);
  const balanceDueLater = Math.max(0, subtotal - depositDueToday);
  const totalPayableToday = depositDueToday;

  useEffect(() => {
    // Prefill profile if user logged in
    async function prefillUser() {
      try {
        const supabase = getSupabaseBrowserClient();
        const { data } = await supabase.auth.getSession();
        if (data?.session) {
          if (data.session.user?.email) {
            setRecipientEmail(data.session.user.email);
          }
          const token = data.session.access_token;
          const res = await fetch('/api/users/me', {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (res.ok) {
            const profile = await res.json();
            if (profile.full_name) setRecipientName(profile.full_name);
            if (profile.phone) setRecipientPhone(profile.phone);
            if (profile.email) setRecipientEmail(profile.email);
          }
        }
      } catch (e) {
        console.error('Error fetching user profile for checkout:', e);
      } finally {
        setProfileLoading(false);
      }
    }
    prefillUser();
  }, []);

  const loading = !isHydrated || profileLoading;

  async function handleProceedToPayment(e: React.FormEvent) {
    e.preventDefault();
    if (cart.length === 0) return;

    setSubmitting(true);
    setErrorMsg(null);

    try {
      const supabase = getSupabaseBrowserClient();
      const { data } = await supabase.auth.getSession();
      const token = data?.session?.access_token;

      const orderPayload = {
        items: cart.map((i) => ({
          product_id: i.productId,
          variant_id: i.variantId || null,
          quantity: i.quantity,
        })),
        fulfillmentChoice,
        collectionLocationId: 'loc-cpt-flagship',
        shippingAddress: {
          recipient_name: recipientName,
          recipient_phone: recipientPhone,
          recipient_email: recipientEmail,
          street_address: fulfillmentChoice === 'studio_collection' ? (streetAddress || '1 Norwalk Way') : streetAddress,
          suburb: fulfillmentChoice === 'studio_collection' ? (suburb || 'Bernadino Heights') : suburb,
          city: fulfillmentChoice === 'studio_collection' ? (city || 'Cape Town') : city,
          province: fulfillmentChoice === 'studio_collection' ? (province || 'Western Cape') : province,
          postal_code: fulfillmentChoice === 'studio_collection' ? (postalCode || '7570') : postalCode,
          country: 'South Africa',
        },
      };

      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(orderPayload),
      });

      const result = await res.json();
      if (!res.ok || !result.payfast) {
        setErrorMsg(result.error || 'Failed to initialize order.');
        setSubmitting(false);
        return;
      }

      // Clear reactive cart
      clearCart();

      // Dynamically submit the PayFast HTML form
      const form = document.createElement('form');
      form.method = 'POST';
      form.action = result.payfast.action;

      for (const [key, value] of Object.entries(result.payfast.fields)) {
        if (value !== undefined && value !== null) {
          const input = document.createElement('input');
          input.type = 'hidden';
          input.name = key;
          input.value = String(value);
          form.appendChild(input);
        }
      }

      document.body.appendChild(form);
      form.submit();
    } catch (err: any) {
      setErrorMsg(err.message || 'Error communicating with checkout service.');
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto max-w-4xl px-4 py-20 text-center text-zinc-500">
        Loading checkout...
      </div>
    );
  }

  if (cart.length === 0) {
    return (
      <div className="container mx-auto max-w-3xl px-4 py-20 text-center space-y-4">
        <ShoppingBag className="mx-auto h-12 w-12 text-zinc-600" />
        <h1 className="text-2xl font-bold text-white">Your Cart is Empty</h1>
        <p className="text-zinc-400">Discover fresh apparel in our clothing catalog.</p>
        <Link href="/shop">
          <Button className="bg-amber-500 hover:bg-amber-400 text-black font-semibold">
            Explore Clothing Catalog
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-5xl px-4 py-12 space-y-8">
      <Link href="/shop" className="inline-flex items-center text-sm text-zinc-400 hover:text-white">
        <ArrowLeft className="mr-1.5 h-4 w-4" /> Continue Shopping
      </Link>

      <h1 className="text-3xl font-extrabold text-white">Order Checkout</h1>

      {errorMsg && (
        <div className="rounded-md border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-400">
          {errorMsg}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Shipping Form Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Fulfillment Method Selector */}
          <Card className="border-zinc-800 bg-zinc-900/60 p-6">
            <CardHeader className="p-0 mb-4">
              <CardTitle className="text-xl text-white flex items-center">
                <PackageCheck className="mr-2 h-5 w-5 text-amber-500" />
                Fulfillment & Handover Method
              </CardTitle>
              <CardDescription>
                Choose whether to collect in-person at our flagship studio or have your garments couriered door-to-door.
              </CardDescription>
            </CardHeader>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Studio Collection */}
              <div
                onClick={() => setFulfillmentChoice('studio_collection')}
                className={`cursor-pointer rounded-lg border p-4 transition-all ${
                  fulfillmentChoice === 'studio_collection'
                    ? 'border-amber-500 bg-amber-500/10 shadow-[0_0_20px_rgba(245,158,11,0.15)]'
                    : 'border-zinc-800 bg-zinc-950/60 hover:border-zinc-700'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-2">
                    <Store className={`h-5 w-5 ${fulfillmentChoice === 'studio_collection' ? 'text-amber-400' : 'text-zinc-400'}`} />
                    <span className="font-bold text-white text-sm">Studio Collection</span>
                  </div>
                  <span className="rounded bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold uppercase text-emerald-400 border border-emerald-500/30">
                    FREE
                  </span>
                </div>
                <p className="mt-2 text-xs text-zinc-400">
                  Dissafyt Studio &bull; Cape Town Flagship
                  <br />
                  <span className="text-zinc-500">1 Norwalk Way, Bernadino Heights</span>
                </p>
                {hasPreorderItems && (
                  <p className="mt-2 text-[11px] text-amber-400/90 font-medium border-t border-zinc-800/80 pt-2">
                    &bull; Pay 50% deposit today. Settle balance (R {balanceDueLater.toFixed(2)}) at Studio POS counter via Card or Cash upon collection.
                  </p>
                )}
              </div>

              {/* Courier Guy Delivery */}
              <div
                onClick={() => setFulfillmentChoice('courier')}
                className={`cursor-pointer rounded-lg border p-4 transition-all ${
                  fulfillmentChoice === 'courier'
                    ? 'border-amber-500 bg-amber-500/10 shadow-[0_0_20px_rgba(245,158,11,0.15)]'
                    : 'border-zinc-800 bg-zinc-950/60 hover:border-zinc-700'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-2">
                    <Truck className={`h-5 w-5 ${fulfillmentChoice === 'courier' ? 'text-amber-400' : 'text-zinc-400'}`} />
                    <span className="font-bold text-white text-sm">Door-to-Door Courier</span>
                  </div>
                  <span className="rounded bg-zinc-800 px-2 py-0.5 text-[10px] font-bold uppercase text-zinc-300">
                    The Courier Guy
                  </span>
                </div>
                <p className="mt-2 text-xs text-zinc-400">
                  Nationwide secure courier delivery directly to your door.
                </p>
                {hasPreorderItems && (
                  <p className="mt-2 text-[11px] text-amber-400/90 font-medium border-t border-zinc-800/80 pt-2">
                    &bull; Pay 50% deposit today. Settle remaining balance online before final courier dispatch.
                  </p>
                )}
              </div>
            </div>
          </Card>

          {/* Delivery or Collection Details */}
          <Card className="border-zinc-800 bg-zinc-900/60 p-6">
            <CardHeader className="p-0 mb-6">
              <CardTitle className="text-xl text-white flex items-center">
                {fulfillmentChoice === 'studio_collection' ? (
                  <>
                    <Store className="mr-2 h-5 w-5 text-amber-500" />
                    Collector Information
                  </>
                ) : (
                  <>
                    <Truck className="mr-2 h-5 w-5 text-amber-500" />
                    Delivery Information
                  </>
                )}
              </CardTitle>
              <CardDescription>
                {fulfillmentChoice === 'studio_collection'
                  ? 'We will contact you via SMS & Email when your order is ready for pickup at 1 Norwalk Way.'
                  : 'Shipping fulfilled nationwide via The Courier Guy door-to-door.'}
              </CardDescription>
            </CardHeader>

            {fulfillmentChoice === 'studio_collection' && (
              <div className="mb-6 rounded-lg border border-amber-500/30 bg-amber-500/10 p-4 space-y-1 text-xs">
                <div className="font-bold text-amber-400 flex items-center gap-1.5">
                  <Store className="h-4 w-4" />
                  <span>Flagship Studio Handover Point</span>
                </div>
                <div className="text-zinc-200">
                  Dissafyt Studio &bull; 1 Norwalk Way, Bernadino Heights, Kraaifontein, 7570
                </div>
                <div className="text-zinc-400 text-[11px] pt-1">
                  Operating Hours: Mon - Sat 08:30 - 18:00 &bull; Sun 09:00 - 14:00
                </div>
              </div>
            )}

            <form id="checkout-form" onSubmit={handleProceedToPayment} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label htmlFor="recipientName">
                    {fulfillmentChoice === 'studio_collection' ? 'Collector Full Name' : 'Recipient Name'}
                  </Label>
                  <Input
                    id="recipientName"
                    value={recipientName}
                    onChange={(e) => setRecipientName(e.target.value)}
                    placeholder="Full name"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="recipientPhone">Mobile Number (for Ready SMS)</Label>
                  <Input
                    id="recipientPhone"
                    value={recipientPhone}
                    onChange={(e) => setRecipientPhone(e.target.value)}
                    placeholder="082 123 4567"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label htmlFor="recipientEmail">Email Address (for Status & Receipts)</Label>
                <Input
                  id="recipientEmail"
                  type="email"
                  value={recipientEmail}
                  onChange={(e) => setRecipientEmail(e.target.value)}
                  placeholder="name@example.com"
                  required
                />
              </div>

              {fulfillmentChoice === 'courier' && (
                <>
                  <div className="space-y-1">
                    <Label htmlFor="streetAddress">Street Address</Label>
                    <Input
                      id="streetAddress"
                      value={streetAddress}
                      onChange={(e) => setStreetAddress(e.target.value)}
                      placeholder="Street name, house/building number, unit"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <Label htmlFor="suburb">Suburb</Label>
                      <Input
                        id="suburb"
                        value={suburb}
                        onChange={(e) => setSuburb(e.target.value)}
                        placeholder="e.g. Sandton, Rosebank, Camps Bay"
                        required
                      />
                    </div>

                    <div className="space-y-1">
                      <Label htmlFor="city">City / Town</Label>
                      <Input
                        id="city"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        placeholder="e.g. Cape Town, Stellenbosch, Durban"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <Label htmlFor="province">Province</Label>
                      <select
                        id="province"
                        value={province}
                        onChange={(e) => setProvince(e.target.value)}
                        className="flex h-10 w-full rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-200"
                      >
                        {SA_PROVINCES.map((prov) => (
                          <option key={prov} value={prov}>
                            {prov}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1">
                      <Label htmlFor="postalCode">Postal Code</Label>
                      <Input
                        id="postalCode"
                        value={postalCode}
                        onChange={(e) => setPostalCode(e.target.value)}
                        placeholder="e.g. 2196"
                        required
                      />
                    </div>
                  </div>
                </>
              )}
            </form>
          </Card>
        </div>

        {/* Order Summary Column */}
        <div className="space-y-6">
          <Card className="border-zinc-800 bg-zinc-900/60 p-6">
            <CardHeader className="p-0 mb-4">
              <CardTitle className="text-lg text-white">Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="p-0 space-y-4">
              <div className="divide-y divide-zinc-800">
                {cart.map((item) => (
                  <div key={item.id} className="py-3 flex items-center justify-between text-sm gap-3">
                    <div className="flex items-center space-x-3 min-w-0">
                      {item.image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={item.image}
                          alt={item.productName}
                          className="h-12 w-12 rounded-lg object-cover border border-zinc-800 flex-shrink-0 bg-zinc-950"
                        />
                      ) : (
                        <div className="h-12 w-12 rounded-lg bg-zinc-950 border border-zinc-800 flex items-center justify-center flex-shrink-0 text-zinc-600">
                          <ShoppingBag className="h-5 w-5" />
                        </div>
                      )}
                      <div className="min-w-0">
                        <div className="font-medium text-white truncate">{item.productName}</div>
                        <div className="text-xs text-zinc-400 flex flex-wrap items-center gap-1.5 mt-0.5">
                          {item.color && (
                            <span className="inline-flex items-center gap-1 rounded bg-zinc-800/80 px-1.5 py-0.5 text-[10px] font-mono text-zinc-300">
                              {item.colorHex && (
                                <span
                                  className="h-2 w-2 rounded-full border border-white/20"
                                  style={{ backgroundColor: item.colorHex }}
                                />
                              )}
                              <span>{item.color}</span>
                            </span>
                          )}
                          <span className="rounded bg-zinc-800/80 px-1.5 py-0.5 text-[10px] font-mono text-zinc-300">
                            {item.size || item.variantName || 'Standard'}
                          </span>
                          {item.isPreorder && (
                            <span className="rounded border border-amber-500/40 bg-amber-500/10 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-amber-400">
                              Pre-order
                            </span>
                          )}
                          <span>R {item.price.toFixed(2)} ea</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3 flex-shrink-0">
                      <div className="inline-flex items-center rounded border border-zinc-800 bg-zinc-950">
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="p-1 text-zinc-400 hover:text-white transition-colors"
                          aria-label="Decrease quantity"
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="min-w-[20px] text-center font-mono text-xs font-bold text-white">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="p-1 text-zinc-400 hover:text-white transition-colors"
                          aria-label="Increase quantity"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>

                      <span className="font-bold text-amber-400 min-w-[70px] text-right font-mono text-xs sm:text-sm">
                        R {(item.price * item.quantity).toFixed(2)}
                      </span>

                      <button
                        type="button"
                        onClick={() => removeItem(item.id)}
                        className="text-zinc-500 hover:text-red-400 transition-colors p-1"
                        aria-label={`Remove ${item.productName}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-t border-zinc-800 pt-4 space-y-2">
                <div className="flex justify-between text-sm text-zinc-400">
                  <span>Total Garment Value</span>
                  <span>R {subtotal.toFixed(2)}</span>
                </div>

                {hasPreorderItems && (
                  <>
                    <div className="flex justify-between text-sm text-emerald-400">
                      <span>Production Deposit (e.g. 50%)</span>
                      <span>- R {depositDueToday.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-xs text-zinc-400">
                      <span>Balance Due Upon Handover</span>
                      <span className="font-mono text-zinc-300">R {balanceDueLater.toFixed(2)}</span>
                    </div>
                  </>
                )}

                <div className="flex justify-between text-sm text-zinc-400">
                  <span>Fulfillment</span>
                  <span className="text-emerald-400 font-medium">
                    {fulfillmentChoice === 'studio_collection' ? 'Free Studio Pickup' : 'Door-to-door Courier'}
                  </span>
                </div>

                <div className="flex justify-between text-base font-bold text-white pt-2 border-t border-zinc-800">
                  <span>{hasPreorderItems ? 'Deposit Due Today (ZAR)' : 'Total (ZAR)'}</span>
                  <span className="text-amber-400 text-xl">R {totalPayableToday.toFixed(2)}</span>
                </div>
              </div>

              <Button
                type="submit"
                form="checkout-form"
                disabled={submitting}
                className="w-full bg-amber-500 hover:bg-amber-400 text-black font-bold h-11 text-base mt-4"
              >
                {submitting ? (
                  'Connecting to PayFast...'
                ) : (
                  <span className="flex items-center justify-center">
                    <Lock className="mr-2 h-4 w-4" />{' '}
                    {hasPreorderItems
                      ? `Pay Deposit with PayFast (R ${totalPayableToday.toFixed(2)})`
                      : `Pay with PayFast (R ${totalPayableToday.toFixed(2)})`}
                  </span>
                )}
              </Button>

              <div className="flex items-center justify-center space-x-2 text-xs text-zinc-500 pt-2">
                <ShieldCheck className="h-4 w-4 text-emerald-400" />
                <span>Encrypted PayFast Gateway &bull; South Africa</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
