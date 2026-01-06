import Stripe from 'stripe';

// Server-side only (use API routes)
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2023-10-16',
});

// Stripe Products (create these in Stripe Dashboard)
export const STRIPE_PLANS = {
    free: {
        name: 'Free',
        price: 0,
        priceId: null,
        features: ['5 Users', '100 API Calls/month', '1 GB Storage'],
    },
    professional: {
        name: 'Professional',
        price: 49,
        priceId: 'price_professional_monthly', // from Stripe
        features: ['Unlimited Users', '10,000 API Calls/month', '10 GB Storage', 'Priority Support'],
    },
    enterprise: {
        name: 'Enterprise',
        price: 199,
        priceId: 'price_enterprise_monthly',
        features: ['Unlimited Users', 'Unlimited API Calls', '100 GB Storage', 'Dedicated Support', 'SLA'],
    },
};
