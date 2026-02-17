import { NextRequest, NextResponse } from "next/server";
import {
  createSuccessResponse,
  createErrorResponse,
  ValidationError,
  NotFoundError,
  PaymentError,
} from "@/lib/utils/error-handler";
import { query, queryOne, transaction } from "@/lib/config/database";
import { logger } from "@/lib/utils/logger";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2024-06-20",
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || "";

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get("stripe-signature");

    if (!signature || !webhookSecret) {
      throw new ValidationError("Invalid webhook signature");
    }

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
      logger.error("Webhook signature verification failed", {
        error: err instanceof Error ? err.message : "Unknown error",
      });
      throw new ValidationError("Invalid webhook signature");
    }

    logger.paymentEvent("webhook_received", { eventType: event.type });

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutCompleted(session);
        break;
      }
      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionUpdate(subscription);
        break;
      }
      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionDeleted(subscription);
        break;
      }
      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice;
        await handleInvoicePaymentSucceeded(invoice);
        break;
      }
      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        await handleInvoicePaymentFailed(invoice);
        break;
      }
      default:
        logger.debug("Unhandled webhook event", { eventType: event.type });
    }

    return NextResponse.json(createSuccessResponse({ received: true }));
  } catch (error) {
    const handled = handleError(error);
    return NextResponse.json(createErrorResponse(handled.code, handled.message), {
      status: handled.statusCode,
    });
  }

  function handleError(error: unknown) {
    if (
      error instanceof ValidationError ||
      error instanceof NotFoundError ||
      error instanceof PaymentError
    ) {
      return {
        code: error.code,
        message: error.message,
        statusCode: error.statusCode,
      };
    }

    logger.error("Webhook processing error", {
      error: error instanceof Error ? error.message : "Unknown error",
    });

    return {
      code: "PAYMENT_ERROR",
      message: "Failed to process webhook",
      statusCode: 500,
    };
  }
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const { userId, planId } = session.metadata || {};

  if (!userId || !planId) {
    logger.error("Invalid checkout session metadata", { sessionId: session.id });
    throw new PaymentError("Invalid checkout session");
  }

  const plan = PRICING_PLANS.find((p) => p.id === planId);

  if (!plan) {
    throw new NotFoundError("Pricing plan");
  }

  await transaction(async (client) => {
    await client.query(
      `UPDATE users 
       SET subscription_tier = $1, subscription_status = 'active', updated_at = NOW() 
       WHERE id = $2`,
      [planId, userId]
    );

    await client.query(
      `UPDATE subscriptions 
       SET tier = $1, status = 'active', stripe_subscription_id = $2, 
           current_period_start = NOW(), current_period_end = NOW() + INTERVAL '1 month',
           updated_at = NOW()
       WHERE user_id = $3`,
      [planId, session.subscription as string, userId]
    );
  });

  logger.paymentEvent("checkout_completed", { userId, planId, sessionId: session.id });
}

async function handleSubscriptionUpdate(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string;
  const status = subscription.status;

  const user = await queryOne(
    "SELECT id FROM users WHERE stripe_customer_id = $1",
    [customerId]
  );

  if (!user) {
    logger.error("User not found for subscription update", { customerId });
    throw new NotFoundError("User");
  }

  const priceId = subscription.items.data[0]?.price.id;
  const plan = PRICING_PLANS.find((p) => p.stripePriceId === priceId);
  const planId = plan?.id || "pro";

  await query(
    `UPDATE subscriptions 
     SET status = $1, current_period_start = TO_TIMESTAMP($2), 
         current_period_end = TO_TIMESTAMP($3), updated_at = NOW()
     WHERE user_id = $4`,
    [
      status,
      subscription.current_period_start,
      subscription.current_period_end,
      user.id,
    ]
  );

  await query(
    `UPDATE users 
     SET subscription_status = $1, subscription_tier = $2, updated_at = NOW() 
     WHERE id = $3`,
    [status === "active" ? "active" : "past_due", planId, user.id]
  );

  logger.paymentEvent("subscription_updated", { userId: user.id, status, planId });
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string;

  const user = await queryOne(
    "SELECT id FROM users WHERE stripe_customer_id = $1",
    [customerId]
  );

  if (!user) {
    logger.error("User not found for subscription deletion", { customerId });
    throw new NotFoundError("User");
  }

  await query(
    `UPDATE users 
     SET subscription_status = 'canceled', subscription_tier = 'free', updated_at = NOW() 
     WHERE id = $1`,
    [user.id]
  );

  await query(
    `UPDATE subscriptions 
     SET status = 'canceled', updated_at = NOW() 
     WHERE user_id = $1`,
    [user.id]
  );

  logger.paymentEvent("subscription_canceled", { userId: user.id });
}

async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
  const customerId = invoice.customer as string;

  const user = await queryOne(
    "SELECT id FROM users WHERE stripe_customer_id = $1",
    [customerId]
  );

  if (!user) {
    logger.error("User not found for invoice payment", { customerId });
    return;
  }

  const subscription = await queryOne(
    "SELECT id FROM subscriptions WHERE user_id = $1",
    [user.id]
  );

  if (!subscription) {
    return;
  }

  await query(
    `INSERT INTO payments (user_id, subscription_id, amount, currency, status, stripe_payment_intent_id)
     VALUES ($1, $2, $3, $4, 'completed', $5)`,
    [
      user.id,
      subscription.id,
      (invoice.amount_paid || 0) / 100,
      invoice.currency || "usd",
      invoice.payment_intent as string,
    ]
  );

  logger.paymentEvent("payment_completed", { userId: user.id, amount: invoice.amount_paid });
}

async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  const customerId = invoice.customer as string;

  const user = await queryOne(
    "SELECT id FROM users WHERE stripe_customer_id = $1",
    [customerId]
  );

  if (!user) {
    logger.error("User not found for failed invoice", { customerId });
    return;
  }

  const subscription = await queryOne(
    "SELECT id FROM subscriptions WHERE user_id = $1",
    [user.id]
  );

  if (!subscription) {
    return;
  }

  await query(
    `INSERT INTO payments (user_id, subscription_id, amount, currency, status, stripe_payment_intent_id)
     VALUES ($1, $2, $3, $4, 'failed', $5)`,
    [
      user.id,
      subscription.id,
      (invoice.amount_due || 0) / 100,
      invoice.currency || "usd",
      invoice.payment_intent as string,
    ]
  );

  logger.paymentEvent("payment_failed", { userId: user.id });
}
