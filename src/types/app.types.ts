// Application-specific types

export interface Module {
  id: string;
  name: string;
  description: string;
  icon: string;
  route: string;
  requiredPermissions: string[];
  dependencies?: string[];
  category: 'sales' | 'finance' | 'operations' | 'system';
}

export interface Permission {
  [key: string]: boolean;
}

export interface TeamMember extends UserProfile {
  role: UserRole;
  color: string;
}

export interface CalendarFilter {
  userIds?: string[];
  eventTypes?: EventType[];
  startDate?: Date;
  endDate?: Date;
}

export interface DashboardStats {
  totalCustomers: number;
  activeCustomers: number;
  totalRevenue: number;
  pendingInvoices: number;
  upcomingAppointments: number;
  openTasks: number;
  pipelineValue: number;
  conversionRate: number;
}

export interface NotificationItem {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  actionUrl?: string;
}

// Products & Services
export type ProductType = 'product' | 'service' | 'bundle';
export type PricingModel = 'one_time' | 'recurring' | 'usage_based' | 'tiered';
export type RecurringInterval = 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';

export interface Product {
  id: string;
  organization_id: string;
  name: string;
  description?: string;
  sku?: string;
  product_type: ProductType;
  category?: string;
  price: number;
  cost?: number;
  pricing_model: PricingModel;
  recurring_interval?: RecurringInterval;
  recurring_interval_count?: number;
  usage_unit?: string;
  usage_rate?: number;
  pricing_tiers?: Array<{
    min_qty: number;
    max_qty: number | null;
    price: number;
  }>;
  tax_rate: number;
  tax_code?: string;
  is_taxable: boolean;
  track_inventory: boolean;
  quantity_on_hand: number;
  low_stock_threshold?: number;
  is_active: boolean;
  requires_approval: boolean;
  weight?: number;
  dimensions?: string;
  estimated_duration?: number;
  duration_unit?: string;
  deliverables?: string;
  discount_type?: string;
  image_url?: string;
  custom_fields?: Record<string, any>;
  created_at: string;
  updated_at: string;
  created_by?: string;
}

// Quotes
export type QuoteStatus = 'draft' | 'sent' | 'viewed' | 'accepted' | 'declined' | 'expired' | 'converted';

export interface Quote {
  id: string;
  organization_id: string;
  quote_number: string;
  version: number;
  customer_id?: string;
  customer_name: string;
  customer_email?: string;
  customer_address?: {
    street?: string;
    city?: string;
    state?: string;
    zip?: string;
    country?: string;
  };
  quote_date: string;
  expiry_date?: string;
  valid_until_date?: string;
  status: QuoteStatus;
  subtotal: number;
  discount_amount: number;
  discount_percentage: number;
  tax_amount: number;
  total_amount: number;
  currency: string;
  payment_terms?: string;
  notes?: string;
  terms?: string;
  delivery_date?: string;
  project_duration?: string;
  sent_at?: string;
  viewed_at?: string;
  accepted_at?: string;
  declined_at?: string;
  decline_reason?: string;
  ai_generated: boolean;
  template_id?: string;
  converted_to_invoice_id?: string;
  converted_at?: string;
  custom_fields?: Record<string, any>;
  created_at: string;
  updated_at: string;
  created_by?: string;
}

export interface QuoteItem {
  id: string;
  quote_id: string;
  product_id?: string;
  product_name: string;
  description?: string;
  quantity: number;
  unit_price: number;
  discount_percentage: number;
  discount_amount: number;
  tax_rate: number;
  line_total: number;
  is_optional: boolean;
  sort_order: number;
  service_date?: string;
  created_at: string;
}

// Invoices
export type InvoiceStatus = 'draft' | 'sent' | 'viewed' | 'paid' | 'partial' | 'overdue' | 'cancelled' | 'refunded';

export interface Invoice {
  id: string;
  organization_id: string;
  invoice_number: string;
  quote_id?: string;
  customer_id?: string;
  customer_name: string;
  customer_email?: string;
  customer_address?: {
    street?: string;
    city?: string;
    state?: string;
    zip?: string;
    country?: string;
  };
  invoice_date: string;
  due_date: string;
  status: InvoiceStatus;
  subtotal: number;
  discount_amount: number;
  tax_amount: number;
  total_amount: number;
  amount_paid: number;
  amount_due: number;
  currency: string;
  payment_method?: string;
  payment_terms?: string;
  sent_at?: string;
  viewed_at?: string;
  paid_at?: string;
  last_reminder_sent_at?: string;
  reminder_count: number;
  notes?: string;
  terms?: string;
  custom_fields?: Record<string, any>;
  created_at: string;
  updated_at: string;
  created_by?: string;
}

export interface InvoiceItem {
  id: string;
  invoice_id: string;
  product_id?: string;
  product_name: string;
  description?: string;
  quantity: number;
  unit_price: number;
  discount_percentage: number;
  discount_amount: number;
  tax_rate: number;
  line_total: number;
  sort_order: number;
  created_at: string;
}

// Payments
export type PaymentMethod = 'credit_card' | 'debit_card' | 'bank_transfer' | 'check' | 'cash' | 'paypal' | 'stripe' | 'other';
export type PaymentStatus = 'pending' | 'completed' | 'failed' | 'refunded';

export interface Payment {
  id: string;
  organization_id: string;
  invoice_id: string;
  customer_id?: string;
  payment_number: string;
  amount: number;
  payment_date: string;
  payment_method?: PaymentMethod;
  transaction_id?: string;
  reference_number?: string;
  status: PaymentStatus;
  notes?: string;
  created_at: string;
  created_by?: string;
}

// Templates
export type TemplateType = 'quote' | 'invoice';
export type LayoutType = 'modern' | 'classic' | 'minimal' | 'creative';

export interface DocumentTemplate {
  id: string;
  organization_id: string;
  template_type: TemplateType;
  name: string;
  is_default: boolean;
  logo_url?: string;
  color_scheme?: {
    primary: string;
    accent: string;
  };
  font_family: string;
  layout_type: LayoutType;
  show_line_numbers: boolean;
  show_product_images: boolean;
  header_text?: string;
  footer_text?: string;
  terms_text?: string;
  custom_fields?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

// Import types from database
import type {
  UserProfile,
  UserRole,
  EventType
} from './database.types';
