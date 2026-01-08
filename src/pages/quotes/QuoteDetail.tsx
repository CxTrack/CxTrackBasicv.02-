import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useOrganizationStore } from '@/stores/organizationStore';
import { quoteService, Quote } from '@/services/quote.service';
import { invoiceService } from '@/services/invoice.service';
import { settingsService } from '@/services/settings.service';
import { pdfService } from '@/services/pdf.service';
import { ArrowLeft, Edit, Send, FileText, Trash2, Loader2, Check, X as XIcon, DollarSign, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import ShareDropdown, { ShareOption } from '@/components/share/ShareDropdown';
import ShareModal from '@/components/share/ShareModal';
import toast from 'react-hot-toast';

export default function QuoteDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentOrganization } = useOrganizationStore();
  const [quote, setQuote] = useState<Quote | null>(null);
  const [loading, setLoading] = useState(true);
  const [converting, setConverting] = useState(false);
  const [showConvertDialog, setShowConvertDialog] = useState(false);
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState(
    new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareModalTab, setShareModalTab] = useState<'email' | 'link' | 'pdf' | 'sms'>('link');

  useEffect(() => {
    if (id) {
      loadQuote();
    }
  }, [id]);

  const loadQuote = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const data = await quoteService.getQuote(id);
      setQuote(data);
    } catch (error) {
      console.error('Failed to load quote:', error);
      toast.error('Failed to load quote');
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async () => {
    if (!id) return;
    try {
      await quoteService.sendQuote(id);
      toast.success('Quote sent successfully');
      loadQuote();
    } catch (error) {
      console.error('Failed to send quote:', error);
      toast.error('Failed to send quote');
    }
  };

  const handleDelete = async () => {
    if (!id) return;
    if (!confirm('Are you sure you want to delete this quote?')) return;

    try {
      await quoteService.deleteQuote(id);
      toast.success('Quote deleted successfully');
      navigate('/quotes');
    } catch (error) {
      console.error('Failed to delete quote:', error);
      toast.error('Failed to delete quote');
    }
  };

  const handleConvertToInvoice = async () => {
    if (!quote || !currentOrganization) return;

    try {
      setConverting(true);
      const invoice = await invoiceService.createInvoiceFromQuote(
        currentOrganization.id,
        currentOrganization.id,
        quote,
        invoiceDate,
        dueDate
      );
      toast.success('Quote converted to invoice successfully');
      navigate(`/invoices/${invoice.id}`);
    } catch (error) {
      console.error('Failed to convert quote:', error);
      toast.error('Failed to convert quote to invoice');
    } finally {
      setConverting(false);
      setShowConvertDialog(false);
    }
  };

  const handleShareOption = async (option: ShareOption) => {
    if (!quote || !currentOrganization) return;

    if (option === 'pdf') {
      try {
        console.log('🔄 Generating PDF for quote:', quote.quote_number);
        console.log('Using organization ID:', currentOrganization.id);

        const organizationInfo = await settingsService.getOrganizationForPDF(currentOrganization.id);

        console.log('📄 Generating PDF with organization info:', organizationInfo);
        pdfService.generateQuotePDF(quote, organizationInfo);
        toast.success('Quote PDF downloaded');
      } catch (error) {
        console.error('Failed to generate PDF:', error);
        toast.error('Failed to generate PDF');
      }
      return;
    }

    setShareModalTab(option);
    setShowShareModal(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
      case 'sent':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'viewed':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300';
      case 'accepted':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'declined':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      case 'expired':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300';
      case 'converted':
        return 'bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!quote) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="text-center py-12">
          <p className="text-gray-600 dark:text-gray-400">Quote not found</p>
          <Button onClick={() => navigate('/quotes')} className="mt-4">
            Back to Quotes
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/quotes')}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              {quote.quote_number}
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <span className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${getStatusColor(quote.status)}`}>
                {quote.status}
              </span>
              {quote.converted_to_invoice_id && (
                <button
                  onClick={() => navigate(`/invoices/${quote.converted_to_invoice_id}`)}
                  className="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 flex items-center gap-1"
                >
                  <DollarSign className="w-3 h-3" />
                  View Invoice
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          {quote.status === 'draft' && (
            <Button variant="outline" onClick={handleSend}>
              <Send className="w-4 h-4 mr-2" />
              Send Quote
            </Button>
          )}
          {quote.status !== 'converted' && (
            <Button variant="outline" onClick={() => navigate(`/quotes/builder/${id}`)}>
              <Edit className="w-4 h-4 mr-2" />
              Edit
            </Button>
          )}
          <ShareDropdown onSelect={handleShareOption} buttonText="Share" variant="primary" />
          {(quote.status === 'accepted' || quote.status === 'sent') && quote.status !== 'converted' && (
            <Button onClick={() => setShowConvertDialog(true)}>
              <FileText className="w-4 h-4 mr-2" />
              Convert to Invoice
            </Button>
          )}
          <Button variant="outline" onClick={handleDelete} className="text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20">
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm">
        <div className="p-8 border-b border-gray-200 dark:border-gray-700">
          <div className="grid grid-cols-2 gap-8">
            <div>
              <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Customer</h3>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">{quote.customer_name}</p>
              {quote.customer_email && (
                <p className="text-sm text-gray-600 dark:text-gray-400">{quote.customer_email}</p>
              )}
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Quote Date</h3>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">
                {new Date(quote.quote_date).toLocaleDateString()}
              </p>
              {quote.expiry_date && (
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Expires: {new Date(quote.expiry_date).toLocaleDateString()}
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="p-8">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Line Items</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left py-3 text-sm font-medium text-gray-600 dark:text-gray-400">Item</th>
                  <th className="text-right py-3 text-sm font-medium text-gray-600 dark:text-gray-400">Qty</th>
                  <th className="text-right py-3 text-sm font-medium text-gray-600 dark:text-gray-400">Price</th>
                  <th className="text-right py-3 text-sm font-medium text-gray-600 dark:text-gray-400">Total</th>
                </tr>
              </thead>
              <tbody>
                {quote.items.map((item, index) => (
                  <tr key={index} className="border-b border-gray-100 dark:border-gray-700">
                    <td className="py-4">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">{item.product_name}</p>
                        {item.description && (
                          <p className="text-sm text-gray-600 dark:text-gray-400">{item.description}</p>
                        )}
                      </div>
                    </td>
                    <td className="text-right py-4 text-gray-900 dark:text-white">{item.quantity}</td>
                    <td className="text-right py-4 text-gray-900 dark:text-white">
                      ${(item.unit_price ?? 0).toFixed(2)}
                    </td>
                    <td className="text-right py-4 font-medium text-gray-900 dark:text-white">
                      ${(item.line_total ?? 0).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-6 flex justify-end">
            <div className="w-64 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Subtotal</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  ${(quote.subtotal ?? 0).toFixed(2)}
                </span>
              </div>
              {(quote.discount_amount ?? 0) > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Discount</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    -${(quote.discount_amount ?? 0).toFixed(2)}
                  </span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Tax</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  ${(quote.tax_amount ?? 0).toFixed(2)}
                </span>
              </div>
              <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                <div className="flex justify-between">
                  <span className="text-lg font-semibold text-gray-900 dark:text-white">Total</span>
                  <span className="text-lg font-bold text-blue-600">
                    ${(quote.total_amount ?? 0).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {(quote.notes || quote.terms || quote.payment_terms) && (
          <div className="p-8 border-t border-gray-200 dark:border-gray-700">
            {quote.payment_terms && (
              <div className="mb-4">
                <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Payment Terms</h3>
                <p className="text-gray-900 dark:text-white">{quote.payment_terms}</p>
              </div>
            )}
            {quote.notes && (
              <div className="mb-4">
                <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Notes</h3>
                <p className="text-gray-900 dark:text-white">{quote.notes}</p>
              </div>
            )}
            {quote.terms && (
              <div>
                <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Terms & Conditions</h3>
                <p className="text-gray-900 dark:text-white whitespace-pre-wrap">{quote.terms}</p>
              </div>
            )}
          </div>
        )}
      </div>

      {showConvertDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md w-full mx-4">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              Convert to Invoice
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              This will create an invoice from this quote. You can edit the invoice after creation.
            </p>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Invoice Date
                </label>
                <input
                  type="date"
                  value={invoiceDate}
                  onChange={(e) => setInvoiceDate(e.target.value)}
                  className="w-full px-4 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Due Date
                </label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full px-4 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white"
                />
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setShowConvertDialog(false)}
                className="flex-1"
                disabled={converting}
              >
                <XIcon className="w-4 h-4 mr-2" />
                Cancel
              </Button>
              <Button
                onClick={handleConvertToInvoice}
                className="flex-1"
                disabled={converting}
              >
                {converting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Converting...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    Convert
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {showShareModal && quote && currentOrganization && (
        <ShareModal
          documentType="quote"
          document={quote}
          organizationId={currentOrganization.id}
          initialTab={shareModalTab}
          onClose={() => setShowShareModal(false)}
        />
      )}
    </div>
  );
}
