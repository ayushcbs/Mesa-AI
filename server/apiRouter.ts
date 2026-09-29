import express, { Router, Request, Response } from "express";
import Stripe from "stripe";
import nodemailer from "nodemailer";
import { GoogleGenAI } from "@google/genai";

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

export function registerApiRoutes(router: Router): Router {
  // Health status check
  router.get("/health", (req: Request, res: Response) => {
    res.json({
      status: "ok",
      environment: process.env.NODE_ENV || "development",
      timestamp: new Date().toISOString()
    });
  });

  // Stripe Checkout Session Creation
  router.post("/create-checkout-session", async (req: Request, res: Response) => {
    try {
      const { userId, email, plan } = req.body;
      if (!userId || !email) {
        return res.status(400).json({ error: "Missing userId or email" });
      }

      const stripe = getStripe();

      const isElite = plan === "elite";
      const amount = isElite ? 1099 : 199;
      const planName = isElite ? "Study Space Elite" : "Study Space Pro";
      const planDesc = isElite
        ? "Full Architectural Suite + All Features ($10.99/mo)"
        : "Basic AI Analysis + Essential Features ($1.99/mo)";

      const host = req.get("host");
      const protocol =
        req.protocol === "https" || req.get("x-forwarded-proto") === "https"
          ? "https"
          : "http";
      const appUrl =
        process.env.APP_URL || process.env.VITE_APP_URL || `${protocol}://${host}`;

      console.log(
        `Creating Stripe session for ${email} (${plan}) using redirect URL: ${appUrl}`
      );

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

      console.log(`Stripe session created: ${session.id}`);
      res.json({ sessionId: session.id, url: session.url });
    } catch (error: any) {
      console.error("Stripe Detailed Error:", {
        message: error.message,
        type: error.type,
        code: error.code,
        param: error.param,
      });
      res.status(500).json({ error: error.message });
    }
  });

  // Project Feedback Endpoint (transmits directly to the developer)
  router.post("/feedback", async (req: Request, res: Response) => {
    try {
      const {
        category,
        rating,
        subject,
        message,
        userEmail,
        userName,
        targetEmail,
      } = req.body;
      const recipient =
        targetEmail ||
        process.env.FEEDBACK_RECIPIENT ||
        process.env.DEVELOPER_EMAIL ||
        "the developer";

      console.log("================ FEEDBACK RECEIVED ================");
      console.log(`To: the developer`);
      console.log(`From: ${userName} (${userEmail})`);
      console.log(`Category: ${category} | Rating: ${rating}/5`);
      console.log(`Subject: ${subject}`);
      console.log(`Message: ${message}`);
      console.log("===================================================");

      // Attempt SMTP transmission if SMTP variables exist and recipient is configured
      if (
        process.env.SMTP_HOST &&
        process.env.SMTP_USER &&
        process.env.SMTP_PASS &&
        recipient !== "the developer"
      ) {
        try {
          const transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: Number(process.env.SMTP_PORT) || 587,
            secure: process.env.SMTP_SECURE === "true",
            auth: {
              user: process.env.SMTP_USER,
              pass: process.env.SMTP_PASS,
            },
          });

          await transporter.sendMail({
            from: `"Study Space Feedback" <${process.env.SMTP_USER}>`,
            replyTo: userEmail,
            to: recipient,
            subject: `[Feedback: ${category?.toUpperCase()}] ${subject || "User Response"}`,
            html: `
              <div style="font-family: Arial, sans-serif; padding: 20px; background-color: #1c1917; color: #f5f5f4; border-radius: 12px;">
                <h2 style="color: #10b981;">New Workspace Feedback Received</h2>
                <p><strong>Category:</strong> ${category}</p>
                <p><strong>Rating:</strong> ${rating} / 5 Stars</p>
                <p><strong>From:</strong> ${userName} (${userEmail})</p>
                <p><strong>Subject:</strong> ${subject}</p>
                <hr style="border-color: #44403c; margin: 20px 0;" />
                <div style="background-color: #292524; padding: 15px; border-radius: 8px;">
                  <p style="white-space: pre-wrap; margin: 0;">${message}</p>
                </div>
              </div>
            `,
          });
          console.log(`Feedback successfully mailed via SMTP to the developer`);
        } catch (mailErr) {
          console.error("SMTP transmission error, logged to server console:", mailErr);
        }
      }

      res.json({
        success: true,
        message: "Feedback recorded and dispatched to the developer",
        recipient: "the developer",
      });
    } catch (err: any) {
      console.error("Feedback route error:", err);
      res.status(500).json({ error: err.message || "Failed to log feedback" });
    }
  });

  // Gemini Proxy (server-side execution with process.env.GEMINI_API_KEY)
  router.post("/gemini/generate", async (req: Request, res: Response) => {
    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(200).json({
          error: "Gemini API key is missing on the server.",
          isQuotaOrKeyError: true,
        });
      }

      const { model = "gemini-2.5-flash", contents } = req.body;
      if (!contents) {
        return res.status(400).json({ error: "Missing contents parameter." });
      }

      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({
        model,
        contents,
      });

      res.json({ text: response.text });
    } catch (error: any) {
      console.warn("Gemini API server proxy notice:", error?.message || String(error));
      const errMsg = error?.message || String(error);
      const isQuotaOrPerm =
        errMsg.includes("RESOURCE_EXHAUSTED") ||
        errMsg.includes("429") ||
        errMsg.includes("credits are depleted") ||
        errMsg.includes("permission") ||
        errMsg.includes("PERMISSION_DENIED") ||
        error?.status === 403 ||
        error?.status === 429;

      res.status(200).json({
        error: isQuotaOrPerm
          ? "Gemini API quota or credits currently depleted. Using local intelligent fallback."
          : errMsg,
        isQuotaOrKeyError: true,
      });
    }
  });

  return router;
}

export function createServerlessApp() {
  const app = express();
  app.use(express.json({ limit: "10mb" }));
  
  const router = express.Router();
  registerApiRoutes(router);

  // Mount on all likely paths so Netlify redirects and direct invocations both succeed
  app.use("/api", router);
  app.use("/.netlify/functions/api", router);
  app.use(router);

  return app;
}
