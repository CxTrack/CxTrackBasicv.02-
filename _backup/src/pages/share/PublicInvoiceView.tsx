import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Download, AlertCircle, Loader2, Lock } from 'lucide-react';
import { shareLinkService } from '@/services/shareLink.service';
import { invoiceService, Invoice } from '@/services/invoice.service';
import { pdfService } from '@/services/pdf.service';
import toast from 'react-hot-toast';

export default function PublicInvoiceView() {
  const { token } = useParams<{ token: string }>();
  const [loading, setLoading] = useState(true);
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [passwordRequired, setPasswordRequired] = useState(false);
  const [password, setPassword] = useState('');
  const [validating, setValidating] = useState(false);

  useEffect(() => {
    if (token) {
      loadInvoice();
    }
  }, [token]);

  const loadInvoice = async (enteredPassword?: string) => {
    if (!token) return;

    try {
      setLoading(true);
      setError(null);

      const validation = await shareLinkService.validateLinkAccess(token, enteredPassword);

      if (!validation.valid) {
        if (validation.error === 'Password required') {
          setPasswordRequired(true);
          setLoading(false);
          return;
        }
        setError(validation.error || 'Invalid or expired link');
        setLoading(false);
        return;
      }

      if (!validation.link) {
        setError('Link not found');
        setLoading(false);
        return;
      }

      const invoiceData = await invoiceService.getInvoice(validation.link.document_id);
      if (!invoiceData) {
        setError('Invoice not found');
        setLoading(false);
        return;
      }

      setInvoice(invoiceData);
      setPasswordRequired(false);

      await shareLinkService.trackLinkView(validation.link.id, {
        user_agent: navigator.userAgent,
        referrer: document.referrer || undefined,
      });
    } catch (err: any) {
      setError(err.message || 'Failed to load invoice');
    } finally {
      setLoading(false);
      setValidating(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) {
      toast.error('Please enter a password');
      return;
    }
    setValidating(true);
    await loadInvoice(password);
  };

  const handleDownloadPDF = () => {
    if (!invoice) return;
    try {
      pdfService.generateInvoicePDF(invoice, {
        name: invoice.customer_name,
      });
      toast.success('PDF downloaded successfully');
    } catch (error) {
      toast.error('Failed to generate PDF');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'overdue':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      case 'partial':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
      default:
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Loading invoice...</p>
        </div>
      </div>
    );
  }

  if (passwordRequired && !invoice) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 w-full max-w-md border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-center w-16 h-16 bg-blue-100 dark:bg-blue-900/20 rounded-full mx-auto mb-6">
            <Lock className="w-8 h-8 text-blue-600 dark:text-blue-400" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white text-center mb-2">
            Password Protected
          </h2>
          <p className="text-gray-600 dark:text-gray-400 text-center mb-6">
            This invoice is password protected. Please enter the password to view it.
          </p>
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              className="w-full px-4 py-3 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              autoFocus
            />
            <button
              type="submit"
              disabled={validating || !password}
              className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {validating ? 'Validating...' : 'View Invoice'}
            </button>
          </form>
          {error && (
            <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-sm text-red-800 dark:text-red-200 text-center">{error}</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 w-full max-w-md text-center border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-center w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full mx-auto mb-6">
            <AlertCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Unable to Load Invoice
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            {error || 'This invoice link may have expired or been revoked.'}
          </p>
        </div>
      </div>
    );
  }

  const isOverdue = invoice.status === 'overdue' ||
    (invoice.status !== 'paid' && new Date(invoice.due_date) < new Date());

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className={`px-8 py-6 ${isOverdue ? 'bg-gradient-to-r from-red-600 to-red-700' : 'bg-gradient-to-r from-blue-600 to-blue-700'}`}>
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-white mb-1">Invoice</h1>
                <p className="text-blue-100">#{invoice.invoice_number}</p>
              </div>
              <button
                onClick={handleDownloadPDF}
                className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg font-medium transition-colors flex items-center gap-2 backdrop-blur-sm"
              >
                <Download className="w-4 h-4" />
                Download PDF
              </button>
            </div>
          </div>

          <div className="p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
              <div>
                <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
                  Invoice Details
                </h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Invoice Date:</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {new Date(invoice.invoice_date).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Due Date:</span>
                    <span className={`font-medium ${isOverdue ? 'text-red-600 dark:text-red-400' : 'text-gray-900 dark:text-white'}`}>
                      {new Date(invoice.due_date).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Status:</span>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(invoice.status)}`}>
                      {invoice.status.toUpperCase()}
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
                  Bill To
                </h3>
                <div className="space-y-1">
                  <p className="font-medium text-gray-900 dark:text-white">{invoice.customer_name}</p>
                  {invoice.customer_email && (
                    <p className="text-sm text-gray-600 dark:text-gray-400">{invoice.customer_email}</p>
                  )}
                </div>
              </div>
            </div>

            <div className="mb-8">
              <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">
                Line Items
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900 dark:text-white">
                        Item
                      </th>
                      <th className="text-center py-3 px-4 text-sm font-semibold text-gray-900 dark:text-white">
                        Qty
                      </th>
                      <th className="text-right py-3 px-4 text-sm font-semibold text-gray-900 dark:text-white">
                        Price
                      </th>
                      <th className="text-right py-3 px-4 text-sm font-semibold text-gray-900 dark:text-white">
                        Amount
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoice.items.map((item, index) => (
                      <tr key={index} className="border-b border-gray-100 dark:border-gray-800">
                        <td className="py-3 px-4">
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">{item.product_name}</p>
                            {item.description && (
                              <p className="text-sm text-gray-600 dark:text-gray-400">{item.description}</p>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-center text-gray-900 dark:text-white">
                          {item.quantity}
                        </td>
                        <td className="py-3 px-4 text-right text-gray-900 dark:text-white">
                          ${item.unit_price.toFixed(2)}
                        </td>
                        <td className="py-3 px-4 text-right font-medium text-gray-900 dark:text-white">
                          ${item.line_total.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex justify-end mb-8">
              <div className="w-full max-w-xs space-y-2">
                <div className="flex justify-between text-gray-600 dark:text-gray-400">
                  <span>Subtotal:</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    ${invoice.subtotal.toFixed(2)}
                  </span>
                </div>
                {invoice.discount_amount && invoice.discount_amount > 0 && (
                  <div className="flex justify-between text-gray-600 dark:text-gray-400">
                    <span>Discount:</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      -${invoice.discount_amount.toFixed(2)}
                    </span>
                  </div>
                )}
                <div className="flex justify-between text-gray-600 dark:text-gray-400">
                  <span>Tax:</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    ${invoice.tax_amount.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between pt-2 border-t border-gray-200 dark:border-gray-700">
                  <span className="text-lg font-bold text-gray-900 dark:text-white">Total:</span>
                  <span className="text-lg font-bold text-blue-600">
                    ${invoice.total_amount.toFixed(2)}
                  </span>
                </div>
                {invoice.amount_paid && invoice.amount_paid > 0 && (
                  <>
                    <div className="flex justify-between text-gray-600 dark:text-gray-400">
                      <span>Amount Paid:</span>
                      <span className="font-medium text-green-600 dark:text-green-400">
                        -${invoice.amount_paid.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between pt-2 border-t border-gray-200 dark:border-gray-700">
                      <span className="text-lg font-bold text-gray-900 dark:text-white">Amount Due:</span>
                      <span className={`text-lg font-bold ${isOverdue ? 'text-red-600' : 'text-orange-600'}`}>
                        ${invoice.amount_due.toFixed(2)}
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>

            {(invoice.notes || invoice.terms || invoice.payment_terms) && (
              <div className="space-y-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                {invoice.payment_terms && (
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
                      Payment Terms
                    </h4>
                    <p className="text-gray-600 dark:text-gray-400">{invoice.payment_terms}</p>
                  </div>
                )}
                {invoice.notes && (
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
                      Notes
                    </h4>
                    <p className="text-gray-600 dark:text-gray-400">{invoice.notes}</p>
                  </div>
                )}
                {invoice.terms && (
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
                      Terms & Conditions
                    </h4>
                    <p className="text-gray-600 dark:text-gray-400 text-sm">{invoice.terms}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="text-center mt-6">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            This is a shared invoice. For questions, please contact the sender.
          </p>
        </div>
      </div>
    </div>
  );
}
