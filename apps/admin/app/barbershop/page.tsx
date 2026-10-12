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
  MapPin,
  Building2,
  Pencil,
  ShieldCheck,
} from 'lucide-react';
import { adminFetch } from '../../lib/operator';

const SPECIALTY_LABELS: Record<string, string> = {
  barber: 'Barber',
  nail_tech: 'Nail Technician',
  beautician: 'Beautician',
};

interface Service {
  id: string;
  name: string;
  description: string;
  specialty?: 'barber' | 'nail_tech' | 'beautician' | string;
  duration_minutes: number;
  price: number;
  is_active: boolean;
  is_subscription?: boolean;
  plan_code?: string | null;
}

interface StaffMember {
  id: string;
  display_name: string;
  specialty?: 'barber' | 'nail_tech' | 'beautician' | string;
  bio?: string | null;
  phone?: string | null;
  location_id?: string | null;
  location?: BarbershopLocation | null;
  is_active: boolean;
  commission_split_pct?: number | null;
  payfast_merchant_id?: string | null;
  bank_name?: string | null;
  bank_account_number?: string | null;
  bank_account_type?: string | null;
  bank_branch_code?: string | null;
  bank_account_hash?: string | null;
  has_station_pin?: boolean;
  pos_terminal_id?: string | null;
  created_at: string;
}

interface BookingRecord {
  id: string;
  customer_id: string;
  service_id: string;
  staff_id?: string | null;
  location_id?: string | null;
  location?: BarbershopLocation | null;
  start_time: string;
  end_time: string;
  status: string;
  payment_status?: string;
  is_subscription_covered?: boolean;
  total_amount: number;
  notes?: string | null;
  service?: { name: string; duration_minutes: number; price: number };
  staff?: { display_name: string; location_id?: string } | null;
  customer?: { full_name?: string; email?: string; phone?: string } | null;
}

interface BarbershopLocation {
  id: string;
  name: string;
  slug: string;
  address: string;
  city: string;
  province: string;
  country: string;
  phone: string;
  is_flagship: boolean;
  is_active: boolean;
  capacity_chairs: number;
  operating_hours_display: string;
  google_maps_url?: string | null;
  google_maps_embed_url?: string | null;
  pos_terminal_id?: string | null;
}

