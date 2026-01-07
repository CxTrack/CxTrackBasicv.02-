# Optimization Recommendations

## Priority 1: Type Safety (HIGH)

### Replace `any` with proper types

**Example 1: Error Handling**
```typescript
// ❌ BAD
} catch (error: any) {
  console.error(error.message);
}

// ✅ GOOD
} catch (error: unknown) {
  const message = error instanceof Error ? error.message : 'An error occurred';
  console.error(message);
}
```

**Example 2: Invoice Types**
```typescript
// ❌ BAD (revenue.service.ts)
data.forEach((invoice: any) => { ... });

// ✅ GOOD
interface Invoice {
  id: string;
  total_amount: number;
  status: 'paid' | 'pending' | 'overdue';
  created_at: string;
}
data.forEach((invoice: Invoice) => { ... });
```

---

## Priority 2: Production Logging (HIGH)

### Create Logger Utility

```typescript
// src/utils/logger.ts
const isDevelopment = import.meta.env.DEV;

export const logger = {
  log: (...args: unknown[]) => {
    if (isDevelopment) console.log(...args);
  },
  error: (...args: unknown[]) => {
    console.error(...args);
    // TODO: Send to error tracking service (Sentry, etc.)
  },
  warn: (...args: unknown[]) => {
    if (isDevelopment) console.warn(...args);
  },
  debug: (...args: unknown[]) => {
    if (isDevelopment) console.debug(...args);
  },
};
```

**Then replace:**
```typescript
// Before
console.log('📋 Creating task:', data);

// After
import { logger } from '@/utils/logger';
logger.log('📋 Creating task:', data);
```

---

## Priority 3: Performance (MEDIUM)

### React Query for Data Fetching

Consider migrating from Zustand stores to React Query for server state:

```typescript
// Current (Zustand)
const { customers, fetchCustomers, isLoading } = useCustomerStore();
useEffect(() => { fetchCustomers(); }, []);

// Recommended (React Query)
const { data: customers, isLoading } = useQuery({
  queryKey: ['customers'],
  queryFn: () => supabase.from('customers').select('*'),
});
```

**Benefits:**
- Automatic caching
- Background refetching
- Optimistic updates
- Deduplication

---

### Memoization in Lists

```typescript
// ❌ Before (re-renders on every parent render)
{customers.map(customer => <CustomerRow customer={customer} />)}

// ✅ After
const MemoizedCustomerRow = React.memo(CustomerRow);
{customers.map(customer => <MemoizedCustomerRow key={customer.id} customer={customer} />)}
```

---

## Priority 4: Code Splitting (MEDIUM)

### Lazy Load Routes

```typescript
// src/App.tsx
import { lazy, Suspense } from 'react';

// ❌ Before
import Dashboard from './pages/Dashboard';
import CRM from './pages/CRM';

// ✅ After
const Dashboard = lazy(() => import('./pages/Dashboard'));
const CRM = lazy(() => import('./pages/CRM'));

// Wrap routes
<Suspense fallback={<LoadingSpinner />}>
  <Route path="/" element={<Dashboard />} />
</Suspense>
```

---

## Priority 5: Accessibility (LOW)

### Add ARIA Labels

```typescript
// ❌ Before
<button onClick={onClose}>
  <X size={20} />
</button>

// ✅ After
<button onClick={onClose} aria-label="Close dialog">
  <X size={20} />
</button>
```

### Keyboard Navigation

```typescript
// Add to modals
useEffect(() => {
  const handleEscape = (e: KeyboardEvent) => {
    if (e.key === 'Escape') onClose();
  };
  document.addEventListener('keydown', handleEscape);
  return () => document.removeEventListener('keydown', handleEscape);
}, [onClose]);
```

---

## Bundle Size Optimization

### Current Dependencies to Audit

| Package | Size | Alternative |
|---------|------|-------------|
| `lucide-react` | Tree-shakeable ✅ | Keep |
| `date-fns` | Modular ✅ | Keep |
| `zustand` | 1.5kb ✅ | Keep |
| `react-hot-toast` | 5kb ✅ | Keep |

### Image Optimization

Consider using `next/image` patterns or `vite-imagetools` for automatic image optimization.

---

## Summary

| Optimization | Impact | Effort | Priority |
|--------------|--------|--------|----------|
| Type Safety | High | Medium | P1 |
| Logger Utility | Medium | Low | P1 |
| React Query | High | High | P2 |
| Code Splitting | Medium | Low | P2 |
| Accessibility | Low | Low | P3 |
