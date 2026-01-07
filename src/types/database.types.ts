// Database types generated from Supabase schema

export interface Organization {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  primary_color: string;
  timezone: string;
  business_hours: {
    start: string;
    end: string;
  };
  enabled_modules: string[];
  industry_template: 'accounting' | 'distribution' | 'consulting' | 'service_provider' | 'custom' | null;
  subscription_tier: 'free' | 'starter' | 'professional' | 'enterprise';
  max_users: number;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  phone: string | null;
  default_org_id: string | null;
  preferences: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export type UserRole = 'owner' | 'admin' | 'manager' | 'user';

export interface OrganizationMember {
  id: string;
  organization_id: string;
  user_id: string;
  role: UserRole;
  permissions: Record<string, boolean>;
  calendar_delegation: string[];
  can_view_team_calendars: boolean;
  joined_at: string;
}

export type CustomerType = 'Individual' | 'Business' | 'Government' | 'Non-Profit';
export type CustomerPriority = 'Low' | 'Medium' | 'High';
export type CustomerStatus = 'Active' | 'Inactive';

export interface Customer {
  id: string;
  organization_id: string;
  name: string;
  first_name?: string | null;
  middle_name?: string | null;
  last_name?: string | null;
  customer_category?: 'Personal' | 'Business';
  email: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  postal_code: string | null;
  country: string;
  company: string | null;
  title: string | null;
  type: CustomerType;
  priority: CustomerPriority;
  status: CustomerStatus;
  notes: string | null;
  total_spent: number;
  last_purchase: string | null;
  custom_fields: Record<string, any>;
  tags: string[];
  created_by: string | null;
  created_at: string;
  updated_at: string;
  customer_type?: 'personal' | 'business';
  business_stage?: string | null;
  business_structure?: string | null;
  industry?: string | null;
  hours_per_week?: number | null;
  website?: string | null;
  linkedin?: string | null;
  twitter?: string | null;
  facebook?: string | null;
  instagram?: string | null;
  date_of_birth?: string | null;
  gender?: string | null;
  occupation?: string | null;
  preferred_contact_method?: 'email' | 'phone' | 'sms' | 'any';
  avatar_url?: string | null;
  last_contact_date?: string | null;
  next_follow_up_date?: string | null;
}

export type EventType = 'meeting' | 'call' | 'task' | 'deadline' | 'appointment';
export type EventStatus = 'scheduled' | 'confirmed' | 'cancelled' | 'completed' | 'no_show';

export interface CalendarEvent {
  id: string;
  organization_id: string;
  user_id: string;
  customer_id: string | null;
  cal_com_event_id: string | null;
  title: string;
  description: string | null;
  event_type: EventType;
  start_time: string;
  end_time: string;
  location: string | null;
  meeting_url: string | null;
  status: EventStatus;
  is_recurring: boolean;
  recurrence_rule: string | null;
  attendees: Array<{
    email: string;
    name: string;
    status?: string;
  }>;
  color_code: string;
  reminders: Array<{
    minutes: number;
    method: string;
  }>;
  metadata: Record<string, any>;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export type CallDirection = 'inbound' | 'outbound';
export type CallStatus = 'initiated' | 'ringing' | 'in_progress' | 'completed' | 'failed' | 'no_answer';

export interface Call {
  id: string;
  organization_id: string;
  user_id: string | null;
  customer_id: string | null;
  retell_call_id: string | null;
  direction: CallDirection;
  phone_number: string;
  status: CallStatus;
  duration_seconds: number;
  recording_url: string | null;
  transcript: string | null;
  sentiment_score: number | null;
  call_summary: string | null;
  action_items: string[] | Array<{
    description: string;
    completed?: boolean;
  }>;
  started_at: string | null;
  ended_at: string | null;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
  // Extended fields used in the app
  call_type?: 'human' | 'ai_agent';
  agent_id?: string | null;
  agent_type?: string | null;
  agent_name?: string | null;
  outcome?: string | null;
  customer_phone?: string | null;
  customers?: {
    first_name?: string | null;
    last_name?: string | null;
    name?: string | null;
    company?: string | null;
  } | null;
}

export interface CustomerContact {
  id: string;
  customer_id: string;
  name: string;
  title: string | null;
  email: string | null;
  phone: string | null;
  is_primary: boolean;
  created_at: string;
  updated_at: string;
}

export type NoteType = 'general' | 'call' | 'meeting' | 'email' | 'follow_up' | 'important';

export interface CustomerNote {
  id: string;
  organization_id: string;
  customer_id: string;
  user_id: string | null;
  note_type: NoteType;
  content: string;
  is_pinned: boolean;
  created_at: string;
  updated_at: string;
}

export interface CustomerFile {
  id: string;
  organization_id: string;
  customer_id: string;
  uploaded_by: string | null;
  file_name: string;
  file_url: string;
  file_type: string | null;
  file_size: number | null;
  created_at: string;
}

export type QuoteStatus = 'Draft' | 'Sent' | 'Accepted' | 'Declined' | 'Expired';

export interface LineItem {
  id: string;
  description: string;
  quantity: number;
  unit_price: number;
  total: number;
  product_id?: string;
}

export interface Quote {
  id: string;
  organization_id: string;
  quote_number: string;
  customer_id: string;
  customer_name: string;
  customer_email: string | null;
  customer_phone: string | null;
  customer_address: string | null;
  date: string;
  expiry_date: string;
  items: LineItem[];
  subtotal: number;
  tax_rate: number;
  tax: number;
  total: number;
  notes: string | null;
  message: string | null;
  status: QuoteStatus;
  sent_at: string | null;
  accepted_at: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export type ProductStatus = 'Active' | 'Inactive';

export interface Product {
  id: string;
  organization_id: string;
  name: string;
  sku: string;
  description: string | null;
  category: string | null;
  price: number;
  cost: number | null;
  quantity: number;
  low_stock_threshold: number;
  status: ProductStatus;
  image_url: string | null;
  metadata: Record<string, any>;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export type InvoiceStatus = 'Draft' | 'Issued' | 'Paid' | 'Part paid' | 'Cancelled' | 'Disputed' | 'On hold';

export interface Invoice {
  id: string;
  organization_id: string;
  invoice_number: string;
  customer_id: string;
  quote_id: string | null;
  customer_name: string;
  customer_email: string | null;
  customer_address: string | null;
  date: string;
  due_date: string;
  items: LineItem[];
  subtotal: number;
  tax_rate: number;
  tax: number;
  total: number;
  paid_amount: number;
  notes: string | null;
  status: InvoiceStatus;
  payment_date: string | null;
  stripe_payment_intent_id: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export type PipelineStage = 'lead' | 'qualified' | 'proposal' | 'negotiation' | 'closed_won' | 'closed_lost';
export type FinalStatus = 'Sale' | 'No Sale';

export interface PipelineItem {
  id: string;
  organization_id: string;
  customer_id: string;
  assigned_to: string | null;
  stage: PipelineStage;
  title: string;
  description: string | null;
  value: number | null;
  probability: number;
  expected_close_date: string | null;
  final_status: FinalStatus | null;
  lost_reason: string | null;
  tags: string[];
  metadata: Record<string, any>;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';
export type TaskStatus = 'todo' | 'in_progress' | 'completed' | 'cancelled';

export interface Task {
  id: string;
  organization_id: string;
  user_id: string;
  customer_id: string | null;
  calendar_event_id: string | null;
  title: string;
  description: string | null;
  due_date: string | null;
  due_time: string | null;
  priority: TaskPriority;
  status: TaskStatus;
  completed_at: string | null;
  assigned_to: string | null;
  category: string | null;
  tags: string[];
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface ActivityLog {
  id: string;
  organization_id: string;
  user_id: string | null;
  entity_type: string;
  entity_id: string;
  action: string;
  changes: Record<string, any> | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

// Form types for creating/updating entities
export interface CustomerFormData {
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country?: string;
  company?: string;
  title?: string;
  type?: CustomerType;
  priority?: CustomerPriority;
  status?: CustomerStatus;
  notes?: string;
  tags?: string[];
  custom_fields?: Record<string, any>;
}

export interface CalendarEventFormData {
  title: string;
  description?: string;
  event_type?: EventType;
  start_time: string;
  end_time: string;
  location?: string;
  meeting_url?: string;
  customer_id?: string;
  attendees?: Array<{
    email: string;
    name: string;
  }>;
  color_code?: string;
  is_recurring?: boolean;
  recurrence_rule?: string;
}

export interface QuoteFormData {
  customer_id: string;
  date: string;
  expiry_date: string;
  items: LineItem[];
  tax_rate: number;
  notes?: string;
  message?: string;
}

export interface InvoiceFormData {
  customer_id: string;
  quote_id?: string;
  date: string;
  due_date: string;
  items: LineItem[];
  tax_rate: number;
  notes?: string;
}

export interface TaskFormData {
  title: string;
  description?: string;
  user_id: string;
  customer_id?: string;
  calendar_event_id?: string;
  due_date?: string;
  priority?: TaskPriority;
}

export interface Lead {
  id: string;
  organization_id: string;
  name: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  title: string | null;
  source: string | null;
  status: 'new' | 'contacted' | 'nurturing' | 'qualified' | 'dead';
  lead_score: number;
  potential_value: number;
  probability: number;
  assigned_to: string | null;
  last_contact_date: string | null;
  next_follow_up: string | null;
  notes: string | null;
  converted_to_opportunity_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface Opportunity {
  id: string;
  organization_id: string;
  lead_id: string | null;
  customer_id: string | null;
  name: string;
  description: string | null;
  stage: 'discovery' | 'demo_scheduled' | 'proposal' | 'negotiation' | 'won' | 'lost';
  value: number;
  probability: number;
  weighted_value: number;
  expected_close_date: string | null;
  actual_close_date: string | null;
  appointment_date: string | null;
  assigned_to: string | null;
  quote_id: string | null;
  invoice_id: string | null;
  lost_reason: string | null;
  created_at: string;
  updated_at: string;
  // Joins
  leads?: Lead | null;
  customers?: Customer | null;
}