export default function AdminBarbershopPage() {
  const [activeTab, setActiveTab] = useState<'appointments' | 'staff' | 'services' | 'locations'>('appointments');
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  // --- TAB 1: APPOINTMENTS STATE ---
  const [bookings, setBookings] = useState<BookingRecord[]>([]);
  const [loadingBookings, setLoadingBookings] = useState(false);
  const [filterDate, setFilterDate] = useState<string>('upcoming');
  const [filterStaffId, setFilterStaffId] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterLocationId, setFilterLocationId] = useState('all');

  // --- TAB 2: STAFF STATE ---
  const [staffList, setStaffList] = useState<StaffMember[]>([]);
  const [loadingStaff, setLoadingStaff] = useState(false);
  const [showAddStaffModal, setShowAddStaffModal] = useState(false);
  const [staffDisplayName, setStaffDisplayName] = useState('');
  const [staffSpecialty, setStaffSpecialty] = useState<'barber' | 'nail_tech' | 'beautician'>('barber');
  const [staffBio, setStaffBio] = useState('');
  const [staffPhone, setStaffPhone] = useState('');
  const [staffLocationId, setStaffLocationId] = useState('loc-cpt-flagship');
  const [staffCommissionSplit, setStaffCommissionSplit] = useState('15');
  const [staffPayfastId, setStaffPayfastId] = useState('');
  const [staffPosTerminalId, setStaffPosTerminalId] = useState('');
  const [staffBankName, setStaffBankName] = useState('');
  const [staffBankAccountNum, setStaffBankAccountNum] = useState('');
  const [staffBankAccountType, setStaffBankAccountType] = useState('cheque');
  const [staffBankBranchCode, setStaffBankBranchCode] = useState('');
  const [staffStationPin, setStaffStationPin] = useState('');
  const [staffSubmitting, setStaffSubmitting] = useState(false);

  // --- TAB 3: SERVICES STATE ---
  const [services, setServices] = useState<Service[]>([]);
  const [loadingServices, setLoadingServices] = useState(false);
  const [showAddServiceModal, setShowAddServiceModal] = useState(false);
  const [serviceName, setServiceName] = useState('');
  const [serviceDescription, setServiceDescription] = useState('');
  const [serviceSpecialty, setServiceSpecialty] = useState<'barber' | 'nail_tech' | 'beautician'>('barber');
  const [serviceDuration, setServiceDuration] = useState('30');
  const [servicePrice, setServicePrice] = useState('');
  const [isSubscription, setIsSubscription] = useState(false);
  const [planCode, setPlanCode] = useState('solo');
  const [serviceSubmitting, setServiceSubmitting] = useState(false);

  // --- TAB 4: LOCATIONS STATE ---
  const [locations, setLocations] = useState<BarbershopLocation[]>([]);
  const [loadingLocations, setLoadingLocations] = useState(false);
  const [showAddLocationModal, setShowAddLocationModal] = useState(false);
  const [newLocName, setNewLocName] = useState('');
  const [newLocAddress, setNewLocAddress] = useState('');
  const [newLocCity, setNewLocCity] = useState('');
  const [newLocPhone, setNewLocPhone] = useState('');
  const [newLocChairs, setNewLocChairs] = useState('2');
  const [newLocGoogleMapsUrl, setNewLocGoogleMapsUrl] = useState('');
  const [newLocPosTerminalId, setNewLocPosTerminalId] = useState('');

  // --- EDIT MODAL STATES ---
  // 1. Staff Edit State
  const [editingStaff, setEditingStaff] = useState<StaffMember | null>(null);
  const [editStaffName, setEditStaffName] = useState('');
  const [editStaffSpecialty, setEditStaffSpecialty] = useState<'barber' | 'nail_tech' | 'beautician'>('barber');
  const [editStaffBio, setEditStaffBio] = useState('');
  const [editStaffPhone, setEditStaffPhone] = useState('');
  const [editStaffLocationId, setEditStaffLocationId] = useState('loc-cpt-flagship');
  const [editStaffActive, setEditStaffActive] = useState(true);
  const [editStaffCommissionSplit, setEditStaffCommissionSplit] = useState('15');
  const [editStaffPayfastId, setEditStaffPayfastId] = useState('');
  const [editStaffPosTerminalId, setEditStaffPosTerminalId] = useState('');
  const [editStaffBankName, setEditStaffBankName] = useState('');
  const [editStaffBankAccountNum, setEditStaffBankAccountNum] = useState('');
  const [editStaffBankAccountType, setEditStaffBankAccountType] = useState('cheque');
  const [editStaffBankBranchCode, setEditStaffBankBranchCode] = useState('');
  const [editStaffStationPin, setEditStaffStationPin] = useState('');
  const [editStaffSubmitting, setEditStaffSubmitting] = useState(false);

  // 2. Service Edit State
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [editServiceName, setEditServiceName] = useState('');
  const [editServiceDescription, setEditServiceDescription] = useState('');
  const [editServiceSpecialty, setEditServiceSpecialty] = useState<'barber' | 'nail_tech' | 'beautician'>('barber');
  const [editServiceDuration, setEditServiceDuration] = useState('30');
  const [editServicePrice, setEditServicePrice] = useState('');
  const [editServiceIsSubscription, setEditServiceIsSubscription] = useState(false);
  const [editServicePlanCode, setEditServicePlanCode] = useState('solo');
  const [editServiceActive, setEditServiceActive] = useState(true);
  const [editServiceSubmitting, setEditServiceSubmitting] = useState(false);

  // 3. Location Edit State
  const [editingLocation, setEditingLocation] = useState<BarbershopLocation | null>(null);
  const [editLocName, setEditLocName] = useState('');
  const [editLocAddress, setEditLocAddress] = useState('');
  const [editLocCity, setEditLocCity] = useState('');
  const [editLocProvince, setEditLocProvince] = useState('');
  const [editLocPhone, setEditLocPhone] = useState('');
  const [editLocChairs, setEditLocChairs] = useState('2');
  const [editLocHours, setEditLocHours] = useState('');
  const [editLocFlagship, setEditLocFlagship] = useState(false);
  const [editLocActive, setEditLocActive] = useState(true);
  const [editLocGoogleMapsUrl, setEditLocGoogleMapsUrl] = useState('');
  const [editLocPosTerminalId, setEditLocPosTerminalId] = useState('');
  const [editLocSubmitting, setEditLocSubmitting] = useState(false);

  // --- LOAD DATA ---
  async function loadBookings() {
    setLoadingBookings(true);
    try {
      const params = new URLSearchParams();
      if (filterDate) params.set('date', filterDate);
      if (filterStaffId !== 'all') params.set('staffId', filterStaffId);
      if (filterStatus !== 'all') params.set('status', filterStatus);
      if (filterLocationId !== 'all') params.set('locationId', filterLocationId);

      const res = await adminFetch(`/api/bookings?${params.toString()}`);
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
      const res = await adminFetch('/api/staff');
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
      const res = await adminFetch('/api/services');
      if (res.ok) setServices(await res.json());
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingServices(false);
    }
  }

  async function loadLocations() {
    setLoadingLocations(true);
    try {
      const res = await adminFetch('/api/locations');
      if (res.ok) setLocations(await res.json());
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingLocations(false);
    }
  }

  async function handleCreateLocation(e: React.FormEvent) {
    e.preventDefault();
    if (!newLocName || !newLocAddress) return;

    try {
      const res = await adminFetch('/api/locations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newLocName,
          slug: newLocName.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
          address: newLocAddress,
          city: newLocCity || 'Cape Town',
          province: 'Western Cape',
          country: 'South Africa',
          phone: newLocPhone || '+27 21 000 0000',
          is_flagship: false,
          is_active: true,
          capacity_chairs: parseInt(newLocChairs || '2', 10),
          operating_hours_display: 'Mon-Fri: 09:00 - 18:00 | Sat: 09:00 - 17:00 | Sun: Closed',
          google_maps_url: newLocGoogleMapsUrl.trim() || undefined,
          pos_terminal_id: newLocPosTerminalId.trim() || undefined,
        }),
      });

      if (res.ok) {
        setShowAddLocationModal(false);
        setNewLocName('');
        setNewLocAddress('');
        setNewLocCity('');
        setNewLocPhone('');
        setNewLocGoogleMapsUrl('');
        setNewLocPosTerminalId('');
        setStatusMsg(`Branch location "${newLocName}" registered and logged to audit trail.`);
        loadLocations();
      } else {
        const err = await res.json();
        setStatusMsg(err.error || 'Failed to register location');
      }
    } catch {
      setStatusMsg('Network error while registering location.');
    }
  }

  useEffect(() => {
    loadStaff();
    loadServices();
    loadLocations();
  }, []);

  useEffect(() => {
    loadBookings();
  }, [filterDate, filterStaffId, filterStatus, filterLocationId]);

  // --- APPOINTMENT ACTIONS ---
  async function handleUpdateBookingStatus(id: string, status: string) {
    try {
      const res = await adminFetch('/api/bookings', {
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

  async function handleUpdatePaymentStatus(id: string, payment_status: string) {
    try {
      const res = await adminFetch('/api/bookings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, payment_status }),
      });
      if (res.ok) {
        setStatusMsg(`Payment status updated to ${payment_status}.`);
        loadBookings();
      } else {
        const err = await res.json();
        setStatusMsg(`Failed to update payment status: ${err.error}`);
      }
    } catch (e) {
      console.error(e);
      setStatusMsg('Network error updating payment status.');
    }
  }

  // --- STAFF ACTIONS ---
  function openEditStaffModal(staff: StaffMember) {
    setEditingStaff(staff);
    setEditStaffName(staff.display_name);
    setEditStaffSpecialty((staff.specialty as any) || 'barber');
    setEditStaffBio(staff.bio || '');
    setEditStaffPhone(staff.phone || '');
    setEditStaffLocationId(staff.location_id || 'loc-cpt-flagship');
    setEditStaffActive(staff.is_active);
    setEditStaffCommissionSplit(String(staff.commission_split_pct ?? 15));
    setEditStaffPayfastId(staff.payfast_merchant_id || '');
    setEditStaffPosTerminalId(staff.pos_terminal_id || '');
    setEditStaffBankName(staff.bank_name || '');
    setEditStaffBankAccountNum(staff.bank_account_number || '');
    setEditStaffBankAccountType(staff.bank_account_type || 'cheque');
    setEditStaffBankBranchCode(staff.bank_branch_code || '');
    setEditStaffStationPin('');
  }

  async function handleSaveEditedStaff(e: React.FormEvent) {
    e.preventDefault();
    if (!editingStaff) return;
    setEditStaffSubmitting(true);
    setStatusMsg(null);
    try {
      const res = await adminFetch(`/api/staff/${editingStaff.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          display_name: editStaffName,
          specialty: editStaffSpecialty,
          bio: editStaffBio,
          phone: editStaffPhone,
          location_id: editStaffLocationId,
          is_active: editStaffActive,
          commission_split_pct: parseFloat(editStaffCommissionSplit) || 15,
          payfast_merchant_id: editStaffPayfastId.trim() || null,
          pos_terminal_id: editStaffPosTerminalId.trim() || null,
          bank_name: editStaffBankName.trim() || null,
          bank_account_number: editStaffBankAccountNum.trim() || null,
          bank_account_type: editStaffBankAccountType,
          bank_branch_code: editStaffBankBranchCode.trim() || null,
          station_pin: editStaffStationPin.trim() || undefined,
        }),
      });
      if (res.ok) {
        setStatusMsg(
          `Specialist "${editStaffName}" updated, banking encrypted (AES-256-GCM) & logged to audit trail.`
        );
        setEditingStaff(null);
        loadStaff();
      } else {
        const data = await res.json();
        setStatusMsg(data.error || 'Failed to update specialist');
      }
    } catch {
      setStatusMsg('Network error while updating specialist.');
    } finally {
      setEditStaffSubmitting(false);
    }
  }

  async function handleCreateStaff(e: React.FormEvent) {
    e.preventDefault();
    setStaffSubmitting(true);
    setStatusMsg(null);

    try {
      const res = await adminFetch('/api/staff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          display_name: staffDisplayName,
          specialty: staffSpecialty,
          bio: staffBio,
          phone: staffPhone,
          location_id: staffLocationId,
          is_active: true,
          commission_split_pct: parseFloat(staffCommissionSplit) || 15,
          payfast_merchant_id: staffPayfastId.trim() || null,
          pos_terminal_id: staffPosTerminalId.trim() || null,
          bank_name: staffBankName.trim() || null,
          bank_account_number: staffBankAccountNum.trim() || null,
          bank_account_type: staffBankAccountType,
          bank_branch_code: staffBankBranchCode.trim() || null,
          station_pin: staffStationPin.trim() || undefined,
        }),
      });

      if (res.ok) {
        setStatusMsg(
          `Specialist ${staffDisplayName} (${SPECIALTY_LABELS[staffSpecialty]}) added with AES-256-GCM encrypted vault!`
        );
        setStaffDisplayName('');
        setStaffSpecialty('barber');
        setStaffBio('');
        setStaffPhone('');
        setStaffLocationId('loc-cpt-flagship');
        setStaffCommissionSplit('15');
        setStaffPayfastId('');
        setStaffPosTerminalId('');
        setStaffBankName('');
        setStaffBankAccountNum('');
        setStaffBankAccountType('cheque');
        setStaffBankBranchCode('');
        setStaffStationPin('');
        setShowAddStaffModal(false);
        loadStaff();
      } else {
        const err = await res.json();
        setStatusMsg(`Failed to add specialist: ${err.error}`);
      }
    } catch {
      setStatusMsg('Network error while adding specialist.');
    } finally {
      setStaffSubmitting(false);
    }
  }

  async function handleToggleStaffStatus(staff: StaffMember) {
    try {
      await adminFetch(`/api/staff/${staff.id}`, {
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
      const res = await adminFetch(`/api/staff/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const err = await res.json();
        setStatusMsg(err.error || 'Failed to delete barber');
        return;
      }
      setStatusMsg('Barber removed and logged to audit trail.');
      loadStaff();
    } catch (e) {
      console.error(e);
    }
  }

  // --- SERVICE ACTIONS ---
  function openEditServiceModal(service: Service) {
    setEditingService(service);
    setEditServiceName(service.name);
    setEditServiceDescription(service.description || '');
    setEditServiceSpecialty((service.specialty as any) || 'barber');
    setEditServiceDuration(String(service.duration_minutes));
    setEditServicePrice(String(service.price));
    setEditServiceIsSubscription(Boolean(service.is_subscription));
    setEditServicePlanCode(service.plan_code || 'solo');
    setEditServiceActive(service.is_active);
  }

  async function handleSaveEditedService(e: React.FormEvent) {
    e.preventDefault();
    if (!editingService) return;
    setEditServiceSubmitting(true);
    setStatusMsg(null);
    try {
      const res = await adminFetch(`/api/services/${editingService.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editServiceName,
          description: editServiceDescription,
          specialty: editServiceSpecialty,
          duration_minutes: parseInt(editServiceDuration, 10) || 30,
          price: parseFloat(editServicePrice) || 0,
          is_subscription: editServiceIsSubscription,
          plan_code: editServiceIsSubscription ? editServicePlanCode : null,
          is_active: editServiceActive,
        }),
      });
      if (res.ok) {
        setStatusMsg(`Service "${editServiceName}" updated successfully & logged to audit trail.`);
        setEditingService(null);
        loadServices();
      } else {
        const data = await res.json();
        setStatusMsg(data.error || 'Failed to update service');
      }
    } catch {
      setStatusMsg('Network error while updating service.');
    } finally {
      setEditServiceSubmitting(false);
    }
  }

  async function handleCreateService(e: React.FormEvent) {
    e.preventDefault();
    setServiceSubmitting(true);
    setStatusMsg(null);

    try {
      const res = await adminFetch('/api/services', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: serviceName,
          description: serviceDescription,
          specialty: serviceSpecialty,
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
        setStatusMsg('Service created successfully & logged to audit trail!');
        setServiceName('');
        setServiceDescription('');
        setServiceSpecialty('barber');
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
      await adminFetch(`/api/services/${service.id}`, {
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
      const res = await adminFetch(`/api/services/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const err = await res.json();
        setStatusMsg(err.error || 'Failed to delete service');
        return;
      }
      setStatusMsg('Service removed and logged to audit trail.');
      loadServices();
    } catch (e) {
      console.error(e);
    }
  }

  // --- LOCATION ACTIONS ---
  function openEditLocationModal(loc: BarbershopLocation) {
    setEditingLocation(loc);
    setEditLocName(loc.name);
    setEditLocAddress(loc.address);
    setEditLocCity(loc.city);
    setEditLocProvince(loc.province);
    setEditLocPhone(loc.phone || '');
    setEditLocChairs(String(loc.capacity_chairs));
    setEditLocHours(loc.operating_hours_display);
    setEditLocFlagship(loc.is_flagship);
    setEditLocActive(loc.is_active);
    setEditLocGoogleMapsUrl(loc.google_maps_url || '');
    setEditLocPosTerminalId(loc.pos_terminal_id || '');
  }

  async function handleSaveEditedLocation(e: React.FormEvent) {
    e.preventDefault();
    if (!editingLocation) return;
    setEditLocSubmitting(true);
    setStatusMsg(null);
    try {
      const res = await adminFetch(`/api/locations/${editingLocation.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editLocName,
          address: editLocAddress,
          city: editLocCity,
          province: editLocProvince,
          phone: editLocPhone,
          capacity_chairs: parseInt(editLocChairs, 10) || 2,
          operating_hours_display: editLocHours,
          is_flagship: editLocFlagship,
          is_active: editLocActive,
          google_maps_url: editLocGoogleMapsUrl.trim() || undefined,
          pos_terminal_id: editLocPosTerminalId.trim() || undefined,
        }),
      });
      if (res.ok) {
        setStatusMsg(`Studio "${editLocName}" updated successfully & logged to audit trail.`);
        setEditingLocation(null);
        loadLocations();
      } else {
        const data = await res.json();
        setStatusMsg(data.error || 'Failed to update location');
      }
    } catch {
      setStatusMsg('Network error while updating location.');
    } finally {
      setEditLocSubmitting(false);
    }
  }

  async function handleDeleteLocation(id: string) {
    if (!confirm('Are you sure you want to delete this studio location?')) return;
    try {
      const res = await adminFetch(`/api/locations/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const err = await res.json();
        setStatusMsg(err.error || 'Failed to delete location');
        return;
      }
      setStatusMsg('Studio location deleted and logged to audit trail.');
      loadLocations();
    } catch {
      setStatusMsg('Network error while deleting location.');
    }
  }

  // Filter bookings by location
  const filteredBookings = bookings.filter((b) => {
    if (filterLocationId === 'all') return true;
    const bookingLocId = (b as any).location_id || (b.staff as any)?.location_id || 'loc-cpt-flagship';
    return bookingLocId === filterLocationId;
  });

  // Metrics for appointments (Audit-Compliant: Memberships are separated from cash walk-ins)
  const walkInCashRevenue = filteredBookings
    .filter(
      (b) =>
        (b.status === 'confirmed' || b.status === 'completed') &&
        (b as any).is_subscription_covered !== true &&
        Number(b.total_amount) > 0
    )
    .reduce((sum, b) => sum + Number(b.total_amount), 0);
  const memberCutsCount = filteredBookings.filter(
    (b) => (b as any).is_subscription_covered === true || Number(b.total_amount) === 0
  ).length;
  const confirmedCount = filteredBookings.filter((b) => b.status === 'confirmed').length;
  const completedCount = filteredBookings.filter((b) => b.status === 'completed').length;

  return (
    <div className="space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-3xl font-bold text-white flex items-center">
              <Scissors className="mr-3 h-8 w-8 text-amber-500" />
              Bookings & Studio Operations
            </h1>
            <div className="flex items-center space-x-1.5 text-xs text-stone-300 bg-stone-900 border border-stone-800 px-3 py-1.5 rounded-lg shadow-inner">
              <MapPin className="h-4 w-4 text-amber-500" />
              <span className="font-semibold text-white">Dissafyt Studio, Cape Town</span>
              <span className="rounded bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-bold text-amber-400 border border-amber-500/20 uppercase tracking-wider">
                Flagship
              </span>
            </div>
            <div className="flex items-center space-x-1.5 text-[11px] text-emerald-400 bg-emerald-950/30 border border-emerald-500/30 px-2.5 py-1 rounded-lg font-mono">
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>Vault Encrypted (AES-256-GCM + SHA-256)</span>
            </div>
          </div>
          <p className="text-sm text-stone-400 mt-1">
            Real-time appointment schedule, specialist management (Barbers, Nail Technicians & Beauticians), encrypted payout vault, and studio locations.
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
              loadLocations();
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
              <Plus className="mr-2 h-4 w-4" /> Add Specialist
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

          {activeTab === 'locations' && (
            <Button
              size="sm"
              onClick={() => setShowAddLocationModal(true)}
              className="bg-amber-500 hover:bg-amber-400 text-black font-semibold"
            >
              <Plus className="mr-2 h-4 w-4" /> Add Studio / Branch
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
      <div className="flex flex-wrap gap-2 border-b border-stone-800 pb-1">
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
          <Users className="mr-2 h-4 w-4" /> Specialists & Staff ({staffList.length})
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

        <button
          onClick={() => setActiveTab('locations')}
          className={`flex items-center px-4 py-2 text-sm font-semibold rounded-t-lg transition-all border-b-2 ${
            activeTab === 'locations'
              ? 'border-amber-500 text-amber-400 bg-stone-900/80'
              : 'border-transparent text-stone-400 hover:text-stone-200'
          }`}
        >
          <MapPin className="mr-2 h-4 w-4" /> Locations & Studios ({locations.length})
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
              <div className="text-xs text-amber-400">Walk-In Cash Revenue</div>
              <div className="text-2xl font-bold text-amber-400 mt-1">R {walkInCashRevenue.toFixed(2)}</div>
              <div className="text-[10px] text-stone-500 mt-0.5">{memberCutsCount} Member Cuts (R0.00)</div>
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

                <div className="flex items-center space-x-1.5">
                  <MapPin className="h-4 w-4 text-stone-400" />
                  <select
                    value={filterLocationId}
                    onChange={(e) => setFilterLocationId(e.target.value)}
                    className="h-9 rounded-md border border-stone-800 bg-stone-950 px-3 text-xs text-white"
                  >
                    <option value="all">All Locations</option>
                    {locations.map((loc) => (
                      <option key={loc.id} value={loc.id}>
                        {loc.name} {loc.is_flagship ? '(Flagship)' : ''}
                      </option>
                    ))}
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
          ) : filteredBookings.length === 0 ? (
            <Card className="border-stone-800 bg-stone-900/40 p-12 text-center">
              <Calendar className="mx-auto h-8 w-8 text-stone-600 mb-2" />
              <p className="text-sm text-stone-400">No appointments found for the selected filter.</p>
            </Card>
          ) : (
            <div className="space-y-3">
              {filteredBookings.map((b) => {
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

                            {/* Payment Audit Classification */}
                            {(b as any).is_subscription_covered || Number(b.total_amount) === 0 ? (
                              <span className="rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-purple-500/10 text-purple-400 border border-purple-500/20">
                                Membership Pass
                              </span>
                            ) : (b as any).payment_status === 'paid_online' || (b as any).payment_status === 'paid_in_chair' ? (
                              <span className="rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                Paid
                              </span>
                            ) : (
                              <span className="rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-amber-500/10 text-amber-400 border border-amber-500/20">
                                Payment Due
                              </span>
                            )}
                          </div>

                          <div className="text-xs text-stone-300 flex flex-wrap items-center gap-3">
                            <div className="flex items-center space-x-1.5">
                              <span className="text-stone-400">Assigned Barber:</span>
                              <span className="font-semibold text-amber-300">
                                {b.staff?.display_name || 'Unassigned'}
                              </span>
                            </div>
                            <div className="flex items-center space-x-1 text-stone-400">
                              <MapPin className="h-3.5 w-3.5 text-amber-500" />
                              <span className="text-stone-300">
                                {b.location?.name || locations.find((l) => l.id === b.location_id)?.name || 'Dissafyt Studio, Cape Town'}
                              </span>
                            </div>
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
                          {(b as any).is_subscription_covered || Number(b.total_amount) === 0 ? (
                            <div className="text-right">
                              <span className="text-sm font-bold text-emerald-400 whitespace-nowrap">
                                Included (R0.00)
                              </span>
                              <span className="block text-[10px] text-stone-500 font-mono">Member Cut</span>
                            </div>
                          ) : (
                            <span className="text-lg font-bold text-amber-400 whitespace-nowrap">
                              R {Number(b.total_amount).toFixed(2)}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center space-x-1.5">
                          {/* Inline Mark Paid Button for Unpaid Walk-in appointments */}
                          {!((b as any).is_subscription_covered || Number(b.total_amount) === 0) &&
                            (b as any).payment_status !== 'paid_online' &&
                            (b as any).payment_status !== 'paid_in_chair' && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleUpdatePaymentStatus(b.id, 'paid_in_chair')}
                                className="text-xs border-amber-500/30 text-amber-400 hover:bg-amber-500/10 h-8"
                              >
                                <CreditCard className="mr-1 h-3 w-3" /> Mark Paid
                              </Button>
                            )}

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

                          {b.status !== 'no_show' && b.status !== 'completed' && b.status !== 'cancelled' && (
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={new Date(b.start_time) > new Date()}
                              title={
                                new Date(b.start_time) > new Date()
                                  ? 'Cannot mark upcoming appointment as no-show until start time has passed'
                                  : 'Mark as No-Show'
                              }
                              onClick={() => handleUpdateBookingStatus(b.id, 'no_show')}
                              className="text-xs border-stone-700 text-stone-400 hover:bg-stone-800 h-8 disabled:opacity-40 disabled:cursor-not-allowed"
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
      {/* TAB 2: SPECIALISTS & STAFF MANAGEMENT */}
      {/* ========================================================================= */}
      {activeTab === 'staff' && (
        <div className="space-y-6">
          {/* Add Staff Modal Form */}
          {showAddStaffModal && (
            <Card className="border-stone-700 bg-stone-900/95 p-6 shadow-2xl">
              <CardHeader className="p-0 mb-4">
                <CardTitle className="text-xl text-white">Add Specialist / Staff Member</CardTitle>
                <CardDescription>
                  Register a Barber, Nail Technician, or Beautician to accept client bookings. Banking & payout details are encrypted with AES-256-GCM and verified with SHA-256 hashing.
                </CardDescription>
              </CardHeader>

              <form onSubmit={handleCreateStaff} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label>Specialist Display Name</Label>
                    <Input
                      value={staffDisplayName}
                      onChange={(e) => setStaffDisplayName(e.target.value)}
                      placeholder="e.g. Ace (Lead Barber) or Chloe (Nail Tech)"
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <Label>Specialty / Role</Label>
                    <select
                      value={staffSpecialty}
                      onChange={(e) => setStaffSpecialty(e.target.value as any)}
                      className="w-full h-10 rounded-md border border-stone-800 bg-stone-950 px-3 text-sm text-white focus:border-amber-500 focus:outline-none"
                    >
                      <option value="barber">Barber</option>
                      <option value="nail_tech">Nail Technician</option>
                      <option value="beautician">Beautician</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <Label>Bio / Specialties</Label>
                  <Input
                    value={staffBio}
                    onChange={(e) => setStaffBio(e.target.value)}
                    placeholder="e.g. Gel & acrylic nails, facial aesthetics, or precision skin fades"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label>Direct Phone Number</Label>
                    <Input
                      value={staffPhone}
                      onChange={(e) => setStaffPhone(e.target.value)}
                      placeholder="e.g. +27 82 123 4567"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label>Studio / Station Location</Label>
                    <select
                      value={staffLocationId}
                      onChange={(e) => setStaffLocationId(e.target.value)}
                      className="w-full h-10 rounded-md border border-stone-800 bg-stone-950 px-3 text-sm text-white focus:border-amber-500 focus:outline-none"
                    >
                      {locations.map((loc) => (
                        <option key={loc.id} value={loc.id}>
                          {loc.name} {loc.is_flagship ? '(Flagship)' : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 border-t border-stone-800">
                  <div className="space-y-1">
                    <Label className="text-amber-400">Platform Split %</Label>
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      value={staffCommissionSplit}
                      onChange={(e) => setStaffCommissionSplit(e.target.value)}
                      placeholder="15"
                    />
                    <span className="text-[10px] text-stone-500">
                      Platform fee % ({100 - (Number(staffCommissionSplit) || 15)}% specialist payout)
                    </span>
                  </div>
                  <div className="space-y-1">
                    <Label>PayFast Merchant ID</Label>
                    <Input
                      value={staffPayfastId}
                      onChange={(e) => setStaffPayfastId(e.target.value)}
                      placeholder="e.g. 10024921"
                    />
                    <span className="text-[10px] text-stone-500">Encrypted at rest (AES-256-GCM)</span>
                  </div>
                  <div className="space-y-1">
                    <Label>Station POS Terminal ID</Label>
                    <Input
                      value={staffPosTerminalId}
                      onChange={(e) => setStaffPosTerminalId(e.target.value)}
                      placeholder="e.g. Yoco-Station-1"
                    />
                    <span className="text-[10px] text-stone-500">Assigned station card machine</span>
                  </div>
                </div>

                <div className="space-y-2 pt-2 border-t border-stone-800">
                  <div className="flex items-center justify-between">
                    <Label className="text-stone-300 font-semibold text-xs flex items-center gap-1.5">
                      <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
                      Direct EFT Banking & Station PIN Vault (AES-256-GCM + SHA-256 / Scrypt)
                    </Label>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                    <div className="space-y-1">
                      <Label className="text-[11px] text-stone-400">Bank Name</Label>
                      <Input
                        value={staffBankName}
                        onChange={(e) => setStaffBankName(e.target.value)}
                        placeholder="e.g. FNB"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[11px] text-stone-400">Account Number</Label>
                      <Input
                        value={staffBankAccountNum}
                        onChange={(e) => setStaffBankAccountNum(e.target.value)}
                        placeholder="Encrypted on save"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[11px] text-stone-400">Account Type</Label>
                      <select
                        value={staffBankAccountType}
                        onChange={(e) => setStaffBankAccountType(e.target.value)}
                        className="w-full h-10 rounded-md border border-stone-800 bg-stone-950 px-3 text-xs text-white focus:border-amber-500 focus:outline-none"
                      >
                        <option value="cheque">Cheque / Current</option>
                        <option value="savings">Savings</option>
                        <option value="transmission">Transmission</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[11px] text-stone-400">Branch Code</Label>
                      <Input
                        value={staffBankBranchCode}
                        onChange={(e) => setStaffBankBranchCode(e.target.value)}
                        placeholder="e.g. 250655"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[11px] text-emerald-400">Station Security PIN</Label>
                      <Input
                        type="password"
                        value={staffStationPin}
                        onChange={(e) => setStaffStationPin(e.target.value)}
                        placeholder="4+ digits (Hashed)"
                      />
                    </div>
                  </div>
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
                    {staffSubmitting ? 'Encrypting & Saving...' : 'Add Specialist'}
                  </Button>
                </div>
              </form>
            </Card>
          )}

          {/* Edit Staff Modal Form */}
          {editingStaff && (
            <Card className="border-amber-500/50 bg-stone-900/95 p-6 shadow-2xl">
              <CardHeader className="p-0 mb-4">
                <CardTitle className="text-xl text-white flex items-center">
                  <Pencil className="mr-2 h-5 w-5 text-amber-500" />
                  Edit Specialist: {editingStaff.display_name}
                </CardTitle>
                <CardDescription>
                  Update specialist role, availability, or encrypted banking details. Changes are logged to the audit trail with SHA-256 verification.
                </CardDescription>
              </CardHeader>

              <form onSubmit={handleSaveEditedStaff} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label>Specialist Display Name</Label>
                    <Input
                      value={editStaffName}
                      onChange={(e) => setEditStaffName(e.target.value)}
                      placeholder="e.g. Ace (Lead Barber)"
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <Label>Specialty / Role</Label>
                    <select
                      value={editStaffSpecialty}
                      onChange={(e) => setEditStaffSpecialty(e.target.value as any)}
                      className="w-full h-10 rounded-md border border-stone-800 bg-stone-950 px-3 text-sm text-white focus:border-amber-500 focus:outline-none"
                    >
                      <option value="barber">Barber</option>
                      <option value="nail_tech">Nail Technician</option>
                      <option value="beautician">Beautician</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <Label>Bio / Specialties</Label>
                  <Input
                    value={editStaffBio}
                    onChange={(e) => setEditStaffBio(e.target.value)}
                    placeholder="e.g. Hot towel specialist, gel manicure, or facial aesthetics"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label>Direct Phone Number</Label>
                    <Input
                      value={editStaffPhone}
                      onChange={(e) => setEditStaffPhone(e.target.value)}
                      placeholder="+27 82 123 4567"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label>Studio / Station Location</Label>
                    <select
                      value={editStaffLocationId}
                      onChange={(e) => setEditStaffLocationId(e.target.value)}
                      className="w-full h-10 rounded-md border border-stone-800 bg-stone-950 px-3 text-sm text-white focus:border-amber-500 focus:outline-none"
                    >
                      {locations.map((loc) => (
                        <option key={loc.id} value={loc.id}>
                          {loc.name} {loc.is_flagship ? '(Flagship)' : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <Label>Status</Label>
                  <div className="flex items-center space-x-4 pt-2">
                    <label className="flex items-center space-x-2 text-sm text-stone-200 cursor-pointer">
                      <input
                        type="radio"
                        checked={editStaffActive}
                        onChange={() => setEditStaffActive(true)}
                        className="accent-amber-500"
                      />
                      <span>Active (Accepting Bookings)</span>
                    </label>
                    <label className="flex items-center space-x-2 text-sm text-stone-200 cursor-pointer">
                      <input
                        type="radio"
                        checked={!editStaffActive}
                        onChange={() => setEditStaffActive(false)}
                        className="accent-amber-500"
                      />
                      <span>Unavailable (Off Schedule)</span>
                    </label>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 border-t border-stone-800">
                  <div className="space-y-1">
                    <Label className="text-amber-400">Platform Split %</Label>
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      value={editStaffCommissionSplit}
                      onChange={(e) => setEditStaffCommissionSplit(e.target.value)}
                      placeholder="15"
                    />
                    <span className="text-[10px] text-stone-500">
                      Platform fee % ({100 - (Number(editStaffCommissionSplit) || 15)}% specialist payout)
                    </span>
                  </div>
                  <div className="space-y-1">
                    <Label>PayFast Merchant ID</Label>
                    <Input
                      value={editStaffPayfastId}
                      onChange={(e) => setEditStaffPayfastId(e.target.value)}
                      placeholder="e.g. 10024921"
                    />
                    <span className="text-[10px] text-stone-500">Encrypted at rest (AES-256-GCM)</span>
                  </div>
                  <div className="space-y-1">
                    <Label>Station POS Terminal ID</Label>
                    <Input
                      value={editStaffPosTerminalId}
                      onChange={(e) => setEditStaffPosTerminalId(e.target.value)}
                      placeholder="e.g. Yoco-Station-1"
                    />
                    <span className="text-[10px] text-stone-500">Assigned station card machine</span>
                  </div>
                </div>

                <div className="space-y-2 pt-2 border-t border-stone-800">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <Label className="text-stone-300 font-semibold text-xs flex items-center gap-1.5">
                      <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
                      Direct EFT Banking & Station PIN Vault (AES-256-GCM + SHA-256 / Scrypt)
                    </Label>
                    {editingStaff.bank_account_hash && (
                      <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/40 border border-emerald-500/30 px-2 py-0.5 rounded">
                        SHA-256: {editingStaff.bank_account_hash.slice(0, 20)}...
                      </span>
                    )}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                    <div className="space-y-1">
                      <Label className="text-[11px] text-stone-400">Bank Name</Label>
                      <Input
                        value={editStaffBankName}
                        onChange={(e) => setEditStaffBankName(e.target.value)}
                        placeholder="e.g. FNB"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[11px] text-stone-400">Account Number (Masked)</Label>
                      <Input
                        value={editStaffBankAccountNum}
                        onChange={(e) => setEditStaffBankAccountNum(e.target.value)}
                        placeholder="Enter new to replace"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[11px] text-stone-400">Account Type</Label>
                      <select
                        value={editStaffBankAccountType}
                        onChange={(e) => setEditStaffBankAccountType(e.target.value)}
                        className="w-full h-10 rounded-md border border-stone-800 bg-stone-950 px-3 text-xs text-white focus:border-amber-500 focus:outline-none"
                      >
                        <option value="cheque">Cheque / Current</option>
                        <option value="savings">Savings</option>
                        <option value="transmission">Transmission</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[11px] text-stone-400">Branch Code</Label>
                      <Input
                        value={editStaffBankBranchCode}
                        onChange={(e) => setEditStaffBankBranchCode(e.target.value)}
                        placeholder="e.g. 250655"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[11px] text-emerald-400">
                        {editingStaff.has_station_pin ? 'Reset Station PIN' : 'Set Station PIN'}
                      </Label>
                      <Input
                        type="password"
                        value={editStaffStationPin}
                        onChange={(e) => setEditStaffStationPin(e.target.value)}
                        placeholder={editingStaff.has_station_pin ? 'Leave blank to keep' : '4+ digits'}
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end space-x-3 pt-3 border-t border-stone-800">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setEditingStaff(null)}
                    className="text-stone-400"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={editStaffSubmitting}
                    className="bg-amber-500 hover:bg-amber-400 text-black font-semibold"
                  >
                    {editStaffSubmitting ? 'Encrypting & Saving...' : 'Save Changes'}
                  </Button>
                </div>
              </form>
            </Card>
          )}

          {/* Staff List Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {staffList.map((staff) => {
              const roleLabel = SPECIALTY_LABELS[staff.specialty || 'barber'] || 'Barber';
              return (
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
                          <div className="flex items-center flex-wrap gap-1.5">
                            <h3 className="text-base font-bold text-white">{staff.display_name}</h3>
                            <span className="rounded bg-stone-800 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-300 border border-stone-700">
                              {roleLabel}
                            </span>
                          </div>
                          <span
                            className={`inline-flex items-center text-[10px] font-semibold px-2 py-0.5 rounded-full mt-1 ${
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

                    <p className="text-xs text-stone-400">{staff.bio || `${roleLabel} at Dissafyt Studio`}</p>

                    <div className="text-[11px] text-stone-500 border-t border-stone-800/80 pt-3 space-y-1.5">
                      {staff.phone && (
                        <div className="flex items-center text-stone-300">
                          <Phone className="h-3 w-3 mr-1 text-amber-500" />
                          <span>{staff.phone}</span>
                        </div>
                      )}
                      <div className="flex items-center text-stone-300">
                        <MapPin className="h-3 w-3 mr-1 text-amber-500" />
                        <span>
                          Stationed:{' '}
                          {staff.location?.name ||
                            locations.find((l) => l.id === staff.location_id)?.name ||
                            'Dissafyt Studio, Cape Town (Flagship)'}
                        </span>
                      </div>
                      <div>Standard Hours: Mon-Fri 09:00 - 18:00, Sat 09:00 - 17:00</div>
                    </div>

                    <div className="flex flex-wrap gap-1.5 pt-2 border-t border-stone-800/80">
                      <span className="rounded bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold text-amber-400 border border-amber-500/20">
                        {100 - (staff.commission_split_pct ?? 15)}% Payout ({staff.commission_split_pct ?? 15}% Platform)
                      </span>
                      {staff.payfast_merchant_id && (
                        <span className="rounded bg-stone-800 px-2 py-0.5 text-[10px] font-mono text-stone-300 border border-stone-700">
                          PayFast: {staff.payfast_merchant_id}
                        </span>
                      )}
                      {staff.pos_terminal_id && (
                        <span className="rounded bg-stone-800 px-2 py-0.5 text-[10px] font-mono text-amber-300 border border-amber-500/30">
                          POS: {staff.pos_terminal_id}
                        </span>
                      )}
                      {staff.bank_name && (
                        <span className="rounded bg-stone-800 px-2 py-0.5 text-[10px] text-stone-400 border border-stone-700">
                          EFT: {staff.bank_name} {staff.bank_account_number || '••••'}
                        </span>
                      )}
                      {staff.bank_account_hash && (
                        <span className="inline-flex items-center gap-1 rounded bg-emerald-500/10 px-2 py-0.5 text-[10px] font-mono text-emerald-400 border border-emerald-500/20">
                          <ShieldCheck className="h-3 w-3" /> AES-256 + SHA-256
                        </span>
                      )}
                      {staff.has_station_pin && (
                        <span className="inline-flex items-center gap-1 rounded bg-emerald-500/10 px-2 py-0.5 text-[10px] font-mono text-emerald-400 border border-emerald-500/20">
                          PIN Hashed
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="mt-6 pt-4 border-t border-stone-800 flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleToggleStaffStatus(staff)}
                        className="text-xs border-stone-700 text-stone-300"
                      >
                        {staff.is_active ? 'Set Inactive' : 'Set Active'}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEditStaffModal(staff)}
                        className="text-xs border-amber-500/30 text-amber-400 hover:bg-amber-500/10"
                        title="Edit Specialist Details"
                      >
                        <Pencil className="h-3.5 w-3.5 mr-1" /> Edit
                      </Button>
                    </div>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteStaff(staff.id)}
                      className="text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-500/10"
                      title="Delete Specialist"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </Card>
              );
            })}
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
                    placeholder="e.g. Executive Fade, Gel Manicure, or Facial"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <Label>Specialty Category</Label>
                  <select
                    value={serviceSpecialty}
                    onChange={(e) => setServiceSpecialty(e.target.value as any)}
                    className="w-full h-10 rounded-md border border-stone-800 bg-stone-950 px-3 text-sm text-white"
                  >
                    <option value="barber">Barber (Haircuts & Grooming)</option>
                    <option value="nail_tech">Nail Technician (Manicure, Pedicure, Gel)</option>
                    <option value="beautician">Beautician (Facials, Lashes, Waxing)</option>
                  </select>
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
                      {['solo', 'twice', 'executive'].map((code) => (
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

          {/* Edit Service Modal Form */}
          {editingService && (
            <Card className="border-amber-500/50 bg-stone-900/95 p-6 shadow-2xl">
              <CardHeader className="p-0 mb-6">
                <CardTitle className="text-xl text-white flex items-center">
                  <Pencil className="mr-2 h-5 w-5 text-amber-500" />
                  Edit Service: {editingService.name}
                </CardTitle>
                <CardDescription>
                  Modify service pricing, specialty category, duration, or membership tier. Changes are recorded in the audit trail.
                </CardDescription>
              </CardHeader>

              <form onSubmit={handleSaveEditedService} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label>Service / Plan Name</Label>
                  <Input
                    value={editServiceName}
                    onChange={(e) => setEditServiceName(e.target.value)}
                    placeholder="e.g. Classic Haircut"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <Label>Specialty Category</Label>
                  <select
                    value={editServiceSpecialty}
                    onChange={(e) => setEditServiceSpecialty(e.target.value as any)}
                    className="w-full h-10 rounded-md border border-stone-800 bg-stone-950 px-3 text-sm text-white"
                  >
                    <option value="barber">Barber (Haircuts & Grooming)</option>
                    <option value="nail_tech">Nail Technician (Manicure, Pedicure, Gel)</option>
                    <option value="beautician">Beautician (Facials, Lashes, Waxing)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <Label>Price (ZAR)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={editServicePrice}
                    onChange={(e) => setEditServicePrice(e.target.value)}
                    placeholder="e.g. 180.00"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <Label>Duration (Minutes)</Label>
                  <Input
                    type="number"
                    value={editServiceDuration}
                    onChange={(e) => setEditServiceDuration(e.target.value)}
                    placeholder="e.g. 30"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <Label>Service Type</Label>
                  <div className="flex items-center space-x-4 pt-2">
                    <label className="flex items-center space-x-2 text-sm text-stone-200 cursor-pointer">
                      <input
                        type="radio"
                        checked={!editServiceIsSubscription}
                        onChange={() => setEditServiceIsSubscription(false)}
                        className="accent-amber-500"
                      />
                      <span>Regular Service</span>
                    </label>
                    <label className="flex items-center space-x-2 text-sm text-stone-200 cursor-pointer">
                      <input
                        type="radio"
                        checked={editServiceIsSubscription}
                        onChange={() => setEditServiceIsSubscription(true)}
                        className="accent-amber-500"
                      />
                      <span>PayFast Monthly Membership</span>
                    </label>
                  </div>
                </div>

                {editServiceIsSubscription && (
                  <div className="space-y-1 md:col-span-2 bg-stone-800/40 p-3 rounded-lg border border-stone-800">
                    <Label className="text-amber-400">PayFast Plan Identifier</Label>
                    <div className="flex gap-4 pt-1">
                      {['solo', 'twice', 'executive'].map((code) => (
                        <label key={code} className="flex items-center space-x-1.5 text-xs text-stone-300">
                          <input
                            type="radio"
                            name="editPlanCode"
                            value={code}
                            checked={editServicePlanCode === code}
                            onChange={(e) => setEditServicePlanCode(e.target.value)}
                            className="accent-amber-500"
                          />
                          <span>{code}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                <div className="space-y-1 md:col-span-2">
                  <Label>Status</Label>
                  <div className="flex items-center space-x-4 pt-2">
                    <label className="flex items-center space-x-2 text-sm text-stone-200 cursor-pointer">
                      <input
                        type="radio"
                        checked={editServiceActive}
                        onChange={() => setEditServiceActive(true)}
                        className="accent-amber-500"
                      />
                      <span>Active (Available for booking)</span>
                    </label>
                    <label className="flex items-center space-x-2 text-sm text-stone-200 cursor-pointer">
                      <input
                        type="radio"
                        checked={!editServiceActive}
                        onChange={() => setEditServiceActive(false)}
                        className="accent-amber-500"
                      />
                      <span>Deactivated (Hidden)</span>
                    </label>
                  </div>
                </div>

                <div className="space-y-1 md:col-span-2">
                  <Label>Description</Label>
                  <Input
                    value={editServiceDescription}
                    onChange={(e) => setEditServiceDescription(e.target.value)}
                    placeholder="Brief description of grooming steps..."
                  />
                </div>

                <div className="md:col-span-2 flex justify-end space-x-3 pt-4 border-t border-stone-800">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setEditingService(null)}
                    className="text-stone-400"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={editServiceSubmitting}
                    className="bg-amber-500 hover:bg-amber-400 text-black font-semibold"
                  >
                    {editServiceSubmitting ? 'Saving Changes...' : 'Save Changes'}
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
                      <div className="flex flex-wrap items-center gap-1.5">
                        {service.is_subscription ? (
                          <span className="rounded bg-amber-500/10 text-amber-400 text-[10px] font-bold px-2 py-0.5 uppercase tracking-wider border border-amber-500/20">
                            Monthly Membership
                          </span>
                        ) : (
                          <span className="rounded bg-stone-800 text-stone-300 text-[10px] font-bold px-2 py-0.5 uppercase tracking-wider">
                            {SPECIALTY_LABELS[service.specialty || 'barber'] || 'Barber'} Service
                          </span>
                        )}
                      </div>
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
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => toggleServiceStatus(service)}
                      className="text-xs border-stone-700 text-stone-300"
                    >
                      {service.is_active ? 'Deactivate' : 'Activate'}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEditServiceModal(service)}
                      className="text-xs border-amber-500/30 text-amber-400 hover:bg-amber-500/10"
                      title="Edit Service Details"
                    >
                      <Pencil className="h-3.5 w-3.5 mr-1" /> Edit
                    </Button>
                  </div>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteService(service.id)}
                    className="text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-500/10"
                    title="Delete Service"
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
      {/* TAB 4: LOCATIONS & STUDIOS */}
      {/* ========================================================================= */}
      {activeTab === 'locations' && (
        <div className="space-y-6">
          {/* Add Studio / Location Modal */}
          {showAddLocationModal && (
            <Card className="border-amber-500/40 bg-stone-900/90 p-6 shadow-2xl">
              <div className="flex items-center justify-between border-b border-stone-800 pb-3 mb-4">
                <h2 className="text-lg font-bold text-white flex items-center">
                  <MapPin className="mr-2 h-5 w-5 text-amber-500" /> Add New Studio / Branch Location
                </h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAddLocationModal(false)}
                  className="text-stone-400"
                >
                  Cancel
                </Button>
              </div>

              <form onSubmit={handleCreateLocation} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label>Studio / Branch Name</Label>
                    <Input
                      value={newLocName}
                      onChange={(e) => setNewLocName(e.target.value)}
                      placeholder="e.g. Ace of Fyt - Sandton City Branch"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <Label>City</Label>
                    <Input
                      value={newLocCity}
                      onChange={(e) => setNewLocCity(e.target.value)}
                      placeholder="e.g. Cape Town"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <Label>Physical Address</Label>
                  <Input
                    value={newLocAddress}
                    onChange={(e) => setNewLocAddress(e.target.value)}
                    placeholder="e.g. Shop 42, Rivonia Rd, Sandton, 2196"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label>Contact Phone</Label>
                    <Input
                      value={newLocPhone}
                      onChange={(e) => setNewLocPhone(e.target.value)}
                      placeholder="+27 11 000 0000"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label>Barber Chair Capacity</Label>
                    <Input
                      type="number"
                      min="1"
                      value={newLocChairs}
                      onChange={(e) => setNewLocChairs(e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label>Google Maps Search / Directions URL</Label>
                    <Input
                      value={newLocGoogleMapsUrl}
                      onChange={(e) => setNewLocGoogleMapsUrl(e.target.value)}
                      placeholder="https://www.google.com/maps/search/?api=1&query=..."
                    />
                    <span className="text-[10px] text-stone-500">Optional. Leave blank to auto-generate from address.</span>
                  </div>
                  <div className="space-y-1">
                    <Label>Branch POS Terminal ID</Label>
                    <Input
                      value={newLocPosTerminalId}
                      onChange={(e) => setNewLocPosTerminalId(e.target.value)}
                      placeholder="e.g. Yoco-Branch-Terminal-01"
                    />
                    <span className="text-[10px] text-stone-500">Physical card machine for walk-in desk.</span>
                  </div>
                </div>

                <div className="flex justify-end space-x-3 pt-3">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setShowAddLocationModal(false)}
                    className="text-stone-400"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="bg-amber-500 hover:bg-amber-400 text-black font-semibold"
                  >
                    Register Location
                  </Button>
                </div>
              </form>
            </Card>
          )}

          {/* Edit Location Modal Form */}
          {editingLocation && (
            <Card className="border-amber-500/50 bg-stone-900/95 p-6 shadow-2xl">
              <div className="flex items-center justify-between border-b border-stone-800 pb-3 mb-4">
                <h2 className="text-lg font-bold text-white flex items-center">
                  <Pencil className="mr-2 h-5 w-5 text-amber-500" /> Edit Studio Location: {editingLocation.name}
                </h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setEditingLocation(null)}
                  className="text-stone-400"
                >
                  Cancel
                </Button>
              </div>

              <form onSubmit={handleSaveEditedLocation} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label>Studio / Branch Name</Label>
                    <Input
                      value={editLocName}
                      onChange={(e) => setEditLocName(e.target.value)}
                      placeholder="e.g. Ace of Fyt - Sandton City Branch"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <Label>City</Label>
                    <Input
                      value={editLocCity}
                      onChange={(e) => setEditLocCity(e.target.value)}
                      placeholder="e.g. Cape Town"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label>Physical Address</Label>
                    <Input
                      value={editLocAddress}
                      onChange={(e) => setEditLocAddress(e.target.value)}
                      placeholder="e.g. Shop 42, Rivonia Rd, Sandton, 2196"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <Label>Province</Label>
                    <Input
                      value={editLocProvince}
                      onChange={(e) => setEditLocProvince(e.target.value)}
                      placeholder="e.g. Gauteng or Western Cape"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label>Contact Phone</Label>
                    <Input
                      value={editLocPhone}
                      onChange={(e) => setEditLocPhone(e.target.value)}
                      placeholder="+27 11 000 0000"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label>Barber Chair Capacity</Label>
                    <Input
                      type="number"
                      min="1"
                      value={editLocChairs}
                      onChange={(e) => setEditLocChairs(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <Label>Operating Hours Display</Label>
                  <Input
                    value={editLocHours}
                    onChange={(e) => setEditLocHours(e.target.value)}
                    placeholder="Mon-Fri: 09:00 - 18:00 | Sat: 09:00 - 17:00 | Sun: Closed"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label>Google Maps Search / Directions URL</Label>
                    <Input
                      value={editLocGoogleMapsUrl}
                      onChange={(e) => setEditLocGoogleMapsUrl(e.target.value)}
                      placeholder="https://www.google.com/maps/search/?api=1&query=..."
                    />
                    <span className="text-[10px] text-stone-500">Optional. Leave blank to auto-generate from address.</span>
                  </div>
                  <div className="space-y-1">
                    <Label>Branch POS Terminal ID</Label>
                    <Input
                      value={editLocPosTerminalId}
                      onChange={(e) => setEditLocPosTerminalId(e.target.value)}
                      placeholder="e.g. Yoco-Branch-Terminal-01"
                    />
                    <span className="text-[10px] text-stone-500">Physical card machine for walk-in desk.</span>
                  </div>
                </div>

                <div className="flex items-center space-x-6 pt-2">
                  <label className="flex items-center space-x-2 text-sm text-stone-200 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editLocFlagship}
                      onChange={(e) => setEditLocFlagship(e.target.checked)}
                      className="accent-amber-500 rounded"
                    />
                    <span>Flagship Studio Designation</span>
                  </label>
                  <label className="flex items-center space-x-2 text-sm text-stone-200 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editLocActive}
                      onChange={(e) => setEditLocActive(e.target.checked)}
                      className="accent-amber-500 rounded"
                    />
                    <span>Operational & Active for Bookings</span>
                  </label>
                </div>

                <div className="flex justify-end space-x-3 pt-3 border-t border-stone-800">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setEditingLocation(null)}
                    className="text-stone-400"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={editLocSubmitting}
                    className="bg-amber-500 hover:bg-amber-400 text-black font-semibold"
                  >
                    {editLocSubmitting ? 'Saving Changes...' : 'Save Changes'}
                  </Button>
                </div>
              </form>
            </Card>
          )}

          {/* Locations Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {locations.map((loc) => (
              <Card key={loc.id} className="border border-stone-800 bg-stone-900/60 p-6 flex flex-col justify-between space-y-4">
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center space-x-2">
                        <h3 className="text-lg font-bold text-white flex items-center">
                          <MapPin className="mr-2 h-5 w-5 text-amber-500" />
                          {loc.name}
                        </h3>
                      </div>
                      <p className="text-xs text-stone-400 mt-1">{loc.address}</p>
                    </div>

                    <div className="flex flex-col items-end gap-1">
                      {loc.is_flagship && (
                        <span className="rounded bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold text-amber-400 border border-amber-500/20 uppercase tracking-wider">
                          Flagship
                        </span>
                      )}
                      <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-400 border border-emerald-500/20">
                        Operational
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2 text-xs border-t border-stone-800/80">
                    <div>
                      <span className="text-stone-500 block">Operating Hours:</span>
                      <span className="text-stone-300 font-medium">{loc.operating_hours_display}</span>
                    </div>
                    <div>
                      <span className="text-stone-500 block">Chair Capacity:</span>
                      <span className="text-stone-300 font-medium">{loc.capacity_chairs} Barber Chairs</span>
                    </div>
                    <div>
                      <span className="text-stone-500 block">POS Terminal:</span>
                      <span className="text-amber-400 font-mono font-medium">{loc.pos_terminal_id || 'Not Assigned'}</span>
                    </div>
                  </div>

                  <div className="pt-2">
                    <span className="text-xs text-stone-500 block mb-1.5">Stationed Master Barbers:</span>
                    <div className="flex flex-wrap gap-2">
                      {staffList.map((s) => (
                        <span
                          key={s.id}
                          className="inline-flex items-center text-xs bg-stone-950 border border-stone-800 text-stone-300 px-2.5 py-1 rounded-md"
                        >
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 mr-2" />
                          {s.display_name}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-stone-800 flex items-center justify-between text-xs text-stone-500">
                  <div className="space-x-3">
                    <span>City: {loc.city}, {loc.province}</span>
                    <span>Contact: {loc.phone}</span>
                  </div>

                  <div className="flex items-center space-x-2">
                    <a
                      href={
                        loc.google_maps_url ||
                        `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(loc.address + ', ' + loc.city + ', South Africa')}`
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center text-xs text-amber-400 hover:text-amber-300 border border-amber-500/30 px-2.5 py-1 rounded-md hover:bg-amber-500/10 font-medium"
                    >
                      🗺️ Map
                    </a>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEditLocationModal(loc)}
                      className="text-xs border-amber-500/30 text-amber-400 hover:bg-amber-500/10"
                      title="Edit Studio Details"
                    >
                      <Pencil className="h-3.5 w-3.5 mr-1" /> Edit
                    </Button>
                    {!loc.is_flagship && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteLocation(loc.id)}
                        className="text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-500/10"
                        title="Delete Studio Location"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            ))}

            {/* Architecture / Expansion Card */}
            <Card className="border border-dashed border-stone-800 bg-stone-950/40 p-6 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center space-x-2 text-amber-400 font-bold text-base">
                  <Building2 className="h-5 w-5 text-amber-500" />
                  <h3>Multi-Location Architecture</h3>
                </div>
                <p className="text-xs text-stone-400 leading-relaxed">
                  As specified in the Dissafyt platform architecture (<code className="text-stone-300">docs/04-modules/BARBERSHOP.md</code>),
                  service providers (barbers) and physical locations are independently represented. The platform is
                  engineered to support flagship studios and future affiliated provider branches under one shared digital system.
                </p>
                <div className="text-[11px] text-stone-500 space-y-1">
                  <div>✓ Location-specific chair allocation & operating hours</div>
                  <div>✓ Barbers stationed at single or multiple branches</div>
                  <div>✓ Integrated booking engine & unified finance reconciliation</div>
                </div>
              </div>

              <div className="pt-4">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowAddLocationModal(true)}
                  className="border-stone-800 text-stone-300 hover:bg-stone-800 text-xs w-full"
                >
                  <Plus className="mr-1.5 h-3.5 w-3.5 text-amber-500" /> Add Another Branch / Affiliate Location
                </Button>
              </div>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
