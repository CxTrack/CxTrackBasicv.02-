/**
 * CSV Utilities
 * Parsing, field detection, and mapping for CSV imports
 */

// Standard CRM field mappings with common CSV column names
export const FIELD_MAPPINGS: Record<string, string[]> = {
    first_name: ['first_name', 'firstname', 'first', 'given_name', 'givenname'],
    last_name: ['last_name', 'lastname', 'last', 'surname', 'family_name'],
    name: ['name', 'full_name', 'fullname', 'contact_name', 'customer_name'],
    email: ['email', 'e-mail', 'email_address', 'emailaddress', 'mail'],
    phone: ['phone', 'telephone', 'tel', 'phone_number', 'phonenumber', 'mobile', 'cell'],
    company: ['company', 'company_name', 'companyname', 'organization', 'org', 'business', 'business_name'],
    title: ['title', 'job_title', 'jobtitle', 'position', 'role'],
    address: ['address', 'street', 'street_address', 'address1', 'address_1'],
    city: ['city', 'town', 'locality'],
    state: ['state', 'province', 'region', 'state_province'],
    postal_code: ['postal_code', 'postalcode', 'zip', 'zipcode', 'zip_code', 'postcode'],
    country: ['country', 'nation', 'country_code'],
    website: ['website', 'web', 'url', 'site', 'homepage'],
    notes: ['notes', 'note', 'comments', 'comment', 'description'],
    tags: ['tags', 'tag', 'labels', 'categories', 'category'],
    status: ['status', 'customer_status', 'account_status'],
    priority: ['priority', 'importance', 'priority_level'],
    customer_type: ['customer_type', 'type', 'account_type', 'contact_type']
};

// Parse CSV text to array of objects
export const parseCSV = (text: string): { headers: string[]; rows: Record<string, string>[] } => {
    const lines = text.split(/\r?\n/).filter(line => line.trim());
    if (lines.length === 0) return { headers: [], rows: [] };

    // Detect delimiter (comma, semicolon, tab)
    const firstLine = lines[0];
    const delimiter = detectDelimiter(firstLine);

    // Parse header row
    const headers = parseCSVLine(firstLine, delimiter).map(h => h.trim());

    // Parse data rows
    const rows = lines.slice(1).map(line => {
        const values = parseCSVLine(line, delimiter);
        const row: Record<string, string> = {};
        headers.forEach((header, index) => {
            row[header] = values[index]?.trim() || '';
        });
        return row;
    });

    return { headers, rows };
};

