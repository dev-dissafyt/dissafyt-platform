'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, Button, Input, Label } from '@dissafyt/ui';
import { Scissors, Plus, Trash2, CheckCircle, XCircle, Clock, CreditCard, RefreshCw } from 'lucide-react';

interface Service {
  id: string;
  name: string;
  description: string;
  duration_minutes: number;
  price: number;
  is_active: boolean;
  is_subscription?: boolean;
  plan_code?: string | null;
}

export default function AdminBarbershopPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  // Form State
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [duration, setDuration] = useState('30');
  const [price, setPrice] = useState('');
  const [isSubscription, setIsSubscription] = useState(false);
  const [planCode, setPlanCode] = useState('solo');
  const [submitting, setSubmitting] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  async function loadServices() {
    setLoading(true);
    try {
      const res = await fetch('/api/services');
      if (res.ok) setServices(await res.json());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadServices();
  }, []);

  async function handleCreateService(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setStatusMsg(null);

    try {
      const res = await fetch('/api/services', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          description,
          duration_minutes: parseInt(duration, 10) || 30,
          price: parseFloat(price),
          is_subscription: isSubscription,
          plan_code: isSubscription ? planCode : null,
          billing_frequency: 3, // monthly in PayFast
          billing_cycles: 12,
          is_active: true,
        }),
      });

      if (res.ok) {
        setStatusMsg('Service / Subscription created successfully!');
        setName('');
        setDescription('');
        setPrice('');
        setShowAddModal(false);
        loadServices();
      } else {
        const err = await res.json();
        setStatusMsg(`Failed: ${err.error}`);
      }
    } catch {
      setStatusMsg('Network error while saving service.');
    } finally {
      setSubmitting(false);
    }
  }

  async function toggleServiceStatus(service: Service) {
    try {
      await fetch(`/api/services/${service.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !service.is_active }),
      });
      loadServices();
    } catch (e) {
      console.error(e);
    }
  }

  async function handleDeleteService(id: string) {
    if (!confirm('Are you sure you want to delete this service?')) return;
    try {
      await fetch(`/api/services/${id}`, { method: 'DELETE' });
      loadServices();
    } catch (e) {
      console.error(e);
    }
  }

  return (
    <div className="space-y-8">
      {/* Top action row */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center">
            <Scissors className="mr-3 h-8 w-8 text-amber-500" />
            Barbershop Services & Subscriptions
          </h1>
          <p className="text-sm text-stone-400">
            Configure Ace of Fyt appointment services and recurring PayFast monthly memberships.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <Button
            variant="outline"
            size="sm"
            onClick={loadServices}
            className="border-stone-700 text-stone-300 hover:bg-stone-800"
          >
            <RefreshCw className="mr-2 h-4 w-4" /> Refresh
          </Button>
          <Button
            size="sm"
            onClick={() => setShowAddModal(true)}
            className="bg-amber-500 hover:bg-amber-400 text-black font-semibold"
          >
            <Plus className="mr-2 h-4 w-4" /> Add Service / Membership
          </Button>
        </div>
      </div>

      {statusMsg && (
        <div className="rounded-md border border-amber-500/20 bg-amber-500/10 p-3 text-sm text-amber-300">
          {statusMsg}
        </div>
      )}

      {/* Add Service Modal Form */}
      {showAddModal && (
        <Card className="border-stone-700 bg-stone-900/95 p-6 border shadow-2xl">
          <CardHeader className="p-0 mb-6">
            <CardTitle className="text-xl text-white">Add Barbershop Service or Membership</CardTitle>
            <CardDescription>
              Services are available for client booking or recurring subscription on the public site.
            </CardDescription>
          </CardHeader>

          <form onSubmit={handleCreateService} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label>Service / Plan Name</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Executive Fade & Beard or The Solo Membership"
                required
              />
            </div>

            <div className="space-y-1">
              <Label>Price (ZAR - Rands)</Label>
              <Input
                type="number"
                step="0.01"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="e.g. 180.00"
                required
              />
            </div>

            <div className="space-y-1">
              <Label>Duration (Minutes)</Label>
              <Input
                type="number"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                placeholder="e.g. 30"
                required
              />
            </div>

            <div className="space-y-1">
              <Label>Type</Label>
              <div className="flex items-center space-x-4 pt-2">
                <label className="flex items-center space-x-2 text-sm text-stone-200 cursor-pointer">
                  <input
                    type="radio"
                    name="srv_type"
                    checked={!isSubscription}
                    onChange={() => setIsSubscription(false)}
                    className="accent-amber-500"
                  />
                  <span>Standard Appointment</span>
                </label>
                <label className="flex items-center space-x-2 text-sm text-stone-200 cursor-pointer">
                  <input
                    type="radio"
                    name="srv_type"
                    checked={isSubscription}
                    onChange={() => setIsSubscription(true)}
                    className="accent-amber-500"
                  />
                  <span className="text-amber-400 font-medium">PayFast Subscription</span>
                </label>
              </div>
            </div>

            {isSubscription && (
              <div className="space-y-1 md:col-span-2">
                <Label>PayFast Plan Code</Label>
                <select
                  value={planCode}
                  onChange={(e) => setPlanCode(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-stone-700 bg-stone-900 px-3 py-2 text-sm text-stone-200"
                >
                  <option value="solo">solo (The Solo - R100/mo)</option>
                  <option value="twice">twice (The Regular - R180/mo)</option>
                  <option value="father-son">father-son (Father n Son - R180/mo)</option>
                  <option value="custom">custom (Custom recurring rate)</option>
                </select>
              </div>
            )}

            <div className="space-y-1 md:col-span-2">
              <Label>Description</Label>
              <Input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Details, wash & style included, perks..."
              />
            </div>

            <div className="md:col-span-2 flex justify-end space-x-3 pt-4 border-t border-stone-800">
              <Button type="button" variant="ghost" onClick={() => setShowAddModal(false)}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={submitting}
                className="bg-amber-500 hover:bg-amber-400 text-black font-semibold"
              >
                {submitting ? 'Saving...' : 'Save Service'}
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Services Table */}
      <Card className="border-stone-800 bg-stone-900/50">
        <CardHeader>
          <CardTitle className="text-lg text-white">Active Services & Memberships ({services.length})</CardTitle>
          <CardDescription>
            All appointments and recurring memberships configured in PostgreSQL.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-12 text-center text-stone-500">Loading services...</div>
          ) : services.length === 0 ? (
            <div className="py-12 text-center text-stone-500 space-y-3">
              <Scissors className="mx-auto h-8 w-8 text-stone-600" />
              <p>No barbershop services found yet.</p>
              <Button
                size="sm"
                onClick={() => setShowAddModal(true)}
                className="bg-amber-500 text-black"
              >
                Add Your First Service
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-stone-300">
                <thead className="border-b border-stone-800 text-xs uppercase text-stone-500">
                  <tr>
                    <th className="py-3 px-4">Service Name</th>
                    <th className="py-3 px-4">Duration</th>
                    <th className="py-3 px-4">Rate (ZAR)</th>
                    <th className="py-3 px-4">Billing Model</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-800">
                  {services.map((service) => (
                    <tr key={service.id} className="hover:bg-stone-800/40">
                      <td className="py-3 px-4 font-medium text-white">
                        <div>{service.name}</div>
                        {service.description && (
                          <div className="text-xs text-stone-500 line-clamp-1">
                            {service.description}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4 text-stone-400">
                        <span className="flex items-center">
                          <Clock className="mr-1.5 h-3.5 w-3.5 text-stone-500" />
                          {service.duration_minutes} mins
                        </span>
                      </td>
                      <td className="py-3 px-4 font-bold text-amber-400">
                        R {Number(service.price).toFixed(2)}
                      </td>
                      <td className="py-3 px-4">
                        {service.is_subscription ? (
                          <span className="inline-flex items-center rounded bg-amber-500/10 px-2 py-0.5 text-xs font-medium text-amber-400 border border-amber-500/20">
                            <CreditCard className="mr-1 h-3 w-3" /> Monthly Subscription
                          </span>
                        ) : (
                          <span className="inline-flex rounded bg-stone-800 px-2 py-0.5 text-xs text-stone-400">
                            Per Appointment
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <button
                          onClick={() => toggleServiceStatus(service)}
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                            service.is_active
                              ? 'bg-emerald-500/10 text-emerald-400'
                              : 'bg-stone-800 text-stone-500'
                          }`}
                        >
                          {service.is_active ? (
                            <>
                              <CheckCircle className="mr-1 h-3 w-3" /> Active
                            </>
                          ) : (
                            <>
                              <XCircle className="mr-1 h-3 w-3" /> Inactive
                            </>
                          )}
                        </button>
                      </td>
                      <td className="py-3 px-4 text-right space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteService(service.id)}
                          className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
