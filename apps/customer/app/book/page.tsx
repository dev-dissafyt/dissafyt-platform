'use client';

import { useEffect, useState, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardTitle, CardContent, Button, Input, Label } from '@dissafyt/ui';
import {
  Scissors,
  Clock,
  ArrowLeft,
  CheckCircle,
  CreditCard,
  User,
  Calendar as CalendarIcon,
  ChevronRight,
  AlertCircle,
  Check,
  Sparkles,
  MapPin,
  CalendarCheck,
  ShieldCheck,
  Crown,
  Lock,
  Navigation,
  Compass,
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { getSupabaseBrowserClient } from '@dissafyt/database';
import { SubscriptionCarousel } from '../components/subscription-carousel';

interface Service {
  id: string;
  name: string;
  description: string;
  specialty?: 'barber' | 'nail_tech' | 'beautician' | string | null;
  duration_minutes: number;
  price: number;
  is_active: boolean;
  is_subscription?: boolean;
  plan_code?: string | null;
  effective_price?: number;
  location_price?: number | null;
  is_available_at_location?: boolean;
}

interface StaffMember {
  id: string;
  display_name: string;
  specialty?: 'barber' | 'nail_tech' | 'beautician' | string | null;
  bio?: string | null;
  location_id?: string | null;
  is_active: boolean;
}

function resolveServiceSpecialty(service: Service | null): 'barber' | 'nail_tech' | 'beautician' {
  if (!service) return 'barber';
  const raw = String(service.specialty || '').toLowerCase();
  if (raw === 'nail_tech' || raw === 'beautician' || raw === 'barber') return raw;
  const text = `${service.name || ''} ${service.description || ''}`.toLowerCase();
  if (text.includes('nail') || text.includes('manicure') || text.includes('pedicure') || text.includes('acrylic') || text.includes('gel')) {
    return 'nail_tech';
  }
  if (text.includes('facial') || text.includes('wax') || text.includes('lash') || text.includes('brow') || text.includes('beauty') || text.includes('makeup')) {
    return 'beautician';
  }
  return 'barber';
}

const SPECIALTY_BADGE: Record<string, string> = {
  barber: 'Barber',
  nail_tech: 'Nail Tech',
  beautician: 'Beautician',
};

interface AvailableSlot {
  time: string;
  startTime: string;
  endTime: string;
  availableStaff: { id: string; display_name: string }[];
}

interface LocationOption {
  id: string;
  name: string;
  address: string;
  city: string;
  province: string;
  is_flagship: boolean;
  phone?: string | null;
  operating_hours_display?: string;
  google_maps_url?: string | null;
  google_maps_embed_url?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  distanceKm?: number | null;
  distanceFormatted?: string | null;
  admin_fee_pct?: number;
}

// Fallback GPS coordinates for known branches (Cape Town / Kraaifontein)
const STUDIO_COORDINATE_FALLBACKS: Record<string, { lat: number; lng: number }> = {
  'loc-cpt-flagship': { lat: -33.865, lng: 18.726 }, // 1 Norwalk Way, Bernadino Heights, Kraaifontein
  'loc-ace-of-fyt-belmont-park': { lat: -33.8481, lng: 18.7172 }, // 67 Voortrekker Rd, Belmont Park, Kraaifontein
};

/**
 * Calculates great-circle distance in kilometers using the Haversine formula
 */
function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth radius in kilometers
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function formatDistance(distKm: number): string {
  if (distKm < 1) {
    return `${Math.round(distKm * 1000)} m away`;
  }
  return `${distKm.toFixed(1)} km away`;
}

function BookContent() {
  const searchParams = useSearchParams();
  const isSubscribedParam = searchParams.get('subscribed') === 'true';
  const planParam = searchParams.get('plan') || 'twice';
  const isCancelledParam = searchParams.get('cancelled') === 'true';

  const [justSubscribed, setJustSubscribed] = useState(false);
  const [services, setServices] = useState<Service[]>([]);
  const [staffList, setStaffList] = useState<StaffMember[]>([]);
  const [locations, setLocations] = useState<LocationOption[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<LocationOption | null>(null);
  const [loading, setLoading] = useState(true);

  // Proximity & Geolocation Recommendation State
  const [userCoords, setUserCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [detectingLocation, setDetectingLocation] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [suggestedStudio, setSuggestedStudio] = useState<LocationOption | null>(null);
  const [suggestedBarber, setSuggestedBarber] = useState<StaffMember | null>(null);

  // Subscription Gating State
  const [checkingSubscription, setCheckingSubscription] = useState(false);
  const [hasActiveSubscription, setHasActiveSubscription] = useState(false);
  const [activeSubscription, setActiveSubscription] = useState<any>(null);
  const [subscriptionQuota, setSubscriptionQuota] = useState<any>(null);
  const [customerProfile, setCustomerProfile] = useState<any>(null);

  // Helper to determine if service is covered by subscription and quota
  function isServiceCovered(service: Service | null): { covered: boolean; reason?: string } {
    if (!hasActiveSubscription || !activeSubscription) {
      return { covered: false };
    }
    if (subscriptionQuota && subscriptionQuota.available_cuts <= 0) {
      return { covered: false, reason: 'Monthly quota reached (0 cuts left)' };
    }
    if (!service) return { covered: false };

    // Cross-specialty guard: Haircut memberships only cover barber services
    if (resolveServiceSpecialty(service) !== 'barber') {
      return { covered: false, reason: 'Nail & Beauty excluded from haircut plan' };
    }

    const planCode = (subscriptionQuota?.plan_code || activeSubscription?.plan_code || 'solo').toLowerCase();
    if (planCode === 'executive') {
      return { covered: true };
    }

    const name = (service.name || '').toLowerCase();
    const isHigherTier = name.includes('combo') || name.includes('beard') || name.includes('executive');
    if ((service.duration_minutes || 0) <= 30 && !isHigherTier) {
      return { covered: true };
    }

    return { covered: false, reason: 'Service tier excluded' };
  }

  // Wizard Selection States
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedStaffId, setSelectedStaffId] = useState<string>('any');
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedSlot, setSelectedSlot] = useState<AvailableSlot | null>(null);
  const [notes, setNotes] = useState('');

  // Availability State
  const [slots, setSlots] = useState<AvailableSlot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [availabilityError, setAvailabilityError] = useState<string | null>(null);

  // Auth & Booking Status
  const [userSession, setUserSession] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [confirmedBooking, setConfirmedBooking] = useState<any>(null);

  // Quick Auth Form (if guest wants to log in or register right here)
  const [showAuthForm, setShowAuthForm] = useState(false);
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authFullName, setAuthFullName] = useState('');
  const [authIsSignUp, setAuthIsSignUp] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(false);

  // Generate the next 14 bookable days
  const dateOptions = generateNextDays(14);
  const isCheckingRef = useRef(false);

  // Function to check active subscription status with timeout
  async function checkSubscriptionStatus(token?: string) {
    if (!token) {
      setHasActiveSubscription(false);
      setActiveSubscription(null);
      setSubscriptionQuota(null);
      setCheckingSubscription(false);
      return;
    }

    if (isCheckingRef.current) return;
    isCheckingRef.current = true;
    setCheckingSubscription(true);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);

    try {
      const res = await fetch('/api/subscriptions/status', {
        headers: { Authorization: `Bearer ${token}` },
        signal: controller.signal,
      });

      if (res.ok) {
        const data = await res.json();
        setHasActiveSubscription(Boolean(data.hasActiveSubscription));
        setActiveSubscription(data.subscription || null);
        setSubscriptionQuota(data.quota || null);
      } else {
        setHasActiveSubscription(false);
        setActiveSubscription(null);
        setSubscriptionQuota(null);
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        console.warn('Subscription check error:', err.message);
      }
      setHasActiveSubscription(false);
      setSubscriptionQuota(null);
    } finally {
      clearTimeout(timeoutId);
      setCheckingSubscription(false);
      isCheckingRef.current = false;
    }
  }

  // Auto-confirm subscription on return from checkout
  async function confirmReturnSubscription(token: string) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);

    try {
      setJustSubscribed(true);
      await fetch('/api/subscriptions/confirm', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ planCode: planParam }),
        signal: controller.signal,
      });
    } catch (e) {
      console.warn('Subscription auto-confirm error:', e);
    } finally {
      clearTimeout(timeoutId);
    }
  }

  // 1. Initial Load: Services, Staff, User Session & Subscription Status
  useEffect(() => {
    let mounted = true;

    async function init() {
      try {
        // Fetch services, staff & locations in parallel so booking wizard is ready immediately
        const [sRes, stRes, locRes] = await Promise.all([
          fetch('/api/services'),
          fetch('/api/staff'),
          fetch('/api/locations'),
        ]);

        if (sRes.ok && mounted) {
          const sData: Service[] = await sRes.json();
          if (sData && sData.length > 0) {
            setServices(sData);
            // Default select first regular appointment
            const firstAppointment = sData.find((s) => !s.is_subscription);
            if (firstAppointment) setSelectedService(firstAppointment);
          }
        }

        if (stRes.ok && mounted) {
          const stData: StaffMember[] = await stRes.json();
          setStaffList(stData);
        }

        if (locRes.ok && mounted) {
          const locData: LocationOption[] = await locRes.json();
          let initialSelected = locData.find((l) => l.is_flagship) || locData[0];

          // Check if previously stored coordinates exist in sessionStorage
          try {
            const cached = sessionStorage.getItem('dissafyt_user_coords');
            if (cached) {
              const parsed = JSON.parse(cached);
              if (parsed?.latitude && parsed?.longitude) {
                setUserCoords(parsed);
                const withDist = locData.map((loc) => {
                  const locLat = loc.latitude ?? STUDIO_COORDINATE_FALLBACKS[loc.id]?.lat;
                  const locLng = loc.longitude ?? STUDIO_COORDINATE_FALLBACKS[loc.id]?.lng;
                  if (locLat !== undefined && locLng !== undefined) {
                    const dist = calculateDistanceKm(parsed.latitude, parsed.longitude, locLat, locLng);
                    return {
                      ...loc,
                      distanceKm: dist,
                      distanceFormatted: formatDistance(dist),
                    };
                  }
                  return { ...loc, distanceKm: null, distanceFormatted: null };
                });
                withDist.sort((a, b) => {
                  if (a.distanceKm === null) return 1;
                  if (b.distanceKm === null) return -1;
                  return a.distanceKm - b.distanceKm;
                });
                setLocations(withDist);
                if (withDist[0] && withDist[0].distanceKm !== null) {
                  setSuggestedStudio(withDist[0]);
                  initialSelected = withDist[0];
                }
              } else {
                setLocations(locData);
              }
            } else {
              setLocations(locData);
            }
          } catch {
            setLocations(locData);
          }

          if (initialSelected) setSelectedLocation(initialSelected);
        }

        // Set default date to tomorrow or next valid day
        if (dateOptions.length > 0 && mounted) {
          const firstAvailable = dateOptions.find((d) => !d.isSunday) || dateOptions[0];
          setSelectedDate(firstAvailable.iso);
        }

        // Check user session
        const supabase = getSupabaseBrowserClient();
        const { data: authData } = await supabase.auth.getSession();
        const session = authData?.session || null;
        if (!mounted) return;
        setUserSession(session);

        // Fetch subscription status & profile if logged in
        if (session) {
          if (isSubscribedParam) {
            await confirmReturnSubscription(session.access_token);
          }
          await checkSubscriptionStatus(session.access_token);

          // Handle returning from PayFast for confirmed appointment
          const confirmedBkId = searchParams.get('confirmed_booking');
          if (confirmedBkId && mounted) {
            try {
              const bRes = await fetch(`/api/bookings/${confirmedBkId}`, {
                headers: { Authorization: `Bearer ${session.access_token}` },
              });
              if (bRes.ok) {
                const bData = await bRes.json();
                if (bData.booking) {
                  const bk = bData.booking;
                  const d = new Date(bk.start_time);
                  const dateLabel = new Intl.DateTimeFormat('en-CA', {
                    timeZone: 'Africa/Johannesburg',
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit',
                  }).format(d);
                  const timeLabel = new Intl.DateTimeFormat('en-GB', {
                    timeZone: 'Africa/Johannesburg',
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: false,
                  }).format(d);

                  setConfirmedBooking({
                    ...bk,
                    serviceName: bk.service?.name || 'Haircut',
                    servicePrice: bk.total_amount || bk.service?.price || 0,
                    slotTime: timeLabel,
                    date: dateLabel,
                  });
                }
              }
            } catch (e) {
              console.warn('Failed to load confirmed booking from return:', e);
            }
          }

          // Handle returning from PayFast when cancelled
          const cancelledBkId = searchParams.get('cancelled_booking');
          if (cancelledBkId && mounted) {
            try {
              await fetch(`/api/bookings/${cancelledBkId}`, {
                method: 'PATCH',
                headers: {
                  'Content-Type': 'application/json',
                  Authorization: `Bearer ${session.access_token}`,
                },
                body: JSON.stringify({ action: 'cancel' }),
              });
              setBookingError('PayFast payment was cancelled. Your appointment slot has been freed up.');
            } catch (e) {
              console.warn('Failed to release cancelled booking:', e);
            }
          }

          // Fetch profile for prefilling
          fetch('/api/users/me', {
            headers: { Authorization: `Bearer ${session.access_token}` },
          })
            .then((r) => r.ok && r.json())
            .then((p) => p && mounted && setCustomerProfile(p))
            .catch((e) => console.error(e));
        }

        // Listen to auth changes
        const { data: authListener } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
          if (!mounted) return;
          setUserSession(newSession);
          if (newSession) {
            await checkSubscriptionStatus(newSession.access_token);
          } else {
            setHasActiveSubscription(false);
            setActiveSubscription(null);
            setCheckingSubscription(false);
          }
        });
      } catch (err) {
        console.error('Initialization error:', err);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    init();

    // Safety timeout: guarantee that checkingSubscription settles within 3 seconds
    const failsafeTimeout = setTimeout(() => {
      if (mounted) setCheckingSubscription(false);
    }, 3000);

    return () => {
      mounted = false;
      clearTimeout(failsafeTimeout);
    };
  }, []);

  // 1b. Reactive load of studio-scoped services & pricing when selectedLocation changes
  useEffect(() => {
    if (!selectedLocation?.id) return;
    let active = true;

    async function loadStudioServices() {
      try {
        const res = await fetch(`/api/services?location_id=${selectedLocation!.id}`);
        if (res.ok) {
          const data: Service[] = await res.json();
          if (!active) return;
          const availableServices = (data || []).filter(
            (s: any) => s.is_active !== false && s.is_available_at_location !== false
          );
          setServices(availableServices);

          // Update currently selected service with branch-specific price or fallback
          setSelectedService((prev) => {
            if (!prev) return availableServices.find((s) => !s.is_subscription) || null;
            const updatedMatch = availableServices.find((s) => s.id === prev.id);
            return updatedMatch || availableServices.find((s) => !s.is_subscription) || null;
          });
        }
      } catch (err) {
        console.warn('Failed to load studio services:', err);
      }
    }

    loadStudioServices();
    return () => {
      active = false;
    };
  }, [selectedLocation?.id]);

  // 1c. Location proximity calculation and closest barber resolution
  function applyLocationSorting(
    userLat: number,
    userLng: number,
    baseLocations = locations,
    autoSelect = true
  ) {
    if (!baseLocations || baseLocations.length === 0) return;

    const withDistances = baseLocations.map((loc) => {
      const locLat = loc.latitude ?? STUDIO_COORDINATE_FALLBACKS[loc.id]?.lat;
      const locLng = loc.longitude ?? STUDIO_COORDINATE_FALLBACKS[loc.id]?.lng;
      if (locLat !== undefined && locLng !== undefined) {
        const dist = calculateDistanceKm(userLat, userLng, locLat, locLng);
        return {
          ...loc,
          distanceKm: dist,
          distanceFormatted: formatDistance(dist),
        };
      }
      return { ...loc, distanceKm: null, distanceFormatted: null };
    });

    const sorted = [...withDistances].sort((a, b) => {
      if (a.distanceKm === null) return 1;
      if (b.distanceKm === null) return -1;
      return a.distanceKm - b.distanceKm;
    });

    setLocations(sorted);

    const closest = sorted[0];
    if (closest && closest.distanceKm !== null) {
      setSuggestedStudio(closest);
      if (autoSelect) {
        setSelectedLocation(closest);
      }

      // Find active staff stationed at this closest studio
      const studioStaff = staffList.filter(
        (s) => (s.location_id || 'loc-cpt-flagship') === closest.id && s.is_active
      );
      if (studioStaff.length > 0) {
        const topBarber =
          studioStaff.find((s) => (s.specialty || 'barber') === 'barber') || studioStaff[0];
        setSuggestedBarber(topBarber);
      }
    }
  }

  function detectUserLocation(autoSelect = true) {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser.');
      return;
    }

    setDetectingLocation(true);
    setLocationError(null);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        const coords = { latitude, longitude };
        setUserCoords(coords);
        try {
          sessionStorage.setItem('dissafyt_user_coords', JSON.stringify(coords));
        } catch {}

        setDetectingLocation(false);
        applyLocationSorting(latitude, longitude, locations, autoSelect);
      },
      (err) => {
        setDetectingLocation(false);
        if (err.code === err.PERMISSION_DENIED) {
          setLocationError('Location permission denied. Please select your preferred studio below.');
        } else if (err.code === err.POSITION_UNAVAILABLE) {
          setLocationError('Location signal unavailable. Please select your preferred studio below.');
        } else if (err.code === err.TIMEOUT) {
          setLocationError('Location request timed out. Please choose your studio manually.');
        } else {
          setLocationError('Could not determine current location.');
        }
      },
      { enableHighAccuracy: true, timeout: 9000, maximumAge: 60000 }
    );
  }

  // Auto-detect when URL has ?locate=true
  useEffect(() => {
    if (searchParams.get('locate') === 'true' && locations.length > 0 && !detectingLocation && !userCoords) {
      detectUserLocation(true);
    }
  }, [searchParams, locations.length]);

  // Synchronize suggestedBarber when suggestedStudio or staffList updates
  useEffect(() => {
    if (suggestedStudio && staffList.length > 0) {
      const studioStaff = staffList.filter(
        (s) => (s.location_id || 'loc-cpt-flagship') === suggestedStudio.id && s.is_active
      );
      if (studioStaff.length > 0) {
        const topBarber =
          studioStaff.find((s) => (s.specialty || 'barber') === 'barber') || studioStaff[0];
        setSuggestedBarber(topBarber);
      }
    }
  }, [suggestedStudio, staffList]);

  // 2. Fetch Availability whenever Service, Barber, or Date changes
  useEffect(() => {
    if (!selectedService || !selectedDate) return;

    async function fetchAvailability() {
      setLoadingSlots(true);
      setAvailabilityError(null);
      setSelectedSlot(null);

      try {
        const staffParam = selectedStaffId ? `&staffId=${selectedStaffId}` : '';
        const locParam = selectedLocation?.id ? `&locationId=${selectedLocation.id}` : '';
        const res = await fetch(
          `/api/bookings/availability?date=${selectedDate}&serviceId=${selectedService!.id}${staffParam}${locParam}`
        );

        if (res.ok) {
          const data = await res.json();
          setSlots(data.slots || []);
        } else {
          const err = await res.json();
          setAvailabilityError(err.error || 'Failed to load time slots.');
          setSlots([]);
        }
      } catch (e) {
        setAvailabilityError('Error checking slot availability.');
        setSlots([]);
      } finally {
        setLoadingSlots(false);
      }
    }

    fetchAvailability();
  }, [selectedService?.id, selectedStaffId, selectedDate, selectedLocation?.id]);

  // Quick Inline Auth Handler
  async function handleInlineAuth(e: React.FormEvent) {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError(null);
    const supabase = getSupabaseBrowserClient();

    try {
      if (authIsSignUp) {
        const { data, error } = await supabase.auth.signUp({
          email: authEmail,
          password: authPassword,
          options: {
            data: { full_name: authFullName },
          },
        });
        if (error) throw error;
        if (data.session) {
          setUserSession(data.session);
          setShowAuthForm(false);
          await checkSubscriptionStatus(data.session.access_token);
        } else {
          setAuthError('Sign up successful! Please check your email or login to continue.');
        }
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: authEmail,
          password: authPassword,
        });
        if (error) throw error;
        if (data.session) {
          setUserSession(data.session);
          setShowAuthForm(false);
          await checkSubscriptionStatus(data.session.access_token);
        }
      }
    } catch (err: any) {
      setAuthError(err.message || 'Authentication failed.');
    } finally {
      setAuthLoading(false);
    }
  }

  // Final Booking Submission
  async function handleConfirmBooking() {
    if (!selectedService || !selectedSlot) {
      setBookingError('Please select both a service and an available time slot.');
      return;
    }

    if (!userSession) {
      setShowAuthForm(true);
      return;
    }

    setSubmitting(true);
    setBookingError(null);

    try {
      const cov = isServiceCovered(selectedService);
      const isCovered = hasActiveSubscription && cov.covered;
      const chosenPayment = isCovered ? 'membership_covered' : 'payfast';

      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${userSession.access_token}`,
        },
        body: JSON.stringify({
          service_id: selectedService.id,
          staff_id: selectedStaffId !== 'any' ? selectedStaffId : null,
          start_time: selectedSlot.startTime,
          notes,
          payment_choice: chosenPayment,
          location_id: selectedLocation?.id || 'loc-cpt-flagship',
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.booking) {
        setBookingError(data.error || 'Failed to confirm booking.');
        return;
      }

      // If PayFast payment is required, redirect to PayFast gateway
      if (data.payfast) {
        const form = document.createElement('form');
        form.method = 'POST';
        form.action = data.payfast.action;
        for (const [key, value] of Object.entries(data.payfast.fields)) {
          const input = document.createElement('input');
          input.type = 'hidden';
          input.name = key;
          input.value = value as string;
          form.appendChild(input);
        }
        document.body.appendChild(form);
        form.submit();
        return;
      }

      setConfirmedBooking({
        ...data.booking,
        serviceName: selectedService.name,
        servicePrice: selectedService.price,
        slotTime: selectedSlot.time,
        date: selectedDate,
      });

      // Refresh subscription quota if covered
      if (isCovered) {
        checkSubscriptionStatus(userSession.access_token);
      }
    } catch (err: any) {
      setBookingError(err.message || 'An error occurred while confirming your booking.');
    } finally {
      setSubmitting(false);
    }
  }

  const appointments = services.filter((s) => !s.is_subscription);
  const subscriptions = services.filter((s) => s.is_subscription);

  // Success Confirmation Screen
  if (confirmedBooking) {
    return (
      <div className="container mx-auto max-w-2xl px-4 py-20">
        <Card className="border-emerald-500/40 bg-zinc-950 p-8 text-center space-y-6 shadow-2xl">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400">
            <Check className="h-8 w-8 stroke-[3]" />
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-white">Appointment Confirmed!</h1>
            <p className="text-sm text-zinc-400">
              Your appointment at <span className="text-white font-semibold">{selectedLocation?.name || 'Dissafyt Studio - Bernie'}</span> has been secured.
            </p>
          </div>

          <div className="rounded-lg border border-zinc-800 bg-zinc-900/80 p-5 text-left space-y-3">
            <div className="flex justify-between border-b border-zinc-800 pb-2">
              <span className="text-xs text-zinc-400 uppercase tracking-wider">Service</span>
              <span className="text-sm font-semibold text-white">{confirmedBooking.serviceName}</span>
            </div>
            <div className="flex justify-between border-b border-zinc-800 pb-2">
              <span className="text-xs text-zinc-400 uppercase tracking-wider">Date & Time</span>
              <span className="text-sm font-semibold text-amber-400">
                {confirmedBooking.date} at {confirmedBooking.slotTime}
              </span>
            </div>
            <div className="flex justify-between border-b border-zinc-800 pb-2">
              <span className="text-xs text-zinc-400 uppercase tracking-wider">Location</span>
              <span className="text-sm font-semibold text-white flex items-center">
                <MapPin className="h-3.5 w-3.5 text-amber-500 mr-1.5" /> {selectedLocation?.name || 'Dissafyt Studio - Bernie'}
              </span>
            </div>
            <div className="flex justify-between border-b border-zinc-800 pb-2">
              <span className="text-xs text-zinc-400 uppercase tracking-wider">Status</span>
              <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-400">
                Confirmed
              </span>
            </div>
            <div className="flex justify-between border-b border-zinc-800 pb-2">
              <span className="text-xs text-zinc-400 uppercase tracking-wider">Payment</span>
              {confirmedBooking.payment_status === 'membership_covered' || Number(confirmedBooking.total_amount) === 0 ? (
                <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-400">
                  Included in Membership (R0.00)
                </span>
              ) : confirmedBooking.payment_status === 'paid_online' || searchParams.get('paid') === '1' ? (
                <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-400">
                  Paid Online via PayFast
                </span>
              ) : (
                <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-400">
                  Paid Online via PayFast
                </span>
              )}
            </div>
            {confirmedBooking.base_service_amount && confirmedBooking.admin_fee_amount && (
              <div className="space-y-1 pt-2 border-t border-zinc-800 text-xs text-zinc-400">
                <div className="flex justify-between">
                  <span>Haircut Service:</span>
                  <span className="font-mono text-zinc-200">
                    R {Number(confirmedBooking.base_service_amount).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Platform Admin Fee:</span>
                  <span className="font-mono text-zinc-200">
                    R {Number(confirmedBooking.admin_fee_amount).toFixed(2)}
                  </span>
                </div>
              </div>
            )}
            <div className="flex justify-between pt-1">
              <span className="text-xs text-zinc-400 uppercase tracking-wider">Total</span>
              <span className="text-sm font-bold text-white">
                {confirmedBooking.payment_status === 'membership_covered' || Number(confirmedBooking.total_amount) === 0
                  ? 'R 0.00'
                  : `R ${Number(confirmedBooking.total_amount || confirmedBooking.servicePrice).toFixed(2)}`}
              </span>
            </div>
          </div>

          {/* Embedded Google Map & Turn-by-Turn Directions */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4 space-y-3 text-left">
            <div className="flex items-center justify-between">
              <div className="text-xs font-bold text-white flex items-center gap-1.5">
                <MapPin className="h-4 w-4 text-amber-500" />
                <span>Studio Location &amp; Directions</span>
              </div>
              <span className="text-[10px] font-mono text-zinc-400">
                {selectedLocation?.city || 'Cape Town'}
              </span>
            </div>

            <div className="text-xs text-zinc-300">
              {selectedLocation?.address || '1 Norwalk Way, Bernadino Heights, Kraaifontein, 7570'}
            </div>

            <div className="rounded-lg overflow-hidden border border-zinc-800 bg-zinc-950 aspect-[16/9] w-full max-h-48 relative">
              <iframe
                title="Studio Location Map"
                src={
                  selectedLocation?.google_maps_embed_url ||
                  `https://maps.google.com/maps?q=${encodeURIComponent((selectedLocation?.address || '1 Norwalk Way, Bernadino Heights, Kraaifontein, 7570') + ', South Africa')}&t=&z=15&ie=UTF8&iwloc=&output=embed`
                }
                width="100%"
                height="100%"
                style={{ border: 0 }}
                loading="lazy"
                allowFullScreen
                className="w-full h-full"
              />
            </div>

            <a
              href={
                selectedLocation?.google_maps_url ||
                `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent((selectedLocation?.address || '1 Norwalk Way, Bernadino Heights, Kraaifontein, 7570') + ', South Africa')}`
              }
              target="_blank"
              rel="noopener noreferrer"
              className="w-full inline-flex items-center justify-center rounded-lg bg-amber-500 hover:bg-amber-400 text-black px-4 py-2.5 text-xs font-bold transition-all shadow-md shadow-amber-500/20"
            >
              <MapPin className="mr-2 h-4 w-4" />
              🗺️ Open Directions in Google Maps
            </a>
          </div>

          {confirmedBooking.start_time && (
            <div className="pt-1">
              <a
                href={`https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(`Ace of Fyt: ${confirmedBooking.serviceName}`)}&dates=${new Date(confirmedBooking.start_time).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')}/${new Date(confirmedBooking.end_time || new Date(new Date(confirmedBooking.start_time).getTime() + 30 * 60000)).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')}&details=${encodeURIComponent(`Appointment with Ace of Fyt Barbershop.\nService: ${confirmedBooking.serviceName}\nStudio: ${selectedLocation?.name || 'Dissafyt Studio - Bernie'}\nAddress: ${selectedLocation?.address || '1 Norwalk Way, Bernadino Heights, Kraaifontein, 7570'}`)}&location=${encodeURIComponent(selectedLocation?.address || '1 Norwalk Way, Bernadino Heights, Kraaifontein, 7570')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full inline-flex items-center justify-center rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-2.5 text-xs font-bold text-amber-300 hover:bg-amber-500/20 transition-all shadow-sm"
              >
                <CalendarCheck className="mr-2 h-4 w-4 text-amber-400" />
                Add to Google Calendar
              </a>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <Link href="/account" className="flex-1">
              <Button className="w-full bg-amber-500 hover:bg-amber-400 text-black font-semibold">
                View in My Account
              </Button>
            </Link>
            <Button
              variant="outline"
              className="flex-1 border-zinc-700 text-zinc-300 hover:bg-zinc-800"
              onClick={() => {
                setConfirmedBooking(null);
                setSelectedSlot(null);
              }}
            >
              Book Another Slot
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  // Loading Services & Staff Screen
  if (loading) {
    return (
      <div className="container mx-auto max-w-4xl px-4 py-24 text-center space-y-4">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-amber-500/10 text-amber-500 animate-pulse">
          <Scissors className="h-7 w-7" />
        </div>
        <h2 className="text-xl font-bold text-white">Loading Ace of Fyt Barbershop...</h2>
        <p className="text-xs text-zinc-500">Preparing available chairs and styling schedule.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-6xl px-4 py-12 space-y-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-zinc-800 pb-6">
        <div>
          <Link href="/" className="inline-flex items-center text-xs text-zinc-400 hover:text-white mb-2">
            <ArrowLeft className="mr-1 h-3.5 w-3.5" /> Back to Home
          </Link>
          <div className="py-1">
            <h1 className="sr-only">Ace of Fyt Barbershop</h1>
            <Image
              src="/ace-of-fyt-logo.svg"
              alt="Ace of Fyt Barbershop"
              width={280}
              height={127}
              className="h-16 sm:h-20 w-auto object-contain dark:invert dark:brightness-110 transition-all"
              priority
            />
          </div>
          <p className="text-sm text-zinc-400 mt-1 max-w-xl">
            Cape Town’s premier grooming destination. Precision fades, scissor craft, and hot towel sculpting.
          </p>
        </div>

        <div className="flex items-center space-x-2 text-xs text-zinc-400 bg-zinc-900/90 border border-zinc-800 px-3.5 py-2 rounded-xl backdrop-blur-md">
          <MapPin className="h-4 w-4 text-amber-500" />
          <span className="font-medium">{selectedLocation?.name || 'Dissafyt Studio - Bernie'}</span>
        </div>
      </div>

      {/* Cancellation notification if customer backed out on PayFast */}
      {isCancelledParam && (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/90 p-4 text-zinc-300 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-amber-400 shrink-0" />
          <p className="text-xs text-zinc-300">
            Subscription checkout was cancelled. You can continue booking below or choose a membership at any time.
          </p>
        </div>
      )}

      {/* Active Member VIP Status Banner vs Standard Booking Banner */}
      {hasActiveSubscription ? (
        <div
          className={`rounded-xl border p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-lg ${
            subscriptionQuota && subscriptionQuota.available_cuts <= 0
              ? 'border-amber-500/40 bg-zinc-900/90'
              : 'border-emerald-500/30 bg-emerald-500/10'
          }`}
        >
          <div className="flex items-center space-x-3">
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-full ${
                subscriptionQuota && subscriptionQuota.available_cuts <= 0
                  ? 'bg-amber-500/20 text-amber-400'
                  : 'bg-emerald-500/20 text-emerald-400'
              }`}
            >
              <Crown className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-sm font-bold text-white">
                  Active Member: {subscriptionQuota?.plan_name || activeSubscription?.plan_name || 'Ace of Fyt Member'}
                </span>
                {subscriptionQuota && subscriptionQuota.available_cuts <= 0 ? (
                  <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-[10px] font-bold text-amber-300 uppercase tracking-wider border border-amber-500/30">
                    Monthly Quota Reached
                  </span>
                ) : (
                  <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-300 uppercase tracking-wider border border-emerald-500/30">
                    Priority Pass Active
                  </span>
                )}
              </div>
              <p className="text-xs text-zinc-400">
                {subscriptionQuota && subscriptionQuota.available_cuts <= 0 ? (
                  <span>
                    Welcome back{customerProfile?.full_name ? `, ${customerProfile.full_name}` : ''}! You have used all monthly cuts (0 remaining). Additional bookings are billed at standard rates. Quota renews on{' '}
                    <span className="text-amber-400 font-medium">
                      {subscriptionQuota.period_end
                        ? new Date(subscriptionQuota.period_end).toLocaleDateString('en-ZA', {
                            day: 'numeric',
                            month: 'short',
                          })
                        : 'renewal date'}
                    </span>
                    .
                  </span>
                ) : (
                  <span>
                    Welcome back{customerProfile?.full_name ? `, ${customerProfile.full_name}` : ''}! You have{' '}
                    <span className="text-emerald-400 font-semibold">
                      {subscriptionQuota ? `${subscriptionQuota.available_cuts} covered cut${subscriptionQuota.available_cuts > 1 ? 's' : ''}` : 'covered haircut'}
                    </span>{' '}
                    available this billing cycle (R0.00).
                  </span>
                )}
              </p>
            </div>
          </div>

          <div className="text-xs text-zinc-400 border-l border-zinc-800 pl-3 hidden sm:block">
            <div>
              Renewal:{' '}
              {subscriptionQuota?.period_end || activeSubscription?.current_period_end
                ? new Date(subscriptionQuota?.period_end || activeSubscription?.current_period_end).toLocaleDateString('en-ZA', {
                    day: 'numeric',
                    month: 'short',
                  })
                : 'Active'}
            </div>
            {subscriptionQuota && subscriptionQuota.available_cuts <= 0 ? (
              <div className="text-amber-400 font-semibold">0 Cuts Remaining • Standard Rate</div>
            ) : (
              <div className="text-emerald-400 font-semibold">
                {subscriptionQuota ? `${subscriptionQuota.available_cuts} of ${subscriptionQuota.total_cuts} Available` : 'Included / R0.00'}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-amber-500/30 bg-gradient-to-r from-amber-500/10 via-zinc-900 to-zinc-900 p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-lg">
          <div className="flex items-center space-x-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-500/20 text-amber-400">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-sm font-bold text-white">
                  Standard Grooming Schedule
                </span>
                <span className="rounded-full bg-zinc-800 border border-zinc-700 px-2 py-0.5 text-[10px] font-medium text-zinc-300 uppercase tracking-wider">
                  Standard Rates
                </span>
              </div>
              <p className="text-xs text-zinc-400">
                Book single cuts below at standard rates, or join a monthly membership for R0.00 regular cuts & zero queue wait times.
              </p>
            </div>
          </div>

          <a
            href="#memberships"
            className="inline-flex items-center px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold transition-all shrink-0"
          >
            <Crown className="w-3.5 h-3.5 mr-1.5" />
            View Memberships
          </a>
        </div>
      )}

      {/* Returning Subscriber Celebration Banner */}
      {(justSubscribed || (isSubscribedParam && hasActiveSubscription)) && (
        <div className="rounded-xl border border-amber-500/40 bg-gradient-to-r from-amber-500/20 via-zinc-900 to-zinc-900 p-4 text-amber-300 flex items-center gap-3.5 shadow-lg shadow-amber-500/5">
          <Sparkles className="w-6 h-6 text-amber-400 shrink-0 animate-bounce" />
          <div className="space-y-0.5">
            <p className="font-bold text-white text-sm">🎉 Membership Confirmed & Active!</p>
            <p className="text-xs text-amber-200/90">
              Welcome to Ace of Fyt VIP Grooming. Select your service, barber, and preferred time slot below to secure your chair.
            </p>
          </div>
        </div>
      )}

      {/* Main Interactive Booking Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left 8 Cols: Steps 1, 2, 3, 4 */}
        <div className="lg:col-span-8 space-y-8">
          {/* STEP 1: Choose Studio Location */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-500 text-black text-xs font-bold">
                1
              </span>
              <h2 className="text-lg font-bold text-white">Choose Studio Location</h2>
            </div>

            {/* Geolocation Detector & Nearest Barber Suggestion Box */}
            <div className="rounded-xl border border-zinc-800 bg-gradient-to-r from-zinc-900 via-zinc-900 to-zinc-950 p-4 space-y-3 shadow-md">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center space-x-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 shrink-0">
                    <Navigation className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-white">Find Closest Studio &amp; Barber</span>
                      {suggestedStudio && (
                        <span className="rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-bold px-2 py-0.5 border border-emerald-500/20 flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" />
                          Matched
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-zinc-400">
                      {suggestedStudio
                        ? `Closest studio: ${suggestedStudio.name} (${suggestedStudio.distanceFormatted})`
                        : 'Share your location to automatically discover and select your nearest studio & specialist.'}
                    </p>
                  </div>
                </div>

                <Button
                  type="button"
                  size="sm"
                  disabled={detectingLocation}
                  onClick={() => detectUserLocation(true)}
                  className="bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs h-9 px-3.5 shrink-0 shadow-sm shadow-amber-500/20"
                >
                  <MapPin className="mr-1.5 h-3.5 w-3.5" />
                  {detectingLocation
                    ? 'Locating...'
                    : userCoords
                    ? 'Refresh Location'
                    : 'Use My Location'}
                </Button>
              </div>

              {locationError && (
                <div className="text-xs text-amber-300 bg-amber-500/10 border border-amber-500/20 rounded-lg p-2.5 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>{locationError}</span>
                </div>
              )}

              {suggestedStudio && (
                <div className="rounded-lg bg-emerald-950/20 border border-emerald-500/30 p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2 text-emerald-300">
                    <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>
                      Closest Studio: <strong className="text-white font-semibold">{suggestedStudio.name}</strong>{' '}
                      <span className="font-mono text-emerald-400 font-bold">({suggestedStudio.distanceFormatted})</span>
                      {suggestedBarber && (
                        <>
                          {' '}• Suggested Barber:{' '}
                          <strong className="text-amber-300">{suggestedBarber.display_name}</strong>
                        </>
                      )}
                    </span>
                  </div>
                  {selectedLocation?.id === suggestedStudio.id ? (
                    <span className="text-[11px] font-mono text-emerald-400 font-semibold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 self-start sm:self-auto">
                      ✓ Selected as Your Studio
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setSelectedLocation(suggestedStudio)}
                      className="text-amber-400 hover:text-amber-300 font-semibold underline text-[11px] self-start sm:self-auto"
                    >
                      Switch to Closest
                    </button>
                  )}
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {locations.map((loc) => {
                const isSelected = selectedLocation?.id === loc.id;
                const isClosest = suggestedStudio?.id === loc.id;
                return (
                  <div
                    key={loc.id}
                    onClick={() => {
                      setSelectedLocation(loc);
                      // If currently chosen barber doesn't belong to this location, reset to 'any'
                      if (selectedStaffId !== 'any') {
                        const curStaff = staffList.find((s) => s.id === selectedStaffId);
                        if (curStaff?.location_id && curStaff.location_id !== loc.id) {
                          setSelectedStaffId('any');
                        }
                      }
                    }}
                    className={`cursor-pointer rounded-xl border p-4 transition-all duration-150 flex flex-col justify-between ${
                      isSelected
                        ? 'border-amber-500 bg-amber-500/10 shadow-lg shadow-amber-500/5'
                        : isClosest
                        ? 'border-emerald-500/50 bg-emerald-950/10 hover:border-emerald-500'
                        : 'border-zinc-800 bg-zinc-900/60 hover:border-zinc-700'
                    }`}
                  >
                    <div>
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex flex-wrap items-center gap-1.5">
                            <h3 className="text-base font-semibold text-white">{loc.name}</h3>
                            {loc.is_flagship && (
                              <span className="rounded bg-amber-500/10 text-amber-400 text-[10px] font-bold px-1.5 py-0.5 border border-amber-500/20 uppercase tracking-wider">
                                Flagship
                              </span>
                            )}
                            {isClosest && (
                              <span className="rounded bg-emerald-500/10 text-emerald-400 text-[10px] font-bold px-1.5 py-0.5 border border-emerald-500/20 flex items-center gap-1">
                                ★ Closest to You
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-zinc-400 mt-1 flex items-start gap-1">
                            <MapPin className="h-3.5 w-3.5 text-amber-500 shrink-0 mt-0.5" />
                            <span>{loc.address}, {loc.city}</span>
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-1 shrink-0">
                          {isSelected && <CheckCircle className="h-4 w-4 text-amber-500 shrink-0" />}
                          {loc.distanceFormatted && (
                            <span className="text-[11px] font-mono font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 rounded">
                              📍 {loc.distanceFormatted}
                            </span>
                          )}
                        </div>
                      </div>

                      {loc.operating_hours_display && (
                        <p className="text-[11px] text-zinc-500 mt-2 flex items-center gap-1">
                          <Clock className="h-3 w-3 text-zinc-400" />
                          <span>{loc.operating_hours_display}</span>
                        </p>
                      )}
                    </div>

                    <div className="mt-3 pt-3 border-t border-zinc-800/80 flex items-center justify-between text-xs">
                      <span className="text-[11px] text-zinc-400">
                        {loc.phone || '+27 81 808 2570'}
                      </span>
                      <a
                        href={
                          loc.google_maps_url ||
                          `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(loc.address + ', ' + loc.city + ', South Africa')}`
                        }
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="text-amber-400 hover:text-amber-300 font-semibold text-[11px] flex items-center hover:underline"
                      >
                        Directions &rarr;
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* STEP 2: Select Grooming Service */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-500 text-black text-xs font-bold">
                2
              </span>
              <h2 className="text-lg font-bold text-white">Choose Service</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {appointments.map((service) => {
                const isSelected = selectedService?.id === service.id;
                const svcSpecialty = resolveServiceSpecialty(service);
                return (
                  <div
                    key={service.id}
                    onClick={() => {
                      setSelectedService(service);
                      if (selectedStaffId !== 'any') {
                        const chosenStaff = staffList.find((s) => s.id === selectedStaffId);
                        const staffSpec = (chosenStaff?.specialty || 'barber').toLowerCase();
                        if (staffSpec !== svcSpecialty) {
                          setSelectedStaffId('any');
                        }
                      }
                    }}
                    className={`cursor-pointer rounded-xl border p-4 transition-all duration-150 flex flex-col justify-between ${
                      isSelected
                        ? 'border-amber-500 bg-amber-500/10 shadow-lg shadow-amber-500/5'
                        : 'border-zinc-800 bg-zinc-900/60 hover:border-zinc-700'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-1.5">
                        <h3 className="text-base font-semibold text-white">{service.name}</h3>
                        <span className="text-[9px] uppercase font-mono px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-zinc-700 shrink-0">
                          {SPECIALTY_BADGE[svcSpecialty] || 'Barber'}
                        </span>
                      </div>
                      <p className="text-xs text-zinc-400 mt-1 line-clamp-2">
                        {service.description || 'Master grooming treatment.'}
                      </p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-zinc-800/80 flex items-center justify-between text-xs">
                      <span className="text-zinc-500 flex items-center">
                        <Clock className="mr-1 h-3 w-3" /> {service.duration_minutes} mins
                      </span>
                      {(() => {
                        const cov = isServiceCovered(service);
                        if (hasActiveSubscription && cov.covered) {
                          return (
                            <span className="text-sm font-bold text-emerald-400 flex items-center">
                              <CheckCircle className="w-3.5 h-3.5 mr-1" />
                              Included
                            </span>
                          );
                        }
                        const effectivePrice = Number(service.effective_price ?? service.price);
                        const hasCustomPrice =
                          service.effective_price !== undefined &&
                          service.effective_price !== null &&
                          Number(service.effective_price) !== Number(service.price);

                        return (
                          <div className="text-right">
                            <div className="flex items-baseline justify-end gap-1.5">
                              <span className="text-sm font-bold text-white">
                                R {effectivePrice.toFixed(2)}
                              </span>
                              {hasCustomPrice && (
                                <span className="text-[10px] text-zinc-500 line-through">
                                  R {Number(service.price).toFixed(2)}
                                </span>
                              )}
                            </div>
                            {hasActiveSubscription && cov.reason && (
                              <div className="text-[9px] text-zinc-400">{cov.reason}</div>
                            )}
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* STEP 3: Choose Specialist */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-500 text-black text-xs font-bold">
                3
              </span>
              <h2 className="text-lg font-bold text-white">
                Select {SPECIALTY_BADGE[resolveServiceSpecialty(selectedService)] || 'Specialist'}
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Any Specialist Option */}
              <div
                onClick={() => setSelectedStaffId('any')}
                className={`cursor-pointer rounded-xl border p-4 transition-all ${
                  selectedStaffId === 'any'
                    ? 'border-amber-500 bg-amber-500/10'
                    : 'border-zinc-800 bg-zinc-900/60 hover:border-zinc-700'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-800 text-amber-400 font-bold text-xs">
                    <Sparkles className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-white">
                      Any Available {SPECIALTY_BADGE[resolveServiceSpecialty(selectedService)] || 'Specialist'}
                    </div>
                    <div className="text-xs text-zinc-400">Fastest availability</div>
                  </div>
                </div>
              </div>

              {/* Individual Specialists stationed at selected location matching service specialty */}
              {staffList
                .filter(
                  (barber) =>
                    (!barber.location_id || !selectedLocation || barber.location_id === selectedLocation.id) &&
                    String(barber.specialty || 'barber').toLowerCase() === resolveServiceSpecialty(selectedService)
                )
                .map((barber) => {
                  const isSelected = selectedStaffId === barber.id;
                  const isSuggested = suggestedBarber?.id === barber.id;
                  return (
                    <div
                      key={barber.id}
                      onClick={() => setSelectedStaffId(barber.id)}
                      className={`cursor-pointer rounded-xl border p-4 transition-all ${
                        isSelected
                          ? 'border-amber-500 bg-amber-500/10 shadow-lg shadow-amber-500/5'
                          : isSuggested
                          ? 'border-emerald-500/50 bg-emerald-950/10 hover:border-emerald-500'
                          : 'border-zinc-800 bg-zinc-900/60 hover:border-zinc-700'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-800 text-white font-bold text-sm shrink-0">
                          {barber.display_name.charAt(0)}
                        </div>
                        <div className="truncate flex-1">
                          <div className="flex items-center gap-1.5 truncate">
                            <span className="text-sm font-semibold text-white truncate">
                              {barber.display_name}
                            </span>
                            {isSuggested && (
                              <span className="rounded bg-emerald-500/10 text-emerald-400 text-[9px] font-bold px-1.5 py-0.5 border border-emerald-500/20 shrink-0">
                                ★ Suggested Closest
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-zinc-400 truncate">
                            {barber.bio || SPECIALTY_BADGE[String(barber.specialty || 'barber').toLowerCase()] || 'Specialist'}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>

          {/* STEP 4: Select Date & Available Time Slots */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-500 text-black text-xs font-bold">
                4
              </span>
              <h2 className="text-lg font-bold text-white">Pick Date & Time</h2>
            </div>

            {/* Horizontal Date Picker */}
            <div className="flex space-x-2 overflow-x-auto pb-2 scrollbar-thin">
              {dateOptions.map((d) => {
                const isSelected = selectedDate === d.iso;
                return (
                  <button
                    key={d.iso}
                    disabled={d.isSunday}
                    onClick={() => setSelectedDate(d.iso)}
                    className={`flex-shrink-0 flex flex-col items-center justify-center w-16 py-3 rounded-xl border text-center transition-all ${
                      d.isSunday
                        ? 'border-zinc-900 bg-zinc-950/40 text-zinc-600 opacity-40 cursor-not-allowed'
                        : isSelected
                        ? 'border-amber-500 bg-amber-500 text-black font-bold'
                        : 'border-zinc-800 bg-zinc-900/60 text-zinc-300 hover:border-zinc-700'
                    }`}
                  >
                    <span className="text-[10px] uppercase tracking-wider">{d.dayName}</span>
                    <span className="text-lg font-bold">{d.dayNumber}</span>
                    <span className="text-[9px] uppercase">{d.monthName}</span>
                  </button>
                );
              })}
            </div>

            {/* Available Time Slots Grid */}
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-5">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs text-zinc-400 font-medium">
                  Available slots for <span className="text-white font-semibold">{selectedDate}</span>:
                </span>
                {loadingSlots && <span className="text-xs text-amber-500 animate-pulse">Checking slots...</span>}
              </div>

              {loadingSlots ? (
                <div className="py-8 text-center text-sm text-zinc-500">Checking barber schedule...</div>
              ) : availabilityError ? (
                <div className="py-4 text-center text-xs text-rose-400">{availabilityError}</div>
              ) : slots.length === 0 ? (
                <div className="py-8 text-center text-xs text-zinc-500">
                  No slots available for this date. Barbershop is closed or fully booked.
                </div>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2.5">
                  {slots.map((slot) => {
                    const isSelected = selectedSlot?.startTime === slot.startTime;
                    return (
                      <button
                        key={slot.startTime}
                        onClick={() => setSelectedSlot(slot)}
                        className={`py-2 px-3 rounded-lg text-xs font-semibold border transition-all ${
                          isSelected
                            ? 'border-amber-500 bg-amber-500 text-black shadow-md shadow-amber-500/20'
                            : 'border-zinc-800 bg-zinc-900 text-zinc-200 hover:border-zinc-700 hover:text-white'
                        }`}
                      >
                        {slot.time}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right 4 Cols: Order Summary & Confirmation Box */}
        <div className="lg:col-span-4 space-y-6">
          <Card className="border-zinc-800 bg-zinc-900/90 p-6 sticky top-24 space-y-6">
            <CardTitle className="text-lg text-white flex items-center">
              <CalendarCheck className="mr-2 h-5 w-5 text-amber-500" />
              Booking Summary
            </CardTitle>

            <div className="space-y-3 text-xs border-b border-zinc-800 pb-4">
              <div className="flex justify-between">
                <span className="text-zinc-400">Membership Tier</span>
                <span className="text-amber-400 font-semibold">
                  {hasActiveSubscription ? activeSubscription?.plan_name || 'Active Member' : 'Standard Client'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Service</span>
                <span className="text-white font-semibold">{selectedService?.name || 'None selected'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Duration</span>
                <span className="text-white">{selectedService?.duration_minutes || 0} minutes</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Barber</span>
                <span className="text-white font-medium">
                  {selectedStaffId === 'any'
                    ? 'Any Available Barber'
                    : staffList.find((s) => s.id === selectedStaffId)?.display_name || 'Selected'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Date</span>
                <span className="text-white">{selectedDate || 'Not chosen'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Time</span>
                <span className="text-amber-400 font-bold">{selectedSlot?.time || 'Not chosen'}</span>
              </div>
              <div className="flex justify-between items-start pt-1">
                <span className="text-zinc-400">Studio</span>
                <div className="text-right">
                  <span className="text-white font-medium flex items-center justify-end">
                    <MapPin className="h-3 w-3 mr-1 text-amber-500" /> {selectedLocation?.name || 'Dissafyt Studio - Bernie'}
                  </span>
                  <div className="text-[10px] text-zinc-400 max-w-[190px] truncate">
                    {selectedLocation?.address || '1 Norwalk Way, Kraaifontein'}
                  </div>
                  <a
                    href={
                      selectedLocation?.google_maps_url ||
                      `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent((selectedLocation?.address || '1 Norwalk Way, Bernadino Heights, Kraaifontein, 7570') + ', South Africa')}`
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[10px] text-amber-400 hover:text-amber-300 font-semibold inline-block hover:underline"
                  >
                    🗺️ Directions &rarr;
                  </a>
                </div>
              </div>
            </div>

            {/* Transparent Pricing Breakdown: Haircut + Platform Admin Fee */}
            <div className="space-y-2.5 pt-3 border-t border-zinc-800">
              <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-zinc-400">
                <span>Fee Breakdown</span>
                <span className="text-[10px] text-amber-400 font-mono font-bold bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                  {selectedLocation?.admin_fee_pct ?? 5}% Platform Fee Included
                </span>
              </div>

              {(() => {
                const cov = isServiceCovered(selectedService);
                if (hasActiveSubscription && cov.covered) {
                  return (
                    <div className="flex justify-between items-center text-sm font-bold">
                      <span className="text-zinc-300">Appointment Fee</span>
                      <span className="text-lg text-emerald-400">
                        Included <span className="text-[10px] text-zinc-500 font-normal">in Membership (R0.00)</span>
                      </span>
                    </div>
                  );
                }

                const basePrice = selectedService
                  ? Number(selectedService.effective_price ?? selectedService.price)
                  : 0;
                const adminFeePct = Number(selectedLocation?.admin_fee_pct ?? 5.00);
                const adminFeeAmount = Number(((basePrice * adminFeePct) / 100).toFixed(2));
                const totalAmount = Number((basePrice + adminFeeAmount).toFixed(2));

                return (
                  <div className="space-y-2 text-xs rounded-xl bg-zinc-950/60 border border-zinc-800/80 p-3">
                    <div className="flex justify-between items-center text-zinc-300">
                      <span className="flex items-center gap-1.5 font-medium">
                        <Scissors className="h-3.5 w-3.5 text-amber-500" />
                        <span>{selectedService?.name || 'Haircut Service'}</span>
                      </span>
                      <span className="font-mono text-white">
                        R {basePrice.toFixed(2)}
                      </span>
                    </div>

                    <div className="flex justify-between items-center text-zinc-400">
                      <span className="flex items-center gap-1.5">
                        <ShieldCheck className="h-3.5 w-3.5 text-amber-500/70" />
                        <span>Platform Admin Fee ({adminFeePct}%)</span>
                      </span>
                      <span className="font-mono text-zinc-300">
                        R {adminFeeAmount.toFixed(2)}
                      </span>
                    </div>

                    <div className="flex justify-between items-center pt-2 border-t border-zinc-800 text-sm font-bold">
                      <span className="text-white">Total Due Today</span>
                      <span className="text-lg font-mono text-amber-400">
                        R {totalAmount.toFixed(2)}
                      </span>
                    </div>

                    {hasActiveSubscription && cov.reason && (
                      <div className="text-[10px] text-amber-400 pt-1">
                        {cov.reason}
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>

            {/* Payment Method Selector (When service requires payment) */}
            {(() => {
              const cov = isServiceCovered(selectedService);
              if (hasActiveSubscription && cov.covered) {
                return (
                  <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-300 flex items-center space-x-2">
                    <Crown className="h-4 w-4 text-emerald-400 shrink-0" />
                    <span>Included in your active membership quota (R0.00).</span>
                  </div>
                );
              }
              return (
                <div className="space-y-2 pt-2 border-t border-zinc-800">
                  <Label className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">
                    Payment Method
                  </Label>
                  <div className="flex items-start text-left p-3.5 rounded-xl border border-amber-500/40 bg-amber-500/5 text-white">
                    <div className="flex h-5 items-center mr-3 text-amber-400">
                      <CreditCard className="h-4 w-4" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-white">
                          Pay Online via PayFast
                        </span>
                        <span className="text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                          Instant Confirm
                        </span>
                      </div>
                      <p className="text-[11px] text-zinc-400 mt-1 leading-relaxed">
                        Cards, Instant EFT, Capitec Pay, SnapScan. Booking confirmed immediately upon checkout.
                      </p>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Special Requests / Notes */}
            <div className="space-y-1.5">
              <Label className="text-xs text-zinc-400">Grooming Notes (Optional)</Label>
              <Input
                placeholder="e.g., skin fade, taper, keep mustache"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="bg-zinc-950 border-zinc-800 text-xs text-white"
              />
            </div>

            {bookingError && (
              <div className="rounded border border-rose-500/20 bg-rose-500/10 p-2 text-xs text-rose-400">
                {bookingError}
              </div>
            )}

            <Button
              disabled={!selectedSlot || submitting}
              onClick={handleConfirmBooking}
              className="w-full bg-amber-500 hover:bg-amber-400 text-black font-bold text-sm py-5 shadow-lg shadow-amber-500/10"
            >
              {submitting
                ? 'Redirecting to PayFast...'
                : (() => {
                    const cov = isServiceCovered(selectedService);
                    if (hasActiveSubscription && cov.covered) {
                      return 'Confirm Appointment (Included in Membership)';
                    }
                    const basePrice = selectedService
                      ? Number(selectedService.effective_price ?? selectedService.price)
                      : 0;
                    const adminFeePct = Number(selectedLocation?.admin_fee_pct ?? 5.00);
                    const totalAmount = Number((basePrice + (basePrice * adminFeePct) / 100).toFixed(2));
                    return `Pay with PayFast (R ${totalAmount.toFixed(2)})`;
                  })()}
            </Button>
          </Card>
        </div>
      </div>

      {/* Subscription Carousel Section */}
      <div id="memberships" className="pt-12 border-t border-zinc-800 space-y-4">
        <SubscriptionCarousel
          title="Ace of Fyt Barbershop Memberships"
          subtitle={
            hasActiveSubscription
              ? "You are currently an active subscriber. You can review plan benefits, change plans, or add family members below."
              : "Subscribe to a monthly plan to unlock regular haircuts, queue-free priority booking, and R0.00 appointment fees."
          }
          onSubscribed={() => {
            if (userSession) checkSubscriptionStatus(userSession.access_token);
          }}
        />
      </div>

      {/* Quick Auth Dialog Modal for Guests confirming appointment */}
      {showAuthForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <Card className="w-full max-w-md border-zinc-800 bg-zinc-950 p-6 space-y-5 shadow-2xl relative">
            <button
              onClick={() => setShowAuthForm(false)}
              className="absolute top-4 right-4 text-zinc-400 hover:text-white text-lg font-bold"
            >
              ✕
            </button>

            <div className="space-y-1 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-amber-500/10 text-amber-400 mb-2">
                <Scissors className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold text-white">
                {authIsSignUp ? 'Create Your Account' : 'Sign In to Confirm Booking'}
              </h3>
              <p className="text-xs text-zinc-400">
                Sign in or register to secure your chair at Ace of Fyt Barbershop.
              </p>
            </div>

            <form onSubmit={handleInlineAuth} className="space-y-3.5">
              {authIsSignUp && (
                <div className="space-y-1">
                  <Label className="text-xs text-zinc-300">Full Name</Label>
                  <Input
                    required
                    placeholder="e.g. Sipho Khumalo"
                    value={authFullName}
                    onChange={(e) => setAuthFullName(e.target.value)}
                    className="bg-zinc-900 border-zinc-800 text-sm text-white"
                  />
                </div>
              )}

              <div className="space-y-1">
                <Label className="text-xs text-zinc-300">Email Address</Label>
                <Input
                  required
                  type="email"
                  placeholder="you@example.com"
                  value={authEmail}
                  onChange={(e) => setAuthEmail(e.target.value)}
                  className="bg-zinc-900 border-zinc-800 text-sm text-white"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs text-zinc-300">Password</Label>
                <Input
                  required
                  type="password"
                  placeholder="••••••••"
                  value={authPassword}
                  onChange={(e) => setAuthPassword(e.target.value)}
                  className="bg-zinc-900 border-zinc-800 text-sm text-white"
                />
              </div>

              {authError && (
                <div className="rounded-lg border border-rose-500/20 bg-rose-500/10 p-2.5 text-xs text-rose-400">
                  {authError}
                </div>
              )}

              <Button
                type="submit"
                disabled={authLoading}
                className="w-full bg-amber-500 hover:bg-amber-400 text-black font-bold text-sm py-4"
              >
                {authLoading
                  ? 'Processing...'
                  : authIsSignUp
                  ? 'Create Account & Continue'
                  : 'Sign In & Continue'}
              </Button>
            </form>

            <div className="text-center pt-2 border-t border-zinc-800">
              <button
                type="button"
                onClick={() => {
                  setAuthIsSignUp(!authIsSignUp);
                  setAuthError(null);
                }}
                className="text-xs text-amber-400 hover:text-amber-300"
              >
                {authIsSignUp
                  ? 'Already have an account? Sign In'
                  : "Don't have an account? Sign Up"}
              </button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

/**
 * Helper to generate an array of bookable dates
 */
function generateNextDays(daysCount: number) {
  const days = [];
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  // Anchor base date to SAST (Africa/Johannesburg, UTC+2) to prevent midnight date rollover issues
  const now = new Date();
  const sastDateStr = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Africa/Johannesburg',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now);

  const [baseYear, baseMonth, baseDay] = sastDateStr.split('-').map(Number);

  for (let i = 0; i < daysCount; i++) {
    const d = new Date(Date.UTC(baseYear, baseMonth - 1, baseDay + i, 12, 0, 0));

    const year = d.getUTCFullYear();
    const month = String(d.getUTCMonth() + 1).padStart(2, '0');
    const dateNum = String(d.getUTCDate()).padStart(2, '0');
    const iso = `${year}-${month}-${dateNum}`;

    const isSunday = d.getUTCDay() === 0;

    days.push({
      iso,
      dayName: dayNames[d.getUTCDay()],
      dayNumber: d.getUTCDate(),
      monthName: monthNames[d.getUTCMonth()],
      isSunday,
    });
  }

  return days;
}

export default function BookPage() {
  return (
    <Suspense
      fallback={
        <div className="container mx-auto max-w-4xl px-4 py-24 text-center space-y-4">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-amber-500/10 text-amber-500 animate-pulse">
            <Scissors className="h-7 w-7" />
          </div>
          <h2 className="text-xl font-bold text-white">Loading Booking Portal...</h2>
        </div>
      }
    >
      <BookContent />
    </Suspense>
  );
}