// Detect CSV delimiter
const detectDelimiter = (line: string): string => {
    const delimiters = [',', ';', '\t', '|'];
    let maxCount = 0;
    let bestDelimiter = ',';

    for (const delimiter of delimiters) {
        const count = (line.match(new RegExp(delimiter.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length;
        if (count > maxCount) {
            maxCount = count;
            bestDelimiter = delimiter;
        }
    }

    return bestDelimiter;
};

// Parse a single CSV line handling quoted values
const parseCSVLine = (line: string, delimiter: string): string[] => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        const nextChar = line[i + 1];

        if (char === '"' && !inQuotes) {
            inQuotes = true;
        } else if (char === '"' && inQuotes) {
            if (nextChar === '"') {
                current += '"';
                i++; // Skip escaped quote
            } else {
                inQuotes = false;
            }
        } else if (char === delimiter && !inQuotes) {
            result.push(current);
            current = '';
        } else {
            current += char;
        }
    }
    result.push(current);

    return result;
};

// Auto-detect field mapping from CSV headers
export const autoDetectMapping = (csvHeaders: string[]): Record<string, string> => {
    const mapping: Record<string, string> = {};

    for (const header of csvHeaders) {
        const normalizedHeader = header.toLowerCase().replace(/[^a-z0-9]/g, '_');

        for (const [crmField, aliases] of Object.entries(FIELD_MAPPINGS)) {
            if (aliases.includes(normalizedHeader) || aliases.some(a => normalizedHeader.includes(a))) {
                mapping[header] = crmField;
                break;
            }
        }

        // If no match found, leave unmapped
        if (!mapping[header]) {
            mapping[header] = '';
        }
    }

    return mapping;
};

// Get available CRM fields for mapping
export const getCRMFields = () => [
    { key: 'first_name', label: 'First Name', group: 'Name' },
    { key: 'last_name', label: 'Last Name', group: 'Name' },
    { key: 'name', label: 'Full Name', group: 'Name' },
    { key: 'email', label: 'Email', group: 'Contact' },
    { key: 'phone', label: 'Phone', group: 'Contact' },
    { key: 'company', label: 'Company', group: 'Business' },
    { key: 'title', label: 'Job Title', group: 'Business' },
    { key: 'address', label: 'Address', group: 'Location' },
    { key: 'city', label: 'City', group: 'Location' },
    { key: 'state', label: 'State/Province', group: 'Location' },
    { key: 'postal_code', label: 'Postal Code', group: 'Location' },
    { key: 'country', label: 'Country', group: 'Location' },
    { key: 'website', label: 'Website', group: 'Online' },
    { key: 'notes', label: 'Notes', group: 'Other' },
    { key: 'tags', label: 'Tags', group: 'Other' },
    { key: 'status', label: 'Status', group: 'Other' },
    { key: 'priority', label: 'Priority', group: 'Other' },
    { key: 'customer_type', label: 'Customer Type', group: 'Other' }
];

// Find duplicates in existing customers
export interface DuplicateMatch {
    csvRow: Record<string, string>;
    csvRowIndex: number;
    existingCustomer: any;
    matchType: 'email' | 'phone' | 'name';
    matchValue: string;
}

export const findDuplicates = (
    rows: Record<string, string>[],
    mapping: Record<string, string>,
    existingCustomers: any[]
): DuplicateMatch[] => {
    const duplicates: DuplicateMatch[] = [];

    // Create lookup maps
    const emailMap = new Map(existingCustomers.filter(c => c.email).map(c => [c.email.toLowerCase(), c]));
    const phoneMap = new Map(existingCustomers.filter(c => c.phone).map(c => [normalizePhone(c.phone), c]));

    rows.forEach((row, index) => {
        // Find email column
        const emailColumn = Object.entries(mapping).find(([_, crmField]) => crmField === 'email')?.[0];
        const phoneColumn = Object.entries(mapping).find(([_, crmField]) => crmField === 'phone')?.[0];

        if (emailColumn && row[emailColumn]) {
            const email = row[emailColumn].toLowerCase();
            if (emailMap.has(email)) {
                duplicates.push({
                    csvRow: row,
                    csvRowIndex: index,
                    existingCustomer: emailMap.get(email),
                    matchType: 'email',
                    matchValue: email
                });
                return; // Don't check phone if email matches
            }
        }

        if (phoneColumn && row[phoneColumn]) {
            const phone = normalizePhone(row[phoneColumn]);
            if (phoneMap.has(phone)) {
                duplicates.push({
                    csvRow: row,
                    csvRowIndex: index,
                    existingCustomer: phoneMap.get(phone),
                    matchType: 'phone',
                    matchValue: row[phoneColumn]
                });
            }
        }
    });

    return duplicates;
};

// Normalize phone number for comparison
const normalizePhone = (phone: string): string => {
    return phone.replace(/\D/g, '').slice(-10);
};

// Transform CSV row to customer object
export const transformRowToCustomer = (
    row: Record<string, string>,
    mapping: Record<string, string>
): Partial<any> => {
    const customer: Record<string, any> = {};

    for (const [csvColumn, crmField] of Object.entries(mapping)) {
        if (crmField && row[csvColumn]) {
            // Handle tags specially
            if (crmField === 'tags') {
                customer.tags = row[csvColumn].split(/[,;]/).map(t => t.trim()).filter(Boolean);
            } else {
                customer[crmField] = row[csvColumn];
            }
        }
    }

    // Generate name from first + last if not provided
    if (!customer.name && (customer.first_name || customer.last_name)) {
        customer.name = [customer.first_name, customer.last_name].filter(Boolean).join(' ');
    }

    // Set defaults
    customer.status = customer.status || 'Active';
    customer.priority = customer.priority || 'Medium';
    customer.country = customer.country || 'USA';
    customer.customer_type = customer.customer_type || (customer.company ? 'business' : 'personal');
    customer.total_spent = 0;
    customer.custom_fields = {};
    customer.tags = customer.tags || [];

    return customer;
};

// Validate imported customer data
export interface ValidationError {
    rowIndex: number;
    field: string;
    message: string;
}

export const validateImportData = (
    rows: Record<string, string>[],
    mapping: Record<string, string>
): ValidationError[] => {
    const errors: ValidationError[] = [];
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    rows.forEach((row, index) => {
        const emailColumn = Object.entries(mapping).find(([_, crmField]) => crmField === 'email')?.[0];

        // Validate email format if present
        if (emailColumn && row[emailColumn] && !emailRegex.test(row[emailColumn])) {
            errors.push({
                rowIndex: index,
                field: 'email',
                message: `Invalid email format: ${row[emailColumn]}`
            });
        }
    });

    return errors;
};
