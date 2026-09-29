import Stripe from "stripe";

interface NetlifyEvent {
  httpMethod: string;
  body: string | null;
  headers: Record<string, string>;
}

let stripeClient: Stripe | null = null;
function getStripe(): Stripe {
  if (!stripeClient) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) {
      throw new Error("STRIPE_SECRET_KEY environment variable is required");
    }
    stripeClient = new Stripe(key);
  }
  return stripeClient;
}

export const handler = async (event: NetlifyEvent) => {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Content-Type": "application/json",
  };

  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers,
      body: "",
    };
  }

  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: "Method Not Allowed" }),
    };
  }

  try {
    const payload = event.body ? JSON.parse(event.body) : {};
    const { userId, email, plan } = payload;
    if (!userId || !email) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: "Missing userId or email" }),
      };
    }

    const stripe = getStripe();

    const isElite = plan === "elite";
    const amount = isElite ? 1099 : 199;
    const planName = isElite ? "Study Space Elite" : "Study Space Pro";
    const planDesc = isElite
      ? "Full Architectural Suite + All Features ($10.99/mo)"
      : "Basic AI Analysis + Essential Features ($1.99/mo)";

    const host = event.headers["host"] || event.headers["Host"];
    const protocol = event.headers["x-forwarded-proto"] || "https";
    const appUrl =
      process.env.APP_URL || process.env.VITE_APP_URL || `${protocol}://${host}`;

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: planName,
              description: planDesc,
            },
            unit_amount: amount,
            recurring: {
              interval: "month",
            },
          },
          quantity: 1,
        },
      ],
      mode: "subscription",
      subscription_data: {
        metadata: {
          userId: userId,
          plan: plan || "pro",
        },
      },
      customer_email: email,
      success_url: `${appUrl}?session_id={CHECKOUT_SESSION_ID}&plan=${plan || "pro"}`,
      cancel_url: `${appUrl}?upgrade=cancelled`,
      payment_method_collection: "always",
    });

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ sessionId: session.id, url: session.url }),
    };
  } catch (error: any) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message }),
    };
  }
};
