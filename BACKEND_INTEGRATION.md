# CXTrack - Backend Integration Guide

## Overview

CXTrack is a modern CRM application built with React, TypeScript, and Supabase. The data layer has been designed to support both **Demo Mode** (localStorage) and **Production Mode** (Supabase) seamlessly.

### Current Status

✅ **Supabase Connected**: Database is configured and ready
✅ **All Stores Implemented**: Tasks, Customers, Calendar, Products, Quotes, Invoices
✅ **Dual-Mode Support**: Works offline (demo) and online (production)
✅ **Database Schema**: Complete migrations available in `supabase/migrations/`
✅ **Type Safety**: Full TypeScript types for all database entities

## Architecture

### Data Flow

```
User Interface (React Components)
         ↓
   Zustand Stores (State Management)
         ↓
   Supabase Client (API Layer)
         ↓
   PostgreSQL Database (Supabase)
```

### Mode Selection

The application mode is controlled by the `DEMO_MODE` constant in `src/config/demo.config.ts`:

- **Demo Mode** (`DEMO_MODE = true`): Uses localStorage for all data operations
- **Production Mode** (`DEMO_MODE = false`): Uses Supabase for all data operations

## Store Architecture

All stores follow the same pattern:

```typescript
export const useStore = create<StoreInterface>((set, get) => ({
  items: [],
  loading: false,
  error: null,

  fetchItems: async () => {
    // Check mode
    if (DEMO_MODE) {
      // Load from localStorage
      const items = loadDemoData(STORAGE_KEY);
      set({ items, loading: false });
      return;
    }

    // Load from Supabase
    const { data, error } = await supabase
      .from('table_name')
      .select('*')
      .eq('organization_id', organizationId);

    if (error) throw error;
    set({ items: data, loading: false });
  },

  // Similar pattern for create, update, delete
}));
```

## Available Stores

### 1. Task Store (`src/stores/taskStore.ts`)

**Database Table**: `tasks`

**Features**:
- Full CRUD operations
- Filter by customer, date, status
- Pending and overdue task queries
- Calendar integration support

**Usage**:
```typescript
import { useTaskStore } from '@/stores/taskStore';

const { tasks, fetchTasks, createTask, updateTask, deleteTask } = useTaskStore();

// Fetch all tasks
await fetchTasks();

// Create new task
await createTask({
  title: 'Call customer',
  type: 'call',
  priority: 'high',
  due_date: '2025-12-30',
  customer_id: 'customer-id',
});

// Update task
await updateTask('task-id', { status: 'completed' });

// Delete task
await deleteTask('task-id');
```

### 2. Customer Store (`src/stores/customerStore.ts`)

**Database Table**: `customers`

**Features**:
- Customer CRUD operations
- Customer notes, contacts, and files
- Duplicate email detection
- Structured name fields (first, middle, last)

**Usage**:
```typescript
import { useCustomerStore } from '@/stores/customerStore';

const {
  customers,
  fetchCustomers,
  createCustomer,
  updateCustomer,
  deleteCustomer
} = useCustomerStore();

// Fetch all customers
await fetchCustomers();

// Create customer
await createCustomer({
  first_name: 'John',
  last_name: 'Doe',
  email: 'john@example.com',
  phone: '555-0100',
  customer_type: 'personal',
});
```

### 3. Calendar Store (`src/stores/calendarStore.ts`)

**Database Table**: `calendar_events`

**Features**:
- Event CRUD operations
- Date range filtering
- Customer association
- Calendar preferences management

**Usage**:
```typescript
import { useCalendarStore } from '@/stores/calendarStore';

const { events, fetchEvents, createEvent, updateEvent, deleteEvent } = useCalendarStore();

// Fetch events for date range
await fetchEvents(organizationId, startDate, endDate);

// Create event
await createEvent({
  title: 'Client meeting',
  event_type: 'meeting',
  start_time: '2025-12-30T14:00:00',
  end_time: '2025-12-30T15:00:00',
  customer_id: 'customer-id',
});
```

### 4. Other Stores

