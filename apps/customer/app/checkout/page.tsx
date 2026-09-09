'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, Button, Input, Label } from '@dissafyt/ui';
import { ShoppingBag, ArrowLeft, Trash2, ShieldCheck, Truck, Lock } from 'lucide-react';
import { getSupabaseBrowserClient } from '@dissafyt/database';

interface CartItem {
  productId: string;
  variantId?: string | null;
  productName: string;
  variantName?: string;
  price: number;
  quantity: number;
  image?: string;
}

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
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Shipping Address State (Courier Guy spec)
  const [recipientName, setRecipientName] = useState('');
  const [recipientPhone, setRecipientPhone] = useState('');
  const [recipientEmail, setRecipientEmail] = useState('');
  const [streetAddress, setStreetAddress] = useState('');
  const [suburb, setSuburb] = useState('');
  const [city, setCity] = useState('');
  const [province, setProvince] = useState('Gauteng');
  const [postalCode, setPostalCode] = useState('');

  useEffect(() => {
    const stored = localStorage.getItem('dissafyt_cart');
    if (stored) {
      try {
        setCart(JSON.parse(stored));
      } catch (e) {
        console.error(e);
      }
    }

    // Prefill profile if user logged in
    async function prefillUser() {
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
      setLoading(false);
    }
    prefillUser();
  }, []);

  function updateQuantity(index: number, newQty: number) {
    if (newQty <= 0) {
      removeFromCart(index);
      return;
    }
    const updated = [...cart];
    updated[index].quantity = newQty;
    setCart(updated);
    localStorage.setItem('dissafyt_cart', JSON.stringify(updated));
  }

  function removeFromCart(index: number) {
    const updated = cart.filter((_, i) => i !== index);
    setCart(updated);
    localStorage.setItem('dissafyt_cart', JSON.stringify(updated));
  }

  const subtotal = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);

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
        shippingAddress: {
          recipient_name: recipientName,
          recipient_phone: recipientPhone,
          recipient_email: recipientEmail,
          street_address: streetAddress,
          suburb,
          city,
          province,
          postal_code: postalCode,
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

      // Clear local cart
      localStorage.removeItem('dissafyt_cart');

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
          <Card className="border-zinc-800 bg-zinc-900/60 p-6">
            <CardHeader className="p-0 mb-6">
              <CardTitle className="text-xl text-white flex items-center">
                <Truck className="mr-2 h-5 w-5 text-amber-500" />
                Delivery Information
              </CardTitle>
              <CardDescription>
                Shipping fulfilled nationwide via The Courier Guy door-to-door.
              </CardDescription>
            </CardHeader>

            <form id="checkout-form" onSubmit={handleProceedToPayment} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label htmlFor="recipientName">Recipient Name</Label>
                  <Input
                    id="recipientName"
                    value={recipientName}
                    onChange={(e) => setRecipientName(e.target.value)}
                    placeholder="Full recipient name"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="recipientPhone">Mobile Number (for Delivery SMS)</Label>
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
                <Label htmlFor="recipientEmail">Email Address (for Order Confirmation & Tracking)</Label>
                <Input
                  id="recipientEmail"
                  type="email"
                  value={recipientEmail}
                  onChange={(e) => setRecipientEmail(e.target.value)}
                  placeholder="name@example.com"
                  required
                />
              </div>

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
                {cart.map((item, index) => (
                  <div key={`${item.productId}-${index}`} className="py-3 flex items-center justify-between text-sm">
                    <div>
                      <div className="font-medium text-white">{item.productName}</div>
                      <div className="text-xs text-zinc-400">
                        {item.variantName} &bull; Qty: {item.quantity}
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className="font-bold text-amber-400">
                        R {(item.price * item.quantity).toFixed(2)}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeFromCart(index)}
                        className="text-zinc-500 hover:text-red-400"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-t border-zinc-800 pt-4 space-y-2">
                <div className="flex justify-between text-sm text-zinc-400">
                  <span>Subtotal</span>
                  <span>R {subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm text-zinc-400">
                  <span>Courier Delivery</span>
                  <span className="text-emerald-400 font-medium">Door-to-door</span>
                </div>
                <div className="flex justify-between text-base font-bold text-white pt-2 border-t border-zinc-800">
                  <span>Total (ZAR)</span>
                  <span className="text-amber-400 text-xl">R {subtotal.toFixed(2)}</span>
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
                    <Lock className="mr-2 h-4 w-4" /> Pay with PayFast (R {subtotal.toFixed(2)})
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
