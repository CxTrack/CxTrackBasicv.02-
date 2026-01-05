import type { Customer } from '@/types/database.types';

export const getCustomerFullName = (customer: Customer | null | undefined): string => {
  if (!customer) return 'Unnamed Customer';

  if (customer.customer_type === 'business' && customer.company) {
    return customer.company;
  }

  if (customer.first_name || customer.last_name) {
    return [customer.first_name, customer.middle_name, customer.last_name]
      .filter(Boolean)
      .join(' ');
  }

  return customer.name || 'Unnamed Customer';
};
