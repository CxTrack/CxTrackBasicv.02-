import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Download, AlertCircle, Loader2, CheckCircle, XCircle, Lock } from 'lucide-react';
import { shareLinkService } from '@/services/shareLink.service';
import { quoteService, Quote } from '@/services/quote.service';
import { pdfService } from '@/services/pdf.service';
import toast from 'react-hot-toast';

export default function PublicQuoteView() {
  const { token } = useParams<{ token: string }>();
  const [loading, setLoading] = useState(true);
  const [quote, setQuote] = useState<Quote | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [passwordRequired, setPasswordRequired] = useState(false);
  const [password, setPassword] = useState('');
  const [validating, setValidating] = useState(false);

  useEffect(() => {
    if (token) {
      loadQuote();
    }
  }, [token]);

  const loadQuote = async (enteredPassword?: string) => {
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

      const quoteData = await quoteService.getQuote(validation.link.document_id);
      if (!quoteData) {
        setError('Quote not found');
        setLoading(false);
        return;
      }

      setQuote(quoteData);
      setPasswordRequired(false);

      await shareLinkService.trackLinkView(validation.link.id, {
        user_agent: navigator.userAgent,
        referrer: document.referrer || undefined,
      });
    } catch (err: any) {
      setError(err.message || 'Failed to load quote');
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
    await loadQuote(password);
  };

  const handleDownloadPDF = () => {
    if (!quote) return;
    try {
      pdfService.generateQuotePDF(quote, {
        name: quote.customer_name,
      });
      toast.success('PDF downloaded successfully');
    } catch (error) {
      toast.error('Failed to generate PDF');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Loading quote...</p>
        </div>
      </div>
    );
  }

  if (passwordRequired && !quote) {
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
            This quote is password protected. Please enter the password to view it.
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
              {validating ? 'Validating...' : 'View Quote'}
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

  if (error || !quote) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 w-full max-w-md text-center border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-center w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full mx-auto mb-6">
            <AlertCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Unable to Load Quote
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            {error || 'This quote link may have expired or been revoked.'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-8 py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-white mb-1">Quote</h1>
                <p className="text-blue-100">#{quote.quote_number}</p>
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
                  Quote Details
                </h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Date:</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {new Date(quote.quote_date).toLocaleDateString()}
                    </span>
                  </div>
                  {quote.expiry_date && (
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Valid Until:</span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {new Date(quote.expiry_date).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Status:</span>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400">
                      {quote.status}
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
                  Customer
                </h3>
                <div className="space-y-1">
                  <p className="font-medium text-gray-900 dark:text-white">{quote.customer_name}</p>
                  {quote.customer_email && (
                    <p className="text-sm text-gray-600 dark:text-gray-400">{quote.customer_email}</p>
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
                    {quote.items.map((item, index) => (
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
                    ${quote.subtotal.toFixed(2)}
                  </span>
                </div>
                {quote.discount_amount && quote.discount_amount > 0 && (
                  <div className="flex justify-between text-gray-600 dark:text-gray-400">
                    <span>Discount:</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      -${quote.discount_amount.toFixed(2)}
                    </span>
                  </div>
                )}
                <div className="flex justify-between text-gray-600 dark:text-gray-400">
                  <span>Tax:</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    ${quote.tax_amount.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between pt-2 border-t border-gray-200 dark:border-gray-700">
                  <span className="text-lg font-bold text-gray-900 dark:text-white">Total:</span>
                  <span className="text-lg font-bold text-blue-600">
                    ${quote.total_amount.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            {(quote.notes || quote.terms || quote.payment_terms) && (
              <div className="space-y-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                {quote.payment_terms && (
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
                      Payment Terms
                    </h4>
                    <p className="text-gray-600 dark:text-gray-400">{quote.payment_terms}</p>
                  </div>
                )}
                {quote.notes && (
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
                      Notes
                    </h4>
                    <p className="text-gray-600 dark:text-gray-400">{quote.notes}</p>
                  </div>
                )}
                {quote.terms && (
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
                      Terms & Conditions
                    </h4>
                    <p className="text-gray-600 dark:text-gray-400 text-sm">{quote.terms}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="text-center mt-6">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            This is a shared quote. For questions, please contact the sender.
          </p>
        </div>
      </div>
    </div>
  );
}