- **Product Store** (`src/stores/productStore.ts`): Product inventory management
- **Quote Store** (`src/stores/quoteStore.ts`): Quote creation and tracking
- **Invoice Store** (`src/stores/invoiceStore.ts`): Invoice management
- **Organization Store** (`src/stores/organizationStore.ts`): Multi-tenant support

## Database Schema

The complete database schema is available in `supabase/migrations/`. Key tables:

### Core Tables

1. **organizations**: Multi-tenant organizations
2. **user_profiles**: User account data
3. **organization_members**: User-organization relationships

### Business Tables

4. **customers**: Customer records
5. **tasks**: Task management
6. **calendar_events**: Calendar and appointments
7. **products**: Product inventory
8. **quotes**: Quote generation
9. **invoices**: Invoice tracking
10. **calls**: Call logging (Retell integration)

### Supporting Tables

11. **customer_notes**: Customer notes
12. **customer_contacts**: Multiple contacts per customer
13. **customer_files**: File attachments
14. **document_templates**: PDF templates for quotes/invoices
15. **organization_settings**: Per-org configuration

## Environment Variables

Required environment variables (see `.env.example`):

```env
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here

# Demo Mode (true/false)
VITE_DEMO_MODE=false
```

## Row Level Security (RLS)

All tables have RLS policies that enforce:

1. **Organization Isolation**: Users can only access data from their organization
2. **Authenticated Access**: Most operations require authentication
3. **Role-Based Permissions**: Some operations restricted by user role

### Testing RLS

To verify RLS is working:

1. Create two test users in different organizations
2. Log in as User A and create some data
3. Log in as User B - should NOT see User A's data
4. Verify no cross-organization data leakage

## Integration Checklist

### For Backend Developers

- [ ] Review database schema in `supabase/migrations/`
- [ ] Verify all migrations applied successfully
- [ ] Test RLS policies with multiple users
- [ ] Verify indexes are created (check schema files)
- [ ] Test all CRUD operations via Supabase dashboard
- [ ] Check foreign key constraints working correctly
- [ ] Verify cascade delete behavior

### For Frontend Developers

- [ ] Set up `.env` with correct Supabase credentials
- [ ] Set `DEMO_MODE = false` in `src/config/demo.config.ts`
- [ ] Test all stores (create, read, update, delete)
- [ ] Verify loading states display correctly
- [ ] Test error handling (network errors, validation errors)
- [ ] Check real-time updates (if using Supabase subscriptions)
- [ ] Verify multi-organization support working

## Testing Stores

### Manual Testing

```typescript
// In browser console or React component:

// 1. Fetch data
const { fetchCustomers } = useCustomerStore.getState();
await fetchCustomers();

// 2. Check data loaded
const { customers } = useCustomerStore.getState();
console.log('Customers:', customers);

// 3. Create new record
const { createCustomer } = useCustomerStore.getState();
const newCustomer = await createCustomer({
  first_name: 'Test',
  last_name: 'User',
  email: 'test@example.com',
});
console.log('Created:', newCustomer);

// 4. Update record
const { updateCustomer } = useCustomerStore.getState();
await updateCustomer(newCustomer.id, { phone: '555-1234' });

// 5. Delete record
const { deleteCustomer } = useCustomerStore.getState();
await deleteCustomer(newCustomer.id);
```

### Automated Testing

Tests can be added using Vitest or Jest:

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { useCustomerStore } from '@/stores/customerStore';

