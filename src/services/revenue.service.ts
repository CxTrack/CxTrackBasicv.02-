import { supabase } from '@/lib/supabase';

export interface RevenueStats {
  current_month_revenue: number;
  last_month_revenue: number;
  month_over_month_change: number;
  month_over_month_percent: number;
  ytd_revenue: number;
  pending_invoices: number;
  overdue_invoices: number;
}

export interface RevenueByCustomer {
  customer_id: string;
  customer_name: string;
  total_revenue: number;
  invoice_count: number;
}

export interface RevenueByProduct {
  product_id: string;
  product_name: string;
  total_revenue: number;
  quantity_sold: number;
}

export interface MonthlyRevenueData {
  month: string;
  revenue: number;
  invoice_count: number;
}

export const revenueService = {
  async getRevenueStats(
    organizationId: string,
    year?: number,
    month?: number
  ): Promise<RevenueStats> {
    // Handle demo mode
    if (typeof window !== 'undefined' && localStorage.getItem('DEMO_MODE') === 'true') {
      try {
        const invoices = JSON.parse(localStorage.getItem('cxtrack_demo_invoices') || '[]');

        const now = new Date();
        const currentYear = year || now.getFullYear();
        const currentMonth = month || now.getMonth() + 1;

        // Current month dates
        const currentMonthStart = new Date(currentYear, currentMonth - 1, 1);
        const currentMonthEnd = new Date(currentYear, currentMonth, 0);

        // Last month dates
        const lastMonthStart = new Date(currentYear, currentMonth - 2, 1);
        const lastMonthEnd = new Date(currentYear, currentMonth - 1, 0);

        // Year start
        const yearStart = new Date(currentYear, 0, 1);

        // Calculate current month revenue from paid invoices
        const currentMonthRevenue = invoices
          .filter((inv: any) => {
            if (inv.status !== 'paid' || !inv.paid_at) return false;
            const paidDate = new Date(inv.paid_at);
            return paidDate >= currentMonthStart && paidDate <= currentMonthEnd;
          })
          .reduce((sum: number, inv: any) => sum + (inv.total_amount || 0), 0);

        // Calculate last month revenue
        const lastMonthRevenue = invoices
          .filter((inv: any) => {
            if (inv.status !== 'paid' || !inv.paid_at) return false;
            const paidDate = new Date(inv.paid_at);
            return paidDate >= lastMonthStart && paidDate <= lastMonthEnd;
          })
          .reduce((sum: number, inv: any) => sum + (inv.total_amount || 0), 0);

        // Calculate YTD revenue
        const ytdRevenue = invoices
          .filter((inv: any) => {
            if (inv.status !== 'paid' || !inv.paid_at) return false;
            const paidDate = new Date(inv.paid_at);
            return paidDate >= yearStart && paidDate <= now;
          })
          .reduce((sum: number, inv: any) => sum + (inv.total_amount || 0), 0);

        // Calculate pending and overdue invoices
        const pendingInvoices = invoices.filter((inv: any) =>
          inv.status === 'sent' || inv.status === 'viewed'
        ).length;

        const overdueInvoices = invoices.filter((inv: any) => {
          if (inv.status === 'paid' || inv.status === 'cancelled') return false;
          const dueDate = new Date(inv.due_date);
          return dueDate < now;
        }).length;

        // Calculate month-over-month change
        const monthOverMonthChange = currentMonthRevenue - lastMonthRevenue;
        const monthOverMonthPercent = lastMonthRevenue > 0
          ? (monthOverMonthChange / lastMonthRevenue) * 100
          : 0;

        return {
          current_month_revenue: currentMonthRevenue,
          last_month_revenue: lastMonthRevenue,
          month_over_month_change: monthOverMonthChange,
          month_over_month_percent: monthOverMonthPercent,
          ytd_revenue: ytdRevenue,
          pending_invoices: pendingInvoices,
          overdue_invoices: overdueInvoices,
        };
      } catch (error) {
        console.error('Error calculating demo revenue stats:', error);
        return {
          current_month_revenue: 0,
          last_month_revenue: 0,
          month_over_month_change: 0,
          month_over_month_percent: 0,
          ytd_revenue: 0,
          pending_invoices: 0,
          overdue_invoices: 0,
        };
      }
    }

    try {
      const params: any = { p_organization_id: organizationId };

      if (year !== undefined) {
        params.p_year = year;
      }
      if (month !== undefined) {
        params.p_month = month;
      }

      const { data, error } = await supabase.rpc('calculate_monthly_revenue', params);

      if (error) throw error;

      return data as RevenueStats;
    } catch (error) {
      console.error('Error fetching revenue stats:', error);
      throw error;
    }
  },

  async getRevenueByCustomer(
    organizationId: string,
    startDate?: string,
    endDate?: string,
    limit: number = 10
  ): Promise<RevenueByCustomer[]> {
    try {
      let query = supabase
        .from('invoices')
        .select(`
          customer_id,
          total_amount,
          customers (
            id,
            name,
            first_name,
            last_name,
            company
          )
        `)
        .eq('organization_id', organizationId)
        .eq('status', 'paid');

      if (startDate) {
        query = query.gte('paid_at', startDate);
      }
      if (endDate) {
        query = query.lte('paid_at', endDate);
      }

      const { data, error } = await query;

      if (error) throw error;

      const customerMap = new Map<string, RevenueByCustomer>();

      data.forEach((invoice: any) => {
        if (!invoice.customer_id) return;

        const customerId = invoice.customer_id;
        const customer = invoice.customers;
        const customerName = customer
          ? (customer.first_name || customer.last_name
              ? `${customer.first_name || ''} ${customer.last_name || ''}`.trim()
              : customer.name || customer.company || 'Unknown')
          : 'Unknown';

        if (customerMap.has(customerId)) {
          const existing = customerMap.get(customerId)!;
          existing.total_revenue += Number(invoice.total_amount);
          existing.invoice_count += 1;
        } else {
          customerMap.set(customerId, {
            customer_id: customerId,
            customer_name: customerName,
            total_revenue: Number(invoice.total_amount),
            invoice_count: 1,
          });
        }
      });

      return Array.from(customerMap.values())
        .sort((a, b) => b.total_revenue - a.total_revenue)
        .slice(0, limit);
    } catch (error) {
      console.error('Error fetching revenue by customer:', error);
      throw error;
    }
  },

  async getRevenueByProduct(
    organizationId: string,
    startDate?: string,
    endDate?: string,
    limit: number = 10
  ): Promise<RevenueByProduct[]> {
    try {
      let query = supabase
        .from('invoices')
        .select(`
          invoice_items (
            product_id,
            product_name,
            quantity,
            line_total
          )
        `)
        .eq('organization_id', organizationId)
        .eq('status', 'paid');

      if (startDate) {
        query = query.gte('paid_at', startDate);
      }
      if (endDate) {
        query = query.lte('paid_at', endDate);
      }

      const { data, error } = await query;

      if (error) throw error;

      const productMap = new Map<string, RevenueByProduct>();

      data.forEach((invoice: any) => {
        if (!invoice.invoice_items) return;

        invoice.invoice_items.forEach((item: any) => {
          const productId = item.product_id || 'unknown';
          const productName = item.product_name || 'Unknown Product';

          if (productMap.has(productId)) {
            const existing = productMap.get(productId)!;
            existing.total_revenue += Number(item.line_total || 0);
            existing.quantity_sold += Number(item.quantity || 0);
          } else {
            productMap.set(productId, {
              product_id: productId,
              product_name: productName,
              total_revenue: Number(item.line_total || 0),
              quantity_sold: Number(item.quantity || 0),
            });
          }
        });
      });

      return Array.from(productMap.values())
        .sort((a, b) => b.total_revenue - a.total_revenue)
        .slice(0, limit);
    } catch (error) {
      console.error('Error fetching revenue by product:', error);
      throw error;
    }
  },

  async getMonthlyRevenueTrend(
    organizationId: string,
    year?: number,
    monthCount: number = 12
  ): Promise<MonthlyRevenueData[]> {
    const currentYear = year || new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1;

    try {
      const monthlyData: MonthlyRevenueData[] = [];

      for (let i = monthCount - 1; i >= 0; i--) {
        let targetYear = currentYear;
        let targetMonth = currentMonth - i;

        while (targetMonth <= 0) {
          targetMonth += 12;
          targetYear -= 1;
        }
        while (targetMonth > 12) {
          targetMonth -= 12;
          targetYear += 1;
        }

        const startDate = new Date(targetYear, targetMonth - 1, 1);
        const endDate = new Date(targetYear, targetMonth, 0);

        const { data, error } = await supabase
          .from('invoices')
          .select('total_amount', { count: 'exact' })
          .eq('organization_id', organizationId)
          .eq('status', 'paid')
          .gte('paid_at', startDate.toISOString())
          .lte('paid_at', endDate.toISOString());

        if (error) throw error;

        const revenue = data?.reduce((sum, inv) => sum + Number(inv.total_amount), 0) || 0;
        const invoiceCount = data?.length || 0;

        monthlyData.push({
          month: `${targetYear}-${String(targetMonth).padStart(2, '0')}`,
          revenue,
          invoice_count: invoiceCount,
        });
      }

      return monthlyData;
    } catch (error) {
      console.error('Error fetching monthly revenue trend:', error);
      throw error;
    }
  },

  async recordPayment(
    organizationId: string,
    invoiceId: string,
    paymentData: {
      amount: number;
      payment_method: string;
      payment_date: string;
      reference_number?: string;
      notes?: string;
    }
  ): Promise<void> {
    try {
      const { data: invoice, error: invoiceError } = await supabase
        .from('invoices')
        .select('*')
        .eq('id', invoiceId)
        .single();

      if (invoiceError) throw invoiceError;

      const { data: paymentNumberData } = await supabase
        .from('payments')
        .select('id', { count: 'exact' })
        .eq('organization_id', organizationId);

      const paymentCount = paymentNumberData?.length || 0;
      const paymentNumber = `PAY-${new Date().getFullYear()}-${String(paymentCount + 1).padStart(4, '0')}`;

      const { error: paymentError } = await supabase.from('payments').insert([
        {
          organization_id: organizationId,
          invoice_id: invoiceId,
          customer_id: invoice.customer_id,
          payment_number: paymentNumber,
          amount: paymentData.amount,
          payment_date: paymentData.payment_date,
          payment_method: paymentData.payment_method,
          reference_number: paymentData.reference_number,
          notes: paymentData.notes,
          status: 'completed',
        },
      ]);

      if (paymentError) throw paymentError;

      const newAmountPaid = Number(invoice.amount_paid || 0) + paymentData.amount;
      const newAmountDue = Number(invoice.total_amount) - newAmountPaid;
      const newStatus = newAmountDue <= 0 ? 'paid' : 'partial';

      const updateData: any = {
        amount_paid: newAmountPaid,
        amount_due: newAmountDue,
        status: newStatus,
      };

      if (newAmountDue <= 0) {
        updateData.paid_at = paymentData.payment_date;
        updateData.revenue_recognized = true;
        updateData.revenue_recognition_date = paymentData.payment_date;
      }

      const { error: updateError } = await supabase
        .from('invoices')
        .update(updateData)
        .eq('id', invoiceId);

      if (updateError) throw updateError;
    } catch (error) {
      console.error('Error recording payment:', error);
      throw error;
    }
  },
};
