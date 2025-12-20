// Subscription management routes
import { Context } from 'npm:hono';
import * as kv from './kv_store.tsx';

// Initialize subscription for a user
export async function initializeSubscription(c: Context) {
  try {
    const { adminEmail, adminName, totalUsers } = await c.req.json();

    if (!adminEmail || !adminName || !totalUsers) {
      return c.json({ error: 'Missing required fields' }, 400);
    }

    const subscriptionData = {
      id: crypto.randomUUID(),
      adminEmail,
      adminName,
      totalUsers,
      subscriptionStatus: 'pending',
      paymentStatus: 'unpaid',
      subscriptionStart: new Date().toISOString(),
      subscriptionEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // 1 year from now
      createdAt: new Date().toISOString(),
    };

    await kv.set(`subscription:${adminEmail}`, subscriptionData);

    return c.json({ success: true, subscription: subscriptionData });
  } catch (error) {
    console.error('Error initializing subscription:', error);
    return c.json({ error: 'Failed to initialize subscription' }, 500);
  }
}

// Get subscription status for a user
export async function getSubscriptionStatus(c: Context) {
  try {
    const adminEmail = c.req.query('adminEmail');

    if (!adminEmail) {
      return c.json({ error: 'Admin email is required' }, 400);
    }

    const subscription = await kv.get(`subscription:${adminEmail}`);

    if (!subscription) {
      return c.json({ 
        hasSubscription: false,
        subscriptionStatus: 'none',
        paymentStatus: 'unpaid'
      });
    }

    // Check if subscription has expired
    const now = new Date();
    const endDate = new Date(subscription.subscriptionEnd);
    
    if (now > endDate && subscription.subscriptionStatus === 'active') {
      subscription.subscriptionStatus = 'expired';
      await kv.set(`subscription:${adminEmail}`, subscription);
    }

    return c.json({
      hasSubscription: true,
      ...subscription
    });
  } catch (error) {
    console.error('Error getting subscription status:', error);
    return c.json({ error: 'Failed to get subscription status' }, 500);
  }
}

// Process payment
export async function processPayment(c: Context) {
  try {
    const { adminEmail, totalUsers, amount, paymentMethod, phoneNumber, cardDetails } = await c.req.json();

    if (!adminEmail || !totalUsers || !amount) {
      return c.json({ error: 'Missing required payment fields' }, 400);
    }

    // Get existing subscription
    const subscription = await kv.get(`subscription:${adminEmail}`);

    if (!subscription) {
      return c.json({ error: 'Subscription not found' }, 404);
    }

    // In a real implementation, you would integrate with payment gateways here:
    // - M-Pesa API for mobile money
    // - Stripe/PayStack for card payments
    // - Bank API for bank transfers

    // For now, we'll simulate payment processing
    console.log(`Processing payment for ${adminEmail}:`, {
      amount,
      paymentMethod,
      phoneNumber,
      totalUsers
    });

    // Update subscription with payment info
    subscription.paymentStatus = 'paid';
    subscription.subscriptionStatus = 'active';
    subscription.lastPaymentDate = new Date().toISOString();
    subscription.lastPaymentAmount = amount;
    subscription.paymentMethod = paymentMethod;
    subscription.subscriptionEnd = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();

    await kv.set(`subscription:${adminEmail}`, subscription);

    // Store payment record
    const paymentRecord = {
      id: crypto.randomUUID(),
      adminEmail,
      amount,
      paymentMethod,
      paymentDate: new Date().toISOString(),
      status: 'completed',
      transactionId: `TXN-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
    };

    await kv.set(`payment:${paymentRecord.id}`, paymentRecord);

    return c.json({ 
      success: true, 
      message: 'Payment processed successfully',
      transactionId: paymentRecord.transactionId,
      subscription 
    });
  } catch (error) {
    console.error('Error processing payment:', error);
    return c.json({ error: 'Failed to process payment' }, 500);
  }
}

// Admin: Get all subscriptions
export async function getAllSubscriptions(c: Context) {
  try {
    const subscriptions = await kv.getByPrefix('subscription:');

    // Sort by creation date, newest first
    const sortedSubscriptions = subscriptions.sort((a: any, b: any) => {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    return c.json(sortedSubscriptions);
  } catch (error) {
    console.error('Error getting all subscriptions:', error);
    return c.json({ error: 'Failed to get subscriptions' }, 500);
  }
}

// Admin: Update subscription status
export async function updateSubscriptionStatus(c: Context) {
  try {
    const { adminEmail, status } = await c.req.json();

    if (!adminEmail || !status) {
      return c.json({ error: 'Missing required fields' }, 400);
    }

    const subscription = await kv.get(`subscription:${adminEmail}`);

    if (!subscription) {
      return c.json({ error: 'Subscription not found' }, 404);
    }

    subscription.subscriptionStatus = status;
    subscription.updatedAt = new Date().toISOString();

    if (status === 'active') {
      // Extend subscription by 1 year
      subscription.subscriptionEnd = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();
    }

    await kv.set(`subscription:${adminEmail}`, subscription);

    return c.json({ success: true, subscription });
  } catch (error) {
    console.error('Error updating subscription status:', error);
    return c.json({ error: 'Failed to update subscription status' }, 500);
  }
}

// Admin: Update payment status
export async function updatePaymentStatus(c: Context) {
  try {
    const { adminEmail, status } = await c.req.json();

    if (!adminEmail || !status) {
      return c.json({ error: 'Missing required fields' }, 400);
    }

    const subscription = await kv.get(`subscription:${adminEmail}`);

    if (!subscription) {
      return c.json({ error: 'Subscription not found' }, 404);
    }

    subscription.paymentStatus = status;
    subscription.updatedAt = new Date().toISOString();

    if (status === 'paid') {
      subscription.lastPaymentDate = new Date().toISOString();
    }

    await kv.set(`subscription:${adminEmail}`, subscription);

    return c.json({ success: true, subscription });
  } catch (error) {
    console.error('Error updating payment status:', error);
    return c.json({ error: 'Failed to update payment status' }, 500);
  }
}

// Get payment history for an admin
export async function getPaymentHistory(c: Context) {
  try {
    const adminEmail = c.req.query('adminEmail');

    if (!adminEmail) {
      return c.json({ error: 'Admin email is required' }, 400);
    }

    const allPayments = await kv.getByPrefix('payment:');
    const userPayments = allPayments.filter((p: any) => p.adminEmail === adminEmail);

    // Sort by payment date, newest first
    const sortedPayments = userPayments.sort((a: any, b: any) => {
      return new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime();
    });

    return c.json(sortedPayments);
  } catch (error) {
    console.error('Error getting payment history:', error);
    return c.json({ error: 'Failed to get payment history' }, 500);
  }
}
