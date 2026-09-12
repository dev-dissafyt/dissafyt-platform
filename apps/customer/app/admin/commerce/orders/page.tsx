'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, Button, Input } from '@dissafyt/ui';
import { Package, Truck, Clock, CheckCircle2, ArrowLeft, RefreshCw, Search, Phone, MapPin, ChevronRight, X } from 'lucide-react';
import { adminFetch } from '@/lib/operator';

interface OrderItem {
  id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

interface Order {
  id: string;
  order_number: string;
  status: string;
  subtotal: number;
  total: number;
  created_at: string;
  customer_name?: string;
  customer_email?: string;
  order_items: OrderItem[];
  shipping_address?: {
    recipient_name?: string;
    recipient_phone?: string;
    street_address?: string;
    suburb?: string;
    city?: string;
    province?: string;
    postal_code?: string;
  };
}

const STATUS_OPTIONS = [
  'pending_payment',
  'paid',
  'processing',
  'shipped',
  'completed',
  'cancelled',
];

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  async function loadOrders() {
    setLoading(true);
    try {
      const res = await adminFetch('/api/orders');
      if (res.ok) setOrders(await res.json());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadOrders();
  }, []);

  async function handleUpdateStatus(orderId: string, newStatus: string) {
    setStatusMsg(null);
    try {
      const res = await adminFetch(`/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (res.ok) {
        setStatusMsg(`Order updated to '${newStatus}'.`);
        loadOrders();
        if (selectedOrder && selectedOrder.id === orderId) {
          setSelectedOrder({ ...selectedOrder, status: newStatus });
        }
      } else {
        const err = await res.json();
        setStatusMsg(`Failed: ${err.error}`);
      }
    } catch {
      setStatusMsg('Network error while updating order status.');
    }
  }

  const filteredOrders = orders.filter((o) => {
    const q = searchTerm.toLowerCase();
    return (
      o.order_number.toLowerCase().includes(q) ||
      (o.customer_email && o.customer_email.toLowerCase().includes(q)) ||
      (o.shipping_address?.recipient_name && o.shipping_address.recipient_name.toLowerCase().includes(q))
    );
  });

  const paidCount = orders.filter((o) => o.status === 'paid').length;
  const processingCount = orders.filter((o) => o.status === 'processing').length;
  const shippedCount = orders.filter((o) => o.status === 'shipped').length;

  return (
    <div className="space-y-8">
      {/* Top row */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-sm text-stone-400 mb-1">
            <Link href="/commerce" className="hover:text-white">Commerce</Link>
            <span>/</span>
            <span className="text-amber-500 font-medium">Orders</span>
          </div>
          <h1 className="text-3xl font-bold text-white flex items-center">
            <Package className="mr-3 h-8 w-8 text-amber-500" />
            Orders & Courier Fulfillment
          </h1>
          <p className="text-sm text-stone-400">
            Fulfill clothing orders, inspect delivery addresses, and manage shipment progress.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={loadOrders}
          className="border-stone-700 text-stone-300 hover:bg-stone-800"
        >
          <RefreshCw className="mr-2 h-4 w-4" /> Refresh Orders
        </Button>
      </div>

      {statusMsg && (
        <div className="rounded-md border border-amber-500/20 bg-amber-500/10 p-3 text-sm text-amber-300">
          {statusMsg}
        </div>
      )}

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card className="border-stone-800 bg-stone-900/60 p-4">
          <div className="text-xs text-stone-400">Total Orders</div>
          <div className="text-2xl font-bold text-white mt-1">{orders.length}</div>
        </Card>
        <Card className="border-stone-800 bg-stone-900/60 p-4">
          <div className="text-xs text-stone-400">Paid & Awaiting Fulfillment</div>
          <div className="text-2xl font-bold text-amber-400 mt-1">{paidCount}</div>
        </Card>
        <Card className="border-stone-800 bg-stone-900/60 p-4">
          <div className="text-xs text-stone-400">In Preparation (Processing)</div>
          <div className="text-2xl font-bold text-blue-400 mt-1">{processingCount}</div>
        </Card>
        <Card className="border-stone-800 bg-stone-900/60 p-4">
          <div className="text-xs text-stone-400">Shipped with Courier Guy</div>
          <div className="text-2xl font-bold text-emerald-400 mt-1">{shippedCount}</div>
        </Card>
      </div>

      {/* Filter Bar */}
      <div className="flex items-center space-x-3 max-w-md">
        <div className="relative w-full">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-stone-500" />
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search order number or recipient..."
            className="pl-9 bg-stone-900 border-stone-700"
          />
        </div>
      </div>

      {/* Orders Table */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card className="border-stone-800 bg-stone-900/50">
            <CardHeader>
              <CardTitle className="text-lg text-white">Orders List ({filteredOrders.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="py-12 text-center text-stone-500">Loading orders...</div>
              ) : filteredOrders.length === 0 ? (
                <div className="py-12 text-center text-stone-500">No orders placed yet.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm text-stone-300">
                    <thead className="border-b border-stone-800 text-xs uppercase text-stone-500">
                      <tr>
                        <th className="py-3 px-3">Order</th>
                        <th className="py-3 px-3">Recipient</th>
                        <th className="py-3 px-3">Total (ZAR)</th>
                        <th className="py-3 px-3">Status</th>
                        <th className="py-3 px-3 text-right">Details</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-800">
                      {filteredOrders.map((order) => {
                        const isSelected = selectedOrder?.id === order.id;
                        return (
                          <tr
                            key={order.id}
                            onClick={() => setSelectedOrder(order)}
                            className={`cursor-pointer transition-colors ${
                              isSelected ? 'bg-stone-800/80' : 'hover:bg-stone-800/40'
                            }`}
                          >
                            <td className="py-3 px-3 font-medium text-white">
                              <div>{order.order_number}</div>
                              <div className="text-[10px] text-stone-500">
                                {new Date(order.created_at).toLocaleDateString()}
                              </div>
                            </td>
                            <td className="py-3 px-3 text-stone-300">
                              <div>{order.shipping_address?.recipient_name || order.customer_name}</div>
                              <div className="text-xs text-stone-500">
                                {order.shipping_address?.city || 'No City'}
                              </div>
                            </td>
                            <td className="py-3 px-3 font-bold text-amber-400">
                              R {Number(order.total).toFixed(2)}
                            </td>
                            <td className="py-3 px-3">
                              <span
                                className={`rounded px-2 py-0.5 text-xs font-semibold uppercase tracking-wider ${
                                  order.status === 'paid'
                                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                    : order.status === 'shipped'
                                    ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                                    : order.status === 'processing'
                                    ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                                    : 'bg-stone-800 text-stone-400'
                                }`}
                              >
                                {order.status.replace('_', ' ')}
                              </span>
                            </td>
                            <td className="py-3 px-3 text-right text-stone-500">
                              <ChevronRight className="inline h-4 w-4" />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Order Details Drawer / Panel */}
        <div>
          {selectedOrder ? (
            <Card className="border-stone-800 bg-stone-900/70 p-6 space-y-6 sticky top-6">
              <div className="flex items-center justify-between border-b border-stone-800 pb-4">
                <div>
                  <h3 className="font-bold text-lg text-white">{selectedOrder.order_number}</h3>
                  <p className="text-xs text-stone-500">
                    {new Date(selectedOrder.created_at).toLocaleString()}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedOrder(null)}
                  className="text-stone-500 hover:text-white"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Status Selector */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-stone-400 uppercase tracking-wider">
                  Update Fulfillment Status:
                </label>
                <select
                  value={selectedOrder.status}
                  onChange={(e) => handleUpdateStatus(selectedOrder.id, e.target.value)}
                  className="flex h-10 w-full rounded-md border border-stone-700 bg-stone-950 px-3 py-2 text-sm text-amber-400 font-semibold"
                >
                  {STATUS_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt.replace('_', ' ').toUpperCase()}
                    </option>
                  ))}
                </select>
              </div>

              {/* Items Breakdown */}
              <div className="space-y-2 border-t border-stone-800 pt-4">
                <div className="text-xs font-semibold text-stone-400 uppercase tracking-wider">
                  Purchased Apparel ({selectedOrder.order_items?.length || 0})
                </div>
                <div className="divide-y divide-stone-800 text-xs text-stone-300">
                  {selectedOrder.order_items?.map((item) => (
                    <div key={item.id} className="py-2 flex justify-between items-center">
                      <div>
                        <div className="font-medium text-white">{item.product_name}</div>
                        <div className="text-stone-500">Qty: {item.quantity}</div>
                      </div>
                      <div className="font-mono text-amber-400">
                        R {Number(item.total_price).toFixed(2)}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex justify-between font-bold text-sm text-white pt-2 border-t border-stone-800">
                  <span>Order Total</span>
                  <span className="text-amber-400">R {Number(selectedOrder.total).toFixed(2)}</span>
                </div>
              </div>

              {/* Courier Guy Delivery Address */}
              {selectedOrder.shipping_address && (
                <div className="space-y-2 border-t border-stone-800 pt-4 text-xs text-stone-300">
                  <div className="font-semibold text-stone-400 uppercase tracking-wider flex items-center">
                    <Truck className="mr-1.5 h-4 w-4 text-amber-500" />
                    Courier Guy Waybill Info
                  </div>
                  <div className="bg-stone-950/60 p-3 rounded-md border border-stone-800 space-y-1">
                    <div className="font-semibold text-white">
                      {selectedOrder.shipping_address.recipient_name}
                    </div>
                    <div className="flex items-center text-amber-400 font-mono">
                      <Phone className="h-3 w-3 mr-1" />
                      {selectedOrder.shipping_address.recipient_phone}
                    </div>
                    <div className="text-stone-400 pt-1">
                      {selectedOrder.shipping_address.street_address}
                    </div>
                    <div className="text-stone-400">
                      {selectedOrder.shipping_address.suburb}, {selectedOrder.shipping_address.city}
                    </div>
                    <div className="text-stone-500">
                      {selectedOrder.shipping_address.province} &bull; {selectedOrder.shipping_address.postal_code}
                    </div>
                  </div>
                </div>
              )}
            </Card>
          ) : (
            <div className="p-8 border border-dashed border-stone-800 rounded-lg text-center text-stone-600 text-sm">
              Select an order from the list to view fulfillment details and Courier Guy delivery data.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
