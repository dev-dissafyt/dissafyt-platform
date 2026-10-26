/**
 * Dissafyt Platform - Core Database Entity Definitions
 * Aligned with docs/02-architecture/DATABASE.md and docs/05-users/USER_SYSTEM.md
 */

export type AppRole = 'customer' | 'barber' | 'barbershop_manager' | 'staff' | 'admin' | 'creator';

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
  location_id?: string | null;
  created_at: string;
}

export interface UserBranchRole {
  role: AppRole;
  location_id?: string | null;
  location_name?: string | null;
}

export interface UserWithProfile extends Profile {
  roles: AppRole[];
  branch_roles?: UserBranchRole[];
  assigned_location_id?: string | null;
  assigned_location_name?: string | null;
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
  is_preorder?: boolean;
  preorder_message?: string | null;
  preorder_target?: number | null;
  preorder_deposit_pct?: number;
  preorder_claimed_count?: number;
  cost_price?: number;
  supplier_name?: string | null;
  supplier_sku?: string | null;
  batch_status?: 'accumulating' | 'batch_filled' | 'in_production' | 'dispatched' | 'completed';
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
  name: string; // e.g. "Size L - Black" or "L"
  sku: string;
  price_override?: number | null;
  cost_price_override?: number | null;
  stock_quantity: number;
  is_active: boolean;
  color?: string | null;
  color_hex?: string | null;
  size?: string | null;
  image_url?: string | null;
}

export type OrderStatus =
  | 'pending_payment'
  | 'preorder_reserved'
  | 'batch_payment_requested'
  | 'paid'
  | 'deposit_paid'
  | 'processing'
  | 'fulfilled'
  | 'shipped'
  | 'completed'
  | 'cancelled'
  | 'refunded';

export type DepositStatus = 'none' | 'deposit_paid' | 'fully_settled' | 'refunded';
export type FulfillmentChoice = 'courier' | 'studio_collection';

