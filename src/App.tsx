import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext';
import { CoPilotProvider } from './contexts/CoPilotContext';
import { DashboardLayout } from './layouts/DashboardLayout';
import { Dashboard } from './pages/Dashboard';
import { Customers } from './pages/Customers';
import { CustomerProfile } from './pages/CustomerProfile';
import CustomerForm from './pages/customers/CustomerForm';
import { CalendarPage } from './pages/CalendarPage';
import Calendar from './pages/calendar/Calendar';
import Tasks from './pages/Tasks';
import Products from './pages/Products';
import ProductForm from './pages/products/ProductForm';
import Quotes from './pages/Quotes';
import QuoteBuilder from './pages/quotes/QuoteBuilder';
import QuoteDetail from './pages/quotes/QuoteDetail';
import Invoices from './pages/Invoices';
import InvoiceBuilder from './pages/invoices/InvoiceBuilder';
import InvoiceDetail from './pages/invoices/InvoiceDetail';
import Settings from './pages/settings/Settings';
import Calls from './pages/calls/Calls';
import Pipeline from './pages/Pipeline';
import PublicQuoteView from './pages/share/PublicQuoteView';
import PublicInvoiceView from './pages/share/PublicInvoiceView';
import CoPilotButton from './components/copilot/CoPilotButton';
import CoPilotPanel from './components/copilot/CoPilotPanel';
import ErrorBoundary from './components/ui/ErrorBoundary';
import { DEMO_MODE } from './config/demo.config';

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <CoPilotProvider>
          <BrowserRouter>
            <Toaster
              position="top-right"
              toastOptions={{
                duration: 4000,
                className: 'dark:bg-gray-800 dark:text-white',
              }}
            />
            <Routes>
              <Route path="/share/quote/:token" element={<PublicQuoteView />} />
              <Route path="/share/invoice/:token" element={<PublicInvoiceView />} />

              <Route path="/" element={<DashboardLayout />}>
                <Route index element={<Navigate to="/dashboard" replace />} />
                <Route path="dashboard" element={<Dashboard />} />
                <Route path="customers" element={<Customers />} />
                <Route path="customers/new" element={<CustomerForm />} />
                <Route path="customers/:id" element={<CustomerProfile />} />
                <Route path="customers/:id/edit" element={<CustomerForm />} />
                <Route path="calendar-old" element={<CalendarPage />} />
                <Route path="calendar" element={<Calendar />} />
                <Route path="tasks" element={<Tasks />} />
                <Route path="calls" element={<Calls />} />
                <Route path="pipeline" element={<Pipeline />} />
                <Route path="products" element={<Products />} />
                <Route path="products/new" element={<ProductForm />} />
                <Route path="products/:id/edit" element={<ProductForm />} />
                <Route path="quotes" element={<Quotes />} />
                <Route path="quotes/builder" element={<QuoteBuilder />} />
                <Route path="quotes/builder/:id" element={<QuoteBuilder />} />
                <Route path="quotes/:id" element={<QuoteDetail />} />
                <Route path="invoices" element={<Invoices />} />
                <Route path="invoices/builder" element={<InvoiceBuilder />} />
                <Route path="invoices/builder/:id" element={<InvoiceBuilder />} />
                <Route path="invoices/:id" element={<InvoiceDetail />} />
                <Route path="settings" element={<Settings />} />
                <Route path="*" element={<Navigate to="/dashboard" replace />} />
              </Route>
            </Routes>

            <CoPilotButton />
            <CoPilotPanel />
          </BrowserRouter>
        </CoPilotProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
