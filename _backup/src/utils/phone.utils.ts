export const formatPhoneDisplay = (phoneNumber: string | null | undefined): string => {
  if (!phoneNumber) return '';

  const cleaned = phoneNumber.replace(/\D/g, '');

  if (cleaned.startsWith('1') && cleaned.length === 11) {
    const digits = cleaned.slice(1);
    return `+1 (${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  }

  if (cleaned.length === 10) {
    return `+1 (${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  }

  return phoneNumber;
};

export const normalizePhoneNumber = (phoneNumber: string): string => {
  const cleaned = phoneNumber.replace(/\D/g, '');

  if (cleaned.length === 10) {
    return `+1${cleaned}`;
  }

  if (cleaned.startsWith('1') && cleaned.length === 11) {
    return `+${cleaned}`;
  }

  if (phoneNumber.startsWith('+')) {
    return phoneNumber;
  }

  return `+1${cleaned}`;
};
