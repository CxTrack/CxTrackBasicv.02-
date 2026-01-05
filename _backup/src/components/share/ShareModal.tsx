import React, { useState, useEffect } from 'react';
import { X, Mail, Link2, Download, MessageSquare, Copy, Check, AlertCircle, Eye, Calendar, Lock, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import QRCode from 'qrcode';
import { shareLinkService, ShareLink } from '@/services/shareLink.service';
import { emailService } from '@/services/email.service';
import { smsService } from '@/services/sms.service';
import { pdfService } from '@/services/pdf.service';
import { Quote } from '@/services/quote.service';
import { Invoice } from '@/services/invoice.service';
import { PhoneInput } from '../ui/PhoneInput';

type DocumentType = 'quote' | 'invoice';
type TabType = 'email' | 'link' | 'pdf' | 'sms';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  documentType: DocumentType;
  document: Quote | Invoice;
  organizationId: string;
  userId: string;
  organizationInfo: {
    name: string;
    address?: string;
    city?: string;
    state?: string;
    postal_code?: string;
    country?: string;
    phone?: string;
    email?: string;
    website?: string;
  };
  initialTab?: TabType;
}

export default function ShareModal({
  isOpen,
  onClose,
  documentType,
  document,
  organizationId,
  userId,
  organizationInfo,
  initialTab = 'link',
}: ShareModalProps) {
  const [activeTab, setActiveTab] = useState<TabType>(initialTab);
  const [shareLink, setShareLink] = useState<ShareLink | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [qrCode, setQrCode] = useState<string>('');

  const [emailData, setEmailData] = useState({
    to: document.customer_email || '',
    subject: '',
    body: '',
  });

  const [smsData, setSmsData] = useState({
    phone: (document as any).customer_phone || '',
    message: '',
  });

  const [linkSettings, setLinkSettings] = useState({
    expiresAt: null as string | null,
    hasPassword: false,
    password: '',
  });

  const documentNumber = documentType === 'quote'
    ? (document as Quote).quote_number
    : (document as Invoice).invoice_number;

  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
      loadExistingLink();
    }
  }, [isOpen, initialTab]);

  useEffect(() => {
    if (shareLink) {
      generateQRCode(shareLinkService.getShareUrl(shareLink.share_token, documentType));
    }
  }, [shareLink]);

  const loadExistingLink = async () => {
    try {
      const existing = await shareLinkService.getExistingLink(documentType, document.id);
      if (existing) {
        setShareLink(existing);
        setLinkSettings({
          expiresAt: existing.expires_at,
          hasPassword: existing.access_type === 'password-protected',
          password: '',
        });
      }
    } catch (error) {
      console.error('Error loading share link:', error);
    }
  };

  const generateQRCode = async (url: string) => {
    try {
      const qr = await QRCode.toDataURL(url, { width: 200, margin: 1 });
      setQrCode(qr);
    } catch (error) {
      console.error('Error generating QR code:', error);
    }
  };

  const handleGenerateLink = async () => {
    setLoading(true);
    try {
      const link = await shareLinkService.generateShareLink(
        organizationId,
        documentType,
        document.id,
        userId,
        {
          expiresAt: linkSettings.expiresAt,
          accessType: linkSettings.hasPassword ? 'password-protected' : 'public',
          password: linkSettings.hasPassword ? linkSettings.password : undefined,
        }
      );
      setShareLink(link);
      toast.success('Share link generated successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to generate share link');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyLink = () => {
    if (shareLink) {
      const url = shareLinkService.getShareUrl(shareLink.share_token, documentType);
      navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success('Link copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleSendEmail = async () => {
    if (!emailData.to) {
      toast.error('Please enter an email address');
      return;
    }

    setLoading(true);
    try {
      if (!shareLink) {
        await handleGenerateLink();
      }

      const result = await emailService.sendQuoteEmail(organizationId, {
        to: emailData.to,
        subject: emailData.subject,
        body: emailData.body,
        documentType,
        documentId: document.id,
        documentNumber,
        shareLink: shareLink ? shareLinkService.getShareUrl(shareLink.share_token, documentType) : '',
      });

      if (result.success) {
        toast.success('Email sent successfully');
        onClose();
      } else {
        toast.error(result.error || 'Failed to send email');
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to send email');
    } finally {
      setLoading(false);
    }
  };

  const handleSendSMS = async () => {
    if (!smsData.phone) {
      toast.error('Please enter a phone number');
      return;
    }

    setLoading(true);
    try {
      if (!shareLink) {
        await handleGenerateLink();
      }

      const url = shareLink ? shareLinkService.getShareUrl(shareLink.share_token, documentType) : '';

      const result = documentType === 'quote'
        ? await smsService.sendQuoteSMS(organizationId, document.id, documentNumber, smsData.phone, url, organizationInfo.name)
        : await smsService.sendInvoiceSMS(organizationId, document.id, documentNumber, smsData.phone, url, organizationInfo.name);

      if (result.success) {
        toast.success('SMS queued successfully');
        onClose();
      } else {
        toast.error(result.error || 'Failed to send SMS');
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to send SMS');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = () => {
    try {
      console.log('Download PDF clicked', { documentType, document, organizationInfo });
      if (documentType === 'quote') {
        pdfService.generateQuotePDF(document as Quote, organizationInfo);
      } else {
        pdfService.generateInvoicePDF(document as Invoice, organizationInfo);
      }
      toast.success('PDF downloaded successfully');
    } catch (error: any) {
      console.error('PDF generation error:', error);
      toast.error(error.message || 'Failed to generate PDF');
    }
  };

  useEffect(() => {
    if (shareLink) {
      const url = shareLinkService.getShareUrl(shareLink.share_token, documentType);
      setEmailData(prev => ({
        ...prev,
        subject: emailService.generateEmailSubject(documentType, documentNumber, organizationInfo.name),
        body: emailService.generateEmailBody(documentType, documentNumber, organizationInfo.name, url),
      }));

      const smsPreview = smsService.formatMessagePreview(documentType, documentNumber, url, organizationInfo.name);
      setSmsData(prev => ({
        ...prev,
        message: smsPreview.message,
      }));
    }
  }, [shareLink, documentType, documentNumber, organizationInfo.name]);

  if (!isOpen) return null;

  const tabs = [
    { id: 'link' as TabType, label: 'Share Link', icon: Link2 },
    { id: 'email' as TabType, label: 'Email', icon: Mail },
    { id: 'sms' as TabType, label: 'SMS', icon: MessageSquare },
    { id: 'pdf' as TabType, label: 'Download PDF', icon: Download },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            Share {documentType === 'quote' ? 'Quote' : 'Invoice'} {documentNumber}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>
        </div>

        <div className="border-b border-gray-200 dark:border-gray-700">
          <div className="flex">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'link' && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Link Settings
                </label>
                <div className="space-y-4">
                  <div>
                    <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 mb-2">
                      <Calendar className="w-4 h-4" />
                      Expiration Date (optional)
                    </label>
                    <input
                      type="datetime-local"
                      value={linkSettings.expiresAt || ''}
                      onChange={(e) => setLinkSettings({ ...linkSettings, expiresAt: e.target.value || null })}
                      className="w-full px-4 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 mb-2">
                      <input
                        type="checkbox"
                        checked={linkSettings.hasPassword}
                        onChange={(e) => setLinkSettings({ ...linkSettings, hasPassword: e.target.checked, password: '' })}
                        className="rounded"
                      />
                      <Lock className="w-4 h-4" />
                      Password Protection
                    </label>
                    {linkSettings.hasPassword && (
                      <input
                        type="password"
                        value={linkSettings.password}
                        onChange={(e) => setLinkSettings({ ...linkSettings, password: e.target.value })}
                        placeholder="Enter password"
                        className="w-full px-4 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                      />
                    )}
                  </div>

                  <button
                    onClick={handleGenerateLink}
                    disabled={loading}
                    className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
                  >
                    {loading ? 'Generating...' : shareLink ? 'Update Link' : 'Generate Link'}
                  </button>
                </div>
              </div>

              {shareLink && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Shareable Link
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={shareLinkService.getShareUrl(shareLink.share_token, documentType)}
                        readOnly
                        className="flex-1 px-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white"
                      />
                      <button
                        onClick={handleCopyLink}
                        className="px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded-lg transition-colors"
                      >
                        {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>

                  {qrCode && (
                    <div className="flex justify-center">
                      <div className="p-4 bg-white rounded-lg border border-gray-200">
                        <img src={qrCode} alt="QR Code" className="w-48 h-48" />
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                    <div className="flex items-center gap-1">
                      <Eye className="w-4 h-4" />
                      {shareLink.view_count} views
                    </div>
                    {shareLink.expires_at && (
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        Expires {new Date(shareLink.expires_at).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'email' && (
            <div className="space-y-4">
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                    Email service not configured
                  </p>
                  <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                    Please configure your email provider in Settings to enable email sending.
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  To
                </label>
                <input
                  type="email"
                  value={emailData.to}
                  onChange={(e) => setEmailData({ ...emailData, to: e.target.value })}
                  placeholder="customer@example.com"
                  className="w-full px-4 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Subject
                </label>
                <input
                  type="text"
                  value={emailData.subject}
                  onChange={(e) => setEmailData({ ...emailData, subject: e.target.value })}
                  className="w-full px-4 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Message
                </label>
                <textarea
                  value={emailData.body}
                  onChange={(e) => setEmailData({ ...emailData, body: e.target.value })}
                  rows={8}
                  className="w-full px-4 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <button
                onClick={handleSendEmail}
                disabled={loading || !emailData.to}
                className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Sending...
                  </span>
                ) : (
                  'Send Email'
                )}
              </button>
            </div>
          )}

          {activeTab === 'sms' && (
            <div className="space-y-4">
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-blue-800 dark:text-blue-200">
                    SMS Configuration Required
                  </p>
                  <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                    Configure your Twilio credentials in Settings to enable SMS sending.
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Phone Number
                </label>
                <PhoneInput
                  value={smsData.phone}
                  onChange={(e) => setSmsData({ ...smsData, phone: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Message Preview
                </label>
                <textarea
                  value={smsData.message}
                  readOnly
                  rows={4}
                  className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {smsData.message.length} characters
                </p>
              </div>

              <button
                onClick={handleSendSMS}
                disabled={loading || !smsData.phone}
                className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Sending...
                  </span>
                ) : (
                  'Send SMS'
                )}
              </button>
            </div>
          )}

          {activeTab === 'pdf' && (
            <div className="space-y-4">
              <div className="text-center py-8">
                <Download className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Download PDF
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                  Download a professional PDF version of this {documentType}
                </p>
                <button
                  onClick={handleDownloadPDF}
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors inline-flex items-center gap-2"
                >
                  <Download className="w-5 h-5" />
                  Download {documentType === 'quote' ? 'Quote' : 'Invoice'} PDF
                </button>
              </div>

              <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                  PDF Details
                </h4>
                <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                  <li>• Professional formatting with company branding</li>
                  <li>• Complete {documentType} details and line items</li>
                  <li>• Ready to print or email</li>
                  <li>• Saved as: {documentType === 'quote' ? 'Quote' : 'Invoice'}-{documentNumber}.pdf</li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
