# Complete Demo Mode Implementation Guide

## Overview
Demo mode is now fully enabled across the CxTrack CRM application. All data is stored locally in the browser's localStorage, and no authentication or database connection is required.

## Single Source of Truth
All demo mode configuration is centralized in: `src/config/demo.config.ts`

### Configuration File
```typescript
export const DEMO_MODE = true; // ← Set to false to disable demo mode

export const DEMO_STORAGE_KEYS = {
  customers: 'cxtrack_demo_customers',
  products: 'cxtrack_demo_products',
  quotes: 'cxtrack_demo_quotes',
  invoices: 'cxtrack_demo_invoices',
  calendar: 'cxtrack_demo_calendar',
  tasks: 'cxtrack_demo_tasks',
  calls: 'cxtrack_demo_calls',
};
```

### Helper Functions
- `isDemoMode()` - Check if demo mode is enabled
- `getDemoOrganizationId()` - Get the demo organization ID
- `getDemoUserId()` - Get the demo user ID
- `loadDemoData<T>(key)` - Load data from localStorage
- `saveDemoData<T>(key, data)` - Save data to localStorage
- `generateDemoId(prefix)` - Generate a unique demo ID
- `clearAllDemoData()` - Clear all demo data from localStorage

## Updated Components

### Stores
All stores now import from the centralized demo config:

1. **Customer Store** (`src/stores/customerStore.ts`)
   - ✅ Uses shared DEMO_MODE constant
   - ✅ Uses shared demo helper functions
   - ✅ Stores data in localStorage

2. **Product Store** (`src/stores/productStore.ts`)
   - ✅ Uses shared DEMO_MODE constant
   - ✅ Uses shared demo helper functions
   - ✅ Stores data in localStorage

3. **Quote Service** (`src/services/quote.service.ts`)
   - ✅ Handles demo mode internally
   - ✅ No organization lookups in QuoteBuilder page
   - ✅ Service layer manages organization/user IDs

4. **Invoice Service** (`src/services/invoice.service.ts`)
   - ✅ Handles demo mode internally
   - ✅ Similar pattern to quote service

### Pages
1. **QuoteBuilder** (`src/pages/quotes/QuoteBuilder.tsx`)
   - ✅ Removed all organization lookups
   - ✅ No `getOrganizationId()` calls
   - ✅ Simply validates and passes data to service
   - ✅ Service layer handles all organization logic

### UI
1. **App.tsx**
   - ✅ Shows demo mode banner at the top
   - ✅ Yellow banner with clear messaging
   - ✅ Only visible when DEMO_MODE = true

## How It Works

### Demo Mode Flow
```
User Action
    ↓
Page Component (validates data)
    ↓
Store/Service (checks DEMO_MODE)
    ↓
If DEMO_MODE:
    → Uses localStorage
    → Generates demo IDs
    → No auth required
Else:
    → Uses Supabase
    → Requires auth
    → Uses real organization
```

### Example: Creating a Customer
```typescript
// In customerStore.ts
createCustomer: async (data) => {
  if (DEMO_MODE) {
    const newCustomer = {
      id: generateDemoId('customer'),
      ...data,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const customers = [newCustomer, ...get().customers];
    saveDemoData(DEMO_STORAGE_KEYS.customers, customers);
    set({ customers, loading: false });

    return newCustomer;
  }

  // Supabase code for production...
}
```

## Benefits

1. **No Authentication Errors** - Demo mode bypasses all auth checks
2. **No Organization Errors** - Uses demo organization ID automatically
3. **Persistent Demo Data** - Data survives page refreshes (localStorage)
4. **Easy Testing** - Test all features without database setup
5. **Single Toggle** - Enable/disable with one constant
6. **Clear Visual Indicator** - Banner shows when demo mode is active

## Clearing Demo Data

### From Browser Console
```javascript
// Clear all demo data
localStorage.clear();

// Or use the helper function
import { clearAllDemoData } from './src/config/demo.config';
clearAllDemoData();
```

### From Code
```typescript
import { clearAllDemoData } from '@/config/demo.config';

// Clear all demo data
clearAllDemoData();
```

## Switching to Production Mode

1. Open `src/config/demo.config.ts`
2. Change `export const DEMO_MODE = true;` to `export const DEMO_MODE = false;`
3. Rebuild the application: `npm run build`
4. All features will now use Supabase and require authentication

## Storage Keys Reference

| Feature | Storage Key | Store Location |
|---------|-------------|----------------|
| Customers | `cxtrack_demo_customers` | customerStore.ts |
| Products | `cxtrack_demo_products` | productStore.ts |
| Quotes | `cxtrack_demo_quotes` | quote.service.ts |
| Invoices | `cxtrack_demo_invoices` | invoice.service.ts |
| Calendar | `cxtrack_demo_calendar` | calendarStore.ts |
| Tasks | `cxtrack_demo_tasks` | taskStore.ts |
| Calls | `cxtrack_demo_calls` | callStore.ts |

## Key Architectural Decisions

1. **Service Layer Handles Organization** - Services determine organization/user IDs, not pages
2. **Page Layer Validates Only** - Pages validate input and pass to services
3. **Store Layer Executes** - Stores/services execute the actual operations
4. **Single Configuration File** - One place to control demo mode
5. **Consistent Helper Functions** - All stores use the same helper functions

## Troubleshooting

### Issue: "No organization available" error
**Solution:** Ensure DEMO_MODE is set to true in `src/config/demo.config.ts`

### Issue: Data not persisting
**Solution:** Check browser's localStorage isn't disabled or full

### Issue: Can't create quotes/invoices
**Solution:** Verify the service layer is using `isDemoMode()` check

### Issue: Demo banner not showing
**Solution:** Check that App.tsx imports and uses DEMO_MODE correctly

## Notes

- Demo data is stored per-browser (localStorage)
- Data is NOT shared between browsers or devices
- Clearing browser data will delete all demo data
- Demo mode is perfect for testing, demos, and development
- Production mode requires valid Supabase credentials and authentication
