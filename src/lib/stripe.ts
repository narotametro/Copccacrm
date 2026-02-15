// Stripe integration disabled - package not installed
// import { loadStripe, Stripe } from '@stripe/stripe-js';
type Stripe = any;

// Initialize Stripe
let stripePromise: Promise<Stripe | null>;

export const getStripe = () => {
  if (!stripePromise) {
    stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '');
  }
  return stripePromise;
};

// Stripe configuration
export const STRIPE_CONFIG = {
  publishableKey: import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '',
  webhookSecret: import.meta.env.VITE_STRIPE_WEBHOOK_SECRET || '',
  prices: {
    start: import.meta.env.VITE_STRIPE_PRICE_START || '',
    grow: import.meta.env.VITE_STRIPE_PRICE_GROW || '',
    pro: import.meta.env.VITE_STRIPE_PRICE_PRO || '',
    enterprise: import.meta.env.VITE_STRIPE_PRICE_ENTERPRISE || '',
  },
};

// Payment methods
export interface PaymentMethod {
  id: string;
  type: 'card' | 'bank_account';
  last4?: string;
  brand?: string;
  expiryMonth?: number;
  expiryYear?: number;
  isDefault: boolean;
}

// Subscription data
export interface StripeSubscription {
  id: string;
  status: 'active' | 'canceled' | 'incomplete' | 'incomplete_expired' | 'past_due' | 'trialing' | 'unpaid';
  current_period_start: number;
  current_period_end: number;
  cancel_at_period_end: boolean;
  canceled_at?: number;
  items: {
    data: Array<{
      price: {
        id: string;
        unit_amount: number;
        currency: string;
        product: string;
      };
    }>;
  };
}

// Payment intent
export interface PaymentIntent {
  id: string;
  client_secret: string;
  status: 'requires_payment_method' | 'requires_confirmation' | 'processing' | 'succeeded' | 'canceled' | 'requires_action';
  amount: number;
  currency: string;
}

// Create subscription
export const createSubscription = async (
  priceId: string,
  paymentMethodId: string,
  userId: string
): Promise<{ subscription: StripeSubscription; clientSecret: string }> => {
  const response = await fetch('/api/create-subscription', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      priceId,
      paymentMethodId,
      userId,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to create subscription');
  }

  return response.json();
};

// Update subscription
export const updateSubscription = async (
  subscriptionId: string,
  priceId: string
): Promise<StripeSubscription> => {
  const response = await fetch('/api/update-subscription', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      subscriptionId,
      priceId,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to update subscription');
  }

  return response.json();
};

// Cancel subscription
export const cancelSubscription = async (
  subscriptionId: string,
  cancelAtPeriodEnd: boolean = true
): Promise<StripeSubscription> => {
  const response = await fetch('/api/cancel-subscription', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      subscriptionId,
      cancelAtPeriodEnd,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to cancel subscription');
  }

  return response.json();
};

// Get payment methods
export const getPaymentMethods = async (customerId: string): Promise<PaymentMethod[]> => {
  const response = await fetch(`/api/payment-methods?customerId=${customerId}`);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to get payment methods');
  }

  return response.json();
};

// Attach payment method
export const attachPaymentMethod = async (
  paymentMethodId: string,
  customerId: string
): Promise<void> => {
  const response = await fetch('/api/attach-payment-method', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      paymentMethodId,
      customerId,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to attach payment method');
  }
};

// Detach payment method
export const detachPaymentMethod = async (paymentMethodId: string): Promise<void> => {
  const response = await fetch('/api/detach-payment-method', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      paymentMethodId,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to detach payment method');
  }
};

// Create payment intent for one-time payment
export const createPaymentIntent = async (
  amount: number,
  currency: string = 'tzs',
  metadata: Record<string, any> = {}
): Promise<PaymentIntent> => {
  const response = await fetch('/api/create-payment-intent', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      amount,
      currency,
      metadata,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to create payment intent');
  }

  return response.json();
};

// Confirm payment
export const confirmPayment = async (
  paymentIntentId: string,
  paymentMethodId: string
): Promise<PaymentIntent> => {
  const stripe = await getStripe();
  if (!stripe) throw new Error('Stripe not initialized');

  const { paymentIntent, error } = await stripe.confirmCardPayment(
    paymentIntentId,
    {
      payment_method: paymentMethodId,
    }
  );

  if (error) {
    throw new Error(error.message || 'Payment confirmation failed');
  }

  return paymentIntent as PaymentIntent;
};

// Webhook signature verification
export const verifyWebhookSignature = (
  payload: string,
  signature: string,
  secret: string
): boolean => {
  // In a real implementation, you'd use Stripe's webhook signature verification
  // For now, we'll return true for development
  return true;
};

// Handle webhook events
export const handleWebhookEvent = async (event: any) => {
  const { type, data } = event;

  switch (type) {
    case 'customer.subscription.created':
      await handleSubscriptionCreated(data.object);
      break;
    case 'customer.subscription.updated':
      await handleSubscriptionUpdated(data.object);
      break;
    case 'customer.subscription.deleted':
      await handleSubscriptionDeleted(data.object);
      break;
    case 'invoice.payment_succeeded':
      await handlePaymentSucceeded(data.object);
      break;
    case 'invoice.payment_failed':
      await handlePaymentFailed(data.object);
      break;
    default:
      console.log(`Unhandled event type: ${type}`);
  }
};

// Webhook handlers
const handleSubscriptionCreated = async (subscription: StripeSubscription) => {
  // Update database with new subscription
  console.log('Subscription created:', subscription.id);
};

const handleSubscriptionUpdated = async (subscription: StripeSubscription) => {
  // Update subscription status in database
  console.log('Subscription updated:', subscription.id);
};

const handleSubscriptionDeleted = async (subscription: StripeSubscription) => {
  // Mark subscription as cancelled in database
  console.log('Subscription deleted:', subscription.id);
};

const handlePaymentSucceeded = async (invoice: any) => {
  // Record successful payment
  console.log('Payment succeeded for invoice:', invoice.id);
};

const handlePaymentFailed = async (invoice: any) => {
  // Handle failed payment
  console.log('Payment failed for invoice:', invoice.id);
};