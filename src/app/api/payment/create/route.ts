import { NextRequest, NextResponse } from "next/server";
import { createPaymentSchema } from "@/lib/utils/validation";
import {
  createSuccessResponse,
  createErrorResponse,
  ValidationError,
  NotFoundError,
  PaymentError,
} from "@/lib/utils/error-handler";
import { requireAuth } from "@/lib/middleware/auth";
import { query, queryOne } from "@/lib/config/database";
import { logger } from "@/lib/utils/logger";
import { PRICING_PLANS } from "@/lib/config/constants";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2023-10-16" as any,
});

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();

    const body = await request.json();

    const validation = createPaymentSchema.safeParse(body);
    if (!validation.success) {
      throw new ValidationError(
        validation.error.errors.map((e) => e.message).join(", ")
      );
    }

    const { planId } = validation.data;

    const plan = PRICING_PLANS.find((p) => p.id === planId);

    if (!plan) {
      throw new NotFoundError("Pricing plan");
    }

    if (planId === "free") {
      await query(
        `UPDATE users 
         SET subscription_tier = 'free', updated_at = NOW() 
         WHERE id = $1`,
        [user.id]
      );

      await query(
        `UPDATE subscriptions 
         SET tier = 'free', status = 'active', 
             current_period_end = NOW() + INTERVAL '30 days'
         WHERE user_id = $1`,
        [user.id]
      );

      logger.paymentEvent("subscription_updated", { userId: user.id, planId: "free" });

      return NextResponse.json(
        createSuccessResponse({
          message: "Successfully downgraded to free plan",
          plan: "free",
        })
      );
    }

    if (!plan.stripePriceId) {
      throw new PaymentError("Stripe price ID not configured for this plan");
    }

    let stripeCustomerId = user.stripeCustomerId;

    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.name,
        metadata: {
          userId: user.id,
        },
      });

      stripeCustomerId = customer.id;

      await query(
        "UPDATE users SET stripe_customer_id = $1 WHERE id = $2",
        [stripeCustomerId, user.id]
      );
    }

    const checkoutSession = await stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [
        {
          price: plan.stripePriceId,
          quantity: 1,
        },
      ],
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/billing?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/billing?canceled=true`,
      metadata: {
        userId: user.id,
        planId: planId,
      },
    });

    logger.paymentEvent("checkout_created", {
      userId: user.id,
      planId,
      sessionId: checkoutSession.id,
    });

    return NextResponse.json(
      createSuccessResponse({
        checkoutUrl: checkoutSession.url,
        sessionId: checkoutSession.id,
      })
    );
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

    logger.error("Payment creation error", {
      error: error instanceof Error ? error.message : "Unknown error",
    });

    return {
      code: "PAYMENT_ERROR",
      message: "Failed to create payment session",
      statusCode: 500,
    };
  }
}
