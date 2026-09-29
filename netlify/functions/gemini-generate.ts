import { GoogleGenAI } from "@google/genai";

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
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          error: "Gemini API key is missing on the server.",
          isQuotaOrKeyError: true,
        }),
      };
    }

    const payload = event.body ? JSON.parse(event.body) : {};
    const { model = "gemini-2.5-flash", contents } = payload;
    if (!contents) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: "Missing contents parameter." }),
      };
    }

    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model,
      contents,
    });

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ text: response.text }),
    };
  } catch (error: any) {
    const errMsg = error?.message || String(error);
    const isQuotaOrPerm =
      errMsg.includes("RESOURCE_EXHAUSTED") ||
      errMsg.includes("429") ||
      errMsg.includes("credits are depleted") ||
      errMsg.includes("permission") ||
      errMsg.includes("PERMISSION_DENIED") ||
      error?.status === 403 ||
      error?.status === 429;

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        error: isQuotaOrPerm
          ? "Gemini API quota or credits currently depleted. Using local intelligent fallback."
          : errMsg,
        isQuotaOrKeyError: true,
      }),
    };
  }
};
