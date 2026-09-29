import nodemailer from "nodemailer";

interface NetlifyEvent {
  httpMethod: string;
  body: string | null;
  headers: Record<string, string>;
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
    const { category, rating, subject, message, userEmail, userName, targetEmail } = payload;
    const recipient = targetEmail || process.env.FEEDBACK_RECIPIENT || process.env.DEVELOPER_EMAIL || "the developer";

    console.log("================ FEEDBACK RECEIVED (NETLIFY SERVERLESS) ================");
    console.log(`To: the developer`);
    console.log(`From: ${userName} (${userEmail})`);
    console.log(`Category: ${category} | Rating: ${rating}/5`);
    console.log(`Subject: ${subject}`);
    console.log("=========================================================================");

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
      } catch (mailErr) {
        console.error("SMTP transmission error in Netlify function:", mailErr);
      }
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        message: "Feedback recorded and dispatched to the developer",
        recipient: "the developer",
      }),
    };
  } catch (err: any) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: err.message || "Failed to log feedback" }),
    };
  }
};
