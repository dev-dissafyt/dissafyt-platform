/**
 * DISSafyt Platform - Core Database Entity Definitions
 * Aligned with docs/02-architecture/DATABASE.md and docs/05-users/USER_SYSTEM.md
 */

export type AppRole = 'customer' | 'barber' | 'staff' | 'admin';

export interface Profile {
  id: string; // References auth.users(id)
  email?: string;
  full_name?: string | null;
  phone?: string | null;
  avatar_url?: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserRole {
  id: string;
  user_id: string;
  role: AppRole;
  created_at: string;
}

export interface UserWithProfile extends Profile {
  roles: AppRole[];
}

// Commerce types
export interface ProductCategory {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  created_at: string;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  base_price: number; // in cents or standard decimal
  category_id?: string | null;
  is_active: boolean;
  images: string[];
  created_at: string;
  updated_at: string;
}

export interface ProductVariant {
  id: string;
  product_id: string;
  name: string; // e.g. "Size L - Black"
  sku: string;
  price_override?: number | null;
  stock_quantity: number;
  is_active: boolean;
}

export type OrderStatus =
  | 'pending_payment'
  | 'paid'
  | 'processing'
  | 'fulfilled'
  | 'shipped'
  | 'completed'
  | 'cancelled'
  | 'refunded';

export interface Order {
  id: string;
  user_id: string;
  order_number: string;
  status: OrderStatus;
  subtotal: number;
  total: number;
  shipping_address?: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  variant_id?: string | null;
  product_name: string;
  unit_price: number;
  quantity: number;
  total_price: number;
}

// Barbershop Service types
export type BookingStatus =
  | 'pending'
  | 'confirmed'
  | 'completed'
  | 'cancelled'
  | 'no_show';

export interface BarberService {
  id: string;
  name: string;
  description?: string | null;
  duration_minutes: number;
  price: number;
  is_active: boolean;
  is_subscription?: boolean;
  plan_code?: string | null;
  billing_frequency?: number;
  billing_cycles?: number;
  created_at: string;
}

export interface Staff {
  id: string;
  user_id?: string | null;
  display_name: string;
  bio?: string | null;
  is_active: boolean;
  created_at: string;
}

export interface Booking {
  id: string;
  customer_id: string;
  service_id: string;
  staff_id?: string | null;
  start_time: string;
  end_time: string;
  status: BookingStatus;
  total_amount: number;
  notes?: string | null;
  created_at: string;
  updated_at: string;
}

export interface BookingWithDetails extends Booking {
  service?: BarberService;
  staff?: Staff | null;
  customer?: Profile | null;
}

// Payment types
export type PaymentStatus =
  | 'initiated'
  | 'pending'
  | 'paid'
  | 'failed'
  | 'cancelled'
  | 'refunded';

export interface Payment {
  id: string;
  user_id: string;
  provider: 'payfast' | 'manual';
  provider_reference?: string | null;
  amount: number;
  currency: string;
  status: PaymentStatus;
  related_type: 'order' | 'booking' | 'subscription';
  related_id: string;
  created_at: string;
  updated_at: string;
}
