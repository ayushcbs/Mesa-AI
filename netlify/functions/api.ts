import serverless from "serverless-http";
import { createServerlessApp } from "../../server/apiRouter.ts";

// Initialize serverless Express instance
const app = createServerlessApp();

// Export AWS Lambda / Netlify serverless handler
export const handler = serverless(app);
