// Allow requests from your frontend development server and production site
// Adjust the origin based on your actual SITE_URL environment variable
const allowedOrigins = [
  'http://localhost:5173', // Default Vite dev server port
  Deno.env.get('SITE_URL') || 'http://localhost:3000' // Fallback if SITE_URL is not set
];

export const corsHeaders = (origin: string | null) => {
  // If the request origin is in our list, allow it. Otherwise, deny.
  const allowOrigin = origin && allowedOrigins.includes(origin) ? origin : allowedOrigins[0]; // Fallback or deny?

  return {
    'Access-Control-Allow-Origin': allowOrigin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS', // Allow POST and OPTIONS
  };
};
