'use client';

import { useEffect, useState } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  Button,
  Input,
  Label,
} from '@dissafyt/ui';
import {
  Scissors,
  Plus,
  Trash2,
  CheckCircle,
  XCircle,
  Clock,
  CreditCard,
  RefreshCw,
  Calendar,
  Users,
  UserCheck,
  Check,
  Ban,
  UserX,
  Phone,
  Mail,
  Filter,
} from 'lucide-react';

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

interface StaffMember {
  id: string;
  display_name: string;
  bio?: string | null;
  is_active: boolean;
  created_at: string;
}

interface BookingRecord {
  id: string;
  customer_id: string;
  service_id: string;
  staff_id?: string | null;
  start_time: string;
  end_time: string;
  status: string;
  total_amount: number;
  notes?: string | null;
  service?: { name: string; duration_minutes: number; price: number };
  staff?: { display_name: string } | null;
  customer?: { full_name?: string; email?: string; phone?: string } | null;
}

export default function AdminBarbershopPage() {
  const [activeTab, setActiveTab] = useState<'appointments' | 'staff' | 'services'>('appointments');
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  // --- TAB 1: APPOINTMENTS STATE ---
  const [bookings, setBookings] = useState<BookingRecord[]>([]);
  const [loadingBookings, setLoadingBookings] = useState(false);
  const [filterDate, setFilterDate] = useState<string>('upcoming');
  const [filterStaffId, setFilterStaffId] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  // --- TAB 2: STAFF STATE ---
  const [staffList, setStaffList] = useState<StaffMember[]>([]);
  const [loadingStaff, setLoadingStaff] = useState(false);
  const [showAddStaffModal, setShowAddStaffModal] = useState(false);
  const [staffDisplayName, setStaffDisplayName] = useState('');
  const [staffBio, setStaffBio] = useState('');
  const [staffSubmitting, setStaffSubmitting] = useState(false);

  // --- TAB 3: SERVICES STATE ---
  const [services, setServices] = useState<Service[]>([]);
  const [loadingServices, setLoadingServices] = useState(false);
  const [showAddServiceModal, setShowAddServiceModal] = useState(false);
  const [serviceName, setServiceName] = useState('');
  const [serviceDescription, setServiceDescription] = useState('');
  const [serviceDuration, setServiceDuration] = useState('30');
  const [servicePrice, setServicePrice] = useState('');
  const [isSubscription, setIsSubscription] = useState(false);
  const [planCode, setPlanCode] = useState('solo');
  const [serviceSubmitting, setServiceSubmitting] = useState(false);

  // --- LOAD DATA ---
  async function loadBookings() {
    setLoadingBookings(true);
    try {
      const params = new URLSearchParams();
      if (filterDate) params.set('date', filterDate);
      if (filterStaffId !== 'all') params.set('staffId', filterStaffId);
      if (filterStatus !== 'all') params.set('status', filterStatus);

      const res = await fetch(`/api/bookings?${params.toString()}`);
      if (res.ok) setBookings(await res.json());
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingBookings(false);
    }
  }

  async function loadStaff() {
    setLoadingStaff(true);
    try {
      const res = await fetch('/api/staff');
      if (res.ok) setStaffList(await res.json());
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingStaff(false);
    }
  }

  async function loadServices() {
    setLoadingServices(true);
    try {
      const res = await fetch('/api/services');
      if (res.ok) setServices(await res.json());
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingServices(false);
    }
  }

  useEffect(() => {
    loadStaff();
    loadServices();
  }, []);

  useEffect(() => {
    loadBookings();
  }, [filterDate, filterStaffId, filterStatus]);

  // --- APPOINTMENT ACTIONS ---
  async function handleUpdateBookingStatus(id: string, status: string) {
    try {
      const res = await fetch('/api/bookings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status }),
      });
      if (res.ok) {
        setStatusMsg(`Appointment marked as ${status}.`);
        loadBookings();
      } else {
        const err = await res.json();
        setStatusMsg(`Failed to update status: ${err.error}`);
      }
    } catch (e) {
      console.error(e);
      setStatusMsg('Network error updating appointment status.');
    }
  }

  // --- STAFF ACTIONS ---
  async function handleCreateStaff(e: React.FormEvent) {
    e.preventDefault();
    setStaffSubmitting(true);
    setStatusMsg(null);

    try {
      const res = await fetch('/api/staff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          display_name: staffDisplayName,
          bio: staffBio,
          is_active: true,
        }),
      });

      if (res.ok) {
        setStatusMsg(`Barber ${staffDisplayName} added successfully!`);
        setStaffDisplayName('');
        setStaffBio('');
        setShowAddStaffModal(false);
        loadStaff();
      } else {
        const err = await res.json();
        setStatusMsg(`Failed to add barber: ${err.error}`);
      }
    } catch {
      setStatusMsg('Network error while adding barber.');
    } finally {
      setStaffSubmitting(false);
    }
  }

  async function handleToggleStaffStatus(staff: StaffMember) {
    try {
      await fetch(`/api/staff/${staff.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !staff.is_active }),
      });
      loadStaff();
    } catch (e) {
      console.error(e);
    }
  }

  async function handleDeleteStaff(id: string) {
    if (!confirm('Are you sure you want to remove this staff member?')) return;
    try {
      await fetch(`/api/staff/${id}`, { method: 'DELETE' });
      loadStaff();
    } catch (e) {
      console.error(e);
    }
  }

  // --- SERVICE ACTIONS ---
  async function handleCreateService(e: React.FormEvent) {
    e.preventDefault();
    setServiceSubmitting(true);
    setStatusMsg(null);

    try {
      const res = await fetch('/api/services', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: serviceName,
          description: serviceDescription,
          duration_minutes: parseInt(serviceDuration, 10) || 30,
          price: parseFloat(servicePrice),
          is_subscription: isSubscription,
          plan_code: isSubscription ? planCode : null,
          billing_frequency: 3,
          billing_cycles: 12,
          is_active: true,
        }),
      });

      if (res.ok) {
        setStatusMsg('Service / Subscription created successfully!');
        setServiceName('');
        setServiceDescription('');
        setServicePrice('');
        setShowAddServiceModal(false);
        loadServices();
      } else {
        const err = await res.json();
        setStatusMsg(`Failed: ${err.error}`);
      }
    } catch {
      setStatusMsg('Network error while saving service.');
    } finally {
      setServiceSubmitting(false);
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

  // Metrics for appointments
  const totalRevenue = bookings
    .filter((b) => b.status === 'confirmed' || b.status === 'completed')
    .reduce((sum, b) => sum + Number(b.total_amount), 0);
  const confirmedCount = bookings.filter((b) => b.status === 'confirmed').length;
  const completedCount = bookings.filter((b) => b.status === 'completed').length;

  return (
    <div className="space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center">
            <Scissors className="mr-3 h-8 w-8 text-amber-500" />
            Ace of Fyt Barbershop Operations
          </h1>
          <p className="text-sm text-stone-400">
            Real-time appointment schedule, barber staff management, and grooming service catalog.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              loadBookings();
              loadStaff();
              loadServices();
            }}
            className="border-stone-700 text-stone-300 hover:bg-stone-800"
          >
            <RefreshCw className="mr-2 h-4 w-4" /> Refresh
          </Button>

          {activeTab === 'staff' && (
            <Button
              size="sm"
              onClick={() => setShowAddStaffModal(true)}
              className="bg-amber-500 hover:bg-amber-400 text-black font-semibold"
            >
              <Plus className="mr-2 h-4 w-4" /> Add Barber
            </Button>
          )}

          {activeTab === 'services' && (
            <Button
              size="sm"
              onClick={() => setShowAddServiceModal(true)}
              className="bg-amber-500 hover:bg-amber-400 text-black font-semibold"
            >
              <Plus className="mr-2 h-4 w-4" /> Add Service / Membership
            </Button>
          )}
        </div>
      </div>

      {statusMsg && (
        <div className="rounded-md border border-amber-500/20 bg-amber-500/10 p-3 text-sm text-amber-300 flex items-center justify-between">
          <span>{statusMsg}</span>
          <button onClick={() => setStatusMsg(null)} className="text-amber-400 hover:text-white text-xs">
            Dismiss
          </button>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex space-x-2 border-b border-stone-800 pb-1">
        <button
          onClick={() => setActiveTab('appointments')}
          className={`flex items-center px-4 py-2 text-sm font-semibold rounded-t-lg transition-all border-b-2 ${
            activeTab === 'appointments'
              ? 'border-amber-500 text-amber-400 bg-stone-900/80'
              : 'border-transparent text-stone-400 hover:text-stone-200'
          }`}
        >
          <Calendar className="mr-2 h-4 w-4" /> Schedule & Appointments ({bookings.length})
        </button>

        <button
          onClick={() => setActiveTab('staff')}
          className={`flex items-center px-4 py-2 text-sm font-semibold rounded-t-lg transition-all border-b-2 ${
            activeTab === 'staff'
              ? 'border-amber-500 text-amber-400 bg-stone-900/80'
              : 'border-transparent text-stone-400 hover:text-stone-200'
          }`}
        >
          <Users className="mr-2 h-4 w-4" /> Barbers & Staff ({staffList.length})
        </button>

        <button
          onClick={() => setActiveTab('services')}
          className={`flex items-center px-4 py-2 text-sm font-semibold rounded-t-lg transition-all border-b-2 ${
            activeTab === 'services'
              ? 'border-amber-500 text-amber-400 bg-stone-900/80'
              : 'border-transparent text-stone-400 hover:text-stone-200'
          }`}
        >
          <Scissors className="mr-2 h-4 w-4" /> Services & Memberships ({services.length})
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: SCHEDULE & APPOINTMENTS */}
      {/* ========================================================================= */}
      {activeTab === 'appointments' && (
        <div className="space-y-6">
          {/* Metrics summary */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="border-stone-800 bg-stone-900/60 p-4">
              <div className="text-xs text-stone-400">Total Bookings</div>
              <div className="text-2xl font-bold text-white mt-1">{bookings.length}</div>
            </Card>
            <Card className="border-stone-800 bg-stone-900/60 p-4">
              <div className="text-xs text-emerald-400">Confirmed</div>
              <div className="text-2xl font-bold text-emerald-400 mt-1">{confirmedCount}</div>
            </Card>
            <Card className="border-stone-800 bg-stone-900/60 p-4">
              <div className="text-xs text-blue-400">Completed</div>
              <div className="text-2xl font-bold text-blue-400 mt-1">{completedCount}</div>
            </Card>
            <Card className="border-stone-800 bg-stone-900/60 p-4">
              <div className="text-xs text-amber-400">Projected Revenue</div>
              <div className="text-2xl font-bold text-amber-400 mt-1">R {totalRevenue.toFixed(2)}</div>
            </Card>
          </div>

          {/* Filter Bar */}
          <Card className="border-stone-800 bg-stone-900/60 p-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center space-x-1.5">
                  <Calendar className="h-4 w-4 text-stone-400" />
                  <Input
                    type="date"
                    value={filterDate.includes('-') ? filterDate : ''}
                    onChange={(e) => setFilterDate(e.target.value || 'upcoming')}
                    className="w-40 bg-stone-950 border-stone-800 text-xs text-white"
                  />
                </div>

                <div className="flex items-center space-x-1.5">
                  <Users className="h-4 w-4 text-stone-400" />
                  <select
                    value={filterStaffId}
                    onChange={(e) => setFilterStaffId(e.target.value)}
                    className="h-9 rounded-md border border-stone-800 bg-stone-950 px-3 text-xs text-white"
                  >
                    <option value="all">All Barbers</option>
                    {staffList.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.display_name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center space-x-1.5">
                  <Filter className="h-4 w-4 text-stone-400" />
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="h-9 rounded-md border border-stone-800 bg-stone-950 px-3 text-xs text-white"
                  >
                    <option value="all">All Statuses</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                    <option value="no_show">No Show</option>
                    <option value="pending">Pending</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Button
                  size="sm"
                  variant={filterDate === 'upcoming' ? 'default' : 'outline'}
                  onClick={() => setFilterDate('upcoming')}
                  className={`text-xs ${
                    filterDate === 'upcoming'
                      ? 'bg-amber-500 text-black font-semibold hover:bg-amber-400'
                      : 'border-stone-800 text-stone-300'
                  }`}
                >
                  Upcoming
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    const today = new Date();
                    setFilterDate(
                      `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
                    );
                  }}
                  className={`text-xs ${
                    filterDate.includes('-') && !filterDate.includes('upcoming')
                      ? 'border-amber-500/50 text-amber-300'
                      : 'border-stone-800 text-stone-300'
                  }`}
                >
                  Today
                </Button>
                <Button
                  size="sm"
                  variant={filterDate === 'all' ? 'default' : 'outline'}
                  onClick={() => setFilterDate('all')}
                  className={`text-xs ${
                    filterDate === 'all'
                      ? 'bg-amber-500 text-black font-semibold hover:bg-amber-400'
                      : 'border-stone-800 text-stone-300'
                  }`}
                >
                  All Bookings
                </Button>
              </div>
            </div>
          </Card>

          {/* Bookings Table / List */}
          {loadingBookings ? (
            <div className="py-12 text-center text-sm text-stone-500">Loading appointments...</div>
          ) : bookings.length === 0 ? (
            <Card className="border-stone-800 bg-stone-900/40 p-12 text-center">
              <Calendar className="mx-auto h-8 w-8 text-stone-600 mb-2" />
              <p className="text-sm text-stone-400">No appointments found for the selected filter.</p>
            </Card>
          ) : (
            <div className="space-y-3">
              {bookings.map((b) => {
                const startTime = new Date(b.start_time);
                return (
                  <Card
                    key={b.id}
                    className="border-stone-800 bg-stone-900/70 p-4 transition-colors hover:border-stone-700"
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      {/* Left: Time & Barber */}
                      <div className="flex items-start space-x-4">
                        <div className="flex flex-col items-center justify-center rounded-lg border border-stone-800 bg-stone-950 p-2.5 min-w-[75px] text-center">
                          <span className="text-xs font-bold text-amber-400">
                            {startTime.toLocaleTimeString('en-ZA', {
                              timeZone: 'Africa/Johannesburg',
                              hour: '2-digit',
                              minute: '2-digit',
                              hour12: false,
                            })}
                          </span>
                          <span className="text-[10px] text-stone-500 uppercase">
                            {startTime.toLocaleDateString('en-ZA', {
                              timeZone: 'Africa/Johannesburg',
                              month: 'short',
                              day: 'numeric',
                            })}
                          </span>
                        </div>

                        <div className="space-y-1">
                          <div className="flex items-center space-x-2">
                            <span className="font-bold text-white text-base">
                              {b.service?.name || 'Barber Service'}
                            </span>
                            <span className="text-xs text-stone-500">
                              ({b.service?.duration_minutes || 30} mins)
                            </span>
                            <span
                              className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                                b.status === 'confirmed'
                                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                  : b.status === 'completed'
                                  ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                                  : b.status === 'cancelled'
                                  ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                                  : b.status === 'no_show'
                                  ? 'bg-stone-800 text-stone-400 border border-stone-700'
                                  : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                              }`}
                            >
                              {b.status}
                            </span>
                          </div>

                          <div className="text-xs text-stone-300 flex items-center space-x-2">
                            <span className="text-stone-400">Assigned Barber:</span>
                            <span className="font-semibold text-amber-300">
                              {b.staff?.display_name || 'Unassigned'}
                            </span>
                          </div>

                          {/* Customer info */}
                          <div className="flex flex-wrap items-center gap-3 text-xs text-stone-400 pt-1">
                            <span className="font-medium text-white flex items-center">
                              <UserCheck className="mr-1 h-3.5 w-3.5 text-stone-500" />
                              {b.customer?.full_name || 'Guest Client'}
                            </span>
                            {b.customer?.email && (
                              <span className="flex items-center text-stone-400">
                                <Mail className="mr-1 h-3 w-3 text-stone-500" /> {b.customer.email}
                              </span>
                            )}
                            {b.customer?.phone && (
                              <span className="flex items-center text-stone-400">
                                <Phone className="mr-1 h-3 w-3 text-stone-500" /> {b.customer.phone}
                              </span>
                            )}
                          </div>

                          {b.notes && (
                            <div className="text-[11px] text-stone-500 italic pt-0.5">
                              Client notes: &ldquo;{b.notes}&rdquo;
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Right: Amount & Status Quick Action Buttons */}
                      <div className="flex flex-col sm:flex-row items-end sm:items-center gap-4 pt-2 lg:pt-0 border-t lg:border-t-0 border-stone-800">
                        <div className="text-right">
                          <span className="text-xs text-stone-400 block">Total</span>
                          <span className="text-lg font-bold text-amber-400">
                            R {Number(b.total_amount).toFixed(2)}
                          </span>
                        </div>

                        <div className="flex items-center space-x-1.5">
                          {b.status !== 'confirmed' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleUpdateBookingStatus(b.id, 'confirmed')}
                              className="text-xs border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10 h-8"
                            >
                              <Check className="mr-1 h-3 w-3" /> Confirm
                            </Button>
                          )}

                          {b.status !== 'completed' && (
                            <Button
                              size="sm"
                              onClick={() => handleUpdateBookingStatus(b.id, 'completed')}
                              className="text-xs bg-blue-600 hover:bg-blue-500 text-white h-8"
                            >
                              <CheckCircle className="mr-1 h-3 w-3" /> Complete
                            </Button>
                          )}

                          {b.status !== 'no_show' && b.status !== 'completed' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleUpdateBookingStatus(b.id, 'no_show')}
                              className="text-xs border-stone-700 text-stone-400 hover:bg-stone-800 h-8"
                            >
                              <UserX className="mr-1 h-3 w-3" /> No-Show
                            </Button>
                          )}

                          {b.status !== 'cancelled' && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleUpdateBookingStatus(b.id, 'cancelled')}
                              className="text-xs text-rose-400 hover:bg-rose-500/10 h-8"
                            >
                              <Ban className="mr-1 h-3 w-3" /> Cancel
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: BARBERS & STAFF MANAGEMENT */}
      {/* ========================================================================= */}
      {activeTab === 'staff' && (
        <div className="space-y-6">
          {/* Add Staff Modal Form */}
          {showAddStaffModal && (
            <Card className="border-stone-700 bg-stone-900/95 p-6 shadow-2xl">
              <CardHeader className="p-0 mb-4">
                <CardTitle className="text-xl text-white">Add Master Barber / Staff Member</CardTitle>
                <CardDescription>
                  Register a barber to accept client bookings on the customer booking calendar.
                </CardDescription>
              </CardHeader>

              <form onSubmit={handleCreateStaff} className="space-y-4">
                <div className="space-y-1">
                  <Label>Barber Display Name</Label>
                  <Input
                    value={staffDisplayName}
                    onChange={(e) => setStaffDisplayName(e.target.value)}
                    placeholder="e.g. Ace (Lead Barber) or Tyler Fade Master"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <Label>Bio / Specialties</Label>
                  <Input
                    value={staffBio}
                    onChange={(e) => setStaffBio(e.target.value)}
                    placeholder="e.g. Hot towel specialist, razor lineups, scissor styling"
                  />
                </div>

                <div className="flex justify-end space-x-3 pt-3">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setShowAddStaffModal(false)}
                    className="text-stone-400"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={staffSubmitting}
                    className="bg-amber-500 hover:bg-amber-400 text-black font-semibold"
                  >
                    {staffSubmitting ? 'Saving...' : 'Add Barber'}
                  </Button>
                </div>
              </form>
            </Card>
          )}

          {/* Staff List Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {staffList.map((staff) => (
              <Card
                key={staff.id}
                className={`border bg-stone-900/60 p-6 flex flex-col justify-between ${
                  staff.is_active ? 'border-stone-800' : 'border-rose-900/50 opacity-60'
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-stone-800 text-white font-bold text-base">
                        {staff.display_name.charAt(0)}
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-white">{staff.display_name}</h3>
                        <span
                          className={`inline-flex items-center text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                            staff.is_active
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                          }`}
                        >
                          {staff.is_active ? 'Accepting Bookings' : 'Unavailable'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <p className="text-xs text-stone-400">{staff.bio || 'Master Barber at Ace of Fyt'}</p>

                  <div className="text-[11px] text-stone-500 border-t border-stone-800/80 pt-3 space-y-1">
                    <div>Standard Hours: Mon-Fri 09:00 - 18:00, Sat 09:00 - 17:00</div>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-stone-800 flex items-center justify-between">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleToggleStaffStatus(staff)}
                    className="text-xs border-stone-700 text-stone-300"
                  >
                    {staff.is_active ? 'Set Inactive' : 'Set Active'}
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteStaff(staff.id)}
                    className="text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-500/10"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: SERVICES & MEMBERSHIPS */}
      {/* ========================================================================= */}
      {activeTab === 'services' && (
        <div className="space-y-6">
          {/* Add Service Modal Form */}
          {showAddServiceModal && (
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
                    value={serviceName}
                    onChange={(e) => setServiceName(e.target.value)}
                    placeholder="e.g. Executive Fade & Beard or The Solo Membership"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <Label>Price (ZAR - Rands)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={servicePrice}
                    onChange={(e) => setServicePrice(e.target.value)}
                    placeholder="e.g. 180.00"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <Label>Duration (Minutes)</Label>
                  <Input
                    type="number"
                    value={serviceDuration}
                    onChange={(e) => setServiceDuration(e.target.value)}
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
                        checked={!isSubscription}
                        onChange={() => setIsSubscription(false)}
                        className="accent-amber-500"
                      />
                      <span>Regular Service</span>
                    </label>
                    <label className="flex items-center space-x-2 text-sm text-stone-200 cursor-pointer">
                      <input
                        type="radio"
                        checked={isSubscription}
                        onChange={() => setIsSubscription(true)}
                        className="accent-amber-500"
                      />
                      <span>PayFast Monthly Membership</span>
                    </label>
                  </div>
                </div>

                {isSubscription && (
                  <div className="space-y-1 md:col-span-2 bg-stone-800/40 p-3 rounded-lg border border-stone-800">
                    <Label className="text-amber-400">PayFast Plan Identifier</Label>
                    <div className="flex gap-4 pt-1">
                      {['solo', 'twice', 'father-son'].map((code) => (
                        <label key={code} className="flex items-center space-x-1.5 text-xs text-stone-300">
                          <input
                            type="radio"
                            name="planCode"
                            value={code}
                            checked={planCode === code}
                            onChange={(e) => setPlanCode(e.target.value)}
                            className="accent-amber-500"
                          />
                          <span>{code}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                <div className="space-y-1 md:col-span-2">
                  <Label>Description</Label>
                  <Input
                    value={serviceDescription}
                    onChange={(e) => setServiceDescription(e.target.value)}
                    placeholder="Brief description of grooming steps or membership perks"
                  />
                </div>

                <div className="md:col-span-2 flex justify-end space-x-3 pt-4 border-t border-stone-800">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setShowAddServiceModal(false)}
                    className="text-stone-400"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={serviceSubmitting}
                    className="bg-amber-500 hover:bg-amber-400 text-black font-semibold"
                  >
                    {serviceSubmitting ? 'Saving...' : 'Save Service'}
                  </Button>
                </div>
              </form>
            </Card>
          )}

          {/* Services List */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((service) => (
              <Card
                key={service.id}
                className={`border bg-stone-900/60 p-6 flex flex-col justify-between ${
                  service.is_subscription
                    ? 'border-amber-500/30'
                    : service.is_active
                    ? 'border-stone-800'
                    : 'border-rose-900/50 opacity-60'
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      {service.is_subscription ? (
                        <span className="rounded bg-amber-500/10 text-amber-400 text-[10px] font-bold px-2 py-0.5 uppercase tracking-wider border border-amber-500/20">
                          Monthly Membership
                        </span>
                      ) : (
                        <span className="rounded bg-stone-800 text-stone-300 text-[10px] font-bold px-2 py-0.5 uppercase tracking-wider">
                          Standard Service
                        </span>
                      )}
                      <CardTitle className="text-xl text-white mt-1">{service.name}</CardTitle>
                    </div>

                    <span className="text-xl font-bold text-amber-400">
                      R {Number(service.price).toFixed(2)}
                      {service.is_subscription && (
                        <span className="text-xs text-stone-500 font-normal">/mo</span>
                      )}
                    </span>
                  </div>

                  <p className="text-sm text-stone-400">{service.description}</p>

                  <div className="flex items-center space-x-4 text-xs text-stone-500 pt-2">
                    <span className="flex items-center">
                      <Clock className="mr-1 h-3.5 w-3.5" /> {service.duration_minutes} mins
                    </span>
                    {service.plan_code && (
                      <span className="flex items-center text-amber-500/80">
                        <CreditCard className="mr-1 h-3.5 w-3.5" /> Plan: {service.plan_code}
                      </span>
                    )}
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-stone-800 flex items-center justify-between">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => toggleServiceStatus(service)}
                    className="text-xs border-stone-700 text-stone-300"
                  >
                    {service.is_active ? 'Deactivate' : 'Activate'}
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteService(service.id)}
                    className="text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-500/10"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
