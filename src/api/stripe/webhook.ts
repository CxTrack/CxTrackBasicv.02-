import type Stripe from 'stripe';
import { stripe } from '@/lib/stripe';
import { supabase } from '@/lib/supabase';

export async function POST(request: Request) {
    const sig = request.headers.get('stripe-signature')!;
    const body = await request.text();

    let event: Stripe.Event;

    try {
        event = stripe.webhooks.constructEvent(
            body,
            sig,
            process.env.STRIPE_WEBHOOK_SECRET!
        );
    } catch (err: any) {
        return new Response(`Webhook Error: ${err.message}`, { status: 400 });
    }

    // Handle events
    switch (event.type) {
        case 'customer.subscription.created':
        case 'customer.subscription.updated': {
            const subscription = event.data.object as Stripe.Subscription;
            await handleSubscriptionUpdate(subscription);
            break;
        }

        case 'customer.subscription.deleted': {
            const canceledSubscription = event.data.object as Stripe.Subscription;
            await handleSubscriptionCanceled(canceledSubscription);
            break;
        }

        case 'invoice.paid': {
            const invoice = event.data.object as Stripe.Invoice;
            await handleInvoicePaid(invoice);
            break;
        }

        case 'invoice.payment_failed': {
            const failedInvoice = event.data.object as Stripe.Invoice;
            await handlePaymentFailed(failedInvoice);
            break;
        }
    }

    return new Response(JSON.stringify({ received: true }), { status: 200 });
}

async function handleSubscriptionUpdate(subscription: Stripe.Subscription) {
    const { data: org } = await supabase
        .from('organizations')
        .select('id')
        .eq('stripe_customer_id', subscription.customer as string)
        .single();

    if (!org) return;

    await supabase
        .from('subscriptions')
        .upsert({
            organization_id: org.id,
            stripe_subscription_id: subscription.id,
            stripe_customer_id: subscription.customer as string,
            plan_name: subscription.items.data[0].price.nickname || 'Professional',
            plan_amount: subscription.items.data[0].price.unit_amount || 0,
            interval: subscription.items.data[0].price.recurring?.interval || 'month',
            status: subscription.status,
            current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
            current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
            cancel_at_period_end: subscription.cancel_at_period_end,
        });

    await supabase
        .from('organizations')
        .update({
            plan: subscription.items.data[0].price.nickname?.toLowerCase() || 'professional',
            status: subscription.status === 'active' ? 'active' : 'suspended',
        })
        .eq('id', org.id);
}

async function handleSubscriptionCanceled(subscription: Stripe.Subscription) {
    const { data: org } = await supabase
        .from('organizations')
        .select('id')
        .eq('stripe_customer_id', subscription.customer as string)
        .single();

    if (!org) return;

    // Update subscription record with canceled status and timestamp
    await supabase
        .from('subscriptions')
        .update({
            status: 'canceled',
            canceled_at: new Date().toISOString(),
            cancel_at_period_end: false,
        })
        .eq('stripe_subscription_id', subscription.id);

    // Update organization status
    await supabase
        .from('organizations')
        .update({
            status: 'cancelled',
            plan: 'free',
        })
        .eq('id', org.id);

    // Log the cancellation event for churn tracking
    await supabase
        .from('audit_logs')
        .insert({
            organization_id: org.id,
            action: 'subscription_canceled',
            resource_type: 'subscription',
            resource_id: subscription.id,
            changes: {
                canceled_at: new Date().toISOString(),
                reason: subscription.cancellation_details?.reason || 'unknown',
            },
        });
}

async function handleInvoicePaid(invoice: Stripe.Invoice) {
    const { data: org } = await supabase
        .from('organizations')
        .select('id')
        .eq('stripe_customer_id', invoice.customer as string)
        .single();

    if (!org) return;

    await supabase
        .from('stripe_invoices')
        .insert({
            organization_id: org.id,
            stripe_invoice_id: invoice.id,
            amount_paid: invoice.amount_paid,
            amount_due: invoice.amount_due,
            currency: invoice.currency,
            status: invoice.status || 'paid',
            invoice_pdf: invoice.invoice_pdf,
            hosted_invoice_url: invoice.hosted_invoice_url,
            period_start: new Date(invoice.period_start * 1000).toISOString(),
            period_end: new Date(invoice.period_end * 1000).toISOString(),
        });
}

async function handlePaymentFailed(invoice: Stripe.Invoice) {
    const { data: org } = await supabase
        .from('organizations')
        .select('id')
        .eq('stripe_customer_id', invoice.customer as string)
        .single();

    if (!org) return;

    // Update subscription to past_due
    await supabase
        .from('subscriptions')
        .update({ status: 'past_due' })
        .eq('stripe_customer_id', invoice.customer as string);

    // Log the failed payment
    await supabase
        .from('audit_logs')
        .insert({
            organization_id: org.id,
            action: 'payment_failed',
            resource_type: 'invoice',
            resource_id: invoice.id,
            changes: {
                amount_due: invoice.amount_due,
                attempt_count: invoice.attempt_count,
            },
        });

    console.log('Payment failed for invoice:', invoice.id);
}