export interface Batch {
  id: string;
  batch_name: string;
  batch_code: string;
  capital_budget: number;
  remaining_budget: number;
  current_cogs_allocated: number;
  current_retail_value: number;
  total_units_reserved: number;
  status: 'accumulating' | 'batch_filled' | 'in_production' | 'dispatched' | 'completed' | 'cancelled';
  contingency_buffer_pct?: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Order {
  id: string;
  user_id?: string | null;
  order_number: string;
  status: OrderStatus;
  subtotal: number;
  total: number;
  deposit_paid?: number;
  balance_due?: number;
  deposit_status?: DepositStatus;
  fulfillment_choice?: FulfillmentChoice;
  collection_location_id?: string;
  customer_email?: string | null;
  customer_phone?: string | null;
  customer_name?: string | null;
  shipping_address?: Record<string, unknown> | null;
  payment_link_token?: string | null;
  batch_notified_at?: string | null;
  batch_id?: string | null;
  reservation_tier?: 'subsidized_free' | 'waitlist' | 'standard' | 'deposit_paid' | null;
  reservation_expires_at?: string | null;
  batch_settlement_requested_at?: string | null;
  batch?: Batch;
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
  is_preorder?: boolean;
  deposit_amount?: number;
  balance_amount?: number;
}

// Barbershop Service types
export type BookingStatus =
  | 'pending'
  | 'confirmed'
  | 'completed'
  | 'cancelled'
  | 'no_show';

export type StaffSpecialty = 'barber' | 'nail_tech' | 'beautician';

export interface ServiceLocation {
  id: string;
  service_id: string;
  location_id: string;
  price?: number | null;
  is_available: boolean;
  custom_duration_minutes?: number | null;
  created_at?: string;
  updated_at?: string;
}

export interface DayOperatingHours {
  open: string; // e.g. "09:00"
  close: string; // e.g. "19:00"
  is_closed: boolean;
}

export interface LocationOperatingHours {
  monday: DayOperatingHours;
  tuesday: DayOperatingHours;
  wednesday: DayOperatingHours;
  thursday: DayOperatingHours;
  friday: DayOperatingHours;
  saturday: DayOperatingHours;
  sunday: DayOperatingHours;
}

export interface BarberService {
  id: string;
  name: string;
  specialty?: StaffSpecialty | string | null;
  description?: string | null;
  duration_minutes: number;
  price: number;
  is_active: boolean;
  is_subscription?: boolean;
  plan_code?: string | null;
  billing_frequency?: number;
  billing_cycles?: number;
  extra_son_price?: number | null;
  max_sons?: number | null;
  effective_price?: number;
  location_price?: number | null;
  is_available_at_location?: boolean;
  location_pricing?: ServiceLocation[];
  created_at: string;
}

export interface Staff {
  id: string;
  user_id?: string | null;
  display_name: string;
  specialty?: StaffSpecialty | string | null;
  bio?: string | null;
  phone?: string | null;
  avatar_url?: string | null;
  working_hours?: any;
  working_days?: string[] | null;
  work_start_hour?: number | null;
  work_end_hour?: number | null;
  blocked_dates?: string[] | null;
  location_id?: string | null;
  location?: BarbershopLocation | null;
  commission_split_pct?: number;
  payfast_merchant_id?: string | null;
  bank_name?: string | null;
  bank_account_number?: string | null;
  bank_account_type?: string | null;
  bank_branch_code?: string | null;
  bank_account_hash?: string | null;
  has_station_pin?: boolean;
  pos_terminal_id?: string | null;
  is_active: boolean;
  created_at: string;
}

export type BookingPaymentStatus =
  | 'unpaid'
  | 'paid_online'
  | 'paid_in_chair'
  | 'membership_covered'
  | 'waived';

export interface Booking {
  id: string;
  customer_id: string;
  service_id: string;
  staff_id?: string | null;
  location_id?: string | null;
  start_time: string;
  end_time: string;
  status: BookingStatus;
  total_amount: number;
  base_service_amount?: number;
  admin_fee_amount?: number;
  payment_status?: BookingPaymentStatus;
  is_subscription_covered?: boolean;
  subscription_id?: string | null;
  payment_id?: string | null;
  notes?: string | null;
  created_at: string;
  updated_at: string;
}

export interface BookingWithDetails extends Booking {
  service?: BarberService;
  staff?: Staff | null;
  location?: BarbershopLocation | null;
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
  is_test?: boolean;
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
  operating_hours?: LocationOperatingHours | Record<string, DayOperatingHours> | null;
  google_maps_url?: string | null;
  google_maps_embed_url?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  pos_terminal_id?: string | null;
  admin_fee_pct?: number;
  payfast_merchant_id?: string | null;
  payfast_merchant_key?: string | null;
  payfast_passphrase?: string | null;
  use_custom_payfast?: boolean;
  payout_bank_name?: string | null;
  payout_account_number?: string | null;
  payout_branch_code?: string | null;
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

// Subscription types
export type SubscriptionStatus = 'active' | 'cancelled' | 'past_due';

export interface Subscription {
  id: string;
  user_id: string;
  plan_code: 'solo' | 'twice' | 'executive' | 'father-son' | string;
  plan_name: string;
  price: number;
  status: SubscriptionStatus;
  current_period_start: string;
  current_period_end: string;
  payfast_token?: string | null;
  created_at: string;
  updated_at: string;
}

// Newsletter types
export type NewsletterStatus = 'subscribed' | 'unsubscribed';

export interface NewsletterSubscriber {
  id: string;
  email: string;
  source: string;
  status: NewsletterStatus;
  created_at: string;
  updated_at: string;
}

// Founder Pass Entitlement & Capital Engine
export type FounderPassStatus = 'active' | 'exhausted' | 'expired' | 'pending_payment' | 'cancelled';

export interface FounderPass {
  id: string;
  pass_number: string; // e.g. 'FP-0030'
  user_id?: string | null;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  total_cuts: number; // 12
  cuts_used: number; // 0
  amount_paid: number; // 1200.00
  status: FounderPassStatus;
  payment_method?: string | null;
  payment_ref?: string | null;
  order_id?: string | null;
  notes?: string | null;
  expires_at: string;
  created_at: string;
  updated_at: string;
}

export interface FounderPassRedemption {
  id: string;
  pass_id: string;
  booking_id?: string | null;
  cut_number: number;
  service_name: string;
  barber_name?: string | null;
  notes?: string | null;
  redeemed_at: string;
}

export interface FounderPassCampaignSettings {
  id: string;
  price_per_pass: number;
  total_cuts: number;
  total_spots: number;
  capital_target: number;
  is_active: boolean;
  updated_at: string;
}

// Product Pricing Survey types
export type SurveyTierType = 'tier_50' | 'tier_75' | 'tier_100' | 'not_interested' | 'custom';

export interface ProductSurveyVote {
  id: string;
  response_id: string;
  product_id: string;
  selected_price: number;
  tier_selected: SurveyTierType;
  margin_percentage: number;
  estimated_profit?: number;
  feedback_note?: string | null;
  created_at: string;
  product?: Product;
}

export interface ProductSurveyResponse {
  id: string;
  survey_run_id?: string | null;
  respondent_name?: string | null;
  respondent_email?: string | null;
  respondent_phone?: string | null;
  general_feedback?: string | null;
  source?: string;
  ip_address?: string | null;
  user_agent?: string | null;
  created_at: string;
  votes?: ProductSurveyVote[];
}

export interface ProductSurveyPricingTier {
  key: SurveyTierType;
  label: string;
  price: number;
  marginPct: number;
  estimatedProfit: number;
}

export interface SurveyRun {
  id: string;
  title: string;
  description?: string | null;
  status: 'active' | 'completed' | 'archived' | 'draft';
  product_ids: string[];
  created_at: string;
  updated_at: string;
  completed_at?: string | null;
  created_by?: string | null;
  totalResponses?: number;
  totalVotesCast?: number;
  products?: Product[];
}


