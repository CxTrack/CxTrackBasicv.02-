import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useOrganizationStore } from '@/stores/organizationStore';
import { invoiceService, Invoice } from '@/services/invoice.service';
import { stripeService } from '@/services/stripe.service';
import { settingsService } from '@/services/settings.service';
import { pdfService } from '@/services/pdf.service';
import { ArrowLeft, Edit, Send, Trash2, Loader2, CreditCard, DollarSign, Link as LinkIcon, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import ShareDropdown, { ShareOption } from '@/components/share/ShareDropdown';
import ShareModal from '@/components/share/ShareModal';
import toast from 'react-hot-toast';

export default function InvoiceDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentOrganization } = useOrganizationStore();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [showPaymentLinkDialog, setShowPaymentLinkDialog] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('0');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [paymentLink, setPaymentLink] = useState('');
  const [generatingLink, setGeneratingLink] = useState(false);
  const [recordingPayment, setRecordingPayment] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareModalTab, setShareModalTab] = useState<'email' | 'link' | 'pdf' | 'sms'>('link');

  useEffect(() => {
    if (id) {
      loadInvoice();
    }
  }, [id]);

  const loadInvoice = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const data = await invoiceService.getInvoice(id);
      setInvoice(data);
      if (data) {
        setPaymentAmount(data.amount_due.toString());
      }
    } catch (error) {
      console.error('Failed to load invoice:', error);
      toast.error('Failed to load invoice');
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async () => {
    if (!id) return;
    try {
      await invoiceService.sendInvoice(id);
      toast.success('Invoice sent successfully');
      loadInvoice();
    } catch (error) {
      console.error('Failed to send invoice:', error);
      toast.error('Failed to send invoice');
    }
  };

  const handleDelete = async () => {
    if (!id) return;
    if (!confirm('Are you sure you want to delete this invoice?')) return;

    try {
      await invoiceService.deleteInvoice(id);
      toast.success('Invoice deleted successfully');
      navigate('/invoices');
    } catch (error) {
      console.error('Failed to delete invoice:', error);
      toast.error('Failed to delete invoice');
    }
  };

  const handleGeneratePaymentLink = async () => {
    if (!invoice) return;

    try {
      setGeneratingLink(true);
      const link = await stripeService.createPaymentLink(
        invoice.id,
        invoice.amount_due,
        'USD'
      );
      setPaymentLink(link);
      setShowPaymentLinkDialog(true);
    } catch (error) {
      console.error('Failed to generate payment link:', error);
      toast.error('Failed to generate payment link. Please ensure Stripe is configured in settings.');
    } finally {
      setGeneratingLink(false);
    }
  };

  const handleRecordPayment = async () => {
    if (!invoice) return;
    const amount = parseFloat(paymentAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }
    if (!paymentMethod) {
      toast.error('Please select a payment method');
      return;
    }

    try {
      setRecordingPayment(true);
      await stripeService.recordPayment(invoice.id, amount, paymentMethod);
      toast.success('Payment recorded successfully');
      setShowPaymentDialog(false);
      loadInvoice();
    } catch (error) {
      console.error('Failed to record payment:', error);
      toast.error('Failed to record payment');
    } finally {
      setRecordingPayment(false);
    }
  };

  const copyPaymentLink = () => {
    navigator.clipboard.writeText(paymentLink);
    toast.success('Payment link copied to clipboard');
  };

  const handleShareOption = async (option: ShareOption) => {
    if (!invoice || !currentOrganization) return;

    if (option === 'pdf') {
      try {
        console.log('🔄 Generating PDF for invoice:', invoice.invoice_number);
        console.log('Using organization ID:', currentOrganization.id);

        const organizationInfo = await settingsService.getOrganizationForPDF(currentOrganization.id);

        console.log('📄 Generating PDF with organization info:', organizationInfo);
        pdfService.generateInvoicePDF(invoice, organizationInfo);
        toast.success('Invoice PDF downloaded');
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
      case 'paid':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'partial':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'overdue':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      case 'cancelled':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
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

  if (!invoice) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="text-center py-12">
          <p className="text-gray-600 dark:text-gray-400">Invoice not found</p>
          <Button onClick={() => navigate('/invoices')} className="mt-4">
            Back to Invoices
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
            onClick={() => navigate('/invoices')}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              {invoice.invoice_number}
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <span className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${getStatusColor(invoice.status)}`}>
                {invoice.status}
              </span>
              {invoice.quote_id && (
                <button
                  onClick={() => navigate(`/quotes/${invoice.quote_id}`)}
                  className="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400"
                >
                  From Quote
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          {invoice.status === 'draft' && (
            <Button variant="outline" onClick={handleSend}>
              <Send className="w-4 h-4 mr-2" />
              Send Invoice
            </Button>
          )}
          {invoice.status !== 'paid' && invoice.status !== 'cancelled' && (
            <>
              <Button variant="outline" onClick={handleGeneratePaymentLink} disabled={generatingLink}>
                <LinkIcon className="w-4 h-4 mr-2" />
                {generatingLink ? 'Generating...' : 'Payment Link'}
              </Button>
              <Button onClick={() => setShowPaymentDialog(true)}>
                <DollarSign className="w-4 h-4 mr-2" />
                Record Payment
              </Button>
            </>
          )}
          <ShareDropdown onSelect={handleShareOption} buttonText="Share" variant="primary" />
          {invoice.status !== 'paid' && (
            <Button variant="outline" onClick={() => navigate(`/invoices/builder/${id}`)}>
              <Edit className="w-4 h-4 mr-2" />
              Edit
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
              <p className="text-lg font-semibold text-gray-900 dark:text-white">{invoice.customer_name}</p>
              {invoice.customer_email && (
                <p className="text-sm text-gray-600 dark:text-gray-400">{invoice.customer_email}</p>
              )}
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Invoice Date</h3>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">
                {new Date(invoice.invoice_date).toLocaleDateString()}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Due: {new Date(invoice.due_date).toLocaleDateString()}
              </p>
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
                {invoice.items.map((item, index) => (
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
                  ${(invoice.subtotal ?? 0).toFixed(2)}
                </span>
              </div>
              {(invoice.discount_amount ?? 0) > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Discount</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    -${(invoice.discount_amount ?? 0).toFixed(2)}
                  </span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Tax</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  ${(invoice.tax_amount ?? 0).toFixed(2)}
                </span>
              </div>
              <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                <div className="flex justify-between">
                  <span className="text-lg font-semibold text-gray-900 dark:text-white">Total</span>
                  <span className="text-lg font-bold text-blue-600">
                    ${(invoice.total_amount ?? 0).toFixed(2)}
                  </span>
                </div>
              </div>
              {(invoice.amount_paid ?? 0) > 0 && (
                <>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Amount Paid</span>
                    <span className="font-medium text-green-600">
                      ${(invoice.amount_paid ?? 0).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-gray-200 dark:border-gray-700">
                    <span className="font-semibold text-gray-900 dark:text-white">Amount Due</span>
                    <span className="font-bold text-orange-600">
                      ${(invoice.amount_due ?? 0).toFixed(2)}
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {(invoice.notes || invoice.terms || invoice.payment_terms) && (
          <div className="p-8 border-t border-gray-200 dark:border-gray-700">
            {invoice.payment_terms && (
              <div className="mb-4">
                <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Payment Terms</h3>
                <p className="text-gray-900 dark:text-white">{invoice.payment_terms}</p>
              </div>
            )}
            {invoice.notes && (
              <div className="mb-4">
                <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Notes</h3>
                <p className="text-gray-900 dark:text-white">{invoice.notes}</p>
              </div>
            )}
            {invoice.terms && (
              <div>
                <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Terms & Conditions</h3>
                <p className="text-gray-900 dark:text-white whitespace-pre-wrap">{invoice.terms}</p>
              </div>
            )}
          </div>
        )}
      </div>

      {showPaymentDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md w-full mx-4">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              Record Payment
            </h2>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Payment Amount
                </label>
                <Input
                  type="number"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  placeholder="0.00"
                  step="0.01"
                  min="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Payment Method
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full px-4 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white"
                >
                  <option value="">Select method...</option>
                  <option value="credit_card">Credit Card</option>
                  <option value="debit_card">Debit Card</option>
                  <option value="bank_transfer">Bank Transfer</option>
                  <option value="check">Check</option>
                  <option value="cash">Cash</option>
                  <option value="paypal">PayPal</option>
                  <option value="stripe">Stripe</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setShowPaymentDialog(false)}
                className="flex-1"
                disabled={recordingPayment}
              >
                Cancel
              </Button>
              <Button
                onClick={handleRecordPayment}
                className="flex-1"
                disabled={recordingPayment}
              >
                {recordingPayment ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Recording...
                  </>
                ) : (
                  'Record Payment'
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {showPaymentLinkDialog && paymentLink && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md w-full mx-4">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              Payment Link Generated
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Share this link with your customer to accept online payments:
            </p>

            <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg mb-4">
              <p className="text-sm text-gray-900 dark:text-white break-all">{paymentLink}</p>
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setShowPaymentLinkDialog(false)}
                className="flex-1"
              >
                Close
              </Button>
              <Button onClick={copyPaymentLink} className="flex-1">
                <LinkIcon className="w-4 h-4 mr-2" />
                Copy Link
              </Button>
            </div>
          </div>
        </div>
      )}

      {showShareModal && invoice && currentOrganization && (
        <ShareModal
          documentType="invoice"
          document={invoice}
          organizationId={currentOrganization.id}
          initialTab={shareModalTab}
          onClose={() => setShowShareModal(false)}
        />
      )}
    </div>
  );
}