describe('Customer Store', () => {
  beforeEach(() => {
    // Reset store state
    useCustomerStore.setState({ customers: [], loading: false, error: null });
  });

  it('should fetch customers', async () => {
    const { fetchCustomers, customers } = useCustomerStore.getState();
    await fetchCustomers();
    expect(customers.length).toBeGreaterThan(0);
  });

  it('should create customer', async () => {
    const { createCustomer } = useCustomerStore.getState();
    const customer = await createCustomer({
      first_name: 'John',
      last_name: 'Doe',
      email: 'john@example.com',
    });
    expect(customer).toBeDefined();
    expect(customer?.first_name).toBe('John');
  });
});
```

## Common Issues & Solutions

### Issue: "No organization ID found"

**Cause**: User not associated with an organization
**Solution**:
1. Check `organization_members` table
2. Ensure user has a valid `organization_id`
3. Verify `useOrganizationStore.currentOrganization` is set

### Issue: RLS blocking queries

**Cause**: RLS policies not matching expected auth state
**Solution**:
1. Check user is authenticated (`supabase.auth.getUser()`)
2. Verify organization membership exists
3. Review RLS policies in Supabase dashboard
4. Test with RLS temporarily disabled for debugging

### Issue: Demo mode not working

**Cause**: `DEMO_MODE` constant not set correctly
**Solution**:
1. Check `src/config/demo.config.ts`
2. Verify `DEMO_MODE = true` or `false`
3. Clear localStorage if switching modes

### Issue: Slow queries

**Cause**: Missing indexes or inefficient queries
**Solution**:
1. Check indexes exist on `organization_id` columns
2. Review query `EXPLAIN ANALYZE` in Supabase SQL editor
3. Add indexes for frequently filtered columns

## API Reference

### Supabase Client

Location: `src/lib/supabase.ts`

```typescript
import { supabase } from '@/lib/supabase';

// Get current user
const { data: { user } } = await supabase.auth.getUser();

// Get user profile
const { data } = await supabase
  .from('user_profiles')
  .select('*')
  .eq('id', userId)
  .maybeSingle();

// Get organization memberships
const { data } = await supabase
  .from('organization_members')
  .select('*, organization:organizations(*)')
  .eq('user_id', userId);
```

### Helper Functions

```typescript
// Get current user
import { getCurrentUser } from '@/lib/supabase';
const user = await getCurrentUser();

// Get user profile
import { getUserProfile } from '@/lib/supabase';
const profile = await getUserProfile(userId);

// Get user organizations
import { getUserOrganizations } from '@/lib/supabase';
const orgs = await getUserOrganizations(userId);
```

## Database Migrations

All migrations are in `supabase/migrations/` directory:

1. `20251217152022_create_cxtrack_schema.sql` - Initial schema
2. `20251217152120_configure_rls_policies.sql` - RLS setup
3. `20251217203248_enhance_customer_management.sql` - Customer enhancements
4. Additional migrations...

To apply migrations:

```bash
# Using Supabase CLI
supabase db push

# Or manually in Supabase SQL Editor
# Copy/paste migration SQL and execute
```

## Next Steps

### For Continued Development

1. **Add Real-time Subscriptions**: Use Supabase real-time for live updates
2. **Implement Caching**: Add React Query for query caching
3. **Add Optimistic Updates**: Update UI before server confirms
4. **Error Boundaries**: Add React error boundaries for better error handling
5. **Loading Skeletons**: Replace loading spinners with skeleton screens
6. **Offline Support**: Use service workers for offline functionality

### For Production Deployment

1. **Environment Variables**: Set production Supabase credentials
2. **RLS Review**: Audit all RLS policies for security
3. **Performance Testing**: Load test with realistic data volumes
4. **Monitoring**: Set up error tracking (Sentry, etc.)
5. **Backup Strategy**: Configure automated database backups
6. **CI/CD Pipeline**: Automate testing and deployment

## Support

For questions or issues:

1. **Supabase Documentation**: https://supabase.com/docs
2. **Project Issues**: Check `supabase/migrations/` for schema details
3. **Store Code**: Review `src/stores/` for implementation details
4. **Type Definitions**: Check `src/types/database.types.ts` for data structures

## Appendix: Full Store List

| Store | File | Database Table | Purpose |
|-------|------|----------------|---------|
| Auth | `authStore.ts` | `auth.users` | Authentication state |
| Organization | `organizationStore.ts` | `organizations` | Multi-tenant management |
| Customer | `customerStore.ts` | `customers` | Customer management |
| Task | `taskStore.ts` | `tasks` | Task tracking |
| Calendar | `calendarStore.ts` | `calendar_events` | Calendar & appointments |
| Call | `callStore.ts` | `calls` | Call logging |
| Product | `productStore.ts` | `products` | Product inventory |
| Quote | `quoteStore.ts` | `quotes` | Quote generation |
| Invoice | `invoiceStore.ts` | `invoices` | Invoice management |
| Theme | `themeStore.ts` | N/A | UI theme settings |

---

**Last Updated**: December 2025
**Version**: 1.0
