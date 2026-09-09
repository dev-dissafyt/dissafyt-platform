/**
 * Dissafyt Platform - Core Database Entity Definitions
 * Aligned with docs/02-architecture/DATABASE.md and docs/05-users/USER_SYSTEM.md
 */

export type AppRole = 'customer' | 'barber' | 'staff' | 'admin' | 'creator';

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
  brand_id?: string | null;
  design_file_url?: string | null;
  mockup_url?: string | null;
  print_placement?: Record<string, any> | null;
  is_custom_print?: boolean;
  is_active: boolean;
  images: string[];
  created_at: string;
  updated_at: string;
}

// Kasi Kollekt & Factory Production types
export type DealType = 'stacked_returns' | 'drip_income';

export interface Brand {
  id: string;
  user_id?: string | null;
  name: string;
  slug: string;
  bio?: string | null;
  logo_url?: string | null;
  deal_type: DealType;
  commission_rate: number;
  created_at: string;
  updated_at?: string;
}

export type PrintJobStatus =
  | 'pending'
  | 'printing'
  | 'qc_passed'
  | 'packed'
  | 'ready_to_pack'
  | 'dispatched'
  | 'failed_qc'
  | 'cancelled';

export interface PrintJob {
  id: string;
  ticket_number?: string;
  order_id: string;
  order_item_id?: string;
  product_id?: string | null;
  product_name?: string;
  variant_id?: string | null;
  brand_id?: string | null;
  brand_name?: string;
  deal_type?: DealType;
  garment_color: string;
  garment_size: string;
  quantity?: number;
  print_technique: 'dtf' | 'screenprint' | 'embroidery' | string;
  print_placement?: string;
  design_file_url?: string | null;
  mockup_url?: string | null;
  status: PrintJobStatus;
  tracking_number?: string | null;
  courier_tracking_number?: string | null;
  operator_notes?: string | null;
  artwork_notes?: string | null;
  created_at: string;
  updated_at: string;
  product?: Product;
  brand?: Brand;
}

export interface CreatorPayout {
  id: string;
  brand_id: string;
  order_id: string;
  print_job_id?: string | null;
  deal_type: DealType;
  amount: number;
  status: 'pending' | 'processing' | 'paid';
  created_at: string;
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

// Location / Studio types
export interface BarbershopLocation {
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
  created_at?: string;
  updated_at?: string;
}

// Audit Trail types (Invisible Audit Trail in DB)
export type AuditAction =
  | 'product.create'
  | 'product.update'
  | 'product.delete'
  | 'service.create'
  | 'service.update'
  | 'service.delete'
  | 'staff.create'
  | 'staff.update'
  | 'staff.delete'
  | 'location.create'
  | 'location.update'
  | 'location.delete'
  | 'role.assign'
  | 'role.revoke'
  | 'order.status_change'
  | 'booking.status_change';

export type AuditEntityType =
  | 'product'
  | 'service'
  | 'staff'
  | 'location'
  | 'user_role'
  | 'order'
  | 'booking';

export interface AuditLog {
  id: string;
  actor_id?: string | null;
  actor_email: string;
  actor_role: string;
  action: AuditAction | string;
  entity_type: AuditEntityType | string;
  entity_id: string;
  entity_name?: string;
  changes?: Record<string, any>;
  ip_address?: string;
  created_at: string;
}

