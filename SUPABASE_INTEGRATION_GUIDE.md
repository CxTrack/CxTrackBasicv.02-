# Supabase Integration Guide

## Overview

This guide documents all localStorage calls in the codebase and provides exact Supabase query replacements for seamless migration.

---

## Storage Keys & Migration Map

| LocalStorage Key | Supabase Table | Query |
|------------------|----------------|-------|
| `cxtrack_demo_invoices` | `invoices` | `supabase.from('invoices').select('*')` |
| `cxtrack_demo_quotes` | `quotes` | `supabase.from('quotes').select('*')` |
| `cxtrack_demo_customers` | `customers` | `supabase.from('customers').select('*')` |
| `cxtrack_demo_products` | `products` | `supabase.from('products').select('*')` |
| `cxtrack_organization` | `organizations` | `supabase.from('organizations').select('*').eq('id', orgId)` |
| `cxtrack_chat_settings` | `chat_settings` | `supabase.from('chat_settings').select('*').eq('user_id', userId)` |
| `cxtrack_demo_tasks` | `tasks` | `supabase.from('tasks').select('*')` |
| `cxtrack_calendar_events` | `calendar_events` | `supabase.from('calendar_events').select('*')` |

---

## File-by-File Migration

### 1. invoiceStore.ts

**Current:**
```typescript
const invoices = JSON.parse(localStorage.getItem('cxtrack_demo_invoices') || '[]');
```

**Replace with:**
```typescript
const { data: invoices, error } = await supabase
  .from('invoices')
  .select(`
    *,
    customer:customers(id, name, email),
    invoice_items(*)
  `)
  .eq('organization_id', organizationId)
  .order('created_at', { ascending: false });
```

---

### 2. quoteStore.ts

**Current:**
```typescript
const quotes = JSON.parse(localStorage.getItem('cxtrack_demo_quotes') || '[]');
```

**Replace with:**
```typescript
const { data: quotes, error } = await supabase
  .from('quotes')
  .select(`
    *,
    customer:customers(id, name, email),
    quote_items(*)
  `)
  .eq('organization_id', organizationId)
  .order('created_at', { ascending: false });
```

---

### 3. customerStore.ts

**Current:**
```typescript
// Demo mode check
if (DEMO_MODE) {
  // Use localStorage
}
```

**Replace with:**
```typescript
const { data: customers, error } = await supabase
  .from('customers')
  .select('*')
  .eq('organization_id', organizationId)
  .order('name');
```

---

### 4. ChatPage.tsx

**Current:**
```typescript
const saved = localStorage.getItem('cxtrack_chat_settings');
```

**Replace with:**
```typescript
const { data: settings } = await supabase
  .from('chat_settings')
  .select('*')
  .eq('user_id', user.id)
  .single();
```

---

### 5. calendarStore.ts

**Current:**
```typescript
const events = JSON.parse(localStorage.getItem('cxtrack_calendar_events') || '[]');
```

**Replace with:**
```typescript
const { data: events } = await supabase
  .from('calendar_events')
  .select(`
    *,
    customer:customers(id, name)
  `)
  .eq('organization_id', organizationId)
  .gte('start_time', startOfMonth)
  .lte('end_time', endOfMonth);
```

---

## Real-time Subscriptions

### Chat Messages
```typescript
const subscription = supabase
  .channel('chat-messages')
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'messages',
    filter: `conversation_id=eq.${conversationId}`
  }, (payload) => {
    setMessages(prev => [...prev, payload.new]);
  })
  .subscribe();
```

### Task Updates
```typescript
const subscription = supabase
  .channel('tasks')
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'tasks',
    filter: `organization_id=eq.${organizationId}`
  }, () => {
    refetchTasks();
  })
  .subscribe();
```

---

## Migration Checklist

- [ ] Set up Supabase project
- [ ] Run all migrations in `supabase/migrations/`
- [ ] Configure environment variables:
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_ANON_KEY`
- [ ] Set `DEMO_MODE = false` in `src/config/demo.config.ts`
- [ ] Test authentication flow
- [ ] Verify RLS policies work correctly
- [ ] Test real-time subscriptions
- [ ] Remove localStorage fallbacks (optional)

---

## Environment Variables

```env
# .env.local
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# Optional for Stripe integration
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_xxx
```

---

## RLS Policy Verification

After migration, verify these policies work:

```sql
-- Test as authenticated user
SELECT * FROM customers; -- Should only return org's customers
SELECT * FROM invoices; -- Should only return org's invoices
INSERT INTO customers (name, organization_id) VALUES ('Test', 'wrong-org-id'); -- Should FAIL
```
